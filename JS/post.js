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
    increment,
    deleteDoc,
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

let unsubscribeComments = null;

if (submitBtn) {
  submitBtn.addEventListener('click', async (e) => {
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

        const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();

        firebaseData.push({
            id: doc.id,
            name: data.author || "Anonymous Puto",
            body: data.text,
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

    const currentName = user.displayName || user.email.split('@')[0];

    USER.name = currentName;
    USER.photoSrc = user.photoURL;

    const nameEl = document.getElementById('modal-user-name');
    const sidebarName = document.querySelector('.user-name'); 
    const postBoxName = document.querySelector('.post-creator-info h4'); 

    if (nameEl) nameEl.textContent = USER.name;
    if (sidebarName) sidebarName.textContent = USER.name;
    if (postBoxName) postBoxName.textContent = USER.name;

    const rightBarName = document.getElementById('profile-name');
    if (rightBarName) {
      rightBarName.textContent = USER.name;
    }

    const rightBarAvatar = document.querySelector('.right-sidebar .profile-pic img') || 
                           document.querySelector('#profile-name-container img');
    if (rightBarAvatar && user.photoURL) {
      rightBarAvatar.src = user.photoURL;
    }
  } else {
    window.location.href = "../index.html";
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

    const isLiked = btn.classList.contains('heart-active');
    const postRef = doc(db, "posts", postId);

    try {
      if (!isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid)
        });
        btn.classList.add('heart-active');
      } else {
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

if (feedContainer) {
  feedContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type="comment"]');
    if (!btn) return;

    const postId = btn.dataset.id;
    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);

    if (postIdx !== -1 && window.FEED_POSTS[postIdx]) {
      listenForComments(postId); 
      window.openCommentModal(postIdx);
    } else {
      console.error("Post not found in FEED_POSTS array!");
    }
  });
}

function listenForComments(postId) {
  if (unsubscribeComments) unsubscribeComments();
    
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  unsubscribeComments = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isOwn: auth.currentUser ? (data.userId === auth.currentUser.uid) : false,
        time: data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
      };
    });

    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);
    if (postIdx !== -1) {
      window.FEED_POSTS[postIdx].commentList = comments;
      if (window.openCommentModal) window.openCommentModal(postIdx);
    }
  });
}

const sendBtn = document.getElementById('comment-send-btn');
const inputField = document.getElementById('comment-input-field');

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const overlay = document.getElementById('comment-modal-overlay');
    const postIdx = overlay.dataset.post;
    
    const post = window.FEED_POSTS ? window.FEED_POSTS[postIdx] : null;

    const text = inputField.value.trim();

    if (!text || !post || !auth.currentUser) {
        console.error("Missing data:", { text, post, user: auth.currentUser });
        return;
    }

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: text,
        author: auth.currentUser.displayName || "Anonymous User",
        userId: auth.currentUser.uid,
        photoSrc: auth.currentUser.photoURL || null,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "posts", post.id), {
        comments: increment(1)
      });

      inputField.value = '';
    } catch (err) {
      console.error("Firebase Error:", err);
    }
  });
}