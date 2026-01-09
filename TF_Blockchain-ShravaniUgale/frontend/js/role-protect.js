const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "login.html";
}

const payload = JSON.parse(atob(token.split(".")[1]));

const page = window.location.pathname;

if (page.includes("admin") && payload.role !== "admin") {
  alert("Access denied");
  window.location.href = "login.html";
}

if (page.includes("bank") && payload.role !== "bank") {
  alert("Access denied");
  window.location.href = "login.html";
}
