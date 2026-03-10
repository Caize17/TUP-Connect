import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function handleHomepage() {
  const emailField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error-msg'); // Ang bagong element sa HTML

  const email = emailField.value.trim();
  const password = passwordField.value;

  // 1. RESET
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  if (!email || !password) {
    showError("Please fill in both fields.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. CHECK IF EMAIL IS VERIFIED
    if (!user.emailVerified) {
      showError("Your email is not verified yet. Please check your TUP email.");
      
      await signOut(auth); 
      return;
    }

    // If verified → proceed
    window.location.href = 'pages/homepage.html';

  } catch (error) {
    console.error("Firebase Error Code:", error.code);

    // 3. SWITCH ERROR HANDLING
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        showError("Incorrect email or password.");
        break;

      case 'auth/invalid-email':
        showError("The email address is not formatted correctly.");
        break;

      case 'auth/too-many-requests':
        showError("Too many failed attempts. Try again later.");
        break;

      default:
        showError("An unexpected error occurred. Please try again.");
    }
  }
}

// Helper function
function showError(message) {
  const errorEl = document.getElementById('login-error-msg');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    alert(message);
  }
}

window.handleHomepage = handleHomepage;
