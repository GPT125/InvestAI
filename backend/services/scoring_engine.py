import pandas as pd
import numpy as np


def _clamp(value, min_val=0, max_val=100):
    return max(min_val, min(max_val, value))


def _linear_score(value, low, high, invert=False):
    """Map value from [low, high] to [0, 100]. If invert, lower values score higher."""
    if value is None:
        return 50.0
    if high == low:
        return 50.0
    score = (value - low) / (high - low) * 100
    if invert:
        score = 100 - score
    return _clamp(score)


# ── Stock Sub-Scores ──

def score_valuation(info):
    scores = []
    pe = info.get("trailingPE")
    if pe and pe > 0:
        scores.append(_linear_score(pe, 5, 40, invert=True))
    peg = info.get("pegRatio")
    if peg and peg > 0:
        scores.append(_linear_score(peg, 0.5, 3.0, invert=True))
    pb = info.get("priceToBook")
    if pb and pb > 0:
        scores.append(_linear_score(pb, 1, 10, invert=True))
    forward_pe = info.get("forwardPE")
    if forward_pe and forward_pe > 0:
        scores.append(_linear_score(forward_pe, 5, 35, invert=True))
    ps = info.get("priceToSalesTrailing12Months")
    if ps and ps > 0:
        scores.append(_linear_score(ps, 1, 15, invert=True))
    return sum(scores) / len(scores) if scores else 50.0


def score_growth(info):
    scores = []
    rev_growth = info.get("revenueGrowth")
    if rev_growth is not None:
        scores.append(_linear_score(rev_growth * 100, -10, 30))
    earn_growth = info.get("earningsGrowth")
    if earn_growth is not None:
        scores.append(_linear_score(earn_growth * 100, -20, 40))
    profit_margin = info.get("profitMargins")
    if profit_margin is not None:
        scores.append(_linear_score(profit_margin * 100, 0, 30))
    roe = info.get("returnOnEquity")
    if roe is not None:
        scores.append(_linear_score(roe * 100, 0, 30))
    return sum(scores) / len(scores) if scores else 50.0


def score_financial_health(info):
    scores = []
    dte = info.get("debtToEquity")
    if dte is not None:
        scores.append(_linear_score(dte, 0, 200, invert=True))
    cr = info.get("currentRatio")
    if cr is not None:
        scores.append(_linear_score(cr, 0.5, 3.0))
    fcf = info.get("freeCashflow")
    if fcf is not None:
        scores.append(75 if fcf > 0 else 25)
    return sum(scores) / len(scores) if scores else 50.0


def score_momentum(history):
    if history is None or history.empty or len(history) < 20:
        return 50.0
    scores = []
    close = history["Close"]
    current_price = close.iloc[-1]
    if len(close) >= 50:
        ma50 = close.rolling(50).mean().iloc[-1]
        above_50 = (current_price / ma50 - 1) * 100
        scores.append(_clamp(50 + above_50 * 5))
    if len(close) >= 200:
        ma200 = close.rolling(200).mean().iloc[-1]
        above_200 = (current_price / ma200 - 1) * 100
        scores.append(_clamp(50 + above_200 * 3))
    if len(close) >= 200:
        ma50 = close.rolling(50).mean().iloc[-1]
        ma200 = close.rolling(200).mean().iloc[-1]
        scores.append(75 if ma50 > ma200 else 30)
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain.iloc[-1] / loss.iloc[-1] if loss.iloc[-1] != 0 else 100
    rsi = 100 - (100 / (1 + rs))
    if rsi < 30:
        scores.append(70)
    elif rsi > 70:
        scores.append(30)
    else:
        scores.append(50 + (50 - rsi))
    return sum(scores) / len(scores) if scores else 50.0


def score_dividends(info):
    scores = []
    div_yield = info.get("dividendYield")
    if div_yield is not None and div_yield > 0:
        scores.append(_linear_score(div_yield * 100, 0, 5))
    payout = info.get("payoutRatio")
    if payout is not None:
        # Payout ratio 20-60% is ideal
        if payout < 0.2:
            scores.append(40)
        elif payout <= 0.6:
            scores.append(80)
        elif payout <= 0.8:
            scores.append(50)
        else:
            scores.append(20)
    if not scores:
        return 50.0
    return sum(scores) / len(scores)


