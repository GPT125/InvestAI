from fastapi import APIRouter, HTTPException
from backend.services import stock_data, cache
from backend.data.sp500_tickers import SP500_TICKERS
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/forecast")
def market_weather_forecast():
    """
    Volatility Weather Map — translates market conditions into an
    intuitive weather metaphor. Sunny = calm bull, Stormy = high-vol bear, etc.
    """
    key = "weather_forecast"
    cached = cache.get(key, 300)
    if cached:
        return cached

    conditions = {}

    # 1. VIX — the 'temperature'
    try:
        vix = yf.Ticker("^VIX")
        vix_hist = vix.history(period="3mo")
        if vix_hist is not None and not vix_hist.empty:
            vix_now = float(vix_hist["Close"].iloc[-1])
            vix_avg = float(vix_hist["Close"].mean())
            vix_trend = float(vix_hist["Close"].iloc[-1] - vix_hist["Close"].iloc[-6])
            conditions["vix"] = {
                "current": round(vix_now, 2),
                "avg3m": round(vix_avg, 2),
                "trend": round(vix_trend, 2),
                "label": "Low" if vix_now < 15 else "Normal" if vix_now < 20 else "Elevated" if vix_now < 25 else "High" if vix_now < 35 else "Extreme",
            }
    except Exception:
        conditions["vix"] = {"current": 20, "label": "Normal"}

    # 2. Market trend — the 'wind direction'
    try:
        spy_hist = stock_data.get_price_history("^GSPC", "3mo")
        if spy_hist is not None and len(spy_hist) >= 50:
            close = spy_hist["Close"].astype(float)
            sma20 = float(close.rolling(20).mean().iloc[-1])
            sma50 = float(close.rolling(50).mean().iloc[-1])
            current = float(close.iloc[-1])
            ret_1w = float((close.iloc[-1] / close.iloc[-6] - 1) * 100)
            ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100)

            if current > sma20 > sma50:
                trend = "Strong Uptrend"
            elif current > sma20:
                trend = "Uptrend"
            elif current > sma50:
                trend = "Mild Uptrend"
            elif current < sma20 < sma50:
                trend = "Strong Downtrend"
            elif current < sma20:
                trend = "Downtrend"
            else:
                trend = "Sideways"

            conditions["trend"] = {
                "direction": trend,
                "return1w": round(ret_1w, 2),
                "return1m": round(ret_1m, 2),
                "aboveSma20": current > sma20,
                "aboveSma50": current > sma50,
            }
    except Exception:
        conditions["trend"] = {"direction": "Unknown"}

    # 3. Market breadth — the 'barometric pressure'
    try:
        advancing = 0
        declining = 0
        unchanged = 0
        total = 0
        for ticker in SP500_TICKERS[:50]:
            try:
                info = stock_data.get_stock_info(ticker)
                if info:
                    chg = info.get("regularMarketChangePercent", 0) or 0
                    if chg > 0.5:
                        advancing += 1
                    elif chg < -0.5:
                        declining += 1
                    else:
                        unchanged += 1
                    total += 1
            except Exception:
                continue

        ad_ratio = advancing / max(declining, 1)
        conditions["breadth"] = {
            "advancing": advancing,
            "declining": declining,
            "unchanged": unchanged,
            "total": total,
            "adRatio": round(ad_ratio, 2),
            "pressure": "High" if ad_ratio > 2 else "Normal" if ad_ratio > 0.8 else "Low",
        }
    except Exception:
        conditions["breadth"] = {"pressure": "Normal"}

    # 4. Sector dispersion — 'humidity'
    sector_etfs = {"XLK": "Tech", "XLV": "Health", "XLF": "Finance", "XLE": "Energy", "XLU": "Utilities"}
    sector_returns = []
    for etf, name in sector_etfs.items():
        try:
            hist = stock_data.get_price_history(etf, "1mo")
            if hist is not None and len(hist) >= 2:
                ret = float((hist["Close"].iloc[-1] / hist["Close"].iloc[-2] - 1) * 100)
                sector_returns.append({"sector": name, "return": round(ret, 2)})
        except Exception:
            continue

    if sector_returns:
        rets = [s["return"] for s in sector_returns]
        dispersion = float(np.std(rets))
        conditions["dispersion"] = {
            "sectors": sector_returns,
            "stdDev": round(dispersion, 2),
            "label": "Low" if dispersion < 0.5 else "Moderate" if dispersion < 1.5 else "High",
        }

    # 5. Overall weather classification
    vix_val = conditions.get("vix", {}).get("current", 20)
    trend_dir = conditions.get("trend", {}).get("direction", "Sideways")
    breadth_pr = conditions.get("breadth", {}).get("pressure", "Normal")

    if vix_val < 15 and "Uptrend" in trend_dir and breadth_pr == "High":
        weather = "Sunny"
        icon = "sun"
        description = "Clear skies ahead — low volatility, strong uptrend, broad participation"
        temperature = "Hot"
    elif vix_val < 20 and "Uptrend" in trend_dir:
        weather = "Partly Cloudy"
        icon = "cloud-sun"
        description = "Mostly fair conditions with occasional clouds — uptrend intact"
        temperature = "Warm"
    elif vix_val < 20 and "Sideways" in trend_dir:
        weather = "Overcast"
        icon = "cloud"
        description = "Gray skies — market in a holding pattern, waiting for direction"
        temperature = "Mild"
    elif vix_val < 25 and "Down" in trend_dir:
        weather = "Rainy"
        icon = "cloud-rain"
        description = "Rain moving in — rising volatility with downward pressure"
        temperature = "Cool"
    elif vix_val >= 25 and "Down" in trend_dir:
        weather = "Stormy"
        icon = "cloud-lightning"
        description = "Storm warning — high volatility and declining markets"
        temperature = "Cold"
    elif vix_val >= 35:
        weather = "Hurricane"
        icon = "tornado"
        description = "Extreme volatility — seek shelter and review risk exposure"
        temperature = "Freezing"
    else:
        weather = "Breezy"
        icon = "wind"
        description = "Light winds with mixed conditions — stay alert"
        temperature = "Moderate"

    output = {
        "weather": weather,
        "icon": icon,
        "description": description,
        "temperature": temperature,
        "conditions": conditions,
        "timestamp": pd.Timestamp.now().isoformat(),
    }

    cache.set(key, output)
    return output
