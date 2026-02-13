def recalculate_risk_score(user_id: int, db):
    """
    Simple risk recalculation logic.
    Increase risk if tampered documents exist.
    """

    from app.models.document import Document
    from app.models.risk_score import RiskScore

    tampered_docs = db.query(Document).filter(
        Document.uploaded_by == user_id,
        Document.status == "TAMPERED"
    ).count()

    # Basic logic example
    risk_value = min(100, tampered_docs * 20)

    risk_level = "LOW"
    if risk_value >= 70:
        risk_level = "HIGH"
    elif risk_value >= 40:
        risk_level = "MEDIUM"

    existing_risk = db.query(RiskScore).filter(
        RiskScore.user_id == user_id
    ).first()

    if existing_risk:
        existing_risk.score = risk_value
        existing_risk.level = risk_level
    else:
        new_risk = RiskScore(
            user_id=user_id,
            score=risk_value,
            level=risk_level
        )
        db.add(new_risk)

    db.commit()
