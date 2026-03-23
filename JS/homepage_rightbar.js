import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
  if (sessionStorage.getItem('guestMode') === 'true') return;

  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        const navAvatarWrap = document.getElementById('nav-profile-avatar');
        if (navAvatarWrap && userData.photoURL) {
          navAvatarWrap.innerHTML = `<img src="${userData.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }

        const nameEl = document.getElementById('profile-name');
        const idEl = document.getElementById('profile-id');
        const photoWrap = document.querySelector('.profile-photo-wrap');
        const emailEl = document.querySelector('.profile-email');

        if (nameEl) nameEl.textContent = userData.fullName || "TUPian";
        if (idEl) idEl.textContent = userData.studentID || "No ID Set";
        if (photoWrap && userData.photoURL) {
          photoWrap.innerHTML = `<img src="${userData.photoURL}" class="profile-photo" alt="Profile">`;
        }
        
        if (emailEl) emailEl.textContent = user.email; 
      }
    } catch (error) {
      console.error("Global Nav Fetch Error:", error);
    }
  } else {
    window.location.href = "../index.html";
  }
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        localStorage.clear();
        window.location.href = "../index.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
});