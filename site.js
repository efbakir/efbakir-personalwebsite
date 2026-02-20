(function () {
  var html = document.documentElement;
  var header = document.querySelector('.header');
  var themeToggle = document.getElementById('theme-toggle');
  var cvTrigger = document.getElementById('cv-trigger');
  var cvOverlay = document.getElementById('cv-overlay');
  var cvClose = document.getElementById('cv-close');

  function syncBodyScrollLock() {
    var navOpen = !!(header && header.classList.contains('nav-open'));
    var cvOpen = !!(cvOverlay && !cvOverlay.hidden);
    document.body.style.overflow = navOpen || cvOpen ? 'hidden' : '';
  }

  window.__syncBodyScrollLock = syncBodyScrollLock;

  function updateThemeToggle(theme) {
    if (!themeToggle) return;
    var moonLabel = themeToggle.querySelector('.theme-label:first-child');
    var sunLabel = themeToggle.querySelector('.theme-label:last-child');
    if (!moonLabel || !sunLabel) return;

    if (theme === 'dark') {
      moonLabel.classList.add('active');
      moonLabel.classList.remove('inactive');
      sunLabel.classList.add('inactive');
      sunLabel.classList.remove('active');
    } else {
      sunLabel.classList.add('active');
      sunLabel.classList.remove('inactive');
      moonLabel.classList.add('inactive');
      moonLabel.classList.remove('active');
    }
  }

  function initTheme() {
    var storedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', storedTheme);
    if (!themeToggle) return;

    updateThemeToggle(storedTheme);

    themeToggle.addEventListener('click', function () {
      var currentTheme = html.getAttribute('data-theme');
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggle(newTheme);
    });
  }

  function initCvOverlay() {
    if (!cvTrigger || !cvOverlay || !cvClose) return;

    function openCv() {
      cvOverlay.hidden = false;
      syncBodyScrollLock();
    }

    function closeCv() {
      cvOverlay.hidden = true;
      syncBodyScrollLock();
    }

    cvTrigger.addEventListener('click', openCv);
    cvClose.addEventListener('click', closeCv);

    cvOverlay.addEventListener('click', function (event) {
      if (event.target === cvOverlay) closeCv();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !cvOverlay.hidden) closeCv();
    });
  }

  function initProjectFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    var projectItems = document.querySelectorAll('.project-item');
    if (!filterBtns.length || !projectItems.length) return;

    function setFirstVisibleProject() {
      projectItems.forEach(function (item) {
        item.classList.remove('first-visible');
      });
      var firstVisible = Array.from(projectItems).find(function (item) {
        return !item.hidden;
      });
      if (firstVisible) firstVisible.classList.add('first-visible');
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.dataset.filter;

        filterBtns.forEach(function (other) {
          other.classList.remove('active');
        });
        btn.classList.add('active');

        projectItems.forEach(function (item) {
          item.hidden = !(filter === 'all' || item.dataset.type === filter);
        });

        setFirstVisibleProject();
      });
    });

    setFirstVisibleProject();
  }

  function initProjectHoverPreview() {
    var projectItems = document.querySelectorAll('.project-item');
    var hoverImage = document.getElementById('project-hover-image');
    var hoverVideo = document.getElementById('project-hover-video');
    var hoverImageInner = hoverImage ? hoverImage.querySelector('.project-hover-image-inner') : null;
    var pointerSupportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!projectItems.length || !hoverImage || !hoverVideo || !hoverImageInner || !pointerSupportsHover) return;

    function updateImagePosition(event) {
      var offsetX = 20;
      var offsetY = 20;
      var previewWidth = hoverImage.offsetWidth || 400;
      var previewHeight = hoverImage.offsetHeight || 300;
      var maxX = window.innerWidth - previewWidth - 20;
      var maxY = window.innerHeight - previewHeight - 20;
      var x = Math.max(16, Math.min(event.clientX + offsetX, maxX));
      var y = Math.max(16, Math.min(event.clientY + offsetY, maxY));

      hoverImage.style.left = x + 'px';
      hoverImage.style.top = y + 'px';
    }

    function hidePreview() {
      hoverVideo.pause();
      hoverVideo.src = '';
      hoverVideo.style.display = 'none';
      hoverImageInner.style.display = 'block';
      hoverImage.hidden = true;
      hoverImage.style.display = 'none';
    }

    projectItems.forEach(function (item) {
      item.addEventListener('mouseenter', function (event) {
        var videoSrc = (item.getAttribute('data-video') || '').trim();

        hoverImage.hidden = false;
        hoverImage.style.display = 'block';
        updateImagePosition(event);

        if (videoSrc) {
          hoverVideo.src = videoSrc;
          hoverVideo.style.display = 'block';
          hoverImageInner.style.display = 'none';
          hoverVideo.muted = true;
          hoverVideo.play().catch(function () {});
        } else {
          hoverVideo.src = '';
          hoverVideo.pause();
          hoverVideo.style.display = 'none';
          hoverImageInner.style.display = 'block';
        }
      });

      item.addEventListener('mousemove', updateImagePosition);
      item.addEventListener('mouseleave', hidePreview);
    });

    window.addEventListener('scroll', hidePreview, { passive: true });
  }

  function initGlossaryAccordion() {
    var glossaryEntries = document.querySelectorAll('.glossary-entry[data-entry]');
    if (!glossaryEntries.length) return;

    function setEntryState(entry, open) {
      var button = entry.querySelector('.glossary-term');
      var toggle = entry.querySelector('.glossary-toggle');

      entry.classList.toggle('open', open);
      if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (toggle) toggle.textContent = open ? '−' : '+';
    }

    glossaryEntries.forEach(function (entry) {
      setEntryState(entry, entry.classList.contains('open'));

      var button = entry.querySelector('.glossary-term');
      if (!button) return;

      button.addEventListener('click', function () {
        var isOpen = entry.classList.contains('open');
        glossaryEntries.forEach(function (other) {
          setEntryState(other, false);
        });
        if (!isOpen) setEntryState(entry, true);
      });
    });
  }

  initTheme();
  initCvOverlay();
  initProjectFilters();
  initProjectHoverPreview();
  initGlossaryAccordion();

  syncBodyScrollLock();
})();
