/* maymi — capa de movimiento v2
   Scroll suave (Lenis) + animaciones ligadas al scroll (GSAP ScrollTrigger).
   No cambia la lógica de app.js: solo la acompaña. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasLib = !!(window.gsap && window.ScrollTrigger);

  /* ======================================================================
     Pequeños detalles de interfaz (funcionan con o sin GSAP)
     ====================================================================== */
  const nav = $('#nav'), burger = $('#mobileMenu');
  if (nav && burger) {
    burger.setAttribute('aria-expanded', 'false');
    new MutationObserver(() => {
      const open = nav.classList.contains('open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }
  const navLinks = $$('#nav a');
  const navIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean).forEach((s) => navIO.observe(s));

  const drawer = $('#bagDrawer'), scrim = $('#drawerScrim'), modal = $('#modalBackdrop');
  if (drawer && scrim) {
    new MutationObserver(() => scrim.classList.toggle('show', drawer.classList.contains('open')))
      .observe(drawer, { attributes: true, attributeFilter: ['class'] });
    scrim.addEventListener('click', () => $('#bagClose')?.click());
  }
  const bagCount = $('#bagCount'), bagBtn = $('#bagOpen');
  if (bagCount && bagBtn) {
    let prev = bagCount.textContent;
    new MutationObserver(() => {
      if (+bagCount.textContent > +prev) { bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump'); }
      prev = bagCount.textContent;
    }).observe(bagCount, { childList: true, characterData: true, subtree: true });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal?.classList.contains('open')) $('#modalClose')?.click();
    if (drawer?.classList.contains('open')) $('#bagClose')?.click();
    nav?.classList.remove('open');
  });

  // Antes/después: un gesto de ejemplo la primera vez que aparece
  const slider = $('#comparisonSlider'), range = $('#comparisonRange');
  if (slider && range && !reduce) {
    let touched = false;
    range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      const keys = [[0, 50], [700, 28], [1500, 72], [2200, 50]], t0 = performance.now() + 600;
      const step = (now) => {
        if (touched) return;
        const t = now - t0; if (t < 0) return requestAnimationFrame(step);
        let v = 50;
        for (let k = 1; k < keys.length; k++) if (t <= keys[k][0]) {
          const [ta, va] = keys[k - 1], [tb, vb] = keys[k], p = (t - ta) / (tb - ta);
          v = va + (vb - va) * (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2); break;
        }
        slider.style.setProperty('--split', `${v}%`); range.value = v;
        if (t < keys[keys.length - 1][0]) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(slider);
  }

  /* ======================================================================
     Sin GSAP (o con "reducir movimiento"): versión simple
     ====================================================================== */
  if (!hasLib || reduce) {
    html.classList.remove('gsap');
    const rio = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } }), { threshold: .14 });
    $$('[data-reveal]').forEach((el) => rio.observe(el));
    const grid = $('#productGrid');
    const prep = () => $$('.product-card', grid).forEach((c, i) => { c.style.setProperty('--i', i % 4); c.classList.add('card-in'); });
    if (grid) { prep(); new MutationObserver(prep).observe(grid, { childList: true }); }
    const header = $('.header'); let last = scrollY;
    addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', scrollY > 40);
      header.classList.toggle('is-hidden', scrollY > last && scrollY > 300);
      last = scrollY;
    }, { passive: true });
    return;
  }

  /* ======================================================================
     GSAP + Lenis
     ====================================================================== */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  // ---------- scroll suave ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // enlaces internos y scrollIntoView de app.js pasan por Lenis
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const el = id.length > 1 && $(id);
      if (!el) return;
      e.preventDefault();
      nav?.classList.remove('open');
      lenis.scrollTo(el, { offset: -90, duration: 1.4 });
      history.replaceState(null, '', id);
    });
    const nativeSIV = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (o) {
      if (o && typeof o === 'object' && o.behavior === 'smooth') lenis.scrollTo(this, { offset: -90, duration: 1.3 });
      else nativeSIV.call(this, o);
    };
    const lock = () => {
      const locked = modal?.classList.contains('open') || drawer?.classList.contains('open');
      locked ? lenis.stop() : lenis.start();
    };
    [modal, drawer].forEach((el) => el && new MutationObserver(lock).observe(el, { attributes: true, attributeFilter: ['class'] }));
  }

  // ---------- cabecera ----------
  const header = $('.header');
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(y - lastY) > 3) header.classList.toggle('is-hidden', y > lastY && y > 320 && !nav?.classList.contains('open'));
    lastY = y;
  };
  lenis ? lenis.on('scroll', ({ scroll }) => onScroll(scroll)) : addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  // ---------- utilidades ----------
  const splitWords = (el) => {
    if (el.dataset.split) return $$('.wi', el);
    el.dataset.split = '1'; el.classList.add('split');
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
    return $$('.wi', el);
  };
  const cssNum = (el, prop) => parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

  /* ======================================================================
     Intro + entrada de la portada
     ====================================================================== */
  const hero = $('.hero'), frame = $('.hero-frame');
  const restClip = () => `inset(${cssNum(hero, '--it')}px ${cssNum(hero, '--ix')}px ${cssNum(hero, '--ib')}px ${cssNum(hero, '--ix')}px round ${cssNum(hero, '--r')}px)`;
  const heroIn = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .fromTo(frame, { clipPath: 'inset(22% 34% 26% 34% round 80px)' }, { clipPath: restClip(), duration: 1.6, ease: 'expo.inOut' }, 0)
    .fromTo('.hero-photo img', { scale: 1.45 }, { scale: 1.08, duration: 2.2 }, 0)
    .fromTo('.hero h1 .line > *', { yPercent: 115, opacity: 1 }, { yPercent: 0, duration: 1.3, stagger: 0.11 }, 0.75)
    .fromTo(['.hero .kicker', '.hero-lead', '.hero-actions'], { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 1.05)
    .fromTo('.hero-side-note', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 1.25)
    .fromTo('.dew-layer .dew-wrap', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: 'back.out(1.7)', stagger: 0.07 }, 0.9)
    .fromTo('.scroll-cue', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 1.6);

  const intro = $('.intro');
  const startHero = () => { heroIn.play(); };
  if (intro && !html.classList.contains('no-intro')) {
    lenis?.stop();
    gsap.timeline({ onComplete: () => { intro.remove(); lenis?.start(); try { sessionStorage.setItem('maymiIntro', '1'); } catch (e) {} } })
      .fromTo('.intro img', { scale: 0.86, opacity: 0, y: 14 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' })
      .to('.intro-bar i', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, 0.15)
      .to('.intro-inner', { y: -40, opacity: 0, duration: 0.55, ease: 'power3.in' }, 1.1)
      .to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, 1.25)
      .add(startHero, 1.45);
  } else {
    intro?.remove();
    startHero();
  }

  /* ======================================================================
     Portada fija que se transforma al hacer scroll
     ====================================================================== */
  const statement = $('.hero-statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="sw" aria-hidden="true">${w}</span>`).join(' ');
  }
  mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, (ctx) => {
    const { wide } = ctx.conditions;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: wide ? '+=170%' : '+=120%', scrub: 0.9, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.fromTo(frame, { clipPath: () => restClip() }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.32, immediateRender: false }, 0)
      .fromTo('.hero-photo img', { scale: 1.08, yPercent: 0 }, { scale: wide ? 1.38 : 1.3, yPercent: -7, duration: 1, immediateRender: false }, 0)
      .to('.hero h1 .l1', { xPercent: wide ? -42 : -30, duration: 0.6 }, 0)
      .to('.hero h1 .l2', { xPercent: wide ? 30 : 22, duration: 0.6 }, 0)
      .to('.hero h1 .l3', { xPercent: wide ? 46 : 24, scale: 1.35, transformOrigin: '0% 70%', duration: 0.6 }, 0)
      .to('.hero h1', { opacity: 0, duration: 0.16 }, 0.2)
      .to(['.hero .kicker', '.hero-lead', '.hero-actions'], { y: -90, opacity: 0, duration: 0.28, stagger: 0.03 }, 0)
      .to('.hero-side-note', { y: -300, opacity: 0, duration: 0.5 }, 0)
      .to('.scroll-cue', { opacity: 0, duration: 0.08 }, 0);
    $$('.dew-layer .dew-wrap').forEach((d) => {
      const k = parseFloat(d.dataset.depth) || 1;
      tl.to(d, { y: -k * innerHeight * 0.42, x: (k % 1.5) * 40 - 20, duration: 1 }, 0);
    });
    tl.to('.hero-veil', { opacity: 1, duration: 0.24 }, 0.34)
      .set(statement, { visibility: 'visible' }, 0.44)
      .fromTo(statement, { y: 70 }, { y: 0, duration: 0.3 }, 0.44)
      .to('.hero-statement .sw', { opacity: 1, duration: 0.1, stagger: 0.035 }, 0.5)
      .to({}, { duration: 0.12 });
  });

  /* ======================================================================
     Títulos que aparecen palabra por palabra + textos de cada bloque
     ====================================================================== */
  $$('main h2').forEach((h) => {
    if (h.closest('.hero')) return;
    const words = splitWords(h);
    gsap.fromTo(words, { yPercent: 118, rotate: 5 }, {
      yPercent: 0, rotate: 0, duration: 1.15, ease: 'expo.out', stagger: 0.055,
      scrollTrigger: { trigger: h, start: 'top 86%', once: true },
    });
  });
  $$('.reveal').forEach((box) => {
    const items = $$(':scope > .kicker, :scope > p, :scope > ul, :scope > small, :scope > .routine-tabs, :scope > .routine-disclaimer, :scope > .results-caption, :scope > .box-highlights, :scope > .contact-details, :scope > .button, :scope > div > .kicker, :scope > div > p, :scope > .track-aside', box);
    if (!items.length) return;
    gsap.fromTo(items, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: box, start: 'top 84%', once: true },
    });
  });
  gsap.set('.promo-code, .results-product', { opacity: 1 });
  ScrollTrigger.batch('[data-reveal]:not(.promo-code):not(.results-product)', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15, ease: 'expo.out', stagger: 0.1, overwrite: 'auto' }),
  });

  /* ======================================================================
     Paneles redondeados que "suben" y crecen al entrar
     ====================================================================== */
  $$('.featured-section, .skin-finder-section, .routine-section, .promo-band, .footer').forEach((el) => {
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 40;
    gsap.fromTo(el, { scale: 0.88, borderRadius: r * 2.4 }, {
      scale: 1, borderRadius: r, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 30%', scrub: true },
    });
  });

  /* ======================================================================
     Marcas: la cinta se inclina con la velocidad del scroll
     ====================================================================== */
  const marquee = $('.marquee');
  if (marquee && lenis) {
    const skew = gsap.quickTo(marquee, 'skewX', { duration: 0.5, ease: 'power3' });
    lenis.on('scroll', ({ velocity }) => skew(gsap.utils.clamp(-14, 14, -velocity * 0.6)));
  }

  /* ======================================================================
     Categorías: recorrido horizontal fijado (pantallas anchas)
     ====================================================================== */
  const cat = $('#categorias'), track = $('#categoryTrack'), bar = $('.track-progress');
  if (cat && track) {
    mm.add('(min-width: 901px)', () => {
      cat.classList.add('is-pinned');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: cat, start: 'top top', end: () => `+=${dist() * 1.15}`, pin: true, scrub: 0.7, invalidateOnRefresh: true,
          onUpdate: (self) => bar?.style.setProperty('--p', self.progress.toFixed(4)),
        },
      });
      const tones = ['#FFFCF4', '#F2F6FB', '#FCF2EE', '#FBF7E2', '#EEF3F9', '#F8ECEA'];
      const bg = gsap.timeline({ scrollTrigger: { trigger: cat, start: 'top top', end: () => `+=${dist() * 1.15}`, scrub: true } });
      tones.slice(1).forEach((c) => bg.to(cat, { backgroundColor: c, ease: 'none', duration: 1 }));
      $$('.category-card', track).forEach((card) => {
        const photo = $('.cat-photo', card), num = $('.step-num', card);
        gsap.fromTo(photo, { xPercent: 26, rotate: 14 }, { xPercent: -18, rotate: -8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(num, { xPercent: 60 }, { xPercent: -20, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        if (card.getBoundingClientRect().left > innerWidth) {
          gsap.fromTo(card, { y: 110, rotate: 7, scale: 0.9 }, { y: 0, rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left 105%', end: 'left 62%', scrub: true } });
        }
      });
      return () => { cat.classList.remove('is-pinned'); gsap.set(cat, { clearProps: 'backgroundColor' }); };
    });
    mm.add('(max-width: 900px)', () => {
      gsap.fromTo($$('.category-card', track), { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
    });
  }

  /* ======================================================================
     Productos: entrada en cascada + inclinación 3D al pasar el mouse
     ====================================================================== */
  const grid = $('#productGrid');
  let refreshT;
  const softRefresh = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 250); };
  if (grid) {
    const animateCards = () => {
      const cards = $$('.product-card', grid).filter((c) => !c.dataset.prepped);
      if (!cards.length) return;
      cards.forEach((c) => { c.dataset.prepped = '1'; });
      gsap.fromTo(cards, { y: 90, opacity: 0, rotateX: -14, transformPerspective: 900 }, {
        y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: 'expo.out', stagger: { each: 0.07, grid: 'auto', from: 'start' },
        scrollTrigger: { trigger: grid, start: 'top 88%', once: true },
      });
    };
    animateCards();
    new MutationObserver(() => { animateCards(); softRefresh(); }).observe(grid, { childList: true });

    if (fine) {
      html.classList.add('has-tilt');
      let active = null;
      grid.addEventListener('pointermove', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        if (active && active !== card) gsap.to(active, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        active = card;
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        gsap.to(card, { rotateY: (px - 0.5) * 12, rotateX: (0.5 - py) * 10, y: -8, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
      grid.addEventListener('pointerleave', () => { if (active) gsap.to(active, { rotateX: 0, rotateY: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.6)' }); active = null; });
    }
  }
  const routine = $('#routineSteps');
  if (routine) new MutationObserver(softRefresh).observe(routine, { childList: true });

  /* ======================================================================
     Skin Finder, antes/después, comparación
     ====================================================================== */
  const arch = $('.arch');
  if (arch) {
    gsap.fromTo(arch, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 34px 34px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 999px 999px 34px 34px)', ease: 'none',
      scrollTrigger: { trigger: arch, start: 'top 92%', end: 'top 35%', scrub: true },
    });
    gsap.fromTo('.arch img', { yPercent: -16, scale: 1.25 }, { yPercent: 14, scale: 1.05, ease: 'none', scrollTrigger: { trigger: arch, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  if (slider) gsap.fromTo(slider, { scale: 0.82, rotate: -4 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: slider, start: 'top bottom', end: 'top 30%', scrub: true } });
  const rp = $('.results-product');
  if (rp) gsap.fromTo(rp, { y: 120 }, { y: -60, ease: 'none', scrollTrigger: { trigger: rp, start: 'top bottom', end: 'bottom top', scrub: true } });
  const rows = $$('.compare-table tbody tr');
  if (rows.length) gsap.fromTo(rows, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.compare-table', start: 'top 82%', once: true } });

  /* ======================================================================
     Maymi Box: una ventana que se abre a pantalla completa
     ====================================================================== */
  const box = $('.maymi-box-section');
  if (box) {
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, (ctx) => {
      if (ctx.conditions.wide) {
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: box, start: 'top top', end: '+=130%', pin: true, scrub: 0.8, anticipatePin: 1 } })
          .fromTo('.box-image', { clipPath: 'inset(16% 33% 16% 33% round 80px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.6 }, 0)
          .fromTo('.box-image img', { scale: 1.55 }, { scale: 1.04, duration: 0.75 }, 0)
          .fromTo('.box-copy', { x: 220, opacity: 0, rotate: 4 }, { x: 0, opacity: 1, rotate: 0, duration: 0.35 }, 0.5)
          .to({}, { duration: 0.15 });
      } else {
        gsap.fromTo('.box-image', { clipPath: 'inset(10% 18% 10% 18% round 60px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: box, start: 'top 85%', end: 'top 20%', scrub: true } });
        gsap.fromTo('.box-image img', { scale: 1.4 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });
  }

  /* ======================================================================
     Ingredientes: tarjetas que se apilan
     ====================================================================== */
  mm.add('(min-width: 901px)', () => {
    const cards = $$('.ingredient-card');
    cards.forEach((c, i) => {
      gsap.fromTo($('.ing-img img', c), { yPercent: 18, scale: 1.15 }, { yPercent: -10, scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 20%', scrub: true } });
      if (i === cards.length - 1) return;
      gsap.fromTo(c, { scale: 1, filter: 'brightness(1) saturate(1)' }, {
        scale: 0.9 + i * 0.03, filter: 'brightness(0.93) saturate(0.85)', ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: () => `top ${118 + (i + 1) * 28}px`, scrub: true },
      });
    });
  });

  /* ======================================================================
     Cupones, gotas y pie de página
     ====================================================================== */
  const codes = $$('.promo-code');
  codes.forEach((c, i) => gsap.fromTo(c, { y: 160, rotate: i ? 16 : -16 }, { y: 0, rotate: i ? 2 : -2, ease: 'none', scrollTrigger: { trigger: '.promo-band', start: 'top bottom', end: 'center center', scrub: true } }));
  $$('.dew-float').forEach((d) => {
    const k = parseFloat(d.dataset.depth) || 1;
    gsap.fromTo(d, { y: k * 90 }, { y: -k * 140, ease: 'none', scrollTrigger: { trigger: d.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  const giant = $('.giant-word');
  if (giant) {
    giant.innerHTML = [...giant.textContent].map((ch) => `<span class="gl">${ch}</span>`).join('');
    gsap.fromTo($$('.gl', giant), { yPercent: 105 }, { yPercent: 0, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: '.footer', start: 'top 75%', end: 'bottom bottom', scrub: true } });
  }

  /* ======================================================================
     Cursor propio y botones magnéticos (solo mouse)
     ====================================================================== */
  if (fine) {
    html.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-ring b');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const lab = t.closest('[data-cursor]');
      const text = t.closest('input:not([type=range]),textarea,select');
      cur.classList.toggle('is-hidden', !!text);
      cur.classList.toggle('is-label', !!lab && !text);
      if (lab) label.textContent = lab.dataset.cursor;
      cur.classList.toggle('is-hover', !lab && !!t.closest('a,button,label,[role=button]'));
    });
    $$('[data-magnetic], .bag-button').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.32); my((e.clientY - r.top - r.height / 2) * 0.42);
      });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.45)' }); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
