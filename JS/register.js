let selectedRole = null;

const ROLE_META = {
  student: { label: 'Student',              redirect: 'setup_student.html' },
  org:     { label: 'Student Organization', redirect: 'setup_org.html'     },
  admin:   { label: 'Admin / USG',          redirect: 'setup_usg.html'     },
};

function selectRole(role) {
  // Deselect all
  ['student', 'org', 'admin'].forEach(r => {
    document.getElementById(`role-${r}`).classList.remove('selected');
  });

  selectedRole = role;
  document.getElementById(`role-${role}`).classList.add('selected');

  // Update card header
  const meta     = ROLE_META[role];
  const pill     = document.getElementById('selected-role-pill');
  const subtitle = document.getElementById('reg-subtitle');

  subtitle.textContent = `Registering as: `;
  pill.style.display   = 'inline-flex';
  document.getElementById('pill-label').textContent = meta.label;

  // Reveal fields with a slight stagger
  const fieldsToShow = ['field-name', 'field-email', 'field-password'];
  fieldsToShow.forEach((id, i) => {
    const el = document.getElementById(id);
    el.style.display = 'flex';
    el.style.animationDelay = `${i * 0.06}s`;
  });

  document.getElementById('role-nudge').style.display       = 'none';
  document.getElementById('btn-register').style.display     = 'block';
  document.getElementById('or-divider').style.display       = 'flex';
  document.getElementById('btn-guest-bottom').style.display = 'block';
  document.getElementById('hint-text').style.display        = 'block';

  // Change label for org name field if org role
  document.getElementById('label-name').textContent =
    role === 'org' ? 'Organization Name' : 
    role === 'admin' ? 'Name' : 'Full Name';

  document.getElementById('input-name').placeholder =
  role === 'org'   ? 'e.g. TUP Computer Engineering Society' :
  role === 'admin' ? 'e.g. University Student Government'    :
                     'Juan dela Cruz';
}

function togglePassword(btn) {
  const input    = document.getElementById('input-password');
  const isHidden = input.type === 'password';
  input.type     = isHidden ? 'text' : 'password';
  btn.innerHTML  = isHidden
    ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function handleRegister() {
  if (!selectedRole) return;

  const name     = document.getElementById('input-name');
  const email    = document.getElementById('input-email');
  const password = document.getElementById('input-password');

  let valid = true;

  ['name', 'email', 'password'].forEach(f => {
    document.getElementById(`input-${f}`).classList.remove('error');
    const err = document.getElementById(`err-${f}`);
    err.classList.remove('visible');
    err.style.display = 'none';
  });

  if (name.value.trim() === '') {
    name.classList.add('error');
    const e = document.getElementById('err-name');
    e.style.display = 'block';
    e.classList.add('visible');
    valid = false;
  }

  if (!email.value.trim().endsWith('@tup.edu.ph')) {
    email.classList.add('error');
    const e = document.getElementById('err-email');
    e.style.display = 'block';
    e.classList.add('visible');
    valid = false;
  }

  if (password.value.trim() === '') {
    password.classList.add('error');
    const e = document.getElementById('err-password');
    e.style.display = 'block';
    e.classList.add('visible');
    valid = false;
  }

  if (valid) {
    // BACKEND TEAM: replace with SSO verification API call.
    // Pass: name/orgName, email, password, selectedRole
    // On success → redirect to the correct setup page
    console.log('Register:', {
      role:     selectedRole,
      name:     name.value.trim(),
      email:    email.value.trim(),
    });
    window.location.href = ROLE_META[selectedRole].redirect;
  }
}