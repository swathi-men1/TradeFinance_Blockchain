async function loginUser() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Login failed");
            return;
        }

        // ✅ LOGIN SUCCESS → ACTIVE USER UPDATED IN DB
        alert("Login successful");
        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        alert("Backend not reachable");
    }
}
