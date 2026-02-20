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

  function initProjectsNavigator() {
    var projectsNavigator = document.getElementById('projects-navigator');
    if (!projectsNavigator) return;

    var rail = document.getElementById('projects-rail');
    var projectItems = Array.from(projectsNavigator.querySelectorAll('.projects-rail .project-item'));
    var overviewImage = document.getElementById('projects-overview-image');
    var overviewFile = document.getElementById('projects-overview-file');
    var overviewTitle = document.getElementById('projects-overview-title');
    var overviewAbout = document.getElementById('projects-overview-about');
    var overviewSummary = document.getElementById('projects-overview-summary');
    var overviewYear = document.getElementById('projects-overview-year');
    var overviewTeam = document.getElementById('projects-overview-team');
    var nextProjectButton = document.getElementById('projects-overview-next');

    if (
      !rail ||
      !projectItems.length ||
      !overviewImage ||
      !overviewFile ||
      !overviewTitle ||
      !overviewAbout ||
      !overviewSummary ||
      !overviewYear ||
      !overviewTeam ||
      !nextProjectButton
    ) {
      return;
    }

    var activeItem = null;
    var observer = null;
    var intersectionRatios = new Map();
    var scrollRaf = 0;

    function toSummaryItems(summaryText) {
      return (summaryText || '')
        .split('|')
        .map(function (item) { return item.trim(); })
        .filter(Boolean);
    }

    function setOverviewFromItem(item) {
      var title = (item.dataset.projectTitle || '').trim();
      var about = (item.dataset.projectAbout || '').trim();
      var summaryItems = toSummaryItems(item.dataset.projectSummary);
      var year = (item.dataset.projectYear || '').trim();
      var team = (item.dataset.projectTeam || '').trim();
      var image = (item.dataset.projectImage || '').trim();
      var filename = (item.dataset.projectFilename || '').trim();

      if (image) overviewImage.src = image;
      overviewImage.alt = title ? title + ' project preview' : 'Project preview';
      overviewFile.textContent = filename || 'PROJECT_PREVIEW';
      overviewTitle.textContent = title || 'Project';
      overviewAbout.textContent = about || 'Project overview';
      overviewYear.textContent = year || '—';
      overviewTeam.textContent = team || '—';

      overviewSummary.innerHTML = '';
      if (!summaryItems.length) {
        var emptyItem = document.createElement('li');
        emptyItem.textContent = 'No summary available.';
        overviewSummary.appendChild(emptyItem);
        return;
      }
      summaryItems.forEach(function (summaryItem) {
        var listItem = document.createElement('li');
        listItem.textContent = summaryItem;
        overviewSummary.appendChild(listItem);
      });
    }

    function setActiveProject(item) {
      if (!item || activeItem === item) return;

      activeItem = item;
      projectItems.forEach(function (projectItem) {
        projectItem.classList.toggle('is-active', projectItem === item);
      });
      setOverviewFromItem(item);
    }

    function getItemScore(item) {
      var rect = item.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      var visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      var visibility = Math.max(0, visibleHeight) / Math.max(1, Math.min(rect.height, viewportHeight));
      var ratio = intersectionRatios.get(item) || visibility;
      var viewportCenter = viewportHeight / 2;
      var itemCenter = rect.top + rect.height / 2;
      var centerDistance = Math.abs(viewportCenter - itemCenter);
      var centerScore = Math.max(0, 1 - centerDistance / viewportCenter);
      return (ratio * 0.65) + (visibility * 0.2) + (centerScore * 0.15);
    }

    function pickBestVisibleItem() {
      var bestItem = null;
      var bestScore = -1;
      projectItems.forEach(function (item) {
        var score = getItemScore(item);
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      });
      return bestItem || projectItems[0];
    }

    function scheduleScrollSync() {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(function () {
        scrollRaf = 0;
        setActiveProject(pickBestVisibleItem());
      });
    }

    function initIntersectionTracking() {
      if (!('IntersectionObserver' in window)) {
        window.addEventListener('scroll', scheduleScrollSync, { passive: true });
        window.addEventListener('resize', scheduleScrollSync);
        return;
      }

      var thresholds = [];
      for (var i = 0; i <= 10; i += 1) thresholds.push(i / 10);

      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          intersectionRatios.set(entry.target, entry.intersectionRatio);
        });
        scheduleScrollSync();
      }, {
        root: null,
        rootMargin: '-12% 0px -12% 0px',
        threshold: thresholds
      });

      projectItems.forEach(function (item) {
        observer.observe(item);
      });

      window.addEventListener('resize', scheduleScrollSync);
    }

    projectItems.forEach(function (item) {
      item.addEventListener('focusin', function () {
        setActiveProject(item);
      });
      item.addEventListener('mouseenter', function () {
        setActiveProject(item);
      });
      item.addEventListener('touchstart', function () {
        setActiveProject(item);
      }, { passive: true });
      item.addEventListener('click', function () {
        setActiveProject(item);
      });
    });

    nextProjectButton.addEventListener('click', function () {
      if (!activeItem) return;
      var currentIndex = projectItems.indexOf(activeItem);
      var nextIndex = (currentIndex + 1) % projectItems.length;
      var nextProject = projectItems[nextIndex];
      setActiveProject(nextProject);
      nextProject.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try {
        nextProject.focus({ preventScroll: true });
      } catch (error) {
        nextProject.focus();
      }
    });

    setActiveProject(projectItems[0]);
    initIntersectionTracking();
    scheduleScrollSync();
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
  initProjectsNavigator();
  initGlossaryAccordion();

  syncBodyScrollLock();
})();
