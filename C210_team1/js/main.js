import { buildScenes, renderIntro, fullRenderCode } from './render-engine.js';
import { updateVisuals, recalcLine } from './visual-core.js';

let SCENES = [];
let currentSceneIdx = -1;
let sourceData = null; 

const container = document.getElementById('focus-container');

async function init() {
    try {
        const res = await fetch('data.json');
        sourceData = await res.json();
        
        // 构建场景
        SCENES = buildScenes(sourceData);
        
        // 默认进入第一个代码场景 (跳过 Intro 方便调试，如果需要Intro改成 0)
        // 假设 Intro 是第0个，代码是第1个
        currentSceneIdx = 0; 
        
        renderCurrentScene();
        
        // 渐显动画
        setTimeout(() => container.style.opacity = '1', 100);
        
        setupGlobalEvents();
        
    } catch(e) { 
        console.error("Critical Init Error:", e);
        // 如果出错，在屏幕上显示，防止白屏不知道原因
        document.body.innerHTML += `<div style="color:red; z-index:9999; position:fixed; top:10px;">Error: ${e.message}</div>`;
    }
}

function renderCurrentScene() {
    if(currentSceneIdx < 0 || currentSceneIdx >= SCENES.length) return;
    
    const scene = SCENES[currentSceneIdx];
    
    // 切换逻辑
    transitionTo(() => {
        if (scene.type === 'intro') {
            container.className = 'focus-card intro-layout'; 
            renderIntro(container, scene.content);
        } else {
            // 代码浏览模式
            container.className = 'focus-card';
            fullRenderCode(container, scene);
            // 绑定点击事件
            updateVisuals(scene);
        }
    });
}

function transitionTo(callback) {
    container.style.opacity = '0';
    setTimeout(() => {
        callback();
        requestAnimationFrame(() => container.style.opacity = '1');
    }, 250);
}

function setupGlobalEvents() {
    // 简单的左右键盘切换场景
    document.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowRight') navigate(1);
        if(e.key === 'ArrowLeft') navigate(-1);
    });
    
    window.addEventListener('resize', recalcLine);
}

function navigate(dir) {
    const nextIdx = currentSceneIdx + dir;
    if (nextIdx >= 0 && nextIdx < SCENES.length) {
        currentSceneIdx = nextIdx;
        renderCurrentScene();
    }
}

// 启动
init();