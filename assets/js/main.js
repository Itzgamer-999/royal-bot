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

    /* ---------- Animated stats ---------- */
(function () {
  const wrap = document.getElementById('stats');
  if (!wrap) return;

  const cfg  = window.ROYAL || {};
  const nums = [...wrap.querySelectorAll('strong[data-key]')];

  // how each number should look on screen
  function fmt(value, key) {
    if (key === 'uptime') return value.toFixed(2) + '%';
    if (key === 'users' && value >= 1000) {
      const k = value / 1000;
      return (k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'K';
    }
    return Math.round(value).toLocaleString('en-US');
  }

  function run(el, target) {
    const key = el.dataset.key, dur = 1400, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    requestAnimationFrame(function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = fmt(target * ease(p), key);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target, key);   // always land on the exact value
    });
  }

  const fallback = Object.assign(
    { servers: 0, users: 0, commands: 0, uptime: 0 },
    cfg.stats || {}
  );

  function start() {
    const paint = d => nums.forEach(el => run(el, Number(d[el.dataset.key]) || 0));
    if (!cfg.statsEndpoint) return paint(fallback);
    fetch(cfg.statsEndpoint)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => paint(Object.assign({}, fallback, d)))
      .catch(() => paint(fallback));
  }

  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { obs.disconnect(); start(); }
  }, { threshold: 0.3 }).observe(wrap);
})();


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
