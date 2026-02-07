from app.services.trade_service import trades_db


def overview():
    total_trades = len(trades_db)
    completed_trades = len(
        [t for t in trades_db if t["status"] == "COMPLETED"]
    )

    return {
        "total_trades": total_trades,
        "completed_trades": completed_trades
    }
