// YouTube Action Buttons v4 — Complete watch page DOM restructure
(function() {
  'use strict';

  var DONE_FLAG = 'yt-v4-done';
  var lastUrl = location.href;

  // ===== SVG ICONS (white, stroke-based for consistency) =====
  var ICONS = {
    like: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    dislike: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2 2h-3"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="16 6 12 2 8 6"/><line fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" x1="12" y1="2" x2="12" y2="15"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="7 10 12 15 17 10"/><line fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" x1="12" y1="15" x2="12" y2="3"/></svg>',
    save: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    more: '<svg viewBox="0 0 24 24" width="20" height="20"><circle fill="currentColor" cx="12" cy="5" r="2"/><circle fill="currentColor" cx="12" cy="12" r="2"/><circle fill="currentColor" cx="12" cy="19" r="2"/></svg>'
  };

  // ===== UTILITY =====
  function el(tag, cls, html, id) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (id) e.id = id;
    if (html) e.innerHTML = html;
    return e;
  }

  function getNum(str) {
    var m = (str || '').match(/[\d,.]+/);
    return m ? m[0] : '';
  }

  // ===== FIX SUBSCRIBE DOUBLE-CLICK =====
  function fixSubscribe(subBtn) {
    if (!subBtn || subBtn.dataset.ytFixed) return;
    subBtn.dataset.ytFixed = '1';

    subBtn.addEventListener('click', function(e) {
      if (subBtn.dataset.ytBusy === '1') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      subBtn.dataset.ytBusy = '1';
      subBtn.style.opacity = '0.6';
      subBtn.style.pointerEvents = 'none';
      setTimeout(function() {
        subBtn.dataset.ytBusy = '0';
        subBtn.style.opacity = '1';
        subBtn.style.pointerEvents = 'auto';
      }, 1000);
    }, true);
  }

  // ===== HIDE UNWANTED DOM ELEMENTS (backup for CSS) =====
  function hideUnwanted() {
    // Hide links by content
    document.querySelectorAll('a').forEach(function(a) {
      var href = a.getAttribute('href') || '';
      var text = (a.textContent || '').trim();
      if (href.includes('youtube.com/watch') ||
          href.includes('redirect.invidious.io') ||
          text === 'Ver en YouTube' ||
          text === 'Insertar' ||
          text === 'Cambiar Instancia' ||
          text === 'Cambiar Instancia de Invidious' ||
          text === 'Enlace para Insertar' ||
          text === 'Mostrar anotaciones' ||
          text === 'Modo de audio') {
        var p = a.closest('p,span,div');
        if (p && (p.id === 'watch-on-youtube' || p.id === 'embed-link' ||
            p.id === 'annotations' || p.id === 'watch-on-another-invidious-instance' ||
            p.id === 'link-iv-listen')) {
          p.style.display = 'none';
        }
        a.style.display = 'none';
      }
    });

    // Hide annotation checkbox area
    ['watch-on-youtube', 'embed-link', 'annotations',
     'watch-on-another-invidious-instance', 'link-iv-listen'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; }
    });

    // Hide download form on watch page
    var leftCol = document.querySelector('.pure-u-1.pure-u-lg-1-5');
    if (leftCol && document.getElementById('player-container')) {
      var form = leftCol.querySelector('form.pure-form-stacked');
      if (form) form.style.display = 'none';
    }
  }

  // ===== RESTRUCTURE WATCH PAGE =====
  function restructureWatchPage() {
    if (!document.getElementById('player-container')) return;

    // Find the action row parent: .pure-g.h-box.flexible.title
    var titleFlex = document.querySelector('.pure-g.h-box.flexible.title');
    if (!titleFlex) {
      // Fallback: try to find the area after the title
      var h1 = document.querySelector('.h-box h1');
      if (h1) {
        // Look for the next pure-g containing channel profile
        var nextPG = h1.closest('.h-box').nextElementSibling;
        if (nextPG && nextPG.classList.contains('pure-g')) {
          var mainCol = nextPG.querySelector('.pure-u-lg-3-5');
          if (mainCol) {
            titleFlex = mainCol.querySelector('.pure-g.h-box.flexible.title');
          }
        }
      }
    }

    if (!titleFlex) return;
    if (titleFlex.querySelector('.yt-action-row')) return; // Already done

    // ---- Extract data ----

    // Channel avatar & name
    var channelProfile = titleFlex.querySelector('.channel-profile');
    var channelImg = channelProfile ? channelProfile.querySelector('img') : null;
    var channelNameEl = document.getElementById('channel-name');
    var channelName = channelNameEl ? channelNameEl.textContent.replace(/[✓✔].*/, '').trim() : '';
    var channelLink = channelProfile ? channelProfile.closest('a') : null;
    var channelHref = channelLink ? channelLink.getAttribute('href') : '';

    // Subscribe button
    var subscribeBtn = document.getElementById('subscribe');
    var subscribeClone = subscribeBtn ? subscribeBtn.cloneNode(true) : null;
    if (subscribeClone) {
      subscribeClone.removeAttribute('id');
      subscribeClone.classList.add('yt-subscribe-btn');
    }

    // Views, likes, dislikes from left column
    var viewsEl = document.getElementById('views');
    var likesEl = document.getElementById('likes');
    var dislikesEl = document.getElementById('dislikes');

    var viewsText = viewsEl ? getNum(viewsEl.textContent) : '';
    var likesText = likesEl ? getNum(likesEl.textContent) : '';
    var dislikesText = dislikesEl ? getNum(dislikesEl.textContent) : '';

    // Published date
    var dateEl = document.getElementById('published-date');
    var dateText = dateEl ? dateEl.textContent.replace(/Compartido\s*/i, '').trim() : '';

    // ---- Build views row (below title, above action bar) ----
    var viewsRow = el('div', 'yt-views-row', '');
    if (viewsText) {
      viewsRow.innerHTML = '<span>' + viewsText + ' visualizaciones</span>';
      if (dateText) {
        viewsRow.innerHTML += '<span>·</span><span>' + dateText + '</span>';
      }
    } else if (dateText) {
      viewsRow.innerHTML = '<span>' + dateText + '</span>';
    }

    // ---- Build Action Row ----
    var actionRow = el('div', 'yt-action-row', '');

    // Channel info section
    var channelInfo = el('div', 'yt-channel-info', '');
    if (channelImg) {
      var imgClone = channelImg.cloneNode(true);
      imgClone.width = 40;
      imgClone.height = 40;
      if (channelHref) {
        var a = el('a', '', '');
        a.href = channelHref;
        a.appendChild(imgClone);
        channelInfo.appendChild(a);
      } else {
        channelInfo.appendChild(imgClone);
      }
    }
    var channelText = el('div', 'yt-channel-text', '');
    var nameSpan = el('span', 'yt-channel-name', channelName || 'Canal');
    channelText.appendChild(nameSpan);
    if (viewsText) {
      var subsSpan = el('span', 'yt-channel-subs', viewsText + ' visualizaciones');
      channelText.appendChild(subsSpan);
    }
    channelInfo.appendChild(channelText);
    actionRow.appendChild(channelInfo);

    // Subscribe button
    if (subscribeClone) {
      subscribeClone.style.margin = '0';
      actionRow.appendChild(subscribeClone);
      fixSubscribe(subscribeClone);
    }

    // Actions section (like, dislike, share, download, save, more)
    var actionsSection = el('div', 'yt-actions-section', '');

    // Like/Dislike bar
    var likeBar = el('div', 'yt-like-bar', '');
    var likeBtn = el('button', 'yt-like-btn', ICONS.like + ' <span>' + (likesText || '') + '</span>');
    var dislikeBtn = el('button', 'yt-dislike-btn', ICONS.dislike + (dislikesText ? ' <span>' + dislikesText + '</span>' : ''));
    likeBar.appendChild(likeBtn);
    likeBar.appendChild(dislikeBtn);
    actionsSection.appendChild(likeBar);

    // Share button
    var shareBtn = el('button', 'yt-action-btn', ICONS.share + ' <span>Compartir</span>', 'yt-share-btn');
    actionsSection.appendChild(shareBtn);

    // Download button
    var dlBtn = el('button', 'yt-action-btn', ICONS.download + ' <span>Descargar</span>', 'yt-dl-btn');
    actionsSection.appendChild(dlBtn);

    // Save button
    var saveBtn = el('button', 'yt-action-btn', ICONS.save + ' <span>Guardar</span>', 'yt-save-btn');
    actionsSection.appendChild(saveBtn);

    // More button
    var moreBtn = el('button', 'yt-more-btn', ICONS.more, 'yt-more-btn');
    actionsSection.appendChild(moreBtn);

    actionRow.appendChild(actionsSection);

    // ---- Insert into DOM ----
    // Clear the titleFlex container and replace with our action row
    // But first, we need to place the views row BETWEEN the title h1 and action row

    var h1El = document.querySelector('.h-box h1');
    var titleBox = h1El ? h1El.closest('.h-box') : null;

    // Clear the old titleFlex
    titleFlex.innerHTML = '';
    titleFlex.style.display = 'block';
    titleFlex.classList.remove('flexible', 'title');

    // Insert views row
    if (viewsRow.innerHTML) {
      titleFlex.appendChild(viewsRow);
    }

    // Insert action row
    titleFlex.appendChild(actionRow);

    // ---- Wire up button actions ----
    var videoId = (location.search.match(/v=([^&]+)/) || [])[1] || '';
    var videoUrl = location.href;

    // Like button
    likeBtn.addEventListener('click', function() {
      fetch('/watch_ajax?action_mark_liked=1&id=' + videoId, { method: 'POST' })
        .catch(function() {});
    });

    // Dislike button
    dislikeBtn.addEventListener('click', function() {
      fetch('/watch_ajax?action_mark_disliked=1&id=' + videoId, { method: 'POST' })
        .catch(function() {});
    });

    // Share: copy URL
    shareBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(videoUrl).then(function() {
        var span = shareBtn.querySelector('span');
        if (span) span.textContent = '¡Copiado!';
        setTimeout(function() {
          if (span) span.textContent = 'Compartir';
        }, 2000);
      }).catch(function() {
        prompt('Copiar enlace:', videoUrl);
      });
    });

    // Download
    dlBtn.addEventListener('click', function() {
      window.open('/latest_version?id=' + videoId + '&itag=18&local=true', '_blank');
    });

    // Save to Watch Later
    saveBtn.addEventListener('click', function() {
      var fd = new FormData();
      fd.append('action_add_video', '1');
      fd.append('video_id', videoId);
      fd.append('playlist_id', 'WL');
      fetch('/playlist_ajax', { method: 'POST', body: fd }).then(function(resp) {
        if (resp.ok) {
          var span = saveBtn.querySelector('span');
          if (span) span.textContent = 'Guardado';
        }
      }).catch(function() {});
    });

    // More: toggle a small menu with additional options
    moreBtn.addEventListener('click', function() {
      var existing = document.getElementById('yt-more-menu');
      if (existing) { existing.remove(); return; }

      var menu = el('div', '', '', 'yt-more-menu');
      menu.style.cssText = 'position:absolute;background:var(--yt-badge, #272741);border:1px solid var(--yt-border, #1d1d35);border-radius:12px;padding:8px 0;z-index:200;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,.5);color:var(--yt-text-primary, #fff);font-size:14px;';

      var items = [
        { text: '📋 Copiar enlace', action: function() {
          navigator.clipboard.writeText(videoUrl);
          menu.remove();
        }},
        { text: '📥 Descargar (mejor calidad)', action: function() {
          window.open('/latest_version?id=' + videoId + '&itag=22&local=true', '_blank');
          menu.remove();
        }},
        { text: '🎵 Solo audio', action: function() {
          window.open('/latest_version?id=' + videoId + '&itag=140&local=true', '_blank');
          menu.remove();
        }}
      ];

      items.forEach(function(item) {
        var mi = el('div', '', item.text);
        mi.style.cssText = 'padding:8px 16px;cursor:pointer;white-space:nowrap;';
        mi.addEventListener('mouseenter', function() { mi.style.background = 'var(--yt-card-hover, #23233b)'; });
        mi.addEventListener('mouseleave', function() { mi.style.background = 'transparent'; });
        mi.addEventListener('click', item.action);
        menu.appendChild(mi);
      });

      document.body.appendChild(menu);
      var rect = moreBtn.getBoundingClientRect();
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.left = Math.min(rect.right - 180, window.innerWidth - 190) + 'px';

      // Close on outside click
      setTimeout(function() {
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target) && e.target !== moreBtn) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 10);
    });

    // ---- Cleanup: hide original left column elements ----
    hideUnwanted();

    // Hide the left column entirely
    var leftCols = document.querySelectorAll('.pure-u-1.pure-u-lg-1-5');
    if (leftCols.length > 1) {
      leftCols[0].style.display = 'none';
    }
  }

  // ===== STYLE DYNAMICALLY LOADED COMMENTS =====
  function styleComments() {
    var commentsDiv = document.getElementById('comments');
    if (!commentsDiv || commentsDiv.dataset.ytStyled) return;
    commentsDiv.dataset.ytStyled = '1';

    // Observe for dynamically loaded comments
    var observer = new MutationObserver(function() {
      var kids = commentsDiv.children;
      for (var i = 0; i < kids.length; i++) {
        var kid = kids[i];
        if (kid.tagName === 'DIV' && !kid.style.borderBottom) {
          kid.style.marginBottom = '16px';
          kid.style.paddingBottom = '14px';
          kid.style.borderBottom = '1px solid var(--yt-border, #1d1d35)';
        }
      }
    });
    observer.observe(commentsDiv, { childList: true, subtree: false });
  }

  function enhanceMobileComments() {
    if (!location.pathname.startsWith('/watch')) return;
    var commentsDiv = document.getElementById('comments');
    if (!commentsDiv || commentsDiv.dataset.ftMobileEnhanced) return;
    commentsDiv.dataset.ftMobileEnhanced = '1';
    document.body.classList.add('ft-comments-collapsed');

    // Do NOT add a second comments button; Invidious already has its own
    // "Ver (n) comentarios" trigger. Make sure the native comments section
    // starts collapsed on mobile and let the native trigger load/open it.
    var nativeTriggers = Array.prototype.slice.call(document.querySelectorAll('button, a, label, summary'))
      .filter(function(el) { return /comentarios|comments/i.test(el.textContent || ''); });
    nativeTriggers.forEach(function(el) {
      el.classList.add('ft-native-comments-trigger');
      el.setAttribute('aria-expanded', 'false');
      el.addEventListener('click', function() {
        document.body.classList.add('ft-comments-open');
        el.setAttribute('aria-expanded', 'true');
      });
    });
  }

  // ===== MAIN INJECTION =====
  function inject() {
    if (document.getElementById(DONE_FLAG)) return;

    var isWatch = location.pathname.startsWith('/watch');

    // Always fix subscribe if present
    var subBtn = document.getElementById('subscribe');
    if (subBtn) fixSubscribe(subBtn);

    // Always hide unwanted elements
    hideUnwanted();

    if (isWatch) {
      // Safety: do not move/replace Invidious watch DOM. The player scripts are
      // sensitive to node movement and can leave the page blank. Keep watch
      // enhancements CSS-only + harmless hiding/branding.
      document.body.classList.add('ft-watch-safe');
      styleComments();
      enhanceMobileComments();

      setTimeout(function() {
        styleComments();
        enhanceMobileComments();
      }, 1500);

      setTimeout(function() {
        styleComments();
        enhanceMobileComments();
      }, 4000);
    }

    var flag = document.createElement('div');
    flag.id = DONE_FLAG;
    flag.style.display = 'none';
    document.body.appendChild(flag);
  }

  // ===== INIT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // ===== SPA NAVIGATION HANDLER =====
  // The observer watches the whole document, so it fires on every DOM burst
  // (comments, feed rendering, etc.). Coalesce the URL check into one rAF tick
  // per burst instead of running it on each individual mutation — meaningfully
  // less main-thread work on mobile, with identical navigation behaviour.
  var navCheckScheduled = false;
  function ftRunNavCheck() {
    navCheckScheduled = false;
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Remove our done flag so inject runs again
      var oldFlag = document.getElementById(DONE_FLAG);
      if (oldFlag) oldFlag.remove();
      setTimeout(inject, 500);
    }
  }
  var navObserver = new MutationObserver(function() {
    if (navCheckScheduled) return;
    navCheckScheduled = true;
    if (window.requestAnimationFrame) requestAnimationFrame(ftRunNavCheck);
    else setTimeout(ftRunNavCheck, 100);
  });
  navObserver.observe(document, { subtree: true, childList: true });

  // Also handle popstate
  window.addEventListener('popstate', function() {
    var oldFlag = document.getElementById(DONE_FLAG);
    if (oldFlag) oldFlag.remove();
    setTimeout(inject, 300);
  });

})();


