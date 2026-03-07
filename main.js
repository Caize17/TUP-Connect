import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";

// --- 1. Traditional Login ---
const signInBtn = document.getElementById('btn-sign-in');
if (signInBtn) {
  signInBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError("Please fill in all fields.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign-in successful!");
      window.location.href = 'pages/homepage.html';
    } catch (error) {
      showError("Login failed. Check your credentials.");
      console.error(error.code);
    }
  });
}

// --- 2. Guest Login ---
const guestBtn = document.getElementById('btn-guest-login');
if (guestBtn) {
  guestBtn.addEventListener('click', async () => {
    try {
      await signInAnonymously(auth);
      window.location.href = 'pages/homepage.html';
    } catch (error) {
      console.error("Guest login error:", error);
    }
  });
}