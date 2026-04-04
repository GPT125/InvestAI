from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache, ai_service
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/battle", tags=["battle"])


@router.get("/fight")
def stock_battle(
    ticker_a: str = Query(...),
    ticker_b: str = Query(...),
):
    """
    Stock Battle Arena — head-to-head comparison scored across 8 categories
    like a fighting-game stat card: Growth, Value, Momentum, Stability,
    Quality, Income, Size, and Sentiment.
    """
    a = ticker_a.upper()
    b = ticker_b.upper()
    key = f"battle:{a}:{b}"
    cached = cache.get(key, 1800)
    if cached:
        return cached

    info_a = stock_data.get_stock_info(a)
    info_b = stock_data.get_stock_info(b)
    if not info_a or not info_b:
        raise HTTPException(status_code=404, detail="One or both tickers not found")

    hist_a = stock_data.get_price_history(a, "1y")
    hist_b = stock_data.get_price_history(b, "1y")

    def calc_stats(info, hist):
        stats = {}
        # Growth
        rev_g = (info.get("revenueGrowth") or 0) * 100
        earn_g = (info.get("earningsGrowth") or 0) * 100
        stats["growth"] = max(0, min(100, int(50 + (rev_g + earn_g) / 2)))

        # Value (lower P/E is better)
        pe = info.get("trailingPE") or 30
        if pe <= 0:
            stats["value"] = 30
        elif pe < 12:
            stats["value"] = 95
        elif pe < 18:
            stats["value"] = 75
        elif pe < 25:
            stats["value"] = 55
        elif pe < 40:
            stats["value"] = 35
        else:
            stats["value"] = 15

        # Momentum
        if hist is not None and len(hist) >= 50:
            close = hist["Close"].astype(float)
            sma50 = float(close.rolling(50).mean().iloc[-1])
            mom = ((float(close.iloc[-1]) / sma50) - 1) * 100
            stats["momentum"] = max(0, min(100, int(50 + mom * 3)))
        else:
            stats["momentum"] = 50

        # Stability (inverse volatility)
        if hist is not None and len(hist) >= 50:
            returns = hist["Close"].astype(float).pct_change().dropna()
            annual_vol = float(returns.std()) * np.sqrt(252)
            stats["stability"] = max(0, min(100, int(100 - annual_vol * 200)))
        else:
            stats["stability"] = 50

        # Quality
        roe = (info.get("returnOnEquity") or 0) * 100
        margin = (info.get("profitMargins") or 0) * 100
        stats["quality"] = max(0, min(100, int((roe + margin) / 2 + 30)))

        # Income
        div_yield = info.get("dividendYield") or 0
        stats["income"] = max(0, min(100, int(div_yield * 2000)))

        # Size
        mcap = info.get("marketCap") or 0
        if mcap > 200e9:
            stats["size"] = 95
        elif mcap > 50e9:
            stats["size"] = 75
        elif mcap > 10e9:
            stats["size"] = 55
        elif mcap > 2e9:
            stats["size"] = 35
        else:
            stats["size"] = 15

        # Sentiment (analyst recommendation)
        rec = info.get("recommendationMean")
        if rec:
            stats["sentiment"] = max(0, min(100, int(100 - (rec - 1) * 25)))
        else:
            stats["sentiment"] = 50

        return stats

    stats_a = calc_stats(info_a, hist_a)
    stats_b = calc_stats(info_b, hist_b)

    # Determine category winners
    categories = ["growth", "value", "momentum", "stability", "quality", "income", "size", "sentiment"]
    wins_a = 0
    wins_b = 0
    rounds = []
    for cat in categories:
        sa = stats_a.get(cat, 50)
        sb = stats_b.get(cat, 50)
        if sa > sb:
            winner = a
            wins_a += 1
        elif sb > sa:
            winner = b
            wins_b += 1
        else:
            winner = "tie"
        rounds.append({
            "category": cat,
            "scoreA": sa,
            "scoreB": sb,
            "winner": winner,
        })

    total_a = sum(stats_a.values())
    total_b = sum(stats_b.values())

    if total_a > total_b:
        overall_winner = a
        verdict = f"{a} dominates with superior overall metrics"
    elif total_b > total_a:
        overall_winner = b
        verdict = f"{b} takes the crown with stronger fundamentals"
    else:
        overall_winner = "tie"
        verdict = "An incredibly close battle — virtually tied!"

    # Performance race
    perf_a = {}
    perf_b = {}
    for label, days in [("1W", 5), ("1M", 22), ("3M", 66), ("6M", 130), ("1Y", 252)]:
        for ticker, hist, perf in [(a, hist_a, perf_a), (b, hist_b, perf_b)]:
            if hist is not None and len(hist) >= days + 1:
                close = hist["Close"].astype(float)
                ret = float((close.iloc[-1] / close.iloc[-(days + 1)] - 1) * 100)
                perf[label] = round(ret, 2)
            else:
                perf[label] = None

    result = {
        "fighterA": {
            "ticker": a,
            "name": info_a.get("shortName", a),
            "sector": info_a.get("sector", "N/A"),
            "price": round(info_a.get("regularMarketPrice") or info_a.get("currentPrice", 0), 2),
            "stats": stats_a,
            "totalScore": total_a,
            "wins": wins_a,
            "performance": perf_a,
        },
        "fighterB": {
            "ticker": b,
            "name": info_b.get("shortName", b),
            "sector": info_b.get("sector", "N/A"),
            "price": round(info_b.get("regularMarketPrice") or info_b.get("currentPrice", 0), 2),
            "stats": stats_b,
            "totalScore": total_b,
            "wins": wins_b,
            "performance": perf_b,
        },
        "rounds": rounds,
        "overallWinner": overall_winner,
        "verdict": verdict,
    }

    cache.set(key, result)
    return result
