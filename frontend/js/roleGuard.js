function requireRole(allowedRoles) {
    const API_BASE = (window.location.port === "8001")
        ? ""
        : (window.location.hostname && window.location.hostname !== 'null')
            ? `http://${window.location.hostname}:8001`
            : 'http://127.0.0.1:8001';
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        redirectToLogin();
        return;
    }

    // Optional: Sync check with backend to ensure session hasn't expired
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
        .then(res => {
            if (res.status === 401) {
                localStorage.removeItem('user');
                redirectToLogin();
            }
        });

    // ❌ Role not allowed
    if (!allowedRoles.includes(user.role)) {
        alert("Access denied. You do not have permission to view this page.");
        window.location.replace("dashboard.html");
        return;
    }

    // ✅ Hide all UI first
    hideAll();

    // ✅ Show role-based UI
    if (user.role === "corporate") showCorporate();
    if (user.role === "auditor") showAuditor();
    if (user.role === "admin") showAdmin();
}

/* ---------------------------------- */
/* HELPERS                            */
/* ---------------------------------- */

function redirectToLogin() {
    window.location.replace("login.html");
}

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

/* ---------------------------------- */
/* ROLE UI                            */
/* ---------------------------------- */

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

/* ---------------------------------- */
/* SAFE DOM ACCESS                    */
/* ---------------------------------- */

function safeShow(id, displayType) {
    const el = document.getElementById(id);
    if (el) el.style.display = displayType;
}
