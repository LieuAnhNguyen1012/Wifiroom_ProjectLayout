// Optional enhancement: without JavaScript the existing login stays visible.
(() => {
    const root = document.querySelector('.login-experience');
    if (!root) return;
    const intro = root.querySelector('.login-intro');
    const panel = root.querySelector('.login-panel');
    const heading = document.getElementById('login-heading');
    const enter = root.querySelector('.intro-enter');
    const skip = document.querySelector('.skip-link');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const storageKey = 'wifiroom.loginIntroSeen';
    const gestures = new AbortController();
    const animations = [];
    let state = 'login';
    let timer;
    let touchStart;
    let wheelDistance = 0;
    let lastWheel = 0;
    let seen = false;
    try { seen = sessionStorage.getItem(storageKey) === '1'; } catch { /* Storage may be blocked. */ }

    function finish() {
        clearTimeout(timer);
        state = 'login';
        root.dataset.loginState = state;
        intro.hidden = true;
    }
    function reveal({ immediate = false, focus = true } = {}) {
        if (state !== 'intro') {
            if (immediate && state === 'transitioning') finish();
            return;
        }
        state = immediate ? 'login' : 'transitioning';
        gestures.abort();
        // Freeze entry at its current position; the outer room then scatters.
        animations.forEach(animation => animation.pause());
        panel.hidden = false;
        panel.inert = false;
        intro.inert = true;
        root.dataset.loginState = state;
        try { sessionStorage.setItem(storageKey, '1'); } catch { /* Nonessential. */ }
        // A heading receives focus without opening a mobile keyboard. Inputs are usable now.
        if (focus) heading.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (immediate) finish();
        else timer = setTimeout(finish, 1300);
    }
    function hasError() {
        return Boolean(root.querySelector('.login-error:not([hidden]), .field-error:not([hidden]), [aria-invalid="true"]'));
    }
    enter.addEventListener('click', () => reveal());
    skip?.addEventListener('click', event => {
        event.preventDefault();
        reveal({ immediate: reduced.matches });
        document.getElementById('login-form').focus();
    });
    reduced.addEventListener('change', event => {
        if (event.matches) reveal({ immediate: true, focus: state === 'intro' });
    });
    // Also handle a validation error rendered after initialization.
    new MutationObserver(() => {
        if (hasError()) reveal({ immediate: true });
    }).observe(panel, { subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-invalid'] });

    if (seen || reduced.matches || hasError() || location.hash === '#login-form') {
        root.dataset.loginState = 'login';
        return;
    }
    window.addEventListener('wheel', event => {
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const now = performance.now();
        if (now - lastWheel > 250 || event.deltaY < 0) wheelDistance = 0;
        lastWheel = now;
        wheelDistance += Math.max(0, event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
        if (wheelDistance >= 45) reveal();
    }, { passive: true, signal: gestures.signal });
    window.addEventListener('touchstart', event => {
        touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true, signal: gestures.signal });
    window.addEventListener('touchmove', event => {
        if (!touchStart || event.touches.length !== 1) return;
        const dx = event.touches[0].clientX - touchStart.x;
        const dy = touchStart.y - event.touches[0].clientY;
        if (dy > 50 && dy > Math.abs(dx)) reveal();
    }, { passive: true, signal: gestures.signal });
    window.addEventListener('scroll', () => {
        if (window.scrollY > 48) reveal();
    }, { passive: true, signal: gestures.signal });

    // Enable only after controls and escape paths have been installed.
    state = 'intro';
    panel.hidden = true;
    panel.inert = true;
    intro.hidden = false;
    root.dataset.loginState = state;
    if (typeof Element.prototype.animate === 'function') {
        root.querySelectorAll('.room-orbit').forEach((room, index) => {
            const direction = index % 2 ? 1 : -1;
            animations.push(room.animate([
                { transform: `translate(${direction * 65}px, 30px)`, opacity: 0 },
                { transform: `translate(${direction * 18}px, -12px)`, opacity: 1, offset: 0.65 },
                { transform: 'translate(0, 0)', opacity: 1 }
            ], { duration: 2300, delay: index * 120, easing: 'ease-out', fill: 'both' }));
        });
    }
})();
