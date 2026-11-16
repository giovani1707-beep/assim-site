/* ASSIM — interactions shared by the static pages (menu, filiação modal, filters, FAQ, chart tips). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  const header = $('header[data-hdr]');
  const burger = $('[data-hdr-burger]');
  const setMenu = open => {
    if (!header) return;
    header.dataset.menu = open ? 'open' : 'closed';
    burger && burger.setAttribute('aria-expanded', String(open));
    burger && burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger && burger.addEventListener('click', () => setMenu(header.dataset.menu !== 'open'));
  window.addEventListener('resize', () => { if (window.innerWidth > 1100) setMenu(false); });

  /* Language toggle (visual only for now) */
  $$('.as-toggle').forEach(t => $$('button', t).forEach(b => b.addEventListener('click', () => {
    t.dataset.lang = b.dataset.lang;
    $$('button', t).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  })));

  /* Filiação modal */
  const scrim = $('#filiacao');
  let lastFocus = null;
  const openModal = () => {
    if (!scrim) return;
    setMenu(false);
    lastFocus = document.activeElement;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    const first = $('.as-option', scrim); first && first.focus();
  };
  const closeModal = () => {
    if (!scrim || scrim.hidden) return;
    scrim.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };
  $$('[data-open-filiacao]').forEach(b => b.addEventListener('click', openModal));
  scrim && scrim.addEventListener('click', e => { if (e.target === scrim || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); setMenu(false); }
    if (e.key === 'Tab' && scrim && !scrim.hidden) {
      const f = $$('a,button', scrim); const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* Reveal on scroll */
  const rv = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08 });
    rv.forEach((el, i) => { el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + 'ms'; io.observe(el); });
  }

  /* Filters: chips + search over [data-item] */
  $$('[data-filterable]').forEach(root => {
    const items = $$('[data-item]', root);
    const groups = $$('[data-group]', root);
    const empty = $('[data-empty]', root);
    const q = $('[data-search]', root);
    const chips = $$('[data-filter]', root);
    let cat = 'todos';
    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const apply = () => {
      const term = norm(q ? q.value.trim() : '');
      let shown = 0;
      items.forEach(it => {
        const okCat = cat === 'todos' || (it.dataset.tags || '').split(' ').includes(cat);
        const okQ = !term || norm(it.dataset.text || it.textContent).includes(term);
        it.hidden = !(okCat && okQ);
        if (!it.hidden) shown++;
      });
      groups.forEach(g => { g.hidden = !$$('[data-item]', g).some(i => !i.hidden); });
      if (empty) { empty.hidden = shown > 0; const t = $('[data-term]', empty); t && (t.textContent = q ? q.value.trim() : ''); }
    };
    chips.forEach(c => c.addEventListener('click', () => {
      cat = c.dataset.filter;
      chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
      apply();
    }));
    q && q.addEventListener('input', apply);
  });

  /* FAQ accordion — one open at a time */
  $$('.as-faq').forEach(list => {
    const qs = $$('.as-faq__q', list);
    const set = (btn, open) => {
      btn.setAttribute('aria-expanded', String(open));
      const a = document.getElementById(btn.getAttribute('aria-controls')); a && (a.hidden = !open);
      $$('[data-ico]', btn).forEach(i => { i.hidden = i.dataset.ico !== (open ? 'remove' : 'plus'); });
    };
    qs.forEach(b => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      qs.forEach(x => set(x, false)); set(b, open);
    }));
  });

  /* Chart tooltips */
  const tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
  const show = (el, x, y) => { tip.textContent = el.dataset.tip; tip.classList.add('on'); const w = tip.offsetWidth; tip.style.left = Math.min(window.innerWidth - w - 8, x + 12) + 'px'; tip.style.top = (y - 36) + 'px'; };
  $$('[data-tip]').forEach(el => {
    el.tabIndex = 0;
    el.addEventListener('pointermove', e => show(el, e.clientX, e.clientY));
    el.addEventListener('pointerleave', () => tip.classList.remove('on'));
    el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); });
    el.addEventListener('blur', () => tip.classList.remove('on'));
  });

  /* Report: highlight the section in view */
  const toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map(toc.map(a => [a.getAttribute('href').slice(1), a]));
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      toc.forEach(a => a.removeAttribute('aria-current'));
      const a = map.get(e.target.id); if (a) { a.setAttribute('aria-current', 'true'); a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' }); }
    }), { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((a, id) => { const s = document.getElementById(id); s && io2.observe(s); });
  }
})();
