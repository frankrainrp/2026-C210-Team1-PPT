// js/render-engine.js
import { highlightPython } from './utils.js';

export function buildScenes(data) {
    const scenes = [];
    if (data.intro) data.intro.forEach(item => scenes.push({ type: 'intro', content: item }));
    
    if (data.units) {
        data.units.forEach(unit => {
            // 只保留 Overview (文件整体)
            scenes.push({ 
                type: 'code_overview', 
                unitId: unit.id, 
                title: unit.title, 
                code: unit.code,
                steps: unit.steps || [] // 保留 steps 数据以便生成 ✨ 图标
            });
        });
    }
    return scenes;
}

export function renderIntro(container, content, isEditMode = false) {
    const edit = isEditMode ? 'contenteditable="true"' : '';
    let inner = '';
    
    if(content.type === 'cover') {
        inner = `
            <div class="cover-sub" ${edit} data-key="subtitle">${content.subtitle}</div>
            <div class="cover-big-text" ${edit} data-key="big_text">${content.big_text}</div>
            <div class="cover-sub" ${edit} data-key="title" style="margin-top:20px">${content.title}</div>`;
    } else if (content.type === 'team') {
        const members = content.members.map((m, i) => `
            <div class="feature-box" style="align-items:flex-start;">
                <div ${edit} data-key="member" data-idx="${i}" style="color:var(--c-teal); font-family:'JetBrains Mono'">${m}</div>
            </div>`).join('');
        inner = `<h2 ${edit} data-key="title" style="font-size:3rem;font-weight:bold;margin-bottom:30px;">${content.title}</h2><div class="feature-grid">${members}</div>`;
    } else if (content.type === 'features') {
        const items = content.items.map((it, i) => `
            <div class="feature-box">
                <div style="font-size:2rem;margin-bottom:10px">${it.icon}</div>
                <div ${edit} data-key="feature-title" data-idx="${i}" style="font-size:1.2rem;font-weight:bold;color:#fff">${it.title}</div>
                <div ${edit} data-key="feature-desc" data-idx="${i}" style="color:#ccc;font-size:0.9rem">${it.desc}</div>
            </div>`).join('');
        inner = `<h2 ${edit} data-key="title" style="font-size:3rem;font-weight:bold;margin-bottom:30px">${content.title}</h2><div class="feature-grid">${items}</div>`;
    }
    container.innerHTML = `<div class="intro-wrapper">${inner}</div>`;
}

export function fullRenderCode(container, scene, isEditMode = false) {
    const edit = isEditMode ? 'contenteditable="true"' : '';
    const modeClass = isEditMode ? 'edit-mode-active' : '';

    const cleanCode = scene.code.replace(/\r/g, '');
    const lines = cleanCode.split('\n');

    // 预处理 annotationMap
    const annotationMap = {};
    if (scene.steps) {
        scene.steps.forEach(step => {
            if (step.add) {
                step.add.forEach(item => {
                    annotationMap[item.anchor] = item;
                });
            }
        });
    }
    if (scene.currentStepDetail && scene.activeAnchor) {
        annotationMap[scene.activeAnchor] = scene.currentStepDetail;
    }

    // --- 核心修复：单次 .map() 生成 HTML ---
let parserState = { inQuote: false, quoteType: null };

    // --- 核心修复：单次 .map() 生成 HTML ---
    const codeHtml = lines.map((line, index) => {
        const content = line.length === 0 ? ' ' : line;
        
        // [Change]: 将状态对象 pass 给高亮函数
        const highlighted = highlightPython(content, parserState);
        
        const safeText = content.replace(/"/g, '&quot;');

        let phantomHtml = '';
        let triggerClass = '';
        let triggerIcon = '';
        let wrapperClass = 'code-line-wrapper';

        // ... (后续 phantom 逻辑保持不变)
        // 查找匹配的 anchor ...
        const matchedAnchor = Object.keys(annotationMap).find(anchor => content.includes(anchor));
        
        if (matchedAnchor) {
            // ... (Phantom生成代码保持不变) ...
            const data = annotationMap[matchedAnchor];
            triggerClass = 'has-phantom-trigger';
            triggerIcon = `<span class="ai-trigger-icon">✨</span>`;
            phantomHtml = `
                <div class="phantom-row" id="phantom-${index}">
                    <div class="phantom-content">
                        <div class="phantom-title">${data.title}</div>
                        <div class="phantom-body">${data.content}</div>
                    </div>
                </div>`;
        }

        // [注意]: 确保这里使用的是新的 highlighted 变量
        return `<div class="${wrapperClass}"><div class="code-line ${triggerClass}" data-text="${safeText}" data-target-phantom="phantom-${index}">${triggerIcon}${highlighted}</div>${phantomHtml}</div>`;
    }).join('');

    container.innerHTML = `
        <div class="card-header">
            <div ${edit} data-key="unit-title" style="font-family:'JetBrains Mono'; color:#888; font-size:0.9rem">${scene.title}</div>
        </div>
        <div class="code-wrapper ${modeClass}" id="scroll-viewport">
            <textarea class="code-editor-textarea" data-key="source-code" spellcheck="false">${scene.code}</textarea>
            <div class="code-container" id="code-box">${codeHtml}</div>
        </div>`;
}