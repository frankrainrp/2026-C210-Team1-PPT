// js/utils.js

export function highlightPython(code, state = { inQuote: false, quoteType: null }) {
    // 0. HTML 实体转义
    let s = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // =================================================================
    // Phase A: 处理跨行字符串状态 (State Machine)
    // [保持上一轮修复的逻辑不变]
    // =================================================================
    if (state.inQuote) {
        const closeIdx = s.indexOf(state.quoteType);
        if (closeIdx === -1) {
            return `<span class="vs-string">${s}</span>`;
        } else {
            const quoteLen = state.quoteType.length;
            const strPart = s.substring(0, closeIdx + quoteLen);
            const remainingPart = s.substring(closeIdx + quoteLen);
            state.inQuote = false;
            state.quoteType = null;
            return `<span class="vs-string">${strPart}</span>` + highlightPython(remainingPart, state);
        }
    }

    const triples = [...s.matchAll(/("""|''')/g)];
    if (triples.length > 0 && triples.length % 2 !== 0) {
        const lastMatch = triples[triples.length - 1];
        state.inQuote = true;
        state.quoteType = lastMatch[0];
        const idx = lastMatch.index;
        const before = s.substring(0, idx);
        const after = s.substring(idx);
        return highlightPython(before, { inQuote: false }) + `<span class="vs-string">${after}</span>`;
    }

    // =================================================================
    // Phase B: 单行语法高亮
    // =================================================================
    
    const strings = []; 
    const comments = [];
    const fStrings = []; // [NEW] 专门存储 F-String 的占位符数组
    
    // -----------------------------------------------------------------
    // [NEW] 1.0 特殊处理 f-strings (f"..." 或 f'...')
    // 必须在普通字符串处理之前运行，防止被误判
    // -----------------------------------------------------------------
    s = s.replace(/\bf(["'])(.*?)\1/g, (match, quoteChar, innerContent) => {
        // 1. 构建头部: f (深蓝/关键字色) + 引号 (字符串色)
        // 注意: vs-keyword 对应 var(--c-blue) 即深蓝色
        let html = `<span class="vs-keyword">f</span><span class="vs-string">${quoteChar}</span>`;

        // 2. 解析内部的 {variable}
        const regex = /\{(.*?)\}/g;
        let lastIdx = 0;
        let m;

        while ((m = regex.exec(innerContent)) !== null) {
            // A. 花括号前的普通文本 -> 保持字符串色 (橙色)
            const textPart = innerContent.substring(lastIdx, m.index);
            if (textPart) {
                html += `<span class="vs-string">${textPart}</span>`;
            }

            // B. 花括号结构
            // { -> 紫色 (Control)
            // 内容 -> 浅蓝色 (Variable/Text)
            // } -> 紫色 (Control)
            // 这里使用了行内 style 强制覆盖颜色，确保精准符合你的要求
            html += `<span class="vs-control" style="color:var(--c-purple)">{</span>`;
            html += `<span style="color:var(--c-var)">${m[1]}</span>`; 
            html += `<span class="vs-control" style="color:var(--c-purple)">}</span>`;

            lastIdx = regex.lastIndex;
        }

        // C. 剩余的尾部文本
        const tail = innerContent.substring(lastIdx);
        if (tail) {
            html += `<span class="vs-string">${tail}</span>`;
        }

        // 3. 闭合引号
        html += `<span class="vs-string">${quoteChar}</span>`;

        // 存入专用数组，并返回占位符
        fStrings.push(html);
        return `__FSTR${fStrings.length - 1}__`;
    });

    // -----------------------------------------------------------------
    // 1.1 多行字符串 (单行内闭合的)
    s = s.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, (m) => { 
        strings.push(m); 
        return `__STR${strings.length-1}__`; 
    });

    // 1.2 单行注释
    s = s.replace(/(#.*)$/gm, (m) => { 
        comments.push(m); 
        return `__COM${comments.length-1}__`; 
    });

    // 1.3 普通字符串 (处理剩下的非 f-string)
    s = s.replace(/(".*?"|'.*?')/g, (m) => { 
        strings.push(m); 
        return `__STR${strings.length-1}__`; 
    });

    // -----------------------------------------------------------------
    // 2. 关键词与语法着色
    // -----------------------------------------------------------------
    
    // Keyword
    s = s.replace(/\b(def|class|lambda|None|True|False|self)\b/g, '<span class="vs-keyword">$1</span>');
    // Decorator
    s = s.replace(/(@\w+)/g, '<span class="vs-func">$1</span>');
    // Control Flow
    s = s.replace(/\b(return|if|elif|else|while|for|in|try|except|finally|continue|break|and|or|not|is|from|import|as|with|pass|raise|assert|yield|global|nonlocal)\b/g, '<span class="vs-control">$1</span>');
    // Function calls
    s = s.replace(/(\b[a-zA-Z_]\w*)(?=\()/g, '<span class="vs-func">$1</span>');
    // Classes/Types
    s = s.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, (match) => {
        return `<span class="vs-class">${match}</span>`;
    });
    // Numbers
    s = s.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="vs-num">$1</span>');
    // Brackets
    s = s.replace(/([(){}\[\]])/g, '<span class="vs-bracket">$1</span>');

    // -----------------------------------------------------------------
    // 3. 还原占位符 (顺序很重要)
    // -----------------------------------------------------------------
    
    // 还原普通字符串
    s = s.replace(/__STR(\d+)__/g, (m, i) => `<span class="vs-string">${strings[i]}</span>`);
    
    // 还原注释
    s = s.replace(/__COM(\d+)__/g, (m, i) => `<span class="vs-comment">${comments[i]}</span>`);
    
    // [NEW] 还原 F-String (这里直接还原 HTML，不需要包裹 span)
    s = s.replace(/__FSTR(\d+)__/g, (m, i) => fStrings[i]);
    
    return s;
}