import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  if (user) {
    // 1. Basic Auth Info
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    if (nameEl) nameEl.textContent = user.displayName || "TUPian";
    if (emailEl) emailEl.textContent = user.email;

    // 2. Fetch Student ID from Firestore
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const idEl = document.getElementById('profile-id');
        
        if (idEl) {
          // Use 'studentID' to match your Setup Script's naming
          idEl.textContent = userData.studentID || "No ID Set";
        }
      }
    } catch (error) {
      console.error("Error fetching student ID:", error);
    }
    
    // 3. Update Photo (Optional but recommended)
    const photoWrap = document.getElementById('profile-photo-wrap');
    if (photoWrap && user.photoURL) {
       photoWrap.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }
  }
});