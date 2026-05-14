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
    'dashboard':   '../pages/super_admin.html',
  };

  // Override profile for Admin
  try {
    var cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
    if (cache.role === 'Admin' || cache.role === 'USG') {
      ROUTES['profile'] = '../pages/admin_profile.html';
    }
  } catch(e) {}

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

    /* ── Dynamically add Dashboard link for SuperAdmin ── */
    try {
      var cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
      if (cache.role === 'SuperAdmin') {
        var existingDash = navWrap.querySelector('[data-route="dashboard"]');
        if (!existingDash) {
          var dashBtn = document.createElement('button');
          dashBtn.className = 'nav-btn';
          dashBtn.dataset.route = 'dashboard';
          dashBtn.title = 'Command Center';
          dashBtn.innerHTML = `
            <div class="nav-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:var(--text);"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
          `;
          // Insert before the profile button/spacer
          var spacer = navWrap.querySelector('.nav-spacer');
          if (spacer) navWrap.insertBefore(dashBtn, spacer);
          else navWrap.appendChild(dashBtn);
        }
      }
    } catch(e) {}

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
          teardrop.style.visibility = 'visible';
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

/**
 * window.showToast(message, type, duration)
 * Centralized toast system
 */
window.showToast = function(msg, type = 'success', dur = 3000) {
  let t = document.querySelector('.global-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'global-toast';
    t.innerHTML = `
      <div class="global-toast-icon"></div>
      <div class="global-toast-message"></div>
    `;
    document.body.appendChild(t);
  }

  const iconWrap = t.querySelector('.global-toast-icon');
  const msgWrap = t.querySelector('.global-toast-message');

  // Reset classes
  iconWrap.className = 'global-toast-icon';
  if (type === 'heart' || type === 'likes') iconWrap.classList.add('heart');
  if (type === 'comment' || type === 'comments') iconWrap.classList.add('comment');
  if (type === 'error' || type === 'warning') iconWrap.classList.add('error');

  // Set SVG based on type
  let svg = '';
  if (type === 'reposts' || type === 'repost') {
    svg = `<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
  } else if (type === 'heart' || type === 'likes') {
    svg = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  } else if (type === 'comment' || type === 'comments') {
    svg = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  } else if (type === 'error' || type === 'warning') {
    svg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    // Success / default
    svg = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
  }

  iconWrap.innerHTML = svg;
  msgWrap.textContent = msg;

  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), dur);
};

/**
 * window.showConfirm({ title, confirmText, cancelText, onConfirm })
 * Modern replacement for native confirm()
 */
window.showConfirm = function({ title, confirmText = 'Delete', cancelText = 'Cancel', onConfirm }) {
  let overlay = document.getElementById('global-confirm-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-confirm-overlay';
    overlay.className = 'confirm-toast-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="confirm-toast-pill">
      <span class="confirm-toast-text">${title}</span>
      <div class="confirm-toast-actions">
        <button class="confirm-toast-btn delete" id="global-confirm-go">${confirmText}</button>
        <button class="confirm-toast-btn cancel" id="global-confirm-cancel">${cancelText}</button>
      </div>
    </div>
  `;

  overlay.classList.add('show');

  const handleGo = () => {
    overlay.classList.remove('show');
    if (onConfirm) onConfirm();
  };
  const handleCancel = () => {
    overlay.classList.remove('show');
  };

  document.getElementById('global-confirm-go').onclick = handleGo;
  document.getElementById('global-confirm-cancel').onclick = handleCancel;
  
  // Close on backdrop click
  overlay.onclick = (e) => {
    if (e.target === overlay) handleCancel();
  };
};