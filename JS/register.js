function togglePassword(btn) {
  const input = document.getElementById('input-password');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function handleRegister() {
  const name     = document.getElementById('input-name');
  const email    = document.getElementById('input-email');
  const password = document.getElementById('input-password');

  let valid = true;

  ['name', 'email', 'password'].forEach(f => {
    document.getElementById(`input-${f}`).classList.remove('error');
    document.getElementById(`err-${f}`).classList.remove('visible');
  });

  if (name.value.trim() === '') {
    name.classList.add('error');
    document.getElementById('err-name').classList.add('visible');
    valid = false;
  }

  if (!email.value.trim().endsWith('@tup.edu.ph')) {
    email.classList.add('error');
    document.getElementById('err-email').classList.add('visible');
    valid = false;
  }

  if (password.value.trim() === '') {
    password.classList.add('error');
    document.getElementById('err-password').classList.add('visible');
    valid = false;
  }

  // BACKEND TEAM: replace this block with your SSO verification API call.
  // Send: name, email, password to your endpoint.
  // On success  → redirect to role-picker.html
  // On failure  → show an error on the card
  if (valid) {
    window.location.href = 'role-picker.html';
  }
}