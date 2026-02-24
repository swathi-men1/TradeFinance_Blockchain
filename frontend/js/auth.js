/* ==================================================
   GLOBAL FLAGS (VERY IMPORTANT)
================================================== */
const API_BASE = (window.location.port === "8001")
    ? ""
    : (window.location.hostname && window.location.hostname !== 'null')
        ? `http://${window.location.hostname}:8001`
        : 'http://127.0.0.1:8001';

// 🚨 PROTOCOL CHECK (Crucial for Sessions)
if (window.location.protocol === 'file:') {
    console.error("CORS WARNING: You are running this file via 'file://'. Login sessions will NOT work. Please use VS Code 'Live Server'!");
    alert("CRITICAL: You are opening this file directly. Please use VS Code 'Live Server' OR (Recommended) navigate to http://127.0.0.1:8001/index.html.");
}

// 🚨 PORT CHECK
if (window.location.port !== "" && window.location.port !== "8001") {
    console.warn("PORT WARNING: You are on port " + window.location.port + ". Sessions might fail. For best results, use http://127.0.0.1:8001/index.html");
}

let roleChecked = false;
let redirected = false;

/* ==================================================
   ROLE GUARD (RUNS ONLY ONCE)
================================================== */
async function requireRole(allowedRoles) {
    // 🚫 prevent multiple executions (MAIN FIX)
    if (roleChecked) return;
    roleChecked = true;

    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            credentials: "include"
        });

        const user = await res.json();

        // ❌ Not logged in (Silent check)
        if (!user.authenticated) {
            redirectToLoginOnce();
            return;
        }

        const role = user.role.toLowerCase(); // normalize

        // ❌ Role not allowed
        if (!allowedRoles.includes(role)) {
            alert("Access denied");
            redirectToLoginOnce();
            return;
        }

        // ✅ Hide all UI ONCE
        hideAll();

        // ✅ Show role-based UI
        if (role === "corporate") showCorporate();
        if (role === "auditor") showAuditor();
        if (role === "admin") showAdmin();

        console.log("Role verified:", role);

    } catch (err) {
        console.error("Role guard error:", err);
        redirectToLoginOnce();
    }
}

/* ==================================================
   REDIRECT (SAFE – NO LOOP)
================================================== */
function redirectToLoginOnce() {
    if (redirected) return;
    redirected = true;
    window.location.replace("login.html");
}

/* ==================================================
   HIDE ALL UI
================================================== */
function hideAll() {
    const ids = [
        "uploadLink",
        "verifyLink",
        "ledgerLink",
        "analyticsLink",
        "corporateBox",
        "auditorBox",
        "adminBox"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

/* ==================================================
   ROLE UI
================================================== */
function showCorporate() {
    safeShow("uploadLink", "inline");
    safeShow("corporateBox", "block");
}

function showAuditor() {
    safeShow("verifyLink", "inline");
    safeShow("ledgerLink", "inline");
    safeShow("auditorBox", "block");
}

function showAdmin() {
    safeShow("uploadLink", "inline");
    safeShow("verifyLink", "inline");
    safeShow("ledgerLink", "inline");
    safeShow("analyticsLink", "inline");
    safeShow("adminBox", "block");
}

/* ==================================================
   SAFE DOM ACCESS
================================================== */
function safeShow(id, displayType) {
    const el = document.getElementById(id);
    if (el) el.style.display = displayType;
}

/* ==================================================
   SIGNUP
================================================== */
async function signup() {
    const data = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value.trim(),
        role: document.getElementById("role").value,
        organization: document.getElementById("organization").value.trim()
    };

    for (let key in data) {
        if (!data[key]) {
            alert("Please fill all fields");
            return;
        }
    }

    try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.detail || "Signup failed");
            return;
        }

        alert("Signup successful! Please login.");
        window.location.replace("login.html");

    } catch (err) {
        console.error(err);
        alert("Server error during signup");
    }
}

/* ==================================================
   LOGIN
================================================== */
async function login() {
    const data = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value.trim()
    };

    if (!data.email || !data.password) {
        alert("Enter email and password");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.detail || "Login failed");
            return;
        }

        // ✅ Fetch real user data to sync localStorage
        const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        const userData = await meRes.json();

        if (meRes.ok && userData.authenticated) {
            localStorage.setItem('user', JSON.stringify(userData));
            window.location.replace("dashboard.html");
        } else {
            console.error("Session failed. API_BASE:", API_BASE, "userData:", userData);
            alert("Session initialization failed. \n\nIMPORTANT: If you are using port 5500 (Live Server), please switch to port 8001 (http://127.0.0.1:8001/index.html) to ensure cookies work correctly.");
        }

    } catch (err) {
        console.error(err);
        alert("Server error during login");
    }
}

/* ==================================================
   LOGOUT
================================================== */
async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (err) {
        console.error(err);
    }

    window.location.replace("login.html");
}

/* ==================================================
   CURRENT USER (OPTIONAL)
================================================== */
async function getCurrentUser() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            credentials: "include"
        });

        if (!res.ok) return null;
        const user = await res.json();
        return user.authenticated ? user : null;
    } catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}
