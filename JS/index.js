import { auth, db } from '../firebaseConfig.js';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    errorEl.innerHTML = ''; // Clear any HTML (like resend link)
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
      const msg = document.createElement('span');
      msg.textContent = "Your email is not verified yet. ";
      
      const resendLink = document.createElement('a');
      resendLink.href = "#";
      resendLink.textContent = "Resend verification email?";
      resendLink.style.color = "#C9A84C";
      resendLink.style.textDecoration = "underline";
      resendLink.style.fontWeight = "600";
      resendLink.style.marginLeft = "5px";
      
      resendLink.onclick = async (e) => {
        e.preventDefault();
        try {
          resendLink.textContent = "Sending...";
          resendLink.style.pointerEvents = "none";
          await sendEmailVerification(user);
          window.showToast("Verification email resent! Please check your TUP inbox.", "success");
          resendLink.textContent = "Sent!";
        } catch (err) {
          console.error("Resend error:", err);
          window.showToast("Failed to resend email: " + err.message, "error");
          resendLink.textContent = "Resend verification email?";
          resendLink.style.pointerEvents = "auto";
        }
      };

      if (errorEl) {
        errorEl.appendChild(msg);
        errorEl.appendChild(resendLink);
        errorEl.style.display = 'block';
      }

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
      const status = userData.status || 'approved'; // Default for legacy users

      // 1. Check Verification Status
      if (status === 'pending') {
        showError("Your account is currently under review by the USG. Please check back later.");
        await signOut(auth);
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Sign In";
        }
        return;
      }
      
      if (status === 'rejected') {
        showError("Your account request was declined. Contact USG for inquiries.");
        await signOut(auth);
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Sign In";
        }
        return;
      }

      // 2. REDIRECT LOGIC
      if (isSetupComplete === true) {
        if (role === 'Organization' || role === 'USG') {
          window.location.href = 'pages/org_profile.html';
        } else if (role === 'SuperAdmin') {
          window.location.href = 'pages/super_admin.html';
        } else {
          window.location.href = 'pages/homepage.html';
        }
      } else {
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
    window.showToast(message, "error");
  }
}

window.handleHomepage = handleHomepage;