def score_analyst(info):
    scores = []
    rec = info.get("recommendationKey", "").lower()
    rec_map = {
        "strong_buy": 95, "buy": 80, "overweight": 70,
        "hold": 50, "neutral": 50, "market perform": 50,
        "underweight": 30, "underperform": 25, "sell": 10, "strong_sell": 5,
    }
    if rec in rec_map:
        scores.append(rec_map[rec])
    target = info.get("targetMeanPrice")
    current = info.get("regularMarketPrice") or info.get("currentPrice")
    if target and current and current > 0:
        upside = (target / current - 1) * 100
        scores.append(_linear_score(upside, -20, 30))
    num_analysts = info.get("numberOfAnalystOpinions", 0)
    if num_analysts:
        scores.append(_linear_score(num_analysts, 1, 30))
    return sum(scores) / len(scores) if scores else 50.0


# ── ETF Sub-Scores ──

PREMIUM_ISSUERS = {
    "vanguard", "blackrock", "ishares", "schwab", "fidelity",
    "state street", "spdr", "invesco",
}

def score_etf_cost(info):
    scores = []
    er = info.get("annualReportExpenseRatio") or info.get("expenseRatio")
    if er is not None:
        scores.append(_linear_score(er * 100, 0, 1.0, invert=True))
    return sum(scores) / len(scores) if scores else 50.0


def score_etf_performance(info, history):
    scores = []
    ytd = info.get("ytdReturn")
    if ytd is not None:
        scores.append(_linear_score(ytd * 100, -10, 30))
    three_yr = info.get("threeYearAverageReturn")
    if three_yr is not None:
        scores.append(_linear_score(three_yr * 100, -5, 20))
    five_yr = info.get("fiveYearAverageReturn")
    if five_yr is not None:
        scores.append(_linear_score(five_yr * 100, -5, 15))
    if not scores and history is not None and not history.empty and len(history) > 50:
        close = history["Close"]
        ret = (close.iloc[-1] / close.iloc[0] - 1) * 100
        scores.append(_linear_score(ret, -20, 50))
    return sum(scores) / len(scores) if scores else 50.0


def score_etf_liquidity(info):
    scores = []
    avg_vol = info.get("averageVolume")
    if avg_vol:
        scores.append(_linear_score(avg_vol, 50_000, 10_000_000))
    total_assets = info.get("totalAssets")
    if total_assets:
        scores.append(_linear_score(total_assets, 50_000_000, 50_000_000_000))
    return sum(scores) / len(scores) if scores else 50.0


def score_etf_issuer(info):
    fund_family = (info.get("fundFamily") or "").lower()
    for issuer in PREMIUM_ISSUERS:
        if issuer in fund_family:
            return 85.0
    if fund_family:
        return 55.0
    return 40.0


# ── Composite ──

def classify(composite):
    if composite >= 80:
        return "Strong Buy"
    elif composite >= 65:
        return "Buy"
    elif composite >= 45:
        return "Hold"
    elif composite >= 25:
        return "Underperform"
    else:
        return "Sell"


def compute_stock_score(info, history):
    val = score_valuation(info)
    grw = score_growth(info)
    hlth = score_financial_health(info)
    mom = score_momentum(history)
    div = score_dividends(info)
    ana = score_analyst(info)

    composite = val * 0.20 + grw * 0.20 + hlth * 0.15 + mom * 0.15 + div * 0.15 + ana * 0.15

    return {
        "composite": round(composite, 1),
        "valuation": round(val, 1),
        "growth": round(grw, 1),
        "financialHealth": round(hlth, 1),
        "momentum": round(mom, 1),
        "dividends": round(div, 1),
        "analyst": round(ana, 1),
        "rating": classify(composite),
        "scoreType": "stock",
    }


def compute_etf_score(info, history):
    cost = score_etf_cost(info)
    perf = score_etf_performance(info, history)
    mom = score_momentum(history)
    liq = score_etf_liquidity(info)
    issuer = score_etf_issuer(info)

    composite = cost * 0.25 + perf * 0.25 + mom * 0.15 + liq * 0.20 + issuer * 0.15

    return {
        "composite": round(composite, 1),
        "costEfficiency": round(cost, 1),
        "performance": round(perf, 1),
        "momentum": round(mom, 1),
        "liquidity": round(liq, 1),
        "issuerQuality": round(issuer, 1),
        "rating": classify(composite),
        "scoreType": "etf",
    }


def compute_score(info, history):
    """Auto-detect stock vs ETF and use appropriate scorer."""
    quote_type = info.get("quoteType", "").upper()
    if quote_type == "ETF":
        return compute_etf_score(info, history)
    return compute_stock_score(info, history)
