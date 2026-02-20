async function loginUser() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Login failed");
            return;
        }

        // ✅ CLEAR OLD DATA
        localStorage.clear();

        // ✅ STORE LOGIN DETAILS
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);

        console.log("Saved username:", data.username);
        console.log("Saved role:", data.role);

        // 🔁 ROLE BASED REDIRECT
        if (data.role === "bank") {
            window.location.href = "index.html";
        } else if (data.role === "corporate") {
            window.location.href = "upload_document.html";
        } else if (data.role === "auditor") {
            window.location.href = "ledger.html";
        } else if (data.role === "admin") {
            window.location.href = "admin.html";
        } else if (data.role === "pending") {
            alert("Your account is pending admin approval");
        } else {
            alert("Unknown role. Contact admin.");
        }

    } catch (error) {
        console.error(error);
        alert("Backend not reachable");
    }
}