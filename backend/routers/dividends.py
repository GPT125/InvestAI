from fastapi import APIRouter, HTTPException, Query
from backend.services import stock_data, cache
from backend import config
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dividends", tags=["dividends"])


@router.get("/calendar")
def dividend_calendar(tickers: str = Query(..., description="Comma-separated tickers")):
    """Get dividend payment dates for multiple stocks to build a calendar view."""
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    key = f"div_cal:{':'.join(sorted(ticker_list))}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    events = []
    stock_info = []

    for ticker in ticker_list:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info or {}

            div_rate = info.get("dividendRate", 0) or 0
            div_yield = info.get("dividendYield", 0) or 0
            ex_date = info.get("exDividendDate")
            payout_ratio = info.get("payoutRatio")

            # Get dividend history
            try:
                divs = stock.dividends
                if divs is not None and not divs.empty:
                    for date, amount in divs.tail(12).items():
                        events.append({
                            "ticker": ticker,
                            "date": date.strftime("%Y-%m-%d"),
                            "amount": round(float(amount), 4),
                            "type": "dividend",
                        })
            except:
                pass

            stock_info.append({
                "ticker": ticker,
                "name": info.get("shortName", ticker),
                "dividendRate": round(div_rate, 2) if div_rate else 0,
                "dividendYield": round(div_yield, 4) if div_yield else 0,
                "exDividendDate": datetime.fromtimestamp(ex_date).strftime("%Y-%m-%d") if ex_date else None,
                "payoutRatio": round(payout_ratio, 2) if payout_ratio else None,
                "frequency": _guess_frequency(ticker),
                "price": info.get("regularMarketPrice") or info.get("currentPrice"),
            })
        except:
            continue

    # Sort events by date
    events.sort(key=lambda x: x["date"])

    result = {"events": events, "stocks": stock_info}
    cache.set(key, result)
    return result


def _guess_frequency(ticker):
    """Guess dividend payment frequency from history."""
    try:
        stock = yf.Ticker(ticker)
        divs = stock.dividends
        if divs is None or len(divs) < 2:
            return "Unknown"
        # Look at last year
        recent = divs.last("2Y")
        payments_per_year = len(recent) / 2
        if payments_per_year >= 11:
            return "Monthly"
        elif payments_per_year >= 3.5:
            return "Quarterly"
        elif payments_per_year >= 1.5:
            return "Semi-Annual"
        elif payments_per_year >= 0.8:
            return "Annual"
        return "Irregular"
    except:
        return "Unknown"


@router.get("/income-projection")
def income_projection(payload_tickers: str = Query(..., alias="tickers"), shares_json: str = Query("{}", alias="shares")):
    """Project annual dividend income for a portfolio."""
    import json

    ticker_list = [t.strip().upper() for t in payload_tickers.split(",")]
    try:
        shares_map = json.loads(shares_json)
    except:
        shares_map = {}

    key = f"div_proj:{':'.join(sorted(ticker_list))}:{shares_json}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    projections = []
    total_annual = 0

    for ticker in ticker_list:
        try:
            info = stock_data.get_stock_info(ticker)
            if not info:
                continue

            div_rate = info.get("dividendRate", 0) or 0
            price = info.get("regularMarketPrice") or info.get("currentPrice", 0)
            num_shares = float(shares_map.get(ticker, 1))
            annual_income = div_rate * num_shares

            projections.append({
                "ticker": ticker,
                "name": info.get("shortName", ticker),
                "shares": num_shares,
                "dividendRate": round(div_rate, 2),
                "dividendYield": round((div_rate / price) * 100, 2) if price else 0,
                "annualIncome": round(annual_income, 2),
                "monthlyIncome": round(annual_income / 12, 2),
                "price": round(price, 2) if price else 0,
            })
            total_annual += annual_income
        except:
            continue

    result = {
        "projections": projections,
        "totalAnnualIncome": round(total_annual, 2),
        "totalMonthlyIncome": round(total_annual / 12, 2),
        "yieldOnCost": round(
            (total_annual / sum(p["price"] * p["shares"] for p in projections)) * 100, 2
        ) if projections and sum(p["price"] * p["shares"] for p in projections) > 0 else 0,
    }

    cache.set(key, result)
    return result


@router.get("/growth")
def dividend_growth(ticker: str = Query(...)):
    """Get dividend growth history and CAGR."""
    ticker = ticker.upper()
    key = f"div_growth:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        divs = stock.dividends

        if divs is None or divs.empty:
            return {"ticker": ticker, "hasDividends": False}

        # Annual dividend totals
        annual = {}
        for date, amount in divs.items():
            year = date.year
            if year not in annual:
                annual[year] = 0
            annual[year] += float(amount)

        years = sorted(annual.keys())
        history = [{"year": y, "total": round(annual[y], 4)} for y in years]

        # Calculate CAGR
        if len(years) >= 2 and annual[years[0]] > 0:
            n_years = years[-1] - years[0]
            if n_years > 0:
                cagr = ((annual[years[-1]] / annual[years[0]]) ** (1 / n_years) - 1) * 100
            else:
                cagr = 0
        else:
            cagr = 0

        # Year-over-year growth rates
        growth_rates = []
        for i in range(1, len(years)):
            prev = annual[years[i - 1]]
            curr = annual[years[i]]
            if prev > 0:
                growth_rates.append({
                    "year": years[i],
                    "growth": round(((curr - prev) / prev) * 100, 2),
                })

        # Consecutive years of growth
        streak = 0
        for i in range(len(years) - 1, 0, -1):
            if annual[years[i]] > annual[years[i - 1]]:
                streak += 1
            else:
                break

        result = {
            "ticker": ticker,
            "hasDividends": True,
            "history": history,
            "cagr": round(cagr, 2),
            "growthRates": growth_rates,
            "consecutiveGrowthYears": streak,
            "totalYears": len(years),
        }

        cache.set(key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
