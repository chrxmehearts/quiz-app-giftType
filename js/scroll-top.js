'use strict';

/*
 * Self-contained "scroll to top" FAB — injects its own markup and styles so
 * it can be dropped into any page with a single <script> tag. Kept isolated
 * from app.js since it has no dependency on quiz state.
 */
(function () {
  const SHOW_AFTER_PX = 320;

  const style = document.createElement('style');
  style.textContent = `
    #btn-scroll-top {
      position: fixed;
      right: 20px;
      bottom: calc(20px + env(safe-area-inset-bottom, 0px));
      width: 46px;
      height: 46px;
      border: none;
      border-radius: 50%;
      background: var(--primary, #4f6ef7);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(16px) scale(.9);
      transition: opacity .25s ease, transform .25s ease, background .15s ease, visibility 0s linear .25s;
      z-index: 1000;
    }
    #btn-scroll-top.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      transition: opacity .25s ease, transform .25s ease, background .15s ease;
    }
    #btn-scroll-top:hover { background: var(--primary-hover, #3a58e8); }
    #btn-scroll-top:active { transform: scale(.92); }
    #btn-scroll-top:focus-visible { outline: 2px solid var(--primary, #4f6ef7); outline-offset: 3px; }
    #btn-scroll-top svg { width: 20px; height: 20px; pointer-events: none; }

    @media (prefers-reduced-motion: reduce) {
      #btn-scroll-top { transition: opacity .01ms linear, visibility .01ms linear; }
      #btn-scroll-top.visible { transition: opacity .01ms linear; }
    }

    @media (max-width: 600px) {
      #btn-scroll-top { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); width: 42px; height: 42px; }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'btn-scroll-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.title = 'Scroll to top';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  let ticking = false;
  function updateVisibility() {
    btn.classList.toggle('visible', window.scrollY > SHOW_AFTER_PX);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateVisibility);
      ticking = true;
    }
  }, { passive: true });

  const SCROLL_DURATION_MS = 400;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function scrollToTop() {
    const start = window.scrollY;
    if (start === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      window.scrollTo(0, 0);
      return;
    }

    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / SCROLL_DURATION_MS, 1);
      window.scrollTo(0, start * (1 - easeOutCubic(progress)));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  btn.addEventListener('click', scrollToTop);

  updateVisibility();
})();
