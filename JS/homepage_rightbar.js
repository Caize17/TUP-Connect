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

/**
 * Updates all profile-related elements on the homepage
 */
function updateProfileUI(userData) {
  if (!userData) return;

  // Sidebar Card
  const nameEl = document.getElementById('profile-name');
  const idEl = document.getElementById('profile-id');
  const photoWrap = document.getElementById('profile-photo-wrap'); // Fixed ID
  const emailEl = document.getElementById('profile-email');

  if (nameEl) nameEl.textContent = userData.fullName || userData.name || "TUPian";
  if (idEl) idEl.textContent = userData.studentID || userData.id || "—";
  if (emailEl) emailEl.textContent = userData.email || "—";
  
  if (photoWrap && userData.photoURL) {
    photoWrap.innerHTML = `<img src="${userData.photoURL}" class="profile-photo" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
  }

  // Sidebar Avatar (Nav pill)
  const navAvatarWrap = document.getElementById('nav-profile-avatar');
  if (navAvatarWrap && userData.photoURL) {
    navAvatarWrap.innerHTML = `<img src="${userData.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering: high-quality;">`;
  }

  // Comment Bar Avatar
  const commentAvatar = document.getElementById('comment-avatar-wrap');
  if (commentAvatar && userData.photoURL) {
    commentAvatar.innerHTML = `<img src="${userData.photoURL}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;"/>`;
  }

  // Modal Avatar
  const modalAvatar = document.getElementById('modal-avatar');
  const modalName = document.getElementById('modal-user-name');
  if (modalAvatar && userData.photoURL) {
    modalAvatar.innerHTML = `<img src="${userData.photoURL}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;">`;
  }
  if (modalName) modalName.textContent = userData.fullName || userData.name || "TUPian";
}

// 1. Immediate Cache Load (Prevent Flicker)
(function initImmediateCache() {
  const cache = localStorage.getItem('tup_user_meta');
  if (cache) {
    try {
      updateProfileUI(JSON.parse(cache));
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }
})();

onAuthStateChanged(auth, async (user) => {
  if (sessionStorage.getItem('guestMode') === 'true') return;

  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Update modern cache
        const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
        const updatedMeta = {
          ...cache,
          fullName: userData.fullName,
          studentID: userData.studentID,
          photoURL: userData.photoURL,
          email: user.email,
          role: userData.role === 'USG' ? 'Admin' : userData.role,
          college: userData.college
        };
        localStorage.setItem('tup_user_meta', JSON.stringify(updatedMeta));

        // Update UI
        updateProfileUI(updatedMeta);
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