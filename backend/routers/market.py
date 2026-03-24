from fastapi import APIRouter
from backend.services import stock_data, cache, market_summary
from backend import config
from backend.data.sp500_tickers import SECTOR_ETFS

router = APIRouter(prefix="/api/market", tags=["market"])

INDEX_TICKERS = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "Dow Jones": "^DJI",
    "Russell 2000": "^RUT",
}


@router.get("/overview")
def market_overview():
    cached = cache.get("market:overview", config.CACHE_TTL_MARKET)
    if cached:
        return cached

    indices = []
    for name, ticker in INDEX_TICKERS.items():
        info = stock_data.get_stock_info(ticker)
        if info:
            indices.append({
                "name": name,
                "ticker": ticker,
                "price": info.get("regularMarketPrice") or info.get("previousClose"),
                "change": info.get("regularMarketChange", 0),
                "changePercent": info.get("regularMarketChangePercent", 0),
            })

    cache.set("market:overview", indices)
    return indices


@router.get("/sectors")
def sector_performance():
    cached = cache.get("market:sectors", config.CACHE_TTL_MARKET)
    if cached:
        return cached

    sectors = []
    for sector_name, etf in SECTOR_ETFS.items():
        info = stock_data.get_stock_info(etf)
        if info:
            sectors.append({
                "sector": sector_name,
                "etf": etf,
                "price": info.get("regularMarketPrice") or info.get("previousClose"),
                "change": info.get("regularMarketChange", 0),
                "changePercent": info.get("regularMarketChangePercent", 0),
            })

    cache.set("market:sectors", sectors)
    return sectors


@router.get("/summary")
def get_market_summary():
    return market_summary.get_market_summary()


# In-memory storage for market summary settings (per-session)
_summary_settings = {
    "frequency": "daily",
    "includeGovernment": True,
    "includeRecommendations": True,
}


@router.get("/summary/settings")
def get_summary_settings():
    return _summary_settings


@router.post("/summary/settings")
def update_summary_settings(settings: dict):
    global _summary_settings
    if "frequency" in settings:
        valid = ["realtime", "hourly", "daily", "weekly", "monthly"]
        if settings["frequency"] in valid:
            _summary_settings["frequency"] = settings["frequency"]
    if "includeGovernment" in settings:
        _summary_settings["includeGovernment"] = bool(settings["includeGovernment"])
    if "includeRecommendations" in settings:
        _summary_settings["includeRecommendations"] = bool(settings["includeRecommendations"])
    return _summary_settings
