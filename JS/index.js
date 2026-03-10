function showError(message) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
  }
}

function handleHomepage() {
  const email    = document.getElementById('login-email');
  const password = document.getElementById('login-password');

  let valid = true;

  ['email', 'password'].forEach(f => {
    const inputField = document.getElementById(`login-${f}`);
    if (inputField) inputField.classList.remove('error');
    
    const errorLabel = document.getElementById(`err-${f}`);
    if (errorLabel) errorLabel.classList.remove('visible');
  });

  if (valid) {
    window.location.href = '../pages/homepage.html';
  }
}