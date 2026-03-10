// 1. Imports
import { auth } from '../firebaseConfig.js'; 
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

// 2. Global State
let selectedRole = null;

const ROLE_META = {
  student: { label: 'Student',            redirect: 'setup_student.html' },
  org:     { label: 'Student Organization', redirect: 'setup_org.html'     },
  admin:   { label: 'Admin / USG',          redirect: 'setup_usg.html'     },
};

// 3. Expose functions to window
window.selectRole = function(role) {
  ['student', 'org', 'admin'].forEach(r => {
    const el = document.getElementById(`role-${r}`);
    if (el) el.classList.remove('selected');
  });

  selectedRole = role;
  const selectedEl = document.getElementById(`role-${role}`);
  if (selectedEl) selectedEl.classList.add('selected');

  const meta = ROLE_META[role];
  const pill = document.getElementById('selected-role-pill');
  const subtitle = document.getElementById('reg-subtitle');

  if (subtitle) subtitle.textContent = `Registering as: `;
  if (pill) pill.style.display = 'inline-flex';
  const pillLabel = document.getElementById('pill-label');
  if (pillLabel) pillLabel.textContent = meta.label;

  const fieldsToShow = ['field-name', 'field-email', 'field-password'];
  fieldsToShow.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'flex';
      el.style.animationDelay = `${i * 0.06}s`;
    }
  });

  const elements = {
    'role-nudge': 'none',
    'btn-register': 'block',
    'or-divider': 'flex',
    'btn-guest-bottom': 'block',
    'hint-text': 'block'
  };

  for (const [id, display] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
  }

  const labelName = document.getElementById('label-name');
  if (labelName) {
    labelName.textContent = role === 'org' ? 'Organization Name' : role === 'admin' ? 'Name' : 'Full Name';
  }
};

window.togglePassword = function(btn) {
  const input = document.getElementById('input-password');
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
};

window.handleRegister = async function() {
  if (!selectedRole) return;

  const name = document.getElementById('input-name');
  const email = document.getElementById('input-email');
  const password = document.getElementById('input-password');
  const btn = document.getElementById('btn-register');

  let valid = true;

  // RESET ALL ERRORS (including the new one)
  ['name', 'email', 'password', 'email-used'].forEach(f => {
    const input = document.getElementById(`input-${f}`);
    const err = document.getElementById(`err-${f}`);
    if (input) input.classList.remove('error');
    if (err) {
      err.classList.remove('visible');
      err.style.display = 'none';
    }
  });

  // Validation checks
  if (name.value.trim() === '') { showFieldError('name'); valid = false; }
  if (!email.value.trim().endsWith('@tup.edu.ph')) { showFieldError('email'); valid = false; }
  if (password.value.trim().length < 6) { showFieldError('password'); valid = false; }

  if (valid) {
    try {
      btn.disabled = true;
      btn.textContent = "Creating Account...";

      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      const user = userCredential.user;

      // 2. Verification Email
      await sendEmailVerification(user);

      // 3. Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: name.value.trim(),
        email: email.value.trim(),
        role: selectedRole,
        isVerified: false,
        createdAt: new Date()
      });

      alert("Verification email sent! Check your TUP inbox.");
      window.location.href = `../${ROLE_META[selectedRole].redirect}`;

    } catch (error) {
      console.error("Firebase Error Code:", error.code);
      btn.disabled = false;
      btn.textContent = "Verify & Continue";

      // TARGETED ERROR MESSAGE DISPLAY
      if (error.code === 'auth/email-already-in-use') {
        const emailInput = document.getElementById('input-email');
        const usedEmailErr = document.getElementById('err-email-used');
        
        emailInput.classList.add('error');
        if (usedEmailErr) {
            usedEmailErr.style.display = 'block';
            usedEmailErr.classList.add('visible');
        }
      } else {
        alert("Registration failed: " + error.message);
      }
    }
  }
};

function showFieldError(field) {
  const input = document.getElementById(`input-${field}`);
  const err = document.getElementById(`err-${field}`);
  if (input) input.classList.add('error');
  if (err) { err.style.display = 'block'; err.classList.add('visible'); }
}