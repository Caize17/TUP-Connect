import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const submitBtn  = document.getElementById('modal-submit-btn');
const textarea = document.querySelector('#post-textarea textarea') || document.querySelector('textarea#post-textarea');
const anonToggle = document.getElementById('modal-anon-toggle');
const overlay    = document.getElementById('create-post-overlay');

if (submitBtn) {
  submitBtn.addEventListener('click', async (e) => {
    // Prevent any other conflicting scripts from firing
    e.stopImmediatePropagation(); 

    const liveTextarea = document.getElementById('post-textarea');
    const text = liveTextarea ? liveTextarea.value.trim() : "";

    if (!text) {
      console.log("Blocking empty post!");
      return;
    }

    const user = auth.currentUser;

    try {
      // Disable button so user doesn't click twice
      submitBtn.disabled = true;
      submitBtn.textContent = "Posting...";

      const docRef = await addDoc(collection(db, "posts"), {
        text: text,
        userId: user ? user.uid : "unknown",
        author: anonToggle.checked ? "Anonymous Puto" : (user.displayName || user.email),
        isAnonymous: anonToggle.checked,
        createdAt: serverTimestamp(),
        likes: 0
      });

      console.log("✅ Success! ID:", docRef.id);
      
      // NOW we clear the UI since the database has the data
      liveTextarea.value = '';
      if (overlay) overlay.classList.remove('open');
      
      // If you have the showToast function available:
      if (typeof showToast === 'function') showToast('Post Shared!');

    } catch (err) {
      console.error("❌ Firebase Error:", err);
      alert("Failed to post: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Share";
    }
  });
}

const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    const firebaseData = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();

        firebaseData.push({
            id: doc.id,
            name: data.author || "Anonymous Puto",
            body: data.text, // Must be 'body' for homepage.js
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: data.likes || 0,
            comments: data.comments || 0,
            reposts: data.reposts || 0,
            isAnonymous: data.isAnonymous || false
        });
    });

    // CRITICAL: homepage.js is looking for a variable named 'FEED_POSTS'
    // We must define it on the window so homepage.js can see it
    window.FEED_POSTS = firebaseData;
    
    // Check if the function exists and run it
    if (typeof window.renderFeedPosts === 'function') {
        console.log("Painting " + firebaseData.length + " posts to the screen...");
        window.renderFeedPosts();
    }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // 1. Create the global USER object homepage.js needs
    window.USER = {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoSrc: user.photoURL || null
    };

    // 2. Manually nudge the sidebar name so it stops saying "Loading"
    const sidebarName = document.querySelector('.profile-card-name'); 
    if (sidebarName) sidebarName.textContent = window.USER.name;

    // 3. Trigger the initial render
    if (window.renderFeedPosts) window.renderFeedPosts();
    
  } else {
    window.location.href = '../index.html';
  }
});