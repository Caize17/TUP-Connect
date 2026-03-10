import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.handleHomepage = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-sign-in');
    const errorEl = document.getElementById('login-error-msg');

    errorEl.style.display = 'none';
    errorEl.textContent = '';

    if (!email || !password) {
        errorEl.textContent = "Please enter your email and password.";
        errorEl.style.display = 'block';
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Checking...";

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. CHECK VERIFICATION
        if (user.emailVerified) {
            window.location.href = "pages/homepage.html";
        } else {
            errorEl.textContent = "Your email is not verified yet. Please check your TUP email.";
            errorEl.style.display = 'block';
            
            await signOut(auth);
            btn.disabled = false;
            btn.textContent = "Sign In";
        }

    } catch (error) {
        btn.disabled = false;
        btn.textContent = "Sign In";
        
        errorEl.style.display = 'block';
        if (error.code === 'auth/invalid-credential') {
            errorEl.textContent = "Incorrect email or password.";
        } else {
            errorEl.textContent = "Login failed. Please try again.";
        }
    }
};