// ── IMPORT FIREBASE ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ── CONFIG ──
const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.appspot.com",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── HELPER FUNCTIONS ──
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = "block";
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(e => e.style.display = "none");
  document.getElementById("verification-msg").style.display = "none";
}

// ── TOGGLE PASSWORD ──
function togglePassword(btn) {
  const input = document.getElementById("input-password");
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}

// ── HANDLE REGISTER ──
function handleRegister() {
  const name = document.getElementById("input-name").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const password = document.getElementById("input-password").value;

  clearErrors();

  // ── VALIDATION ──
  if (!name) {
    return showError("err-name", "Please enter your full name.");
  }
  if (!email || !email.endsWith("@tup.edu.ph")) {
    return showError("err-email", "Please enter a valid @tup.edu.ph email.");
  }
  if (!password) {
    return showError("err-password", "Please enter your TUP password.");
  }

  // ── CREATE USER ──
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;

      // ── SEND VERIFICATION EMAIL ──
      sendEmailVerification(user)
        .then(() => {
          const msg = document.getElementById("verification-msg");
          msg.textContent = "Verification email sent! Please check your TUP email.";
          msg.style.display = "block";
        })
        .catch(err => {
          alert("Failed to send verification email: " + err.message);
        });
    })
    .catch(err => {
      // Handle errors properly
      if (err.code === "auth/email-already-in-use") {
        showError("err-email", "Email is already registered.");
      } else if (err.code === "auth/weak-password") {
        showError("err-password", "Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        showError("err-email", "Invalid email format.");
      } else {
        alert(err.message);
      }
    });
}

// ── EXPOSE FUNCTIONS TO HTML ──
window.handleRegister = handleRegister;
window.togglePassword = togglePassword;
