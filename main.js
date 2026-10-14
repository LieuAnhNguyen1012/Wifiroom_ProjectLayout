// Chỉ khởi tạo các thành phần thực sự có trên trang hiện tại.
const password = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');

if (password && passwordToggle) {
    passwordToggle.addEventListener('click', () => {
        const show = password.type === 'password';
        password.type = show ? 'text' : 'password';
        passwordToggle.textContent = show ? 'Hide password' : 'Show password';
        passwordToggle.setAttribute('aria-pressed', String(show));
    });
}

// Chỉ mô phỏng giao diện: không gửi form hoặc lưu/xóa dữ liệu.
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
});

const dialogOpeners = new WeakMap();
function openPreviewDialog(dialog, opener) {
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    dialogOpeners.set(dialog, opener || document.activeElement);
    dialog.showModal();
}

document.querySelectorAll('[data-open-dialog]').forEach(button => {
    button.addEventListener('click', () => {
        const dialog = document.getElementById(button.dataset.openDialog);
        if (!dialog) return;
        const form = dialog.querySelector('form');
        form?.reset();
        if (form && button.dataset.editorMode === 'add') {
            form.querySelectorAll('input:not([type="checkbox"]), textarea').forEach(field => {
                field.value = '';
            });
        }
        if (form && button.dataset.previewValues) {
            const values = JSON.parse(button.dataset.previewValues);
            Object.entries(values).forEach(([name, value]) => {
                const field = form.elements.namedItem(name);
                if (!field) return;
                if (field.type === 'checkbox') field.checked = Boolean(value);
                else field.value = String(value);
            });
        }
        if (dialog && button.dataset.dialogTitle) {
            dialog.querySelector('h2').textContent = button.dataset.dialogTitle;
        }
        if (button.dataset.record) {
            const kind = button.dataset.recordKind;
            dialog.querySelector('h2').textContent = 'Delete ' + kind + '?';
            const values = dialog.querySelectorAll('dd');
            values[0].textContent = button.dataset.record;
            values[1].textContent = button.dataset.recordName;
            dialog.querySelector('.danger').textContent = 'Delete ' + kind;
        }
        if (button.dataset.surveyRecord) {
            const effects = {
                'Change current map?': 'Use this survey for room fingerprints. Its Open / Finished state is unchanged.',
                'Record calibration?': 'Record the calibration timestamp for this survey.',
                'Finish survey?': 'Finish this survey and prevent new collection runs.'
            };
            dialog.querySelector('#survey-action-description').textContent =
                button.dataset.surveyRecord + ': ' + effects[button.dataset.dialogTitle] +
                ' Static preview; no data is changed.';
            dialog.querySelector('.warning').hidden = button.dataset.dialogTitle !== 'Finish survey?';
        }
        // Admin preview: populate account details without changing sample data.
        if (button.dataset.adminUser) {
            const username = dialog.querySelector('[data-admin-username]');
            const fullName = dialog.querySelector('[data-admin-full-name]');
            if (username) username.textContent = button.dataset.adminUser;
            if (fullName) fullName.textContent = button.dataset.adminName;
        }
        openPreviewDialog(dialog, button);
    });
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
});
document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
        const opener = dialogOpeners.get(dialog);
        if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    });
});
const closingAnimations = new Map();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
function hideWithMotion(element) {
    if (!element || element.hidden || closingAnimations.has(element)) return;
    if (motionPreference.matches) { element.hidden = true; return; }
    element.inert = true;
    element.classList.add('is-closing');
    closingAnimations.set(element, setTimeout(() => {
        element.hidden = true;
        element.inert = false;
        element.classList.remove('is-closing');
        closingAnimations.delete(element);
    }, 500));
}
function showWithMotion(element) {
    clearTimeout(closingAnimations.get(element));
    closingAnimations.delete(element);
    element.classList.remove('is-closing');
    element.inert = false;
    element.hidden = false;
}
motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    closingAnimations.forEach((timer, element) => {
        clearTimeout(timer);
        element.hidden = true;
        element.inert = false;
        element.classList.remove('is-closing');
    });
    closingAnimations.clear();
});
document.querySelectorAll('[data-dismiss-feedback]').forEach(button => {
    button.addEventListener('click', () => hideWithMotion(button.closest('.toast')));
});

