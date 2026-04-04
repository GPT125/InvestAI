from fastapi import APIRouter, HTTPException
from backend.services import stock_data, cache
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/xray", tags=["xray"])


@router.post("/analyze")
def portfolio_xray(payload: dict):
    """
    Portfolio X-Ray — deep risk analysis revealing hidden correlations,
    concentration risk, factor exposures, and tail-risk metrics.
    """
    holdings = payload.get("holdings", [])
    if not holdings:
        raise HTTPException(status_code=400, detail="No holdings provided")

    tickers = [h["ticker"].upper() for h in holdings]
    weights = {}
    for h in holdings:
        t = h["ticker"].upper()
        w = h.get("weight") or h.get("shares", 1)
        weights[t] = w
    total_w = sum(weights.values())
    for t in weights:
        weights[t] = weights[t] / total_w

    key = f"xray:{':'.join(sorted(tickers))}"
    cached = cache.get(key, 1800)
    if cached:
        return cached

    # Gather returns
    returns_data = {}
    infos = {}
    for t in tickers:
        try:
            hist = stock_data.get_price_history(t, "1y")
            if hist is not None and len(hist) >= 50:
                returns_data[t] = hist["Close"].astype(float).pct_change().dropna()
            info = stock_data.get_stock_info(t)
            if info:
                infos[t] = info
        except Exception:
            continue

    valid_tickers = [t for t in tickers if t in returns_data]
    if len(valid_tickers) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 holdings with data")

    # Align returns
    min_len = min(len(returns_data[t]) for t in valid_tickers)
    aligned = {t: returns_data[t].tail(min_len).values for t in valid_tickers}
    returns_matrix = np.array([aligned[t] for t in valid_tickers])

    # 1. Correlation matrix
    corr_matrix = np.corrcoef(returns_matrix)
    correlation_pairs = []
    for i, ta in enumerate(valid_tickers):
        for j, tb in enumerate(valid_tickers):
            if i < j:
                correlation_pairs.append({
                    "tickerA": ta,
                    "tickerB": tb,
                    "correlation": round(float(corr_matrix[i][j]), 3),
                })
    correlation_pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # Average correlation (concentration risk)
    avg_corr = float(np.mean([abs(p["correlation"]) for p in correlation_pairs]))

    # 2. Concentration risk
    sector_map = {}
    for t in valid_tickers:
        s = infos.get(t, {}).get("sector", "Unknown")
        sector_map.setdefault(s, []).append(t)
    sector_weights = {}
    for s, ts in sector_map.items():
        sector_weights[s] = round(sum(weights.get(t, 0) for t in ts) * 100, 1)

    # Herfindahl index (position concentration)
    hhi_position = sum((weights.get(t, 0) * 100) ** 2 for t in valid_tickers)
    hhi_sector = sum(w ** 2 for w in sector_weights.values())

    # 3. Factor exposures
    beta_values = []
    vol_values = []
    try:
        spy_hist = stock_data.get_price_history("^GSPC", "1y")
        if spy_hist is not None:
            spy_ret = spy_hist["Close"].astype(float).pct_change().dropna().tail(min_len).values
    except Exception:
        spy_ret = None

    factor_data = []
    for t in valid_tickers:
        t_ret = aligned[t]
        vol = float(np.std(t_ret)) * np.sqrt(252) * 100
        vol_values.append(vol)

        beta = 1.0
        if spy_ret is not None and len(spy_ret) == len(t_ret):
            cov = np.cov(t_ret, spy_ret)
            if cov[1][1] != 0:
                beta = float(cov[0][1] / cov[1][1])
        beta_values.append(beta)

        sharpe = 0
        ann_ret = float(np.mean(t_ret)) * 252
        ann_vol = float(np.std(t_ret)) * np.sqrt(252)
        if ann_vol > 0:
            sharpe = (ann_ret - 0.05) / ann_vol

        factor_data.append({
            "ticker": t,
            "weight": round(weights.get(t, 0) * 100, 1),
            "beta": round(beta, 2),
            "volatility": round(vol, 1),
            "sharpe": round(sharpe, 2),
            "annualReturn": round(ann_ret * 100, 1),
        })

    # Portfolio-level metrics
    port_weights_arr = np.array([weights.get(t, 0) for t in valid_tickers])
    port_return = float(np.sum([aligned[t] for t in valid_tickers] * port_weights_arr.reshape(-1, 1), axis=0).mean()) * 252
    port_vol = float(np.sqrt(port_weights_arr @ np.cov(returns_matrix) @ port_weights_arr)) * np.sqrt(252)
    port_beta = float(np.sum([beta_values[i] * port_weights_arr[i] for i in range(len(valid_tickers))]))

    # 4. Tail risk
    portfolio_returns = np.sum([aligned[t] * weights.get(t, 0) for t in valid_tickers], axis=0)
    var_95 = float(np.percentile(portfolio_returns, 5)) * 100
    var_99 = float(np.percentile(portfolio_returns, 1)) * 100
    cvar_95 = float(np.mean(portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)])) * 100
    max_dd = float(((pd.Series(portfolio_returns).cumsum().apply(np.exp) / pd.Series(portfolio_returns).cumsum().apply(np.exp).cummax()) - 1).min()) * 100

    # 5. Diversification score
    # Perfect diversification = low correlation + balanced weights + sector spread
    weight_balance = 1 - (hhi_position / 10000)  # Normalized
    sector_balance = 1 - (hhi_sector / 10000)
    corr_score = 1 - avg_corr
    div_score = round((weight_balance * 30 + sector_balance * 30 + corr_score * 40), 1)
    div_score = max(0, min(100, div_score))

    # 6. Risk clusters
    clusters = []
    for pair in correlation_pairs:
        if pair["correlation"] > 0.7:
            clusters.append({
                "stocks": [pair["tickerA"], pair["tickerB"]],
                "correlation": pair["correlation"],
                "risk": "High correlation — moves together, limited diversification benefit",
            })

    result = {
        "portfolio": {
            "annualReturn": round(port_return * 100, 1),
            "annualVolatility": round(port_vol * 100, 1),
            "beta": round(port_beta, 2),
            "sharpe": round((port_return - 0.05) / port_vol, 2) if port_vol > 0 else 0,
            "var95": round(var_95, 2),
            "var99": round(var_99, 2),
            "cvar95": round(cvar_95, 2),
            "maxDrawdown": round(max_dd, 2),
        },
        "diversificationScore": div_score,
        "diversificationLabel": "Excellent" if div_score >= 70 else "Good" if div_score >= 50 else "Fair" if div_score >= 30 else "Poor",
        "concentrationRisk": {
            "hhiPosition": round(hhi_position, 1),
            "hhiSector": round(hhi_sector, 1),
            "topHolding": max(valid_tickers, key=lambda t: weights.get(t, 0)),
            "topHoldingWeight": round(max(weights.get(t, 0) for t in valid_tickers) * 100, 1),
            "sectorWeights": sector_weights,
        },
        "correlationPairs": correlation_pairs[:10],
        "avgCorrelation": round(avg_corr, 3),
        "riskClusters": clusters,
        "holdings": factor_data,
    }

    cache.set(key, result)
    return result
