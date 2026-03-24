from fastapi import APIRouter, HTTPException
from backend.services import stock_data
from backend.data.sp500_tickers import ALL_TICKERS

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/search")
def search_stocks(q: str = ""):
    if not q or len(q) < 1:
        return []
    # Try universal search first, fall back to static list
    results = stock_data.search_all_tickers(q)
    if not results:
        results = stock_data.search_tickers(q, ALL_TICKERS)
    return results


@router.get("/{ticker}")
def get_stock(ticker: str):
    data = stock_data.get_detailed_stock(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
    return data


@router.get("/{ticker}/history")
def get_history(ticker: str, period: str = "1y"):
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max"]
    if period not in valid_periods:
        period = "1y"

    hist = stock_data.get_price_history(ticker.upper(), period)
    if hist is None:
        raise HTTPException(status_code=404, detail=f"No history for {ticker}")

    points = []
    for date, row in hist.iterrows():
        points.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        })
    return points


@router.get("/{ticker}/extended")
def get_extended_hours(ticker: str):
    data = stock_data.get_extended_hours(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
    return data


@router.get("/{ticker}/holdings")
def get_holdings(ticker: str):
    data = stock_data.get_etf_holdings(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No ETF holdings for {ticker}")
    return data


@router.get("/{ticker}/extended-history")
def get_extended_history(ticker: str):
    data = stock_data.get_extended_hours_history(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No extended hours data for {ticker}")
    return data


@router.get("/{ticker}/earnings")
def get_earnings(ticker: str):
    data = stock_data.get_earnings_data(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No earnings data for {ticker}")
    return data


@router.get("/{ticker}/financial-stats")
def get_financial_stats(ticker: str):
    data = stock_data.get_financial_stats(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No financial stats for {ticker}")
    return data


@router.get("/{ticker}/analyst")
def get_analyst(ticker: str):
    data = stock_data.get_analyst_data(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No analyst data for {ticker}")
    return data


@router.get("/{ticker}/performance")
def get_performance(ticker: str):
    data = stock_data.get_performance_comparison(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No performance data for {ticker}")
    return data
