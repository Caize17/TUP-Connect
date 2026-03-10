import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

  const email = emailField.value.trim();
  const password = passwordField.value;

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ⭐ CHECK IF EMAIL IS VERIFIED
    if (!user.emailVerified) {
      alert("Your email is not verified yet. Please check your TUP email.");
      return;
    }

    // If verified → proceed
    console.log("Logged in:", user);
    window.location.href = '../pages/homepage.html';

  } catch (error) {

    console.error("Firebase Error Code:", error.code);

    switch (error.code) {
      case 'auth/user-not-found':
        alert("This email is not registered. Please sign up first.");
        break;

      case 'auth/wrong-password':
        alert("Incorrect password. Please try again.");
        break;

      case 'auth/invalid-email':
        alert("The email address is not formatted correctly.");
        break;

      case 'auth/too-many-requests':
        alert("Too many failed attempts. Try again later.");
        break;

      default:
        alert("An unexpected error occurred: " + error.message);
    }
  }
}

window.handleHomepage = handleHomepage;
