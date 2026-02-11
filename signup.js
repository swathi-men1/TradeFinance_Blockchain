function validateSignup() {
    const username = document.getElementById("su_username").value.trim();
    const password = document.getElementById("su_password").value;
    const confirm = document.getElementById("su_confirm").value;

    let valid = true;

    // Username validation
    if (username.length < 3) {
        document.getElementById("su_userError").innerText =
            "Username must be at least 3 characters";
        valid = false;
    } else {
        document.getElementById("su_userError").innerText = "";
    }

    // Password validation
    if (password.length < 3) {
        document.getElementById("su_passError").innerText =
            "Password must be at least 3 characters";
        valid = false;
    } else {
        document.getElementById("su_passError").innerText = "";
    }

    // Confirm password
    if (password !== confirm) {
        document.getElementById("su_confirmError").innerText =
            "Passwords do not match";
        valid = false;
    } else {
        document.getElementById("su_confirmError").innerText = "";
    }

    // Enable / disable button
    document.getElementById("signupBtn").disabled = !valid;
}

// ---------------- SIGNUP API CALL ----------------
async function signupSuccess() {
    const username = document.getElementById("su_username").value.trim();
    const password = document.getElementById("su_password").value;

    try {
        const res = await fetch("http://127.0.0.1:8000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.detail || "Signup failed");
            return;
        }

        document.getElementById("successMsg").innerText =
            "Signup successful! Redirecting to login...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (err) {
        alert("Backend not reachable. Start FastAPI server.");
        console.error(err);
    }
}
