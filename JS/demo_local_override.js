/**
 * ─────────────────────────────────────────────────────────────────
 *  TUP CONNECT — LOCAL DEMO OVERRIDE  (no Firebase writes needed)
 *
 *  Use this if demo_seed.js gives "permission-denied".
 *  It monkey-patches window so that when campus_news.js and
 *  homepage_pinned_sync.js call onSnapshot, they receive fake
 *  demo documents instead of hitting Firestore.
 *
 *  HOW TO USE:
 *  1.  Add this BEFORE your other scripts in the <head>:
 *        <script src="demo_local_override.js"></script>
 *      (plain script tag, NOT type="module" — must run first)
 *  2.  Open the page.  Both bulletin board and homepage pinned card
 *      will show demo data immediately, no login required.
 *  3.  Remove the tag when done testing.
 *
 *  ⚠️  This file must load BEFORE firebase-firestore and campus_news.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ── Fake Firestore Timestamp ─────────────────────────────────────
  function makeTS(date) {
    return {
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    };
  }

  // ── Public placeholder images (Picsum) ───────────────────────────
  const P = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w || 800}/${h || 500}`;

  // ── Demo post data ───────────────────────────────────────────────
  const now = Date.now();
  const hr  = 3600000;

  const DEMO_DOCS = [

    // ① PINNED — 10 images (collage shows 5 + "+5" overlay)
    {
      id: 'demo-pinned-001',
      data: {
        title:     '🏫 TUP Manila Foundation Day Celebration 2025',
        body:      'Maligayang ika-47 Anibersaryo ng Technological University of the Philippines — Manila! 🎉\n\nJoin us for a week-long celebration filled with academic symposia, cultural shows, sports fests, and the Grand Founding Anniversary Parade.\n\nAll students, faculty, and alumni are cordially invited. Check the official schedule and mark your calendars!\n\n📅 July 8–12, 2025\n📍 TUP Manila Main Campus, Ayala Blvd., Ermita',
        author:    'TUP USG MANILA',
        pinned:    true,
        imageURLs: [
          P('tup1'), P('tup2'), P('tup3'), P('tup4'), P('tup5'),
          P('tup6'), P('tup7'), P('tup8'), P('tup9'), P('tup10'),
        ],
        likes:    ['uid_a', 'uid_b', 'uid_c'],
        thumbsup: ['uid_a', 'uid_d'],
        reposts:  ['uid_b'],
        comments: [],
        createdAt: makeTS(new Date(now - 0 * hr)),
        _isDemo: true,
      }
    },

    // ② Text-only post (no images)
    {
      id: 'demo-text-only-002',
      data: {
        title:     '📢 Enrollment Schedule for 2nd Semester AY 2024–2025',
        body:      'Attention all TUPians!\n\nThe Registrar\'s Office has released the official enrollment schedule for the 2nd semester of AY 2024–2025.\n\n• 4th Year — October 7\n• 3rd Year — October 8\n• 2nd Year — October 9\n• 1st Year  — October 10–11\n\nRequired documents:\n– Enrollment form\n– Certificate of grades\n– 2 pcs 2×2 ID photos\n– OR of previous fees\n\nFor concerns: Registrar\'s Office, Bldg. A, Ground Floor.',
        author:    "TUP Registrar's Office",
        pinned:    false,
        imageURLs: [],
        likes:    ['uid_b', 'uid_e'],
        thumbsup: [],
        reposts:  ['uid_c'],
        comments: [],
        createdAt: makeTS(new Date(now - 1 * hr)),
        _isDemo: true,
      }
    },

    // ③ One image
    {
      id: 'demo-one-img-003',
      data: {
        title:     '🏆 Congratulations to Our New Student Council Officers!',
        body:      'The TUP Manila community proudly congratulates the newly sworn-in Student Council officers for AY 2024–2025! 🎊\n\nThey pledged to serve the student body with integrity, transparency, and dedication. We look forward to a productive and meaningful year ahead.\n\nTo the new officers — maraming salamat at mabuhay kayo! 🌟',
        author:    'TUP Office of Student Affairs',
        pinned:    false,
        imageURLs: [ P('council1') ],
        likes:    ['uid_a','uid_b','uid_c','uid_d','uid_e','uid_f'],
        thumbsup: ['uid_a','uid_b'],
        reposts:  ['uid_d','uid_e'],
        comments: [],
        createdAt: makeTS(new Date(now - 2 * hr)),
        _isDemo: true,
      }
    },

    // ④ 4 images (full collage, no "+N" overlay because count ≤ 5 wait — 4 imgs shows collage-4)
    {
      id: 'demo-four-img-004',
      data: {
        title:     '📸 Highlights: ITECC Regional Tech Olympiad 2025',
        body:      'Our TUP Manila delegates brought home 3 gold medals and 2 silver medals at the ITECC Regional Technology Olympiad! 🥇🥇🥇🥈🥈\n\nSpecial mentions to:\n• BS Computer Science Team — 1st Place, Software Development\n• CIT Electronics Team — 1st Place, Embedded Systems Design\n• COE Electrical Team — 1st Place, Circuit Wizardry\n\nProud of you, TUPians! 💪',
        author:    'TUP College of Science',
        pinned:    false,
        imageURLs: [ P('olympiad1'), P('olympiad2'), P('olympiad3'), P('olympiad4') ],
        likes:    ['uid_a','uid_c'],
        thumbsup: ['uid_b','uid_f'],
        reposts:  [],
        comments: [],
        createdAt: makeTS(new Date(now - 3 * hr)),
        _isDemo: true,
      }
    },

    // ⑤ Long text-only post (tests "View more" button clamping)
    {
      id: 'demo-long-text-005',
      data: {
        title:     '📋 Library Policies & Updated Operating Hours',
        body:      'Dear TUPians,\n\nThe TUP Manila Library reminds all students, faculty, and staff of our updated policies and operating hours.\n\n🕗 OPERATING HOURS\n• Monday–Friday: 7:00 AM – 7:00 PM\n• Saturday: 8:00 AM – 5:00 PM\n• Sunday & Holidays: CLOSED\n\n📌 GENERAL POLICIES\n1. Valid TUP ID required for entry at all times.\n2. Bags must be deposited at the bag counter.\n3. Food and beverages are strictly prohibited.\n4. Silence must be observed in all reading areas.\n5. Mobile phones must be set to silent mode.\n6. Study rooms must be reserved at least one (1) day in advance.\n\n📚 BORROWING PRIVILEGES\n• Undergrad students: up to 3 books for 3 days.\n• Graduate students: up to 5 books for 5 days.\n• Faculty: up to 10 books for 14 days.\n• Overdue fines: ₱2.00 per day per book.\n\n🖥️ COMPUTER TERMINALS\nFor academic use only. 1 hour per student per day. Printing: ₱3.00/page (B&W), ₱10.00/page (color).\n\nFor inquiries: library@tup.edu.ph',
        author:    'TUP Manila Library',
        pinned:    false,
        imageURLs: [],
        likes:    [],
        thumbsup: ['uid_a'],
        reposts:  [],
        comments: [],
        createdAt: makeTS(new Date(now - 4 * hr)),
        _isDemo: true,
      }
    },

  ];

  // ── Fake snapshot helpers ────────────────────────────────────────

  function makeFakeDoc(entry) {
    return {
      id:     entry.id,
      data:   () => ({ ...entry.data }),
      exists: () => true,
    };
  }

  function makeFakeSnapshot(docs, filter) {
    const filtered = filter ? docs.filter(filter) : docs;
    return {
      docs:  filtered.map(makeFakeDoc),
      empty: filtered.length === 0,
      forEach: (cb) => filtered.forEach(d => cb(makeFakeDoc(d))),
    };
  }

  // ── Patch Firebase modules via module import interception ────────
  // Strategy: intercept the module system's onSnapshot after the
  // firebase modules load by patching the function on the global
  // object that campus_news.js imports.  Because ES modules are
  // isolated we use a different approach: patch at the Firestore
  // SDK level before any app module runs.

  // The most reliable cross-browser approach without touching bundler:
  // Override getFirestore so the db object returned has a patched
  // collection/query/onSnapshot chain.

  const _origFetch = window.fetch.bind(window);

  // We'll inject the mock data by overriding the Firestore REST layer.
  // For Firebase JS SDK v10 (modular), the cleanest no-bundler hook is:
  // intercept the actual gRPC/WebSocket connection by overriding
  // the internal _delegate.  But that's fragile.

  // ── SIMPLER APPROACH: expose a global so campus_news can use it ──
  // Modify campus_news.js to call window.__DEMO_POSTS__ if present.
  // See instructions at bottom of this file.

  window.__DEMO_POSTS__ = DEMO_DOCS.map(e => ({ id: e.id, ...e.data }));
  window.__DEMO_PINNED__ = DEMO_DOCS
    .filter(e => e.data.pinned)
    .map(e => ({ id: e.id, ...e.data }))[0] || null;

  console.log(
    '%c[demo_local_override.js] Demo data injected into window.__DEMO_POSTS__ ✅',
    'color:#7c5cbf;font-weight:bold;'
  );

  // ── AUTO-BOOTSTRAP: fires after DOMContentLoaded ─────────────────
  // If campus_news.js's listenToAnnouncements() errors out (Firestore
  // unavailable / rules block), we jump in and render the demo data.

  document.addEventListener('DOMContentLoaded', () => {
  const isHomepage = !!document.getElementById('ann-card');
  const isBulletin = !!document.getElementById('bulletin-feed');

  setTimeout(() => {
    // Only run bulletin inject on the bulletin page
    if (!isBulletin) return;   // ← ADD THIS
    const feed = document.getElementById('bulletin-feed');
    const hasCards = feed && feed.querySelector('.bulletin-card, .pinned-post-card');
    if (!hasCards && window.__DEMO_POSTS__) {
      console.log('[demo_local_override.js] Feed empty — forcing demo render.');
      injectDemoIntoBulletin();
    }
  }, 2000);

  setTimeout(() => {
    // Only run homepage inject on the homepage
    if (!isHomepage) return;
    const slot = document.getElementById('ann-card');
    const isEmpty = !slot || !slot.querySelector('.pinned-post-card');
    if (isEmpty && window.__DEMO_PINNED__) {
      console.log('[demo_local_override.js] #ann-card empty — forcing demo pinned post.');
      injectDemoIntoHomepage();
    }
  }, 2000);
});

  function injectDemoIntoBulletin() {
    // campus_news.js exposes renderBulletinPage on window after load
    if (typeof window.renderBulletinPage === 'function') {
      window.renderBulletinPage(window.__DEMO_POSTS__);
    } else {
      console.warn('[demo_local_override.js] renderBulletinPage not on window — see OPTION B instructions.');
    }
  }

  function injectDemoIntoHomepage() {
    const post = window.__DEMO_PINNED__;
    if (!post) return;

    // ── Exact same helpers as campus_news.js ──────────────────────
    const timeAgo = (ts) => {
      if (!ts) return '';
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      const diff = (Date.now() - date.getTime()) / 1000;
      if (diff < 60)        return 'just now';
      if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    };
    const fmt = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n || 0);

    // ── Build collage HTML — exact copy of renderPinnedCard() ─────
    const imgs      = post.imageURLs || [];
    const hasImages = imgs.length > 0;
    const likeCount    = (post.likes    || []).length;
    const commentCount = (post.comments || []).length;
    const repostCount  = (post.reposts  || []).length;
    const bodyHTML     = (post.body || '').replace(/\n/g, '<br>');

    let photoGrid = '';
    if (hasImages) {
      const count = imgs.length;
      const clampedCount = Math.min(count, 5);
      const extra = count > 5 ? count - 5 : 0;

      let gridStyle = "display: grid !important; height: 250px !important; gap: 4px !important; width: 100% !important;";
      if (clampedCount === 1) gridStyle += " grid-template-columns: 1fr !important; grid-template-rows: 1fr !important;";
      else if (clampedCount === 2) gridStyle += " grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr !important;";
      else if (clampedCount === 3 || clampedCount === 4) gridStyle += " grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;";
      else gridStyle += " grid-template-columns: 2fr 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;";

      const cells = imgs.slice(0, 5).map((src, i) => {
        let cellStyle = "position: relative !important; overflow: hidden !important; min-width: 0 !important; min-height: 0 !important; width: 100% !important; height: 100% !important;";
        
        if (clampedCount >= 5 && i === 0) {
            cellStyle += " grid-column: 1 / 2 !important; grid-row: 1 / 3 !important;";
        } else if (clampedCount === 3 && i === 0) {
            cellStyle += " grid-row: 1 / 3 !important;";
        }

        const isLastVisible = i === 4 && extra > 0;
        const overlayHtml = isLastVisible 
          ? `<div class="photo-more-overlay" style="position: absolute !important; inset: 0 !important; background: rgba(0,0,0,0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: #fff !important; font-size: 17px !important; font-weight: 600 !important; z-index: 2 !important; pointer-events: none !important;">+${extra}</div>` 
          : '';

        return `
          <div class="collage-cell demo-lb-trigger" data-src="${src}" style="${cellStyle}">
            <img src="${src}" alt="post image" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;" />
            ${overlayHtml}
          </div>`;
      }).join('');

      photoGrid = `
        <div class="pinned-media-col">
          <div class="pinned-photo-grid collage-${clampedCount}" style="${gridStyle}">
            ${cells}
          </div>
        </div>`;
    }

    // ── Full card HTML — mirrors renderPinnedCard() exactly ───────
    const cardHTML = `
      <div class="pinned-post-card" data-id="${post.id}">
        <div class="pushpin"><div class="pin-head"></div><div class="pin-shaft"></div></div>

        <div class="social-bar-wrap">
          <div class="social-bar-outer">
            <div class="social-bar">
              <div class="social-item" data-type="likes" data-id="${post.id}">
                <span class="r-count">${fmt(likeCount)}</span>
                <svg viewBox="0 0 24 24" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="social-divider"></div>
              <div class="social-item" data-id="${post.id}">
                <span class="r-count">${fmt(commentCount)}</span>
                <svg viewBox="0 0 24 24" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="social-divider"></div>
              <div class="social-item" data-type="reposts" data-id="${post.id}">
                <span class="r-count">${fmt(repostCount)}</span>
                <svg viewBox="0 0 24 24" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div class="pinned-content ${hasImages ? '' : 'no-images'}">
          <div class="pinned-timestamp-top">${timeAgo(post.createdAt)}</div>
          <div class="pinned-columns-wrap">
            <div class="pinned-caption-col">
              <div class="pinned-title">${post.title || ''}</div>
              <div class="pinned-body clamped" id="demo-pb-body">${bodyHTML}</div>
              <button class="view-more-btn" id="demo-pb-vm">View more ▾</button>
            </div>
            ${photoGrid}
          </div>
        </div>
      </div>`;

    // ── Inject into #ann-card (homepage_pinned_sync.css target) ───
    const slot = document.getElementById('ann-card');
    if (!slot) {
      console.warn('[demo_local_override.js] #ann-card not found in DOM.');
      return;
    }
    slot.innerHTML = cardHTML;

    // ── Wire view-more ─────────────────────────────────────────────
    const body = document.getElementById('demo-pb-body');
    const btn  = document.getElementById('demo-pb-vm');
    if (body && btn) {
      requestAnimationFrame(() => {
        if (body.scrollHeight > body.clientHeight + 4) btn.classList.add('visible');
      });
      let expanded = false;
      btn.addEventListener('click', () => {
        expanded = !expanded;
        body.classList.toggle('clamped', !expanded);
        btn.textContent = expanded ? 'Show less ▴' : 'View more ▾';
      });
    }

    // ── Wire collage lightbox ──────────────────────────────────────
    slot.querySelectorAll('.demo-lb-trigger').forEach(cell => {
      cell.addEventListener('click', () => {
        if (window.openGallery) window.openGallery(imgs, cell.dataset.src);
      });
    });

    console.log('%c[demo_local_override.js] Homepage pinned card populated ✅', 'color:#4caf50;');
  }

})();

/*
 ═══════════════════════════════════════════════════════════════════
  OPTION B — expose renderBulletinPage on window (1-line code change)
  If the auto-inject above doesn't work, add this line at the end of
  campus_news.js's DOMContentLoaded callback:
    window.renderBulletinPage = renderBulletinPage;
  Then demo_local_override.js will call it directly.
 ═══════════════════════════════════════════════════════════════════
*/