async function loadLedger() {
    const API_BASE = (window.location.hostname && window.location.hostname !== 'null' && window.location.hostname !== '0.0.0.0')
        ? `http://${window.location.hostname}:8001`
        : 'http://127.0.0.1:8001';
    const body = document.getElementById("ledgerBody");
    if (!body) return;

    try {
        const res = await fetch(`${API_BASE}/ledger/`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch ledger");

        const entries = await res.json();
        body.innerHTML = "";

        if (entries.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No audit logs found.</td></tr>';
            return;
        }

        entries.forEach(e => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${e.document_id || 'N/A'}</td>
                <td>${e.action || 'N/A'}</td>
                <td>${(e.role || 'User').toUpperCase()}</td>
                <td>${e.performed_by || 'N/A'}</td>
                <td>${new Date(e.timestamp).toLocaleString()}</td>
            `;
            body.appendChild(row);
        });
    } catch (err) {
        console.error(err);
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #ef4444;">Error connecting to the blockchain ledger.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', loadLedger);
