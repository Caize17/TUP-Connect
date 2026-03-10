import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

async function handleHomepage() {
  const emailField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error-msg');
  const btn = document.getElementById('btn-sign-in'); 

  const email = emailField.value.trim();
  const password = passwordField.value;

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  if (!email || !password) {
    showError("Please fill in both fields.");
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Signing in...";
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 1. CHECK IF EMAIL IS VERIFIED
    if (!user.emailVerified) {
      showError("Your email is not verified yet. Please check your TUP inbox.");
      await signOut(auth); 
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sign In";
      }
      return;
    }

    // 2. CHECK FIRESTORE FOR ROLE & SETUP
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role;
      const isSetupComplete = userData.isSetupComplete;

      // --- REDIRECT LOGIC ---
      if (isSetupComplete === true) {
        // BAGONG LOGIC: Redirect based on role
        if (role === 'Organization' || role === 'USG') {
          console.log("Redirecting Org/USG to Profile Page");
          window.location.href = 'pages/org_profile.html';
        } else {
          console.log("Redirecting Student to Homepage");
          window.location.href = 'pages/homepage.html';
        }
      } else {
        // Redirect kung hindi pa tapos ang setup
        if (role === 'Student') {
          window.location.href = 'pages/setup_student.html';
        } else if (role === 'Organization') {
          window.location.href = 'pages/setup_org.html';
        } else if (role === 'USG') {
          window.location.href = 'pages/setup_usg.html';
        } else {
          window.location.href = 'pages/homepage.html';
        }
      }
    } else {
      console.error("No user document found!");
      window.location.href = 'pages/homepage.html';
    }

  } catch (error) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        showError("Incorrect email or password.");
        break;
      case 'auth/too-many-requests':
        showError("Too many attempts. Please try again later.");
        break;
      default:
        showError("Login failed. Please try again.");
    }
  }
}

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