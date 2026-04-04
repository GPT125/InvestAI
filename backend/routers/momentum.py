from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend.data.sp500_tickers import SP500_TICKERS, POPULAR_ETFS
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/momentum", tags=["momentum"])


@router.get("/radar")
def momentum_radar(limit: int = Query(30, ge=5, le=100)):
    """
    Momentum Radar — scan top stocks for unusual momentum shifts across
    multiple timeframes (1D, 1W, 1M, 3M).  Returns a ranked list with
    a composite 'momentum blast' score.
    """
    key = f"momentum_radar:{limit}"
    cached = cache.get(key, 300)
    if cached:
        return cached

    candidates = SP500_TICKERS[:80]
    results = []

    for ticker in candidates:
        try:
            hist = stock_data.get_price_history(ticker, "6mo")
            if hist is None or len(hist) < 66:
                continue
            close = hist["Close"].astype(float)

            ret_1d = float((close.iloc[-1] / close.iloc[-2] - 1) * 100)
            ret_1w = float((close.iloc[-1] / close.iloc[-6] - 1) * 100) if len(close) >= 6 else 0
            ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100) if len(close) >= 22 else 0
            ret_3m = float((close.iloc[-1] / close.iloc[-66] - 1) * 100) if len(close) >= 66 else 0

            # Volume spike
            vol = hist["Volume"].astype(float)
            avg_vol_20 = float(vol.iloc[-21:-1].mean()) if len(vol) >= 21 else float(vol.mean())
            vol_ratio = float(vol.iloc[-1] / avg_vol_20) if avg_vol_20 > 0 else 1

            # Relative strength vs 50-day MA
            sma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else float(close.mean())
            rs_50 = float((close.iloc[-1] / sma50 - 1) * 100)

            # Composite momentum blast score (0-100)
            # Weight: 1D=15%, 1W=25%, 1M=30%, 3M=20%, Volume=10%
            norm_1d = max(-10, min(10, ret_1d)) / 10 * 50 + 50
            norm_1w = max(-20, min(20, ret_1w)) / 20 * 50 + 50
            norm_1m = max(-30, min(30, ret_1m)) / 30 * 50 + 50
            norm_3m = max(-50, min(50, ret_3m)) / 50 * 50 + 50
            norm_vol = min(100, vol_ratio * 33)

            blast = (norm_1d * 0.15 + norm_1w * 0.25 + norm_1m * 0.30
                     + norm_3m * 0.20 + norm_vol * 0.10)
            blast = max(0, min(100, blast))

            # Direction & acceleration
            accel = ret_1w - (ret_1m / 4.3)  # Is momentum accelerating?

            info = stock_data.get_stock_info(ticker)
            results.append({
                "ticker": ticker,
                "name": info.get("shortName", ticker) if info else ticker,
                "sector": info.get("sector", "N/A") if info else "N/A",
                "price": round(float(close.iloc[-1]), 2),
                "return1d": round(ret_1d, 2),
                "return1w": round(ret_1w, 2),
                "return1m": round(ret_1m, 2),
                "return3m": round(ret_3m, 2),
                "volumeRatio": round(vol_ratio, 2),
                "rs50": round(rs_50, 2),
                "blastScore": round(blast, 1),
                "acceleration": round(accel, 2),
                "direction": "bullish" if ret_1w > 0 and ret_1m > 0 else "bearish" if ret_1w < 0 and ret_1m < 0 else "mixed",
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["blastScore"], reverse=True)
    output = {"stocks": results[:limit], "timestamp": pd.Timestamp.now().isoformat()}
    cache.set(key, output)
    return output


@router.get("/unusual-volume")
def unusual_volume(limit: int = Query(20)):
    """Find stocks with unusual volume spikes — potential breakout signals."""
    key = f"unusual_vol:{limit}"
    cached = cache.get(key, 300)
    if cached:
        return cached

    candidates = SP500_TICKERS[:60]
    alerts = []

    for ticker in candidates:
        try:
            hist = stock_data.get_price_history(ticker, "3mo")
            if hist is None or len(hist) < 22:
                continue
            vol = hist["Volume"].astype(float)
            close = hist["Close"].astype(float)

            avg_vol = float(vol.iloc[-21:-1].mean())
            today_vol = float(vol.iloc[-1])
            ratio = today_vol / avg_vol if avg_vol > 0 else 1

            if ratio >= 1.5:
                ret_1d = float((close.iloc[-1] / close.iloc[-2] - 1) * 100)
                info = stock_data.get_stock_info(ticker)
                alerts.append({
                    "ticker": ticker,
                    "name": info.get("shortName", ticker) if info else ticker,
                    "price": round(float(close.iloc[-1]), 2),
                    "change1d": round(ret_1d, 2),
                    "todayVolume": int(today_vol),
                    "avgVolume": int(avg_vol),
                    "volumeRatio": round(ratio, 2),
                    "signal": "Surge Up" if ret_1d > 1 else "Surge Down" if ret_1d < -1 else "Accumulation" if ret_1d >= 0 else "Distribution",
                })
        except Exception:
            continue

    alerts.sort(key=lambda x: x["volumeRatio"], reverse=True)
    output = {"alerts": alerts[:limit], "timestamp": pd.Timestamp.now().isoformat()}
    cache.set(key, output)
    return output


@router.get("/breakouts")
def detect_breakouts(limit: int = Query(15)):
    """Detect stocks breaking above/below key technical levels (52-wk high/low, SMA crosses)."""
    key = f"breakouts:{limit}"
    cached = cache.get(key, 300)
    if cached:
        return cached

    candidates = SP500_TICKERS[:60]
    breakouts = []

    for ticker in candidates:
        try:
            hist = stock_data.get_price_history(ticker, "1y")
            if hist is None or len(hist) < 200:
                continue
            close = hist["Close"].astype(float)
            current = float(close.iloc[-1])
            prev = float(close.iloc[-2])

            high_52 = float(close.max())
            low_52 = float(close.min())
            sma50 = float(close.rolling(50).mean().iloc[-1])
            sma200 = float(close.rolling(200).mean().iloc[-1])
            prev_sma50 = float(close.rolling(50).mean().iloc[-2])
            prev_sma200 = float(close.rolling(200).mean().iloc[-2])

            signals = []
            if current >= high_52 * 0.98:
                signals.append("Near 52-Week High")
            if current <= low_52 * 1.02:
                signals.append("Near 52-Week Low")
            if prev < sma50 and current >= sma50:
                signals.append("Crossed Above 50-SMA")
            if prev > sma50 and current <= sma50:
                signals.append("Crossed Below 50-SMA")
            if prev_sma50 <= prev_sma200 and sma50 > sma200:
                signals.append("Golden Cross")
            if prev_sma50 >= prev_sma200 and sma50 < sma200:
                signals.append("Death Cross")

            if signals:
                info = stock_data.get_stock_info(ticker)
                breakouts.append({
                    "ticker": ticker,
                    "name": info.get("shortName", ticker) if info else ticker,
                    "price": round(current, 2),
                    "change1d": round((current / prev - 1) * 100, 2),
                    "high52": round(high_52, 2),
                    "low52": round(low_52, 2),
                    "sma50": round(sma50, 2),
                    "sma200": round(sma200, 2),
                    "signals": signals,
                    "signalType": "bullish" if any("Above" in s or "Golden" in s or "High" in s for s in signals) else "bearish",
                })
        except Exception:
            continue

    output = {"breakouts": breakouts[:limit], "timestamp": pd.Timestamp.now().isoformat()}
    cache.set(key, output)
    return output
