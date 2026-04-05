"""Global markets router — international indices, currencies, and world events."""
from fastapi import APIRouter
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.services import stock_data, cache, news_service
from backend import config

router = APIRouter(prefix="/api/global", tags=["global"])

# Major world indices by region
WORLD_INDICES = {
    "United States":     {"ticker": "^GSPC",  "name": "S&P 500",          "flag": "🇺🇸", "currency": "USD"},
    "United States ":    {"ticker": "^DJI",   "name": "Dow Jones",        "flag": "🇺🇸", "currency": "USD"},
    "United Kingdom":    {"ticker": "^FTSE",  "name": "FTSE 100",         "flag": "🇬🇧", "currency": "GBP"},
    "Germany":           {"ticker": "^GDAXI", "name": "DAX",              "flag": "🇩🇪", "currency": "EUR"},
    "France":            {"ticker": "^FCHI",  "name": "CAC 40",           "flag": "🇫🇷", "currency": "EUR"},
    "Japan":             {"ticker": "^N225",  "name": "Nikkei 225",       "flag": "🇯🇵", "currency": "JPY"},
    "Hong Kong":         {"ticker": "^HSI",   "name": "Hang Seng",        "flag": "🇭🇰", "currency": "HKD"},
    "China":             {"ticker": "000001.SS", "name": "Shanghai Composite", "flag": "🇨🇳", "currency": "CNY"},
    "South Korea":       {"ticker": "^KS11",  "name": "KOSPI",            "flag": "🇰🇷", "currency": "KRW"},
    "India":             {"ticker": "^BSESN", "name": "BSE Sensex",       "flag": "🇮🇳", "currency": "INR"},
    "Australia":         {"ticker": "^AXJO",  "name": "ASX 200",          "flag": "🇦🇺", "currency": "AUD"},
    "Canada":            {"ticker": "^GSPTSE","name": "S&P/TSX",          "flag": "🇨🇦", "currency": "CAD"},
    "Brazil":            {"ticker": "^BVSP",  "name": "Bovespa",          "flag": "🇧🇷", "currency": "BRL"},
    "Mexico":            {"ticker": "^MXX",   "name": "IPC Mexico",       "flag": "🇲🇽", "currency": "MXN"},
    "Switzerland":       {"ticker": "^SSMI",  "name": "SMI",              "flag": "🇨🇭", "currency": "CHF"},
    "Netherlands":       {"ticker": "^AEX",   "name": "AEX",              "flag": "🇳🇱", "currency": "EUR"},
    "Spain":             {"ticker": "^IBEX",  "name": "IBEX 35",          "flag": "🇪🇸", "currency": "EUR"},
    "Italy":             {"ticker": "FTSEMIB.MI", "name": "FTSE MIB",     "flag": "🇮🇹", "currency": "EUR"},
}

CURRENCY_PAIRS = {
    "EUR/USD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X",
    "USD/JPY": "JPY=X",
    "USD/CNY": "CNY=X",
    "USD/CAD": "CAD=X",
    "AUD/USD": "AUDUSD=X",
    "USD/CHF": "CHF=X",
    "USD/INR": "INR=X",
}

COMMODITIES = {
    "Gold":        "GC=F",
    "Silver":      "SI=F",
    "Crude Oil":   "CL=F",
    "Brent Oil":   "BZ=F",
    "Natural Gas": "NG=F",
    "Copper":      "HG=F",
    "Corn":        "ZC=F",
    "Wheat":       "ZW=F",
}


def _fetch_quote(label, ticker, extra=None):
    try:
        info = stock_data.get_stock_info(ticker)
        if not info:
            return None
        result = {
            "label": label,
            "ticker": ticker,
            "price": info.get("regularMarketPrice") or info.get("previousClose"),
            "change": info.get("regularMarketChange", 0),
            "changePercent": info.get("regularMarketChangePercent", 0),
        }
        if extra:
            result.update(extra)
        return result
    except Exception:
        return None


@router.get("/indices")
def world_indices():
    cached = cache.get("global:indices", 300)
    if cached:
        return cached

    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = [
            ex.submit(_fetch_quote, country, meta["ticker"], {
                "name": meta["name"], "flag": meta["flag"], "currency": meta["currency"], "country": country.strip()
            })
            for country, meta in WORLD_INDICES.items()
        ]
        for f in as_completed(futures, timeout=25):
            r = f.result()
            if r:
                results.append(r)

    # De-dupe (U.S. has two entries keyed differently)
    seen = set()
    unique = []
    for r in results:
        key = r["ticker"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(r)

    cache.set("global:indices", unique)
    return unique


@router.get("/currencies")
def currencies():
    cached = cache.get("global:currencies", 300)
    if cached:
        return cached

    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(_fetch_quote, pair, ticker) for pair, ticker in CURRENCY_PAIRS.items()]
        for f in as_completed(futures, timeout=20):
            r = f.result()
            if r:
                results.append(r)
    cache.set("global:currencies", results)
    return results


@router.get("/commodities")
def commodities():
    cached = cache.get("global:commodities", 300)
    if cached:
        return cached

    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(_fetch_quote, name, ticker) for name, ticker in COMMODITIES.items()]
        for f in as_completed(futures, timeout=20):
            r = f.result()
            if r:
                results.append(r)
    cache.set("global:commodities", results)
    return results


@router.get("/events")
def international_events():
    """Return recent international news that may impact US markets."""
    cached = cache.get("global:events", 600)
    if cached:
        return cached

    # Aggregate news from multiple international/macro tickers
    tickers = ["EFA", "EEM", "FXI", "EWJ", "EWG", "EWU", "INDA", "EWZ"]
    all_news = []
    seen_titles = set()
    try:
        for t in tickers:
            try:
                news = news_service.get_stock_news(t, limit=5)
                for n in news or []:
                    title = (n.get("title") or "").strip()
                    if title and title not in seen_titles:
                        seen_titles.add(title)
                        all_news.append(n)
            except Exception:
                continue
    except Exception:
        pass

    # Sort by date descending (if present)
    def _ts(n):
        return n.get("providerPublishTime") or n.get("pubDate") or 0
    all_news.sort(key=_ts, reverse=True)
    result = all_news[:25]
    cache.set("global:events", result)
    return result
