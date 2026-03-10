import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";

// ⭐ Put the function here
function showError(message) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

const signInBtn = document.getElementById('btn-sign-in');

if (signInBtn) {
  signInBtn.addEventListener('click', async () => {

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError("Please fill in all fields.");
      return;
    }

    try {

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // check if verified
      if (!user.emailVerified) {
        showError("Please verify your TUP email before logging in.");
        return;
      }

      console.log("Sign-in successful!");
      window.location.href = 'pages/homepage.html';

    } catch (error) {

      if (error.code === "auth/user-not-found") {
        showError("Email is not registered.");
      } 
      else if (error.code === "auth/wrong-password") {
        showError("Incorrect password.");
      } 
      else {
        showError("Login failed. Check your credentials.");
      }

      console.error(error.code);
    }
  });
}

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

