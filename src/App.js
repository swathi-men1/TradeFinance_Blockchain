import { useState } from "react";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const sha256mock = () => Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const DOC_TYPES = ["LOC", "INVOICE", "BILL_OF_LADING", "PO", "COO", "INSURANCE_CERT"];
const DOC_LABELS = { LOC: "Letter of Credit", INVOICE: "Invoice", BILL_OF_LADING: "Bill of Lading", PO: "Purchase Order", COO: "Certificate of Origin", INSURANCE_CERT: "Insurance Certificate" };
const TX_STATUSES = ["pending", "in_progress", "completed", "disputed"];

const ROLE_COLOR = { bank: "#2563eb", corporate: "#16a34a", auditor: "#9333ea", admin: "#dc2626" };
const STATUS_COLOR = { pending: "#92400e", in_progress: "#1d4ed8", completed: "#166534", disputed: "#991b1b" };
const STATUS_BG = { pending: "#fef3c7", in_progress: "#dbeafe", completed: "#dcfce7", disputed: "#fee2e2" };
const ACTION_COLOR = { ISSUED: "#16a34a", AMENDED: "#d97706", SHIPPED: "#2563eb", RECEIVED: "#7c3aed", PAID: "#059669", CANCELLED: "#dc2626", VERIFIED: "#0891b2" };

// ── rule-based risk scoring ───────────────────────────────────────────────────
function computeRisk(userId, documents, ledger, transactions) {
  const userDocs = documents.filter(d => d.owner_id === userId);
  const failedDocs = userDocs.filter(d => !d.verified).length;
  const docScore = userDocs.length === 0 ? 0 : Math.round((failedDocs / userDocs.length) * 40);

  const userEntries = ledger.filter(e => e.actor_id === userId);
  const failedEntries = userEntries.filter(e => e.metadata?.result === "FAIL").length;
  const activityScore = userEntries.length === 0 ? 0 : Math.round((failedEntries / Math.max(userEntries.length, 1)) * 25);

  const userTx = transactions.filter(t => t.buyer_id === userId || t.seller_id === userId);
  const badTx = userTx.filter(t => t.status === "disputed").length;
  const txScore = userTx.length === 0 ? 0 : Math.round((badTx / Math.max(userTx.length, 1)) * 25);

  const total = docScore + activityScore + txScore;
  const category = total < 30 ? "low" : total < 60 ? "medium" : "high";
  const rationale = [
    userDocs.length ? `${failedDocs}/${userDocs.length} document(s) failed verification (+${docScore} pts).` : "No documents on record.",
    userEntries.length ? `${failedEntries} failed ledger event(s) (+${activityScore} pts).` : "No ledger activity.",
    userTx.length ? `${badTx} disputed transaction(s) (+${txScore} pts).` : "No transactions.",
  ].join(" ");
  return { score: total, category, rationale };
}

// ── reusable UI atoms ─────────────────────────────────────────────────────────
const S = {
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "20px 24px" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  select: { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit" },
};
const btnP = { background: "#1d4ed8", color: "#fff" };
const btnO = { background: "#fff", color: "#374151", border: "1px solid #d1d5db" };
const btnD = { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };

function Badge({ text, color, bg }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: color || "#374151", background: bg || "#f3f4f6", whiteSpace: "nowrap" }}>{text}</span>;
}

