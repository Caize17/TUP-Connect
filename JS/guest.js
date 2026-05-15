/**
 * guest.js — shared guest mode logic
 *
 * How it works:
 *  - index.html "Browse as Guest" sets sessionStorage.guestMode = 'true'
 *  - Every page includes this script
 *  - Homepage & Campus News: real posts are visible but ALL interactions are disabled
 *  - Profile / Campus Directory: blurs entire main content, shows lock overlay
 */

(function () {
  'use strict';

  var IS_GUEST = sessionStorage.getItem('guestMode') === 'true';

  if (!IS_GUEST) return; // signed-in users — do nothing

  /* ── Sign in anonymously so Firestore reads are authenticated ── */
  /* Wait for DOMContentLoaded so Firebase module scripts have run first */
  function tryAnonymousSignIn() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      // Legacy Firebase SDK
      firebase.auth().signInAnonymously().catch(function(){});
    } else {
      // Modular Firebase SDK v10 — dynamic import
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js').then(function(appMod) {
        var apps = appMod.getApps();
        if (apps.length === 0) return; // App not yet initialized
        return import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then(function(authMod) {
          var auth = authMod.getAuth(apps[0]);
          if (!auth.currentUser) {
            authMod.signInAnonymously(auth).catch(function(){});
          }
        });
      }).catch(function(){});
    }
  }

  // Run after module scripts initialize Firebase
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tryAnonymousSignIn, 50);
    });
  } else {
    setTimeout(tryAnonymousSignIn, 50);
  }


  /* ── Detect which page we're on ── */
  var path     = window.location.pathname.toLowerCase();
  var isHome   = path.indexOf('homepage') !== -1;
  var isProfile = path.indexOf('profile') !== -1;
  var isCampusNews = path.indexOf('campus_news') !== -1 || path.indexOf('campus-news') !== -1;
  var isCampusDir  = path.indexOf('campus_directory') !== -1;

  /* ── Selectors for every interactive element to disable ── */
  var INTERACTION_SELECTORS = [
    '.feed-reaction-btn',
    '.feed-action-btn',
    '.post-menu-btn',
    '.reaction-item',
    '.social-item',
    '.cn-comment-trigger',
    '.comment-trigger-pinned',
    '.cn-repost-trigger',
    '#btn-likes', '#btn-comments', '#btn-reposts'
  ].join(', ');

  /* ════════════════════════════════════════
     DUMMY POSTS for homepage feed
  ════════════════════════════════════════ */
  var DUMMY_POSTS = [
    {
      name: 'Anonymous Puto',
      time: '2:30 AM',
      avatar: null,
      text: 'Sino may extra notes sa ENSC3? Finals na bukas wala pa akong reviewer 😭',
      likes: 42, comments: 18, reposts: 3
    },
    {
      name: 'Dancel Lausa',
      time: '11:45 PM',
      avatar: null,
      text: 'Grateful for the person I’m becoming—someone who shows up with determination, leads with heart, and keeps growing even when things get challenging. Still learning, still improving, but always choosing authenticity and kindness along the way. 🤍',
      likes: 87, comments: 31, reposts: 12
    },
    {
      name: 'TUP USG Manila',
      time: 'Yesterday',
      avatar: null,
      text: '📢 REMINDER: Enrollment for 2nd semester opens this Monday. Make sure your clearance is signed and your fees are settled. Check the registrar\'s bulletin board for the full schedule.',
      likes: 214, comments: 55, reposts: 88,
      isOrg: true
    },
    {
      name: 'Juan dela Cruz',
      time: '3 days ago',
      avatar: null,
      text: 'Anyone else noticed the new benches near the library? Finally may makauupuan na kami habang nag-aantay ng klase hahaha. TUP W',
      likes: 103, comments: 44, reposts: 7
    },
    {
      name: 'Maria Santos',
      time: '4 days ago',
      avatar: null,
      text: 'PSA to all freshies: Yung canteen sa CIT side is actually cheaper and less crowded than the main one. You\'re welcome 😉',
      likes: 298, comments: 76, reposts: 41
    }
  ];

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  function avatarSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }

  function fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n;
  }

  function buildDummyPost(fp, idx) {
    return '<div class="feed-card guest-dummy-post" data-idx="' + idx + '">' +
      '<div class="feed-header">' +
        '<div class="feed-avatar-ph">' + avatarSVG() + '</div>' +
        '<div class="feed-meta">' +
          '<div class="feed-name">' + fp.name + (fp.isOrg ? ' <span class="org-badge">Org</span>' : '') + '</div>' +
          '<div class="feed-time">' + fp.time + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="feed-text">' + fp.text + '</div>' +
      '<div class="feed-actions">' +
        '<button class="feed-action-btn guest-locked-btn" title="Sign in to react">' +
          '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          ' ' + fmt(fp.likes) + ' Heart' +
        '</button>' +
        '<button class="feed-action-btn guest-locked-btn" title="Sign in to comment">' +
          '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
          ' ' + fp.comments + ' Comments' +
        '</button>' +
        '<button class="feed-action-btn guest-locked-btn" title="Sign in to repost">' +
          '<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
          ' ' + fp.reposts + ' Repost' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════
     SIGN-IN WALL
  ════════════════════════════════════════ */
  function buildSignInWall() {
    var wall = document.createElement('div');
    wall.className = 'guest-signin-wall';
    wall.innerHTML =
      '<div class="guest-wall-inner">' +
        '<div class="guest-wall-lock">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
        '</div>' +
        '<h3 class="guest-wall-title">You\'re viewing as a guest</h3>' +
        '<p class="guest-wall-sub">Sign in with your TUP email to see all posts, react, and join the conversation.</p>' +
        '<a href="../index.html" class="guest-wall-btn">Sign In</a>' +
        '<button class="guest-wall-dismiss" onclick="continueGuestBrowsing(this)">Keep browsing as guest</button>' +
      '</div>';
    return wall;
  }

  window.continueGuestBrowsing = function(btn) {

  // remove popup only after clicking continue
  const wall = btn.closest('.guest-signin-wall');
  if (wall) wall.remove();

  // remove blur from hidden posts
  document.querySelectorAll('.guest-blurred').forEach(function(post) {
    post.classList.remove('guest-blurred');
  });

};

  /* ════════════════════════════════════════
     LOCKED PAGE OVERLAY
  ════════════════════════════════════════ */
  function buildLockedOverlay(pageName) {
    var overlay = document.createElement('div');
    overlay.className = 'guest-locked-overlay';
    overlay.innerHTML =
      '<div class="guest-locked-inner">' +
        '<div class="guest-locked-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
        '</div>' +
        '<h2 class="guest-locked-title">' + pageName + ' is for TUP students</h2>' +
        '<p class="guest-locked-sub">Sign in with your TUP email to access this page.</p>' +
        '<a href="../index.html" class="guest-wall-btn">Sign In to Continue</a>' +
        '<a href="../pages/homepage.html" class="guest-locked-back">← Back to Feed</a>' +
      '</div>';
    return overlay;
  }

  /* ════════════════════════════════════════
     HOMEPAGE LOGIC — real posts, read-only
  ════════════════════════════════════════ */
  function initHomepageGuest() {
    document.addEventListener('DOMContentLoaded', function () {

      /* Hide the create-post bar — guests can't post */
      var createBar = document.getElementById('open-create-post');
      if (createBar) createBar.style.display = 'none';

      /* Replace profile card with guest version matching original maroon style */
      var profileCard = document.querySelector('.profile-card');
      if (profileCard) {
        profileCard.innerHTML =
          '<div class="profile-card-top">' +
            '<div class="profile-name" style="color:#FFF4E7;font-size:16px;font-weight:800;">Guest User</div>' +
            '<div class="profile-email" style="color:rgba(255,244,231,0.6);font-size:12px;margin-top:4px;">Not signed in</div>' +
          '</div>' +
          '<hr class="profile-divider"/>' +
          '<div class="profile-photo-wrap" style="display:flex;justify-content:center;padding:16px 0;">' +
            '<div class="profile-photo-ph" style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;">' +
              '<svg viewBox="0 0 24 24" style="width:36px;height:36px;stroke:rgba(255,244,231,0.7);fill:none;stroke-width:1.8;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:center;padding:0 16px 16px;">' +
            '<a href="../index.html" style="display:inline-block;background:#FFF4E7;color:#4a1010;font-family:Montserrat,sans-serif;font-size:13px;font-weight:800;padding:10px 28px;border-radius:50px;text-decoration:none;">Sign In</a>' +
          '</div>';
      }

      /* Disable all interaction buttons once posts have rendered */
      lockInteractions();

      /* Also re-lock after any dynamic post render (post.js may call renderFeedPosts later) */
      var origRender = window.renderFeedPosts;
      window.renderFeedPosts = function () {
        if (origRender) origRender.apply(this, arguments);
        setTimeout(lockInteractions, 100);
      };

      /* MutationObserver to catch async Firebase renders */
      var feedEl = document.getElementById('feed-posts');
      if (feedEl) {
        var feedObserver = new MutationObserver(function() {
          lockInteractions();
        });
        feedObserver.observe(feedEl, { childList: true, subtree: true });
      }
    });
  }

  function initHomepageGuestUI() {
    document.addEventListener('DOMContentLoaded', function () {
      /* Show guest banner at top */
      showGuestBanner();
    });
  }

  /* ════════════════════════════════════════
     CAMPUS NEWS LOGIC — real posts, read-only
  ════════════════════════════════════════ */
  function initCampusNewsGuest() {
    document.addEventListener('DOMContentLoaded', function () {
      showGuestBanner();

      /* Observe ALL campus news content areas for dynamic renders:
         - #pinned-post-slot  (pinned announcement)
         - #bulletin-feed     (regular announcements)
         - #org-feed-list     (org posts)
         Use body as root so nothing is missed regardless of timing. */
      var cnObserver = new MutationObserver(function () {
        lockInteractions();
      });
      cnObserver.observe(document.body, { childList: true, subtree: true });

      /* Initial lock pass */
      lockInteractions();

      /* Wrap render functions — retry until campus_news.js exposes them */
      var patchAttempts = 0;
      function patchCNRenders() {
        var patched = 0;

        if (window.renderBulletinPage && !window.renderBulletinPage._guestPatched) {
          var origBulletin = window.renderBulletinPage;
          window.renderBulletinPage = function () {
            origBulletin.apply(this, arguments);
            setTimeout(lockInteractions, 80);
          };
          window.renderBulletinPage._guestPatched = true;
          patched++;
        }

        if (window.renderOrgFeed && !window.renderOrgFeed._guestPatched) {
          var origOrg = window.renderOrgFeed;
          window.renderOrgFeed = function () {
            origOrg.apply(this, arguments);
            setTimeout(lockInteractions, 80);
          };
          window.renderOrgFeed._guestPatched = true;
          patched++;
        }

        patchAttempts++;
        /* Keep retrying until both are patched or we give up after ~3s */
        if (patched < 2 && patchAttempts < 30) {
          setTimeout(patchCNRenders, 100);
        }
      }
      patchCNRenders();
    });
  }


  /* ════════════════════════════════════════
     LOCKED PAGE LOGIC (Profile, Directory)
  ════════════════════════════════════════ */
  function initLockedPage(pageName) {
    document.addEventListener('DOMContentLoaded', function () {
      var main = document.querySelector('.main') || document.querySelector('main');
      if (!main) return;

      /* Blur the main content */
      main.classList.add('guest-main-blurred');

      /* Overlay on top */
      var overlay = buildLockedOverlay(pageName);
      document.body.appendChild(overlay);

      showGuestBanner();
    });
  }

  /* ════════════════════════════════════════
     LOCK INTERACTIONS (shared helper)
  ════════════════════════════════════════ */
  function lockInteractions() {
    document.querySelectorAll(INTERACTION_SELECTORS).forEach(function (el) {
      if (el.dataset.guestLocked) return; // already locked
      el.dataset.guestLocked = '1';
      el.classList.add('guest-readonly-btn');
      /* Replace with clone to nuke existing listeners */
      var clone = el.cloneNode(true);
      clone.dataset.guestLocked = '1';
      clone.classList.add('guest-readonly-btn');
      clone.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showGuestToast();
      });
      el.replaceWith(clone);
    });
  }

  /* ════════════════════════════════════════
     GUEST BANNER (shown on all pages)
  ════════════════════════════════════════ */
  function showGuestBanner() {
    var banner = document.createElement('div');
    banner.className = 'guest-top-banner';
    banner.innerHTML =
      'You\'re browsing as a guest. <a href="../index.html">Sign in</a> for the full experience.' +
      '<button class="guest-banner-close" onclick="this.parentElement.remove()">✕</button>';
    document.body.appendChild(banner);
  }

  /* ════════════════════════════════════════
     GUEST TOAST
  ════════════════════════════════════════ */
  function showGuestToast() {
    var existing = document.getElementById('guest-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'guest-toast';
    toast.className = 'guest-toast';
    toast.innerHTML = '🔒 Sign in to interact with posts. <a href="../index.html">Sign In</a>';
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  /* ════════════════════════════════════════
     ROUTE TO CORRECT INIT
  ════════════════════════════════════════ */
  if (isHome) {
    initHomepageGuest();
    initHomepageGuestUI();
  } else if (isProfile) {
    initLockedPage('Your Profile');
  } else if (isCampusNews) {
    initCampusNewsGuest();
    initHomepageGuestUI();
  } else if (isCampusDir) {
    /* Campus Directory is mostly static — just show the guest banner */
    document.addEventListener('DOMContentLoaded', function () {
      showGuestBanner();
    });
  }

})();
