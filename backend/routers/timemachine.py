from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend import config
import yfinance as yf
import pandas as pd
from datetime import datetime

router = APIRouter(prefix="/api/timemachine", tags=["timemachine"])


@router.get("/simulate")
def simulate_investment(
    ticker: str = Query(...),
    amount: float = Query(1000),
    start_date: str = Query(..., description="YYYY-MM-DD"),
    include_dividends: bool = Query(True),
):
    """Simulate a historical investment with reinvested dividends vs S&P 500."""
    ticker = ticker.upper()
    key = f"timemachine:{ticker}:{amount}:{start_date}:{include_dividends}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        spy = yf.Ticker("^GSPC")

        start = pd.Timestamp(start_date)

        stock_hist = stock.history(start=start, auto_adjust=False)
        spy_hist = spy.history(start=start, auto_adjust=False)

        if stock_hist is None or stock_hist.empty:
            raise HTTPException(status_code=404, detail=f"No data for {ticker} from {start_date}")

        # Calculate stock investment growth
        initial_price = float(stock_hist["Close"].iloc[0])
        shares_bought = amount / initial_price

        # Build growth timeline
        timeline = []
        dividends_earned = 0.0

        # Sample at most ~200 points for chart
        total_days = len(stock_hist)
        step = max(1, total_days // 200)

        for i in range(0, total_days, step):
            row = stock_hist.iloc[i]
            date = stock_hist.index[i]

            # Accumulate dividends up to this point
            if include_dividends and "Dividends" in stock_hist.columns:
                div_slice = stock_hist["Dividends"].iloc[:i+1]
                dividends_earned = float(div_slice.sum()) * shares_bought

            stock_value = shares_bought * float(row["Close"]) + dividends_earned

            # S&P comparison
            spy_value = amount
            closest_spy = spy_hist.index.get_indexer([date], method='nearest')
            if len(closest_spy) > 0 and closest_spy[0] >= 0 and closest_spy[0] < len(spy_hist):
                spy_initial = float(spy_hist["Close"].iloc[0])
                spy_current = float(spy_hist["Close"].iloc[closest_spy[0]])
                spy_value = amount * (spy_current / spy_initial)

            timeline.append({
                "date": date.strftime("%Y-%m-%d"),
                "stockValue": round(stock_value, 2),
                "spyValue": round(spy_value, 2),
            })

        # Final values
        final_price = float(stock_hist["Close"].iloc[-1])
        final_stock_value = shares_bought * final_price + dividends_earned

        spy_initial = float(spy_hist["Close"].iloc[0]) if not spy_hist.empty else 1
        spy_final = float(spy_hist["Close"].iloc[-1]) if not spy_hist.empty else 1
        final_spy_value = amount * (spy_final / spy_initial)

        # Inflation adjustment (approx 3% annual)
        years = (datetime.now() - pd.Timestamp(start_date).to_pydatetime()).days / 365.25
        inflation_factor = (1.03) ** years

        result = {
            "ticker": ticker,
            "initialInvestment": amount,
            "startDate": start_date,
            "endDate": stock_hist.index[-1].strftime("%Y-%m-%d"),
            "years": round(years, 1),
            "sharesBought": round(shares_bought, 4),
            "initialPrice": round(initial_price, 2),
            "finalPrice": round(final_price, 2),
            "finalValue": round(final_stock_value, 2),
            "totalReturn": round(((final_stock_value - amount) / amount) * 100, 2),
            "annualizedReturn": round((((final_stock_value / amount) ** (1 / max(years, 0.1))) - 1) * 100, 2) if years > 0 else 0,
            "dividendsEarned": round(dividends_earned, 2),
            "spyFinalValue": round(final_spy_value, 2),
            "spyTotalReturn": round(((final_spy_value - amount) / amount) * 100, 2),
            "beatMarket": final_stock_value > final_spy_value,
            "inflationAdjustedValue": round(final_stock_value / inflation_factor, 2),
            "purchasingPowerGain": round(((final_stock_value / inflation_factor - amount) / amount) * 100, 2),
            "timeline": timeline,
        }

        cache.set(key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/milestones")
def get_milestones(ticker: str = Query(...)):
    """Get key price milestones - when stock first hit $100, $500, doubled, etc."""
    ticker = ticker.upper()
    key = f"milestones:{ticker}"
    cached = cache.get(key, 7200)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="max")
        if hist is None or hist.empty:
            raise HTTPException(status_code=404, detail=f"No history for {ticker}")

        initial_price = float(hist["Close"].iloc[0])
        milestones = []

        # Price milestones
        price_targets = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000]
        for target in price_targets:
            if target <= initial_price:
                continue
            hit = hist[hist["Close"] >= target]
            if not hit.empty:
                milestones.append({
                    "type": "price",
                    "label": f"First hit ${target}",
                    "date": hit.index[0].strftime("%Y-%m-%d"),
                    "price": round(float(hit["Close"].iloc[0]), 2),
                })

        # Multiplier milestones
        for mult in [2, 5, 10, 20, 50, 100]:
            target_price = initial_price * mult
            hit = hist[hist["Close"] >= target_price]
            if not hit.empty:
                milestones.append({
                    "type": "multiplier",
                    "label": f"{mult}x from IPO/start",
                    "date": hit.index[0].strftime("%Y-%m-%d"),
                    "price": round(float(hit["Close"].iloc[0]), 2),
                })

        # All-time high
        ath_idx = hist["Close"].idxmax()
        milestones.append({
            "type": "ath",
            "label": "All-Time High",
            "date": ath_idx.strftime("%Y-%m-%d"),
            "price": round(float(hist["Close"].max()), 2),
        })

        # All-time low
        atl_idx = hist["Close"].idxmin()
        milestones.append({
            "type": "atl",
            "label": "All-Time Low",
            "date": atl_idx.strftime("%Y-%m-%d"),
            "price": round(float(hist["Close"].min()), 2),
        })

        # Biggest single-day gain and loss
        daily_returns = hist["Close"].pct_change()
        if len(daily_returns) > 1:
            best_day_idx = daily_returns.idxmax()
            worst_day_idx = daily_returns.idxmin()
            milestones.append({
                "type": "best_day",
                "label": "Best Single Day",
                "date": best_day_idx.strftime("%Y-%m-%d"),
                "price": round(float(hist["Close"].loc[best_day_idx]), 2),
                "change": round(float(daily_returns.max()) * 100, 2),
            })
            milestones.append({
                "type": "worst_day",
                "label": "Worst Single Day",
                "date": worst_day_idx.strftime("%Y-%m-%d"),
                "price": round(float(hist["Close"].loc[worst_day_idx]), 2),
                "change": round(float(daily_returns.min()) * 100, 2),
            })

        result = {
            "ticker": ticker,
            "firstDate": hist.index[0].strftime("%Y-%m-%d"),
            "firstPrice": round(initial_price, 2),
            "currentPrice": round(float(hist["Close"].iloc[-1]), 2),
            "totalReturn": round(((float(hist["Close"].iloc[-1]) - initial_price) / initial_price) * 100, 2),
            "milestones": milestones,
        }

        cache.set(key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
