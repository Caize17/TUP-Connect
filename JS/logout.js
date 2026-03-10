import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const logoutBtn = document.getElementById('btn-logout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("User signed out.");
            window.location.href = 'index.html'; 
        }).catch((error) => {
            alert("Error logging out: " + error.message);
        });
    });
} else {
    console.error("Could not find button with ID: btn-logout");
}