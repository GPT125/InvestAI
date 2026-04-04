from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend.data.sp500_tickers import SP500_TICKERS
from backend import config
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/fear-greed")
def fear_greed_index():
    """Custom Fear & Greed composite index using multiple market signals."""
    key = "fear_greed"
    cached = cache.get(key, 600)
    if cached:
        return cached

    signals = {}
    scores = []

    # 1. VIX level (fear gauge)
    try:
        vix = yf.Ticker("^VIX")
        vix_info = vix.info
        vix_val = vix_info.get("regularMarketPrice") or vix_info.get("previousClose", 20)
        if vix_val < 12:
            s = 90
        elif vix_val < 15:
            s = 75
        elif vix_val < 20:
            s = 55
        elif vix_val < 25:
            s = 35
        elif vix_val < 30:
            s = 20
        else:
            s = 5
        signals["vix"] = {"value": round(vix_val, 2), "score": s, "label": "Market Volatility (VIX)"}
        scores.append(s)
    except:
        pass

    # 2. Market momentum (S&P 500 vs 125-day MA)
    try:
        spy_hist = stock_data.get_price_history("^GSPC", "1y")
        if spy_hist is not None and len(spy_hist) >= 125:
            close = spy_hist["Close"].astype(float)
            current = float(close.iloc[-1])
            ma125 = float(close.rolling(125).mean().iloc[-1])
            spread = ((current - ma125) / ma125) * 100
            if spread > 5:
                s = 85
            elif spread > 2:
                s = 70
            elif spread > 0:
                s = 55
            elif spread > -2:
                s = 40
            elif spread > -5:
                s = 25
            else:
                s = 10
            signals["momentum"] = {"value": round(spread, 2), "score": s, "label": "Market Momentum"}
            scores.append(s)
    except:
        pass

    # 3. Market breadth (advancing vs declining)
    try:
        advancing = 0
        total = 0
        for ticker in SP500_TICKERS[:50]:
            try:
                info = stock_data.get_stock_info(ticker)
                if info:
                    change = info.get("regularMarketChangePercent", 0) or 0
                    if change > 0:
                        advancing += 1
                    total += 1
            except:
                continue

        if total > 0:
            breadth_pct = (advancing / total) * 100
            if breadth_pct > 70:
                s = 85
            elif breadth_pct > 55:
                s = 65
            elif breadth_pct > 45:
                s = 50
            elif breadth_pct > 30:
                s = 35
            else:
                s = 15
            signals["breadth"] = {"value": round(breadth_pct, 1), "score": s, "label": "Market Breadth"}
            scores.append(s)
    except:
        pass

    # 4. Safe haven demand (gold vs stocks 20-day)
    try:
        gold_hist = stock_data.get_price_history("GLD", "3mo")
        spy_hist2 = stock_data.get_price_history("^GSPC", "3mo")
        if gold_hist is not None and spy_hist2 is not None:
            gold_ret = float(((gold_hist["Close"].iloc[-1] / gold_hist["Close"].iloc[-20]) - 1) * 100)
            spy_ret = float(((spy_hist2["Close"].iloc[-1] / spy_hist2["Close"].iloc[-20]) - 1) * 100)
            diff = spy_ret - gold_ret
            if diff > 3:
                s = 80
            elif diff > 0:
                s = 60
            elif diff > -3:
                s = 40
            else:
                s = 20
            signals["safeHaven"] = {"value": round(diff, 2), "score": s, "label": "Safe Haven Demand"}
            scores.append(s)
    except:
        pass

    # 5. Junk bond demand (HYG vs LQD)
    try:
        hyg_hist = stock_data.get_price_history("HYG", "3mo")
        lqd_hist = stock_data.get_price_history("LQD", "3mo")
        if hyg_hist is not None and lqd_hist is not None and len(hyg_hist) >= 20 and len(lqd_hist) >= 20:
            hyg_ret = float(((hyg_hist["Close"].iloc[-1] / hyg_hist["Close"].iloc[-20]) - 1) * 100)
            lqd_ret = float(((lqd_hist["Close"].iloc[-1] / lqd_hist["Close"].iloc[-20]) - 1) * 100)
            spread = hyg_ret - lqd_ret
            if spread > 1:
                s = 75
            elif spread > 0:
                s = 60
            elif spread > -1:
                s = 40
            else:
                s = 25
            signals["junkBond"] = {"value": round(spread, 2), "score": s, "label": "Junk Bond Demand"}
            scores.append(s)
    except:
        pass

    # Composite
    composite = round(sum(scores) / len(scores), 1) if scores else 50

    if composite >= 75:
        label = "Extreme Greed"
    elif composite >= 60:
        label = "Greed"
    elif composite >= 40:
        label = "Neutral"
    elif composite >= 25:
        label = "Fear"
    else:
        label = "Extreme Fear"

    result = {
        "composite": composite,
        "label": label,
        "signals": signals,
        "timestamp": pd.Timestamp.now().isoformat(),
    }

    cache.set(key, result)
    return result


