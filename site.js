(function () {
  var html = document.documentElement;
  var header = document.querySelector('.header');
  var themeToggle = document.getElementById('theme-toggle');
  var cvTriggers = Array.from(document.querySelectorAll('[data-open-cv]'));
  var cvOverlay = document.getElementById('cv-overlay');

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

  function syncBodyScrollLock() {
    var navOpen = !!(header && header.classList.contains('nav-open'));
    var cvOpen = !!(cvOverlay && !cvOverlay.hidden);
    var sectionNavOpen = document.body.classList.contains('section-nav-open');
    var shouldLock = navOpen || cvOpen || sectionNavOpen;
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

  window.__syncBodyScrollLock = syncBodyScrollLock;

  function syncViewportLayout() {
    var viewportHeight = getViewportHeight();
    document.documentElement.style.setProperty('--app-vh', viewportHeight + 'px');

    var panels = Array.from(document.querySelectorAll(
      '.panel-images, .project-detail-images, .writings-panel-list, .writings-panel-article, .glossary-panel-list, .glossary-panel-article'
    ));

    panels.forEach(function (panel) {
      /* Section list overlays (writings/glossary SEE ALL) use CSS max-height: 50vh and scroll; do not override */
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

  function initHeaderStatus() {
    var statusEls = Array.prototype.slice.call(
      document.querySelectorAll('#header-status-text, [data-header-status-text]')
    );
    if (!statusEls.length) return;

    function formatTime(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      var displayHours = hours % 12;
      if (displayHours === 0) displayHours = 12;
      var seconds = date.getSeconds();
      var minutesStr = minutes < 10 ? '0' + minutes : String(minutes);
      var secondsStr = seconds < 10 ? '0' + seconds : String(seconds);
      return displayHours + ':' + minutesStr + ':' + secondsStr + ' ' + ampm;
    }

function update() {
      var now = new Date();
      var text = formatTime(now) + ' IT';
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
      }
      cvOverlay.hidden = true;
      syncBodyScrollLock();
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
      scheduleViewportSync();
    }

    function exitDetail() {
      layout.classList.remove('is-detail-exiting');
      layout.classList.remove('is-detail');
      if (detailImages) detailImages.hidden = true;
      if (panelControls) panelControls.hidden = true;
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

    if (panelControls) {
      var nextButton = panelControls.querySelector('#project-next-btn');
      var prevButtonDetail = panelControls.querySelector('#project-prev-btn');

      if (nextButton) {
        nextButton.addEventListener('click', function () {
          if (currentProjectIndex < projectData.length - 1) {
            currentProjectIndex += 1;
            renderProjectAtIndex(currentProjectIndex);
          }
        });
      }

      if (prevButtonDetail) {
        prevButtonDetail.addEventListener('click', function () {
          if (currentProjectIndex > 0) {
            currentProjectIndex -= 1;
            renderProjectAtIndex(currentProjectIndex);
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

  function initWritingsLayout() {
    var list = document.getElementById('writings-list');
    var articlePanel = document.getElementById('writings-article-panel');
    if (!list || !articlePanel) return;

    var items = Array.from(list.querySelectorAll('.writing-list-item'));
    var articles = Array.from(articlePanel.querySelectorAll('.writing-article'));
    if (!items.length || !articles.length) return;

    var transitionDuration = 150;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      articlePanel.style.transition = 'none';
      transitionDuration = 0;
    }

    function activate(id, skipTransition) {
      // Update list items
      items.forEach(function (item) {
        item.classList.toggle('active', item.dataset.writingId === id);
      });

      // Swap article with fade
      if (skipTransition || transitionDuration === 0) {
        articles.forEach(function (article) {
          article.hidden = (article.id !== 'article-' + id);
        });
        articlePanel.scrollTop = 0;
        articlePanel.style.opacity = '1';
        closeSectionNavigator('writings-nav-toggle', list);
        scheduleViewportSync();
        return;
      }

      articlePanel.style.opacity = '0';
      articlePanel.style.transition = transitionDuration > 0
        ? 'opacity ' + transitionDuration + 'ms ease'
        : 'none';

      setTimeout(function () {
        articles.forEach(function (article) {
          var articleId = 'article-' + article.id.replace('article-', '');
          article.hidden = (article.id !== 'article-' + id);
        });
        articlePanel.scrollTop = 0;
        articlePanel.style.opacity = '1';
        closeSectionNavigator('writings-nav-toggle', list);
        scheduleViewportSync();
      }, transitionDuration);
    }

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        activate(item.dataset.writingId);
      });
    });

    var navButtons = Array.from(articlePanel.querySelectorAll('.writing-article-nav-item[data-writing-id]'));
    navButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(btn.dataset.writingId);
      });
    });

    var initialItem = items.find(function (item) {
      return item.classList.contains('active');
    }) || items[0];
    activate(initialItem.dataset.writingId, true);
    initSectionNavigator('writings-nav-toggle', list);
    scheduleViewportSync();
  }

  function initGlossaryLayout() {
    var list = document.getElementById('glossary-list');
    var articlePanel = document.getElementById('glossary-article-panel');
    if (!list || !articlePanel) return;

    var items = Array.from(list.querySelectorAll('.glossary-list-item'));
    var articles = Array.from(articlePanel.querySelectorAll('.glossary-article'));
    if (!items.length || !articles.length) return;

    var transitionDuration = 150;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      articlePanel.style.transition = 'none';
      transitionDuration = 0;
    }

    function activate(id, skipTransition) {
      items.forEach(function (item) {
        item.classList.toggle('active', item.dataset.glossaryId === id);
      });

      if (skipTransition || transitionDuration === 0) {
        articles.forEach(function (article) {
          article.hidden = (article.id !== 'glossary-article-' + id);
        });
        articlePanel.scrollTop = 0;
        articlePanel.style.opacity = '1';
        closeSectionNavigator('glossary-nav-toggle', list);
        scheduleViewportSync();
        return;
      }

      articlePanel.style.opacity = '0';
      articlePanel.style.transition = transitionDuration > 0
        ? 'opacity ' + transitionDuration + 'ms ease'
        : 'none';

      setTimeout(function () {
        articles.forEach(function (article) {
          article.hidden = (article.id !== 'glossary-article-' + id);
        });
        articlePanel.scrollTop = 0;
        articlePanel.style.opacity = '1';
        closeSectionNavigator('glossary-nav-toggle', list);
        scheduleViewportSync();
      }, transitionDuration);
    }

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        activate(item.dataset.glossaryId);
      });
    });

    var navButtons = Array.from(articlePanel.querySelectorAll('.glossary-article-nav-item[data-glossary-id]'));
    navButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(btn.dataset.glossaryId);
      });
    });

    var initialItem = items.find(function (item) {
      return item.classList.contains('active');
    }) || items[0];
    activate(initialItem.dataset.glossaryId, true);
    initSectionNavigator('glossary-nav-toggle', list);
    scheduleViewportSync();
  }

  function closeSectionNavigator(toggleId, listEl) {
    var toggle = document.getElementById(toggleId);
    if (!toggle || !listEl) return;
    toggle.setAttribute('aria-expanded', 'false');
    listEl.classList.remove('is-open');
    document.body.classList.remove('section-nav-open');
    var overlay = listEl.parentElement && listEl.parentElement.querySelector('.section-list-overlay');
    if (overlay) {
      overlay.setAttribute('hidden', '');
      overlay.setAttribute('aria-hidden', 'true');
    }
    syncBodyScrollLock();
  }

  function initSectionNavigator(toggleId, listEl) {
    var toggle = document.getElementById(toggleId);
    if (!toggle || !listEl) return;

    var overlay = listEl.parentElement && listEl.parentElement.querySelector('.section-list-overlay');

    function syncForViewport() {
      if (window.innerWidth > 767) {
        listEl.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('section-nav-open');
        if (overlay) {
          overlay.setAttribute('hidden', '');
          overlay.setAttribute('aria-hidden', 'true');
        }
        syncBodyScrollLock();
      }
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      listEl.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('section-nav-open', !isOpen);
      if (overlay) {
        if (isOpen) {
          overlay.setAttribute('hidden', '');
          overlay.setAttribute('aria-hidden', 'true');
        } else {
          overlay.removeAttribute('hidden');
          overlay.setAttribute('aria-hidden', 'false');
        }
      }
      syncBodyScrollLock();
      scheduleViewportSync();
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        closeSectionNavigator(toggleId, listEl);
      });
    }

    var closeButtons = Array.from(listEl.querySelectorAll('[data-section-nav-close]'));
    closeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        closeSectionNavigator(toggleId, listEl);
      });
    });

    listEl.addEventListener('click', function (e) {
      if (e.target === listEl) {
        closeSectionNavigator(toggleId, listEl);
      }
    });

    window.addEventListener('resize', syncForViewport);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeSectionNavigator(toggleId, listEl);
      }
    });

    syncForViewport();
  }

  function initCurrentWorkTooltip() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    var list = document.querySelector('.panel-current-work .current-work-list');
    if (!list) return;
    var tooltip = document.createElement('div');
    tooltip.className = 'current-work-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltip);
    var offset = 12;
    var cards = list.querySelectorAll('.current-work-card');
    cards.forEach(function (card) {
      if (card.querySelector('.current-work-link')) return;
      var descEl = card.querySelector('.current-work-description');
      if (!descEl) return;
      card.addEventListener('mouseenter', function (e) {
        tooltip.textContent = descEl.textContent.trim();
        tooltip.classList.add('is-visible');
        tooltip.style.left = (e.clientX + offset) + 'px';
        tooltip.style.top = (e.clientY + offset) + 'px';
      });
      card.addEventListener('mousemove', function (e) {
        tooltip.style.left = (e.clientX + offset) + 'px';
        tooltip.style.top = (e.clientY + offset) + 'px';
      });
      card.addEventListener('mouseleave', function () {
        tooltip.classList.remove('is-visible');
      });
    });
  }

  function initSectionListSearch() {
    var writingsSearch = document.getElementById('writings-search');
    var writingsList = document.getElementById('writings-list');
    var glossarySearch = document.getElementById('glossary-search');
    var glossaryList = document.getElementById('glossary-list');

    function filterList(listEl, query, itemSelector, titleSelector, bodySelector) {
      if (!listEl) return;
      var items = listEl.querySelectorAll(itemSelector);
      var q = (query || '').trim().toLowerCase();
      items.forEach(function (item) {
        var titleEl = item.querySelector(titleSelector);
        var bodyEl = item.querySelector(bodySelector);
        var title = titleEl ? titleEl.textContent : '';
        var body = bodyEl ? bodyEl.textContent : '';
        var match = !q || title.toLowerCase().indexOf(q) !== -1 || body.toLowerCase().indexOf(q) !== -1;
        item.hidden = !match;
      });
    }

    if (writingsSearch && writingsList) {
      writingsSearch.addEventListener('input', function () {
        filterList(writingsList, writingsSearch.value, '.writing-list-item', '.writing-list-item-title', '.writing-list-item-excerpt');
      });
    }
    if (glossarySearch && glossaryList) {
      glossarySearch.addEventListener('input', function () {
        filterList(glossaryList, glossarySearch.value, '.glossary-list-item', '.glossary-list-item-title', '.glossary-list-item-definition');
      });
    }
  }

  initTheme();
  initCvOverlay();
  initHomepageLayout();
  initWritingsLayout();
  initGlossaryLayout();
  initSectionListSearch();
  initCurrentWorkTooltip();
  initHeaderStatus();

  syncBodyScrollLock();
  scheduleViewportSync();
  window.addEventListener('resize', scheduleViewportSync);
  window.addEventListener('orientationchange', scheduleViewportSync);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleViewportSync);
    window.visualViewport.addEventListener('scroll', scheduleViewportSync);
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      // Page restored from bfcache — force-clear any stale scroll lock
      clearBodyScrollLock(false);
    }
    scheduleViewportSync();
  });
  window.addEventListener('load', scheduleViewportSync);
})();
