import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    orderBy, 
    onSnapshot ,
    doc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
      
      liveTextarea.value = '';
      if (overlay) overlay.classList.remove('open');
      
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

        // 1. DEFINE dateObj HERE (This is what's missing!)
        const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();

        firebaseData.push({
            id: doc.id,
            name: data.author || "Anonymous Puto",
            body: data.text,
            // 2. Now dateObj is available for use
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: data.likedBy ? data.likedBy.length : 0,
            isLikedByMe: auth.currentUser ? (data.likedBy || []).includes(auth.currentUser.uid) : false,
            comments: data.comments || 0,
            reposts: data.reposts || 0,
            photoSrc: data.isAnonymous ? "../assets/images/anon_avatar.jpg" : (data.photoURL || null)
        });
    });

    window.FEED_POSTS = firebaseData;
    if (window.renderFeedPosts) window.renderFeedPosts();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.USER = {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoSrc: user.photoURL || null
    };

    const sidebarName = document.querySelector('.profile-card-name'); 
    if (sidebarName) sidebarName.textContent = window.USER.name;

    if (window.renderFeedPosts) window.renderFeedPosts();
    
  } else {
    window.location.href = '../index.html';
  }
});

const feedContainer = document.getElementById('feed-posts');

if (feedContainer) {
  feedContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feed-reaction-btn[data-type="like"]');
    if (!btn) return;

    const postId = btn.dataset.id;
    const user = auth.currentUser;

    if (!user) {
      alert("Login to like posts!");
      return;
    }

    // Check if the user has already liked it (based on CSS class)
    const isLiked = btn.classList.contains('heart-active');
    const postRef = doc(db, "posts", postId);

    try {
      if (!isLiked) {
        // ADD LIKE: Put User ID into the array
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid)
        });
        btn.classList.add('heart-active');
      } else {
        // REMOVE LIKE: Take User ID out of the array
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid)
        });
        btn.classList.remove('heart-active');
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  });
}