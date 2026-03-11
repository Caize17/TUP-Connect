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