// Liên kết Add area mở đúng editor mẫu khi trang đích đã sẵn sàng.
function openLinkedEditor() {
    if (window.location.hash === '#area-editor') {
        const opener = document.querySelector('[data-open-dialog="area-editor"][data-editor-mode="add"]');
        if (opener) opener.click();
    }
}
window.addEventListener('hashchange', openLinkedEditor);
openLinkedEditor();

// Một menu duy nhất; fallback không JavaScript vẫn hiển thị toàn bộ liên kết.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('primary-navigation');
if (menuButton && navigation) {
    const narrowScreen = window.matchMedia('(max-width: 650px)');
    function syncMenu() {
        const expanded = !narrowScreen.matches;
        navigation.hidden = !expanded;
        menuButton.setAttribute('aria-expanded', String(expanded));
    }
    menuButton.addEventListener('click', () => {
        const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
        navigation.hidden = !expanded;
        menuButton.setAttribute('aria-expanded', String(expanded));
    });
    navigation.addEventListener('keydown', event => {
        if (event.key === 'Escape' && narrowScreen.matches) {
            navigation.hidden = true;
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.focus();
        }
    });
    narrowScreen.addEventListener('change', syncMenu);
    syncMenu();
}

// Animate numeric KPIs once when visible, keeping the final value accessible.
function initializeKpiCountUp() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    const running = new Map();
    const values = [...document.querySelectorAll('.kpi-value:not(.kpi-value-text)')]
        .map(element => {
            const original = element.textContent.trim();
            const match = original.match(/^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(%)?$/);
            if (!match) return null;
            return {
                element, original,
                target: Number((match[1] + (match[2] || '')).replaceAll(',', '')),
                decimals: match[2] ? match[2].length - 1 : 0,
                suffix: match[3] || ''
            };
        }).filter(value => value && Number.isFinite(value.target));

    function animate(value) {
        if (reducedMotion.matches) return;
        const { element, original, target, decimals, suffix } = value;
        const accessible = document.createElement('span');
        accessible.className = 'visually-hidden';
        accessible.textContent = original;
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        const formatter = new Intl.NumberFormat('en-US', {
            useGrouping: original.includes(','),
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        visual.textContent = formatter.format(0) + suffix;
        element.replaceChildren(accessible, visual);
        let start;
        function frame(timestamp) {
            start ??= timestamp;
            const progress = Math.min((timestamp - start) / 2500, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            visual.textContent = formatter.format(target * eased) + suffix;
            if (progress < 1) {
                running.set(value, requestAnimationFrame(frame));
            } else {
                element.textContent = original;
                running.delete(value);
            }
        }
        running.set(value, requestAnimationFrame(frame));
    }

    let observer;
    if ('IntersectionObserver' in window) {
        const byElement = new Map(values.map(value => [value.element, value]));
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.18 || !byElement.has(entry.target)) return;
                const value = byElement.get(entry.target);
                observer.unobserve(entry.target);
                byElement.delete(entry.target);
                animate(value);
            });
        }, { threshold: 0.18 });
        values.forEach(value => {
            const rect = value.element.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) return;
            observer.observe(value.element);
        });
    } else {
        // Keep the real numbers visible when observation is unavailable.
    }
    reducedMotion.addEventListener('change', () => {
        if (!reducedMotion.matches) return;
        observer?.disconnect();
        running.forEach((frameId, value) => {
            cancelAnimationFrame(frameId);
            value.element.textContent = value.original;
        });
        running.clear();
    });
}
initializeKpiCountUp();

function initializeScrollReveal() {
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;
    const cards = '.kpi-card, .area-card, .tag-card, .alert-card, .metric-grid > article';
    const candidates = [...document.querySelectorAll(`.workspace-page main section, .workspace-page main :is(${cards})`)]
        .filter(element => !element.closest('dialog, [hidden]') &&
            !element.querySelector(`section, ${cards}`));
    const groups = new Map();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.18) return;
            const element = entry.target;
            observer.unobserve(element);
            // No hidden waiting state: failure or fast scrolling never strands content.
            if (element.contains(document.activeElement)) return;
            element.classList.add('reveal-enter');
            element.addEventListener('animationend', () => {
                element.classList.remove('reveal-enter');
            }, { once: true });
        });
    }, { threshold: 0.18 });
    candidates.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) return;
        let kind = 'up';
        if (element.matches(cards)) {
            kind = element.matches('.tag-card') ? 'tag' : 'card';
            const group = element.parentElement.matches('li') ? element.parentElement.parentElement : element.parentElement;
            const index = groups.get(group) || 0;
            groups.set(group, index + 1);
            element.style.setProperty('--reveal-delay', `${(index % 4) * 0.18}s`);
        } else if (element.matches('.map-panel')) kind = 'left';
        else if (element.matches('.tag-panel')) kind = 'right';
        element.dataset.reveal = kind;
        observer.observe(element);
    });
    // Keyboard access must not wait for an entrance animation.
    document.addEventListener('focusin', event => {
        const element = event.target.closest?.('[data-reveal]');
        if (!element) return;
        observer.unobserve(element);
        element.classList.remove('reveal-enter');
    });
    motionPreference.addEventListener('change', () => {
        if (!motionPreference.matches) return;
        observer.disconnect();
        candidates.forEach(element => element.classList.remove('reveal-enter'));
    });
}
initializeScrollReveal();

