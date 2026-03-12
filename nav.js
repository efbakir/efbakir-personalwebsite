(function () {
  /* ── Nav order for direction logic ── */
  var NAV_ORDER = ['/', '/writings/', '/glossary/'];

  function currentIndex() {
    var path = window.location.pathname.replace(/\/?$/, '/');
    // normalise trailing slash
    for (var i = 0; i < NAV_ORDER.length; i++) {
      if (path === NAV_ORDER[i] || path.startsWith(NAV_ORDER[i])) return i;
    }
    return 0;
  }

  /* ── Sliding nav pill ── */
  function initPill(nav) {
    var links = nav.querySelectorAll('a.nav-link');
    var pill = document.createElement('span');
    pill.className = 'nav-pill';
    nav.insertBefore(pill, nav.firstChild);

    function positionPill(target, animate) {
      if (!animate) pill.style.transition = 'none';
      var navRect = nav.getBoundingClientRect();
      var tRect   = target.getBoundingClientRect();
      pill.style.left  = (tRect.left - navRect.left) + 'px';
      pill.style.width = tRect.width + 'px';
      if (!animate) {
        // force reflow then re-enable transition
        pill.offsetWidth;
        pill.style.transition = '';
      }
    }

    var activeLink = nav.querySelector('a.nav-link.active');
    if (activeLink) positionPill(activeLink, false);

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        positionPill(link, true);
      });
    });

    nav.addEventListener('mouseleave', function () {
      if (activeLink) positionPill(activeLink, true);
    });
  }

  /* ── Page enter animation ── */
  var fromIndex = parseInt(sessionStorage.getItem('navFromIndex') || '-1', 10);
  var toIndex   = currentIndex();
  sessionStorage.removeItem('navFromIndex');

  if (fromIndex === -1 || fromIndex === toIndex) {
    document.body.classList.add('page-entering-right');
  } else if (fromIndex < toIndex) {
    document.body.classList.add('page-entering-right');
  } else {
    document.body.classList.add('page-entering-left');
  }

  /* ── Intercept nav-link clicks → exit animation then navigate ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a.nav-link');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || link.classList.contains('active') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    var from = currentIndex();
    var to   = NAV_ORDER.indexOf(href);
    sessionStorage.setItem('navFromIndex', from);

    var exitClass = (from < to) ? 'page-exiting-left' : 'page-exiting-right';
    document.body.classList.add(exitClass);

    setTimeout(function () {
      window.location.href = href;
    }, 200);
  });

  var header = document.querySelector('.header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  var overlay = document.getElementById('nav-overlay');
  if (!header || !toggle || !nav) return;

  initPill(nav);

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
