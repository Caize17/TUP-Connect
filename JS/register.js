// 1. Imports - Kunin ang auth at db mula sa iyong config file
import { auth, db } from '../firebaseConfig.js'; 
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  doc, 
  setDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Global State
let selectedRole = null;

const ROLE_META = {
  student: { label: 'Student',              redirect: 'setup_student.html' },
  org:     { label: 'Student Organization', redirect: 'setup_org.html'     },
  admin:   { label: 'Admin / USG',          redirect: 'setup_usg.html'     },
};

// 3. Expose functions to window
window.selectRole = function(role) {
  // Remove selection highlight from all cards
  ['student', 'org', 'admin'].forEach(r => {
    const el = document.getElementById(`role-${r}`);
    if (el) el.classList.remove('selected');
  });

  // Set current selection
  selectedRole = role;
  const selectedEl = document.getElementById(`role-${role}`);
  if (selectedEl) selectedEl.classList.add('selected');

  // Update UI Elements
  const meta = ROLE_META[role];
  const pill = document.getElementById('selected-role-pill');
  const subtitle = document.getElementById('reg-subtitle');
  const pillLabel = document.getElementById('pill-label');

  if (subtitle) subtitle.textContent = `Registering as: `;
  if (pill) pill.style.display = 'inline-flex';
  if (pillLabel) pillLabel.textContent = meta.label;

  // Show registration fields with animation
  const fieldsToShow = ['field-name', 'field-email', 'field-password'];
  fieldsToShow.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'flex';
      el.style.animationDelay = `${i * 0.06}s`;
    }
  });

  // Toggle visibility of other elements
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

  // Update Input Label based on Role
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

  const nameInput = document.getElementById('input-name');
  const emailInput = document.getElementById('input-email');
  const passwordInput = document.getElementById('input-password');
  const btn = document.getElementById('btn-register');

  let valid = true;

  // Reset errors
  ['name', 'email', 'password', 'email-used'].forEach(f => {
    const input = document.getElementById(`input-${f}`);
    const err = document.getElementById(`err-${f}`);
    if (input) input.classList.remove('error');
    if (err) {
      err.classList.remove('visible');
      err.style.display = 'none';
    }
  });

  // Simple Validation
  if (nameInput.value.trim() === '') { showFieldError('name'); valid = false; }
  if (!emailInput.value.trim().endsWith('@tup.edu.ph')) { showFieldError('email'); valid = false; }
  if (passwordInput.value.trim().length < 6) { showFieldError('password'); valid = false; }

  if (valid) {
    try {
      btn.disabled = true;
      btn.textContent = "Creating Account...";

      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      const user = userCredential.user;

      // 2. Send Verification Email
      await sendEmailVerification(user);

      // 3. Format Role Label for Firestore consistency
      const roleLabel = selectedRole === 'org' ? 'Organization' : selectedRole === 'admin' ? 'USG' : 'Student';

      // 4. Save User Data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: nameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleLabel,
        isVerified: false,
        isSetupComplete: false, // Eto ang trigger para sa setup page redirect
        createdAt: serverTimestamp()
      });

      alert("Verification email sent! Please check your TUP inbox and verify your account before logging in.");
      
      // Redirect back to login page
      window.location.href = "../index.html"; 

    } catch (error) {
      console.error("Firebase Error:", error.code, error.message);
      btn.disabled = false;
      btn.textContent = "Verify & Continue";

      if (error.code === 'auth/email-already-in-use') {
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