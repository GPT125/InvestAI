from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend.data.sp500_tickers import SP500_TICKERS
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/patterns", tags=["patterns"])


@router.get("/scan")
def scan_patterns(limit: int = Query(30)):
    """
    Smart Pattern Scanner — detects key technical patterns across S&P 500
    stocks: golden/death cross, RSI extremes, MACD crossovers, Bollinger
    squeeze/breakout, double-bottom signals.
    """
    key = f"pattern_scan:{limit}"
    cached = cache.get(key, 300)
    if cached:
        return cached

    candidates = SP500_TICKERS[:80]
    detections = []

    for ticker in candidates:
        try:
            hist = stock_data.get_price_history(ticker, "1y")
            if hist is None or len(hist) < 200:
                continue
            close = hist["Close"].astype(float)
            high = hist["High"].astype(float)
            low = hist["Low"].astype(float)

            patterns_found = []

            # 1. Golden Cross / Death Cross (SMA50 vs SMA200)
            sma50 = close.rolling(50).mean()
            sma200 = close.rolling(200).mean()
            if sma50.iloc[-1] > sma200.iloc[-1] and sma50.iloc[-2] <= sma200.iloc[-2]:
                patterns_found.append({
                    "name": "Golden Cross",
                    "type": "bullish",
                    "strength": 85,
                    "description": "50-day MA crossed above 200-day MA",
                })
            elif sma50.iloc[-1] < sma200.iloc[-1] and sma50.iloc[-2] >= sma200.iloc[-2]:
                patterns_found.append({
                    "name": "Death Cross",
                    "type": "bearish",
                    "strength": 85,
                    "description": "50-day MA crossed below 200-day MA",
                })

            # 2. RSI Extremes
            delta = close.diff()
            gain = delta.clip(lower=0).rolling(14).mean()
            loss = (-delta.clip(upper=0)).rolling(14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            rsi_val = float(rsi.iloc[-1])

            if rsi_val >= 75:
                patterns_found.append({
                    "name": "RSI Overbought",
                    "type": "bearish",
                    "strength": 70,
                    "description": f"RSI at {round(rsi_val, 1)} — potential pullback",
                })
            elif rsi_val <= 25:
                patterns_found.append({
                    "name": "RSI Oversold",
                    "type": "bullish",
                    "strength": 70,
                    "description": f"RSI at {round(rsi_val, 1)} — potential bounce",
                })

            # 3. MACD Crossover
            ema12 = close.ewm(span=12).mean()
            ema26 = close.ewm(span=26).mean()
            macd_line = ema12 - ema26
            signal_line = macd_line.ewm(span=9).mean()

            if macd_line.iloc[-1] > signal_line.iloc[-1] and macd_line.iloc[-2] <= signal_line.iloc[-2]:
                patterns_found.append({
                    "name": "MACD Bullish Crossover",
                    "type": "bullish",
                    "strength": 65,
                    "description": "MACD line crossed above signal line",
                })
            elif macd_line.iloc[-1] < signal_line.iloc[-1] and macd_line.iloc[-2] >= signal_line.iloc[-2]:
                patterns_found.append({
                    "name": "MACD Bearish Crossover",
                    "type": "bearish",
                    "strength": 65,
                    "description": "MACD line crossed below signal line",
                })

            # 4. Bollinger Band Squeeze / Breakout
            sma20 = close.rolling(20).mean()
            std20 = close.rolling(20).std()
            upper_band = sma20 + 2 * std20
            lower_band = sma20 - 2 * std20
            band_width = (upper_band - lower_band) / sma20 * 100
            current_bw = float(band_width.iloc[-1])
            avg_bw = float(band_width.iloc[-60:].mean()) if len(band_width) >= 60 else float(band_width.mean())

            if current_bw < avg_bw * 0.6:
                patterns_found.append({
                    "name": "Bollinger Squeeze",
                    "type": "neutral",
                    "strength": 60,
                    "description": "Bands tightening — big move incoming",
                })
            elif float(close.iloc[-1]) > float(upper_band.iloc[-1]):
                patterns_found.append({
                    "name": "Bollinger Breakout (Up)",
                    "type": "bullish",
                    "strength": 60,
                    "description": "Price broke above upper Bollinger Band",
                })
            elif float(close.iloc[-1]) < float(lower_band.iloc[-1]):
                patterns_found.append({
                    "name": "Bollinger Breakdown",
                    "type": "bearish",
                    "strength": 60,
                    "description": "Price broke below lower Bollinger Band",
                })

            # 5. Volume-Price Divergence
            vol = hist["Volume"].astype(float)
            if len(vol) >= 22:
                price_up = float(close.iloc[-1]) > float(close.iloc[-6])
                vol_down = float(vol.iloc[-5:].mean()) < float(vol.iloc[-22:-5].mean())
                price_down = float(close.iloc[-1]) < float(close.iloc[-6])
                vol_up = float(vol.iloc[-5:].mean()) > float(vol.iloc[-22:-5].mean()) * 1.3

                if price_up and vol_down:
                    patterns_found.append({
                        "name": "Volume-Price Divergence (Bearish)",
                        "type": "bearish",
                        "strength": 55,
                        "description": "Price rising on declining volume — weak rally",
                    })
                elif price_down and vol_up:
                    patterns_found.append({
                        "name": "Capitulation Volume",
                        "type": "bullish",
                        "strength": 55,
                        "description": "Price falling on heavy volume — potential washout",
                    })

            if patterns_found:
                info = stock_data.get_stock_info(ticker)
                current_price = float(close.iloc[-1])
                change_1d = float((close.iloc[-1] / close.iloc[-2] - 1) * 100)
                detections.append({
                    "ticker": ticker,
                    "name": info.get("shortName", ticker) if info else ticker,
                    "sector": info.get("sector", "N/A") if info else "N/A",
                    "price": round(current_price, 2),
                    "change1d": round(change_1d, 2),
                    "rsi": round(rsi_val, 1),
                    "patterns": patterns_found,
                    "patternCount": len(patterns_found),
                    "bullishCount": sum(1 for p in patterns_found if p["type"] == "bullish"),
                    "bearishCount": sum(1 for p in patterns_found if p["type"] == "bearish"),
                })
        except Exception:
            continue

    # Sort by number of patterns (most active first)
    detections.sort(key=lambda x: x["patternCount"], reverse=True)

    output = {
        "detections": detections[:limit],
        "summary": {
            "totalScanned": len(candidates),
            "withPatterns": len(detections),
            "topBullish": [d for d in detections if d["bullishCount"] > d["bearishCount"]][:5],
            "topBearish": [d for d in detections if d["bearishCount"] > d["bullishCount"]][:5],
        },
        "timestamp": pd.Timestamp.now().isoformat(),
    }

    cache.set(key, output)
    return output


@router.get("/stock/{ticker}")
def stock_patterns(ticker: str):
    """Get all detected patterns for a specific stock."""
    ticker = ticker.upper()
    key = f"patterns:{ticker}"
    cached = cache.get(key, 300)
    if cached:
        return cached

    hist = stock_data.get_price_history(ticker, "1y")
    if hist is None or len(hist) < 50:
        raise HTTPException(status_code=404, detail=f"Insufficient data for {ticker}")

    close = hist["Close"].astype(float)
    info = stock_data.get_stock_info(ticker)

    patterns = []

    # Run all pattern detections
    sma20 = close.rolling(20).mean()
    sma50 = close.rolling(50).mean()
    sma200 = close.rolling(200).mean() if len(close) >= 200 else None
    current = float(close.iloc[-1])

    # Price vs moving averages
    if current > float(sma20.iloc[-1]):
        patterns.append({"name": "Above 20-SMA", "type": "bullish", "strength": 40})
    else:
        patterns.append({"name": "Below 20-SMA", "type": "bearish", "strength": 40})

    if current > float(sma50.iloc[-1]):
        patterns.append({"name": "Above 50-SMA", "type": "bullish", "strength": 50})
    else:
        patterns.append({"name": "Below 50-SMA", "type": "bearish", "strength": 50})

    if sma200 is not None:
        if current > float(sma200.iloc[-1]):
            patterns.append({"name": "Above 200-SMA", "type": "bullish", "strength": 60})
        else:
            patterns.append({"name": "Below 200-SMA", "type": "bearish", "strength": 60})

    # RSI
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    rsi_val = float(rsi.iloc[-1])

    # 52-week position
    high_52 = float(close.max())
    low_52 = float(close.min())
    position_52 = ((current - low_52) / (high_52 - low_52)) * 100 if high_52 != low_52 else 50

    # Trend strength
    sma_stack = "bullish" if current > float(sma20.iloc[-1]) > float(sma50.iloc[-1]) else "bearish" if current < float(sma20.iloc[-1]) < float(sma50.iloc[-1]) else "mixed"

    result = {
        "ticker": ticker,
        "name": info.get("shortName", ticker) if info else ticker,
        "price": round(current, 2),
        "patterns": patterns,
        "indicators": {
            "rsi": round(rsi_val, 1),
            "sma20": round(float(sma20.iloc[-1]), 2),
            "sma50": round(float(sma50.iloc[-1]), 2),
            "sma200": round(float(sma200.iloc[-1]), 2) if sma200 is not None else None,
            "position52w": round(position_52, 1),
            "high52w": round(high_52, 2),
            "low52w": round(low_52, 2),
            "trendAlignment": sma_stack,
        },
        "outlook": "Bullish" if sum(1 for p in patterns if p["type"] == "bullish") > sum(1 for p in patterns if p["type"] == "bearish") else "Bearish",
    }

    cache.set(key, result)
    return result
