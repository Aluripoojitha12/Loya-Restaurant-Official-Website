// Rotate ONLY the image; keep ring fixed.
// Uses a CSS variable (--angle) so scale/position remain untouched.
(function () {
  const dish = document.querySelector('.ba-dish');
  if (!dish) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let angle = 0;
  let ticking = false;
  let lastY = window.scrollY;

  const setAngle = (deg) => {
    dish.style.setProperty('--angle', `${deg}deg`);
  };

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;

    if (!ticking) {
      requestAnimationFrame(() => {
        angle += dy * 0.15;         // rotation sensitivity
        setAngle(angle);
        ticking = false;
      });
      ticking = true;
    }
  };

  const onWheel = (e) => {
    if (e.deltaY) {
      angle += e.deltaY * 0.15;
      setAngle(angle);
    }
  };

  setAngle(0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: true });
})();