// Progressive enhancement: the native select remains the form's data source.
document.querySelectorAll('select[data-styled-dropdown]').forEach(select => {
    const wrapper = document.createElement('div');
    wrapper.className = 'source-dropdown';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'source-dropdown-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul');
    list.className = 'source-dropdown-list';
    list.id = `${select.id}-listbox`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    trigger.setAttribute('aria-controls', list.id);
    const labels = [...select.labels];
    const labelIds = labels.map((label, index) => {
        label.id ||= `${select.id}-label-${index}`;
        label.addEventListener('click', event => {
            event.preventDefault();
            trigger.focus();
        });
        return label.id;
    }).join(' ');
    trigger.setAttribute('aria-labelledby', labelIds);
    list.setAttribute('aria-labelledby', labelIds);
    if (select.hasAttribute('aria-describedby')) {
        trigger.setAttribute('aria-describedby', select.getAttribute('aria-describedby'));
    }
    select.before(wrapper);
    wrapper.append(select, trigger);
    // Keep modal dropdowns in the dialog's top layer and outside form panels.
    const dialog = select.closest('dialog');
    (dialog || document.body).append(list);
    select.hidden = true;
    let active = -1;
    let items = [];
    let search = '';
    let lastKeyTime = 0;
    const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

    function close() {
        hideWithMotion(list);
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
        search = '';
    }
    function sync() {
        trigger.textContent = select.selectedOptions[0]?.label || 'Select an option';
        trigger.disabled = select.disabled;
        trigger.setAttribute('aria-required', String(select.required));
        trigger.setAttribute('aria-invalid', select.getAttribute('aria-invalid') || 'false');
        items = [...select.options].map((option, index) => {
            const item = document.createElement('li');
            item.id = `${list.id}-${index}`;
            item.dataset.index = index;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(option.selected));
            item.setAttribute('aria-disabled', String(option.disabled));
            const text = document.createElement('span');
            text.textContent = option.label;
            const check = document.createElement('span');
            check.className = 'source-dropdown-check';
            check.setAttribute('aria-hidden', 'true');
            check.textContent = '\u2713';
            item.append(text, check);
            return item;
        });
        list.replaceChildren(...items);
        close();
    }
    function highlight(index) {
        active = index;
        items.forEach((item, i) => item.classList.toggle('is-active', i === active));
        if (items[active]) {
            trigger.setAttribute('aria-activedescendant', items[active].id);
            items[active].scrollIntoView({ block: 'nearest' });
        }
    }
    function enabled() {
        return [...select.options].map((option, index) => option.disabled ? -1 : index)
            .filter(index => index !== -1);
    }
    function open() {
        if (select.disabled) return;
        sync();
        showWithMotion(list);
        trigger.setAttribute('aria-expanded', 'true');
        const rect = trigger.getBoundingClientRect();
        const below = Math.max(0, window.innerHeight - rect.bottom - 14);
        const above = Math.max(0, rect.top - 14);
        const upwards = below < Math.min(list.scrollHeight, 240) && above > below;
        list.style.width = `${rect.width}px`;
        list.style.left = `${rect.left}px`;
        list.style.maxHeight = `${Math.min(240, upwards ? above : below)}px`;
        list.style.top = upwards ? 'auto' : `${rect.bottom + 6}px`;
        list.style.bottom = upwards ? `${window.innerHeight - rect.top + 6}px` : 'auto';
        highlight(enabled().includes(select.selectedIndex) ? select.selectedIndex : (enabled()[0] ?? -1));
    }
    function choose(index) {
        if (select.disabled || !enabled().includes(index)) return;
        const changed = select.selectedIndex !== index;
        select.selectedIndex = index;
        sync();
        if (changed) {
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        trigger.focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => isOpen() ? close() : open());
    trigger.addEventListener('keydown', event => {
        if (event.key === 'Tab') { close(); return; }
        if (event.key === 'Escape') {
            if (isOpen()) { event.preventDefault(); event.stopPropagation(); close(); }
            return;
        }
        if (['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!isOpen()) open(); else choose(active);
            return;
        }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const wasClosed = !isOpen();
            if (wasClosed) open();
            const indices = enabled();
            if (!indices.length) return;
            if (event.key === 'Home') highlight(indices[0]);
            else if (event.key === 'End') highlight(indices.at(-1));
            else if (!wasClosed) {
                const step = event.key === 'ArrowDown' ? 1 : -1;
                highlight(indices[(indices.indexOf(active) + step + indices.length) % indices.length]);
            }
            return;
        }
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            if (!isOpen()) open();
            const now = Date.now();
            search = (now - lastKeyTime > 700 ? '' : search) + event.key.toLowerCase();
            lastKeyTime = now;
            const match = enabled().find(index => select.options[index].label.toLowerCase().startsWith(search));
            if (match !== undefined) highlight(match);
        }
    });
    trigger.addEventListener('blur', close);
    list.addEventListener('pointerdown', event => {
        if (event.target.closest('[role="option"]')) event.preventDefault();
    });
    list.addEventListener('click', event => {
        const item = event.target.closest('[role="option"]');
        if (item) choose(Number(item.dataset.index));
    });
    document.addEventListener('pointerdown', event => {
        if (!wrapper.contains(event.target) && !list.contains(event.target)) close();
    });
    window.addEventListener('resize', close);
    document.addEventListener('scroll', event => {
        if (!list.contains(event.target)) close();
    }, true);
    select.addEventListener('change', sync);
    select.addEventListener('input', sync);
    // Native validation still runs on the select; focus its visible control.
    select.addEventListener('invalid', event => {
        event.preventDefault();
        trigger.setAttribute('aria-invalid', 'true');
        trigger.focus();
    });
    dialog?.addEventListener('close', close);
    select.form?.addEventListener('reset', () => setTimeout(sync, 0));
    new MutationObserver(sync).observe(select, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['disabled', 'selected', 'label', 'value', 'required', 'aria-invalid']
    });
    sync();
});

