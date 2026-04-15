import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. YOUR CONFIG (Must be present in this file)
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

// 3. YOUR LOGIC
(function() {
    const navAvatarWrap = document.getElementById('nav-profile-avatar');
    const cache = localStorage.getItem('tup_user_meta');
    if (cache && navAvatarWrap) {
        try {
            const userData = JSON.parse(cache);
            if (userData.photoURL) {
                navAvatarWrap.innerHTML = `<img src="${userData.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
            }
        } catch(e) {}
    }
})();

onAuthStateChanged(auth, async (user) => {
    const navAvatarWrap = document.getElementById('nav-profile-avatar');
    
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            if (userData.photoURL) {
                // Update modern cache
                const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
                cache.photoURL = userData.photoURL;
                cache.fullName = userData.fullName;
                localStorage.setItem('tup_user_meta', JSON.stringify(cache));
                
                // Update UI if changed
                if (navAvatarWrap) {
                    navAvatarWrap.innerHTML = `<img src="${userData.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
                }
            }
        }
    }
});