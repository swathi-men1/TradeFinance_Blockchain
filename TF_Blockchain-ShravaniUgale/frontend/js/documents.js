const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

let currentUserRole = "";

// Get current user role
fetch("http://127.0.0.1:8000/protected/me", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
.then(res => res.json())
.then(user => {
  currentUserRole = user.role;

  // Hide upload section for admin
  if (currentUserRole === "admin") {
    document.getElementById("uploadSection").style.display = "none";
  }

  loadDocuments();
});

// Load documents
function loadDocuments() {
  fetch("http://127.0.0.1:8000/documents", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    const table = document.getElementById("docTable");
    table.innerHTML = "";

    data.forEach(doc => {
      let actionCell = "-";

      if (currentUserRole === "admin") {
        actionCell = `
          <select class="form-select form-select-sm"
                  onchange="updateStatus(${doc.id}, this.value)">
            <option ${doc.status === "Uploaded" ? "selected" : ""}>Uploaded</option>
            <option ${doc.status === "Reviewed" ? "selected" : ""}>Reviewed</option>
            <option ${doc.status === "Approved" ? "selected" : ""}>Approved</option>
          </select>
        `;
      }

      table.innerHTML += `
        <tr>
          <td>${doc.title}</td>
          <td>${doc.doc_type}</td>
          <td>${doc.status}</td>
          <td>${doc.org_name}</td>
          <td>${actionCell}</td>
        </tr>
      `;
    });
  });
}

// Update status (admin only)
function updateStatus(docId, newStatus) {
  fetch(`http://127.0.0.1:8000/documents/${docId}/status?status=${newStatus}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(() => loadDocuments());
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
});
