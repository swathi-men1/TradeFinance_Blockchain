async function loadAdminDashboard() {
    try {
        // 🔹 Analytics
        const analyticsRes = await fetch("http://127.0.0.1:8000/analytics");
        const analytics = await analyticsRes.json();

        document.getElementById("activeUsers").innerText =
            analytics.active_users;
        document.getElementById("tamperCount").innerText =
            analytics.tamper_attempts;

        // 🔹 All Users
        const usersRes = await fetch("http://127.0.0.1:8000/all-users");
        const users = await usersRes.json();

        const usersBody = document.querySelector("#usersTable tbody");
        usersBody.innerHTML = "";

        users.forEach(u => {
            const row = usersBody.insertRow();
            row.insertCell().innerText = u.username;
            row.insertCell().innerText = u.role;
        });

        // 🔹 Pending Users
        const pendingRes = await fetch("http://127.0.0.1:8000/admin/pending-users");
        const pendingUsers = await pendingRes.json();

        const pendingBody = document.querySelector("#pendingUsersTable tbody");
        pendingBody.innerHTML = "";

        if (!pendingUsers.length) {
            pendingBody.innerHTML =
                `<tr><td colspan="3" style="text-align:center;">No pending users</td></tr>`;
            return;
        }

        pendingUsers.forEach(u => {
            const row = pendingBody.insertRow();

            row.insertCell().innerText = u.username;

            const roleCell = row.insertCell();
            roleCell.innerHTML = `
                <select>
                    <option value="">Select Role</option>
                    <option value="bank">Bank</option>
                    <option value="corporate">Corporate</option>
                    <option value="auditor">Auditor</option>
                </select>
            `;

            const actionCell = row.insertCell();
            const btn = document.createElement("button");
            btn.innerText = "Approve";

            btn.onclick = async () => {
                const role = roleCell.querySelector("select").value;
                if (!role) {
                    alert("Select role first");
                    return;
                }

                const resp = await fetch(
                    "http://127.0.0.1:8000/admin/approve-user",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: u.id,
                            role: role
                        })
                    }
                );

                const data = await resp.json();
                alert(data.message);
                loadAdminDashboard();
            };

            actionCell.appendChild(btn);
        });

    } catch (err) {
        console.error(err);
        document.body.innerHTML =
            "<h2 style='color:red'>Backend not reachable</h2>";
    }
}

window.onload = loadAdminDashboard;