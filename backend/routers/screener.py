from fastapi import APIRouter
from backend.models.stock import ScreenerRequest
from backend.services import stock_data, cache
from backend.services.scoring_engine import compute_score
from backend.data.sp500_tickers import SP500_TICKERS
from backend import config

router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.post("/filter")
def filter_stocks(req: ScreenerRequest):
    key = f"screener:{req.min_price}:{req.max_price}:{req.sectors}:{req.min_score}:{req.sort_by}:{req.limit}"
    cached = cache.get(key, config.CACHE_TTL_SCORING)
    if cached:
        return cached

    results = []

    for ticker in SP500_TICKERS[:150]:
        try:
            info = stock_data.get_stock_info(ticker)
            if not info:
                continue

            price = info.get("regularMarketPrice") or info.get("currentPrice")
            if price is None:
                continue

            # Apply filters
            if req.min_price is not None and price < req.min_price:
                continue
            if req.max_price is not None and price > req.max_price:
                continue

            sector = info.get("sector", "N/A")
            if req.sectors and sector not in req.sectors:
                continue

            market_cap = info.get("marketCap", 0) or 0
            if req.min_market_cap and market_cap < req.min_market_cap:
                continue
            if req.max_market_cap and market_cap > req.max_market_cap:
                continue

            history = stock_data.get_price_history(ticker, "1y")
            score = compute_score(info, history)

            if req.min_score is not None and score["composite"] < req.min_score:
                continue

            results.append({
                "ticker": ticker,
                "name": info.get("shortName", info.get("longName", ticker)),
                "price": price,
                "change": info.get("regularMarketChange", 0),
                "changePercent": info.get("regularMarketChangePercent", 0),
                "sector": sector,
                "industry": info.get("industry", "N/A"),
                "marketCap": market_cap,
                "pe": info.get("trailingPE"),
                "dividend": info.get("dividendYield"),
                **score,
            })
        except Exception:
            continue

    # Sort
    sort_key = req.sort_by if req.sort_by in ["score", "price", "changePercent", "marketCap", "pe"] else "score"
    if sort_key == "score":
        sort_key = "composite"
    reverse = req.sort_order == "desc"
    results.sort(key=lambda x: x.get(sort_key) or 0, reverse=reverse)
    results = results[:req.limit]

    cache.set(key, results)
    return results
