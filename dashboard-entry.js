// Run in the head before the first paint; consume the short-lived flag once.
(() => {
    const key = 'wifiroom.dashboardEntry';
    let timestamp;
    try {
        timestamp = Number(sessionStorage.getItem(key));
        sessionStorage.removeItem(key);
    } catch { return; }
    const age = Date.now() - timestamp;
    if (!timestamp || age < 0 || age > 15000 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('dashboard-arriving');
    document.addEventListener('DOMContentLoaded', () => {
        const cards = document.querySelectorAll('#main-app .kpi-card, #main-app .area-card, #main-app .tag-card, #main-app .alert-card');
        let index = 0;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top >= innerHeight || rect.bottom <= 0 || card.closest('[hidden]')) return;
            card.style.setProperty('--dashboard-delay', `${Math.min(index++, 4) * 0.12}s`);
            card.classList.add('dashboard-card-enter');
        });
        // Finite CSS animations are the fallback even if this cleanup never runs.
        setTimeout(() => {
            document.documentElement.classList.remove('dashboard-arriving');
            cards.forEach(card => card.classList.remove('dashboard-card-enter'));
        }, 1600);
    }, { once: true });
})();
