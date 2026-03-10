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
  // 1. Get the actual elements from your HTML
  const emailField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');

  const email = emailField.value.trim();
  const password = passwordField.value;

  // 2. Simple check for empty fields
  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  try {
    // 3. Ask Firebase if this user exists
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 4. Success! Move to homepage
    console.log("Logged in:", userCredential.user);
    window.location.href = 'homepage.html'; 

  } catch (error) {
    // 5. If account is not in DB or password is wrong
    console.error("Error code:", error.code);
    alert("Login failed: Account not found or wrong password.");
  }
}

// 6. IMPORTANT: Make the function global so onclick="" can see it
window.location.href = '../pages/homepage.html';
window.handleHomepage = handleHomepage;