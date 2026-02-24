// --- SHA-256 Generation Helper (Consistent with other files) ---
async function generateHash(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Ledger Logic (Handled by Backend) ---

// -----------------------------------------
// UPLOAD DOCUMENT
// -----------------------------------------
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
    uploadForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem('user'));
        const docName = document.getElementById("documentName")?.value || "Document";
        const docType = document.getElementById("documentType").value;
        const fileInput = document.getElementById("file");

        if (!fileInput.files.length) {
            alert("Please select a file");
            return;
        }

        const timestamp = new Date().toISOString();
        const hash = await generateHash(docName + timestamp);
        const docId = 'DOC-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const newDoc = {
            id: docId,
            name: docName,
            type: docType,
            status: 'Verified', // In this standalone demo, we mark as verified on upload
            hash: hash,
            uploadedAt: timestamp,
            owner: user?.email || 'guest',
            url: '#'
        };

        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        documents.push(newDoc);
        localStorage.setItem('documents', JSON.stringify(documents));

        // Create audit trail
        addToLedger(docId, "UPLOAD");

        const resultEl = document.getElementById("result");
        if (resultEl) {
            resultEl.innerText = "Uploaded successfully and secured with SHA-256.";
            resultEl.style.color = "var(--accent)";
        }

        alert("Document uploaded successfully! ID: " + docId);
        window.location.href = "dashboard.html";
    });
}

const API_BASE = (window.location.port === "8001")
    ? ""
    : (window.location.hostname && window.location.hostname !== 'null')
        ? `http://${window.location.hostname}:8001`
        : 'http://127.0.0.1:8001';

// -----------------------------------------
// VERIFY DOCUMENT
// -----------------------------------------
const verifyForm = document.getElementById("verifyForm");
if (verifyForm) {
    verifyForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const docId = document.getElementById("docId").value.trim();
        const resultEl = document.getElementById("result");
        resultEl.innerHTML = '<p style="color: var(--text-secondary);">Verifying with blockchain ledger...</p>';

        try {
            // Banks can see all, others can see their own. 
            // We fetch from the /all if available, or just search by ID if a verify endpoint exists.
            const res = await fetch(`${API_BASE}/documents/all`, { credentials: 'include' });

            if (res.status === 401) {
                alert("Session expired. Please log in again.");
                window.location.href = "login.html";
                return;
            }

            const documents = await res.json();
            const doc = documents.find(d => d.document_id === docId || d.id === docId || d.sha256_hash === docId);

            if (doc) {
                const statusClass = `status-${doc.status.toLowerCase()}`;
                resultEl.innerHTML = `
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid var(--accent); padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem;">
                        <h3 style="color: var(--accent); margin-top: 0;">✅ Valid Ledger Entry Found</h3>
                        <p><strong>ID:</strong> ${doc.document_id}</p>
                        <p><strong>Type:</strong> ${doc.document_type}</p>
                        <p><strong>Status:</strong> <span class="status-pill ${statusClass}">${doc.status}</span></p>
                        <p><strong>Hash:</strong> <span style="font-family: monospace; font-size: 0.8rem;">${doc.sha256_hash}</span></p>
                    </div>
                `;
            } else {
                resultEl.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem;">
                        <h3 style="color: #ef4444; margin-top: 0;">❌ Not Found</h3>
                        <p>No document with this ID or Hash exists in the immutable ledger.</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
            resultEl.innerHTML = '<p style="color: #ef4444;">Connection error while accessing the blockchain.</p>';
        }
    });
}

// -----------------------------------------
// LOAD DOCUMENTS (Corporate)
// -----------------------------------------
async function loadMyDocuments() {
    const table = document.getElementById("docsTable");
    if (!table) return;

    try {
        const res = await fetch(`${API_BASE}/documents/my-documents`, { credentials: 'include' });

        if (res.status === 401) {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        const docs = await res.json();
        table.innerHTML = "";

        if (docs.length === 0) {
            table.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No documents found.</td></tr>';
            return;
        }

        docs.forEach(doc => {
            const row = document.createElement("tr");
            const statusClass = `status-${doc.status.toLowerCase()}`;
            row.innerHTML = `
                <td>${doc.document_id}</td>
                <td>${doc.document_type}</td>
                <td><span class="status-pill ${statusClass}">${doc.status}</span></td>
                <td><button class="action-btn" onclick="alert('Viewing document: ${doc.document_id}')">View</button></td>
            `;
            table.appendChild(row);
        });
    } catch (err) {
        console.error(err);
        table.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: #ef4444;">Connection error while accessing the blockchain.</td></tr>';
    }
}
