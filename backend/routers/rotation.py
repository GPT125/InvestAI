from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/rotation", tags=["rotation"])

SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Consumer Discretionary": "XLY",
    "Industrials": "XLI",
    "Energy": "XLE",
    "Utilities": "XLU",
    "Materials": "XLB",
    "Real Estate": "XLRE",
    "Consumer Staples": "XLP",
    "Communication Services": "XLC",
}


@router.get("/flow")
def sector_rotation_flow(period: str = Query("6mo")):
    """
    Sector Rotation Tracker — shows money-flow between sectors over rolling
    windows to identify where institutional money is moving.
    """
    key = f"rotation_flow:{period}"
    cached = cache.get(key, 900)
    if cached:
        return cached

    sectors_data = []
    for name, etf in SECTOR_ETFS.items():
        try:
            hist = stock_data.get_price_history(etf, period)
            if hist is None or len(hist) < 22:
                continue
            close = hist["Close"].astype(float)
            volume = hist["Volume"].astype(float)

            # Money flow approximation: price change * volume
            money_flow_recent = float((close.iloc[-5:] * volume.iloc[-5:]).sum())
            money_flow_prior = float((close.iloc[-10:-5] * volume.iloc[-10:-5]).sum())
            flow_change = ((money_flow_recent - money_flow_prior) / money_flow_prior * 100) if money_flow_prior > 0 else 0

            # Performance across windows
            ret_1w = float((close.iloc[-1] / close.iloc[-6] - 1) * 100) if len(close) >= 6 else 0
            ret_1m = float((close.iloc[-1] / close.iloc[-22] - 1) * 100) if len(close) >= 22 else 0
            ret_3m = float((close.iloc[-1] / close.iloc[-66] - 1) * 100) if len(close) >= 66 else 0

            # Relative momentum vs SPY
            spy_hist = stock_data.get_price_history("SPY", period)
            rel_strength = 0
            if spy_hist is not None and len(spy_hist) >= 22:
                spy_close = spy_hist["Close"].astype(float)
                spy_ret_1m = float((spy_close.iloc[-1] / spy_close.iloc[-22] - 1) * 100)
                rel_strength = ret_1m - spy_ret_1m

            # Trend phase classification
            if ret_1w > 0 and ret_1m > 0 and rel_strength > 0:
                phase = "Leading"
            elif ret_1w > 0 and rel_strength <= 0:
                phase = "Improving"
            elif ret_1w <= 0 and rel_strength > 0:
                phase = "Weakening"
            else:
                phase = "Lagging"

            sectors_data.append({
                "sector": name,
                "etf": etf,
                "price": round(float(close.iloc[-1]), 2),
                "return1w": round(ret_1w, 2),
                "return1m": round(ret_1m, 2),
                "return3m": round(ret_3m, 2),
                "flowChange": round(flow_change, 2),
                "relativeStrength": round(rel_strength, 2),
                "phase": phase,
                "avgVolume": int(float(volume.iloc[-20:].mean())),
            })
        except Exception:
            continue

    # Build rotation timeline (weekly returns for last 12 weeks)
    timeline = []
    for name, etf in SECTOR_ETFS.items():
        try:
            hist = stock_data.get_price_history(etf, "6mo")
            if hist is None or len(hist) < 60:
                continue
            close = hist["Close"].astype(float)
            weekly_data = []
            for w in range(12, 0, -1):
                end_idx = -((w - 1) * 5 + 1) if w > 1 else -1
                start_idx = -(w * 5 + 1)
                if abs(start_idx) < len(close) and abs(end_idx) < len(close):
                    ret = float((close.iloc[end_idx] / close.iloc[start_idx] - 1) * 100)
                    weekly_data.append(round(ret, 2))
                else:
                    weekly_data.append(0)
            timeline.append({"sector": name, "weeklyReturns": weekly_data})
        except Exception:
            continue

    # Sort by flow change (most inflow first)
    sectors_data.sort(key=lambda x: x["flowChange"], reverse=True)

    output = {
        "sectors": sectors_data,
        "timeline": timeline,
        "timestamp": pd.Timestamp.now().isoformat(),
    }
    cache.set(key, output)
    return output


@router.get("/rrg")
def relative_rotation_graph():
    """
    Relative Rotation Graph (RRG) data — plots sectors on a 2D plane
    of Relative Strength (RS) vs Momentum (RS-Momentum).
    """
    key = "rrg_data"
    cached = cache.get(key, 900)
    if cached:
        return cached

    spy_hist = stock_data.get_price_history("SPY", "1y")
    if spy_hist is None or len(spy_hist) < 100:
        raise HTTPException(status_code=500, detail="Failed to fetch benchmark data")
    spy_close = spy_hist["Close"].astype(float)

    rrg_points = []
    for name, etf in SECTOR_ETFS.items():
        try:
            hist = stock_data.get_price_history(etf, "1y")
            if hist is None or len(hist) < 100:
                continue
            close = hist["Close"].astype(float)
            min_len = min(len(close), len(spy_close))
            close = close.tail(min_len)
            spy_c = spy_close.tail(min_len)

            # RS-Ratio: sector/SPY ratio normalized
            rs_ratio = close / spy_c
            rs_current = float(rs_ratio.iloc[-1])
            rs_avg = float(rs_ratio.rolling(50).mean().iloc[-1])
            rs_normalized = ((rs_current / rs_avg) - 1) * 100

            # RS-Momentum: rate of change of RS
            rs_prev = float(rs_ratio.iloc[-6])
            rs_momentum = ((rs_current / rs_prev) - 1) * 100

            # Quadrant classification
            if rs_normalized > 0 and rs_momentum > 0:
                quadrant = "Leading"
            elif rs_normalized < 0 and rs_momentum > 0:
                quadrant = "Improving"
            elif rs_normalized > 0 and rs_momentum < 0:
                quadrant = "Weakening"
            else:
                quadrant = "Lagging"

            rrg_points.append({
                "sector": name,
                "etf": etf,
                "rsRatio": round(rs_normalized, 2),
                "rsMomentum": round(rs_momentum, 2),
                "quadrant": quadrant,
            })
        except Exception:
            continue

    output = {"points": rrg_points, "timestamp": pd.Timestamp.now().isoformat()}
    cache.set(key, output)
    return output
