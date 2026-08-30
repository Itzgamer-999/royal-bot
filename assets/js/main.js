(() => {
    const C = window.ROYAL || {};
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];

    /* ── Config injection ───────────────────────────── */
    const inviteUrl = C.clientId && !/^YOUR_/.test(C.clientId)
        ? `https://discord.com/oauth2/authorize?client_id=${C.clientId}&permissions=${C.permissions}&scope=${encodeURIComponent(C.scopes || 'bot applications.commands')}`
        : null;


    $$('[data-brand]').forEach(el => { if (C.brand) el.textContent = C.brand; });

    $$('[data-invite]').forEach(el => {
        if (inviteUrl) { el.href = inviteUrl; el.target = '_blank'; el.rel = 'noopener'; }
        else el.addEventListener('click', e => { e.preventDefault(); toast('Set your clientId in assets/js/config.js'); });
    });

    $$('[data-support]').forEach(el => { el.href = C.supportServer || '#'; el.target = '_blank'; el.rel = 'noopener'; });

    $$('[data-github]').forEach(el => { el.href = C.githubUrl || '#'; el.target = '_blank'; el.rel = 'noopener'; });

    $$('[data-mail]').forEach(el => { el.href = `mailto:${C.contactEmail || ''}`; });

    $$('[data-email]').forEach(el => { el.textContent = C.contactEmail || 'support@example.com'; });

    $$('[data-jurisdiction]').forEach(el => { el.textContent = C.jurisdiction || 'your jurisdiction'; });

    $$('[data-entity]').forEach(el => { el.textContent = C.legalEntity || C.brand || 'the operator'; });

    $$('[data-updated]').forEach(el => { el.textContent = C.lastUpdated || ''; });
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

    /* ── Toast ──────────────────────────────────────── */
    let toastTimer;
    function toast(msg) {
        const t = $('#toast'); if (!t) return;
        t.textContent = msg; t.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
    }

    /* ── Sticky nav + mobile menu ───────────────────── */
    const nav = $('#nav');
    const onScroll = () => nav && nav.classList.toggle('is-stuck', window.scrollY > 12);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });

    const burger = $('#burger'), links = $('#navLinks');
    if (burger && links) {
        const close = () => { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
        burger.addEventListener('click', () => {
            const open = links.classList.toggle('is-open');
            burger.setAttribute('aria-expanded', String(open));
        });
        links.addEventListener('click', e => { if (e.target.tagName === 'A') close(); });
        addEventListener('keydown', e => e.key === 'Escape' && close());
    }

    /* ── Scroll reveal ──────────────────────────────── */
    const reveals = $$('[data-reveal]');
    if ('IntersectionObserver' in window && reveals.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en, i) => {
                if (!en.isIntersecting) return;
                setTimeout(() => en.target.classList.add('is-in'), Math.min(i * 70, 350));
                io.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -60px 0px', threshold: .08 });
        reveals.forEach(el => io.observe(el));
    } else reveals.forEach(el => el.classList.add('is-in'));

    /* ── Cursor spotlight on cards ──────────────────── */
    if (matchMedia('(hover:hover)').matches) {

        $$('.spot .card').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* ── Animated stats ─────────────────────────────── */
    const fmt = n => n >= 1000 ? Math.round(n).toLocaleString('en-US') : String(n);
    function countUp(el, target, suffix = '') {
        const dur = 1500, start = performance.now(), from = 0;
        const dec = !Number.isInteger(target);
        (function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = from + (target - from) * eased;
            el.textContent = (dec ? v.toFixed(2) : fmt(v)) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }

    async function loadStats() {
        let data = C.stats || {};
        if (C.statsEndpoint) {
            try {
                const r = await fetch(C.statsEndpoint, { cache: 'no-store' });
                if (r.ok) data = { ...data, ...(await r.json()) };
            } catch { /* keep fallback numbers */ }
        }
        const host = $('#stats'); if (!host) return;
        const fire = () => $$('strong[data-key]', host).forEach(el => {
            const v = Number(data[el.dataset.key] ?? 0);
            countUp(el, v, el.dataset.suffix || '');
        });
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { fire(); io.disconnect(); } }, { threshold: .3 });
            io.observe(host);
        } else fire();
    }
    loadStats();

    /* ── Command filter + search ────────────────────── */
    const list = $('#cmdList');
    if (list) {
        const cmds = $$('.cmd', list), empty = $('#cmdEmpty');
        let cat = 'all', q = '';
        const apply = () => {
            let shown = 0;
            cmds.forEach(c => {
                const okCat = cat === 'all' || c.dataset.cat === cat;
                const okQ = !q || c.textContent.toLowerCase().includes(q);
                const vis = okCat && okQ;
                c.hidden = !vis; if (vis) shown++;
            });
            if (empty) empty.hidden = shown > 0;
        };

        $$('#cmdFilters .chip').forEach(b => b.addEventListener('click', () => {

            $$('#cmdFilters .chip').forEach(x => x.classList.remove('is-active'));
            b.classList.add('is-active'); cat = b.dataset.cat; apply();
        }));
        const search = $('#cmdSearch');
        if (search) search.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    }

    /* ── FAQ: one open at a time ────────────────────── */
    const faq = $$('#faqList details');
    faq.forEach(d => d.addEventListener('toggle', () => {
        if (d.open) faq.forEach(o => { if (o !== d) o.open = false; });
    }));

    /* ── Copy invite ────────────────────────────────── */
    const copyBtn = $('#copyInvite');
    if (copyBtn) copyBtn.addEventListener('click', async () => {
        if (!inviteUrl) return toast('Set your clientId in assets/js/config.js');
        try { await navigator.clipboard.writeText(inviteUrl); toast('Invite link copied ✓'); }
        catch { toast('Copy failed — long-press the button instead'); }
    });

    /* ── Legal page TOC scrollspy ───────────────────── */
    const toc = $('.toc');
    if (toc) {
        const heads = $$('.doc h2[id]');
        const map = new Map(heads.map(h => [h.id, toc.querySelector(`a[href="#${h.id}"]`)]));
        const spy = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                map.forEach(a => a && a.classList.remove('is-active'));
                const a = map.get(en.target.id); if (a) a.classList.add('is-active');
            });
        }, { rootMargin: '-90px 0px -70% 0px' });
        heads.forEach(h => spy.observe(h));
    }
})();
