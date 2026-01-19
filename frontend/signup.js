const form = document.getElementById("signupForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://127.0.0.1:8000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      message.style.color = "green";
      message.innerText = "Signup successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      message.style.color = "red";
      message.innerText = data.detail || "Signup failed";
    }

  } catch (error) {
    message.style.color = "red";
    message.innerText = "Server error. Please try again.";
  }
});
