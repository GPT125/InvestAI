from fastapi import APIRouter, HTTPException
from backend.services import stock_data, cache
from backend.services.scoring_engine import compute_score
from backend.data.sp500_tickers import ALL_TICKERS, SP500_TICKERS
from backend import config

router = APIRouter(prefix="/api/scoring", tags=["scoring"])


@router.get("/{ticker}")
def get_score(ticker: str):
    ticker = ticker.upper()
    key = f"score:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_SCORING)
    if cached:
        return cached

    info = stock_data.get_stock_info(ticker)
    if not info:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

    history = stock_data.get_price_history(ticker, "1y")
    score = compute_score(info, history)
    score["ticker"] = ticker
    cache.set(key, score)
    return score


@router.get("/top/ranked")
def top_stocks(limit: int = 20, sector: str = None):
    key = f"top:{limit}:{sector or 'all'}"
    cached = cache.get(key, config.CACHE_TTL_SCORING)
    if cached:
        return cached

    # Use a subset for speed - top 100 most popular tickers
    popular = SP500_TICKERS[:100]
    results = []

    for ticker in popular:
        try:
            info = stock_data.get_stock_info(ticker)
            if not info:
                continue

            if sector and info.get("sector", "").lower() != sector.lower():
                continue

            history = stock_data.get_price_history(ticker, "1y")
            score = compute_score(info, history)

            results.append({
                "ticker": ticker,
                "name": info.get("shortName", info.get("longName", ticker)),
                "price": info.get("regularMarketPrice") or info.get("currentPrice"),
                "change": info.get("regularMarketChange", 0),
                "changePercent": info.get("regularMarketChangePercent", 0),
                "sector": info.get("sector", "N/A"),
                "marketCap": info.get("marketCap", 0),
                **score,
            })
        except Exception:
            continue

    results.sort(key=lambda x: x.get("composite", 0), reverse=True)
    results = results[:limit]
    cache.set(key, results)
    return results
