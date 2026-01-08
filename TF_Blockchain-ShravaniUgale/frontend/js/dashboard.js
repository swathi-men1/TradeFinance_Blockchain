// Get token
const token = localStorage.getItem("access_token");

// If no token, redirect to login
if (!token) {
  window.location.href = "login.html";
}

// Fetch user details
fetch("http://127.0.0.1:8000/protected/me", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error("Unauthorized");
  }
  return response.json();
})
.then(data => {
  document.getElementById("userEmail").innerText = data.email;
  document.getElementById("userRole").innerText = data.role;
  document.getElementById("userOrg").innerText = data.org_name;
})
.catch(() => {
  // Invalid token
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
});
