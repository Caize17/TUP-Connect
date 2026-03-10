// ── IMPORT FIREBASE AUTH ──
import { auth } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

// ── HELPER FUNCTIONS ──
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = "block";
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(e => e.style.display = "none");
}

// ── PASSWORD TOGGLE ──
export function togglePassword(btn) {
  const input = document.getElementById("input-password");
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}

// ── HANDLE REGISTRATION ──
export function handleRegister() {
  const name = document.getElementById("input-name").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const password = document.getElementById("input-password").value;

  clearErrors();

  // ── VALIDATION ──
  if (!name) return showError("err-name", "Please enter your full name.");
  if (!email || !email.endsWith("@tup.edu.ph")) return showError("err-email", "Please enter a valid @tup.edu.ph email.");
  if (!password) return showError("err-password", "Please enter your TUP password.");

  // ── CREATE USER ──
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // ── SEND VERIFICATION EMAIL ──
      sendEmailVerification(user)
        .then(() => {
          alert("✅ A verification email has been sent to your TUP email! Please verify to continue.");
          // Optionally clear fields after sending
          document.getElementById("input-name").value = "";
          document.getElementById("input-email").value = "";
          document.getElementById("input-password").value = "";
        })
        .catch((error) => {
          console.error("Error sending verification email:", error);
          alert("❌ Failed to send verification email. Try again.");
        });

    })
    .catch((error) => {
      console.error(error);
      if (error.code === "auth/email-already-in-use") showError("err-email", "Email is already registered.");
      else if (error.code === "auth/invalid-email") showError("err-email", "Invalid email format.");
      else if (error.code === "auth/weak-password") showError("err-password", "Password should be at least 6 characters.");
      else alert("Registration failed: " + error.message);
    });
}

// ── ATTACH FUNCTIONS TO WINDOW FOR HTML BUTTONS ──
window.handleRegister = handleRegister;
window.togglePassword = togglePassword;
