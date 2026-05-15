import { db, auth } from '../firebaseConfig.js';
import { 
    collection, query, where, getDocs, onSnapshot, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let activeTab = 'analytics';

// ════════════════════════════════════════
// AUTHENTICATION GUARD
// ════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role !== 'SuperAdmin') {
        console.warn("Unauthorized access attempt to Command Center.");
        window.location.href = './homepage.html';
        return;
    }

    // Initialize Dashboard
    initDashboard();
});

// ════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════
function initDashboard() {
    setupTabs();
    setupActions();
    startAnalyticsSync();
    startVerificationSync();
    startModerationSync();
}

function setupActions() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (confirm("Sign out of Command Center?")) {
                await auth.signOut();
                localStorage.removeItem('tup_user_meta');
                window.location.href = '../index.html';
            }
        };
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.dash-tab');
    const sections = document.querySelectorAll('.dash-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // UI Update
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
            activeTab = target;
        });
    });
}

// ════════════════════════════════════════
// ANALYTICS ENGINE
// ════════════════════════════════════════
async function startAnalyticsSync() {
    // 1. Total Users Count
    onSnapshot(collection(db, "users"), (snapshot) => {
        document.getElementById('stat-total-users').textContent = snapshot.size;
        
        // Update college breakdown
        const colleges = {};
        snapshot.docs.forEach(d => {
            const data = d.data();
            const col = data.college || 'Other';
            colleges[col] = (colleges[col] || 0) + 1;
        });
        renderCollegeBreakdown(colleges, snapshot.size);
    });

    // 2. Total Orgs Count
    onSnapshot(query(collection(db, "users"), where("role", "==", "Organization")), (snapshot) => {
        document.getElementById('stat-total-orgs').textContent = snapshot.size;
    });

    // 3. Total Posts Count (Simplified estimate)
    onSnapshot(collection(db, "posts"), (pSnap) => {
        const postsCount = pSnap.size;
        onSnapshot(collection(db, "announcements"), (aSnap) => {
            const annCount = aSnap.size;
            document.getElementById('stat-total-posts').textContent = postsCount + annCount;
        });
    });
}

