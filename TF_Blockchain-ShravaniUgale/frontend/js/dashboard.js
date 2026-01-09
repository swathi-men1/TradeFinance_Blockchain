const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

// Load user info
fetch("http://127.0.0.1:8000/protected/me", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
.then(res => res.json())
.then(user => {
  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("userRole").innerText = user.role;
  document.getElementById("userOrg").innerText = user.org_name;
});

// Upload document
document.getElementById("docForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("docTitle").value;
  const type = document.getElementById("docType").value;

  fetch("http://127.0.0.1:8000/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: title,
      doc_type: type
    })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("docForm").reset();
    loadDocuments();
  });
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
      table.innerHTML += `
        <tr>
          <td>${doc.title}</td>
          <td>${doc.doc_type}</td>
          <td>${doc.status}</td>
          <td>${doc.org_name}</td>
        </tr>
      `;
    });
  });
}

loadDocuments();

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
});
