def calculate_risk_score(
    tamper_count: int,
    pending_docs: int,
    incomplete_trades: int,
    ledger_tamper_events: int
) -> int:
    """
    Calculate corporate risk score based on system activity.
    Risk applies only to corporate users.
    """

    risk = 0

    # Document integrity violations
    risk += tamper_count * 40

    # Pending documents
    risk += pending_docs * 5

    # Incomplete trades
    risk += incomplete_trades * 10

    # Ledger tamper entries
    risk += ledger_tamper_events * 20

    # Cap risk score
    return min(risk, 100)