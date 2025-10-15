// Categories + Live Search + Price + Pagination + (keep bottom actions in DOM but hidden) + Top-right Order button
(function () {
  'use strict';

  const onReady = (fn) =>
    document.readyState !== 'loading'
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn, { once: true });

  onReady(function () {
    const grid    = document.getElementById('menuGrid');
    const cards   = grid ? Array.from(grid.querySelectorAll('.card')) : [];

    // Search
    const search  = document.getElementById('searchInput');
    const result  = document.getElementById('resultCount');

    // Categories
    const catList = document.getElementById('catList');
    let currentCat = '*';

    // Price
    const wrap    = document.getElementById('priceWrap');
    const rMin    = document.getElementById('priceMin');
    const rMax    = document.getElementById('priceMax');
    const minOut  = document.getElementById('minOut');
    const maxOut  = document.getElementById('maxOut');
    const resetBtn= document.getElementById('priceReset');

    // Pagination
    const pager   = document.querySelector('.pagination');
    const dots    = pager ? Array.from(pager.querySelectorAll('.dot')) : [];
    const prevBtn = pager ? pager.querySelector('.prev') : null;
    const nextBtn = pager ? pager.querySelector('.next') : null;

    let currentPage = 1;
    const maxPage   = dots.length || 1;

    if (!grid || !search || !catList || !wrap || !rMin || !rMax || !minOut || !maxOut || !resetBtn) return;

    const ABS_MIN = +rMin.min;
    const ABS_MAX = +rMax.max;
    const STEP    = +rMin.step || 1;

    // × hidden at start (full range)
    resetBtn.style.display = 'none';

    // Bring active thumb to front so both ends are always draggable
    function elevateActive(input){
      rMin.classList.remove('is-top');
      rMax.classList.remove('is-top');
      input.classList.add('is-top');
    }
    ['pointerdown','touchstart','mousedown','focus'].forEach(evt=>{
      rMin.addEventListener(evt, ()=> elevateActive(rMin));
      rMax.addEventListener(evt, ()=> elevateActive(rMax));
    });

    const fmt = (v) => {
      const n = Math.round(v * 100) / 100;
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    };

    function paintRange(){
      // keep thumbs apart by STEP
      if (+rMin.value > +rMax.value - STEP) rMin.value = +rMax.value - STEP;
      if (+rMax.value < +rMin.value + STEP) rMax.value = +rMin.value + STEP;

      const minVal = +rMin.value;
      const maxVal = +rMax.value;

      const pctMin = ((minVal - ABS_MIN) / (ABS_MAX - ABS_MIN)) * 100;
      const pctMax = ((maxVal - ABS_MIN) / (ABS_MAX - ABS_MIN)) * 100;

      // Update overlay band extents via CSS variables
      wrap.style.setProperty('--min', pctMin + '%');
      wrap.style.setProperty('--max', pctMax + '%');

      // Update readout
      minOut.textContent = fmt(minVal);
      maxOut.textContent = fmt(maxVal);

      // Toggle the header ×
      const filtered = (minVal > ABS_MIN) || (maxVal < ABS_MAX);
      resetBtn.style.display = filtered ? 'inline' : 'none';
    }

    function applyFilters(){
      const q    = search.value.trim().toLowerCase();
      const minV = +rMin.value, maxV = +rMax.value;
      let shown  = 0;

      cards.forEach(card=>{
        const page  = +(card.dataset.page || 1);
        const cat   = (card.dataset.cat || '').toLowerCase();
        const price = +card.dataset.price;
        const title = card.querySelector('.title')?.textContent || '';
        const sub   = card.querySelector('.sub')?.textContent || '';
        const text  = (title + ' ' + sub).toLowerCase();

        const pageOK  = (page === currentPage);
        const catOK   = (currentCat === '*' || currentCat === cat);
        const priceOK = (price >= minV && price <= maxV);
        const textOK  = (q === '' || text.includes(q));

        const show = pageOK && catOK && priceOK && textOK;
        card.classList.toggle('is-hidden', !show);
        if (show) shown++;
      });

      if (result) result.textContent = `Showing ${shown} ${shown === 1 ? 'result' : 'results'}`;

      ensureOrderIcon(); // keep top-right icon present after any filter/search
    }

    // Category click
    catList.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-filter]');
      if(!btn) return;
      currentCat = (btn.dataset.filter || '*').toLowerCase();
      catList.querySelectorAll('.is-active').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilters();
    });

    // Live search
    search.addEventListener('input', applyFilters);

    // Price: live updates
    ['input','change'].forEach(evt=>{
      rMin.addEventListener(evt, ()=>{ paintRange(); applyFilters(); });
      rMax.addEventListener(evt, ()=>{ paintRange(); applyFilters(); });
    });

    // Reset from header ×
    resetBtn.addEventListener('click', ()=>{
      rMin.value = ABS_MIN;
      rMax.value = ABS_MAX;
      paintRange();
      applyFilters();
      resetBtn.blur();
    });

    // Pagination controls
    function setPage(p){
      currentPage = Math.min(Math.max(1, p), maxPage);
      dots.forEach(d => d.classList.toggle('is-active', +d.dataset.page === currentPage));
      applyFilters();
      ensureOrderIcon(); // ensure icon exists on newly shown page
    }
    dots.forEach(d => d.addEventListener('click', () => setPage(+d.dataset.page)));
    if (prevBtn) prevBtn.addEventListener('click', () => setPage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => setPage(currentPage + 1));

    // --- Keep the old function name but no-op the bottom row creation (per request) ---
    function ensureBottomActions(){
      // Intentionally left blank (bottom actions hidden via CSS, DOM retained)
    }

    // === New: Ensure a single top-right "Order online" button on every card ===
    function ensureOrderIcon(){
      const nowCards = Array.from(document.querySelectorAll('#menuGrid .card'));
      const orderSVG = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 7h12l-1 13H7L6 7Zm3-2a3 3 0 0 1 6 0v2h-2V5a1 1 0 1 0-2 0v2H9V5Z"/>
        </svg>`;

      nowCards.forEach(card => {
        // remove any old heart/fav and previous order buttons, then add fresh one
        const oldFav = card.querySelector(':scope > .fav'); if (oldFav) oldFav.remove();
        const oldOrder = card.querySelector(':scope > .order-btn'); if (oldOrder) oldOrder.remove();

        const btn = document.createElement('button');
        btn.className = 'order-btn';
        btn.setAttribute('aria-label','Order online');
        btn.innerHTML = orderSVG;

        // Hook up a click if you have a URL (replace '#' with actual link)
        // btn.addEventListener('click', () => { window.location.href = '/order?item=' + encodeURIComponent(card.querySelector('.title')?.textContent || ''); });

        card.appendChild(btn);
      });
    }

    // Init
    paintRange();
    setPage(1);             // sets dot state + runs applyFilters
    ensureOrderIcon();      // initial pass
  });
})();
