const API = "http://127.0.0.1:8000";

// Signup
function signup() {
  fetch(API + "/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: name.value,
      email: email.value,
      password: password.value
    })
  }).then(r => r.json())
    .then(d => alert(d.message || d.detail));
}

// Login
function login() {
  fetch(API + "/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value
    })
  }).then(r => r.json())
    .then(d => {
      localStorage.setItem("token", d.access_token);
      alert("Login successful");
    });
}

// Upload
function upload() {
  const file = document.getElementById("file").files[0];
  const formData = new FormData();
  formData.append("file", file);

  fetch(API + "/upload-document", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: formData
  }).then(r => r.json())
    .then(d => alert(d.message || d.detail));
}
