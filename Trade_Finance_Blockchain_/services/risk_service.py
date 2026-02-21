def calculate_risk_score(doc_count: int, tx_count: int):
    score = 100

    if doc_count < 3:
        score -= 30
    if tx_count < 2:
        score -= 20

    return max(score, 0)
