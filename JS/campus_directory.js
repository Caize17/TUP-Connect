// ========================
// DIRECTORY DATA
// ========================
const directoryData = {
  'COS Building': {
    img: '../assets/images/COS.jpeg',
    desc: 'The College of Science prepares students to become fully integrated individuals, scientifically literate and technically competent to assume dynamic and responsible leadership for the country\'s scientific and technological development in the improvement of man\'s well-being and the quality of environment.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Applied Science in Laboratory Technology',
        'Bachelor of Science in Computer Science',
        'Bachelor of Science in Environmental Science',
        'Bachelor of Science in Information System',
        'Bachelor of Science in Information Technology',
      ],
      'For Graduate Programs:': [
        'Master of Arts in Teaching major in Physics',
        'Master of Arts in Teaching major in Mathematics',
        'Master of Arts in Teaching major in General Science',
        'Master of Arts in Teaching major in Chemistry',
        'Master of Information Technology',
      ],
    },
  },
  'CAFA Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The College of Architecture and Fine Arts offers programs that develop creative and technically skilled professionals in architecture, industrial design, and the fine arts.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Architecture',
        'Bachelor of Fine Arts major in Industrial Design',
        'Bachelor of Fine Arts major in Painting',
      ],
    },
  },
  'CIT Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The College of Industrial Technology trains highly skilled technologists and technicians who are competent in their fields, ready to contribute to national development.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Industrial Technology',
        'Bachelor of Technology in Automotive Technology',
        'Bachelor of Technology in Electronics Technology',
        'Bachelor of Technology in Electrical Technology',
      ],
    },
  },
  'CIE Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The College of Industrial Education focuses on developing effective technology teachers and trainers for secondary and post-secondary education institutions.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Secondary Education major in Technology and Livelihood Education',
        'Bachelor of Technology and Livelihood Education',
      ],
    },
  },
  'COE Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The College of Engineering develops engineers who apply scientific and mathematical principles to design and build systems, machines, and structures for industry.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Science in Civil Engineering',
        'Bachelor of Science in Electrical Engineering',
        'Bachelor of Science in Electronics Engineering',
        'Bachelor of Science in Mechanical Engineering',
      ],
    },
  },
  'CLA Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The College of Liberal Arts provides foundational education in humanities, social sciences, and communication, developing well-rounded and critical-thinking graduates.',
    courses: {
      'For Undergraduate Programs:': [
        'Bachelor of Arts in English Language Studies',
        'Bachelor of Arts in Political Science',
        'Bachelor of Arts in Psychology',
      ],
    },
  },
  'IRTC Building': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The Instructional Resources and Technology Center supports teaching and learning through technology-enhanced resources, facilities, and instructional media services.',
    courses: {},
  },
  'Cashier Office': {
    img: '../assets/images/cashier.jpeg',
    desc: 'The Cashier\'s Office handles all financial transactions of the university, including payment of tuition fees, miscellaneous fees, and other university-related payments.',
    courses: {},
  },
  'Office of Admissions': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The Office of Admissions manages the admission processes for incoming students and coordinates enrollment procedures across all colleges of the university.',
    courses: {},
  },
  'Office of Student Affair': {
    img: '../assets/images/OSA.jpeg',
    desc: 'The Office of Student Affairs oversees student welfare, discipline, co-curricular activities, and student organizations to foster a healthy and engaging campus life.',
    courses: {},
  },
  'University Clinic': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The University Clinic provides basic medical and health services to students, faculty, and staff, promoting a healthy university community.',
    courses: {},
  },
  'ROTC': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The Reserve Officers\' Training Corps (ROTC) program provides military training and civic education to students as part of the National Service Training Program.',
    courses: {},
  },
  'Library': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The University Library provides access to a vast collection of academic materials, journals, and digital resources to support the research and learning needs of the TUP community.',
    courses: {},
  },
  'Registrar Office': {
    img: '../assets/images/Registrar.jpeg',
    desc: 'The Registrar\'s Office is responsible for maintaining all official academic records of students, processing requests for certifications, and managing enrollment and graduation procedures.',
    courses: {},
  },
  'Student Affairs Office': {
    img: '../assets/images/OSA.jpeg',
    desc: 'The Student Affairs Office works closely with student organizations and coordinates programs that enhance student development, leadership, and campus engagement.',
    courses: {},
  },
  'Finance Office': {
    img: '../assets/images/TUP_bg.png',
    desc: 'The Finance Office manages the financial operations and budget allocations of the university, ensuring fiscal responsibility and compliance with government regulations.',
    courses: {},
  },
};

// ========================
// SHOW DETAIL CARD
// ========================
function showDetail(name) {
  const data = directoryData[name];
  if (!data) return;

  const bannerImg  = document.getElementById('banner-img');
  const searchWrap = document.getElementById('banner-search-wrap');
  const carousel   = document.getElementById('carousel-track');
  const card       = document.getElementById('detail-card');

  // 1. Swap banner image first
  if (bannerImg) {
    bannerImg.classList.add('fading');
    setTimeout(() => {
      bannerImg.src = data.img;
      bannerImg.classList.remove('fading');
    }, 200); // match with CSS fade duration
  }

  // Hide search bar
  if (searchWrap) searchWrap.style.display = 'none';

  // 2. Wait for banner to finish, THEN show detail card
  setTimeout(() => {
    if (carousel) carousel.style.display = 'none';

    // Populate card
    document.getElementById('detail-card-title').textContent = name;
    document.getElementById('detail-card-desc').textContent  = data.desc;

    const coursesEl = document.getElementById('detail-card-courses');
    coursesEl.innerHTML = '';

    if (data.courses && Object.keys(data.courses).length > 0) {
      const sectionTitle = document.createElement('div');
      sectionTitle.className   = 'detail-card-section-title';
      sectionTitle.textContent = 'Offered Courses';
      coursesEl.appendChild(sectionTitle);

      for (const [heading, list] of Object.entries(data.courses)) {
        const sub = document.createElement('div');
        sub.className   = 'detail-card-subheading';
        sub.textContent = heading;
        coursesEl.appendChild(sub);

        const ul = document.createElement('ul');
        ul.className = 'detail-card-list';
        list.forEach(course => {
          const li = document.createElement('li');
          li.textContent = course;
          ul.appendChild(li);
        });
        coursesEl.appendChild(ul);
      }
    }

    // Show card after banner has settled
    if (card) {
      card.style.display = 'block';
      card.classList.add('active');
    }
  }, ); // waits for banner fade to complete before showing detail
}