// === FoxTube layout/recommendations patch v1 ===
(function() {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function cleanText(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>'"]/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
  }
  function cssEsc(s) {
    try { return window.CSS && CSS.escape ? CSS.escape(String(s || '')) : String(s || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
    catch (e) { return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  }

  function brandHeader() {
    var brand = $('.navbar .index-link');
    if (!brand || brand.dataset.ftBrand) return;
    brand.dataset.ftBrand = '1';
    brand.setAttribute('aria-label', 'FoxTube');
    brand.setAttribute('title', 'FoxTube');
    brand.setAttribute('href', ($('a[href^="/login"]') ? '/feed/popular' : '/feed/popular?ft_feed=1'));
    brand.textContent = 'FoxTube';
  }

  function ensureFreshCss() {
    if (document.getElementById('ft-responsive-css-mobile-v2')) return;
    var link = document.createElement('link');
    link.id = 'ft-responsive-css-mobile-v2';
    link.rel = 'stylesheet';
    link.href = '/css/default.css?ft=foxrec-v3-layouts';
    document.head.appendChild(link);
  }

  function findWatchGrid() {
    var player = $('#player-container');
    if (!player) return null;
    var grids = $all('#contents > .pure-g');
    for (var i = 0; i < grids.length; i++) {
      var g = grids[i];
      if ($('.pure-u-1.pure-u-lg-3-5', g) && $all('.pure-u-1.pure-u-lg-1-5', g).length >= 2) return g;
    }
    return null;
  }

  function normalizeWatchMetadata(mainCol, leftInfo) {
    if (!mainCol || !leftInfo) return;
    var oldViews = $('#views', leftInfo);
    var oldDate = $('#published-date', mainCol);
    var views = oldViews ? cleanText(oldViews.textContent).replace(/^.*?([\d.,]+).*$/, '$1') : '';
    var date = oldDate ? cleanText(oldDate.textContent).replace(/^Compartido\s*/i, '') : '';

    var titleFlex = $('.pure-g.h-box.flexible.title', mainCol) || $('.yt-action-row', mainCol);
    var target = titleFlex && titleFlex.parentNode ? titleFlex.parentNode : mainCol;
    if (!target || $('.ft-video-meta-line', target) || $('.yt-views-row', target) || $('.yt-views-row', mainCol)) return;

    var meta = document.createElement('div');
    meta.className = 'ft-video-meta-line';
    var parts = [];
    if (views) parts.push('<span>' + esc(views) + ' visualizaciones</span>');
    if (date) parts.push('<span>·</span><span>' + esc(date) + '</span>');
    meta.innerHTML = parts.join('');

    // Prefer placing immediately before the YouTube-style action row; this stops the visual overlap.
    var action = $('.yt-action-row', target) || $('.pure-g.h-box.flexible.title', mainCol);
    if (action && action.parentNode) action.parentNode.insertBefore(meta, action);
    else mainCol.insertBefore(meta, mainCol.firstChild);
  }

  function arrangeWatchLayout() {
    var player = $('#player-container');
    var grid = findWatchGrid();
    if (!player || !grid || grid.dataset.ftArranged) return;

    var cols = $all('.pure-u-1.pure-u-lg-1-5', grid);
    var leftInfo = cols[0];
    var related = cols[cols.length - 1];
    var mainCol = $('.pure-u-1.pure-u-lg-3-5', grid);
    if (!leftInfo || !related || !mainCol) return;

    var shell = document.createElement('div');
    shell.className = 'ft-watch-shell';
    var mainPanel = document.createElement('section');
    mainPanel.className = 'ft-main-panel';
    var rail = document.createElement('aside');
    rail.className = 'ft-related-rail';
    rail.setAttribute('aria-label', 'Videos recomendados');

    // Move the player block and the title block into the right panel.
    var playerBlock = player.parentElement;
    var titleBlock = playerBlock ? playerBlock.nextElementSibling : null;
    if (playerBlock) mainPanel.appendChild(playerBlock);
    if (titleBlock && titleBlock.classList && titleBlock.classList.contains('h-box')) mainPanel.appendChild(titleBlock);

    normalizeWatchMetadata(mainCol, leftInfo);
    mainPanel.appendChild(mainCol);

    leftInfo.classList.add('ft-hidden-original-left');
    rail.appendChild(related);

    shell.appendChild(rail);
    shell.appendChild(mainPanel);

    grid.parentNode.insertBefore(shell, grid);
    grid.appendChild(leftInfo);
    grid.style.display = 'none';
    grid.dataset.ftArranged = '1';
    document.body.classList.add('ft-watch-ready');
  }

  function videoCard(v) {
    var id = v.videoId || v.id;
    if (!id) return '';
    var title = v.title || 'Video';
    var author = v.author || v.authorName || '';
    var views = v.viewCountText || (v.viewCount ? Number(v.viewCount).toLocaleString('es-MX') + ' visualizaciones' : '');
    var published = v.publishedText || '';
    var thumb = '/vi/' + encodeURIComponent(id) + '/mqdefault.jpg';
    return '<article class="ft-rec-card">' +
      '<a href="/watch?v=' + encodeURIComponent(id) + '"><img loading="lazy" src="' + thumb + '" alt=""></a>' +
      '<a href="/watch?v=' + encodeURIComponent(id) + '"><h3>' + esc(title) + '</h3></a>' +
      '<div class="ft-rec-meta">' + esc(author) + '</div>' +
      '<div class="ft-rec-meta">' + esc([views, published].filter(Boolean).join(' · ')) + '</div>' +
      '</article>';
  }

  function randomSeed() {
    return Date.now() + Math.floor(Math.random() * 1000000) + String(location.href).length;
  }

  function shuffle(items) {
    var arr = (items || []).slice();
    var seed = randomSeed();
    for (var i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      var j = Math.floor((seed / 233280) * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function sample(items, n) {
    return shuffle(items || []).slice(0, n);
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; });
  }

  function isLoggedInUser() {
    // Anonymous Invidious navbar exposes /login. Logged-in users do not.
    return !$('a[href^="/login"]');
  }

  function dedupeVideos(groups, limit) {
    var seen = Object.create(null);
    var videos = [];
    (groups || []).forEach(function(items) {
      (items || []).forEach(function(v) {
        if (v && (v.type === 'video' || v.videoId) && v.videoId && !seen[v.videoId]) {
          seen[v.videoId] = true;
          videos.push(v);
        }
      });
    });
    return videos.slice(0, limit || 30);
  }

  function apiSearch(q, sortBy, page) {
    var url = '/api/v1/search?q=' + encodeURIComponent(q) +
      '&type=video&sort_by=' + encodeURIComponent(sortBy || 'relevance') +
      '&page=' + encodeURIComponent(page || 1) +
      '&_ft=' + Date.now();
    return fetchJson(url).then(function(items) { return Array.isArray(items) ? items : []; });
  }

  function searchQueries(queries, limit, options) {
    options = options || {};
    var sorts = options.sorts || ['relevance', 'date', 'view_count'];
    var maxQueries = options.maxQueries || 12;
    var maxPerQuery = options.maxPerQuery || 4;
    var maxPage = options.maxPage || 4;
    var minViews = options.minViews || 0;
    var chosen = sample(queries || [], maxQueries);
    return Promise.all(chosen.map(function(q, idx) {
      var sort = sorts[(idx + Math.floor(Math.random() * sorts.length)) % sorts.length];
      var page = 1 + Math.floor(Math.random() * maxPage);
      return apiSearch(q, sort, page).then(function(items) {
        items = (items || []).filter(function(v) {
          if (!minViews) return true;
          return Number(v.viewCount || 0) >= minViews;
        });
        return shuffle(items).slice(0, maxPerQuery);
      });
    })).then(function(groups) {
      // Interleave groups instead of letting one subscription/topic dominate the whole feed.
      var mixed = [];
      for (var round = 0; round < maxPerQuery; round++) {
        shuffle(groups).forEach(function(g) { if (g && g[round]) mixed.push(g[round]); });
      }
      return shuffle(dedupeVideos([mixed], limit || 30));
    });
  }

  function saveWatchedVideo() {
    if (!location.pathname.startsWith('/watch')) return;
    var id = (new URL(location.href)).searchParams.get('v');
    if (!id) return;
    var h1 = $('#player-container + .h-box h1') || $('.h-box h1') || $('h1');
    var channel = $('#channel-name') || $('.channel-profile span') || $('a[href^="/channel/"]');
    var item = {
      videoId: id,
      title: cleanText(h1 ? h1.textContent : ''),
      author: cleanText(channel ? channel.textContent : ''),
      watchedAt: Date.now()
    };
    try {
      var list = JSON.parse(localStorage.getItem('ft_watch_history') || '[]');
      list = list.filter(function(x) { return x && x.videoId !== id; });
      list.unshift(item);
      localStorage.setItem('ft_watch_history', JSON.stringify(list.slice(0, 80)));
    } catch (e) {}
  }

  function loadWatchHistory() {
    try {
      var list = JSON.parse(localStorage.getItem('ft_watch_history') || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function normalizeApiList(data) {
    if (Array.isArray(data)) return data;
    if (!data) return [];
    return data.videos || data.items || data.notifications || [];
  }

  function extractTopicQueries(history) {
    var stop = Object.create(null);
    'el la los las un una unos unas de del y o a en con para por que como mi tu su es al lo se the and for with from video videos oficial official'.split(' ').forEach(function(w) { stop[w] = true; });
    var counts = Object.create(null);
    (history || []).slice(0, 30).forEach(function(v) {
      cleanText(v.title).toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(function(w) {
        if (w.length >= 4 && !stop[w]) counts[w] = (counts[w] || 0) + 1;
      });
    });
    return Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; }).slice(0, 12);
  }

  function getPersonalizedHomeVideos() {
    var history = loadWatchHistory();
    return fetchJson('/api/v1/auth/subscriptions?_ft=' + Date.now()).then(function(subData) {
      var subs = Array.isArray(subData) ? subData : [];
      var queries = [];

      // Subscriptions are the base, but randomly sampled every visit.
      sample(subs, 18).forEach(function(s) {
        var name = s.author || s.authorName || s.name || s.title;
        if (name && queries.indexOf(name) === -1) queries.push(name);
      });

      // What you watch locally steers topics/channels without waiting for Invidious' stale feed.
      sample(history, 14).forEach(function(v) {
        if (v.author && queries.indexOf(v.author) === -1) queries.push(v.author);
      });
      sample(extractTopicQueries(history), 10).forEach(function(q) {
        if (queries.indexOf(q) === -1) queries.push(q);
      });

      if (!queries.length) {
        queries = ['tecnología', 'programación', 'gaming', 'ciencia', 'música', 'documental'];
      }

      return searchQueries(queries, 72, {
        sorts: ['relevance', 'date', 'view_count'],
        maxQueries: 24,
        maxPerQuery: 5,
        maxPage: 8
      });
    }).catch(function() {
      return getAnonymousGeneralVideos();
    });
  }

  function getPopularVideos() {
    function isTooRecent(v) {
      var t = String((v && v.publishedText) || '').toLowerCase();
      return /hace\s+\d+\s+(segundo|minuto|hora|día|dia|semana)s?/.test(t) || /\b(second|minute|hour|day|week)s? ago\b/.test(t);
    }
    return fetchJson('/api/v1/popular?_ft=' + Date.now()).then(function(items) {
      var direct = dedupeVideos([Array.isArray(items) ? items : []], 30)
        .filter(function(v) { return Number(v.viewCount || 0) >= 100000 && !isTooRecent(v); })
        .sort(function(a, b) { return Number(b.viewCount || 0) - Number(a.viewCount || 0); });
      if (direct.length >= 12) return shuffle(direct).slice(0, 30);

      // Popular means high-view evergreen/global results, not "uploaded recently".
      return searchQueries([
        'música', 'gaming', 'tecnología', 'ciencia', 'documental',
        'entretenimiento', 'comedia', 'minecraft', 'roblox', 'programación',
        'mrbeast', 'kurzgesagt', 'veritasium', 'mark rober', 'linus tech tips'
      ], 72, {
        sorts: ['view_count'],
        maxQueries: 24,
        maxPerQuery: 5,
        maxPage: 8,
        minViews: 250000
      }).then(function(videos) {
        return videos
          .filter(function(v) { return !isTooRecent(v); })
          .sort(function(a, b) { return Number(b.viewCount || 0) - Number(a.viewCount || 0); })
          .slice(0, 72);
      });
    });
  }

  function getAnonymousGeneralVideos() {
    // Neutral, non-personalized, broad/basic fresh topics for visitors without an account.
    return searchQueries([
      'música nueva', 'gaming nuevo', 'noticias virales', 'tecnología nueva',
      'memes', 'deportes', 'trailers películas', 'comida fácil',
      'viajes', 'ciencia curiosidades', 'documentales cortos', 'tutoriales básicos',
      'entretenimiento', 'podcast español', 'roblox', 'minecraft',
      'tops', 'reviews tecnología', 'noticias México', 'videos populares'
    ], 72, {
      sorts: ['date', 'relevance', 'view_count'],
      maxQueries: 24,
      maxPerQuery: 5,
      maxPage: 4
    });
  }

  function removeOldRecommendationFeed() {
    $all('.ft-rec-feed').forEach(function(node) { node.remove(); });
  }

  function isForYouRoute() {
    try {
      var u = new URL(location.href);
      return location.pathname === '/' || u.searchParams.get('ft_feed') === '1' || u.searchParams.get('ft') === 'for-you';
    } catch (e) {
      return false;
    }
  }

  function ensureForYouMenuLink() {
    var feedMenu = $('.feed-menu');
    if (!feedMenu || feedMenu.dataset.ftForYouLink) return;
    feedMenu.dataset.ftForYouLink = '1';
    var link = document.createElement('a');
    link.href = '/feed/popular?ft_feed=1';
    link.className = 'feed-menu-item pure-menu-heading';
    link.textContent = 'Para ti';
    if (isForYouRoute()) link.classList.add('active');
    feedMenu.appendChild(link);
  }

  function buildRecommendationFeed() {
    return; // disabled: FoxRec production feed owns Para ti/Popular to avoid duplicate sections.
    var path = location.pathname.toLowerCase();
    ensureForYouMenuLink();
    var isHome = isForYouRoute();
    var isPopular = (path === '/feed/popular' || path === '/feed/trending') && !isHome;
    if (!isHome && !isPopular) return;

    removeOldRecommendationFeed();

    var contentGrid = $('#contents > .pure-g:not(.navbar)');
    var feedMenu = $('.feed-menu');
    var insertHost = contentGrid || feedMenu || $('#contents');
    if (!insertHost || !insertHost.parentNode) return;

    var existingVideos = contentGrid ? $all('a[href^="/watch?v="]', contentGrid).length : 0;
    if (isPopular && existingVideos > 2) {
      // Popular/Trending must remain global popular videos, never the personalized home feed.
      if (contentGrid) contentGrid.style.display = '';
      return;
    }

    var loggedIn = isLoggedInUser();
    var feed = document.createElement('section');
    feed.className = 'ft-rec-feed';
    var title = isPopular ? 'Populares' : (loggedIn ? 'Para ti' : 'Recomendados');
    feed.innerHTML = '<div class="ft-rec-heading"><h2>' + title + '</h2></div><div class="ft-rec-grid"><div class="ft-rec-empty">Cargando videos…</div></div>';

    if (feedMenu && feedMenu.parentNode) feedMenu.parentNode.insertBefore(feed, feedMenu.nextSibling);
    else insertHost.parentNode.insertBefore(feed, insertHost);

    if (contentGrid) contentGrid.style.display = 'none';

    var grid = $('.ft-rec-grid', feed);
    var loader = isPopular ? getPopularVideos : (loggedIn ? getPersonalizedHomeVideos : getAnonymousGeneralVideos);
    loader().then(function(videos) {
      grid.innerHTML = videos.length ? videos.map(videoCard).join('') : '<div class="ft-rec-empty">No se pudieron cargar videos ahora mismo.</div>';
      applySavedQualityToLinks();
    });
  }



  function applySavedQualityToLinks() {
    var labels = ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p'];
    function normalize(label) {
      label = String(label || '').trim();
      if (!label || label.toLowerCase() === 'auto') return 'Auto';
      var m = label.match(/^(\d{3,4})p?$/i);
      return m ? (m[1] + 'p') : label;
    }
    function cookie(name) {
      try {
        var parts = document.cookie.split(';').map(function(x) { return x.trim(); });
        for (var i = 0; i < parts.length; i++) if (parts[i].indexOf(name + '=') === 0) return decodeURIComponent(parts[i].slice(name.length + 1));
      } catch (e) {}
      return null;
    }
    var saved = null;
    try { saved = localStorage.getItem('ft_quality_dash'); } catch (e) {}
    saved = normalize(saved || cookie('ft_quality_dash') || '');
    if (labels.indexOf(saved) === -1) return;
    document.querySelectorAll('a[href^="/watch?v="]').forEach(function(a) {
      var href = a.getAttribute('href') || '';
      if (!href) return;
      try {
        var u = new URL(href, location.origin);
        u.searchParams.set('quality', 'dash');
        u.searchParams.set('quality_dash', saved === 'Auto' ? 'auto' : saved);
        a.setAttribute('href', u.pathname + u.search + u.hash);
      } catch (e) {}
    });
  }

  function addExternalQualitySelector() {
    if (!location.pathname.startsWith('/watch')) return;
    if ($('#ft-external-quality')) return;

    // Hide Video.js' built-in quality control; use a no-navigation selector instead.
    document.querySelectorAll('.vjs-control.vjs-http-source-selector, .vjs-menu-button.vjs-http-source-selector').forEach(function(btn) {
      btn.classList.add('ft-hide-internal-quality');
    });

    var h1 = $('#player-container + .h-box h1') || $('.h-box h1');
    var host = h1 ? h1.parentNode : ($('#player-container') ? $('#player-container').parentNode : null);
    if (!host) return;

    var currentDash = !!document.querySelector('source[type="application/dash+xml"]') || new URL(location.href).searchParams.get('quality') === 'dash';
    var urlQuality = new URL(location.href).searchParams.get('quality_dash');
    var labels = ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p'];

    function normalizeQuality(label) {
      label = String(label || '').trim();
      if (!label || label.toLowerCase() === 'auto') return 'Auto';
      var m = label.match(/^(\d{3,4})p?$/i);
      return m ? (m[1] + 'p') : label;
    }

    function getCookie(name) {
      try {
        var parts = document.cookie.split(';').map(function(x) { return x.trim(); });
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].indexOf(name + '=') === 0) return decodeURIComponent(parts[i].slice(name.length + 1));
        }
      } catch (e) {}
      return null;
    }

    function qualityUrl(label, base) {
      var u = new URL(base || location.href, location.origin);
      u.searchParams.set('quality', 'dash');
      if (label === 'Auto') u.searchParams.set('quality_dash', 'auto');
      else u.searchParams.set('quality_dash', label);
      return u.pathname + u.search + u.hash;
    }

    function persistQuality(label) {
      label = normalizeQuality(label);
      try { localStorage.setItem('ft_quality_dash', label); } catch (e) {}
      try { document.cookie = 'ft_quality_dash=' + encodeURIComponent(label) + '; Path=/; Max-Age=31536000; SameSite=Lax'; } catch (e) {}
      try { history.replaceState(history.state, document.title, qualityUrl(label)); } catch (e) {}
      decorateWatchLinks(label);
    }

    function decorateWatchLinks(label) {
      label = normalizeQuality(label || getSavedQuality() || 'Auto');
      document.querySelectorAll('a[href^="/watch?v="]').forEach(function(a) {
        var href = a.getAttribute('href') || '';
        if (!href) return;
        a.setAttribute('href', qualityUrl(label, href));
      });
    }

    function getSavedQuality() {
      var saved = null;
      try { saved = localStorage.getItem('ft_quality_dash'); } catch (e) {}
      saved = saved || getCookie('ft_quality_dash');
      saved = normalizeQuality(saved || '');
      return labels.indexOf(saved) !== -1 ? saved : null;
    }

    var current = normalizeQuality(urlQuality || (currentDash ? 'Auto' : '360p'));

    function setActive(wrap, label) {
      $all('.ft-quality-pill', wrap).forEach(function(btn) {
        btn.classList.toggle('active', (btn.dataset.quality || '').toLowerCase() === String(label).toLowerCase());
      });
    }

    function getPlayer() {
      try {
        if (window.videojs) return window.videojs.getPlayer('player') || window.videojs('player');
      } catch (e) {}
      return null;
    }

    function applyQuality(label, attempt, skipReload) {
      attempt = attempt || 0;
      var player = getPlayer();
      if (!player || !player.qualityLevels) {
        if (attempt < 20) setTimeout(function() { applyQuality(label, attempt + 1, skipReload); }, 250);
        return false;
      }

      var resumeAt = 0;
      var wasPaused = true;
      var playbackRate = 1;
      try {
        resumeAt = player.currentTime ? player.currentTime() : 0;
        wasPaused = player.paused ? player.paused() : true;
        playbackRate = player.playbackRate ? player.playbackRate() : 1;
      } catch (e) {}

      function currentLevels() {
        try {
          return Array.prototype.slice.call(player.qualityLevels()).sort(function(a, b) {
            return (a.height || 0) - (b.height || 0);
          });
        } catch (e) { return []; }
      }

      function dashSourceObject() {
        var dash = document.querySelector('source[type="application/dash+xml"]');
        var src = dash && dash.getAttribute('src');
        if (!src) {
          try {
            var cur = player.currentSource && player.currentSource();
            if (cur && /dash|manifest/i.test((cur.type || '') + ' ' + (cur.src || ''))) src = cur.src;
          } catch (e) {}
        }
        if (!src) return null;
        try {
          var u = new URL(src, location.origin);
          u.searchParams.set('ft_quality_switch', String(Date.now()));
          src = u.pathname + u.search + u.hash;
        } catch (e) {}
        return { src: src, type: 'application/dash+xml' };
      }

      function selectLevels() {
        try {
          if (window.video_data && window.video_data.params) {
            window.video_data.params.quality = 'dash';
            window.video_data.params.quality_dash = (label === 'Auto' ? 'auto' : label);
          }
        } catch (e) {}
        var levels = currentLevels();
        if (!levels.length) return false;

        if (label === 'Auto') {
          levels.forEach(function(level) { level.enabled = true; });
        } else {
          var targetHeight = parseInt(label, 10);
          var target = null;
          levels.forEach(function(level) {
            if ((level.height || 0) <= targetHeight) target = level;
          });
          target = target || levels[0];
          levels.forEach(function(level) { level.enabled = (level === target); });
        }

        try {
          var tech = player.tech && player.tech({ IWillNotUseThisInPlugins: true });
          var controller = tech && tech.vhs && tech.vhs.masterPlaylistController_;
          if (controller && typeof controller.fastQualityChange_ === 'function') controller.fastQualityChange_();
          else if (controller && typeof controller.smoothQualityChange_ === 'function') controller.smoothQualityChange_();
          if (player.qualityLevels && player.qualityLevels().trigger) player.qualityLevels().trigger({ type: 'change' });
        } catch (e) {}
        return true;
      }

      var levelsReady = selectLevels();

      // Preserve the watch position while the media pipeline swaps rendition.
      // After player.load(), Video.js/VHS can reset currentTime back to 0 more
      // than once, so restore on media events + timed retries until it sticks.
      var restoreAttempts = 0;
      var restoreDone = resumeAt <= 1;
      function restorePlayback() {
        try {
          if (player.playbackRate) player.playbackRate(playbackRate);
          if (resumeAt > 1) {
            var now = player.currentTime ? player.currentTime() : 0;
            if (Math.abs(now - resumeAt) > 0.75) {
              player.currentTime(resumeAt);
            } else if (now >= resumeAt - 0.75) {
              restoreDone = true;
            }
          }
          if (!wasPaused && player.play) player.play().catch(function() {});
        } catch (e) {}
      }
      function restoreUntilStable() {
        restorePlayback();
        restoreAttempts += 1;
        if (!restoreDone && restoreAttempts < 24) setTimeout(restoreUntilStable, 250);
      }

      // If the page started on an MP4 fallback, Video.js has no DASH qualityLevels yet.
      // Load the DASH manifest first, then apply the selected level once VHS exposes levels.
      if (!levelsReady && skipReload) {
        if (attempt < 24) setTimeout(function() { applyQuality(label, attempt + 1, true); }, 250);
        return false;
      }

      // Real switch: reload only the media source, not the page. This makes the
      // chosen DASH rendition take effect immediately while keeping URL/history.
      if (!skipReload) {
        try {
          var src = dashSourceObject() || (player.currentSource && player.currentSource());
          if (src && src.src) {
            var nextSrc = Object.assign({}, src);
            try {
              var srcUrl = new URL(nextSrc.src, location.origin);
              srcUrl.searchParams.set('ft_quality_switch', String(Date.now()));
              nextSrc.src = srcUrl.pathname + srcUrl.search + srcUrl.hash;
            } catch (e) {}
            var restoreEvents = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'timeupdate', 'seeked'];
            restoreEvents.forEach(function(eventName) {
              player.one(eventName, function() {
                if (!selectLevels()) setTimeout(function() { applyQuality(label, attempt + 1, true); }, 250);
                restoreUntilStable();
              });
            });
            player.src(nextSrc);
            player.load();
            // Watchdog: if player is stuck in waiting state after load, reload the page
            var watchdogStart = Date.now();
            var watchdogInterval = setInterval(function() {
              try {
                var elapsed = Date.now() - watchdogStart;
                var readyState = player.readyState ? player.readyState() : 0;
                var paused = player.paused ? player.paused() : true;

                // If 8 seconds have passed and player is still buffering/waiting
                if (elapsed >= 8000 && readyState < 3 && !paused) {
                  clearInterval(watchdogInterval);
                  // Reload page preserving video URL and timestamp
                  try {
                    var t = Math.floor((player.currentTime ? player.currentTime() : 0));
                    var u = new URL(location.href);
                    u.searchParams.delete('ft_reload');
                    u.searchParams.set('ft_reload', String(Date.now()));
                    if (t > 0) u.searchParams.set('t', String(t));
                    location.replace(u.toString());
                  } catch(e) { location.reload(); }
                  return;
                }

                // Cancel watchdog if video is playing fine
                if (readyState >= 3 || (paused && elapsed > 2000)) {
                  clearInterval(watchdogInterval);
                }

                // Hard timeout at 45 seconds regardless
                if (elapsed >= 45000) {
                  clearInterval(watchdogInterval);
                }
              } catch(e) { clearInterval(watchdogInterval); }
            }, 2000);
            setTimeout(function() { applyQuality(label, attempt + 1, true); }, 700);
          }
        } catch (e) {}
      }

      restoreUntilStable();

      try {
        persistQuality(label);
      } catch (e) {}
      return true;
    }

    var saved = getSavedQuality();
    if (!urlQuality && saved) current = saved;
    persistQuality(current);

    var wrap = document.createElement('div');
    wrap.id = 'ft-external-quality';
    wrap.className = 'ft-external-quality';
    wrap.innerHTML = '<span class="ft-external-quality-label">Calidad</span>' + labels.map(function(label) {
      var active = String(current).toLowerCase() === String(label).toLowerCase();
      return '<button type="button" class="ft-quality-pill' + (active ? ' active' : '') + '" data-quality="' + esc(label) + '">' + esc(label) + '</button>';
    }).join('');

    wrap.addEventListener('click', function(e) {
      var btn = e.target.closest('.ft-quality-pill');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var label = btn.dataset.quality || 'Auto';
      setActive(wrap, label);
      applyQuality(label);
    });

    if (h1 && h1.nextSibling) host.insertBefore(wrap, h1.nextSibling);
    else host.appendChild(wrap);

    if (current && current !== 'Auto') setTimeout(function() { applyQuality(current); }, 500);
  }

  function persistPlayerPreferences(attempt) {
    if (!location.pathname.startsWith('/watch')) return;
    attempt = attempt || 0;

    var videoEl = document.getElementById('player');
    if (videoEl && videoEl.dataset.ftPrefsBound) return;

    var player = null;
    try {
      if (window.videojs) player = window.videojs.getPlayer('player') || window.videojs('player');
    } catch (e) {}

    if (!player) {
      if (attempt < 30) setTimeout(function() { persistPlayerPreferences(attempt + 1); }, 250);
      return;
    }

    if (videoEl) videoEl.dataset.ftPrefsBound = '1';

    var key = 'ft_player_preferences_v1';
    function loadPrefs() {
      try {
        var prefs = JSON.parse(localStorage.getItem(key) || '{}');
        return prefs && typeof prefs === 'object' ? prefs : {};
      } catch (e) { return {}; }
    }
    function savePrefs(prefs) {
      try { localStorage.setItem(key, JSON.stringify(prefs)); } catch (e) {}
    }
    function saveNow() {
      var prefs = loadPrefs();
      try {
        if (player.volume) prefs.volume = player.volume();
        if (player.playbackRate) prefs.playbackRate = player.playbackRate();
      } catch (e) {}
      savePrefs(prefs);
    }
    function saveMuteExplicit() {
      // Only persist muted state when the user explicitly muted via a real gesture.
      if (!videoEl || videoEl.dataset.ftUserDidMute !== '1') return;
      var prefs = loadPrefs();
      try {
        if (player.muted) prefs.muted = player.muted();
      } catch (e) {}
      savePrefs(prefs);
    }
    function saveTextTrack() {
      var prefs = loadPrefs();
      try {
        var tracks = player.textTracks ? player.textTracks() : null;
        var selected = null;
        if (tracks) {
          for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];
            if (t && t.mode === 'showing') {
              selected = { label: t.label || '', language: t.language || '', kind: t.kind || '' };
              break;
            }
          }
        }
        prefs.textTrack = selected;
      } catch (e) {}
      savePrefs(prefs);
    }
    function applyTextTrack(prefs) {
      if (!prefs || !('textTrack' in prefs)) return;
      try {
        var tracks = player.textTracks ? player.textTracks() : null;
        if (!tracks || !tracks.length) return;
        var wanted = prefs.textTrack;
        for (var i = 0; i < tracks.length; i++) {
          var t = tracks[i];
          var match = wanted && ((wanted.language && t.language === wanted.language) || (wanted.label && t.label === wanted.label));
          t.mode = match ? 'showing' : 'disabled';
        }
      } catch (e) {}
    }
    function applyPrefs() {
      var prefs = loadPrefs();
      try {
        if (typeof prefs.volume === 'number' && player.volume) player.volume(Math.max(0, Math.min(1, prefs.volume)));
        if (player.muted) {
          // Only honor a saved muted:true if the user explicitly muted via mute button.
          if (prefs.muted === true && videoEl && videoEl.dataset.ftUserDidMute === '1') {
            player.muted(true);
          } else {
            player.muted(false);
          }
        }
        if (typeof prefs.playbackRate === 'number' && player.playbackRate) player.playbackRate(prefs.playbackRate);
      } catch (e) {}
      applyTextTrack(prefs);
      setTimeout(function() { applyTextTrack(loadPrefs()); }, 800);
      setTimeout(function() { applyTextTrack(loadPrefs()); }, 2000);
    }

    try {
      player.ready(function() {
        // Clear stale muted:true saved by old buggy code that saved browser-forced mute
        (function() {
          try {
            var stalePrefs = JSON.parse(localStorage.getItem(key) || '{}');
            if (stalePrefs.muted === true && (!videoEl || videoEl.dataset.ftUserDidMute !== '1')) {
              delete stalePrefs.muted;
              localStorage.setItem(key, JSON.stringify(stalePrefs));
            }
          } catch(e) {}
        })();
        applyPrefs();
        player.on('volumechange', saveNow);
        player.on('volumechange', function() { if (videoEl && videoEl.dataset.ftUserDidMute === '1') saveMuteExplicit(); });
        player.on('ratechange', saveNow);
        player.on('loadedmetadata', function() {
          applyPrefs();
          setTimeout(function() { applyPrefs(); }, 400);
        });
        player.on('texttrackchange', saveTextTrack);
        var tracks = player.textTracks ? player.textTracks() : null;
        if (tracks && tracks.addEventListener) tracks.addEventListener('change', saveTextTrack);

        function watchMuteButton() {
          var muteBtn = document.querySelector('.vjs-mute-control');
          if (!muteBtn || muteBtn.dataset.ftMuteWired) return;
          muteBtn.dataset.ftMuteWired = '1';
          muteBtn.addEventListener('click', function() {
            if (videoEl) videoEl.dataset.ftUserDidMute = '1';
          });
        }
        watchMuteButton();
        setTimeout(watchMuteButton, 1000);
        setTimeout(watchMuteButton, 2500);
      });
    } catch (e) {
      applyPrefs();
    }
  }

  function watchForStuckVideo() {
    if (!location.pathname.startsWith('/watch')) return;
    if (document.getElementById('ft-stuck-watchdog-active')) return;

    var flag = document.createElement('div');
    flag.id = 'ft-stuck-watchdog-active';
    flag.style.display = 'none';
    document.body.appendChild(flag);

    var startTime = Date.now();
    var resolved = false;

    function check() {
      if (resolved) return;
      var elapsed = Date.now() - startTime;

      // After 12 seconds, check if player is stuck
      if (elapsed < 12000) {
        setTimeout(check, 3000);
        return;
      }

      var player = null;
      try {
        if (window.videojs) player = window.videojs.getPlayer('player');
      } catch(e) {}

      if (!player) {
        if (elapsed < 60000) setTimeout(check, 3000);
        return;
      }

      try {
        var readyState = player.readyState ? player.readyState() : -1;
        var paused = player.paused ? player.paused() : true;
        var currentTime = player.currentTime ? player.currentTime() : 0;

        // Player exists but stuck: readyState < 2 (no data), not paused (trying to play), no progress
        if (readyState < 2 && !paused && currentTime < 0.5) {
          resolved = true;
          // Add a "Recargar video" button so user knows what to do
          var reloadBtn = document.getElementById('ft-reload-btn');
          if (!reloadBtn) {
            reloadBtn = document.createElement('button');
            reloadBtn.id = 'ft-reload-btn';
            reloadBtn.textContent = '⟳ Video atascado — Recargar';
            reloadBtn.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;background:var(--ft-accent,#bd93f9);color:var(--ft-accent-text,#fff);border:none;padding:14px 24px;border-radius:20px;font-size:16px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.5);font-family:inherit;';
            reloadBtn.addEventListener('click', function() {
              try {
                var t = Math.floor(currentTime);
                var u = new URL(location.href);
                u.searchParams.delete('ft_reload');
                u.searchParams.set('ft_reload', String(Date.now()));
                if (t > 0) u.searchParams.set('t', String(t));
                location.replace(u.toString());
              } catch(e) { location.reload(); }
            });
            document.body.appendChild(reloadBtn);
          }

          // Auto-reload after 3 more seconds if button not clicked
          setTimeout(function() {
            if (document.getElementById('ft-reload-btn')) {
              location.reload();
            }
          }, 3000);
          return;
        }

        // Video is fine, stop checking
        if (readyState >= 2 || paused) {
          resolved = true;
          return;
        }
      } catch(e) {}

      if (elapsed < 60000) setTimeout(check, 3000);
    }

    setTimeout(check, 12000);
  }

  function run() {
    ensureFreshCss();
    brandHeader();
    // Do not restructure /watch pages with DOM moves; it can break Video.js/Invidious.
    // Watch-page layout is handled by CSS-only rules below.
    // FoxRec v1 below owns feed rendering. Keep quality/link helpers only.
    // buildRecommendationFeed();
    applySavedQualityToLinks();
    addExternalQualitySelector();
    persistPlayerPreferences();
    watchForStuckVideo();
  }


  // Lightweight progress bar width fix — only sets CSS width after Video.js init, no DOM restructure

  // Float progress bar ABOVE the button row without breaking Video.js layout
  
  // Progress bar fix removed



  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  setTimeout(run, 800);
  setTimeout(run, 1800);
})();