@router.get("/sector-volatility")
def sector_volatility_heatmap():
    """Get sector-level volatility data for a heatmap visualization."""
    key = "sector_vol_heatmap"
    cached = cache.get(key, 1800)
    if cached:
        return cached

    sector_etfs = {
        "Technology": "XLK",
        "Healthcare": "XLV",
        "Financials": "XLF",
        "Consumer Disc.": "XLY",
        "Industrials": "XLI",
        "Energy": "XLE",
        "Utilities": "XLU",
        "Materials": "XLB",
        "Real Estate": "XLRE",
        "Consumer Staples": "XLP",
        "Communication": "XLC",
    }

    sectors = []
    for name, etf in sector_etfs.items():
        try:
            hist = stock_data.get_price_history(etf, "3mo")
            if hist is None or hist.empty:
                continue

            close = hist["Close"].astype(float)
            returns = close.pct_change().dropna()

            daily_vol = float(returns.std())
            annual_vol = daily_vol * np.sqrt(252)

            # Recent performance
            ret_1d = float(((close.iloc[-1] / close.iloc[-2]) - 1) * 100) if len(close) >= 2 else 0
            ret_1w = float(((close.iloc[-1] / close.iloc[-5]) - 1) * 100) if len(close) >= 5 else 0
            ret_1m = float(((close.iloc[-1] / close.iloc[-22]) - 1) * 100) if len(close) >= 22 else 0
            ret_3m = float(((close.iloc[-1] / close.iloc[0]) - 1) * 100)

            sectors.append({
                "sector": name,
                "etf": etf,
                "volatility": round(annual_vol * 100, 2),
                "dailyVol": round(daily_vol * 100, 3),
                "return1d": round(ret_1d, 2),
                "return1w": round(ret_1w, 2),
                "return1m": round(ret_1m, 2),
                "return3m": round(ret_3m, 2),
                "price": round(float(close.iloc[-1]), 2),
            })
        except:
            continue

    result = {"sectors": sectors}
    cache.set(key, result)
    return result


@router.get("/stock-dna/{ticker}")
def stock_dna(ticker: str):
    """Generate a 'DNA fingerprint' - a multi-dimensional profile of a stock."""
    ticker = ticker.upper()
    key = f"dna:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    info = stock_data.get_stock_info(ticker)
    if not info:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

    hist = stock_data.get_price_history(ticker, "1y")

    # Calculate DNA dimensions (0-100 scale)
    dna = {}

    # 1. Volatility (inverse - lower vol = higher score)
    if hist is not None and not hist.empty:
        returns = hist["Close"].astype(float).pct_change().dropna()
        annual_vol = float(returns.std()) * np.sqrt(252)
        dna["stability"] = max(0, min(100, int(100 - annual_vol * 200)))
    else:
        dna["stability"] = 50

    # 2. Growth
    rev_growth = info.get("revenueGrowth") or 0
    earn_growth = info.get("earningsGrowth") or 0
    dna["growth"] = max(0, min(100, int(50 + (rev_growth + earn_growth) * 100)))

    # 3. Value (low P/E = high value score)
    pe = info.get("trailingPE") or 25
    if pe <= 0:
        dna["value"] = 30
    elif pe < 10:
        dna["value"] = 95
    elif pe < 15:
        dna["value"] = 80
    elif pe < 20:
        dna["value"] = 65
    elif pe < 30:
        dna["value"] = 50
    elif pe < 50:
        dna["value"] = 30
    else:
        dna["value"] = 15

    # 4. Momentum
    if hist is not None and len(hist) >= 50:
        close = hist["Close"].astype(float)
        sma50 = float(close.rolling(50).mean().iloc[-1])
        current = float(close.iloc[-1])
        momentum_pct = ((current - sma50) / sma50) * 100
        dna["momentum"] = max(0, min(100, int(50 + momentum_pct * 3)))
    else:
        dna["momentum"] = 50

    # 5. Income (dividend yield)
    div_yield = (info.get("dividendYield") or 0) / 100 if info.get("dividendYield") else 0
    dna["income"] = max(0, min(100, int(div_yield * 2000)))

    # 6. Size (market cap)
    mcap = info.get("marketCap") or 0
    if mcap > 200e9:
        dna["size"] = 95
    elif mcap > 50e9:
        dna["size"] = 80
    elif mcap > 10e9:
        dna["size"] = 60
    elif mcap > 2e9:
        dna["size"] = 40
    else:
        dna["size"] = 20

    # 7. Quality (ROE + profit margin)
    roe = (info.get("returnOnEquity") or 0) * 100
    margin = (info.get("profitMargins") or 0) * 100
    dna["quality"] = max(0, min(100, int((roe + margin) / 2 + 30)))

    # 8. Resilience (low debt + high current ratio)
    dte = info.get("debtToEquity") or 100
    current_ratio = info.get("currentRatio") or 1
    debt_score = max(0, 100 - dte) if dte >= 0 else 50
    ratio_score = min(100, current_ratio * 40)
    dna["resilience"] = max(0, min(100, int((debt_score + ratio_score) / 2)))

    result = {
        "ticker": ticker,
        "name": info.get("shortName", ticker),
        "dna": dna,
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
    }

    cache.set(key, result)
    return result