// ========================
// HIDE DETAIL CARD (reset)
// ========================
function hideDetail() {
  const carousel = document.getElementById('carousel-track');
  const card     = document.getElementById('detail-card');
  const bannerImg = document.getElementById('banner-img');
  const searchWrap = document.getElementById('banner-search-wrap'); // ← add

  if (card) {
    card.classList.remove('active');
    card.style.display = 'none'; // ADD THIS
  }
  if (carousel) carousel.style.display = '';
  if (searchWrap)  searchWrap.style.display = ''; // ← add

  // Restore default banner image
  if (bannerImg) {
    bannerImg.classList.add('fading');
    setTimeout(() => {
      bannerImg.src = '../assets/images/TUP_bg.png';
      bannerImg.classList.remove('fading');
    },200);
  }
  
}

// ========================
// DOM READY
// ========================
document.addEventListener('DOMContentLoaded', () => {

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

  const dropdown = document.createElement('div');
  dropdown.classList.add('search-dropdown');
  document.body.appendChild(dropdown);

  function positionDropdown() {
    const rect = searchOuter.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top      = (rect.bottom + 8) + 'px';
    dropdown.style.left     = rect.left + 'px';
    dropdown.style.width    = rect.width + 'px';
  }

  function saveRecent(term) {
    if (!term) return;
    recentSearches = [term, ...recentSearches.filter(r => r !== term)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }

  function renderDropdown(items, isRecent = false) {
    dropdown.innerHTML = '';
    if (items.length === 0) { dropdown.style.display = 'none'; return; }

    if (isRecent) {
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
            : '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'}
        </svg>
        <span>${item}</span>
      `;
      div.addEventListener('click', () => {
        searchInput.value = item;
        saveRecent(item);
        dropdown.style.display = 'none';
        showDetail(item); // ← triggers banner swap + card
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  }

  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      positionDropdown();
      renderDropdown(recentSearches, true);

      const backBtn = document.querySelector('.banner-search-back-btn');
      if (backBtn) backBtn.style.display = 'block'; 
    });

    searchInput.addEventListener('input', () => {
      positionDropdown();
      const query = searchInput.value.toLowerCase().trim();
      if (query === '') {
        renderDropdown(recentSearches, true);
        const backBtn = document.querySelector('.banner-search-back-btn');
        if (backBtn) backBtn.style.display = 'block';
        return;
      }
      const filtered = suggestions.filter(s => s.toLowerCase().startsWith(query));
      renderDropdown(filtered, false);

      const backBtn = document.querySelector('.banner-search-back-btn');
      if (backBtn) backBtn.style.display = query !== '' ? 'block' : 'none';
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        saveRecent(val);
        dropdown.style.display = 'none';
        showDetail(val);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (searchOuter && !searchOuter.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  window.addEventListener('scroll', positionDropdown);
  window.addEventListener('resize', positionDropdown);

  // ========================
  // BACK BUTTON IN SEARCH BAR
  // ========================
  const backBtn = document.querySelector('.banner-search-back-btn');
  if (backBtn) {
    backBtn.style.display = 'none';

    backBtn.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      this.style.display = 'none';
      searchInput.blur();
      dropdown.style.display = 'none';
    });
  }

  // ========================
  // DETAIL CLOSE BUTTON
  // ========================
  const detailCloseBtn = document.getElementById('detail-close-btn');
  if (detailCloseBtn) {
    detailCloseBtn.addEventListener('click', () => {
      hideDetail();
    });
  }

  // ========================
  // DIRECTORY PANEL — click to show detail
  // ========================
  document.querySelectorAll('.directory-item').forEach(item => {
    item.addEventListener('click', () => {
      showDetail(item.textContent.trim());
    });
  });

  // ========================
  // CAROUSEL IMAGES — click to show detail
  // ========================
  document.querySelectorAll('.carousel-img').forEach(img => {
    img.style.pointerEvents = 'all'; // override the CSS none
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      const name = img.getAttribute('data-name');
      if (name) showDetail(name);
    });
  });

  // ========================
  // DIRECTORY PANEL — per-card scroll
  // ========================
  document.querySelectorAll('.directory-list').forEach(list => {
    list.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      list.scrollBy({ top: e.deltaY, behavior: 'smooth' });
    }, { passive: false });
  });

  // ========================
  // CAROUSEL ARROWS
  // ========================
  const carouselImages = document.querySelector('.carousel-images');
  const leftArrow      = document.querySelector('.carousel-arrow.left');
  const rightArrow     = document.querySelector('.carousel-arrow.right');
  const scrollAmount   = 300;

  if (leftArrow && rightArrow && carouselImages) {
    leftArrow.addEventListener('click',  () => carouselImages.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    rightArrow.addEventListener('click', () => carouselImages.scrollBy({ left:  scrollAmount, behavior: 'smooth' }));
  }

});