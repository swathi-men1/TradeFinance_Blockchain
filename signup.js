function validateSignup() {
    const username = document.getElementById("su_username").value.trim();
    const password = document.getElementById("su_password").value;
    const confirm = document.getElementById("su_confirm").value;

    let valid = true;

    if (username.length < 3) {
        document.getElementById("su_userError").innerText =
            "Username must be at least 3 characters";
        valid = false;
    } else {
        document.getElementById("su_userError").innerText = "";
    }

    if (password.length < 3) {
        document.getElementById("su_passError").innerText =
            "Password must be at least 3 characters";
        valid = false;
    } else {
        document.getElementById("su_passError").innerText = "";
    }

    if (password !== confirm) {
        document.getElementById("su_confirmError").innerText =
            "Passwords do not match";
        valid = false;
    } else {
        document.getElementById("su_confirmError").innerText = "";
    }

    document.getElementById("signupBtn").disabled = !valid;
}

// ---------------- SIGNUP API CALL ----------------
async function signupSuccess() {
    const username = document.getElementById("su_username").value.trim();
    const password = document.getElementById("su_password").value.trim();

    if (!username || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                password: password,
                role: "pending"   // 🔐 ADMIN WILL ASSIGN LATER
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail);
            return;
        }

        alert("Signup successful. Wait for admin role approval.");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Server not reachable");
    }
}