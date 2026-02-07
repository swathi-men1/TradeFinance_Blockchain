def calculate_risk(trade, tampered=False):
    score = 0
    if tampered:
        score += 50
    if trade["status"] != "COMPLETED":
        score += 20

    level = "LOW" if score < 30 else "MEDIUM" if score < 60 else "HIGH"
    return {"score": score, "level": level}