@router.get("/earnings-surprises/{ticker}")
def earnings_surprises(ticker: str):
    """Get earnings surprise history - beat/miss pattern."""
    ticker = ticker.upper()
    key = f"earn_surprise:{ticker}"
    cached = cache.get(key, 7200)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)

        surprises = []

        # Try earnings_dates first (has actual vs estimate)
        try:
            edates = stock.earnings_dates
            if edates is not None and not edates.empty:
                for idx, row in edates.head(16).iterrows():
                    actual = row.get("Reported EPS")
                    estimate = row.get("EPS Estimate")
                    surprise_pct = row.get("Surprise(%)")

                    if pd.notna(actual) and pd.notna(estimate):
                        surprises.append({
                            "date": idx.strftime("%Y-%m-%d"),
                            "quarter": f"Q{(idx.month - 1) // 3 + 1} {idx.year}",
                            "actual": round(float(actual), 2),
                            "estimate": round(float(estimate), 2),
                            "surprise": round(float(surprise_pct), 2) if pd.notna(surprise_pct) else round(((float(actual) - float(estimate)) / abs(float(estimate))) * 100, 2) if float(estimate) != 0 else 0,
                            "beat": float(actual) > float(estimate),
                        })
        except:
            pass

        if not surprises:
            return {"ticker": ticker, "surprises": [], "stats": None}

        # Calculate stats
        beats = sum(1 for s in surprises if s["beat"])
        total = len(surprises)
        avg_surprise = sum(s["surprise"] for s in surprises) / total if total > 0 else 0

        # Streak
        streak = 0
        streak_type = None
        for s in surprises:
            if streak_type is None:
                streak_type = "beat" if s["beat"] else "miss"
                streak = 1
            elif (s["beat"] and streak_type == "beat") or (not s["beat"] and streak_type == "miss"):
                streak += 1
            else:
                break

        result = {
            "ticker": ticker,
            "surprises": surprises,
            "stats": {
                "beatRate": round((beats / total) * 100, 1) if total > 0 else 0,
                "totalQuarters": total,
                "beats": beats,
                "misses": total - beats,
                "avgSurprise": round(avg_surprise, 2),
                "currentStreak": streak,
                "streakType": streak_type,
            },
        }

        cache.set(key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insider/{ticker}")
def insider_activity(ticker: str):
    """Get insider trading activity."""
    ticker = ticker.upper()
    key = f"insider:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)

        transactions = []

        # Try insider_transactions
        try:
            insiders = stock.insider_transactions
            if insiders is not None and not insiders.empty:
                for _, row in insiders.head(20).iterrows():
                    transactions.append({
                        "insider": str(row.get("Insider", "")),
                        "relation": str(row.get("Position", row.get("Relationship", ""))),
                        "type": str(row.get("Transaction", "")),
                        "date": row.get("Start Date").strftime("%Y-%m-%d") if hasattr(row.get("Start Date"), "strftime") else str(row.get("Start Date", "")),
                        "shares": int(row.get("Shares", 0)) if pd.notna(row.get("Shares")) else 0,
                        "value": float(row.get("Value", 0)) if pd.notna(row.get("Value")) else 0,
                    })
        except:
            pass

        # Summary
        buys = sum(1 for t in transactions if "buy" in t.get("type", "").lower() or "purchase" in t.get("type", "").lower())
        sells = sum(1 for t in transactions if "sale" in t.get("type", "").lower() or "sell" in t.get("type", "").lower())

        result = {
            "ticker": ticker,
            "transactions": transactions,
            "summary": {
                "totalTransactions": len(transactions),
                "buys": buys,
                "sells": sells,
                "netSentiment": "Bullish" if buys > sells else "Bearish" if sells > buys else "Neutral",
            },
        }

        cache.set(key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/price-targets/{ticker}")
def price_target_distribution(ticker: str):
    """Get price target distribution from analysts."""
    ticker = ticker.upper()
    key = f"pt_dist:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    try:
        info = stock_data.get_stock_info(ticker)
        if not info:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

        current_price = info.get("regularMarketPrice") or info.get("currentPrice", 0)
        target_low = info.get("targetLowPrice")
        target_mean = info.get("targetMeanPrice")
        target_median = info.get("targetMedianPrice")
        target_high = info.get("targetHighPrice")
        num_analysts = info.get("numberOfAnalystOpinions", 0)

        # Calculate upside/downside
        upside_mean = round(((target_mean - current_price) / current_price) * 100, 2) if target_mean and current_price else None
        upside_high = round(((target_high - current_price) / current_price) * 100, 2) if target_high and current_price else None
        downside_low = round(((target_low - current_price) / current_price) * 100, 2) if target_low and current_price else None

        # Construct a simulated distribution
        distribution = []
        if target_low and target_high and num_analysts and num_analysts > 0:
            spread = target_high - target_low
            bucket_size = spread / 8 if spread > 0 else 1
            for i in range(8):
                bucket_low = target_low + i * bucket_size
                bucket_high = bucket_low + bucket_size
                # Estimate count (bell curve approximation)
                center = (target_low + target_high) / 2
                distance = abs((bucket_low + bucket_high) / 2 - center) / (spread / 2)
                weight = max(0.1, 1 - distance ** 2)
                estimated_count = max(1, round(weight * num_analysts / 4))
                distribution.append({
                    "rangeStart": round(bucket_low, 2),
                    "rangeEnd": round(bucket_high, 2),
                    "count": estimated_count,
                })

        result = {
            "ticker": ticker,
            "currentPrice": round(current_price, 2) if current_price else None,
            "targetLow": round(target_low, 2) if target_low else None,
            "targetMean": round(target_mean, 2) if target_mean else None,
            "targetMedian": round(target_median, 2) if target_median else None,
            "targetHigh": round(target_high, 2) if target_high else None,
            "numAnalysts": num_analysts,
            "upsideMean": upside_mean,
            "upsideHigh": upside_high,
            "downsideLow": downside_low,
            "distribution": distribution,
            "recommendation": info.get("recommendationKey", ""),
        }

        cache.set(key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compatibility")
def portfolio_compatibility(
    ticker: str = Query(...),
    portfolio_tickers: str = Query(..., description="Comma-separated existing portfolio tickers"),
):
    """Check how well a stock fits with an existing portfolio (diversification score)."""
    ticker = ticker.upper()
    existing = [t.strip().upper() for t in portfolio_tickers.split(",")]

    key = f"compat:{ticker}:{':'.join(sorted(existing))}"
    cached = cache.get(key, 1800)
    if cached:
        return cached

    try:
        # Get correlation with existing holdings
        all_tickers = [ticker] + existing
        returns_data = {}

        for t in all_tickers:
            hist = stock_data.get_price_history(t, "1y")
            if hist is not None and not hist.empty:
                returns_data[t] = hist["Close"].astype(float).pct_change().dropna()

        if ticker not in returns_data:
            raise HTTPException(status_code=404, detail=f"No data for {ticker}")

        # Calculate correlations
        correlations = {}
        avg_correlation = 0
        count = 0

        for t in existing:
            if t in returns_data:
                min_len = min(len(returns_data[ticker]), len(returns_data[t]))
                if min_len > 20:
                    corr = float(np.corrcoef(
                        returns_data[ticker].tail(min_len),
                        returns_data[t].tail(min_len)
                    )[0][1])
                    correlations[t] = round(corr, 3)
                    avg_correlation += abs(corr)
                    count += 1

        avg_correlation = avg_correlation / count if count > 0 else 0

        # Diversification score (lower correlation = better diversification)
        diversification_score = max(0, min(100, int((1 - avg_correlation) * 100)))

        # Sector overlap check
        new_info = stock_data.get_stock_info(ticker)
        new_sector = new_info.get("sector", "Unknown") if new_info else "Unknown"

        sector_overlap = 0
        for t in existing:
            t_info = stock_data.get_stock_info(t)
            if t_info and t_info.get("sector") == new_sector:
                sector_overlap += 1

        sector_concentration = round(sector_overlap / max(len(existing), 1) * 100, 1)

        # Overall compatibility
        overall = round(diversification_score * 0.6 + (100 - sector_concentration) * 0.4)

        result = {
            "ticker": ticker,
            "name": new_info.get("shortName", ticker) if new_info else ticker,
            "sector": new_sector,
            "correlations": correlations,
            "avgCorrelation": round(avg_correlation, 3),
            "diversificationScore": diversification_score,
            "sectorOverlap": sector_overlap,
            "sectorConcentration": sector_concentration,
            "overallCompatibility": overall,
            "recommendation": "Excellent fit" if overall >= 70 else "Good fit" if overall >= 50 else "Moderate overlap" if overall >= 30 else "High overlap - consider alternatives",
        }

        cache.set(key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
