(function () {
  var html = document.documentElement;
  var header = document.querySelector('.header');
  var themeToggle = document.getElementById('theme-toggle');
  var cvTriggers = Array.from(document.querySelectorAll('[data-open-cv]'));
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
    if (!cvTriggers.length || !cvOverlay || !cvClose) return;

    function openCv() {
      cvOverlay.hidden = false;
      syncBodyScrollLock();
    }

    function closeCv() {
      cvOverlay.hidden = true;
      syncBodyScrollLock();
    }

    cvTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', openCv);
    });
    cvClose.addEventListener('click', closeCv);

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
    var panelControls = document.getElementById('panel-project-controls');
    var detailImages = document.getElementById('project-detail-images');
    var backButton = document.getElementById('project-back-btn');
    var panelImages = document.getElementById('panel-images');

    if (!panelInfo || !panelTitle || !panelYear || !panelDesc || !panelTags || !panelImages) return;

    var groups = Array.from(layout.querySelectorAll('.project-images-group'));
    if (!groups.length) return;

    var detailProjectId = 'nat-hellen';

    function parseTags(tagString) {
      return (tagString || '').split('|').map(function (t) { return t.trim(); }).filter(Boolean);
    }

    function ensureOverviewRows() {
      groups.forEach(function (group) {
        if (group.querySelector('.project-group-info')) return;

        var info = document.createElement('div');
        info.className = 'project-group-info';

        var header = document.createElement('div');
        header.className = 'project-group-header';

        var title = document.createElement('h3');
        title.className = 'project-group-title';
        title.textContent = group.dataset.projectTitle || '';

        var year = document.createElement('span');
        year.className = 'project-group-year';
        year.textContent = group.dataset.projectYear || '';

        header.appendChild(title);
        header.appendChild(year);

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

        info.appendChild(header);
        info.appendChild(desc);
        info.appendChild(tags);
        group.insertBefore(info, group.firstChild);
      });
    }

    function enterDetail() {
      layout.classList.add('is-detail');
      if (detailImages) detailImages.hidden = false;
      if (panelControls) panelControls.hidden = false;
    }

    function exitDetail() {
      layout.classList.remove('is-detail');
      if (detailImages) detailImages.hidden = true;
      if (panelControls) panelControls.hidden = true;
    }

    panelImages.addEventListener('click', function (event) {
      var trigger = event.target.closest('.project-images-group');
      if (!trigger) return;
      if (trigger.dataset.projectId !== detailProjectId) return;
      enterDetail();
    });

    if (backButton) {
      backButton.addEventListener('click', function (e) {
        e.stopPropagation();
        exitDetail();
      });
    }

    ensureOverviewRows();
    panelTitle.textContent = 'Nat Hellen';
    panelYear.textContent = '2026';
    panelDesc.textContent = 'Created a complete brand system for Nat Hellen to support the launch of her new portfolio and ecommerce platform.';
    panelTags.innerHTML = '<li>CREATIVE DIRECTION</li><li>WEB DESIGN</li><li>BRANDING</li>';
    if (detailImages) detailImages.hidden = true;
    if (panelControls) panelControls.hidden = true;
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
      }, transitionDuration);
    }

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        activate(item.dataset.writingId);
      });
    });

    var initialItem = items.find(function (item) {
      return item.classList.contains('active');
    }) || items[0];
    activate(initialItem.dataset.writingId, true);
  }

  function initPrinciplesLayout() {
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
      }, transitionDuration);
    }

    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        activate(item.dataset.glossaryId);
      });
    });

    var initialItem = items.find(function (item) {
      return item.classList.contains('active');
    }) || items[0];
    activate(initialItem.dataset.glossaryId, true);
  }

  initTheme();
  initCvOverlay();
  initHomepageLayout();
  initWritingsLayout();
  initPrinciplesLayout();

  syncBodyScrollLock();
})();
