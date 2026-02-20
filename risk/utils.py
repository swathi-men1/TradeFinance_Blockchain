from documents.models import Document
from ledger.models import Ledger


def calculate_risk(user):

    score = 0
    explanation = []

    tampered_docs = Document.objects.filter(
        owner=user,
        is_verified=False
    ).count()

    score += tampered_docs * 30

    if tampered_docs > 0:
        explanation.append("Tampered documents detected.")


    suspicious_actions = Ledger.objects.filter(
        performed_by=user,
        action="TAMPERED"
    ).count()

    score += suspicious_actions * 20

    if suspicious_actions > 0:
        explanation.append("Suspicious ledger activity found.")


    if score < 30:
        category = "LOW"
    elif score < 70:
        category = "MEDIUM"
    else:
        category = "HIGH"

    if not explanation:
        explanation.append("No risk indicators detected.")

    return score, category, " ".join(explanation)

