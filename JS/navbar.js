/**
 * navbar.js — included in every page
 *
 * Two modes:
 *  1. Running inside shell.html iframe → hides own sidebar,
 *     delegates nav clicks to shell via window.top.shellNavigate()
 *  2. Running standalone (direct URL) → works as before with prefetch
 */
(function () {
  'use strict';

  var ROUTES = {
    'home':        '../pages/homepage.html',
    'campus news': '../pages/campus_news.html',
    'campus':      '../pages/campus_directory.html',
    'profile':     '../pages/profile.html',
  };

  var TD_H       = 66;
  var prefetched = {};
  var inShell    = (window.top !== window && typeof window.top.shellNavigate === 'function');

  /* ── If inside shell, hide this page's sidebar ── */
  if (inShell) {
    document.documentElement.classList.add('in-shell');
  }

  /* ── Prefetch on hover (standalone mode only) ── */
  function prefetch(href) {
    if (inShell || !href || prefetched[href]) return;
    prefetched[href] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch'; link.href = href; link.as = 'document';
    document.head.appendChild(link);
  }

  /* ── Navigate ── */
  function navigate(route, href) {
    if (inShell) {
      window.top.shellNavigate(route);
    } else {
      if (window.location.pathname.split('/').pop() === href.split('/').pop()) return;
      window.location.href = href;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {

    var navWrap  = document.getElementById('sidebar-nav');
    var teardrop = document.getElementById('nav-teardrop');
    if (!navWrap || !teardrop) return;

    /* Skip full init if we're in the shell — sidebar is hidden anyway */
    if (inShell) return;

    var navBtns = Array.from(navWrap.querySelectorAll('.nav-btn'));
    var profBtn = document.getElementById('sidebar-avatar-wrap');
    var allBtns = profBtn ? navBtns.concat([profBtn]) : navBtns.slice();

    var bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg === 'rgb(245, 239, 227)') teardrop.classList.add('cream-home');

    function moveTo(btn) {
      var wr = navWrap.getBoundingClientRect();
      var br = btn.getBoundingClientRect();
      teardrop.style.top = ((br.top + br.height / 2) - wr.top - TD_H / 2) + 'px';
    }

    function snapTo(btn) {
      /* Hide teardrop, kill transition, position correctly, then reveal.
         Prevents the slide-from-top glitch caused by transition firing
         before getBoundingClientRect has stable layout values. */
      teardrop.style.transition = 'none';
      teardrop.style.visibility = 'hidden';
      requestAnimationFrame(function () {
        moveTo(btn);
        requestAnimationFrame(function () {
          teardrop.style.visibility = '';
          setTimeout(function () {
            teardrop.style.transition = '';
          }, 20);
        });
      });
    }

    navBtns.forEach(function (btn) {
      var href = ROUTES[btn.dataset.route];
      btn.addEventListener('mouseenter', function () { prefetch(href); });
      btn.addEventListener('click', function () {
        allBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        moveTo(this);
        navigate(this.dataset.route, href);
      });
    });

    if (profBtn) {
      profBtn.addEventListener('mouseenter', function () { prefetch(ROUTES['profile']); });
      profBtn.addEventListener('click', function () {
        allBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        moveTo(this);
        navigate('profile', ROUTES['profile']);
      });
    }

    var activeBtn = navWrap.querySelector('.nav-btn.active') ||
                    (profBtn && profBtn.classList.contains('active') ? profBtn : null);

    if (activeBtn) {
      /* Wait for full paint AND fonts before snapping.
         Montserrat shifts element heights as it swaps in — if we call
         getBoundingClientRect before fonts settle, the teardrop lands
         in the wrong spot and then jumps. */
      function doSnap() {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () { snapTo(activeBtn); });
        } else {
          snapTo(activeBtn);
        }
      }

      if (document.readyState === 'complete') {
        doSnap();
      } else {
        window.addEventListener('load', doSnap);
      }
    }
  });
})();