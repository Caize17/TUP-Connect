import { auth, db } from './firebaseConfig.js'; 
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

        // 1. CHECK VERIFICATION
        if (user.emailVerified) {
            
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role; 
                    const isSetupComplete = userData.isSetupComplete;

                    // DEBUGGING: Buksan ang Console (F12) para makita ito
                    console.log("Firestore Data:", userData);

                    // 2. CHECK IF SETUP IS COMPLETE
                    if (isSetupComplete === true) {
                        window.location.href = "pages/homepage.html";
                    } else {
                        // 3. REDIRECT BASED ON ROLE (Case-Sensitive!)
                        if (role === 'Student') {
                            window.location.href = "pages/setup_student.html";
                        } else if (role === 'Organization') {
                            window.location.href = "pages/setup_org.html";
                        } else if (role === 'USG') {
                            window.location.href = "pages/setup_usg.html";
                        } else {
                            // Kung dinala ka sa homepage dito, ibig sabihin hindi match ang Role spelling
                            console.error("Role mismatch! Role found:", role);
                            alert("Warning: Role '" + role + "' is not recognized. Redirecting to Homepage.");
                            window.location.href = "pages/homepage.html";
                        }
                    }
                } else {
                    console.error("No Firestore document found for UID:", user.uid);
                    alert("Account data not found. Please contact support.");
                    window.location.href = "pages/homepage.html";
                }
            } catch (firestoreError) {
                console.error("Firestore Error:", firestoreError);
                // Kung may Permission Error (Rules), dito babagsak
                alert("Database Error: " + firestoreError.message);
                window.location.href = "pages/homepage.html";
            }

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
            errorEl.textContent = "Login failed: " + error.message;
        }
    }
};