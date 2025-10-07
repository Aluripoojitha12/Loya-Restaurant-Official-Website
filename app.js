// Smooth scrolling, nav collapse on click, shadow on scroll, active link update
(function () {
  const nav = document.getElementById('mainNav');

  function getOffsetTop(el) {
    const rect = el.getBoundingClientRect();
    return rect.top + window.pageYOffset;
  }

  function smoothScrollTo(targetY, duration = 500) {
    const startY = window.pageYOffset;
    const diff = targetY - startY;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t) * t;
      window.scrollTo(0, startY + diff * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // In-page nav links
  document.querySelectorAll('a.nav-link[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();

      const bsCollapse = bootstrap.Collapse.getOrCreateInstance('#navLinks', { toggle: false });
      bsCollapse.hide();

      const navHeight = nav.offsetHeight || 72;
      const y = getOffsetTop(target) - (navHeight - 1);
      smoothScrollTo(y, 500);
    });
  });

  // Navbar shadow when scrolling
  const onScroll = () => {
    if (window.scrollY > 10) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Active link on scroll
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const links = Array.from(document.querySelectorAll('.nav-link'));
  function updateActiveLink() {
    const navHeight = nav.offsetHeight || 72;
    const fromTop = window.scrollY + navHeight + 10;
    let currentId = sections[0]?.id;
    for (const sec of sections) {
      if (sec.offsetTop <= fromTop) currentId = sec.id;
    }
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`));
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink);
  updateActiveLink();
})();

// =========================
// Hero text rotator
// =========================
(function () {
  const rotator = document.querySelector('.hero-rotator');
  if (!rotator) return;

  const slides = Array.from(rotator.querySelectorAll('.hero-slide'));
  if (slides.length <= 1) return;

  slides.forEach(s => s.classList.remove('active'));

  let idx = 0;
  const FIRST_START_DELAY = 150;
  const DURATION = 5200;

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer;

  const show = (next) => {
    slides[idx].classList.remove('active');
    idx = next;
    slides[idx].classList.add('active');
    slides.forEach((el, i) => el.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
  };

  const startLoop = () => {
    stopLoop();
    timer = setInterval(() => {
      const next = (idx + 1) % slides.length;
      show(next);
    }, DURATION);
  };

  const stopLoop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  if (mq.matches) {
    slides[0].classList.add('active');
  } else {
    setTimeout(() => {
      slides[0].classList.add('active');
      startLoop();
    }, FIRST_START_DELAY);
  }

  rotator.addEventListener('mouseenter', stopLoop);
  rotator.addEventListener('mouseleave', () => !mq.matches && startLoop());
  rotator.addEventListener('focusin', stopLoop);
  rotator.addEventListener('focusout', () => !mq.matches && startLoop());

  mq.addEventListener('change', (e) => {
    if (e.matches) {
      stopLoop();
      slides.forEach(s => s.classList.remove('active'));
      slides[0].classList.add('active');
    } else {
      slides.forEach(s => s.classList.remove('active'));
      idx = 0;
      slides[0].classList.add('active');
      startLoop();
    }
  });
})();

// =========================
// COMING SOON — Countdown
// =========================
(function () {
  const el = document.querySelector('.coming-countdown');
  if (!el) return;

  const daysEl  = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl  = document.getElementById('cd-mins');
  const secsEl  = document.getElementById('cd-secs');

  const targetStr = el.getAttribute('data-target');
  let target = targetStr ? new Date(targetStr) : null;
  if (!target || isNaN(target.getTime())) {
    target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent  = '00';
      secsEl.textContent  = '00';
      el.setAttribute('aria-label', 'Countdown complete');
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    const days  = Math.floor(totalSecs / (24 * 3600));
    const hrs   = Math.floor((totalSecs % (24 * 3600)) / 3600);
    const mins  = Math.floor((totalSecs % 3600) / 60);
    const secs  = totalSecs % 60;

    daysEl.textContent  = pad(days);
    hoursEl.textContent = pad(hrs);
    minsEl.textContent  = pad(mins);
    secsEl.textContent  = pad(secs);
  }

  tick();
  const interval = setInterval(tick, 1000);
  window.addEventListener('beforeunload', () => clearInterval(interval));
})();

// =========================
// Popular Scroller — arrows + manual mode
// =========================
(function () {
  const scroller = document.querySelector('#popular .popular-scroller');
  if (!scroller) return;

  const track   = scroller.querySelector('.popular-track');
  // arrows are OUTSIDE the scroller now
  const prevBtn = document.querySelector('#popular .pop-prev');
  const nextBtn = document.querySelector('#popular .pop-next');

  if (!track || !prevBtn || !nextBtn) return;

  // Switch from CSS auto-slide to manual scroll-snap on first interaction
  let manual = false;
  function ensureManual() {
    if (manual) return;
    scroller.classList.add('manual'); // your CSS stops animation when this class is present
    manual = true;
  }

  // Measure one "card step" (card width + gap) from first two cards
  function stepSize() {
    const cards = track.querySelectorAll('.dish-card');
    if (cards.length < 2) return Math.max(260, scroller.clientWidth * 0.72);
    const c1 = cards[0].getBoundingClientRect();
    const c2 = cards[1].getBoundingClientRect();
    return Math.round(c2.left - c1.left);
  }

  // Click to move by one card (Right arrow => new cards appear from the right)
  function smoothBy(px) {
    ensureManual();
    scroller.scrollBy({ left: px, behavior: 'smooth' });
  }
  prevBtn.addEventListener('click', () => smoothBy(-stepSize()));
  nextBtn.addEventListener('click', () => smoothBy( stepSize()));

  // Press-and-hold to glide continuously
  let holdRAF = null;
  function startHold(dir) {
    ensureManual();
    let v = 2.2; // px per frame
    const tick = () => {
      scroller.scrollLeft += dir * v;
      v = Math.min(v + 0.2, 16); // accelerate, cap
      holdRAF = requestAnimationFrame(tick);
    };
    holdRAF = requestAnimationFrame(tick);
  }
  function endHold() {
    if (holdRAF) cancelAnimationFrame(holdRAF);
    holdRAF = null;
  }
  function addHold(btn, dir) {
    btn.addEventListener('mousedown', () => startHold(dir));
    btn.addEventListener('touchstart', () => startHold(dir), { passive: true });
    btn.addEventListener('mouseup', endHold);
    btn.addEventListener('mouseleave', endHold);
    btn.addEventListener('touchend', endHold);
    btn.addEventListener('touchcancel', endHold);
    // Keyboard (Enter/Space)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') startHold(dir);
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') endHold();
    });
    btn.tabIndex = 0;
  }
  addHold(prevBtn, -1);
  addHold(nextBtn, +1);

  // If user scrolls via wheel/touch, also switch to manual mode
  scroller.addEventListener('wheel', ensureManual, { passive: true });
  scroller.addEventListener('touchstart', ensureManual, { passive: true });

  // Snap to nearest card after a resize (only matters in manual mode)
  let resizeTO;
  window.addEventListener('resize', () => {
    if (!manual) return;
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      const s = stepSize();
      const snapped = Math.round(scroller.scrollLeft / s) * s;
      scroller.scrollTo({ left: snapped, behavior: 'smooth' });
    }, 120);
  });
})();

// ===== Gallery Filter Logic =====
(function(){
  const buttons = document.querySelectorAll('.gallery .gf-btn');
  const items = document.querySelectorAll('.gallery .g-item');

  function applyFilter(filter){
    items.forEach(it => {
      const cat = it.getAttribute('data-cat');
      const show = (filter === 'all') || (cat === filter);
      if(show){ it.removeAttribute('hidden'); }
      else { it.setAttribute('hidden',''); }
    });
  }

  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      buttons.forEach(b=>{
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed','true');
      applyFilter(btn.dataset.filter);
    });
  });

  // optional: allow filter via URL hash (#gallery?cat=veg)
  const params = new URLSearchParams(location.hash.split('?')[1]);
  const initial = params.get('cat');
  if(initial){
    const match = Array.from(buttons).find(b => b.dataset.filter === initial);
    if(match){ match.click(); }
  }
})();

// ===== testimonials: Rotates two visible cards to avoid long, clumsy section =====
(function(){
  const items = Array.from(document.querySelectorAll('#t3Source li'));
  if (items.length === 0) return;

  const slotA = document.getElementById('t3slot1');
  const slotB = document.getElementById('t3slot2');

  function paint(slot, d){
    slot.querySelector('.t3-quoteTitle').textContent = d.title;
    slot.querySelector('.t3-quote').textContent = `“${d.text}”`;
    slot.querySelector('.t3-avatar').src = d.img || '';
    slot.querySelector('.t3-meta strong').textContent = d.name || '';
    slot.querySelector('.t3-meta span').textContent = d.role || '';
  }

  const data = items.map(li => ({
    title: li.dataset.title || '',
    text:  li.dataset.text  || '',
    name:  li.dataset.name  || '',
    role:  li.dataset.role  || '',
    img:   li.dataset.img   || ''
  }));

  let i = 0;
  function swap(first){
    [slotA, slotB].forEach(s => s.classList.remove('show'));
    setTimeout(()=>{
      paint(slotA, data[i % data.length]);
      paint(slotB, data[(i+1) % data.length]);
      [slotA, slotB].forEach(s => s.classList.add('show'));
      i = (i + 2) % data.length;
    }, first ? 40 : 250);
  }

  swap(true);
  setInterval(swap, 5000); // every 5s
})();

// ========== Scroll animations (global) ==========//
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Auto-tag common elements so you don’t edit HTML everywhere
  const autoSelectors = [
    // texts
    'h1, h2, h3, .title, .lead, .eyebrow, .popular-subtitle, .coming-title, .coming-subtitle',
    // cards/blocks
    '.dish-card, .card, .lac__card, .t3-card, .g-item, .footer-col'
  ];
  autoSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
  });

  // Make “cards” feel a bit stronger
  document.querySelectorAll('.dish-card, .card, .g-item, .t3-card').forEach(el => {
    el.classList.add('card-pop');
  });

  // Food images rotate then settle
  const spinTargets = [
    '.dish-card .dish-media img',
    '.g-item img'
  ];
  spinTargets.forEach(sel => {
    document.querySelectorAll(sel).forEach(img => img.classList.add('spin-in'));
  });

  // Stagger within containers (optional, nice effect)
  const staggerParents = [
    '.popular-track',
    '.about-grid',
    '.lac__content',
    '.gallery-grid',
    '.t3-cards',
    '.footer-grid'
  ];
  staggerParents.forEach(parentSel => {
    document.querySelectorAll(parentSel).forEach(parent => {
      [...parent.children].forEach((child, idx) => {
        child.setAttribute('data-delay', String(Math.min(idx * 100, 400)));
      });
    });
  });

  // IntersectionObserver to reveal once
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

  document.querySelectorAll('.reveal, .card-pop, .spin-in').forEach(el => io.observe(el));
})();
// ========== Newsletter banner: open when centered in viewport ==========//
// Sequence:
// 1) grow BLACK line from bottom
// 2) flip line to GOLD near the end
// 3) open black doors
// 4) after doors finish, slide image from LEFT & text+form from RIGHT (BOTTOM on mobile)
document.addEventListener('DOMContentLoaded', () => {
  const banner    = document.querySelector('.nl-banner');
  const leftDoor  = banner?.querySelector('.nl-door.left');
  const rightDoor = banner?.querySelector('.nl-door.right');
  if (!banner || !leftDoor || !rightDoor) return;

  const LINE_MS = 800;     // keep in sync with --line-dur
  const FLIP_BEFORE = 120; // ms before finish to flip to gold
  const AFTER_PAD = 80;    // small buffer before door open

  const start = () => {
    // Step 1: grow the (black) center line
    banner.classList.add('line-grow');

    // Step 2: near the end, flip to gold
    setTimeout(() => {
      banner.classList.add('line-gold');
    }, Math.max(0, LINE_MS - FLIP_BEFORE));

    // Step 3: after line done, hide it and open doors
    setTimeout(() => {
      banner.classList.add('line-hide');
      banner.classList.add('is-open');
    }, LINE_MS + AFTER_PAD);

    // Step 4: when doors finish opening, reveal sides (image + text + form)
    const onDoorEnd = (e) => {
      if (e.propertyName === 'transform') {
        banner.classList.add('is-reveal');
        leftDoor.removeEventListener('transitionend', onDoorEnd);
        rightDoor.removeEventListener('transitionend', onDoorEnd);
      }
    };
    leftDoor.addEventListener('transitionend', onDoorEnd);
    rightDoor.addEventListener('transitionend', onDoorEnd);
  };

  // Trigger when the banner is in view
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      start();
      io.disconnect();
    }
  }, { threshold: 0.25 });

  io.observe(banner);
});
