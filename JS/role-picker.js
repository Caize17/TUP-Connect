let selectedRole = null;

function selectRole(role) {
  ['student', 'org', 'admin'].forEach(r => {
    document.getElementById(`role-${r}`).classList.remove('selected');
  });
  selectedRole = role;
  document.getElementById(`role-${role}`).classList.add('selected');
  document.getElementById('btn-continue').disabled = false;
}

function handleContinue() {
  if (!selectedRole) return;
  if (selectedRole === 'student') {
    window.location.href = 'homepage.html';
  } else if (selectedRole === 'org') {
    window.location.href = 'homepage.html';
  } else if (selectedRole === 'admin') {
    window.location.href = 'homepage.html';
  }
}