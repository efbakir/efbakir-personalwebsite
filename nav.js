(function () {
  /* DOM references for mobile nav */
  var header = document.querySelector('.header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  var sheet = document.getElementById('nav-sheet');
  var overlay = document.getElementById('nav-overlay');
  var toggleLabel = toggle ? toggle.querySelector('.nav-toggle-label') : null;

  if (!header || !toggle || !nav) return;

  function open() {
    header.classList.add('nav-open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    if (toggleLabel) toggleLabel.textContent = 'CLOSE';
    if (typeof window.__syncBodyScrollLock === 'function') {
      window.__syncBodyScrollLock();
    } else {
      document.body.style.overflow = 'hidden';
    }
    if (sheet) {
      sheet.hidden = false;
    }
    if (overlay) {
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
    }
  }
  function close() {
    header.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    if (toggleLabel) toggleLabel.textContent = 'NAVIGATE';
    if (typeof window.__syncBodyScrollLock === 'function') {
      window.__syncBodyScrollLock();
    } else {
      document.body.style.overflow = '';
    }
    if (sheet) {
      sheet.hidden = true;
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
  if (sheet) {
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) close();
    });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth > 767 && header.classList.contains('nav-open')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) close();
  });
})();
