document.addEventListener('DOMContentLoaded', () => {

    (function () {
    const navWrap  = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    const navBtns  = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn  = document.getElementById('sidebar-avatar-wrap');
    const allBtns  = [...navBtns, profBtn];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY  = itemRect.top + itemRect.height / 2 - wrapRect.top;
      teardrop.style.top = (centerY - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        console.log('Navigate to:', this.dataset.route);
      });
    });

    profBtn.addEventListener('click', function () {
      allBtns.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      moveTo(this);
      console.log('Navigate to: profile');
    });

    /* Snap to active button on load (no transition) */
    const active = navWrap.querySelector('.nav-btn.active');
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moveTo(active);
        teardrop.style.transition = '';
      }));
    }
  })();

// ========================
  // SEARCH BAR
  // ========================
  const searchInput = document.querySelector('.banner-search-input');
  const searchOuter = document.querySelector('.banner-search-bar');

  const suggestions = [
    'COS Building', 'CAFA Building', 'CIT Building',
    'CIE Building', 'COE Building', 'CLA Building',
    'Office of Admissions', 'Cashier Office',
    'Office of Student Affair', 'University Clinic',
    'ROTC', 'Library', 'Registrar Office',
    'Student Affairs Office', 'Finance Office',
  ];

  let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

  // Create dropdown and append to BODY (fixes z-index stacking issue)
  const dropdown = document.createElement('div');
  dropdown.classList.add('search-dropdown');
  document.body.appendChild(dropdown);

  // Position dropdown below the search bar
  function positionDropdown() {
    const rect = searchOuter.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
  }

  function saveRecent(term) {
    if (!term) return;
    recentSearches = [term, ...recentSearches.filter(r => r !== term)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }

  function renderDropdown(items, isRecent = false) {
    dropdown.innerHTML = '';

    if (items.length === 0 && !isRecent) {
      dropdown.style.display = 'none';
      return;
    }

    if (isRecent && recentSearches.length > 0) {
      const label = document.createElement('div');
      label.classList.add('search-dropdown-label');
      label.textContent = 'Recent';
      dropdown.appendChild(label);
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('search-dropdown-item');
      div.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-dropdown-icon">
          ${isRecent
            ? '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>'
            : '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'
          }
        </svg>
        <span>${item}</span>
      `;
      div.addEventListener('click', () => {
        searchInput.value = item;
        saveRecent(item);
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  }

  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      positionDropdown();
      if (searchInput.value === '') {
        renderDropdown(recentSearches, true);
      }
    });

    searchInput.addEventListener('input', () => {
      positionDropdown();
      const query = searchInput.value.toLowerCase().trim();
      if (query === '') {
        renderDropdown(recentSearches, true);
        return;
      }
      const filtered = suggestions.filter(s => s.toLowerCase().startsWith(query));
      renderDropdown(filtered, false);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveRecent(searchInput.value.trim());
        dropdown.style.display = 'none';
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (searchOuter && !searchOuter.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // ========================
  // DIRECTORY PANEL - per card scroll
  // ========================
  const directoryLists = document.querySelectorAll('.directory-list');

  directoryLists.forEach(list => {
    list.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      list.scrollBy({ top: e.deltaY, behavior: 'smooth' });
    }, { passive: false });
  });
});