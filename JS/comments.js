import { auth, db } from "../firebaseConfig.js";
import {
    doc, getDoc, collection, addDoc, query, orderBy, deleteDoc,
    onSnapshot, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
    authDomain: "tup-connect-b162d.firebaseapp.com",
    projectId: "tup-connect-b162d",
    storageBucket: "tup-connect-b162d.firebasestorage.app",
    messagingSenderId: "193141013544",
    appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

let unsubscribeComments = null;
let cachedPhoto = null;
let activeCollection = 'posts'; // Default to 'posts'

const sendBtn = document.getElementById('comment-send-btn');
const inputField = document.getElementById('comment-input-field');
const commentList = document.getElementById('comment-list');
const overlay = document.getElementById('comment-modal-overlay');

function getAvatar(photo, name) {
    const initials = name ? name.charAt(0).toUpperCase() : '?';
    const hasPhoto = photo && typeof photo === 'string' &&
        (photo.startsWith('http') || photo.startsWith('data:image'));

    if (hasPhoto) {
        return `
            <div class="avatar-container" style="width:100%; height:100%; position:relative;">
                <img src="${photo}" alt="${name}" 
                     style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="default-avatar" style="display:none; background:#7a1a1a; color:white; width:100%; height:100%; border-radius:50%; align-items:center; justify-content:center; position:absolute; top:0; left:0;">${initials}</div>
            </div>`;
    }

    return `<div class="default-avatar" style="background:#7a1a1a; color:white; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${initials}</div>`;
}


async function updateModalInputAvatar() {
    const inputAvatar = document.getElementById('comment-input-avatar');
    if (!inputAvatar || !auth.currentUser) return;

    if (cachedPhoto) {
        inputAvatar.innerHTML = getAvatar(cachedPhoto, auth.currentUser.displayName);
        return;
    }
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            cachedPhoto = data.photoURL || data.photoSrc;
            inputAvatar.innerHTML = getAvatar(cachedPhoto, auth.currentUser.displayName);
        }
    } catch (err) {
        console.error("Failed to fetch avatar from Firestore:", err);
        inputAvatar.innerHTML = getAvatar(null, auth.currentUser.displayName);
    }
}

window.openCommentModal = async function (postIdx) {
    const overlay = document.getElementById('comment-modal-overlay');

    await updateModalInputAvatar();

    if (overlay) {
        overlay.dataset.post = postIdx;
        overlay.classList.add('open');

        const inputField = document.getElementById('comment-input-field');
        if (inputField) inputField.value = '';

        if (window.renderComments) {
            window.renderComments(postIdx);
        }

        setTimeout(() => inputField.focus(), 150);
    }
};

const feedContainer = document.getElementById('feed-posts');

if (feedContainer) {
    feedContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-type="comment"]');
        if (!btn) return;

        if (inputField) inputField.value = '';

        const postId = btn.dataset.id;
        const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);

        if (postIdx !== -1 && window.FEED_POSTS[postIdx]) {
            activeCollection = 'posts';
            listenForComments(postId);

            if (typeof window.openCommentModal === 'function') {
                window.openCommentModal(postIdx);
            }
        }
    });
}


window.openCommentModalPinned = function (postId) {
    activeCollection = 'announcements';
    // We need to create a dummy post in window.FEED_POSTS or handle it separately
    // Actually, let's just make sure listenForComments can handle a post that isn't in FEED_POSTS
    listenForComments(postId, 'announcements');

    // Open the modal
    const overlay = document.getElementById('comment-modal-overlay');
    updateModalInputAvatar();
    if (overlay) {
        overlay.dataset.post = 'pinned'; // Mark as pinned
        overlay.dataset.postId = postId;
        overlay.classList.add('open');
        const inputField = document.getElementById('comment-input-field');
        if (inputField) inputField.value = '';
        setTimeout(() => inputField.focus(), 150);
    }
};

function listenForComments(postId, collectionName = 'posts') {
    activeCollection = collectionName;
    if (unsubscribeComments) unsubscribeComments();

    const q = query(
        collection(db, collectionName, postId, "comments"),
        orderBy("createdAt", "asc")
    );

    unsubscribeComments = onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => {
            const data = doc.data();
            const user = auth.currentUser;
            const isOwn = user && data.userId === user.uid;

            const rawPhoto = data.photoURL;
            const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
            const photoURL = (isOwn && cache.photoURL) ? cache.photoURL : (rawPhoto === 'anon' || !rawPhoto ? '../assets/images/anon_avatar.jpg' : rawPhoto);

            return {
                id: doc.id,
                author: data.author || 'Anonymous',
                userId: data.userId,
                text: data.text || '',
                photoURL: photoURL,
                isOwn: isOwn,
                time: data.createdAt ? (window.formatSmartDate ? window.formatSmartDate(data.createdAt.toDate()) : data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Just now'
            };
        });

        const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);
        if (postIdx !== -1) {
            window.FEED_POSTS[postIdx].commentList = comments;
            window.FEED_POSTS[postIdx].comments = comments.length;
            if (window.renderComments) window.renderComments(postIdx);
            if (window.renderFeed) window.renderFeed();
        } else {
            // Post not in feed (likely pinned or direct link)
            if (window.renderCommentsPinned) {
                window.renderCommentsPinned(comments, postId);
            }
        }
    }, (error) => {
        console.error(`[Comments] Snapshot error for ${collectionName}/${postId}:`, error);
        const listElement = document.getElementById('comment-list');
        if (listElement) {
            listElement.innerHTML = `<div class="error-state" style="padding: 20px; text-align: center; color: var(--maroon);">
            <p>Unable to load comments. ${error.code === 'permission-denied' ? 'Access denied.' : 'Please try again later.'}</p>
        </div>`;
        }
    });
}

