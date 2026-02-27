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
    var projectFlows = Array.from(projectsNavigator.querySelectorAll('.projects-rail .project-flow'));
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
      !projectFlows.length ||
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

    var overviewTeamFact = overviewTeam.closest
      ? overviewTeam.closest('.projects-overview-fact')
      : overviewTeam.parentElement;

    var activeFlow = null;
    var scrollRaf = 0;

    function toSummaryItems(summaryText) {
      return (summaryText || '')
        .split('|')
        .map(function (item) { return item.trim(); })
        .filter(Boolean);
    }

    function setOverviewFromFlow(flow) {
      var title = (flow.dataset.projectTitle || '').trim();
      var about = (flow.dataset.projectAbout || '').trim();
      var summaryItems = toSummaryItems(flow.dataset.projectSummary);
      var year = (flow.dataset.projectYear || '').trim();
      var team = (flow.dataset.projectTeam || '').trim();
      var image = (flow.dataset.projectImage || '').trim();
      var filename = (flow.dataset.projectFilename || '').trim();

      if (image) overviewImage.src = image;
      overviewImage.alt = title ? title + ' project preview' : 'Project preview';
      overviewFile.textContent = filename || 'PROJECT_PREVIEW';
      overviewTitle.textContent = title || 'Project';
      overviewAbout.textContent = about || 'Project overview';
      overviewYear.textContent = year || '—';

      if (overviewTeamFact) {
        var isSolo = !team || team.toLowerCase() === 'solo';
        if (isSolo) {
          overviewTeamFact.style.display = 'none';
          overviewTeam.textContent = '';
        } else {
          overviewTeamFact.style.display = '';
          overviewTeam.textContent = team;
        }
      } else {
        overviewTeam.textContent = team || '—';
      }

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

    function setActiveProject(flow) {
      if (!flow || activeFlow === flow) return;

      activeFlow = flow;
      projectFlows.forEach(function (projectFlow) {
        projectFlow.classList.toggle('is-active', projectFlow === flow);
      });
      setOverviewFromFlow(flow);
    }

    function pickProjectByEndThreshold() {
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      var switchThreshold = viewportHeight * 0.72;
      for (var i = 0; i < projectFlows.length; i += 1) {
        var rect = projectFlows[i].getBoundingClientRect();
        if (rect.bottom > switchThreshold) return projectFlows[i];
      }
      return projectFlows[projectFlows.length - 1];
    }

    function scheduleScrollSync() {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(function () {
        scrollRaf = 0;
        setActiveProject(pickProjectByEndThreshold());
      });
    }

    projectFlows.forEach(function (flow) {
      flow.addEventListener('focusin', function () {
        setActiveProject(flow);
      });
      flow.addEventListener('mouseenter', function () {
        setActiveProject(flow);
      });
      flow.addEventListener('touchstart', function () {
        setActiveProject(flow);
      }, { passive: true });
    });

    nextProjectButton.addEventListener('click', function () {
      if (!activeFlow) return;
      var currentIndex = projectFlows.indexOf(activeFlow);
      var nextIndex = (currentIndex + 1) % projectFlows.length;
      var nextProject = projectFlows[nextIndex];
      setActiveProject(nextProject);
      nextProject.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.addEventListener('scroll', scheduleScrollSync, { passive: true });
    window.addEventListener('resize', scheduleScrollSync);

    setActiveProject(projectFlows[0]);
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
