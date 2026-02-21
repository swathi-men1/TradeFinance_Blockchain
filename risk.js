async function loadRisk() {
    const riskBox = document.getElementById("riskBox");

    try {
        const username = localStorage.getItem("username");
        const role = localStorage.getItem("role");

        if (!username) {
            riskBox.innerHTML =
                "<p style='color:red'>User not identified. Please login again.</p>";
            return;
        }

        if (role !== "corporate") {
            riskBox.innerHTML =
                "<p style='color:red'>Corporate users only.</p>";
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/calculate-risk", {
            method: "POST",
            headers: {
                "X-User": username
            }
        });

        const data = await response.json();

        if (!response.ok) {
            riskBox.innerHTML =
                `<p style="color:red">${data.detail}</p>`;
            return;
        }

        // 🎨 Risk color based on level
        let riskColor = "green";
        if (data.risk_level === "MEDIUM") riskColor = "orange";
        else if (data.risk_level === "HIGH") riskColor = "red";

        // ✅ Display UI (Score + Level)
        riskBox.innerHTML = `
            <h3 class="risk-title">Corporate Risk Summary</h3>
            <p><b>Corporate User:</b> ${data.corporate_user}</p>
            <p><b>Risk Score:</b> ${data.risk_score}</p>
            <p>
                <b>Risk Level:</b>
                <span style="color:${riskColor}; font-weight:bold;">
                    ${data.risk_level}
                </span>
            </p>
        `;

    } catch (error) {
        console.error(error);
        riskBox.innerHTML =
            "<p style='color:red'>Backend not reachable</p>";
    }
}

window.onload = loadRisk;