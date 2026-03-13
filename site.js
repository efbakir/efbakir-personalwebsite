(function () {
  var html = document.documentElement;
  var header = document.querySelector('.header');
  var themeToggle = document.getElementById('theme-toggle');
  var cvTriggers = Array.from(document.querySelectorAll('[data-open-cv]'));
  var cvOverlay = document.getElementById('cv-overlay');

  function syncBodyScrollLock() {
    var navOpen = !!(header && header.classList.contains('nav-open'));
    var cvOpen = !!(cvOverlay && !cvOverlay.hidden);
    document.body.style.overflow = navOpen || cvOpen ? 'hidden' : '';
  }

  window.__syncBodyScrollLock = syncBodyScrollLock;

  function syncViewportLayout() {
    document.documentElement.style.setProperty('--app-vh', window.innerHeight + 'px');

    var panels = Array.from(document.querySelectorAll(
      '.panel-images, .project-detail-images, .writings-panel-list, .writings-panel-article, .glossary-panel-list, .glossary-panel-article'
    ));

    panels.forEach(function (panel) {
      var style = window.getComputedStyle(panel);
      if (style.position === 'static' || style.overflowY === 'visible' || panel.hidden) {
        panel.style.maxHeight = '';
        return;
      }

      var rect = panel.getBoundingClientRect();
      var availableHeight = Math.floor(window.innerHeight - rect.top);
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
    var panelContextItem = document.getElementById('panel-project-context-item');
    var panelContext = document.getElementById('panel-project-context');
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
        context: group.dataset.projectContext || '',
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

      if (panelContextItem && panelContext) {
        panelContext.textContent = '';
        panelContextItem.hidden = true;
      }

      if (panelTeamItem && panelTeam) {
        panelTeam.textContent = '';
        panelTeamItem.hidden = true;
      }

      if (panelMeta) {
        panelMeta.hidden = true;
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
    scheduleViewportSync();
  }

  initTheme();
  initCvOverlay();
  initHomepageLayout();
  initWritingsLayout();
  initGlossaryLayout();

  syncBodyScrollLock();
  scheduleViewportSync();
  window.addEventListener('resize', scheduleViewportSync);
  window.addEventListener('orientationchange', scheduleViewportSync);
  window.addEventListener('pageshow', scheduleViewportSync);
  window.addEventListener('load', scheduleViewportSync);
})();
