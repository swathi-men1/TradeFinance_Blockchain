async function loadDashboardData() {
    const API_BASE = (window.location.hostname && window.location.hostname !== 'null' && window.location.hostname !== '0.0.0.0')
        ? `http://${window.location.hostname}:8001`
        : 'http://127.0.0.1:8001';

    const res = await fetch(
        `${API_BASE}/analytics/dashboard`,
        { credentials: "include" }
    );

    if (!res.ok) return;

    const data = await res.json();

    if (data.role === "corporate") {
        document.getElementById("corporateBox").innerHTML =
            `Corporate: Documents uploaded = ${data.total_documents}`;
    }

    if (data.role === "auditor") {
        document.getElementById("auditorBox").innerHTML =
            `Auditor: Verified today = ${data.verified_today}`;
    }

    if (data.role === "admin") {
        document.getElementById("adminBox").innerHTML =
            `Admin: Total docs = ${data.total_documents}, Verified = ${data.verified_documents}`;
    }
}

loadDashboardData();
