import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  // Guest mode — skip auth entirely, don't redirect
  if (sessionStorage.getItem('guestMode') === 'true') return;

  if (user) {
    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.textContent = user.email;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = userData.fullName || user.displayName || "TUPian";

        const idEl = document.getElementById('profile-id');
        if (idEl) idEl.textContent = userData.studentID || "No ID Set";

        const photoWrap = document.querySelector('.profile-photo-wrap');

      if (photoWrap) {
        if (userData && userData.photoURL) {
          photoWrap.innerHTML = `
            <img src="${userData.photoURL}" 
                class="profile-photo" 
                alt="Profile Picture">
          `;
        } else {
          photoWrap.innerHTML = `
            <div class="profile-photo-ph">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          `;
        }
      }
    }
    } catch (error) {
      console.error("Right Bar Fetch Error:", error);
    }
  } else {

    window.location.href = "../index.html";
    
  }
});