// === FoxTube production recommendations + Shorts v1 ===
(function() {
  'use strict';

  var FT_VERSION = 'foxrec-v2-youtube-like';
  var REC_LIMIT = 84;
  var SHORTS_LIMIT = 48;
  var MAX_SEARCH_QUERIES = 18;
  var STORAGE = {
    watchHistory: 'ft_watch_history',
    searches: 'ft_search_history_v1',
    videoStats: 'ft_video_stats_v1',
    impressions: 'ft_impression_sessions_v1',
    lastFeeds: 'ft_last_feed_ids_v1',
    feedback: 'ft_feedback_v2',
    session: 'ft_session_profile_v2'
  };
  var FEED_RUN_NONCE = String(Date.now()) + ':' + Math.random().toString(36).slice(2);
  var FEED_REFRESH_COUNTER = 0;
  var LAST_PROFILE_SIGNALS = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function text(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>'"]/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
  }
  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; });
  }
  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (!data) return [];
    return data.videos || data.items || data.notifications || [];
  }
  function hashSeed(str) {
    var h = 2166136261;
    str = String(str || '') + ':' + FEED_RUN_NONCE + ':' + FEED_REFRESH_COUNTER;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0) || 1;
  }
  function seededRand(seed) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return { seed: seed, value: seed / 4294967296 };
  }
  function seededValue(seedText) {
    return seededRand(hashSeed(seedText || '')).value;
  }
  function shuffle(items, seedText) {
    var arr = (items || []).slice();
    var seed = hashSeed(seedText || location.href);
    for (var i = arr.length - 1; i > 0; i--) {
      var r = seededRand(seed); seed = r.seed;
      var j = Math.floor(r.value * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function sample(items, n, seedText) { return shuffle(items || [], seedText).slice(0, n); }
  function randomPage(seedText, maxPage) {
    maxPage = Math.max(1, Number(maxPage || 1));
    return 1 + Math.floor(seededValue(seedText) * maxPage);
  }
  function parseDurationSeconds(v) {
    if (!v) return 0;
    if (Number(v.lengthSeconds || 0)) return Number(v.lengthSeconds || 0);
    var raw = text(v.length || v.duration || v.lengthText || '');
    if (!raw) return 0;
    var parts = raw.split(':').map(function(x) { return parseInt(x, 10) || 0; });
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }
  function parseViews(v) { return Number((v && (v.viewCount || v.views)) || 0) || 0; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }
  function ageHoursFrom(value) {
    if (!value) return 24 * 30;
    var t = 0;
    if (typeof value === 'number') t = value;
    else {
      t = Date.parse(value);
      if (!Number.isFinite(t)) return 24 * 30;
    }
    return Math.max(0, (Date.now() - t) / 36e5);
  }
  function decay(ageHours, halfLifeHours) {
    return Math.exp(-0.693 * Math.max(0, ageHours || 0) / Math.max(1, halfLifeHours || 168));
  }
  function readFeedback() {
    var fb = readJson(STORAGE.feedback, {});
    fb.notInterested = fb.notInterested || {};
    fb.blockedChannels = fb.blockedChannels || {};
    fb.positiveTopics = fb.positiveTopics || {};
    fb.negativeTopics = fb.negativeTopics || {};
    return fb;
  }
  function saveFeedback(fb) { writeJson(STORAGE.feedback, fb || {}); }
  function rememberSessionEvent(event) {
    var session = readJson(STORAGE.session, { startedAt: Date.now(), events: [] });
    if (!session.startedAt || Date.now() - session.startedAt > 6 * 36e5) session = { startedAt: Date.now(), events: [] };
    session.events = (session.events || []).filter(Boolean);
    session.events.unshift(event);
    session.events = session.events.slice(0, 60);
    writeJson(STORAGE.session, session);
  }
  function sessionEvents() {
    var session = readJson(STORAGE.session, { events: [] });
    return (session.events || []).filter(Boolean).slice(0, 60);
  }
  function isLikelySpanishOrEnglish(v) {
    var s = text((v && (v.title || '')) + ' ' + (v && (v.author || v.authorName || '')));
    if (!s) return true;
    // Keep Spanish/English/Latin titles; block feeds dominated by scripts Christian does not watch.
    var blocked = (s.match(/[\u0400-\u052F\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/g) || []).length;
    return blocked / Math.max(1, s.length) < 0.08;
  }
  function cleanTopicToken(token) {
    token = text(token).toLowerCase();
    var noisy = {
      foryou:1, parati:1, viral:1, funny:1, best:1, life:1, edit:1, todo:1, shorts:1, short:1,
      video:1, videos:1, oficial:1, official:1, clip:1, clips:1, configuración:1, actividad:1,
      google:1, historial:1, productos:1, viewed:1, watched:1, youtube:1, configuración:1,
      porque:1, habilitadas:1, opciones:1, cuenta:1, actividad:1, control:1, aquí:1
    };
    if (!token || noisy[token] || token.length < 4) return '';
    return token;
  }
  function tokenizeForProfile(s) {
    var out = [];
    text(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(function(w) {
      w = cleanTopicToken(w);
      if (w) out.push(w);
    });
    return out;
  }
  function buildProfileSignals(profile) {
    profile = profile || {};
    var tokenCounts = Object.create(null);
    var authors = Object.create(null);
    var channelIds = Object.create(null);
    var sessionTokenCounts = Object.create(null);
    var feedback = readFeedback();
    var stats = getStats();
    function addToken(t, weight) { t = cleanTopicToken(t); if (t) tokenCounts[t] = (tokenCounts[t] || 0) + (weight || 1); }
    function addSessionToken(t, weight) { t = cleanTopicToken(t); if (t) sessionTokenCounts[t] = (sessionTokenCounts[t] || 0) + (weight || 1); }
    function addText(s, weight) { tokenizeForProfile(s).forEach(function(t) { addToken(t, weight); }); }
    function engagementWeight(v) {
      var st = stats[v.videoId] || {};
      var len = parseDurationSeconds(v) || 480;
      var watch = Number(st.watchSeconds || 0);
      var complete = Number(st.completions || 0);
      var clicks = Number(st.clicks || 0);
      var ratio = len ? Math.min(1.4, watch / len) : 0;
      return 1 + Math.min(3, ratio * 1.8) + Math.min(2.5, complete * 1.2) + Math.min(1.2, clicks * 0.25);
    }
    (profile.watchHistory || []).slice(0, 1400).forEach(function(v, idx) {
      if (!v) return;
      var age = ageHoursFrom(v.watchedAt || v.date);
      var recency = decay(age, idx < 120 ? 168 : 720);
      var w = (idx < 80 ? 3.4 : idx < 250 ? 2.2 : idx < 700 ? 1.15 : 0.55) * recency * engagementWeight(v);
      addText(v.title, w);
      addText(v.author, w + 0.5);
      if (v.author) authors[text(v.author).toLowerCase()] = (authors[text(v.author).toLowerCase()] || 0) + w;
      if (v.channelId) channelIds[v.channelId] = (channelIds[v.channelId] || 0) + w;
    });
    (profile.searches || []).slice(0, 60).forEach(function(s) { addText(s.q, 3.5 * decay(ageHoursFrom(s.at || s.date), 336)); });
    sessionEvents().forEach(function(ev, idx) {
      var w = (idx < 8 ? 5 : 2.5) * decay(ageHoursFrom(ev.at), 12);
      tokenizeForProfile((ev.title || '') + ' ' + (ev.author || '') + ' ' + (ev.query || '')).forEach(function(t) {
        addToken(t, w);
        addSessionToken(t, w);
      });
      if (ev.author) authors[text(ev.author).toLowerCase()] = (authors[text(ev.author).toLowerCase()] || 0) + w;
      if (ev.channelId) channelIds[ev.channelId] = (channelIds[ev.channelId] || 0) + w;
    });
    (profile.topWatchedChannels || []).slice(0, 80).forEach(function(c) { addText(c.title || c.author || c.name, Math.min(8, 1 + (c.count || 1) / 25)); });
    (profile.topTokens || []).slice(0, 120).forEach(function(t) { addToken(t.token || t, Math.min(6, 1 + (t.count || 1) / 30)); });
    Object.keys(feedback.positiveTopics || {}).forEach(function(t) { addToken(t, Math.min(10, feedback.positiveTopics[t] * 3)); });
    Object.keys(feedback.negativeTopics || {}).forEach(function(t) { tokenCounts[t] = (tokenCounts[t] || 0) - Math.min(12, feedback.negativeTopics[t] * 4); });
    var topTokens = Object.keys(tokenCounts).sort(function(a, b) { return tokenCounts[b] - tokenCounts[a]; }).slice(0, 120);
    var topMap = Object.create(null);
    topTokens.forEach(function(t) { topMap[t] = tokenCounts[t]; });
    var sessionTokens = Object.keys(sessionTokenCounts).sort(function(a, b) { return sessionTokenCounts[b] - sessionTokenCounts[a]; }).slice(0, 40);
    var sessionMap = Object.create(null);
    sessionTokens.forEach(function(t) { sessionMap[t] = sessionTokenCounts[t]; });
    return { tokenCounts: tokenCounts, topTokens: topTokens, topMap: topMap, sessionTokens: sessionTokens, sessionMap: sessionMap, authors: authors, channelIds: channelIds, feedback: feedback };
  }
  function profileLikesTopic(signals, words) {
    signals = signals || {};
    words = Array.isArray(words) ? words : [words];
    return words.some(function(w) { return (signals.topMap || {})[cleanTopicToken(w)] >= 2; });
  }
  function looksLikeGenericSlop(v, signals) {
    var s = text((v && v.title || '') + ' ' + (v && (v.author || v.authorName) || '')).toLowerCase();
    if (!s) return false;
    var aiMusic = /\b(ai|suno|udio|generated|generada|generado|artificial intelligence)\b.*\b(song|music|música|canción|beat|cover)\b|\b(song|music|música|canción|beat|cover)\b.*\b(ai|suno|udio|generated|generada|generado)\b/i.test(s);
    if (aiMusic && !(profileLikesTopic(signals, ['suno','udio','music','música','song','canción']) && profileLikesTopic(signals, ['ai','ia','generated']))) return true;
    var politicsLive = /\b(mañanera|mañaneras|presidente|presidenta|gobierno|senado|congreso|elecciones|politica|política)\b/i.test(s);
    if (politicsLive && !profileLikesTopic(signals, ['politica','política','gobierno','elecciones','noticias'])) return true;
    return false;
  }
  function candidateMatchesProfile(v, signals) {
    if (!allowCandidate(v)) return false;
    signals = signals || buildProfileSignals({});
    var fb = signals.feedback || readFeedback();
    if ((fb.notInterested || {})[v.videoId]) return false;
    var channelKey = v.authorId || v.channelId || text(v.author || v.authorName || '').toLowerCase();
    if (channelKey && (fb.blockedChannels || {})[channelKey]) return false;
    if (looksLikeGenericSlop(v, signals)) return false;
    var source = String(v.__ft_source || '');
    var author = text(v.author || v.authorName || '').toLowerCase();
    if (author && (signals.authors || {})[author] >= 2) return true;
    if (v.authorId && (signals.channelIds || {})[v.authorId]) return true;
    if (/related-to-watch-history/.test(source)) return true;
    var overlap = 0;
    tokenizeForProfile((v.title || '') + ' ' + (v.author || v.authorName || '')).forEach(function(t) {
      if ((signals.topMap || {})[t]) overlap += Math.min(3, signals.topMap[t]);
    });
    if (/explore|popular|trending|fresh/.test(source)) return overlap >= 2;
    return overlap >= 3.2;
  }
  function allowCandidate(v) {
    return v && v.videoId && isLikelySpanishOrEnglish(v);
  }
  function isLoggedIn() {
    if ($('a[href^="/login"]')) return false;
    return !!($('a[href^="/logout"]') || $('form[action^="/signout"]') || $('a[href^="/feed/subscriptions"]') || $('.pure-menu a[href^="/preferences"]'));
  }
  function canShowForYou() { return isLoggedIn(); }
  function apiSearch(q, sortBy, page, options) {
    options = options || {};
    var url = '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video&sort_by=' + encodeURIComponent(sortBy || 'relevance') + '&page=' + encodeURIComponent(page || 1);
    if (options.duration) url += '&duration=' + encodeURIComponent(options.duration);
    url += '&_ft=' + Date.now();
    return fetchJson(url).then(function(items) { return normalizeList(items).filter(function(v) { return v && v.videoId; }); });
  }
  function apiChannelVideos(channelId) {
    if (!channelId || !/^UC[\w-]{20,}$/.test(channelId)) return Promise.resolve([]);
    return fetchJson('/api/v1/channels/' + encodeURIComponent(channelId) + '/latest?_ft=' + Date.now()).then(function(data) {
      var videos = (data && Array.isArray(data.videos)) ? data.videos : normalizeList(data);
      return (videos || []).filter(allowCandidate);
    });
  }
  function apiRelatedVideos(videoId) {
    if (!videoId) return Promise.resolve([]);
    return fetchJson('/api/v1/videos/' + encodeURIComponent(videoId) + '?_ft=' + Date.now()).then(function(data) {
      var rel = (data && (data.recommendedVideos || data.relatedVideos || data.videos)) || [];
      return normalizeList(rel).filter(allowCandidate);
    });
  }
  function getStats() { return readJson(STORAGE.videoStats, {}); }
  function saveStats(stats) { writeJson(STORAGE.videoStats, stats || {}); }
  function bumpStat(videoId, patch) {
    if (!videoId) return;
    var stats = getStats();
    var row = stats[videoId] || {};
    Object.keys(patch || {}).forEach(function(k) { row[k] = (row[k] || 0) + patch[k]; });
    row.updatedAt = Date.now();
    stats[videoId] = row;
    saveStats(stats);
  }
  function rememberSearchQuery() {
    if (location.pathname !== '/search') return;
    var q = '';
    try { q = new URL(location.href).searchParams.get('q') || ''; } catch (e) {}
    q = text(q);
    if (!q) return;
    var list = readJson(STORAGE.searches, []);
    list = list.filter(function(x) { return x && x.q !== q; });
    list.unshift({ q: q, at: Date.now() });
    writeJson(STORAGE.searches, list.slice(0, 50));
    rememberSessionEvent({ type: 'search', query: q, at: Date.now() });
  }
  function rememberWatchTelemetry() {
    if (!location.pathname.startsWith('/watch')) return;
    var id = '';
    try { id = new URL(location.href).searchParams.get('v') || ''; } catch (e) {}
    if (!id) return;
    var h1 = $('#player-container + .h-box h1') || $('.h-box h1') || $('h1');
    var author = $('#channel-name') || $('a[href^="/channel/"]');
    var authorLink = author && author.closest ? author.closest('a[href^="/channel/"]') : $('a[href^="/channel/"]');
    var channelId = '';
    try { channelId = ((authorLink && authorLink.getAttribute('href')) || '').split('/channel/')[1] || ''; } catch (e) {}
    var item = { videoId: id, title: text(h1 && h1.textContent), author: text(author && author.textContent), channelId: channelId, watchedAt: Date.now() };
    var history = readJson(STORAGE.watchHistory, []);
    history = history.filter(function(x) { return x && x.videoId !== id; });
    history.unshift(item);
    writeJson(STORAGE.watchHistory, history.slice(0, 160));
    rememberSessionEvent({ type: 'watch', videoId: id, title: item.title, author: item.author, channelId: channelId, at: Date.now() });

    var video = $('video#player, #player_html5_api, video');
    if (!video || video.dataset.ftTelemetry) return;
    video.dataset.ftTelemetry = '1';
    var lastTime = 0;
    var watchSeconds = 0;
    var maxProgress = 0;
    var loopCount = 0;
    function duration() { return Number(video.duration || parseDurationSeconds(item) || 0) || 0; }
    function snapshot(extra) {
      var d = duration();
      var current = Number(video.currentTime || 0) || 0;
      if (current + 1 < lastTime && lastTime > d * 0.65) loopCount += 1;
      maxProgress = Math.max(maxProgress, d ? current / d : 0);
      lastTime = current;
      var payload = { watchSeconds: watchSeconds };
      if (maxProgress >= 0.9) payload.completions = 1;
      if (loopCount > 0) payload.loops = loopCount;
      if (extra) Object.keys(extra).forEach(function(k) { payload[k] = extra[k]; });
      bumpStat(id, payload);
      watchSeconds = 0;
      loopCount = 0;
    }
    video.addEventListener('timeupdate', function() {
      var now = Number(video.currentTime || 0) || 0;
      if (lastTime && now > lastTime) watchSeconds += Math.min(2, now - lastTime);
      maxProgress = Math.max(maxProgress, duration() ? now / duration() : 0);
      lastTime = now;
    });
    video.addEventListener('ended', function() { snapshot({ completions: 1 }); });
    window.addEventListener('pagehide', function() { snapshot(); });
  }

  var FT_PROFILE_CACHE = null;
  function loadTakeoutProfile() {
    // Single-user FoxTube: use the imported YouTube profile + current local telemetry.
    // Invidious auth subscriptions alone are too narrow/stale and made Para ti feel unrelated.
    var localHistory = readJson(STORAGE.watchHistory, []);
    var searches = readJson(STORAGE.searches, []);
    var base = { subscriptions: [], watchHistory: localHistory, searches: searches, topWatchedChannels: [], topTokens: [] };
    function mergeProfile(profile) {
      profile = profile || {};
      var byVideo = Object.create(null);
      var watch = [];
      (localHistory || []).forEach(function(v) { if (v && v.videoId && !byVideo[v.videoId]) { byVideo[v.videoId] = 1; watch.push(v); } });
      (profile.watchHistory || []).forEach(function(v) { if (v && v.videoId && !byVideo[v.videoId]) { byVideo[v.videoId] = 1; watch.push(v); } });
      base.watchHistory = watch.slice(0, 2600);
      base.searches = searches.length ? searches : (profile.searches || []);
      base.subscriptions = (profile.subscriptions || []).slice(0, 700);
      base.topWatchedChannels = profile.topWatchedChannels || [];
      base.topTokens = profile.topTokens || [];
      return base;
    }
    return fetchJson('/foxtube-profile.json?_ft=' + Date.now()).then(function(profile) {
      return mergeProfile(profile);
    }).then(function(profileBase) {
      if (!isLoggedIn()) return profileBase;
      return fetchJson('/api/v1/auth/subscriptions?_ft=' + Date.now()).then(function(subs) {
        var seen = Object.create(null);
        profileBase.subscriptions.forEach(function(s) { seen[(s.channelId || s.title || '').toLowerCase()] = true; });
        normalizeList(subs).forEach(function(s) {
          var row = {
            channelId: s.authorId || s.channelId || s.ucid || s.id || '',
            title: s.author || s.authorName || s.name || s.title || ''
          };
          var k = (row.channelId || row.title || '').toLowerCase();
          if ((row.title || row.channelId) && !seen[k]) { seen[k] = true; profileBase.subscriptions.push(row); }
        });
        return profileBase;
      });
    });
  }

  function tokenizeHistory() {
    var stop = Object.create(null);
    'el la los las un una unos unas de del y o a en con para por que como mi tu su es al lo se the and for with from video videos oficial official review clip shorts short'.split(' ').forEach(function(w) { stop[w] = true; });
    var counts = Object.create(null);
    readJson(STORAGE.watchHistory, []).slice(0, 70).forEach(function(v) {
      text((v.title || '') + ' ' + (v.author || '')).toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(function(w) {
        if (w.length >= 4 && !stop[w]) counts[w] = (counts[w] || 0) + 1;
      });
    });
    return Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; }).slice(0, 20);
  }
  function buildCandidateQueries(kind, profile) {
    profile = profile || {};
    var queries = [];
    function add(q) { q = text(q); if (q && queries.indexOf(q) === -1) queries.push(q); }
    var localHistory = profile.watchHistory || readJson(STORAGE.watchHistory, []);
    var searches = profile.searches || readJson(STORAGE.searches, []);
    var tokens = tokenizeHistory();

    if (kind === 'shorts') {
      localHistory.slice(0, 70).forEach(function(v) {
        if (v.author) { add(v.author + ' shorts'); add(v.author + ' clips'); }
        if (v.title) add(v.title + ' shorts');
      });
      (profile.subscriptions || []).slice(0, 100).forEach(function(s) {
        var name = s.title || s.author || s.authorName || s.name;
        if (name) add(name + ' shorts');
      });
      searches.slice(0, 18).forEach(function(s) { add(s.q + ' shorts'); add(s.q + ' clips'); });
      tokens.slice(0, 16).map(cleanTopicToken).filter(Boolean).forEach(function(t) { add(t + ' shorts'); add(t + ' clips'); });
      if (!queries.length) ['gaming shorts', 'memes shorts', 'música shorts', 'tecnología shorts'].forEach(add);
      return sample(queries, 24, 'user-short-candidates');
    }

    var signals = buildProfileSignals(profile);
    signals.sessionTokens.slice(0, 16).forEach(add);
    (profile.topWatchedChannels || []).slice(0, 110).forEach(function(c) { add(c.title || c.author || c.name); });
    localHistory.slice(0, 180).forEach(function(v) {
      add(v.author);
      var title = text(v.title || '').replace(/[\[\(].*?[\]\)]/g, ' ').split(/[-:|]/)[0];
      add(title);
    });
    searches.slice(0, 24).forEach(function(s) { add(s.q); });
    (profile.topTokens || []).slice(0, 80).forEach(function(t) { add(cleanTopicToken(t.token || t)); });
    signals.topTokens.slice(0, 36).forEach(add);
    tokens.map(cleanTopicToken).filter(Boolean).forEach(add);
    if (!queries.length) ['minecraft español', 'roblox español', 'programación', 'anime español'].forEach(add);
    return sample(queries, 38, 'user-feed-candidates');
  }

  function annotate(items, source, weight) {
    return (items || []).map(function(v) {
      v.__ft_source = source;
      v.__ft_sourceWeight = weight;
      return v;
    });
  }
  function dedupe(items) {
    var seen = Object.create(null);
    var out = [];
    (items || []).forEach(function(v) {
      if (!v || !v.videoId || seen[v.videoId]) return;
      seen[v.videoId] = true;
      out.push(v);
    });
    return out;
  }
  function generateCandidates(kind) {
    return loadTakeoutProfile().then(function(profile) {
      LAST_PROFILE_SIGNALS = buildProfileSignals(profile);
      var queries = buildCandidateQueries(kind, profile);
      var jobs = [];
      if (kind !== 'shorts') {
        var watchedIds = (profile.watchHistory || []).slice(0, 160).map(function(v) { return v.videoId; }).filter(Boolean);
        if (watchedIds.length) {
          jobs.push(Promise.all(sample(watchedIds, 28, 'user-related-videos').map(apiRelatedVideos)).then(function(groups) {
            return annotate([].concat.apply([], groups), 'related-to-watch-history', 2.35);
          }));
        }
      }
      var channelScores = Object.create(null);
      (profile.watchHistory || []).slice(0, 900).forEach(function(v, idx) {
        if (!/^UC[\w-]{20,}$/.test(v.channelId || '')) return;
        channelScores[v.channelId] = (channelScores[v.channelId] || 0) + (idx < 100 ? 3 : idx < 300 ? 2 : 1);
      });
      var channelIds = Object.keys(channelScores).sort(function(a, b) { return channelScores[b] - channelScores[a]; });
      if (kind !== 'shorts' && channelIds.length) {
        jobs.push(Promise.all(sample(channelIds, 18, 'user-watched-channel-ids').map(apiChannelVideos)).then(function(groups) {
          return annotate([].concat.apply([], groups), 'watched-channel-latest', 1.75);
        }));
      }
      var subIds = (profile.subscriptions || []).map(function(s) { return s.channelId; }).filter(function(id) { return /^UC[\w-]{20,}$/.test(id || ''); });
      if (kind !== 'shorts' && subIds.length) {
        jobs.push(Promise.all(sample(subIds, 16, 'subscription-explore').map(apiChannelVideos)).then(function(groups) {
          return annotate([].concat.apply([], groups), 'subscription-latest', 0.95);
        }));
      }
      if (kind === 'shorts' && channelIds.length) {
        jobs.push(Promise.all(sample(channelIds, 18, 'user-short-channel-ids').map(apiChannelVideos)).then(function(groups) {
          var vids = [].concat.apply([], groups).filter(function(v) {
            var len = parseDurationSeconds(v);
            return (len && len <= 180) || /shorts?|#shorts|clip/i.test((v.title || '') + ' ' + (v.author || ''));
          });
          return annotate(vids, 'subscribed-shorts', 1.9);
        }));
      }
      sample(queries, kind === 'shorts' ? 20 : 30, kind + ':queries:' + FEED_REFRESH_COUNTER).forEach(function(q, i) {
        var sort = kind === 'shorts' ? (i % 2 ? 'date' : 'relevance') : ['date', 'relevance', 'view_count'][i % 3];
        var maxPage = sort === 'date' ? 6 : 4;
        var page = randomPage(kind + ':' + q + ':' + sort + ':' + i, maxPage);
        jobs.push(apiSearch(q, sort, page, kind === 'shorts' ? { duration: 'short' } : null)
          .then(function(x) { return annotate(x, 'user-query:' + q, kind === 'shorts' ? 1.35 : 1.25); }));
      });
      if (kind !== 'shorts') {
        ['música nueva', 'gaming español', 'tecnología reciente', 'comedia mexicana', 'anime español', 'programación actual'].forEach(function(q, i) {
          jobs.push(apiSearch(q, i % 2 ? 'date' : 'view_count', randomPage('explore:' + q + ':' + i, 3)).then(function(x) { return annotate(x, 'explore:' + q, 0.55); }));
        });
      }
      return Promise.all(jobs).then(function(groups) {
        var signals = LAST_PROFILE_SIGNALS || buildProfileSignals(profile);
        return dedupe([].concat.apply([], groups)).filter(function(v) { return candidateMatchesProfile(v, signals); });
      });
    });
  }

  function publishedAgeDays(v) {
    var t = text(v && v.publishedText).toLowerCase();
    var m = t.match(/hace\s+(\d+)\s+(segundo|minuto|hora|día|dia|semana|mes|año|anos|años|second|minute|hour|day|week|month|year)s?/i);
    if (!m) return 30;
    var n = Number(m[1]) || 0;
    var unit = m[2];
    if (/segundo|second|minuto|minute|hora|hour/.test(unit)) return 0.05;
    if (/día|dia|day/.test(unit)) return n;
    if (/semana|week/.test(unit)) return n * 7;
    if (/mes|month/.test(unit)) return n * 30;
    if (/año|anos|años|year/.test(unit)) return n * 365;
    return 30;
  }
  function freshnessBoost(v, kind) {
    var d = publishedAgeDays(v);
    if (kind === 'popular') {
      if (d <= 2) return 2.2;
      if (d <= 7) return 1.8;
      if (d <= 30) return 1.25;
      if (d <= 90) return 0.65;
      if (d <= 365) return 0.25;
      return -1.2;
    }
    if (d <= 7) return 1.45;
    if (d <= 30) return 1.15;
    if (d <= 120) return 0.75;
    if (d <= 365) return 0.25;
    return -0.35;
  }
  function getFreshGlobalPopularCandidates() {
    var jobs = [
      fetchJson('/api/v1/popular?_ft=' + Date.now()).then(function(x) { return annotate(normalizeList(x), 'popular', 2.0); }),
      fetchJson('/api/v1/trending?_ft=' + Date.now()).then(function(x) { return annotate(normalizeList(x), 'trending', 2.25); })
    ];
    ['música', 'gaming', 'noticias', 'tecnología', 'deportes', 'entretenimiento', 'trailers', 'comedia', 'roblox', 'minecraft', 'podcast'].forEach(function(q, i) {
      var sort = i % 2 ? 'date' : 'view_count';
      jobs.push(apiSearch(q, sort, randomPage('popular:' + q + ':' + i, 5)).then(function(x) { return annotate(x, 'popular:' + q, 1.05); }));
    });
    return Promise.all(jobs).then(function(groups) {
      return dedupe([].concat.apply([], groups)).filter(function(v) {
        var days = publishedAgeDays(v);
        return parseViews(v) >= 25000 && days <= 365;
      });
    });
  }
  function affinityScore(v, signals) {
    signals = signals || LAST_PROFILE_SIGNALS || buildProfileSignals({});
    var score = 0;
    var author = text(v.author || v.authorName || '').toLowerCase();
    if (author && (signals.authors || {})[author]) score += Math.min(3.2, signals.authors[author] / 18);
    if (v.authorId && (signals.channelIds || {})[v.authorId]) score += Math.min(2.8, signals.channelIds[v.authorId] / 18);
    tokenizeForProfile((v.title || '') + ' ' + (v.author || v.authorName || '')).forEach(function(t) {
      if ((signals.topMap || {})[t]) score += Math.min(0.75, signals.topMap[t] / 16);
      if ((signals.sessionMap || {})[t]) score += Math.min(1.2, signals.sessionMap[t] / 9);
    });
    return score;
  }
  function topicKey(v) {
    var toks = tokenizeForProfile((v.title || '') + ' ' + (v.author || v.authorName || '')).slice(0, 4);
    return toks.join('|') || text(v.author || v.authorName || 'other').toLowerCase();
  }
  function feedbackPenalty(v, signals) {
    signals = signals || LAST_PROFILE_SIGNALS || buildProfileSignals({});
    var fb = signals.feedback || readFeedback();
    if ((fb.notInterested || {})[v.videoId]) return 99;
    var channelKey = v.authorId || v.channelId || text(v.author || v.authorName || '').toLowerCase();
    if (channelKey && (fb.blockedChannels || {})[channelKey]) return 99;
    var penalty = 0;
    tokenizeForProfile((v.title || '') + ' ' + (v.author || v.authorName || '')).forEach(function(t) {
      if ((fb.negativeTopics || {})[t]) penalty += Math.min(2.5, fb.negativeTopics[t] * 0.8);
    });
    return penalty;
  }
  function scoreVideo(v, stats, kind, index) {
    var s = stats[v.videoId] || {};
    var length = parseDurationSeconds(v) || (kind === 'shorts' ? 45 : 480);
    var views = parseViews(v);
    var impressions = Number(s.impressions || 0);
    var clicks = Number(s.clicks || 0);
    var skips = Number(s.skips || 0);
    var ctr = (clicks + 1.5) / (impressions + 8);
    var completionRate = (Number(s.completions || 0) + 0.35) / (Math.max(clicks, 1) + 1.2);
    var watchRate = Math.min(1.4, (Number(s.watchSeconds || 0) + length * 0.42) / (Math.max(clicks, 1) * Math.max(length, 1) + length));
    var sourceBoost = Number(v.__ft_sourceWeight || 1);
    var fresh = freshnessBoost(v, kind || 'feed');
    var popularity = Math.log10(Math.max(views, 1)) / 8;
    var randomJitter = (seededRand(hashSeed(v.videoId + ':' + Date.now())).value - 0.5) * 0.08;
    var affinity = affinityScore(v, LAST_PROFILE_SIGNALS);
    var source = String(v.__ft_source || '');
    var exploration = /explore|popular|trending/.test(source) ? 0.24 : 0;
    var negative = feedbackPenalty(v, LAST_PROFILE_SIGNALS) + Math.min(2.2, skips * 0.55);

    if (kind === 'shorts') {
      var isShortLength = length > 0 && length <= 90;
      var swipeAway = Number(s.swipes || 0);
      var loops = Number(s.loops || 0);
      var shortAffinity = isShortLength ? 1.35 : (/shorts?|#shorts/i.test((v.title || '') + ' ' + (v.author || '')) ? 1.08 : 0.28);
      return (
        shortAffinity * 2.2 +
        completionRate * 2.4 +
        Math.min(1.2, loops / 3) * 1.2 +
        affinity * 0.55 +
        ctr * 1.1 +
        popularity * 0.55 +
        sourceBoost * 0.2 -
        swipeAway * 0.75 +
        exploration -
        negative +
        randomJitter
      );
    }

    var expectedWatchTime = Math.min(1800, length * (0.28 + watchRate * 0.55 + completionRate * 0.17));
    return (
      expectedWatchTime / 360 * 2.0 +
      ctr * 1.25 +
      completionRate * 1.25 +
      affinity * 1.55 +
      sourceBoost * 0.55 +
      popularity * 0.55 +
      fresh +
      exploration -
      negative +
      randomJitter -
      index * 0.0008
    );
  }
  function diversify(ranked) {
    var authorCount = Object.create(null);
    var topicCount = Object.create(null);
    var out = [];
    ranked.forEach(function(v) {
      var author = text(v.author || v.authorName || 'unknown').toLowerCase();
      var count = authorCount[author] || 0;
      var tk = topicKey(v);
      var topicSeen = topicCount[tk] || 0;
      if (count >= 2 && out.length < 24) return;
      if (topicSeen >= 4 && out.length < 36) return;
      authorCount[author] = count + 1;
      topicCount[tk] = topicSeen + 1;
      out.push(v);
    });
    return out.concat(ranked.filter(function(v) { return out.indexOf(v) === -1; }));
  }
  function rankCandidates(candidates, kind) {
    var stats = getStats();
    return diversify((candidates || []).filter(allowCandidate).map(function(v, i) {
      v.__ft_score = scoreVideo(v, stats, kind || 'feed', i);
      return v;
    }).sort(function(a, b) { return b.__ft_score - a.__ft_score; }));
  }
  function rotateFeedSelection(ranked, kind) {
    ranked = ranked || [];
    var key = kind || 'feed';
    var history = readJson(STORAGE.lastFeeds, {});
    var previous = history[key] || [];
    var previousSet = Object.create(null);
    previous.forEach(function(id) { previousSet[id] = true; });
    // Only rotate inside the already-good candidate pool. Do not promote weak/random
    // videos just because they are new; that is what made Para ti stop feeling personal.
    var pool = ranked.slice(0, Math.max(REC_LIMIT * 3, 160));
    var fresh = [];
    var repeats = [];
    pool.forEach(function(v) {
      if (previousSet[v.videoId]) repeats.push(v);
      else fresh.push(v);
    });
    function bandShuffle(items) {
      var out = [];
      for (var i = 0; i < items.length; i += 12) {
        out = out.concat(shuffle(items.slice(i, i + 12), key + ':band:' + i));
      }
      return out;
    }
    var mixed = bandShuffle(fresh).concat(bandShuffle(repeats));
    if (fresh.length < REC_LIMIT * 0.45) mixed = bandShuffle(pool);
    history[key] = mixed.slice(0, REC_LIMIT).map(function(v) { return v.videoId; });
    history.updatedAt = Date.now();
    writeJson(STORAGE.lastFeeds, history);
    return mixed;
  }
  function markImpressions(videos, kind) {
    var session = readJson(STORAGE.impressions, {});
    var today = new Date().toISOString().slice(0, 10) + ':' + kind;
    session[today] = session[today] || {};
    (videos || []).forEach(function(v) {
      if (!v || !v.videoId || session[today][v.videoId]) return;
      session[today][v.videoId] = 1;
      bumpStat(v.videoId, { impressions: 1 });
    });
    Object.keys(session).slice(0, -5).forEach(function(k) { delete session[k]; });
    writeJson(STORAGE.impressions, session);
  }
  function formatDuration(seconds) {
    seconds = Number(seconds || 0) || 0;
    if (!seconds) return '';
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    return h ? (h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')) : (m + ':' + String(s).padStart(2, '0'));
  }
  function card(v) {
    var id = v.videoId;
    var views = v.viewCountText || (parseViews(v) ? parseViews(v).toLocaleString('es-MX') + ' visualizaciones' : '');
    var meta = [v.author || v.authorName || '', views, v.publishedText || ''].filter(Boolean).join(' · ');
    var duration = formatDuration(v.lengthSeconds || v.length || parseDurationSeconds(v));
    var channelKey = esc(v.authorId || v.channelId || text(v.author || v.authorName || '').toLowerCase());
    return '<article class="ft-pro-card" data-video-id="' + esc(id) + '" data-channel-key="' + channelKey + '" data-title="' + esc(v.title || '') + '" data-author="' + esc(v.author || v.authorName || '') + '">' +
      '<a class="ft-pro-thumb" href="/watch?v=' + encodeURIComponent(id) + '"><img loading="lazy" src="/vi/' + encodeURIComponent(id) + '/mqdefault.jpg" alt="">' + (duration ? '<span class="ft-duration">' + esc(duration) + '</span>' : '') + '</a>' +
      '<a class="ft-pro-title" href="/watch?v=' + encodeURIComponent(id) + '">' + esc(v.title || 'Video') + '</a>' +
      '<div class="ft-pro-meta">' + esc(meta) + '</div>' +
      '<div class="ft-card-actions"><button type="button" data-ft-action="more-like">Mas asi</button><button type="button" data-ft-action="not-interested">No me interesa</button><button type="button" data-ft-action="block-channel">No canal</button></div>' +
      '</article>';
  }
  function applyCardFeedback(cardEl, action) {
    if (!cardEl || !action) return;
    var id = cardEl.dataset.videoId || '';
    var channelKey = cardEl.dataset.channelKey || '';
    var title = cardEl.dataset.title || '';
    var author = cardEl.dataset.author || '';
    var fb = readFeedback();
    tokenizeForProfile(title + ' ' + author).forEach(function(t) {
      if (action === 'more-like') fb.positiveTopics[t] = (fb.positiveTopics[t] || 0) + 1;
      if (action === 'not-interested' || action === 'block-channel') fb.negativeTopics[t] = (fb.negativeTopics[t] || 0) + 1;
    });
    if (action === 'not-interested' && id) {
      fb.notInterested[id] = Date.now();
      bumpStat(id, { skips: 1 });
      cardEl.remove();
    }
    if (action === 'block-channel' && channelKey) {
      fb.blockedChannels[channelKey] = Date.now();
      $all('.ft-pro-card[data-channel-key="' + cssEsc(channelKey) + '"]').forEach(function(x) { x.remove(); });
    }
    if (action === 'more-like') {
      cardEl.classList.add('ft-feedback-positive');
      if (id) bumpStat(id, { clicks: 1 });
    }
    saveFeedback(fb);
  }
  function routeIsForYou() {
    if (!canShowForYou()) return false;
    try {
      var u = new URL(location.href);
      return location.pathname === '/' || u.searchParams.get('ft_feed') === '1' || u.searchParams.get('ft') === 'for-you';
    } catch (e) { return canShowForYou() && location.pathname === '/'; }
  }
  function routeIsShorts() { return location.pathname === '/shorts' || (new URL(location.href)).searchParams.get('ft_shorts') === '1'; }
  function routeIsPopular() { return (location.pathname === '/feed/popular' || location.pathname === '/feed/trending') && !routeIsForYou() && !routeIsShorts(); }
  function ensureNav() {
    var menu = $('.feed-menu');
    if (!menu) {
      var navbar = $('.navbar');
      if (!navbar || !navbar.parentNode) return;
      menu = document.createElement('nav');
      menu.className = 'feed-menu ft-nav-menu';
      menu.setAttribute('aria-label', 'FoxTube navigation');
      navbar.parentNode.insertBefore(menu, navbar.nextSibling);
    }
    function has(label, hrefPart) {
      return $all('a', menu).some(function(a) {
        var href = a.getAttribute('href') || '';
        var txt = text(a.textContent).toLowerCase();
        return (hrefPart && href.indexOf(hrefPart) !== -1) || txt === label.toLowerCase();
      });
    }
    function add(label, href) {
      if (has(label, href)) return;
      var a = document.createElement('a');
      a.href = href;
      a.className = 'feed-menu-item pure-menu-heading ft-nav-extra';
      a.textContent = label;
      menu.appendChild(a);
    }
    if (canShowForYou()) {
      add('Para ti', '/feed/popular?ft_feed=1');
      add('Subscripciones', '/feed/subscriptions');
      add('Historial', '/feed/history');
      add('Listas', '/feed/playlists');
    }
    add('Shorts', '/shorts');
  }
  function buildFeed(kind) {
    if (!routeIsForYou() && !routeIsPopular()) return;
    ensureNav();
    $all('.ft-pro-feed, .ft-rec-feed').forEach(function(x) { x.remove(); });
    var oldGrid = $('#contents > .pure-g:not(.navbar)');
    if (oldGrid) oldGrid.style.display = 'none';
    var menu = $('.feed-menu');
    var host = (menu && menu.parentNode) ? menu : ($('#contents') || document.body);
    var section = document.createElement('section');
    section.className = 'ft-pro-feed';
    var title = routeIsPopular() ? 'Populares' : 'Para ti';
    var SKEL = '';
    for (var _s = 0; _s < 12; _s++) {
      SKEL += '<div class="ft-skel-card"><div class="ft-skel-thumb ft-loading"></div>' +
              '<div class="ft-skel-meta"><div class="ft-skel-line ft-loading"></div>' +
              '<div class="ft-skel-line ft-loading short"></div></div></div>';
    }
    section.innerHTML = '<div class="ft-pro-heading"><div><h2>' + title + '</h2></div><button type="button" class="ft-refresh-feed">Refrescar</button></div><div class="ft-pro-grid">' + SKEL + '</div>';
    if (menu && menu.parentNode) menu.parentNode.insertBefore(section, menu.nextSibling);
    else host.appendChild(section);
    var grid = $('.ft-pro-grid', section);
    $('.ft-refresh-feed', section).addEventListener('click', function() { FEED_REFRESH_COUNTER += 1; buildFeed(kind); });
    var popularRoute = routeIsPopular();
    var loader = popularRoute ? getFreshGlobalPopularCandidates : function() { return generateCandidates('feed'); };
    loader().then(function(candidates) {
      var ranked = popularRoute ? rankCandidates(candidates, 'popular') : rankCandidates(candidates, 'feed');
      ranked = rotateFeedSelection(ranked, popularRoute ? 'popular' : 'feed').slice(0, REC_LIMIT);
      markImpressions(ranked, routeIsPopular() ? 'popular' : 'feed');
      grid.innerHTML = ranked.length ? ranked.map(card).join('') : '<div class="ft-rec-empty">No se pudieron generar recomendaciones.</div>';
      grid.addEventListener('click', function(e) {
        var fbBtn = e.target.closest('button[data-ft-action]');
        if (fbBtn) {
          e.preventDefault();
          applyCardFeedback(fbBtn.closest('.ft-pro-card'), fbBtn.dataset.ftAction);
          return;
        }
        var a = e.target.closest('a[href^="/watch?v="]');
        if (!a) return;
        var id = (new URL(a.href, location.origin)).searchParams.get('v');
        bumpStat(id, { clicks: 1 });
      }, { once: false });
    });
  }
  function shortSlide(v, active) {
    var id = v.videoId;
    var meta = [v.author || v.authorName || '', v.viewCountText || '', v.publishedText || ''].filter(Boolean).join(' · ');
    return '<article class="ft-short-slide' + (active ? ' active' : '') + '" data-video-id="' + esc(id) + '">' +
      '<div class="ft-short-frame" data-src="/embed/' + encodeURIComponent(id) + '?autoplay=1&controls=1&loop=1&playsinline=1"></div>' +
      '<div class="ft-short-info"><h2>' + esc(v.title || 'Short') + '</h2><p>' + esc(meta) + '</p><a href="/watch?v=' + encodeURIComponent(id) + '">Abrir video completo</a></div>' +
      '</article>';
  }
  function materializeShort(slide) {
    var frame = $('.ft-short-frame', slide);
    if (!frame || frame.dataset.loaded === '1') return;
    frame.dataset.loaded = '1';
    var iframe = document.createElement('iframe');
    iframe.src = frame.dataset.src;
    iframe.loading = 'eager';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    frame.appendChild(iframe);
    iframe.addEventListener('load', function() { forceShortAutoplay(slide); });
    setTimeout(function() { forceShortAutoplay(slide); }, 350);
  }
  function unloadShort(slide) {
    var frame = $('.ft-short-frame', slide);
    if (!frame) return;
    $all('iframe', frame).forEach(function(iframe) {
      try { iframe.src = 'about:blank'; } catch (e) {}
      iframe.remove();
    });
    frame.dataset.loaded = '';
  }
  function activateShort(slides, idx) {
    slides.forEach(function(s, i) {
      var active = i === idx;
      s.classList.toggle('active', active);
      if (active) {
        materializeShort(s);
        forceShortAutoplay(s);
      } else unloadShort(s);
    });
  }
  function prefetchShorts(slides, start) {
    // Prefetch only static assets/HTML for the next 3 items. Do NOT create autoplay
    // iframes here; otherwise every prefetched Short plays at the same time.
    for (var i = start; i < Math.min(slides.length, start + 3); i++) {
      var id = slides[i].dataset.videoId;
      var img = new Image();
      img.src = '/vi/' + encodeURIComponent(id) + '/maxres.jpg';
      fetch('/watch?v=' + encodeURIComponent(id), { cache: 'force-cache', credentials: 'same-origin' }).catch(function() {});
    }
  }
  function buildShorts() {
    if (!routeIsShorts()) return;
    ensureNav();
    document.body.classList.add('ft-shorts-page');
    var contents = $('#contents') || document.body;
    contents.innerHTML = '<nav class="ft-shorts-top"><a href="/feed/popular">FoxTube</a><strong>Shorts</strong><span>Videos cortos</span></nav><main class="ft-shorts-rail"><div class="ft-rec-empty">Cargando Shorts…</div></main>';
    var rail = $('.ft-shorts-rail');
    generateCandidates('shorts').then(function(candidates) {
      var ranked = rankCandidates(candidates, 'shorts').filter(function(v) {
        var len = parseDurationSeconds(v);
        var label = (v.title || '') + ' ' + (v.author || '') + ' ' + (v.description || '');
        return (len && len <= 120) || /#shorts|\bshorts\b|\bclip\b|\bclips\b/i.test(label);
      }).slice(0, SHORTS_LIMIT);
      if (!ranked.length) ranked = rankCandidates(candidates, 'shorts').filter(function(v) {
        var len = parseDurationSeconds(v);
        return !len || len <= 240;
      }).slice(0, SHORTS_LIMIT);
      markImpressions(ranked, 'shorts');
      rail.innerHTML = ranked.map(function(v, i) { return shortSlide(v, i === 0); }).join('');
      var slides = $all('.ft-short-slide', rail);
      activateShort(slides, 0);
      prefetchShorts(slides, 1);
      var enteredAt = Date.now();
      var currentId = slides[0] && slides[0].dataset.videoId;
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.65) return;
          var slide = entry.target;
          var idx = slides.indexOf(slide);
          var elapsed = Date.now() - enteredAt;
          if (currentId && currentId !== slide.dataset.videoId && elapsed < 2500) bumpStat(currentId, { swipes: 1 });
          currentId = slide.dataset.videoId;
          enteredAt = Date.now();
          activateShort(slides, idx);
          prefetchShorts(slides, idx + 1);
        });
      }, { threshold: [0.65] });
      slides.forEach(function(s) { observer.observe(s); });
      rail.addEventListener('scroll', function() {
        var idx = Math.max(0, Math.round(rail.scrollTop / Math.max(1, rail.clientHeight)));
        prefetchShorts(slides, idx + 1);
      }, { passive: true });
    });
  }


  function forcePlayVideo(video, preferSound) {
    if (!video) return;
    try {
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      if (preferSound === false) video.muted = true;
      var p = video.play && video.play();
      if (p && p.catch) {
        p.catch(function() {
          // Browser policy can block autoplay with sound. Fall back to muted autoplay
          // so the user does not have to press the big play button.
          try {
            video.muted = true;
            video.setAttribute('muted', '');
            video.play().catch(function() {});
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  function forceWatchAutoplay(attempt) {
    if (!location.pathname.startsWith('/watch')) return;
    attempt = attempt || 0;
    var video = $('video#player, #player_html5_api, video');
    var player = null;
    try { if (window.videojs) player = window.videojs.getPlayer('player') || window.videojs('player'); } catch (e) {}
    try {
      if (player) {
        if (player.autoplay) player.autoplay(true);
        if (player.ready) player.ready(function() {
          try {
            var pp = player.play && player.play();
            if (pp && pp.catch) pp.catch(function() {
              try { if (player.muted) player.muted(true); player.play().catch(function() {}); } catch (e) {}
            });
          } catch (e) {}
        });
      }
    } catch (e) {}
    if (video) forcePlayVideo(video, true);
    else if (attempt < 24) setTimeout(function() { forceWatchAutoplay(attempt + 1); }, 250);
  }

  function forceShortAutoplay(slide, attempt) {
    slide = slide || $('.ft-short-slide.active');
    if (!slide) return;
    attempt = attempt || 0;
    var iframe = $('iframe', slide);
    var video = null;
    try { video = iframe && iframe.contentDocument && iframe.contentDocument.querySelector('video'); } catch (e) {}
    if (video) {
      forcePlayVideo(video, true);
      return;
    }
    if (attempt < 30) setTimeout(function() { forceShortAutoplay(slide, attempt + 1); }, 200);
  }


  function installKeyboardHandler() {
    if (window.__ftKeyboardInstalled) return;
    window.__ftKeyboardInstalled = true;
    document.addEventListener('keydown', function(e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
      var key = e.key || '';
      var video = null;
      // Find the active video element: Video.js on watch page, or iframe in Shorts
      if (routeIsShorts()) {
        var active = $('.ft-short-slide.active') || $('.ft-short-slide');
        var iframe = active && $('iframe');
        try { video = iframe && iframe.contentDocument && iframe.contentDocument.querySelector('video'); } catch(ignored){}
        if (!video) {
          try { video = iframe && iframe.contentWindow && iframe.contentWindow.document.querySelector('video'); } catch(ignored){}
        }
      } else {
        video = document.querySelector('#player-container video')
          || document.querySelector('video.video-js video')
          || document.querySelector('video');
      }
      if (!video || video.tagName !== 'VIDEO') return;

      switch (key) {
        case 'j': case 'J': video.currentTime = Math.max(0, video.currentTime - 10); break;
        case 'l': case 'L': video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); break;
        case 'f': case 'F':
          try {
            var player = $('#player-container .video-js');
            if (player && player.videojsInstance && typeof player.videojsInstance.requestFullscreen === 'function') {
              player.videojsInstance.requestFullscreen();
            } else if (player && player.requestFullscreen) {
              player.requestFullscreen();
            } else if (player && player.webkitRequestFullscreen) {
              player.webkitRequestFullscreen();
            } else if (player && player.querySelector && player.querySelector('video') && player.querySelector('video').requestFullscreen) {
              player.querySelector('video').requestFullscreen();
            } else {
              document.fullscreenElement ? document.exitFullscreen() : (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
            }
          } catch(ignored){}
          break;
        case 'ArrowLeft': video.currentTime = Math.max(0, video.currentTime - 5); break;
        case 'ArrowRight': video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5); break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          video.currentTime = (Number(key) / 10) * (video.duration || 0);
          break;
        default: break;
      }
    });
  }

  function seekActiveMediaByNumberKey() {
    if (window.__ftNumberSeekBound) return;
    window.__ftNumberSeekBound = true;
    document.addEventListener('keydown', function(e) {
      if (!/^[0-9]$/.test(e.key || '')) return;
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
      var percent = Number(e.key) / 10;
      var video = null;
      if (routeIsShorts()) {
        var active = $('.ft-short-slide.active') || $('.ft-short-slide');
        var iframe = active && $('iframe', active);
        try { video = iframe && iframe.contentDocument && iframe.contentDocument.querySelector('video'); } catch (err) {}
      } else {
        video = $('video#player, #player_html5_api, video');
      }
      if (!video || !Number(video.duration)) return;
      e.preventDefault();
      video.currentTime = Math.max(0, Math.min(video.duration - 0.25, video.duration * percent));
      try { if (video.paused && routeIsShorts()) video.play().catch(function() {}); } catch (err) {}
    }, true);
  }


  function routeIsChrisSubscriptions() {
    try {
      var u = new URL(location.href);
      return canShowForYou() && (location.pathname === '/feed/subscriptions' || u.searchParams.get('ft_subscriptions') === '1');
    } catch (e) { return canShowForYou() && location.pathname === '/feed/subscriptions'; }
  }

  function renderChrisChannelCards(subscriptions) {
    return (subscriptions || []).map(function(s) {
      var id = s.channelId || '';
      var title = s.title || 'Canal';
      return '<article class="ft-chris-channel" data-title="' + esc(title.toLowerCase()) + '">' +
        '<a href="/channel/' + encodeURIComponent(id) + '"><img loading="lazy" src="/ggpht/' + encodeURIComponent(id) + '=s88-c-k-c0x00ffffff-no-rj" alt=""></a>' +
        '<a class="ft-chris-channel-title" href="/channel/' + encodeURIComponent(id) + '">' + esc(title) + '</a>' +
      '</article>';
    }).join('');
  }

  function buildChrisSubscriptionsPage() {
    if (!routeIsChrisSubscriptions()) return;
    ensureNav();
    $all('.ft-pro-feed, .ft-rec-feed, .ft-chris-subs-page').forEach(function(x) { x.remove(); });
    var oldGrid = $('#contents > .pure-g:not(.navbar)');
    if (oldGrid) oldGrid.style.display = 'none';
    var feedMenu = $('.feed-menu');
    var section = document.createElement('section');
    section.className = 'ft-chris-subs-page';
    section.innerHTML = '<div class="ft-pro-heading ft-chris-heading"><div><h2>Subscripciones</h2></div><button type="button" class="ft-refresh-feed">Refrescar</button></div><div class="ft-chris-stats">Cargando perfil…</div><div class="ft-chris-tools"><input type="search" class="ft-chris-channel-search" placeholder="Buscar canal…"></div><h3 class="ft-chris-subtitle">Videos recientes de tus subscripciones</h3><div class="ft-pro-grid ft-chris-videos"><div class="ft-rec-empty">Cargando videos…</div></div><h3 class="ft-chris-subtitle">Tus canales</h3><div class="ft-chris-channel-grid"><div class="ft-rec-empty">Cargando canales…</div></div>';
    if (feedMenu && feedMenu.parentNode) feedMenu.parentNode.insertBefore(section, feedMenu.nextSibling);
    else ($('#contents') || document.body).appendChild(section);

    function loadVideos(profile) {
      var stats = $('.ft-chris-stats', section);
      var subs = profile.subscriptions || [];
      var watch = profile.watchHistory || [];
      stats.textContent = subs.length + ' canales · ' + watch.length + ' videos recientes';
      $('.ft-chris-channel-grid', section).innerHTML = renderChrisChannelCards(subs);
      // Attach search after cards exist
      var searchInput = $('.ft-chris-channel-search', section);
      if (searchInput && !searchInput.dataset.ftSearchBound) {
        searchInput.dataset.ftSearchBound = '1';
        function doChannelSearch(val) {
          var q = text(val).toLowerCase();
          $all('.ft-chris-channel', section).forEach(function(card) {
            card.style.display = !q || (card.dataset.title || '').indexOf(q) !== -1 ? '' : 'none';
          });
        }
        searchInput.addEventListener('input', function(e) { doChannelSearch(e.target.value); });
        searchInput.addEventListener('keyup', function(e) { doChannelSearch(e.target.value); });
        searchInput.addEventListener('search', function(e) { doChannelSearch(e.target.value); });
      }
      var ids = dedupe([].concat(
        watch.slice(0, 180).map(function(v) { return { videoId: v.channelId, channelId: v.channelId }; }),
        subs.map(function(s) { return { videoId: s.channelId, channelId: s.channelId }; })
      )).map(function(x) { return x.channelId; }).filter(Boolean);
      return Promise.all(sample(ids, 42, 'user-subscription-page').map(apiChannelVideos)).then(function(groups) {
        var videos = rankCandidates(annotate(dedupe([].concat.apply([], groups)), 'user-subscriptions-page', 2.5), 'feed').slice(0, REC_LIMIT);
        markImpressions(videos, 'user-subscriptions');
        var grid = $('.ft-chris-videos', section);
        grid.innerHTML = videos.length ? videos.map(card).join('') : '<div class="ft-rec-empty">No pude cargar videos de tus canales ahorita.</div>';
        grid.addEventListener('click', function(e) {
          var a = e.target.closest('a[href^="/watch?v="]');
          if (!a) return;
          bumpStat((new URL(a.href, location.origin)).searchParams.get('v'), { clicks: 1 });
        });
      });
    }

    loadTakeoutProfile().then(loadVideos);
    $('.ft-refresh-feed', section).addEventListener('click', function() {
      $('.ft-chris-videos', section).innerHTML = '<div class="ft-rec-empty">Recargando videos…</div>';
      loadTakeoutProfile().then(loadVideos);
    });
  }



  function routeIsChrisHistory() {
    try { var u = new URL(location.href); return canShowForYou() && (location.pathname === '/feed/history' || u.searchParams.get('ft_history') === '1'); }
    catch (e) { return canShowForYou() && location.pathname === '/feed/history'; }
  }
  function routeIsChrisPlaylists() {
    try { var u = new URL(location.href); return canShowForYou() && (location.pathname === '/feed/playlists' || u.searchParams.get('ft_playlists') === '1'); }
    catch (e) { return canShowForYou() && location.pathname === '/feed/playlists'; }
  }
  function historyCard(v) {
    var id = v.videoId || '';
    if (!id) return '';
    var meta = [v.author || '', v.date || ''].filter(Boolean).join(' · ');
    return '<article class="ft-pro-card ft-history-card" data-video-id="' + esc(id) + '">' +
      '<a class="ft-pro-thumb" href="/watch?v=' + encodeURIComponent(id) + '"><img loading="lazy" src="/vi/' + encodeURIComponent(id) + '/mqdefault.jpg" alt=""></a>' +
      '<a class="ft-pro-title" href="/watch?v=' + encodeURIComponent(id) + '">' + esc(v.title || id) + '</a>' +
      '<div class="ft-pro-meta">' + esc(meta) + '</div>' +
      '</article>';
  }
  function buildChrisHistoryPage() {
    if (!routeIsChrisHistory()) return;
    ensureNav();
    $all('.ft-pro-feed, .ft-rec-feed, .ft-chris-history-page').forEach(function(x) { x.remove(); });
    var oldGrid = $('#contents > .pure-g:not(.navbar)');
    if (oldGrid) oldGrid.style.display = 'none';
    var feedMenu = $('.feed-menu');
    var section = document.createElement('section');
    section.className = 'ft-chris-history-page ft-pro-feed';
    section.innerHTML = '<div class="ft-pro-heading"><div><h2>Historial</h2></div></div><div class="ft-chris-tools"><input type="search" class="ft-chris-history-search" placeholder="Buscar en historial…"></div><div class="ft-pro-grid ft-chris-history-grid"><div class="ft-rec-empty">Cargando historial…</div></div>';
    if (feedMenu && feedMenu.parentNode) feedMenu.parentNode.insertBefore(section, feedMenu.nextSibling);
    else ($('#contents') || document.body).appendChild(section);
    loadTakeoutProfile().then(function(profile) {
      var profileHistory = (profile.watchHistory || []).map(function(v) { v._source = 'profile'; return v; });
      var localHistory = readJson(STORAGE.watchHistory, []).map(function(v) { v._source = 'local'; return v; });
      // Merge current profile/local history, deduplicated by videoId
      var seen = Object.create(null);
      var history = [];
      localHistory.concat(profileHistory).forEach(function(v) {
        if (!v || !v.videoId || seen[v.videoId]) return;
        seen[v.videoId] = true;
        // Normalize fields for display
        if (!v.date && v.watchedAt) v.date = new Date(v.watchedAt).toLocaleString('es-MX');
        if (!v.author) v.author = '';
        history.push(v);
      });
      var grid = $('.ft-chris-history-grid', section);
      function render(items) { grid.innerHTML = items.length ? items.slice(0, 240).map(historyCard).join('') : '<div class="ft-rec-empty">No hay coincidencias.</div>'; }
      render(history);
      $('.ft-chris-history-search', section).addEventListener('input', function(e) {
        var q = text(e.target.value).toLowerCase();
        render(!q ? history : history.filter(function(v) { return ((v.title||'') + ' ' + (v.author||'') + ' ' + (v.date||'')).toLowerCase().indexOf(q) !== -1; }));
      });
      grid.addEventListener('click', function(e) {
        var a = e.target.closest('a[href^="/watch?v="]');
        if (!a) return;
        bumpStat((new URL(a.href, location.origin)).searchParams.get('v'), { clicks: 1 });
      });
    });
  }
  function playlistVideoCard(v) { return historyCard(v); }
  function buildChrisPlaylistsPage() {
    if (!routeIsChrisPlaylists()) return;
    ensureNav();
    $all('.ft-pro-feed, .ft-rec-feed, .ft-chris-playlists-page').forEach(function(x) { x.remove(); });
    var oldGrid = $('#contents > .pure-g:not(.navbar)');
    if (oldGrid) oldGrid.style.display = 'none';
    var feedMenu = $('.feed-menu');
    var section = document.createElement('section');
    section.className = 'ft-chris-playlists-page ft-pro-feed';
    section.innerHTML = '<div class="ft-pro-heading"><div><h2>Listas</h2></div></div><div class="ft-chris-playlist-grid"><div class="ft-rec-empty">Cargando listas…</div></div><h3 class="ft-chris-subtitle ft-selected-playlist-title">Videos</h3><div class="ft-pro-grid ft-chris-playlist-videos"></div>';
    if (feedMenu && feedMenu.parentNode) feedMenu.parentNode.insertBefore(section, feedMenu.nextSibling);
    else ($('#contents') || document.body).appendChild(section);
    loadTakeoutProfile().then(function(profile) {
      var playlists = (profile.playlists || []).filter(function(pl) { return (pl.videos || []).length; });
      var grid = $('.ft-chris-playlist-grid', section);
      var videosGrid = $('.ft-chris-playlist-videos', section);
      var title = $('.ft-selected-playlist-title', section);
      grid.innerHTML = playlists.length ? playlists.map(function(pl, i) {
        var first = (pl.videos || [])[0] || {};
        return '<button type="button" class="ft-playlist-card' + (i===0?' active':'') + '" data-index="' + i + '">' +
          '<img loading="lazy" src="/vi/' + encodeURIComponent(first.videoId || '') + '/mqdefault.jpg" alt="">' +
          '<span class="ft-playlist-title">' + esc(pl.title || 'Playlist') + '</span>' +
          '<span class="ft-playlist-count">' + (pl.count || (pl.videos||[]).length) + ' videos</span>' +
        '</button>';
      }).join('') : '<div class="ft-rec-empty">No encontré playlists con videos.</div>';
      function select(i) {
        var pl = playlists[i] || playlists[0];
        if (!pl) return;
        $all('.ft-playlist-card', section).forEach(function(btn) { btn.classList.toggle('active', Number(btn.dataset.index) === i); });
        title.textContent = pl.title + ' · ' + (pl.count || (pl.videos||[]).length) + ' videos';
        videosGrid.innerHTML = (pl.videos || []).slice(0, 180).map(playlistVideoCard).join('') || '<div class="ft-rec-empty">Esta lista no tiene videos disponibles.</div>';
      }
      grid.addEventListener('click', function(e) { var b = e.target.closest('.ft-playlist-card'); if (b) select(Number(b.dataset.index || 0)); });
      select(0);
    });
  }



  function fixProgressBarPosition() { /* no-op - disabled, was breaking time display */ }

  // Run after Video.js initializes
  function watchForPlayer() { /* no-op - disabled */ }

  function runFoxRec() {
    installKeyboardHandler();
    ensureNav();
    seekActiveMediaByNumberKey();
    rememberSearchQuery();
    rememberWatchTelemetry();
    forceWatchAutoplay();
    if (routeIsChrisSubscriptions()) {
      if (window.__ftFoxRecRendered === location.href && $('.ft-chris-subs-page')) return;
      window.__ftFoxRecRendered = location.href;
      buildChrisSubscriptionsPage();
      return;
    }
    if (routeIsChrisHistory()) {
      if (window.__ftFoxRecRendered === location.href && $('.ft-chris-history-page')) return;
      window.__ftFoxRecRendered = location.href;
      buildChrisHistoryPage();
      return;
    }
    if (routeIsChrisPlaylists()) {
      if (window.__ftFoxRecRendered === location.href && $('.ft-chris-playlists-page')) return;
      window.__ftFoxRecRendered = location.href;
      buildChrisPlaylistsPage();
      return;
    }
    if (routeIsShorts()) {
      if (window.__ftFoxRecRendered === location.href && $('.ft-shorts-rail')) return;
      window.__ftFoxRecRendered = location.href;
      buildShorts();
      return;
    }
    if (routeIsForYou() || routeIsPopular()) {
      if (window.__ftFoxRecRendered === location.href && $('.ft-pro-feed')) return;
      window.__ftFoxRecRendered = location.href;
      buildFeed('feed');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runFoxRec);
  else runFoxRec();
  setTimeout(runFoxRec, 900);
  setTimeout(runFoxRec, 2200);
})();

// === FoxTube Player Settings Persistence v1 ===
// Saves volume, quality, speed across videos + force unmute
(function() {
  'use strict';
  var STORE_KEY = 'ft-player-prefs';
  var APPLIED_FLAG = 'ft-prefs-applied';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch(e) { return {}; }
  }
  function save(obj) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); }
    catch(e) {}
  }

  function installProgressOverlay(player) {
    try {
      var root = player.el && player.el();
      if (!root || root.querySelector('.ft-watch-progress')) return;

      var bar = document.createElement('div');
      bar.className = 'ft-watch-progress';
      bar.setAttribute('aria-label', 'Progreso del video');
      bar.innerHTML = '<span class="ft-watch-progress-buffer"></span><span class="ft-watch-progress-fill"></span><div class="ft-watch-preview"><div class="ft-watch-preview-img"></div><div class="ft-watch-preview-time">0:00</div></div>';
      root.appendChild(bar);

      var fill = bar.querySelector('.ft-watch-progress-fill');
      var buffer = bar.querySelector('.ft-watch-progress-buffer');
      var preview = bar.querySelector('.ft-watch-preview');
      var previewImg = bar.querySelector('.ft-watch-preview-img');
      var previewTime = bar.querySelector('.ft-watch-preview-time');
      var storyboard = [];

      // Keep the visible timeline full-width and theme-colored even if cached
      // Video.js CSS or browser extension styles override the stylesheet.
      root.style.setProperty('position', 'relative', 'important');
      root.style.setProperty('--ft-player-accent', 'var(--ft-accent, var(--yt-accent, #bd93f9))');
      bar.style.cssText = 'position:absolute;left:0;right:0;bottom:2.6em;z-index:31;width:100%;height:30px;cursor:pointer;background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)) center / 100% 8px no-repeat;border-radius:0;overflow:visible;transform:none;touch-action:none;-webkit-user-select:none;user-select:none;';
      buffer.style.cssText = 'position:absolute;left:0;top:11px;height:8px;width:0;background:rgba(255,255,255,.34);border-radius:0;pointer-events:none;';
      fill.style.cssText = 'position:absolute;left:0;top:11px;height:8px;width:0;background:var(--ft-player-accent);box-shadow:0 0 12px var(--ft-player-accent);border-radius:0;pointer-events:none;';
      preview.style.cssText = 'position:absolute;left:50%;bottom:14px;display:none;transform:translateX(-50%);width:170px;padding:6px;border-radius:12px;background:rgba(0,0,0,.84);box-shadow:0 12px 32px rgba(0,0,0,.5);color:#fff;pointer-events:none;';
      previewImg.style.cssText = 'width:158px;height:89px;border-radius:8px;background:#111 center / cover no-repeat;';
      previewTime.style.cssText = 'margin-top:5px;text-align:center;font-size:12px;font-weight:800;';
      var nativeProgress = root.querySelector('.vjs-progress-control');
      if (nativeProgress) nativeProgress.style.setProperty('display', 'none', 'important');
      setTimeout(function() {
        var native = root.querySelector('.vjs-progress-control');
        if (native) native.style.setProperty('display', 'none', 'important');
      }, 900);

      function fmt(t) {
        t = Math.max(0, Math.floor(t || 0));
        var h = Math.floor(t / 3600);
        var m = Math.floor((t % 3600) / 60);
        var s = t % 60;
        return h ? (h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0')) : (m + ':' + String(s).padStart(2,'0'));
      }
      function parseTime(s) {
        var p = String(s || '').split(':').map(Number);
        if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
        if (p.length === 2) return p[0]*60 + p[1];
        return Number(s) || 0;
      }
      function videoId() {
        try { return new URLSearchParams(location.search).get('v') || (window.video_data && window.video_data.id) || ''; }
        catch(e) { return ''; }
      }
      function loadStoryboard() {
        var id = videoId();
        if (!id) return;
        fetch('/api/v1/storyboards/' + encodeURIComponent(id) + '?width=160&height=90', { cache: 'force-cache' })
          .then(function(r) { return r.ok ? r.text() : ''; })
          .then(function(vtt) {
            storyboard = [];
            var lines = vtt.split(/\r?\n/);
            for (var i = 0; i < lines.length - 1; i++) {
              var m = lines[i].match(/^(\d+:\d+:\d+(?:\.\d+)?)\s+-->\s+(\d+:\d+:\d+(?:\.\d+)?)/);
              if (!m) continue;
              var url = (lines[i+1] || '').trim();
              var xy = url.match(/#xywh=(\d+),(\d+),(\d+),(\d+)/);
              var src = url.replace(/#xywh=.*/, '').replace(/^https?:\/\/[^/]+/, '');
              storyboard.push({ start: parseTime(m[1]), end: parseTime(m[2]), src: src, x: xy ? +xy[1] : 0, y: xy ? +xy[2] : 0, w: xy ? +xy[3] : 160, h: xy ? +xy[4] : 90 });
            }
          }).catch(function() {});
      }
      function frameAt(t) {
        if (!storyboard.length) return null;
        for (var i = 0; i < storyboard.length; i++) {
          if (t >= storyboard[i].start && t < storyboard[i].end) return storyboard[i];
        }
        return storyboard[storyboard.length - 1];
      }

      function pct(n) {
        return Math.max(0, Math.min(100, n || 0));
      }
      function update() {
        var dur = player.duration() || 0;
        var cur = player.currentTime() || 0;
        fill.style.width = dur ? pct((cur / dur) * 100) + '%' : '0%';
        try {
          var b = player.buffered();
          if (b && b.length && dur) {
            buffer.style.width = pct((b.end(b.length - 1) / dur) * 100) + '%';
          }
        } catch(e) {}
      }
      function eventX(e) {
        if (e && e.touches && e.touches.length) return e.touches[0].clientX;
        if (e && e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
        return e ? e.clientX : 0;
      }
      function pointToTime(e) {
        var rect = bar.getBoundingClientRect();
        var dur = player.duration() || 0;
        if (!dur || !rect.width) return null;
        var ratio = Math.max(0, Math.min(1, (eventX(e) - rect.left) / rect.width));
        return { time: ratio * dur, ratio: ratio, rect: rect };
      }
      function seek(e) {
        var p = pointToTime(e);
        if (!p) return;
        player.currentTime(p.time);
        update();
      }
      function showPreview() {
        bar.classList.add('preview-on');
        preview.style.display = 'block';
      }
      function hidePreview() {
        bar.classList.remove('preview-on');
        preview.style.display = 'none';
      }
      function hover(e) {
        var p = pointToTime(e);
        if (!p) return;
        var t = p.time;
        var localX = p.ratio * p.rect.width;
        var half = 85;
        var clamped = Math.max(half, Math.min(p.rect.width - half, localX));
        preview.style.left = clamped + 'px';
        previewTime.textContent = fmt(t);
        var fr = frameAt(t);
        if (fr) {
          previewImg.style.backgroundImage = 'url("' + fr.src + '")';
          previewImg.style.backgroundPosition = '-' + fr.x + 'px -' + fr.y + 'px';
          previewImg.style.backgroundSize = 'auto';
        } else {
          var id = videoId();
          previewImg.style.backgroundImage = id ? 'url("/vi/' + encodeURIComponent(id) + '/mqdefault.jpg")' : '';
          previewImg.style.backgroundPosition = 'center';
          previewImg.style.backgroundSize = 'cover';
        }
      }
      function scrub(e) {
        if (e && e.cancelable) e.preventDefault();
        showPreview();
        hover(e);
        seek(e);
      }
      bar.addEventListener('mouseenter', function(e) { showPreview(); hover(e); });
      bar.addEventListener('mousemove', hover);
      bar.addEventListener('mouseleave', hidePreview);
      bar.addEventListener('click', seek);
      bar.addEventListener('pointerdown', function(e) {
        scrub(e);
        try { if (bar.setPointerCapture && e.pointerId != null) bar.setPointerCapture(e.pointerId); } catch(ignored) {}
        function move(ev) { scrub(ev); }
        function up() {
          hidePreview();
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          document.removeEventListener('pointercancel', up);
        }
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', up);
      });
      bar.addEventListener('touchstart', function(e) {
        scrub(e);
        function move(ev) { scrub(ev); }
        function up() {
          hidePreview();
          document.removeEventListener('touchmove', move);
          document.removeEventListener('touchend', up);
          document.removeEventListener('touchcancel', up);
        }
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('touchend', up);
        document.addEventListener('touchcancel', up);
      }, { passive: false });
      player.on('timeupdate', update);
      player.on('durationchange', update);
      player.on('progress', update);
      player.on('loadedmetadata', update);
      loadStoryboard();
      setTimeout(update, 500);
    } catch(e) {}
  }

  function hookPlayer(player) {
    if (!player) return;
    var root = player.el && player.el();
    if (!root || root.dataset.ftHooked) return;
    root.dataset.ftHooked = '1';
    installProgressOverlay(player);

    var prefs = load();

    // --- Restore saved settings ---
    if (typeof prefs.volume === 'number') {
      player.volume(prefs.volume);
    } else {
      player.volume(1);
    }
    // FoxTube should never open videos muted unless the user mutes during this page.
    player.muted(false);
    if (typeof prefs.rate === 'number') {
      player.playbackRate(prefs.rate);
    }

    // --- Keep fighting browser/player autoplay mute after init ---
    function forceUnmute() {
      if (player.volume() <= 0) player.volume(1);
      if (player.muted()) player.muted(false);
    }
    forceUnmute();
    player.one('play', forceUnmute);
    setTimeout(forceUnmute, 300);
    setTimeout(forceUnmute, 1000);
    document.addEventListener('click', forceUnmute, { once: true });

    // --- Persist changes ---
    player.on('volumechange', function() {
      save({
        volume: player.volume(),
        muted: player.muted(),
        rate: player.playbackRate()
      });
    });
    player.on('ratechange', function() {
      save({
        volume: player.volume(),
        muted: player.muted(),
        rate: player.playbackRate()
      });
    });

    // --- Persist quality ---
    try {
      var qualityBtn = player.controlBar.getChild('qualitySelector');
      if (qualityBtn) {
        qualityBtn.on('change', function() {
          var p = load();
          p.quality = qualityBtn.selectedIndex;
          save(p);
        });
        if (typeof prefs.quality === 'number') {
          try { qualityBtn.selectedIndex = prefs.quality; } catch(e) {}
        }
      }
    } catch(e) {}
  }

  // --- Watch for VideoJS player creation ---
  function scan() {
    var playerEl = document.getElementById('player');
    if (!playerEl || !playerEl.classList.contains('video-js')) return;
    try {
      var vjs = playerEl.player || (window.videojs && window.videojs.getPlayer('player'));
      if (vjs) {
        hookPlayer(vjs);
        return;
      }
    } catch(e) {}
    // Player JS may not have initialized yet, retry
    setTimeout(scan, 400);
  }

  // --- Init ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(scan, 600); });
  } else {
    setTimeout(scan, 600);
  }
  // Extra retries for SPA navigation
  setTimeout(scan, 1500);
  setTimeout(scan, 3000);
})();

// === FoxTube Theme Switcher ===
(function() {
  'use strict';
  var THEMES = [
    { id: 'dracula',           name: 'Dracula',            swatch: '#bd93f9' },
    { id: 'catppuccin-mocha',  name: 'Mocha',              swatch: '#cba6f7' },
    { id: 'catppuccin-latte',  name: 'Latte (claro)',      swatch: '#8839ef' },
    { id: 'nord',              name: 'Nord',                swatch: '#88c0d0' },
    { id: 'amoled',            name: 'AMOLED',              swatch: '#bb86fc' },
    { id: 'midnight',          name: 'Midnight',            swatch: '#7c4dff' },
    { id: 'solarized-dark',    name: 'Solarized',          swatch: '#268bd2' },
    { id: 'rose',              name: 'Rosa (claro)',        swatch: '#e11d48' }
  ];

  function applyTheme(id) {
    document.documentElement.setAttribute('data-ft-theme', id);
    try { localStorage.setItem('ft_theme', id); } catch(e) {}
    document.querySelectorAll('.ft-theme-option').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.theme === id);
    });
  }

  function buildSwitcher() {
    if (document.getElementById('ft-theme-switcher')) return;
    var saved = null;
    try { saved = localStorage.getItem('ft_theme'); } catch(e) {}
    if (saved) applyTheme(saved);
    else applyTheme('dracula');

    var wrap = document.createElement('div');
    wrap.id = 'ft-theme-switcher';

    var btn = document.createElement('button');
    btn.id = 'ft-theme-toggle-btn';
    btn.setAttribute('aria-label', 'Cambiar tema');
    btn.setAttribute('title', 'Cambiar tema');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M12 2v20M2 12h20"/></svg>';

    var panel = document.createElement('div');
    panel.id = 'ft-theme-panel';
    var h4 = document.createElement('h4');
    h4.textContent = 'Tema';
    panel.appendChild(h4);

    THEMES.forEach(function(t) {
      var opt = document.createElement('button');
      opt.className = 'ft-theme-option';
      opt.dataset.theme = t.id;
      var currentTheme = null;
      try { currentTheme = localStorage.getItem('ft_theme') || 'dracula'; } catch(e) { currentTheme = 'dracula'; }
      if (t.id === currentTheme) opt.classList.add('active');
      opt.innerHTML = '<span class="ft-theme-swatch" style="background:' + t.swatch + '"></span>' + t.name;
      opt.addEventListener('click', function() {
        applyTheme(t.id);
        panel.classList.remove('open');
      });
      panel.appendChild(opt);
    });

    // Layout divider
    var divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:var(--ft-border-strong,#44475a);margin:8px 0;';
    panel.appendChild(divider);

    var layoutLabel = document.createElement('h4');
    layoutLabel.textContent = 'Diseño';
    layoutLabel.style.cssText = 'margin:8px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--ft-text-muted,#6e6e80);font-weight:600;padding:0 10px;';
    panel.appendChild(layoutLabel);

    var LAYOUTS = [
      { id: 'youtube',  name: 'YouTube',   icon: '▶' },
      { id: 'foxtube',  name: 'FoxTube',   icon: '🦊' }
    ];

    var savedLayout = null;
    try { savedLayout = localStorage.getItem('ft_layout') || 'foxtube'; } catch(e) { savedLayout = 'foxtube'; }

    function applyLayout(id) {
      document.documentElement.classList.remove('ft-layout-youtube', 'ft-layout-foxtube');
      document.documentElement.classList.add('ft-layout-' + id);
      try { localStorage.setItem('ft_layout', id); } catch(e) {}
      document.querySelectorAll('.ft-layout-option').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.layout === id);
      });
    }

    applyLayout(savedLayout);

    LAYOUTS.forEach(function(l) {
      var lopt = document.createElement('button');
      lopt.className = 'ft-theme-option ft-layout-option';
      lopt.dataset.layout = l.id;
      if (l.id === savedLayout) lopt.classList.add('active');
      lopt.innerHTML = '<span style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;">' + l.icon + '</span>' + l.name;
      lopt.addEventListener('click', function() {
        applyLayout(l.id);
        panel.classList.remove('open');
      });
      panel.appendChild(lopt);
    });

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) panel.classList.remove('open');
    });

    wrap.appendChild(panel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildSwitcher);
  else buildSwitcher();
})();