function renderCollegeBreakdown(stats, total) {
    const container = document.getElementById('college-breakdown');
    if (!container) return;

    // Filter out common colleges to keep it clean
    const collegeOrder = ['COS', 'COE', 'CLA', 'CAFA', 'CIE', 'CIT'];
    
    container.innerHTML = collegeOrder.map(col => {
        const count = stats[col] || 0;
        const pct = total > 0 ? (count / total * 100).toFixed(1) : 0;
        
        return `
            <div class="college-item">
                <div class="college-bar-wrap">
                    <div class="college-name">
                        <span>${col}</span>
                        <span>${count} TUPians (${pct}%)</span>
                    </div>
                    <div class="college-bar-bg">
                        <div class="college-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ════════════════════════════════════════
// VERIFICATION QUEUE
// ════════════════════════════════════════
function startVerificationSync() {
    const list = document.getElementById('pending-users-list');
    const q = query(collection(db, "users"), where("status", "==", "pending"), where("emailVerified", "==", true));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = `<div class="empty-dashboard-state"><p>Queue is clear! No pending requests.</p></div>`;
            return;
        }

        list.innerHTML = snapshot.docs.map(d => {
            const u = d.data();
            const avatar = u.photoURL || '../assets/images/anon_avatar.jpg';
            
            return `
                <div class="v-card" id="v-user-${d.id}">
                    <div class="v-info">
                        <img src="${avatar}" class="v-avatar" alt="Avatar">
                        <div class="v-details">
                            <h4>${u.fullName}</h4>
                            <p>${u.role} &bull; ${u.email}</p>
                        </div>
                    </div>
                    <div class="v-actions">
                        <button class="btn btn-secondary" onclick="rejectUser('${d.id}')">Reject</button>
                        <button class="btn btn-success" onclick="approveUser('${d.id}')">Approve</button>
                    </div>
                </div>
            `;
        }).join('');
    });
}

window.approveUser = async function(uid) {
    try {
        await updateDoc(doc(db, "users", uid), {
            status: 'approved',
            verifiedAt: serverTimestamp(),
            verifiedBy: auth.currentUser.uid
        });
        window.showToast("User approved successfully!", "success");
    } catch (err) {
        console.error(err);
        window.showToast("Failed to approve user.", "error");
    }
};

window.rejectUser = async function(uid) {
    if (!confirm("Are you sure you want to reject this request? This will permanently delete the user's data.")) return;
    
    try {
        await deleteDoc(doc(db, "users", uid));
        window.showToast("User request rejected.", "info");
    } catch (err) {
        console.error(err);
        window.showToast("Failed to reject user.", "error");
    }
};

// ════════════════════════════════════════
// MODERATION CENTER
// ════════════════════════════════════════
function startModerationSync() {
    const list = document.getElementById('reports-queue');
    const q = query(collection(db, "reports"), where("status", "==", "pending"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = `<div class="empty-dashboard-state"><p>All reports resolved. Community is safe!</p></div>`;
            return;
        }

        list.innerHTML = snapshot.docs.map(d => {
            const r = d.data();
            const time = r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleString() : 'Just now';
            
            return `
                <div class="r-card" id="report-${d.id}">
                    <div class="r-info">
                        <div class="stat-icon" style="background:rgba(107,17,17,0.1); color:var(--maroon); width:40px; height:40px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <div class="r-details">
                            <h4>Post Reported</h4>
                            <p>Target ID: ${r.postId.substring(0,8)}... &bull; Reported on: ${time}</p>
                        </div>
                    </div>
                    <div class="r-actions">
                        <button class="btn btn-secondary" onclick="viewReport('${d.id}', '${r.postId}')">View Details</button>
                    </div>
                </div>
            `;
        }).join('');
    });
}

window.viewReport = async function(reportId, postId) {
    const modal = document.getElementById('report-modal');
    const body = document.getElementById('report-details-body');
    const btnDismiss = document.getElementById('btn-dismiss-report');
    const btnDelete = document.getElementById('btn-delete-reported');
    
    body.innerHTML = `<div class="loading-shimmer"></div> Fetching post content...`;
    modal.classList.add('open');

    // Try to find the post in multiple collections
    let postSnap = await getDoc(doc(db, "posts", postId));
    let collectionName = "posts";
    
    if (!postSnap.exists()) {
        postSnap = await getDoc(doc(db, "announcements", postId));
        collectionName = "announcements";
    }

    if (postSnap.exists()) {
        const data = postSnap.data();
        body.innerHTML = `
            <div style="background:var(--cream-dk); padding:16px; border-radius:12px; margin-bottom:16px;">
                <p style="font-weight:800; font-size:13px; color:var(--muted); margin-bottom:8px;">POST CONTENT:</p>
                <p style="font-size:15px; font-weight:600;">${data.text || data.body || 'No text content.'}</p>
                ${data.imageURL ? `<img src="${data.imageURL}" style="width:100%; border-radius:8px; margin-top:12px;">` : ''}
            </div>
            <p style="font-size:13px; color:var(--muted);">Author ID: ${data.userId}</p>
        `;

        btnDismiss.onclick = () => resolveReport(reportId, 'dismiss');
        btnDelete.onclick = () => resolveReport(reportId, 'delete', postId, collectionName);
    } else {
        body.innerHTML = `<p style="color:var(--muted); font-style:italic;">Original post has already been deleted.</p>`;
        btnDismiss.onclick = () => resolveReport(reportId, 'dismiss');
        btnDelete.disabled = true;
    }
};

async function resolveReport(reportId, action, postId = null, coll = null) {
    try {
        if (action === 'delete' && postId && coll) {
            if (!confirm("Are you sure you want to permanently delete this post?")) return;
            await deleteDoc(doc(db, coll, postId));
        }

        await updateDoc(doc(db, "reports", reportId), {
            status: 'resolved',
            resolution: action,
            resolvedAt: serverTimestamp(),
            resolvedBy: auth.currentUser.uid
        });

        document.getElementById('report-modal').classList.remove('open');
        window.showToast(action === 'delete' ? "Post deleted and report resolved." : "Report dismissed.", "success");
    } catch (err) {
        console.error(err);
        window.showToast("Failed to resolve report.", "error");
    }
}

// Modal Close
document.querySelector('.close-modal').onclick = () => {
    document.getElementById('report-modal').classList.remove('open');
};