if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
        const overlay = document.getElementById('comment-modal-overlay');
        const postIdx = overlay.dataset.post;
        const isPinned = postIdx === 'pinned';
        const postId = isPinned ? overlay.dataset.postId : (window.FEED_POSTS[postIdx] ? window.FEED_POSTS[postIdx].id : null);

        const text = inputField.value.trim();
        if (!text || !postId || !auth.currentUser) {
            console.error("Missing data:", { text, postId, user: auth.currentUser });
            return;
        }

        const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
        const myRole = cache.role;
        // For pinned announcements (not in FEED_POSTS), we might need to check if it's an org post
        // But usually pinned announcements are admin posts.

        try {
            const currentUser = auth.currentUser;
            const photoToUpload = window.cachedPhoto || currentUser.photoURL || null;

            await addDoc(collection(db, activeCollection, postId, "comments"), {
                text: text,
                author: currentUser.displayName || "Anonymous User",
                userId: currentUser.uid,
                photoURL: photoToUpload,
                createdAt: serverTimestamp()
            });

            const updateObj = (activeCollection === 'announcements')
                ? { comments: arrayUnion(currentUser.uid) }
                : { comments: increment(1) };

            await updateDoc(doc(db, activeCollection, postId), updateObj);

            // Special handling for announcements: they use arrayUnion for comments usually
            // But if activeCollection is 'announcements', we should use arrayUnion if that's the pattern
            // In campus_news.js it uses arrayUnion for announcements.
            if (activeCollection === 'announcements') {
                await updateDoc(doc(db, "announcements", postId), {
                    comments: arrayUnion(currentUser.uid)
                });
            }

            inputField.value = '';
            console.log("Input cleared. Waiting for Snapshot to render...");

        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    });
}

async function saveCommentEdit(postId, commentId, newText) {
    const commentRef = doc(db, activeCollection, postId, "comments", commentId);
    return await updateDoc(commentRef, {
        text: newText,
        isEdited: true,
        editedAt: serverTimestamp()
    });
}
window.saveCommentEdit = saveCommentEdit;

async function deleteComment(postId, commentId) {
    const commentRef = doc(db, activeCollection, postId, "comments", commentId);
    await deleteDoc(commentRef);

    const postRef = doc(db, activeCollection, postId);
    if (activeCollection === 'announcements') {
        await updateDoc(postRef, {
            comments: arrayRemove(auth.currentUser.uid)
        });
    } else {
        await updateDoc(postRef, {
            comments: increment(-1)
        });
    }
}
window.deleteComment = deleteComment;

document.addEventListener('click', async (e) => {
    const menuBtn = e.target.closest('.post-menu-btn');

    if (menuBtn) {
        e.stopPropagation();
        const idx = menuBtn.dataset.post;
        const dropdown = document.getElementById(`post-menu-${idx}`);

        document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
            if (m !== dropdown) m.classList.remove('open');
        });

        dropdown.classList.toggle('open');
        return;
    }

    const reportItem = e.target.closest('[data-action="report"]');
    if (reportItem) {
        const idx = reportItem.dataset.post;
        const post = window.FEED_POSTS ? window.FEED_POSTS[idx] : null;

        if (post) {
            window.showConfirm({
                title: "Report this post for community review?",
                confirmText: "Report",
                onConfirm: async () => {
                    try {
                        await handleReportPost(post.id, post.userId);
                        window.showToast("Thank you. The post has been reported.", "success");
                    } catch (err) {
                        console.error("Report failed:", err);
                        window.showToast("Could not submit report at this time.", "error");
                    }
                }
            });
        }

        const dropdown = reportItem.closest('.post-menu-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        return;
    }

    document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
        m.classList.remove('open');
    });
});

async function handleReportPost(postId, userId) {
    if (!auth.currentUser) { window.showToast("Login to report.", "warning"); return; }
    console.log("Reporting Post:", postId, "User:", userId);

    if (!postId || !userId) {
        throw new Error("Missing Post ID or User ID. Check your data mapping.");
    }

    return await addDoc(collection(db, "reports"), {
        postId: postId,
        reportedUser: userId,
        reportedBy: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        status: "pending"
    });
}
window.handleReportPost = handleReportPost;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            cachedPhoto = userData.photoURL || userData.photoSrc || null;
            window.cachedPhoto = cachedPhoto;
            console.log("Global Cache filled!");
        }
        updateModalInputAvatar();
    }
});

window.getAvatar = getAvatar;
window.cachedPhoto = cachedPhoto;
