// js/visual-core.js

export function updateVisuals(scene) {
    const codeBox = document.getElementById('code-box');
    const viewport = document.getElementById('scroll-viewport');
    
    // 1. 清理滚动事件和旧的连接线
    if (viewport) viewport.onscroll = null;
    const svg = document.getElementById('connector-svg');
    if(svg) svg.innerHTML = '';

    if(!codeBox || !viewport) return;

    // 2. 重置所有代码行的状态（移除高亮、移除展开）
    const lines = Array.from(document.querySelectorAll('.code-line'));
    lines.forEach(l => {
        l.classList.remove('spotlight-target');
        l.classList.remove('phantom-open'); 
    });
    codeBox.classList.remove('spotlight-active');
    
    // 3. 移除所有自动聚焦/自动滚动逻辑
    // 我们不再判断 scene.type === 'code_focus'，也不自动展开注释。
    // 页面加载后静止，等待用户手动点击 ✨。

    // 4. 重新绑定点击交互事件
    setupPhantomInteractions();
}

function setupPhantomInteractions() {
    // 重新获取当前页面的所有触发器
    const triggers = document.querySelectorAll('.has-phantom-trigger');
    
    triggers.forEach(trigger => {
        // 使用 cloneNode(true) 是一种简单暴力的防止重复绑定事件的方法
        // 或者因为 fullRenderCode 是 innerHTML 重写，直接绑定即可，旧的 DOM 已经被销毁
        
        trigger.addEventListener('click', (e) => {
            // 阻止冒泡，防止触发其他潜在的点击事件
            e.stopPropagation();
            togglePhantom(trigger);
        });
    });
}

function togglePhantom(triggerEl, forceOpen = false) {
    const phantomId = triggerEl.getAttribute('data-target-phantom');
    const phantomRow = document.getElementById(phantomId);
    
    if (!phantomRow) return;

    const isCurrentlyOpen = triggerEl.classList.contains('phantom-open');
    
    // 如果 forceOpen 为真，或者当前未打开 -> 执行打开
    if (forceOpen || !isCurrentlyOpen) {
        triggerEl.classList.add('phantom-open');
        phantomRow.classList.add('active');
    } else {
        // 关闭
        triggerEl.classList.remove('phantom-open');
        phantomRow.classList.remove('active');
    }
}

export function recalcLine() {
    // No-op
}