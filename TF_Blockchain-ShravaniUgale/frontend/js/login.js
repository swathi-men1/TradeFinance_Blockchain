const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      throw new Error("Invalid login credentials");
    }

    const data = await response.json();

    // Store token
    localStorage.setItem("access_token", data.access_token);

    // Decode token payload (basic)
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));

    // Redirect based on role (future-proof)
    if (payload.sub) {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    alert("Login failed. Please check your credentials.");
  }
});
