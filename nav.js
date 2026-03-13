(function () {
  /* DOM references for mobile nav */
  var header = document.querySelector('.header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  var overlay = document.getElementById('nav-overlay');

  function open() {
    header.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    if (typeof window.__syncBodyScrollLock === 'function') {
      window.__syncBodyScrollLock();
    } else {
      document.body.style.overflow = 'hidden';
    }
    if (overlay) {
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
    }
  }
  function close() {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    if (typeof window.__syncBodyScrollLock === 'function') {
      window.__syncBodyScrollLock();
    } else {
      document.body.style.overflow = '';
    }
    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
    }
  }
  function toggleMenu() {
    if (header.classList.contains('nav-open')) close();
    else open();
  }

  toggle.addEventListener('click', toggleMenu);
  nav.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', close);
  });
  if (overlay) {
    overlay.addEventListener('click', close);
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && header.classList.contains('nav-open')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) close();
  });
})();
