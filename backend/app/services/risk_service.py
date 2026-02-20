from datetime import datetime
from app.models.trade import trades_db
from app.services.ledger_service import ledger_db
from app.models.risk import risk_db


def calculate_user_risk(username: str):
    explanations = []

    # =====================================
    # 1️⃣ Document Integrity (40%)
    # =====================================
    doc_failures = [
        l for l in ledger_db
        if l.username == username and l.action == "DOC_VERIFY_FAILED"
    ]

    if len(doc_failures) == 0:
        doc_score = 10
        explanations.append("All uploaded documents passed integrity verification")
    elif len(doc_failures) <= 2:
        doc_score = 60
        explanations.append("Some document verification failures detected")
    else:
        doc_score = 90
        explanations.append("Multiple document integrity violations detected")

    # =====================================
    # 2️⃣ User Activity (25%)
    # =====================================
    suspicious_actions = [
        l for l in ledger_db
        if l.username == username and "FAILED" in l.action
    ]

    if len(suspicious_actions) == 0:
        activity_score = 10
        explanations.append("User activity appears normal")
    elif len(suspicious_actions) <= 3:
        activity_score = 50
        explanations.append("Some suspicious user activity detected")
    else:
        activity_score = 80
        explanations.append("Repeated suspicious user activity detected")

    # =====================================
    # 3️⃣ Transaction Behaviour (25%)
    # =====================================
    user_trades = [
        t for t in trades_db
        if t.buyer == username or t.seller == username
    ]

    problem_trades = [
        t for t in user_trades
        if t.status in ["DISPUTED", "CANCELLED", "DELAYED"]
    ]

    if len(problem_trades) == 0:
        transaction_score = 10
        explanations.append("No transaction disputes or delays found")
    elif len(problem_trades) <= 2:
        transaction_score = 50
        explanations.append("Some transaction disputes or delays detected")
    else:
        transaction_score = 80
        explanations.append("Multiple problematic transactions detected")

    # =====================================
    # 4️⃣ External Trade Risk (10%)
    # =====================================
    external_score = 20
    explanations.append("External trade risk assessed as low")

    # =====================================
    # ✅ Final Risk Score
    # =====================================
    final_score = (
        doc_score * 0.40 +
        activity_score * 0.25 +
        transaction_score * 0.25 +
        external_score * 0.10
    )

    if final_score <= 30:
        risk_level = "LOW"
    elif final_score <= 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    result = {
        "username": username,
        "risk_score": round(final_score, 2),
        "risk_level": risk_level,
        "explanation": explanations,
        "calculated_at": datetime.utcnow()
    }

    risk_db.append(result)

    return result
