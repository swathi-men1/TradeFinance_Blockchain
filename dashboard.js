fetch("/")
  .then(res => res.json())
  .then(data => {
    document.getElementById("docs").innerText = data.total_documents;
    document.getElementById("txns").innerText = data.active_transactions;
    document.getElementById("verified").innerText = data.verified_today;
    document.getElementById("risk").innerText = data.avg_risk_score;
  });
