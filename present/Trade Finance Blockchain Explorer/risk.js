let riskChart = null;

async function loadIndividualRisk() {
    const riskBox = document.getElementById("riskBox");

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!username || role !== "corporate") {
        riskBox.innerHTML = "<p style='color:red'>Unauthorized</p>";
        return;
    }

    const res = await fetch("http://127.0.0.1:8000/calculate-risk", {
        method: "POST",
        headers: { "X-User": username }
    });

    const data = await res.json();

    let color = "green";
    if (data.risk_score >= 70) color = "red";
    else if (data.risk_score >= 40) color = "orange";

    riskBox.innerHTML = `
        <h3>Corporate Risk Summary</h3>
        <p><b>User:</b> ${data.corporate_user}</p>
        <p><b>Risk Score:</b> 
            <span style="color:${color}; font-weight:bold">
                ${data.risk_score}
            </span>
        </p>
        <p><b>Risk Level:</b> 
            <span style="color:${color}; font-weight:bold">
                ${data.risk_level}
            </span>
        </p>
    `;
}

async function loadRiskSummary() {
    const ctx = document.getElementById("riskChart").getContext("2d");

    const res = await fetch("http://127.0.0.1:8000/risk-summary");
    const data = await res.json();

    if (riskChart) riskChart.destroy();

    riskChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Low Risk", "Medium Risk", "High Risk"],
            datasets: [{
                data: [data.low, data.medium, data.high],
                backgroundColor: ["green", "orange", "red"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadIndividualRisk();
    loadRiskSummary();
});