// Shared, synchronous head bootstrap: apply the palette before body rendering.
(() => {
    const root = document.documentElement;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const key = 'wifiroom.theme';
    const valid = value => ['light', 'dark', 'system'].includes(value);
    let preference = 'system';
    let transitionTimer;
    try {
        const stored = localStorage.getItem(key);
        if (valid(stored)) preference = stored;
    } catch { /* A blocked store must not block the selector. */ }

    function apply(animate = false) {
        const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
        if (animate && !reduced.matches) {
            clearTimeout(transitionTimer);
            root.classList.add('theme-changing');
            transitionTimer = setTimeout(() => root.classList.remove('theme-changing'), 450);
        }
        root.dataset.theme = theme;
        root.dataset.themePreference = preference;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = getComputedStyle(root).getPropertyValue('--background').trim();
        // Future canvas renderers can listen here and read the --chart-* tokens.
        window.dispatchEvent(new CustomEvent('wifiroom:themechange', { detail: { theme, preference } }));
    }
    apply();
    media.addEventListener('change', () => {
        if (preference === 'system') apply(true);
    });
    reduced.addEventListener('change', () => {
        if (reduced.matches) root.classList.remove('theme-changing');
    });
    document.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('theme-mode');
        if (!select) return;
        function syncControl() {
            select.value = preference;
            // Also update the shared custom dropdown initialized by main.js.
            select.dispatchEvent(new Event('input', { bubbles: true }));
        }
        syncControl();
        select.closest('.theme-control').hidden = false;
        select.addEventListener('change', () => {
            if (!valid(select.value)) return;
            preference = select.value;
            try { localStorage.setItem(key, preference); } catch { /* Keep in-memory choice. */ }
            apply(true);
        });
        window.addEventListener('storage', event => {
            if (event.key !== key && event.key !== null) return;
            preference = valid(event.newValue) ? event.newValue : 'system';
            apply(true);
            syncControl();
        });
        window.addEventListener('pageshow', event => {
            if (!event.persisted) return;
            try {
                const stored = localStorage.getItem(key);
                preference = valid(stored) ? stored : 'system';
            } catch { /* Keep the current choice when storage is blocked. */ }
            apply();
            syncControl();
        });
    }, { once: true });
})();

// Workspace page-entry marker: consume before the first body paint.
(() => {
    const key = 'wifiroom.workspaceEntry';
    let entry;
    try {
        entry = JSON.parse(sessionStorage.getItem(key));
        sessionStorage.removeItem(key);
    } catch { return; }
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!entry || navigation?.type === 'back_forward' || Date.now() - entry.time < 0 ||
        Date.now() - entry.time > 15000 || entry.url !== location.href ||
        matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('workspace-arriving');
    document.addEventListener('DOMContentLoaded', () => {
        const main = document.querySelector('.workspace-page main');
        if (!main) { document.documentElement.classList.remove('workspace-arriving'); return; }
        let index = 0;
        const cards = main.querySelectorAll('.kpi-card, .area-card, .tag-card, .alert-card, .metric-grid > article');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top >= innerHeight || rect.bottom <= 0 || card.closest('[hidden]')) return;
            card.style.setProperty('--workspace-card-delay', `${Math.min(index++, 4) * 0.1}s`);
            card.classList.add('workspace-card-enter');
        });
        setTimeout(() => {
            document.documentElement.classList.remove('workspace-arriving');
            cards.forEach(card => card.classList.remove('workspace-card-enter'));
        }, 1500);
    }, { once: true });
})();