// Scroll clearance follows the actual header size; sticky needs no layout spacer.
const workspaceHeader = document.querySelector('.workspace-page .top-navbar');
if (workspaceHeader) {
    const root = document.documentElement;
    function updateHeaderClearance() {
        const height = workspaceHeader.getBoundingClientRect().height;
        root.style.setProperty('--workspace-header-height', `${Math.ceil(height)}px`);
        return height + 12;
    }
    updateHeaderClearance();
    if ('ResizeObserver' in window) {
        const headerObserver = new ResizeObserver(updateHeaderClearance);
        headerObserver.observe(workspaceHeader);
    } else {
        window.addEventListener('resize', updateHeaderClearance);
        menuButton?.addEventListener('click', updateHeaderClearance);
    }

    // Native focus scrolling can leave a control behind a sticky element.
    // Leave scrolling inside the header and modal dialogs to the browser.
    document.addEventListener('focusin', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.closest('main') ||
            target.closest('dialog') || workspaceHeader.contains(target)) return;
        const clearance = updateHeaderClearance();
        const top = target.getBoundingClientRect().top;
        if (top < clearance) {
            window.scrollBy({ top: top - clearance, behavior: 'instant' });
        }
    });
}


// Workspace navigation: real page loads, latest selection wins, native history retained.
function initializeWorkspaceNavigation() {
    const main = document.querySelector('.workspace-page main');
    if (!main) return;
    const key = 'wifiroom.workspaceEntry';
    const pages = new Set(['index.html', 'area.html', 'survey.html', 'sessions.html', 'session-detail.html', 'analytics.html', 'admin.html']);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const menu = [...document.querySelectorAll('#primary-navigation a')];
    const originalMenu = menu.map(link => ({ link, active: link.classList.contains('active'), current: link.getAttribute('aria-current') }));
    const feedback = document.createElement('section');
    feedback.className = 'workspace-load-feedback';
    feedback.hidden = true;
    const message = document.createElement('p');
    message.setAttribute('role', 'status');
    const skeleton = document.createElement('div');
    skeleton.className = 'workspace-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) skeleton.append(document.createElement('span'));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'button secondary';
    retry.textContent = 'Try again';
    retry.hidden = true;
    feedback.append(message, skeleton, retry);
    main.before(feedback);
    let current;
    let retryLink;

    function reset() {
        if (current) {
            current.controller.abort();
            clearTimeout(current.loadingTimer);
            clearTimeout(current.recoveryTimer);
        }
        current = null;
        main.inert = false;
        main.removeAttribute('aria-busy');
        main.classList.remove('workspace-leaving', 'workspace-loading');
        feedback.hidden = true;
        originalMenu.forEach(({ link, active, current: value }) => {
            link.classList.toggle('active', active);
            if (value === null) link.removeAttribute('aria-current');
            else link.setAttribute('aria-current', value);
        });
        try { sessionStorage.removeItem(key); } catch { /* Optional effect. */ }
    }
    function fail(attempt) {
        if (current !== attempt) return;
        reset();
        retryLink = attempt.link;
        feedback.dataset.state = 'error';
        message.textContent = 'This page could not be loaded. Your current page is still available.';
        skeleton.hidden = true;
        retry.hidden = false;
        feedback.hidden = false;
    }
    function leaveDelay() {
        if (preference.matches) return Promise.resolve();
        return new Promise(resolve => {
            const done = event => {
                if (event && (event.target !== main || event.animationName !== 'workspace-exit')) return;
                clearTimeout(timer);
                main.removeEventListener('animationend', done);
                resolve();
            };
            const timer = setTimeout(() => done(), 300);
            main.addEventListener('animationend', done);
        });
    }
    async function navigate(link) {
        reset();
        const url = new URL(link.href, location.href);
        const attempt = { link, controller: new AbortController() };
        current = attempt;
        menu.forEach(item => {
            const selected = new URL(item.href).pathname === url.pathname;
            item.classList.toggle('active', selected);
            if (selected) item.setAttribute('aria-current', 'page');
            else item.removeAttribute('aria-current');
        });
        main.inert = true;
        main.setAttribute('aria-busy', 'true');
        main.classList.add('workspace-leaving');
        const exit = leaveDelay();
        attempt.loadingTimer = setTimeout(() => {
            if (current !== attempt) return;
            main.classList.add('workspace-loading');
            feedback.dataset.state = 'loading';
            message.textContent = 'Loading ' + (link.textContent.trim() || 'page') + '…';
            skeleton.hidden = false;
            skeleton.dataset.layout = ['index.html', 'area.html', 'analytics.html'].includes(url.pathname.split('/').pop()) ? 'cards' : 'table';
            retry.hidden = true;
            feedback.hidden = false;
        }, preference.matches ? 0 : 250);
        const timeout = setTimeout(() => attempt.controller.abort(), 10000);
        try {
            // Begin fetching concurrently with the exit. File previews navigate directly.
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                const response = await fetch(url.href, { signal: attempt.controller.signal, credentials: 'same-origin' });
                if (!response.ok) throw new Error('Page unavailable');
                await response.text();
            }
            clearTimeout(timeout);
            await exit;
            if (current !== attempt) return;
            clearTimeout(attempt.loadingTimer);
            try { sessionStorage.setItem(key, JSON.stringify({ url: url.href, time: Date.now() })); } catch { /* Navigate without entry effect. */ }
            attempt.recoveryTimer = setTimeout(() => fail(attempt), 5000);
            location.assign(url.href);
        } catch {
            clearTimeout(timeout);
            fail(attempt);
        }
    }
    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
            link.hasAttribute('download') || (link.target && link.target !== '_self') || link.closest('dialog') || link.hasAttribute('data-open-dialog')) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin || !pages.has(url.pathname.split('/').pop()) ||
            url.pathname.slice(0, url.pathname.lastIndexOf('/')) !== location.pathname.slice(0, location.pathname.lastIndexOf('/'))) return;
        if (url.pathname === location.pathname && url.search === location.search) {
            if (!url.hash) { event.preventDefault(); reset(); }
            return;
        }
        event.preventDefault();
        navigate(link);
    });
    retry.addEventListener('click', () => { if (retryLink) navigate(retryLink); });
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            reset();
            document.documentElement.classList.remove('workspace-arriving');
            main.querySelectorAll('.workspace-card-enter').forEach(card => card.classList.remove('workspace-card-enter'));
        }
    });
}
initializeWorkspaceNavigation();
