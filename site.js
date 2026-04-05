(function () {
  var html = document.documentElement;
  var header = document.querySelector('.header');
  var themeToggle = document.getElementById('theme-toggle');
  var cvTriggers = Array.from(document.querySelectorAll('[data-open-cv]'));
  var cvOverlay = document.getElementById('cv-overlay');

  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch (error) {}

  function getViewportHeight() {
    if (window.visualViewport && window.visualViewport.height) {
      return Math.round(window.visualViewport.height);
    }
    return window.innerHeight;
  }

  function clearBodyScrollLock(restoreScroll) {
    var body = document.body;
    var shouldRestoreScroll = !!restoreScroll && body.hasAttribute('data-scroll-y');
    var restoreY = shouldRestoreScroll
      ? (parseInt(body.getAttribute('data-scroll-y') || '0', 10) || 0)
      : 0;

    body.removeAttribute('data-scroll-locked');
    body.removeAttribute('data-scroll-y');
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';

    if (shouldRestoreScroll) {
      window.scrollTo(0, restoreY);
    }
  }

  function hasActiveScrollLockState() {
    var navOpen = !!(header && header.classList.contains('nav-open'));
    var cvOpen = !!(cvOverlay && !cvOverlay.hidden);
    var sectionNavOpen = document.body.classList.contains('section-nav-open');
    var lightboxOpen = document.body.classList.contains('lightbox-open');
    var launchOpen = document.body.classList.contains('launch-open');

    return navOpen || cvOpen || sectionNavOpen || lightboxOpen || launchOpen;
  }

  function syncBodyScrollLock() {
    var shouldLock = hasActiveScrollLockState();
    var body = document.body;
    var hasInlineLockStyles = body.style.position === 'fixed'
      || body.style.overflow === 'hidden'
      || !!body.style.top;
    var isLocked = body.hasAttribute('data-scroll-locked') || hasInlineLockStyles;

    if (shouldLock && !body.hasAttribute('data-scroll-locked')) {
      var scrollY = window.scrollY || window.pageYOffset || 0;
      body.setAttribute('data-scroll-locked', 'true');
      body.setAttribute('data-scroll-y', String(scrollY));
      body.style.position = 'fixed';
      body.style.top = (-scrollY) + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
    } else if (!shouldLock && isLocked) {
      clearBodyScrollLock(true);
    }
  }

  function ensureBodyUnlockedIfSafe() {
    if (!hasActiveScrollLockState()) {
      clearBodyScrollLock(false);
    }
  }

  window.__syncBodyScrollLock = syncBodyScrollLock;

  function syncViewportLayout() {
    var viewportHeight = getViewportHeight();
    document.documentElement.style.setProperty('--app-vh', viewportHeight + 'px');

    var panels = Array.from(document.querySelectorAll(
      '.panel-project-info, .panel-images, .project-detail-images, .writings-panel-list, .writings-panel-article, .glossary-panel-list, .glossary-panel-article'
    ));

    panels.forEach(function (panel) {
      /* Section list overlays (writings/glossary SEE ALL) manage their own full-viewport height in CSS; do not override */
      if (panel.classList.contains('writings-panel-list') || panel.classList.contains('glossary-panel-list')) {
        panel.style.maxHeight = '';
        return;
      }

      var style = window.getComputedStyle(panel);
      if (style.position === 'static' || style.overflowY === 'visible' || panel.hidden) {
        panel.style.maxHeight = '';
        return;
      }

      var rect = panel.getBoundingClientRect();
      var availableHeight = Math.floor(viewportHeight - rect.top);
      panel.style.maxHeight = Math.max(availableHeight, 160) + 'px';
    });
  }

  function scheduleViewportSync() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(syncViewportLayout);
    });
  }

  window.__syncViewportLayout = scheduleViewportSync;

  function normalizeTransitionElements(elements) {
    if (!Array.isArray(elements)) {
      return elements ? [elements] : [];
    }

    return elements.filter(Boolean);
  }

  function clearContentTransition(elements) {
    normalizeTransitionElements(elements).forEach(function (element) {
      element.classList.remove('is-content-transitioning-out');
      element.classList.remove('is-content-transitioning-in');
      element.removeAttribute('data-transition-direction');
    });
  }

  function setContentTransitionDirection(elements, direction) {
    var normalizedDirection = direction === 'prev' ? 'prev' : 'next';

    normalizeTransitionElements(elements).forEach(function (element) {
      element.setAttribute('data-transition-direction', normalizedDirection);
    });
  }

  function animateContentSwap(options) {
    var duration = typeof options.duration === 'number' ? options.duration : 0;
    var direction = options.direction === 'prev' ? 'prev' : 'next';
    var outgoing = normalizeTransitionElements(options.outgoing);
    var incoming = normalizeTransitionElements(options.incoming);
    var allElements = outgoing.concat(incoming);
    var beforeSwap = typeof options.beforeSwap === 'function' ? options.beforeSwap : function () {};
    var afterSwap = typeof options.afterSwap === 'function' ? options.afterSwap : function () {};

    clearContentTransition(allElements);

    if (duration <= 0) {
      beforeSwap();
      afterSwap();
      return;
    }

    setContentTransitionDirection(outgoing, direction);
    outgoing.forEach(function (element) {
      element.classList.add('is-content-transitioning-out');
    });

    window.setTimeout(function () {
      outgoing.forEach(function (element) {
        element.classList.remove('is-content-transitioning-out');
      });

      beforeSwap();
      setContentTransitionDirection(incoming, direction);

      window.requestAnimationFrame(function () {
        incoming.forEach(function (element) {
          element.classList.add('is-content-transitioning-in');
        });

        window.setTimeout(function () {
          clearContentTransition(allElements);
          afterSwap();
        }, duration);
      });
    }, duration);
  }

  function readStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      /* no-op */
    }
  }

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
    var storedTheme = readStoredTheme() || 'light';

    // Suppress transitions while applying initial theme to avoid flash
    html.classList.add('no-theme-transition');
    html.setAttribute('data-theme', storedTheme);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        html.classList.remove('no-theme-transition');
      });
    });

    if (!themeToggle) return;

    updateThemeToggle(storedTheme);

    themeToggle.addEventListener('click', function () {
      var currentTheme = html.getAttribute('data-theme');
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Trigger smooth color transition across all elements
      html.setAttribute('data-theme-transitioning', '');
      html.setAttribute('data-theme', newTheme);
      persistTheme(newTheme);
      updateThemeToggle(newTheme);

      setTimeout(function () {
        html.removeAttribute('data-theme-transitioning');
      }, 350);
    });
  }

  function initHeaderStatus() {
    var statusEls = Array.prototype.slice.call(
      document.querySelectorAll('#header-status-text, [data-header-status-text]')
    );
    if (!statusEls.length) return;

    var timeZone = 'Europe/Rome';
    var formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    function update() {
      var now = new Date();
      var text = formatter.format(now) + ' IT';
      statusEls.forEach(function (statusEl) {
        statusEl.textContent = text;
      });
    }

    update();
    setInterval(update, 1000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') update();
    });
  }

  function initLaunchAnimation() {
    var LAUNCH_KEY = 'siteLaunchSeen';
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasSeenLaunch = false;

    try {
      hasSeenLaunch = sessionStorage.getItem(LAUNCH_KEY) === '1';
    } catch (error) {
      hasSeenLaunch = false;
    }

    if (prefersReducedMotion || hasSeenLaunch) {
      return;
    }

    if (html.classList.contains('page-projects')) {
      html.setAttribute('data-home-reveal', 'pending');
    }
    html.setAttribute('data-launch-sequence', 'active');

    var mediaPool = [
      '/assets/project-thumbs/aletheai.webp',
      '/assets/project-thumbs/amazontvgether.webp',
      '/assets/project-thumbs/b%C3%B6ty.webp',
      '/assets/project-thumbs/colonist.webp?v=2',
      '/assets/project-thumbs/experimental.webp',
      '/assets/project-thumbs/hivee.webp',
      '/assets/project-thumbs/love.webp',
      '/assets/project-thumbs/martercarmen.webp',
      '/assets/project-thumbs/nathellen.webp',
      '/assets/project-thumbs/ovie.webp',
      '/assets/project-thumbs/regimeofcare.webp',
      '/assets/project-thumbs/scooty.webp',
      '/assets/project-thumbs/wardrobe.webp',
      '/assets/project-thumbs/thesis.webp'
    ];

    var overlay = document.createElement('div');
    overlay.className = 'launch-screen';
    overlay.setAttribute('aria-hidden', 'true');

    var stage = document.createElement('div');
    stage.className = 'launch-screen-stage';
    overlay.appendChild(stage);

    var cards = [];
    for (var i = 0; i < 4; i += 1) {
      var card = document.createElement('div');
      card.className = 'launch-card';

      var img = document.createElement('img');
      img.className = 'launch-card-image';
      img.alt = '';
      img.loading = 'eager';
      card.appendChild(img);

      cards.push({
        card: card,
        img: img,
        media: ''
      });
      stage.appendChild(card);
    }

    var center = document.createElement('div');
    center.className = 'launch-screen-center';

    var logo = document.createElement('div');
    logo.className = 'launch-screen-logo';
    logo.innerHTML = '<img src="/star.svg" alt="" class="launch-screen-logo-image" width="56" height="56">';
    center.appendChild(logo);

    var loading = document.createElement('div');
    loading.className = 'launch-screen-loading';
    loading.innerHTML =
      '<div class="launch-screen-loading-value">0</div>' +
      '<div class="launch-screen-loading-bar"><span class="launch-screen-loading-fill"></span></div>';
    center.appendChild(loading);
    overlay.appendChild(center);

    function shuffleMedia(items) {
      var shuffled = items.slice();

      for (var i = shuffled.length - 1; i > 0; i -= 1) {
        var swapIndex = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[swapIndex];
        shuffled[swapIndex] = temp;
      }

      return shuffled;
    }

    var queuedMedia = shuffleMedia(mediaPool);

    function getNextMedia(exclusions) {
      var excluded = exclusions || [];
      var safety = 0;

      if (!queuedMedia.length) {
        queuedMedia = shuffleMedia(mediaPool);
      }

      while (excluded.indexOf(queuedMedia[0]) !== -1 && safety < mediaPool.length * 2) {
        queuedMedia.push(queuedMedia.shift());
        safety += 1;

        if (!queuedMedia.length) {
          queuedMedia = shuffleMedia(mediaPool);
        }
      }

      return queuedMedia.shift();
    }

    function assignMedia(cardState, exclusions) {
      cardState.media = getNextMedia(exclusions);
      cardState.img.src = cardState.media;
      cardState.img.style.objectPosition = '50% 50%';
    }

    var liftDuration = 460;
    var maxCycles = 8;
    var startedCycles = 0;
    var completedCycles = 0;
    var idleQueue = cards.slice();
    var activeLifts = [];
    var progressValue = loading.querySelector('.launch-screen-loading-value');
    var progressFill = loading.querySelector('.launch-screen-loading-fill');
    var progressFrame = null;
    var progressStart = 0;
    var startDelay = 0;
    var progressDuration = 2200;
    var sequenceWindow = progressDuration - liftDuration;
    var startSchedule = Array.from({ length: maxCycles }, function (_, index) {
      if (maxCycles <= 1) return 0;
      var progress = index / (maxCycles - 1);
      return Math.round(sequenceWindow * Math.pow(progress, 0.65));
    });
    var progressComplete = false;
    var sequenceComplete = false;
    var isFinishing = false;

    cards.forEach(function (cardState, index) {
      var exclusions = cards
        .slice(0, index)
        .map(function (item) { return item.media; })
        .filter(Boolean);
      assignMedia(cardState, exclusions);
    });

    function setProgress(value) {
      var clamped = Math.max(0, Math.min(100, value));
      var ratio = clamped / 100;
      progressValue.textContent = String(Math.round(clamped));
      progressFill.style.transform = 'scaleX(' + ratio + ')';
      center.style.setProperty('--launch-star-shift', (-24 * Math.pow(ratio, 1.35)) + 'px');
    }

    function maybeFinishLaunch() {
      if (!progressComplete || !sequenceComplete || isFinishing) return;

      isFinishing = true;
      overlay.classList.add('is-exiting');
    }

    function tickProgress(timestamp) {
      if (!progressStart) progressStart = timestamp;
      var elapsed = timestamp - progressStart;
      var nextValue = (elapsed / progressDuration) * 100;

      setProgress(nextValue);

      if (nextValue < 100 && overlay.parentNode && !overlay.classList.contains('is-exiting')) {
        progressFrame = window.requestAnimationFrame(tickProgress);
      } else {
        setProgress(100);
        progressComplete = true;
        maybeFinishLaunch();
        progressFrame = null;
      }
    }

    function refreshCardOrder() {
      idleQueue.forEach(function (cardState, index) {
        cardState.card.style.zIndex = String(idleQueue.length - index);
      });

      activeLifts.forEach(function (cardState, index) {
        cardState.card.style.zIndex = String(idleQueue.length + activeLifts.length - index);
      });
    }

    function getVisibleMedia(excludeCard) {
      return cards
        .filter(function (cardState) { return cardState !== excludeCard; })
        .map(function (cardState) { return cardState.media; })
        .filter(Boolean);
    }

    function startLift() {
      if (!idleQueue.length || startedCycles >= maxCycles) return;

      var topCard = idleQueue.shift();
      topCard.card.classList.add('is-lifting');
      activeLifts.push(topCard);
      startedCycles += 1;
      refreshCardOrder();

      window.setTimeout(function () {
        topCard.card.classList.remove('is-lifting');
        activeLifts = activeLifts.filter(function (cardState) {
          return cardState !== topCard;
        });
        assignMedia(topCard, getVisibleMedia(topCard));
        idleQueue.push(topCard);
        completedCycles += 1;
        refreshCardOrder();
        if (startedCycles >= maxCycles && completedCycles >= maxCycles) {
          sequenceComplete = true;
          maybeFinishLaunch();
        }
      }, liftDuration);
    }

    document.body.appendChild(overlay);
    document.body.classList.add('launch-open');
    syncBodyScrollLock();
    setProgress(0);
    refreshCardOrder();

    window.requestAnimationFrame(function () {
      overlay.classList.add('is-visible');
      overlay.classList.add('show-logo');
      progressFrame = window.requestAnimationFrame(tickProgress);
    });

    startSchedule.forEach(function (delay) {
      window.setTimeout(function () {
        if (overlay.classList.contains('is-exiting')) return;
        startLift();
      }, startDelay + delay);
    });

    function finishLaunch() {
      if (!overlay.parentNode) return;

      try {
        sessionStorage.setItem(LAUNCH_KEY, '1');
      } catch (error) {
        /* no-op */
      }

      document.body.classList.remove('launch-open');
      syncBodyScrollLock();
      if (progressFrame) {
        window.cancelAnimationFrame(progressFrame);
      }
      overlay.remove();
      html.removeAttribute('data-launch-sequence');
      document.dispatchEvent(new Event('site:launch-complete'));
    }

    overlay.addEventListener('transitionend', function (event) {
      if (event.target === overlay && overlay.classList.contains('is-exiting')) {
        finishLaunch();
      }
    });

    window.setTimeout(function () {
      if (overlay.parentNode && !overlay.classList.contains('is-exiting')) {
        setProgress(100);
        progressComplete = true;
        sequenceComplete = true;
        maybeFinishLaunch();
      }
    }, progressDuration + 24);
  }

  function initCvOverlay() {
    if (!cvTriggers.length || !cvOverlay) return;

    var cvModal = cvOverlay.querySelector('.cv-modal');

    function openCv() {
      cvOverlay.hidden = false;
      if (cvModal) {
        // Force reflow so transition runs when class is added
        void cvModal.offsetWidth;
        cvModal.classList.add('cv-modal-visible');
      }
      syncBodyScrollLock();
    }

    function closeCv() {
      if (cvModal) {
        cvModal.classList.remove('cv-modal-visible');
        cvModal.addEventListener('transitionend', function handler() {
          cvModal.removeEventListener('transitionend', handler);
          cvOverlay.hidden = true;
          syncBodyScrollLock();
        });
      } else {
        cvOverlay.hidden = true;
        syncBodyScrollLock();
      }
    }

    cvTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', openCv);
    });

    cvOverlay.addEventListener('click', function (event) {
      if (event.target === cvOverlay) closeCv();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !cvOverlay.hidden) closeCv();
    });
  }

  function initHomepageLayout() {
    var layout = document.getElementById('homepage-layout');
    if (!layout) return;

    var panelInfo = document.getElementById('panel-project-info');
    var panelTitle = document.getElementById('panel-project-title');
    var panelYear = document.getElementById('panel-project-year');
    var panelDesc = document.getElementById('panel-project-description');
    var panelTags = document.getElementById('panel-project-tags');
    var panelMeta = document.getElementById('panel-project-meta');
    var panelTeamItem = document.getElementById('panel-project-team-item');
    var panelTeam = document.getElementById('panel-project-team');
    var panelControls = document.getElementById('panel-project-controls');
    var detailImages = document.getElementById('project-detail-images');
    var backButton = document.getElementById('project-back-btn');
    var panelImages = document.getElementById('panel-images');

    if (!panelInfo || !panelTitle || !panelYear || !panelDesc || !panelTags || !panelImages) return;

    var groups = Array.from(layout.querySelectorAll('.project-images-group'));
    if (!groups.length) return;

    var detailProjectId = 'wardrobe';

    var projectData = groups.map(function (group) {
      return {
        id: group.dataset.projectId,
        title: group.dataset.projectTitle || '',
        date: group.dataset.projectDate || '',
        description: group.dataset.projectDescription || '',
        team: group.dataset.projectTeam || '',
        tags: parseTags(group.dataset.projectTags)
      };
    });

    var currentProjectIndex = Math.max(
      0,
      projectData.findIndex(function (p) { return p.id === detailProjectId; })
    );

    function parseTags(tagString) {
      return (tagString || '').split('|').map(function (t) { return t.trim(); }).filter(Boolean);
    }

    function ensureOverviewRows() {
      groups.forEach(function (group) {
        if (group.querySelector('.project-group-info')) return;

        var info = document.createElement('div');
        info.className = 'project-group-info';

        var title = document.createElement('h3');
        title.className = 'project-group-title';
        title.textContent = group.dataset.projectTitle || '';

        var year = document.createElement('span');
        year.className = 'project-group-year';
        year.textContent = group.dataset.projectDate || '';

        var desc = document.createElement('p');
        desc.className = 'project-group-description';
        desc.textContent = group.dataset.projectDescription || '';

        var tags = document.createElement('ul');
        tags.className = 'project-group-tags';
        parseTags(group.dataset.projectTags).forEach(function (tag) {
          var li = document.createElement('li');
          li.textContent = tag;
          tags.appendChild(li);
        });

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(tags);
        info.appendChild(year);
        group.insertBefore(info, group.firstChild);
      });
    }

    function renderProjectAtIndex(index) {
      var data = projectData[index];
      var navEl = panelControls && panelControls.querySelector('.panel-project-nav');
      var prevBtn = panelControls && panelControls.querySelector('#project-prev-btn');
      var nextBtn = panelControls && panelControls.querySelector('#project-next-btn');
      var prevTitleEl = panelControls && panelControls.querySelector('.panel-project-nav-title-prev');
      var nextTitleEl = panelControls && panelControls.querySelector('.panel-project-nav-title-next');

      panelTitle.textContent = data.title;
      panelYear.textContent = data.date;
      panelDesc.textContent = data.description;
      panelTags.innerHTML = data.tags.map(function (tag) {
        return '<li>' + tag + '</li>';
      }).join('');

      if (panelTeamItem && panelTeam) {
        panelTeam.textContent = '';
        panelTeamItem.hidden = true;
      }

      if (panelMeta) {
        panelMeta.hidden = true;
      }

      if (panelTeamItem && panelTeam && data.team) {
        panelTeam.textContent = data.team;
        panelTeamItem.hidden = false;
      }

      if (
        panelMeta &&
        panelTeamItem &&
        !panelTeamItem.hidden
      ) {
        panelMeta.hidden = false;
      }

      if (prevBtn) {
        var hidePrev = index === 0;
        prevBtn.hidden = hidePrev;
        prevBtn.setAttribute('aria-hidden', hidePrev ? 'true' : 'false');
        prevBtn.tabIndex = hidePrev ? -1 : 0;
      }

      if (nextBtn) {
        var hideNext = index === projectData.length - 1;
        nextBtn.hidden = hideNext;
        nextBtn.setAttribute('aria-hidden', hideNext ? 'true' : 'false');
        nextBtn.tabIndex = hideNext ? -1 : 0;
      }

      if (navEl) {
        navEl.classList.toggle('is-next-only', index === 0);
        navEl.classList.toggle('is-prev-only', index === projectData.length - 1);
      }

      if (panelControls) {
        panelControls.setAttribute('data-current-project', data.id);
      }

      if (prevTitleEl && index > 0) {
        prevTitleEl.textContent = projectData[index - 1].title;
      }

      if (nextTitleEl && index < projectData.length - 1) {
        nextTitleEl.textContent = projectData[index + 1].title;
      }
    }

    var detailGroups = detailImages
      ? Array.prototype.slice.call(detailImages.querySelectorAll('.project-detail-group[data-project-id]'))
      : [];

    function isInDetail() {
      return layout.classList.contains('is-detail');
    }

    function showDetailGroupForId(id) {
      if (!detailGroups.length) return;
      detailGroups.forEach(function (group) {
        var isMatch = group.dataset.projectId === id;
        if (isMatch) {
          group.hidden = false;
        } else {
          group.hidden = true;
        }
      });
    }

    function enterDetail(skipPushState) {
      layout.classList.remove('is-detail-exiting');
      layout.classList.add('is-detail');
      if (detailImages) {
        detailImages.hidden = false;
        var currentId = projectData[currentProjectIndex].id;
        showDetailGroupForId(currentId);
      }
      if (panelControls) panelControls.hidden = false;
      if (!skipPushState) {
        var id = projectData[currentProjectIndex].id;
        var hash = '#project-' + id;
        history.pushState({ projectDetail: true, projectId: id }, '', (window.location.pathname || '/') + hash);
      }
      resetScrollToTop();
      scheduleViewportSync();
    }

    function exitDetail() {
      layout.classList.remove('is-detail-exiting');
      layout.classList.remove('is-detail');
      if (detailImages) detailImages.hidden = true;
      if (panelControls) panelControls.hidden = true;
      resetScrollToTop();
      scheduleViewportSync();
    }

    window.addEventListener('popstate', function () {
      if (isInDetail()) exitDetail();
    });

    panelImages.addEventListener('click', function (event) {
      var trigger = event.target.closest('.project-images-group');
      if (!trigger) return;

      var clickedIndex = projectData.findIndex(function (p) {
        return p.id === trigger.dataset.projectId;
      });
      if (clickedIndex === -1) return;

      currentProjectIndex = clickedIndex;
      renderProjectAtIndex(currentProjectIndex);
      enterDetail();
    });

    if (backButton) {
      backButton.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isInDetail()) {
          exitDetail();
        }
        history.back();
      });
    }

    var projectTransitionDuration = 180;
    var isProjectTransitioning = false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      projectTransitionDuration = 0;
    }

    function goToProjectIndex(index, skipTransition) {
      if (index < 0 || index >= projectData.length) return;
      if (isProjectTransitioning) return;

      var previousIndex = currentProjectIndex;
      var previousId = projectData[previousIndex] && projectData[previousIndex].id;
      var nextId = projectData[index] && projectData[index].id;
      var outgoingGroup = detailGroups.find(function (group) {
        return group.dataset.projectId === previousId;
      });
      var incomingGroup = detailGroups.find(function (group) {
        return group.dataset.projectId === nextId;
      });
      var direction = index < previousIndex ? 'prev' : 'next';

      if (skipTransition || projectTransitionDuration === 0) {
        currentProjectIndex = index;
        renderProjectAtIndex(currentProjectIndex);
        showDetailGroupForId(projectData[currentProjectIndex].id);
        var id = projectData[currentProjectIndex].id;
        history.replaceState({ projectDetail: true, projectId: id }, '', (window.location.pathname || '/') + '#project-' + id);
        resetScrollToTop();
        scheduleViewportSync();
        return;
      }

      isProjectTransitioning = true;
      panelInfo.classList.add('is-content-transitioning-out');
      animateContentSwap({
        duration: projectTransitionDuration,
        direction: direction,
        outgoing: [outgoingGroup],
        incoming: [incomingGroup],
        beforeSwap: function () {
          currentProjectIndex = index;
          renderProjectAtIndex(currentProjectIndex);
          showDetailGroupForId(projectData[currentProjectIndex].id);
          var id = projectData[currentProjectIndex].id;
          history.replaceState({ projectDetail: true, projectId: id }, '', (window.location.pathname || '/') + '#project-' + id);
          resetScrollToTop();
          panelInfo.classList.remove('is-content-transitioning-out');
        },
        afterSwap: function () {
          isProjectTransitioning = false;
          scheduleViewportSync();
        }
      });
    }

    if (panelControls) {
      var nextButton = panelControls.querySelector('#project-next-btn');
      var prevButtonDetail = panelControls.querySelector('#project-prev-btn');

      if (nextButton) {
        nextButton.addEventListener('click', function () {
          if (currentProjectIndex < projectData.length - 1) {
            goToProjectIndex(currentProjectIndex + 1);
          }
        });
      }

      if (prevButtonDetail) {
        prevButtonDetail.addEventListener('click', function () {
          if (currentProjectIndex > 0) {
            goToProjectIndex(currentProjectIndex - 1);
          }
        });
      }
    }

    ensureOverviewRows();
    renderProjectAtIndex(currentProjectIndex);
    if (detailImages) detailImages.hidden = true;
    if (panelControls) panelControls.hidden = true;
    scheduleViewportSync();

    if (location.hash.indexOf('#project-') === 0) {
      var hashId = location.hash.slice(1).replace('project-', '');
      var hashIndex = projectData.findIndex(function (p) { return p.id === hashId; });
      if (hashIndex >= 0) {
        currentProjectIndex = hashIndex;
        renderProjectAtIndex(currentProjectIndex);
        enterDetail(true);
      }
    }
  }

  function initHomepageEntrance() {
    if (!html.classList.contains('page-projects')) return;

    var layout = document.getElementById('homepage-layout');
    if (!layout) return;

    var prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var staticItems = [
      layout.querySelector('.panel-bio-about'),
      layout.querySelector('.panel-bio-contact'),
      layout.querySelector('.panel-bio-photo'),
      layout.querySelector('.panel-project-info')
    ].filter(Boolean);
    var groups = Array.from(layout.querySelectorAll('.project-images-group'));

    staticItems.forEach(function (item, index) {
      item.classList.add('home-reveal-item');
      item.style.setProperty('--home-reveal-delay', (index * 120) + 'ms');
    });

    groups.forEach(function (group, index) {
      group.classList.add('home-reveal-item');
      group.style.setProperty('--home-reveal-delay', (360 + Math.min(index, 6) * 90) + 'ms');
    });

    function revealHomepage() {
      window.setTimeout(function () {
        window.requestAnimationFrame(function () {
          html.setAttribute('data-home-reveal', 'ready');
        });
      }, 140);
    }

    if (prefersReducedMotion) {
      html.setAttribute('data-home-reveal', 'ready');
      return;
    }

    if (html.getAttribute('data-launch-sequence') === 'active') {
      html.setAttribute('data-home-reveal', 'pending');
      document.addEventListener('site:launch-complete', revealHomepage, { once: true });
      return;
    }

    html.removeAttribute('data-home-reveal');
  }

  function getWritingParaRevealStaggerMs() {
    try {
      var raw = window.getComputedStyle(document.documentElement)
        .getPropertyValue('--writing-para-reveal-stagger')
        .trim();
      if (!raw) return 72;
      var n = parseFloat(raw, 10);
      if (isNaN(n)) return 72;
      if (raw.indexOf('ms') !== -1) return Math.round(n);
      return Math.round(n * 1000);
    } catch (err) {
      return 72;
    }
  }

  function initWritingArticleParagraphReveal() {
    var article = document.querySelector('article.writing-article--standalone.writing-article-paras--armed');
    if (!article) return;

    var paras = Array.prototype.slice.call(
      article.querySelectorAll('p.writing-article-intro, p.writing-article-body')
    );
    if (!paras.length) return;

    var staggerMs = getWritingParaRevealStaggerMs();
    paras.forEach(function (p, index) {
      p.style.setProperty('--writing-para-reveal-delay', (index * staggerMs) + 'ms');
    });

    function startReveal() {
      window.setTimeout(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            article.classList.add('writing-article-paras--visible');
          });
        });
      }, 100);
    }

    if (html.getAttribute('data-launch-sequence') === 'active') {
      document.addEventListener('site:launch-complete', startReveal, { once: true });
      return;
    }

    startReveal();
  }

  /**
   * Writing + glossary item titles: keep the first word as authored; force every
   * letter in following words to lowercase (replaces CSS first-letter-only caps).
   */
  function initWritingGlossaryTitleCasing() {
    var selector =
      '.writing-title, .writing-article-title, .glossary-index-item-title, .glossary-list-item-title, .writing-list-item-title, .writing-article-nav-title, .glossary-article-nav-title';
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var raw = el.textContent.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
      if (!raw) continue;
      var parts = raw.split(' ');
      if (parts.length < 2) continue;
      var out = [parts[0]];
      for (var j = 1; j < parts.length; j++) {
        out.push(parts[j].toLowerCase());
      }
      var normalized = out.join(' ');
      /* Place name after em-dash-style suffix (e.g. essay locales) */
      normalized = normalized.replace(/ - milan$/i, ' - Milan');
      el.textContent = normalized;
    }
  }

  function initImageLightbox() {
    var container = document.getElementById('project-detail-images');
    if (!container) return;

    var overlay = document.createElement('div');
    overlay.className = 'image-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image fullscreen view');

    var img = document.createElement('img');
    img.className = 'image-lightbox-img';
    img.alt = '';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'image-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&#x2715;';

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    var isOpen = false;
    var clearImageTimer = null;

    function openLightbox(src, alt) {
      if (clearImageTimer) {
        window.clearTimeout(clearImageTimer);
        clearImageTimer = null;
      }
      img.src = src;
      img.alt = alt || '';
      void overlay.offsetWidth;
      overlay.classList.add('is-open');
      document.body.classList.add('lightbox-open');
      isOpen = true;
      syncBodyScrollLock();
    }

    function closeLightbox() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      isOpen = false;
      syncBodyScrollLock();
      if (clearImageTimer) {
        window.clearTimeout(clearImageTimer);
      }
      clearImageTimer = window.setTimeout(function () {
        img.src = '';
        clearImageTimer = null;
      }, 300);
    }

    container.addEventListener('click', function (e) {
      var target = e.target;
      if (
        target.tagName === 'IMG' &&
        target.classList.contains('project-flow-media-image')
      ) {
        openLightbox(target.src, target.alt);
      }
    });

    overlay.addEventListener('click', function (e) {
      if (e.target !== img) closeLightbox();
    });

    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeLightbox();
    });
  }

  initTheme();
  initLaunchAnimation();
  initCvOverlay();
  initHomepageLayout();
  initHomepageEntrance();
  initWritingArticleParagraphReveal();
  initHeaderStatus();
  initImageLightbox();
  initWritingGlossaryTitleCasing();

  syncBodyScrollLock();
  scheduleViewportSync();
  window.addEventListener('resize', scheduleViewportSync);
  window.addEventListener('orientationchange', scheduleViewportSync);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleViewportSync);
    window.visualViewport.addEventListener('scroll', scheduleViewportSync);
  }
  window.addEventListener('focus', function () {
    ensureBodyUnlockedIfSafe();
    scheduleViewportSync();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      ensureBodyUnlockedIfSafe();
      scheduleViewportSync();
    }
  });
  function resetScrollToTop() {
    window.scrollTo(0, 0);
    var writingsPanel = document.getElementById('writings-article-panel');
    var glossaryPanel = document.getElementById('glossary-article-panel');
    var projectDetailImages = document.getElementById('project-detail-images');
    if (writingsPanel) writingsPanel.scrollTop = 0;
    if (glossaryPanel) glossaryPanel.scrollTop = 0;
    if (projectDetailImages) projectDetailImages.scrollTop = 0;
  }

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      // Page restored from bfcache (e.g. browser back) — reset scroll and show content immediately
      document.documentElement.classList.add('no-page-animation');
      document.documentElement.removeAttribute('data-home-reveal');
      document.documentElement.removeAttribute('data-launch-sequence');
      var entranceEls = document.querySelectorAll('.header, .main-content, .page-content');
      Array.prototype.forEach.call(entranceEls, function (el) {
        el.style.opacity = '';
        el.style.transform = '';
      });
      var writingArticle = document.querySelector(
        'article.writing-article--standalone.writing-article-paras--armed'
      );
      if (writingArticle) {
        writingArticle.classList.add('writing-article-paras--visible');
      }
      resetScrollToTop();
    } else {
      resetScrollToTop();
    }
    ensureBodyUnlockedIfSafe();
    scheduleViewportSync();
  });
  window.addEventListener('load', function () {
    resetScrollToTop();
    ensureBodyUnlockedIfSafe();
    scheduleViewportSync();
  });
})();
