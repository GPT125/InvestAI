from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend import config
import yfinance as yf
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/stresstest", tags=["stresstest"])

# Historical crisis periods
CRISIS_SCENARIOS = {
    "dotcom": {"name": "Dot-Com Crash", "start": "2000-03-10", "end": "2002-10-09", "description": "The tech bubble burst, NASDAQ fell 78%"},
    "gfc2008": {"name": "2008 Financial Crisis", "start": "2007-10-09", "end": "2009-03-09", "description": "Housing crisis triggered global financial meltdown"},
    "covid": {"name": "COVID-19 Crash", "start": "2020-02-19", "end": "2020-03-23", "description": "Pandemic fears caused rapid market decline"},
    "flash2010": {"name": "2010 Flash Crash", "start": "2010-05-06", "end": "2010-05-07", "description": "Market briefly plunged ~9% in minutes"},
    "inflation2022": {"name": "2022 Inflation Bear", "start": "2022-01-03", "end": "2022-10-12", "description": "Fed rate hikes crushed growth stocks"},
    "brexit": {"name": "Brexit Vote", "start": "2016-06-23", "end": "2016-06-27", "description": "UK voted to leave the EU"},
    "taper2018": {"name": "2018 Q4 Selloff", "start": "2018-10-01", "end": "2018-12-24", "description": "Fed tightening + trade war fears"},
}


@router.get("/scenarios")
def list_scenarios():
    """List all available crisis scenarios."""
    return [{"id": k, **v} for k, v in CRISIS_SCENARIOS.items()]


@router.post("/run")
def run_stress_test(payload: dict):
    """Run stress test on a portfolio (list of holdings) against selected scenarios."""
    holdings = payload.get("holdings", [])
    scenarios = payload.get("scenarios", list(CRISIS_SCENARIOS.keys()))

    if not holdings:
        raise HTTPException(status_code=400, detail="No holdings provided")

    tickers = [h["ticker"].upper() for h in holdings]
    weights = {}
    for h in holdings:
        t = h["ticker"].upper()
        weights[t] = h.get("weight", h.get("shares", 1))

    total_weight = sum(weights.values())
    for t in weights:
        weights[t] = weights[t] / total_weight

    key = f"stress:{':'.join(sorted(tickers))}:{':'.join(sorted(scenarios))}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    results = []

    for scenario_id in scenarios:
        if scenario_id not in CRISIS_SCENARIOS:
            continue

        scenario = CRISIS_SCENARIOS[scenario_id]
        scenario_result = {
            "id": scenario_id,
            "name": scenario["name"],
            "description": scenario["description"],
            "period": f"{scenario['start']} to {scenario['end']}",
            "stockResults": [],
            "portfolioReturn": 0,
        }

        portfolio_return = 0

        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(start=scenario["start"], end=scenario["end"])

                if hist is not None and len(hist) >= 2:
                    start_price = float(hist["Close"].iloc[0])
                    end_price = float(hist["Close"].iloc[-1])
                    min_price = float(hist["Close"].min())
                    stock_return = ((end_price - start_price) / start_price) * 100
                    max_drawdown = ((min_price - start_price) / start_price) * 100

                    scenario_result["stockResults"].append({
                        "ticker": ticker,
                        "startPrice": round(start_price, 2),
                        "endPrice": round(end_price, 2),
                        "return": round(stock_return, 2),
                        "maxDrawdown": round(max_drawdown, 2),
                        "worstPrice": round(min_price, 2),
                        "recoveryNeeded": round(((start_price / end_price) - 1) * 100, 2) if end_price < start_price else 0,
                    })

                    portfolio_return += stock_return * weights.get(ticker, 0)
                else:
                    scenario_result["stockResults"].append({
                        "ticker": ticker,
                        "return": None,
                        "note": "No data for this period (stock may not have existed)"
                    })
            except Exception:
                scenario_result["stockResults"].append({
                    "ticker": ticker,
                    "return": None,
                    "note": "Failed to fetch data"
                })

        scenario_result["portfolioReturn"] = round(portfolio_return, 2)
        results.append(scenario_result)

    # S&P 500 benchmark
    spy_results = []
    for scenario_id in scenarios:
        if scenario_id not in CRISIS_SCENARIOS:
            continue
        scenario = CRISIS_SCENARIOS[scenario_id]
        try:
            spy = yf.Ticker("^GSPC")
            hist = spy.history(start=scenario["start"], end=scenario["end"])
            if hist is not None and len(hist) >= 2:
                spy_return = ((float(hist["Close"].iloc[-1]) - float(hist["Close"].iloc[0])) / float(hist["Close"].iloc[0])) * 100
                spy_results.append({"id": scenario_id, "return": round(spy_return, 2)})
            else:
                spy_results.append({"id": scenario_id, "return": None})
        except:
            spy_results.append({"id": scenario_id, "return": None})

    output = {"scenarios": results, "benchmark": spy_results}
    cache.set(key, output)
    return output


@router.get("/volatility-profile")
def volatility_profile(tickers: str = Query(..., description="Comma-separated tickers")):
    """Calculate volatility and risk metrics for given tickers."""
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    key = f"vol_profile:{':'.join(sorted(ticker_list))}"
    cached = cache.get(key, 1800)
    if cached:
        return cached

    profiles = []
    for ticker in ticker_list:
        try:
            hist = stock_data.get_price_history(ticker, "1y")
            if hist is None or hist.empty:
                continue

            close = hist["Close"].astype(float)
            returns = close.pct_change().dropna()

            daily_vol = float(returns.std())
            annual_vol = daily_vol * np.sqrt(252)
            max_drawdown = float(((close / close.cummax()) - 1).min())

            # Value at Risk (95% confidence)
            var_95 = float(np.percentile(returns, 5))

            # Sharpe-like metric (excess return / vol, assuming 5% risk-free)
            annual_return = float(((close.iloc[-1] / close.iloc[0]) - 1))
            sharpe = (annual_return - 0.05) / annual_vol if annual_vol > 0 else 0

            # Beta vs S&P
            try:
                spy_hist = stock_data.get_price_history("^GSPC", "1y")
                if spy_hist is not None and not spy_hist.empty:
                    spy_returns = spy_hist["Close"].astype(float).pct_change().dropna()
                    min_len = min(len(returns), len(spy_returns))
                    cov = np.cov(returns.tail(min_len), spy_returns.tail(min_len))
                    beta = cov[0][1] / cov[1][1] if cov[1][1] != 0 else 1
                else:
                    beta = None
            except:
                beta = None

            profiles.append({
                "ticker": ticker,
                "dailyVolatility": round(daily_vol * 100, 2),
                "annualVolatility": round(annual_vol * 100, 2),
                "maxDrawdown": round(max_drawdown * 100, 2),
                "var95": round(var_95 * 100, 2),
                "sharpeRatio": round(sharpe, 2),
                "beta": round(beta, 2) if beta is not None else None,
                "annualReturn": round(annual_return * 100, 2),
                "riskLevel": "High" if annual_vol > 0.4 else "Medium" if annual_vol > 0.2 else "Low",
            })
        except:
            continue

    result = {"profiles": profiles}
    cache.set(key, result)
    return result