// === FoxTube description expand/collapse ===
(function() {
  'use strict';
  function initDescToggle() {
    var desc = document.getElementById('description-box');
    if (!desc || desc.dataset.ftDescToggle) return;
    desc.dataset.ftDescToggle = '1';
    desc.addEventListener('click', function() {
      desc.classList.toggle('expanded');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDescToggle);
  else initDescToggle();
  setTimeout(initDescToggle, 1000);
})();

// === FoxTube: apply saved layout class as early as possible (avoid flash) ===
(function() {
  'use strict';
  function applyEarlyLayout() {
    var saved = 'foxtube';
    try { saved = localStorage.getItem('ft_layout') || 'foxtube'; } catch(e) {}
    document.documentElement.classList.remove('ft-layout-youtube', 'ft-layout-foxtube');
    document.documentElement.classList.add('ft-layout-' + saved);
  }
  applyEarlyLayout();
})();

// === FoxTube: YouTube-clone left sidebar (guide) ===
(function() {
  'use strict';

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 10v10h5v-6h6v6h5V10l-8-6z"/></svg>',
    shorts: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.8 5.6c1.3.7 1.8 2.3 1.1 3.6l-.3.5 1 .5c1.3.7 1.8 2.3 1.1 3.6-.4.7-1 1.2-1.7 1.3l-7.5 2.7c-1.3.5-2.8-.1-3.4-1.4-.6-1.2-.2-2.6.9-3.3L5 16.4c-1.3-.7-1.8-2.3-1.1-3.6.4-.7 1-1.2 1.7-1.3l7.5-2.7c-.1-.1 4.7-3.2 4.7-3.2zM10 9.7v4.6l4-2.3-4-2.3z"/></svg>',
    subs: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.7 7H5.3c-.4 0-.6.5-.3.8L12 15l7-7.2c.3-.3.1-.8-.3-.8zM4 9v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9l-8 8-8-8z"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 7 7 6.9 6.9 0 0 1-4.9-2L6.7 18.4A9 9 0 1 0 13 3zm-1 5v5l4 2 .7-1.2-3.2-1.9V8z"/></svg>',
    playlist: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 6h12v2H3V6zm0 5h12v2H3v-2zm0 5h8v2H3v-2zm14-3v6l5-3-5-3z"/></svg>',
    later: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14.5A6.5 6.5 0 1 1 12 5.5a6.5 6.5 0 0 1 0 13zM12.5 8H11v5l4.2 2.5.8-1.3-3.5-2.1V8z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.4 13c0-.3.1-.6.1-1s0-.7-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5H10.9l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L4.5 11c0 .3-.1.7-.1 1s0 .7.1 1l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h3.8l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
    trending: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3.5 18.5l6-6 4 4L22 8.9 20.6 7.5l-7.1 7.9-4-4L2 16z"/></svg>'
  };

  var ITEMS = [
    { label: 'Inicio',        href: '/feed/popular',        icon: ICONS.home,     match: ['/feed/popular','/'] },
    { label: 'Tendencias',    href: '/feed/trending',       icon: ICONS.trending, match: ['/feed/trending'] },
    { label: 'Shorts',        href: '/shorts',              icon: ICONS.shorts,   match: ['/shorts'] },
    { label: 'Suscripciones', href: '/feed/subscriptions',  icon: ICONS.subs,     match: ['/feed/subscriptions'] },
    { divider: true },
    { label: 'Historial',     href: '/feed/history',        icon: ICONS.history,  match: ['/feed/history'] },
    { label: 'Playlists',     href: '/feed/playlists',      icon: ICONS.playlist, match: ['/feed/playlists'] },
    { label: 'Ver más tarde', href: '/feed/playlists',      icon: ICONS.later,    match: [] },
    { divider: true },
    { label: 'Configuración', href: '/preferences',         icon: ICONS.settings, match: ['/preferences'] }
  ];

  function build() {
    if (document.getElementById('ft-yt-sidebar')) return;
    if (!document.body) return;

    var path = location.pathname.replace(/\/$/, '') || '/';

    var aside = document.createElement('aside');
    aside.id = 'ft-yt-sidebar';

    ITEMS.forEach(function(it) {
      if (it.divider) {
        var hr = document.createElement('div');
        hr.className = 'ft-yt-sb-divider';
        aside.appendChild(hr);
        return;
      }
      var a = document.createElement('a');
      a.className = 'ft-yt-sb-item';
      a.href = it.href;
      var active = (it.match || []).some(function(m) {
        var mm = m.replace(/\/$/, '') || '/';
        return path === mm;
      });
      if (active) a.classList.add('active');
      a.innerHTML = '<span class="ft-yt-sb-icon">' + it.icon + '</span><span class="ft-yt-sb-label">' + it.label + '</span>';
      aside.appendChild(a);
    });

    document.body.appendChild(aside);

    // Hamburger toggles a compact rail
    var nav = document.querySelector('.navbar') || document.querySelector('.pure-g.navbar');
    if (nav && !document.getElementById('ft-yt-hamburger')) {
      var burger = document.createElement('button');
      burger.id = 'ft-yt-hamburger';
      burger.setAttribute('aria-label', 'Menú');
      burger.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>';
      burger.addEventListener('click', function() {
        document.documentElement.classList.toggle('ft-yt-sidebar-collapsed');
      });
      nav.insertBefore(burger, nav.firstChild);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  setTimeout(build, 800);
})();
