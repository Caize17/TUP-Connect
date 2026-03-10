import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const textarea   = document.getElementById('post-textarea');
const anonToggle = document.getElementById('modal-anon-toggle');
const overlay    = document.getElementById('create-post-overlay');

// --- 1. SUBMIT LOGIC ---
if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    const user = auth.currentUser;
    const isAnon = anonToggle.checked;

    try {
      await addDoc(collection(db, "posts"), {
        text: text,
        userId: user ? user.uid : "unknown",
        author: isAnon ? "Anonymous Puto" : (user.displayName || user.email),
        isAnonymous: isAnon,
        createdAt: serverTimestamp(),
        likes: 0
      });

      overlay.classList.remove('open');
      textarea.value = '';
      
    } catch (error) {
      console.error("Error posting:", error);
      alert("Error: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Share";
    }
  });

  submitBtn.disabled = false; 
}

// --- 2. REAL-TIME FEED LOGIC ---
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    const firebaseData = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        
        const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();

        firebaseData.push({
            id: doc.id,
            name: data.author,
            body: data.text,
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            likes: data.likes || 0,
            photoSrc: data.isAnonymous ? "../assets/images/anon_avatar.jpg" : null
        });
    });

    window.FEED_POSTS = firebaseData;
    if (window.renderFeedPosts) {
        window.renderFeedPosts();
    }
});