function EmptyState({ icon, text, subtext }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af" }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{text}</div>
      {subtext && <div style={{ fontSize: 13 }}>{subtext}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 10, width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function FormRow({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}</div>;
}

function SectionHeader({ title, count, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
        {title} {count !== undefined && <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>({count})</span>}
      </h2>
      {action}
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("corporate");
  const [org, setOrg] = useState("");

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    onLogin({ id: uid(), name: name.trim(), email: email.trim(), role, org_name: org.trim() || "—", created_at: now() });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: "#1d4ed8", borderRadius: 10, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>⬡</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Trade Finance Explorer</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Document ledger & trade tracker</p>
        </div>

        <div style={S.card}>
          <FormRow label="Full Name *">
            <input style={S.input} placeholder="e.g. Marcus Chen" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </FormRow>
          <FormRow label="Email *">
            <input style={S.input} placeholder="you@org.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </FormRow>
          <FormRow label="Role">
            <select style={S.select} value={role} onChange={e => setRole(e.target.value)}>
              <option value="bank">Bank User</option>
              <option value="corporate">Corporate User</option>
              <option value="auditor">Auditor (read-only)</option>
              <option value="admin">Admin</option>
            </select>
          </FormRow>
          <FormRow label="Organization (optional)">
            <input style={S.input} placeholder="e.g. Global Trade Bank" value={org} onChange={e => setOrg(e.target.value)} />
          </FormRow>
          <button onClick={submit} disabled={!name.trim() || !email.trim()} style={{ ...S.btn, ...btnP, width: "100%", padding: 10, fontSize: 14, opacity: (!name.trim() || !email.trim()) ? 0.5 : 1 }}>
            Sign In →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState("dashboard");
  const [users, setUsers]         = useState([]);
  const [documents, setDocuments] = useState([]);
  const [ledger, setLedger]       = useState([]);
  const [transactions, setTx]     = useState([]);
  const [toast, setToast]         = useState(null);

  const addLedger = (doc_id, action, actor_id, metadata = {}) =>
    setLedger(l => [...l, { id: uid(), document_id: doc_id, action, actor_id, metadata, created_at: now() }]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (u) => {
    setUsers(prev => prev.find(x => x.email === u.email) ? prev : [...prev, u]);
    setUser(u);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const canWrite = ["bank", "corporate", "admin"].includes(user.role);
  const isAdmin  = user.role === "admin";

  const navItems = [
    { key: "dashboard",    label: "Dashboard",     icon: "⊞" },
    { key: "documents",    label: "Documents",      icon: "⬡" },
    { key: "ledger",       label: "Ledger",         icon: "≡" },
    { key: "transactions", label: "Transactions",   icon: "⇄" },
    { key: "risk",         label: "Risk Scores",    icon: "◎" },
    { key: "analytics",    label: "Analytics",      icon: "∿" },
    ...(isAdmin ? [{ key: "users", label: "Users", icon: "⊕" }] : []),
  ];

  const sharedProps = { user, users, documents, ledger, transactions, canWrite, showToast, addLedger };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Georgia, serif", background: "#f9fafb", color: "#111827" }}>

      {/* ── sidebar ── */}
      <aside style={{ width: 196, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#1d4ed8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>⬡</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>TradeFinance</span>
        </div>

        <nav style={{ padding: "6px 0", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: tab === item.key ? "#eff6ff" : "transparent", borderLeft: tab === item.key ? "2px solid #1d4ed8" : "2px solid transparent", border: "none", cursor: "pointer", color: tab === item.key ? "#1d4ed8" : "#6b7280", fontSize: 13, textAlign: "left", fontFamily: "inherit" }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: ROLE_COLOR[user.role], textTransform: "capitalize", marginBottom: 8 }}>{user.role}</div>
          <button onClick={() => { setUser(null); setTab("dashboard"); }} style={{ ...S.btn, ...btnO, width: "100%", fontSize: 12, padding: "6px" }}>Sign out</button>
        </div>
      </aside>

      {/* ── main ── */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{tab}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{user.org_name}</div>
        </header>

        <main style={{ flex: 1, padding: "24px", overflow: "auto" }}>
          {tab === "dashboard"    && <Dashboard    {...sharedProps} setTab={setTab} />}
          {tab === "documents"    && <Documents    {...sharedProps} setDocuments={setDocuments} />}
          {tab === "ledger"       && <LedgerView   {...sharedProps} />}
          {tab === "transactions" && <Transactions {...sharedProps} setTx={setTx} />}
          {tab === "risk"         && <Risk         {...sharedProps} />}
          {tab === "analytics"    && <Analytics    {...sharedProps} />}
          {tab === "users"        && <Users        {...sharedProps} setUsers={setUsers} />}
        </main>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "10px 18px", borderRadius: 8, background: toast.type === "ok" ? "#dcfce7" : "#fee2e2", color: toast.type === "ok" ? "#166534" : "#991b1b", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 9999 }}>
          {toast.type === "ok" ? "✓" : "⚠"} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ user, users, documents, ledger, transactions, setTab }) {
  const stats = [
    { label: "Users",        value: users.length,        tab: "users",         color: "#2563eb" },
    { label: "Documents",    value: documents.length,    tab: "documents",     color: "#16a34a" },
    { label: "Ledger Entries",value: ledger.length,      tab: "ledger",        color: "#7c3aed" },
    { label: "Transactions", value: transactions.length, tab: "transactions",  color: "#d97706" },
  ];
  const recent = [...ledger].reverse().slice(0, 6);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Welcome, {user.name}</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Overview of your trade finance data.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {stats.map((st, i) => (
          <div key={i} onClick={() => setTab(st.tab)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: `3px solid ${st.color}`, borderRadius: 8, padding: "16px 20px", cursor: "pointer" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: st.color }}>{st.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Recent Ledger Activity</div>
          {recent.length === 0
            ? <EmptyState icon="≡" text="No activity yet" subtext="Upload a document to create your first ledger entry." />
            : recent.map(e => {
              const actor = users.find(u => u.id === e.actor_id);
              const doc   = documents.find(d => d.id === e.document_id);
              return (
                <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <Badge text={e.action} color="#fff" bg={ACTION_COLOR[e.action] || "#6b7280"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc?.doc_number || "—"}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{actor?.name} · {fmtDate(e.created_at)}</div>
                  </div>
                </div>
              );
            })
          }
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Transactions by Status</div>
          {transactions.length === 0
            ? <EmptyState icon="⇄" text="No transactions yet" />
            : TX_STATUSES.map(status => {
              const count = transactions.filter(t => t.status === status).length;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <Badge text={status.replace("_", " ")} color={STATUS_COLOR[status]} bg={STATUS_BG[status]} />
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{count}</span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
function Documents({ user, canWrite, users, documents, setDocuments, addLedger, showToast }) {
  const [modal, setModal]   = useState(false);
  const [verifying, setVer] = useState(null);
  const [form, setForm]     = useState({ doc_type: "INVOICE", doc_number: "", issued_at: "" });

  const upload = () => {
    if (!form.doc_number.trim()) return;
    const doc = { id: uid(), owner_id: user.id, ...form, hash: sha256mock(), file_url: `s3://docs/${form.doc_number.toLowerCase().replace(/\s/g, "-")}.pdf`, verified: true, created_at: now() };
    setDocuments(d => [...d, doc]);
    addLedger(doc.id, "ISSUED", user.id, { uploader: user.name });
    setModal(false);
    setForm({ doc_type: "INVOICE", doc_number: "", issued_at: "" });
    showToast(`${doc.doc_number} uploaded and hashed`);
  };

  const verify = (doc) => {
    setVer(doc.id);
    setTimeout(() => {
      setVer(null);
      addLedger(doc.id, "VERIFIED", user.id, { method: "SHA-256", result: doc.verified ? "PASS" : "FAIL" });
      showToast(doc.verified ? `${doc.doc_number} — hash verified ✓` : `Hash mismatch on ${doc.doc_number}`, doc.verified ? "ok" : "err");
    }, 800);
  };

  return (
    <div>
      <SectionHeader title="Documents" count={documents.length}
        action={canWrite && <button onClick={() => setModal(true)} style={{ ...S.btn, ...btnP }}>+ Upload Document</button>} />

      {documents.length === 0
        ? <div style={S.card}><EmptyState icon="⬡" text="No documents yet" subtext={canWrite ? 'Click "Upload Document" to add your first.' : "Documents will appear here."} /></div>
        : (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Doc Number", "Type", "Owner", "Issued", "SHA-256 Hash", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const owner = users.find(u => u.id === doc.owner_id);
                  return (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 13 }}>{doc.doc_number}</td>
                      <td style={{ padding: "12px 14px" }}><Badge text={doc.doc_type} /></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{owner?.name || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{doc.issued_at ? fmtDate(doc.issued_at) : "—"}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{doc.hash.slice(0, 18)}…</td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge text={doc.verified ? "Verified" : "Unverified"} color={doc.verified ? "#166534" : "#991b1b"} bg={doc.verified ? "#dcfce7" : "#fee2e2"} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => verify(doc)} style={{ ...S.btn, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: 12, padding: "4px 10px" }}>
                          {verifying === doc.id ? "Checking…" : "Verify Hash"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {modal && (
        <Modal title="Upload Document" onClose={() => setModal(false)}>
          <FormRow label="Document Type">
            <select style={S.select} value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
            </select>
          </FormRow>
          <FormRow label="Document Number *">
            <input style={S.input} placeholder="e.g. INV-2024-0001" value={form.doc_number} onChange={e => setForm(f => ({ ...f, doc_number: e.target.value }))} />
          </FormRow>
          <FormRow label="Issue Date">
            <input type="date" style={S.input} value={form.issued_at} onChange={e => setForm(f => ({ ...f, issued_at: e.target.value }))} />
          </FormRow>
          <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 6, padding: 14, textAlign: "center", marginBottom: 16, color: "#9ca3af", fontSize: 13 }}>
            📄 File upload simulated — SHA-256 hash auto-generated on submit
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={upload} disabled={!form.doc_number.trim()} style={{ ...S.btn, ...btnP, flex: 1, opacity: !form.doc_number.trim() ? 0.5 : 1 }}>Upload & Hash</button>
            <button onClick={() => setModal(false)} style={{ ...S.btn, ...btnO }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── LEDGER ────────────────────────────────────────────────────────────────────
function LedgerView({ users, documents, ledger }) {
  const [filter, setFilter] = useState("all");
  const sorted = [...(filter === "all" ? ledger : ledger.filter(e => e.document_id === filter))].reverse();

  return (
    <div>
      <SectionHeader title="Ledger" count={sorted.length}
        action={
          <select style={{ ...S.select, width: 220 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Documents</option>
            {documents.map(d => <option key={d.id} value={d.id}>{d.doc_number}</option>)}
          </select>
        }
      />

      {sorted.length === 0
        ? <div style={S.card}><EmptyState icon="≡" text="No ledger entries yet" subtext="Entries auto-create when documents are uploaded, verified, or transactions update." /></div>
        : (
          <div style={{ position: "relative", paddingLeft: 32 }}>
            <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#e5e7eb" }} />
            {sorted.map(e => {
              const actor = users.find(u => u.id === e.actor_id);
              const doc   = documents.find(d => d.id === e.document_id);
              const ac    = ACTION_COLOR[e.action] || "#6b7280";
              return (
                <div key={e.id} style={{ position: "relative", marginBottom: 14 }}>
                  <div style={{ position: "absolute", left: -28, top: 14, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: `2px solid ${ac}` }} />
                  <div style={{ ...S.card, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Badge text={e.action} color="#fff" bg={ac} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{doc?.doc_number || "—"}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDate(e.created_at)} {fmtTime(e.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: Object.keys(e.metadata).length ? 8 : 0 }}>
                      By <strong>{actor?.name || "System"}</strong> · {actor?.role}
                    </div>
                    {Object.keys(e.metadata).length > 0 && (
                      <div style={{ background: "#f9fafb", borderRadius: 4, padding: "6px 10px", fontSize: 12, color: "#6b7280", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                        {Object.entries(e.metadata).map(([k, v]) => <span key={k}><strong>{k}:</strong> {String(v)}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
function Transactions({ user, canWrite, users, documents, transactions, setTx, addLedger, showToast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ buyer_id: "", seller_id: "", amount: "", currency: "USD", doc_id: "" });

  const create = () => {
    if (!form.buyer_id || !form.seller_id || !form.amount) return;
    const tx = { id: uid(), ...form, amount: parseFloat(form.amount), status: "pending", created_at: now(), updated_at: now() };
    setTx(t => [...t, tx]);
    if (form.doc_id) addLedger(form.doc_id, "ISSUED", user.id, { linked_transaction: tx.id });
    setModal(false);
    setForm({ buyer_id: "", seller_id: "", amount: "", currency: "USD", doc_id: "" });
    showToast("Transaction created");
  };

  const updateStatus = (id, status) => {
    setTx(ts => ts.map(t => t.id === id ? { ...t, status, updated_at: now() } : t));
    const tx = transactions.find(t => t.id === id);
    if (tx?.doc_id) {
      const actionMap = { completed: "PAID", in_progress: "SHIPPED", disputed: "AMENDED" };
      addLedger(tx.doc_id, actionMap[status] || "AMENDED", user.id, { status_changed_to: status });
    }
    showToast(`Status updated to "${status}"`);
  };

  const canChange = (status) => status !== "completed";

  return (
    <div>
      <SectionHeader title="Transactions" count={transactions.length}
        action={canWrite && <button onClick={() => setModal(true)} style={{ ...S.btn, ...btnP }}>+ New Transaction</button>} />

      {transactions.length === 0
        ? <div style={S.card}><EmptyState icon="⇄" text="No transactions yet" subtext={canWrite ? 'Click "New Transaction" to create one.' : "Transactions will appear here."} /></div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...transactions].reverse().map(tx => {
              const buyer  = users.find(u => u.id === tx.buyer_id);
              const seller = users.find(u => u.id === tx.seller_id);
              return (
                <div key={tx.id} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{tx.currency} {Number(tx.amount).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Created {fmtDate(tx.created_at)}</div>
                    </div>
                    <Badge text={tx.status.replace("_", " ")} color={STATUS_COLOR[tx.status]} bg={STATUS_BG[tx.status]} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: canWrite && canChange(tx.status) ? 12 : 0 }}>
                    {[["Buyer", buyer], ["Seller", seller]].map(([role, u]) => (
                      <div key={role} style={{ background: "#f9fafb", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{role}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u?.name || "—"}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{u?.org_name}</div>
                      </div>
                    ))}
                  </div>

                  {canWrite && canChange(tx.status) && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>Move to:</span>
                      {TX_STATUSES.filter(st => st !== tx.status && st !== "pending").map(st => (
                        <button key={st} onClick={() => updateStatus(tx.id, st)}
                          style={{ ...S.btn, background: STATUS_BG[st], color: STATUS_COLOR[st], border: `1px solid ${STATUS_COLOR[st]}`, fontSize: 11, padding: "4px 10px" }}>
                          {st.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }

      {modal && (
        <Modal title="New Transaction" onClose={() => setModal(false)}>
          <FormRow label="Buyer *">
            <select style={S.select} value={form.buyer_id} onChange={e => setForm(f => ({ ...f, buyer_id: e.target.value }))}>
              <option value="">Select buyer…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.org_name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Seller *">
            <select style={S.select} value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}>
              <option value="">Select seller…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.org_name}</option>)}
            </select>
          </FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <FormRow label="Amount *">
              <input type="number" style={S.input} placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </FormRow>
            <FormRow label="Currency">
              <select style={S.select} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {["USD", "EUR", "GBP", "INR", "NGN"].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Linked Document (optional)">
            <select style={S.select} value={form.doc_id} onChange={e => setForm(f => ({ ...f, doc_id: e.target.value }))}>
              <option value="">None</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.doc_number} ({d.doc_type})</option>)}
            </select>
          </FormRow>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={create} disabled={!form.buyer_id || !form.seller_id || !form.amount}
              style={{ ...S.btn, ...btnP, flex: 1, opacity: (!form.buyer_id || !form.seller_id || !form.amount) ? 0.5 : 1 }}>
              Create Transaction
            </button>
            <button onClick={() => setModal(false)} style={{ ...S.btn, ...btnO }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── RISK ──────────────────────────────────────────────────────────────────────
function Risk({ users, documents, ledger, transactions }) {
  const corpUsers = users.filter(u => u.role === "corporate");
  const CAT_COLOR = { low: "#166534", medium: "#92400e", high: "#991b1b" };
  const CAT_BG    = { low: "#dcfce7", medium: "#fef3c7", high: "#fee2e2" };
  const CAT_BORDER= { low: "#16a34a", medium: "#d97706", high: "#dc2626" };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Risk Scores</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Automatically calculated for Corporate Users. Weights: Doc Integrity 40% · User Activity 25% · Transaction Behavior 25% · External 10%.
        </p>
      </div>

      {corpUsers.length === 0
        ? <div style={S.card}><EmptyState icon="◎" text="No corporate users yet" subtext="Add corporate users first. Risk scores are calculated automatically." /></div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {corpUsers.map(u => {
              const { score, category, rationale } = computeRisk(u.id, documents, ledger, transactions);
              return (
                <div key={u.id} style={{ ...S.card, borderLeft: `4px solid ${CAT_BORDER[category]}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{u.org_name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: CAT_COLOR[category] }}>{score}</div>
                      <Badge text={category.toUpperCase()} color={CAT_COLOR[category]} bg={CAT_BG[category]} />
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, marginBottom: 10 }}>
                    <div style={{ height: "100%", width: `${score}%`, background: CAT_BORDER[category], borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{rationale}</div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function Analytics({ documents, transactions, ledger }) {
  const totalValue  = transactions.reduce((a, b) => a + Number(b.amount), 0);
  const verifiedPct = documents.length ? Math.round((documents.filter(d => d.verified).length / documents.length) * 100) : 0;

  const Bar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#374151" }}>{label}</span>
        <span style={{ color: "#6b7280", fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4 }}>
        <div style={{ height: "100%", width: max ? `${(value / max) * 100}%` : "0%", background: color || "#1d4ed8", borderRadius: 4 }} />
      </div>
    </div>
  );

  const byStatus  = TX_STATUSES.map(st => ({ label: st.replace("_", " "), value: transactions.filter(t => t.status === st).length, color: STATUS_COLOR[st] }));
  const byDocType = DOC_TYPES.map(t => ({ label: t, value: documents.filter(d => d.doc_type === t).length })).filter(x => x.value > 0);
  const actions   = [...new Set(ledger.map(e => e.action))].map(a => ({ label: a, value: ledger.filter(e => e.action === a).length, color: ACTION_COLOR[a] }));

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Analytics</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Trade Volume", value: totalValue ? `$${(totalValue / 1000).toFixed(1)}K` : "—", color: "#1d4ed8" },
          { label: "Verified Documents", value: `${verifiedPct}%`, color: "#16a34a" },
          { label: "Ledger Entries", value: ledger.length, color: "#7c3aed" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: "16px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Transactions by Status</div>
          {transactions.length === 0 ? <EmptyState icon="⇄" text="No data" /> : byStatus.map((x, i) => <Bar key={i} label={x.label} value={x.value} max={transactions.length} color={x.color} />)}
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Documents by Type</div>
          {documents.length === 0 ? <EmptyState icon="⬡" text="No data" /> : byDocType.map((x, i) => <Bar key={i} label={x.label} value={x.value} max={documents.length} />)}
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ledger Events</div>
          {ledger.length === 0 ? <EmptyState icon="≡" text="No data" /> : actions.map((x, i) => <Bar key={i} label={x.label} value={x.value} max={ledger.length} color={x.color} />)}
        </div>
      </div>
    </div>
  );
}

// ── USERS (ADMIN) ─────────────────────────────────────────────────────────────
function Users({ users, setUsers, showToast }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ name: "", email: "", role: "corporate", org_name: "" });

  const create = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setUsers(u => [...u, { ...form, id: uid(), created_at: now() }]);
    setModal(false);
    setForm({ name: "", email: "", role: "corporate", org_name: "" });
    showToast(`User ${form.name} created`);
  };

  const remove = (id) => { setUsers(u => u.filter(x => x.id !== id)); showToast("User removed"); };

  return (
    <div>
      <SectionHeader title="Users" count={users.length}
        action={<button onClick={() => setModal(true)} style={{ ...S.btn, ...btnP }}>+ Create User</button>} />

      {users.length === 0
        ? <div style={S.card}><EmptyState icon="⊕" text="No users yet" subtext='Click "Create User" to add the first user.' /></div>
        : (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Name", "Email", "Role", "Organization", "Joined", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                    <td style={{ padding: "12px 14px" }}><Badge text={u.role} color="#fff" bg={ROLE_COLOR[u.role]} /></td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{u.org_name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>{fmtDate(u.created_at)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => remove(u.id)} style={{ ...S.btn, ...btnD, fontSize: 12, padding: "4px 10px" }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {modal && (
        <Modal title="Create User" onClose={() => setModal(false)}>
          <FormRow label="Full Name *"><input style={S.input} placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormRow>
          <FormRow label="Email *"><input style={S.input} placeholder="jane@org.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormRow>
          <FormRow label="Role">
            <select style={S.select} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="bank">Bank User</option>
              <option value="corporate">Corporate User</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </FormRow>
          <FormRow label="Organization"><input style={S.input} placeholder="Org name" value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} /></FormRow>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={create} disabled={!form.name.trim() || !form.email.trim()}
              style={{ ...S.btn, ...btnP, flex: 1, opacity: (!form.name.trim() || !form.email.trim()) ? 0.5 : 1 }}>
              Create User
            </button>
            <button onClick={() => setModal(false)} style={{ ...S.btn, ...btnO }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
