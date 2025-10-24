// Navbar shadow on scroll
(function () {
  const nav = document.getElementById('mainNav');
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// CTA behavior
document.getElementById("reserveBtn")?.addEventListener("click", () => {
  const anchor = document.querySelector("#reservation");
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    // Fallback route; replace with your actual booking page/endpoint
    window.location.href = "/reservation";
  }
});
