// Basic, friendly validations without red borders:
// - Name: letters/spaces/' . - , min 2
// - Email: native + simple regex fallback
// - Country code: required
// - Phone: digits/spaces/()- only, length per country
// - Subject: min 3
// - Message: min 10
// - Consent: required

(function () {
  const $ = (sel) => document.querySelector(sel);
  const form = $('#contactForm');
  const fields = {
    name: $('#name'),
    email: $('#email'),
    code: $('#code'),
    phone: $('#phone'),
    subject: $('#subject'),
    message: $('#message'),
    consent: $('#consent')
  };

  const errBox = $('#formErrors');

  const phoneRules = {
    '+353': { min: 7, max: 12 }, // Ireland
    '+91':  { min: 10, max: 12 },
    '+44':  { min: 7, max: 12 },
    '+1':   { min: 7, max: 12 },
    '+61':  { min: 7, max: 12 },
    '+971': { min: 7, max: 12 }
  };

  function setError(inputEl, key, msg) {
    const small = document.querySelector(`small.err[data-for="${key}"]`);
    if (small) small.textContent = msg || '';
    inputEl.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function clearAllErrors() {
    document.querySelectorAll('small.err').forEach(s => s.textContent = '');
    Object.values(fields).forEach(el => el && el.setAttribute('aria-invalid', 'false'));
    errBox.textContent = '';
  }

  function validateName() {
    const v = fields.name.value.trim();
    const ok = /^[A-Za-zÀ-ÖØ-öø-ÿ'’. -]{2,}$/.test(v);
    setError(fields.name, 'name', ok ? '' : 'Please enter your full name (letters only).');
    return ok;
  }

  function validateEmail() {
    const v = fields.email.value.trim();
    const ok = v.length > 3 && /\S+@\S+\.\S+/.test(v);
    setError(fields.email, 'email', ok ? '' : 'Enter a valid email address.');
    return ok;
  }

  function validateCode() {
    const v = fields.code.value.trim();
    const ok = v !== '';
    setError(fields.code, 'phone', ok ? '' : 'Select a country code.');
    return ok;
  }

  function validatePhone() {
    const raw = fields.phone.value.trim();
    const code = fields.code.value.trim();
    if (!raw) {
      setError(fields.phone, 'phone', 'Enter your phone number.');
      return false;
    }
    const digitsOnly = raw.replace(/[^\d]/g, '');
    const rule = phoneRules[code] || { min: 6, max: 15 };
    const ok = /^[0-9 ()-]+$/.test(raw) && digitsOnly.length >= rule.min && digitsOnly.length <= rule.max;
    setError(fields.phone, 'phone', ok ? '' : `Enter a valid phone number (${rule.min}–${rule.max} digits).`);
    return ok;
  }

  function validateSubject() {
    const v = fields.subject.value.trim();
    const ok = v.length >= 3;
    setError(fields.subject, 'subject', ok ? '' : 'Subject should be at least 3 characters.');
    return ok;
  }

  function validateMessage() {
    const v = fields.message.value.trim();
    const ok = v.length >= 10;
    setError(fields.message, 'message', ok ? '' : 'Message should be at least 10 characters.');
    return ok;
  }

  function validateConsent() {
    const ok = fields.consent.checked;
    setError(fields.consent, 'consent', ok ? '' : 'Please agree so we can contact you.');
    return ok;
  }

  // Real-time gentle validation (no red borders)
  ['input', 'change', 'blur'].forEach(evt => {
    form.addEventListener(evt, (e) => {
      const t = e.target;
      if (t === fields.name) validateName();
      if (t === fields.email) validateEmail();
      if (t === fields.code) { validateCode(); if (fields.phone.value) validatePhone(); }
      if (t === fields.phone) validatePhone();
      if (t === fields.subject) validateSubject();
      if (t === fields.message) validateMessage();
      if (t === fields.consent) validateConsent();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    const checks = [
      validateName(),
      validateEmail(),
      validateCode(),
      validatePhone(),
      validateSubject(),
      validateMessage(),
      validateConsent()
    ];

    if (checks.every(Boolean)) {
      // TODO: integrate with backend; for now just simulate success
      errBox.style.color = '#9fe5a3';
      errBox.textContent = 'Thanks! Your message has been sent.';
      form.reset();
      // Optionally default code:
      // fields.code.value = '+353';
    } else {
      errBox.style.color = '#ffb3b3';
      errBox.textContent = 'Please fix the highlighted fields above.';
    }
  });
})();
// ===== NAVBAR ACTIVE LINK HANDLER =====
// Automatically highlights the current page link in the navbar
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".navbar .nav-link");

  // Get current page filename (e.g., 'contact.html')
  let path = window.location.pathname.split("/").pop();
  if (!path || path === "") path = "index.html"; // default to home

  links.forEach(link => {
    const href = link.getAttribute("href") || "";
    const target = href.split("/").pop();

    // Clear existing actives first
    link.classList.remove("active");

    // Add 'active' if this link matches the current page
    if (
      (path === "index.html" && (target === "index.html" || target === "" || target === "#")) ||
      target === path
    ) {
      link.classList.add("active");
    }
  });
});
