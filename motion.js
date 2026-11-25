/* maymi — motion layer: parallax, pinned routine track, reveals and UI polish.
   Works on top of app.js without changing its logic. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let vh = window.innerHeight, vw = window.innerWidth;

  /* ---------- reveals with sibling stagger ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', `${sibs.indexOf(el) * 110}ms`);
    revealIO.observe(el);
  });

  /* ---------- product cards: animate each render as it enters view ---------- */
  const grid = $('#productGrid');
  const cardIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('card-in');
      cardIO.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  const prepCards = () => {
    $$('.product-card', grid).forEach((card, i) => {
      if (card.dataset.prepped) return;
      card.dataset.prepped = '1';
      card.style.setProperty('--i', i % 4);
      if (reduce) card.classList.add('card-in'); else cardIO.observe(card);
    });
  };
  if (grid) { prepCards(); new MutationObserver(prepCards).observe(grid, { childList: true }); }

  /* ---------- header: hide on scroll down, current section ---------- */
  const header = $('.header');
  let lastY = window.scrollY;
  const navLinks = $$('#nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navIO.observe(s));

  /* ---------- mobile menu state ---------- */
  const nav = $('#nav'), burger = $('#mobileMenu');
  if (nav && burger) {
    burger.setAttribute('aria-expanded', 'false');
    new MutationObserver(() => {
      const open = nav.classList.contains('open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- bag drawer scrim + bump ---------- */
  const drawer = $('#bagDrawer'), scrim = $('#drawerScrim');
  if (drawer && scrim) {
    new MutationObserver(() => scrim.classList.toggle('show', drawer.classList.contains('open')))
      .observe(drawer, { attributes: true, attributeFilter: ['class'] });
    scrim.addEventListener('click', () => $('#bagClose')?.click());
  }
  const bagCount = $('#bagCount'), bagBtn = $('#bagOpen');
  if (bagCount && bagBtn) {
    let prev = bagCount.textContent;
    new MutationObserver(() => {
      if (bagCount.textContent !== prev && +bagCount.textContent > +prev) {
        bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump');
      }
      prev = bagCount.textContent;
    }).observe(bagCount, { childList: true, characterData: true, subtree: true });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#modalBackdrop')?.classList.contains('open')) $('#modalClose')?.click();
    if (drawer?.classList.contains('open')) $('#bagClose')?.click();
    if (nav?.classList.contains('open')) nav.classList.remove('open');
  });

  /* ---------- before/after: one gentle hint when it first appears ---------- */
  const slider = $('#comparisonSlider'), range = $('#comparisonRange');
  if (slider && range && !reduce) {
    let touched = false;
    range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
    const hintIO = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      hintIO.disconnect();
      const keys = [[0, 50], [700, 30], [1500, 70], [2200, 50]];
      const t0 = performance.now() + 500;
      const step = (now) => {
        if (touched) return;
        const t = now - t0;
        if (t < 0) return requestAnimationFrame(step);
        let v = 50;
        for (let k = 1; k < keys.length; k++) {
          if (t <= keys[k][0]) {
            const [ta, va] = keys[k - 1], [tb, vb] = keys[k];
            const p = (t - ta) / (tb - ta), ease = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            v = va + (vb - va) * ease; break;
          }
        }
        slider.style.setProperty('--split', `${v}%`); range.value = v;
        if (t < keys[keys.length - 1][0]) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    hintIO.observe(slider);
  }

  if (reduce) return;

  /* ---------- pinned horizontal routine (wide screens) ---------- */
  const catSection = $('#categorias'), track = $('#categoryTrack'), bar = $('.track-progress');
  let pin = { on: false, top: 0, dist: 0 };
  const setupPin = () => {
    if (!catSection || !track) return;
    const want = vw >= 900;
    catSection.classList.toggle('is-pinned', want);
    if (!want) { catSection.style.height = ''; track.style.transform = ''; pin.on = false; return; }
    pin.dist = Math.max(0, track.scrollWidth - vw);
    catSection.style.height = `${vh + pin.dist}px`;
    pin.top = catSection.getBoundingClientRect().top + window.scrollY;
    pin.on = pin.dist > 0;
  };

  /* ---------- parallax ---------- */
  const para = $$('[data-parallax]').map((el) => ({ el, s: parseFloat(el.dataset.parallax) || 0 }));
  const depth = $$('[data-depth]').map((el) => ({ el, d: parseFloat(el.dataset.depth) || 0, host: el.closest('section,footer') || document.body }));
  const catPhotos = $$('.cat-photo', track || document);
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      tmx = (e.clientX / vw - 0.5) * 2; tmy = (e.clientY / vh - 0.5) * 2;
    }, { passive: true });
  }

  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;

    // header
    if (header) {
      const down = y > lastY && y > 260;
      if (Math.abs(y - lastY) > 4) header.classList.toggle('is-hidden', down && !nav?.classList.contains('open'));
      lastY = y;
    }

    // element parallax relative to viewport centre
    for (const p of para) {
      const r = p.el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const off = (r.top + r.height / 2 - vh / 2) * -p.s;
      p.el.style.translate = `0 ${off.toFixed(1)}px`;
    }
    // dew drops: scroll depth + pointer drift
    for (const p of depth) {
      const r = p.host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const sy = (r.top - vh * 0.1) * p.d * -0.18;
      p.el.style.translate = `${(mx * p.d * 14).toFixed(1)}px ${(sy + my * p.d * 12).toFixed(1)}px`;
    }
    // pinned routine
    if (pin.on) {
      const prog = Math.min(1, Math.max(0, (y - pin.top) / pin.dist));
      track.style.transform = `translate3d(${(-prog * pin.dist).toFixed(1)}px,0,0)`;
      bar?.style.setProperty('--p', prog.toFixed(4));
      catPhotos.forEach((ph, i) => { ph.style.translate = `${((prog * 6 - i) * -10).toFixed(1)}px 0`; });
    }
    if (finePointer && (Math.abs(tmx - mx) > 0.002 || Math.abs(tmy - my) > 0.002)) request();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  window.addEventListener('scroll', request, { passive: true });
  if (finePointer) window.addEventListener('pointermove', request, { passive: true });
  const onResize = () => { vh = window.innerHeight; vw = window.innerWidth; setupPin(); request(); };
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  // images inside the track change its width once loaded
  $$('img', track || document).forEach((img) => img.addEventListener('load', setupPin, { once: true }));
  setupPin(); request();
})();
