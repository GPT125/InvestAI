from fastapi import APIRouter, HTTPException
from backend.services import stock_data, cache
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/macro", tags=["macro"])


@router.get("/pulse")
def macro_pulse():
    """
    Macro Pulse Dashboard — aggregates key economic health indicators:
    yield curve, dollar strength, commodity trends, global indices,
    and rates into a single health-check view.
    """
    key = "macro_pulse"
    cached = cache.get(key, 600)
    if cached:
        return cached

    indicators = {}

    # 1. Yield Curve (10Y - 2Y Treasury spread)
    try:
        tlt = yf.Ticker("^TNX")  # 10-year
        two = yf.Ticker("^IRX")  # 13-week T-bill (proxy for short end)
        tlt_info = tlt.info
        two_info = two.info
        y10 = tlt_info.get("regularMarketPrice") or tlt_info.get("previousClose", 4.0)
        y3m = (two_info.get("regularMarketPrice") or two_info.get("previousClose", 4.5))
        spread = y10 - y3m
        indicators["yieldCurve"] = {
            "yield10Y": round(float(y10), 2),
            "yield3M": round(float(y3m), 2),
            "spread": round(float(spread), 2),
            "status": "Normal" if spread > 0.5 else "Flat" if spread > -0.1 else "Inverted",
            "signal": "Expansion" if spread > 0.5 else "Caution" if spread > -0.1 else "Recession Warning",
        }
    except Exception:
        indicators["yieldCurve"] = {"status": "Unavailable"}

    # 2. US Dollar strength (DXY proxy via UUP)
    try:
        dxy_hist = stock_data.get_price_history("UUP", "6mo")
        if dxy_hist is not None and len(dxy_hist) >= 22:
            close = dxy_hist["Close"].astype(float)
            current = float(close.iloc[-1])
            ma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else float(close.mean())
            ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100)
            indicators["dollar"] = {
                "price": round(current, 2),
                "change1m": round(ret_1m, 2),
                "trend": "Strengthening" if current > ma50 else "Weakening",
                "impact": "Headwind for multinationals" if current > ma50 else "Tailwind for exporters",
            }
    except Exception:
        pass

    # 3. Commodities pulse
    commodities = {
        "Gold": "GLD",
        "Oil": "USO",
        "Silver": "SLV",
        "Nat Gas": "UNG",
        "Copper": "CPER",
    }
    commodity_data = []
    for name, ticker in commodities.items():
        try:
            hist = stock_data.get_price_history(ticker, "3mo")
            if hist is not None and len(hist) >= 22:
                close = hist["Close"].astype(float)
                ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100)
                ret_1w = float((close.iloc[-1] / close.iloc[-6] - 1) * 100) if len(close) >= 6 else 0
                commodity_data.append({
                    "name": name,
                    "ticker": ticker,
                    "price": round(float(close.iloc[-1]), 2),
                    "change1w": round(ret_1w, 2),
                    "change1m": round(ret_1m, 2),
                })
        except Exception:
            continue
    indicators["commodities"] = commodity_data

    # 4. Global indices
    global_indices = {
        "S&P 500": "^GSPC",
        "NASDAQ": "^IXIC",
        "Dow Jones": "^DJI",
        "Russell 2000": "^RUT",
        "Europe (STOXX)": "^STOXX50E",
        "Japan (Nikkei)": "^N225",
        "China (Shanghai)": "000001.SS",
    }
    indices_data = []
    for name, ticker in global_indices.items():
        try:
            hist = stock_data.get_price_history(ticker, "3mo")
            if hist is not None and len(hist) >= 2:
                close = hist["Close"].astype(float)
                ret_1d = float((close.iloc[-1] / close.iloc[-2] - 1) * 100)
                ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100) if len(close) >= 22 else 0
                ytd_start = close.iloc[0]
                ret_ytd = float((close.iloc[-1] / ytd_start - 1) * 100)
                indices_data.append({
                    "name": name,
                    "ticker": ticker,
                    "price": round(float(close.iloc[-1]), 2),
                    "change1d": round(ret_1d, 2),
                    "change1m": round(ret_1m, 2),
                    "changeYtd": round(ret_ytd, 2),
                })
        except Exception:
            continue
    indicators["globalIndices"] = indices_data

    # 5. Risk appetite meter
    try:
        # High-yield vs investment grade spread
        hyg = stock_data.get_price_history("HYG", "3mo")
        lqd = stock_data.get_price_history("LQD", "3mo")
        if hyg is not None and lqd is not None and len(hyg) >= 22 and len(lqd) >= 22:
            hyg_ret = float((hyg["Close"].iloc[-1] / hyg["Close"].iloc[-22] - 1) * 100)
            lqd_ret = float((lqd["Close"].iloc[-1] / lqd["Close"].iloc[-22] - 1) * 100)
            credit_spread = hyg_ret - lqd_ret
            indicators["riskAppetite"] = {
                "creditSpread": round(credit_spread, 2),
                "level": "Risk-On" if credit_spread > 0.5 else "Neutral" if credit_spread > -0.5 else "Risk-Off",
            }
    except Exception:
        pass

    # 6. Overall macro health score (0-100)
    health_signals = []
    yc = indicators.get("yieldCurve", {})
    if yc.get("status") == "Normal":
        health_signals.append(80)
    elif yc.get("status") == "Flat":
        health_signals.append(50)
    elif yc.get("status") == "Inverted":
        health_signals.append(20)

    dollar = indicators.get("dollar", {})
    if dollar.get("trend") == "Weakening":
        health_signals.append(60)
    elif dollar.get("trend") == "Strengthening":
        health_signals.append(40)

    risk = indicators.get("riskAppetite", {})
    if risk.get("level") == "Risk-On":
        health_signals.append(75)
    elif risk.get("level") == "Neutral":
        health_signals.append(50)
    elif risk.get("level") == "Risk-Off":
        health_signals.append(25)

    # US indices performance
    for idx in indices_data:
        if idx["name"] == "S&P 500":
            if idx["change1m"] > 3:
                health_signals.append(85)
            elif idx["change1m"] > 0:
                health_signals.append(60)
            elif idx["change1m"] > -3:
                health_signals.append(40)
            else:
                health_signals.append(20)
            break

    health_score = round(sum(health_signals) / len(health_signals)) if health_signals else 50
    if health_score >= 70:
        health_label = "Robust"
    elif health_score >= 55:
        health_label = "Healthy"
    elif health_score >= 40:
        health_label = "Mixed"
    elif health_score >= 25:
        health_label = "Stressed"
    else:
        health_label = "Critical"

    indicators["healthScore"] = health_score
    indicators["healthLabel"] = health_label

    output = {"indicators": indicators, "timestamp": pd.Timestamp.now().isoformat()}
    cache.set(key, output)
    return output
