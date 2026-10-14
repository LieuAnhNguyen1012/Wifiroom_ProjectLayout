(() => {
    const form = document.getElementById('login-form');
    const link = document.getElementById('login-btn');
    if (!form || !link) return;
    const root = document.querySelector('.login-experience');
    const panel = document.getElementById('login-panel');
    const pending = document.getElementById('login-submitting');
    const error = document.getElementById('login-error');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const destination = link.href;
    const key = 'wifiroom.dashboardEntry';
    const button = document.createElement('button');
    button.type = 'submit';
    button.id = link.id;
    button.className = link.className;
    button.innerHTML = link.innerHTML;
    let busy = false;
    let navigating = false;
    let leaveTimer;
    let recoveryTimer;

    function clearFlag() {
        try { sessionStorage.removeItem(key); } catch { /* Optional animation. */ }
    }
    function restore(message) {
        clearTimeout(leaveTimer);
        clearTimeout(recoveryTimer);
        panel.removeEventListener('animationend', onExitEnd);
        root.classList.remove('login-leaving');
        busy = false;
        navigating = false;
        button.hidden = false;
        button.disabled = false;
        pending.hidden = true;
        form.removeAttribute('aria-busy');
        clearFlag();
        if (message) {
            error.textContent = message;
            error.hidden = false;
            button.focus({ preventScroll: true });
        }
    }
    function navigate() {
        if (navigating || !busy) return;
        navigating = true;
        clearTimeout(leaveTimer);
        panel.removeEventListener('animationend', onExitEnd);
        try { sessionStorage.setItem(key, String(Date.now())); } catch { /* Navigate normally. */ }
        // The old page must recover if navigation never commits.
        recoveryTimer = setTimeout(() => restore('Dashboard could not be opened. Please try again.'), 5000);
        try { location.assign(destination); }
        catch { restore('Dashboard could not be opened. Please try again.'); }
    }
    function onExitEnd(event) {
        if (event.target === panel && event.animationName === 'login-exit') navigate();
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        busy = true;
        error.hidden = true;
        button.disabled = true;
        button.hidden = true;
        pending.hidden = false;
        form.setAttribute('aria-busy', 'true');

        // Demo adapter only: replace with the real authentication response when integrated.
        const accounts = [...document.querySelectorAll('.demo-users code')].map(node => node.textContent.trim());
        const username = form.elements.namedItem('username').value.trim();
        const password = form.elements.namedItem('password').value;
        if (!accounts.includes(username) || password !== '123456') {
            restore('Invalid username or password. Use one of the demo accounts below.');
            return;
        }
        try {
            // No artificial delay or data loading skeleton for an already-rendered dashboard.
            // Local file previews cannot use fetch; HTTP previews can detect a missing page.
            if (location.protocol === 'http:' || location.protocol === 'https:') {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                try {
                    const response = await fetch(destination, { signal: controller.signal, cache: 'no-cache' });
                    if (!response.ok) throw new Error('Dashboard unavailable');
                } finally { clearTimeout(timeout); }
            }
            if (reduced.matches) { navigate(); return; }
            panel.addEventListener('animationend', onExitEnd);
            root.classList.add('login-leaving');
            leaveTimer = setTimeout(navigate, 650);
        } catch {
            restore('Dashboard could not be loaded. Please try again.');
        }
    });
    // Keep the original link as the no-JavaScript fallback.
    link.replaceWith(button);
    window.addEventListener('pageshow', event => {
        if (event.persisted) restore();
    });
    reduced.addEventListener('change', event => {
        if (event.matches && root.classList.contains('login-leaving')) navigate();
    });
})();
