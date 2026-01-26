document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const org_name = document.getElementById("org_name").value.trim();

  fetch("http://127.0.0.1:8000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
      role: role,
      org_name: org_name
    })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Registration failed");
      }
      return res.json();
    })
    .then(() => {
      alert("Registration successful. Please login.");
      window.location.href = "login.html";
    })
    .catch(() => {
      alert("Registration failed. Email may already exist.");
    });
});
