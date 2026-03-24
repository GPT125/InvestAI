"""
Multi-source data aggregation service.
Uses: Finnhub (real-time quotes, sentiment, news), FMP (financials, ETF holdings),
Alpha Vantage (technical indicators), FRED (macro data), Marketaux (news sentiment),
EOD Historical Data (fundamentals).
"""
import requests
from typing import Optional, Dict, List
from backend import config
from backend.services import cache

BASE_URLS = {
    "finnhub": "https://finnhub.io/api/v1",
    "fmp": "https://financialmodelingprep.com/api/v3",
    "alpha_vantage": "https://www.alphavantage.co/query",
    "fred": "https://api.stlouisfed.org/fred",
    "marketaux": "https://api.marketaux.com/v1",
    "eod": "https://eodhistoricaldata.com/api",
}


def get_finnhub_quote(ticker: str) -> Optional[dict]:
    """Get real-time quote from Finnhub."""
    key = f"finnhub_quote:{ticker}"
    cached = cache.get(key, 60)
    if cached:
        return cached
    if not config.FINNHUB_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['finnhub']}/quote",
            params={"symbol": ticker, "token": config.FINNHUB_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if data.get("c", 0) == 0:
            return None
        result = {
            "current": data.get("c"),
            "high": data.get("h"),
            "low": data.get("l"),
            "open": data.get("o"),
            "previousClose": data.get("pc"),
            "change": data.get("d"),
            "changePercent": data.get("dp"),
            "timestamp": data.get("t"),
        }
        cache.set(key, result)
        return result
    except Exception:
        return None


def get_finnhub_sentiment(ticker: str) -> Optional[dict]:
    """Get news sentiment from Finnhub."""
    key = f"finnhub_sentiment:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached
    if not config.FINNHUB_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['finnhub']}/news-sentiment",
            params={"symbol": ticker, "token": config.FINNHUB_API_KEY},
            timeout=10,
        )
        data = resp.json()
        result = {
            "buzz": data.get("buzz", {}),
            "sentiment": data.get("sentiment", {}),
            "companyNewsScore": data.get("companyNewsScore"),
            "sectorAverageBullishPercent": data.get("sectorAverageBullishPercent"),
            "sectorAverageNewsScore": data.get("sectorAverageNewsScore"),
        }
        cache.set(key, result)
        return result
    except Exception:
        return None


def get_finnhub_peers(ticker: str) -> Optional[List[str]]:
    """Get company peers from Finnhub."""
    key = f"finnhub_peers:{ticker}"
    cached = cache.get(key, 3600)
    if cached:
        return cached
    if not config.FINNHUB_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['finnhub']}/stock/peers",
            params={"symbol": ticker, "token": config.FINNHUB_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if isinstance(data, list):
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_finnhub_company_news(ticker: str) -> Optional[List[dict]]:
    """Get recent company news from Finnhub."""
    key = f"finnhub_news:{ticker}"
    cached = cache.get(key, 1800)
    if cached:
        return cached
    if not config.FINNHUB_API_KEY:
        return None
    try:
        from datetime import datetime, timedelta
        end = datetime.now().strftime("%Y-%m-%d")
        start = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        resp = requests.get(
            f"{BASE_URLS['finnhub']}/company-news",
            params={"symbol": ticker, "from": start, "to": end, "token": config.FINNHUB_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if isinstance(data, list):
            articles = []
            for item in data[:20]:
                articles.append({
                    "title": item.get("headline", ""),
                    "description": item.get("summary", "")[:300],
                    "url": item.get("url", ""),
                    "source": item.get("source", ""),
                    "publishedAt": item.get("datetime", ""),
                    "image": item.get("image", ""),
                    "sentiment": item.get("sentiment"),
                })
            cache.set(key, articles)
            return articles
        return None
    except Exception:
        return None


def get_fmp_financials(ticker: str, statement: str = "income-statement", period: str = "quarter") -> Optional[List[dict]]:
    """
    Get financial statements from FMP.
    statement: income-statement, balance-sheet-statement, cash-flow-statement
    period: quarter or annual
    """
    key = f"fmp_fin:{ticker}:{statement}:{period}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/{statement}/{ticker}",
            params={"period": period, "limit": 20, "apikey": config.FMP_API_KEY},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_fmp_key_metrics(ticker: str) -> Optional[List[dict]]:
    """Get key financial metrics from FMP."""
    key = f"fmp_metrics:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/key-metrics/{ticker}",
            params={"period": "quarter", "limit": 8, "apikey": config.FMP_API_KEY},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_fmp_ratios(ticker: str) -> Optional[List[dict]]:
    """Get financial ratios from FMP."""
    key = f"fmp_ratios:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/ratios/{ticker}",
            params={"period": "quarter", "limit": 8, "apikey": config.FMP_API_KEY},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_fmp_etf_holdings(ticker: str) -> Optional[List[dict]]:
    """Get ETF holdings from FMP (more reliable than yfinance for many ETFs)."""
    key = f"fmp_etf:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/etf-holder/{ticker}",
            params={"apikey": config.FMP_API_KEY},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_fmp_stock_profile(ticker: str) -> Optional[dict]:
    """Get company profile from FMP."""
    key = f"fmp_profile:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/profile/{ticker}",
            params={"apikey": config.FMP_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data[0])
            return data[0]
        return None
    except Exception:
        return None


def get_fmp_earnings(ticker: str) -> Optional[List[dict]]:
    """Get earnings history from FMP - includes EPS actual vs estimate."""
    key = f"fmp_earnings:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.FMP_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fmp']}/historical/earning_calendar/{ticker}",
            params={"limit": 20, "apikey": config.FMP_API_KEY},
            timeout=10,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_alpha_vantage_indicators(ticker: str, indicator: str = "SMA", time_period: int = 50) -> Optional[dict]:
    """Get technical indicators from Alpha Vantage (SMA, EMA, RSI, MACD, etc.)."""
    key = f"av_indicator:{ticker}:{indicator}:{time_period}"
    cached = cache.get(key, 3600)
    if cached:
        return cached
    if not config.ALPHA_VANTAGE_API_KEY:
        return None
    try:
        params = {
            "function": indicator,
            "symbol": ticker,
            "interval": "daily",
            "time_period": time_period,
            "series_type": "close",
            "apikey": config.ALPHA_VANTAGE_API_KEY,
        }
        resp = requests.get(BASE_URLS["alpha_vantage"], params=params, timeout=15)
        data = resp.json()
        # AV returns data under a key like "Technical Analysis: SMA"
        tech_key = f"Technical Analysis: {indicator}"
        if tech_key in data:
            # Get last 60 data points
            points = []
            for date, values in list(data[tech_key].items())[:60]:
                point = {"date": date}
                for k, v in values.items():
                    point[k] = float(v)
                points.append(point)
            result = {"indicator": indicator, "data": list(reversed(points))}
            cache.set(key, result)
            return result
        return None
    except Exception:
        return None


def get_alpha_vantage_overview(ticker: str) -> Optional[dict]:
    """Get company overview from Alpha Vantage - good for fundamentals."""
    key = f"av_overview:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.ALPHA_VANTAGE_API_KEY:
        return None
    try:
        params = {
            "function": "OVERVIEW",
            "symbol": ticker,
            "apikey": config.ALPHA_VANTAGE_API_KEY,
        }
        resp = requests.get(BASE_URLS["alpha_vantage"], params=params, timeout=15)
        data = resp.json()
        if data.get("Symbol"):
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_fred_series(series_id: str, limit: int = 120) -> Optional[List[dict]]:
    """Get economic data series from FRED (e.g., GDP, CPI, unemployment, fed funds rate)."""
    key = f"fred:{series_id}"
    cached = cache.get(key, config.CACHE_TTL_MACRO)
    if cached:
        return cached
    if not config.FRED_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['fred']}/series/observations",
            params={
                "series_id": series_id,
                "api_key": config.FRED_API_KEY,
                "file_type": "json",
                "sort_order": "desc",
                "limit": limit,
            },
            timeout=15,
        )
        data = resp.json()
        observations = data.get("observations", [])
        if observations:
            points = []
            for obs in reversed(observations):
                try:
                    points.append({
                        "date": obs["date"],
                        "value": float(obs["value"]) if obs["value"] != "." else None,
                    })
                except (ValueError, KeyError):
                    pass
            cache.set(key, points)
            return points
        return None
    except Exception:
        return None


def get_macro_dashboard() -> dict:
    """Get key macro indicators for the dashboard."""
    key = "macro_dashboard"
    cached = cache.get(key, config.CACHE_TTL_MACRO)
    if cached:
        return cached

    indicators = {
        "fedFundsRate": "FEDFUNDS",
        "cpi": "CPIAUCSL",
        "unemployment": "UNRATE",
        "gdpGrowth": "A191RL1Q225SBEA",
        "tenYearYield": "DGS10",
        "twoYearYield": "DGS2",
        "vix": "VIXCLS",
        "sp500": "SP500",
    }

    result = {}
    for name, series_id in indicators.items():
        data = get_fred_series(series_id, limit=12)
        if data:
            latest = next((d for d in reversed(data) if d["value"] is not None), None)
            result[name] = {
                "value": latest["value"] if latest else None,
                "date": latest["date"] if latest else None,
                "history": data[-12:],
            }

    cache.set(key, result)
    return result


def get_marketaux_news(ticker: str) -> Optional[List[dict]]:
    """Get news and sentiment from Marketaux."""
    key = f"marketaux_news:{ticker}"
    cached = cache.get(key, 1800)
    if cached:
        return cached
    if not config.MARKETAUX_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['marketaux']}/news/all",
            params={
                "symbols": ticker,
                "filter_entities": "true",
                "language": "en",
                "api_token": config.MARKETAUX_API_KEY,
            },
            timeout=10,
        )
        data = resp.json()
        articles = []
        for item in data.get("data", [])[:15]:
            articles.append({
                "title": item.get("title", ""),
                "description": item.get("description", "")[:300],
                "url": item.get("url", ""),
                "source": item.get("source", ""),
                "publishedAt": item.get("published_at", ""),
                "image": item.get("image_url", ""),
                "sentiment": item.get("sentiment"),
            })
        cache.set(key, articles)
        return articles
    except Exception:
        return None


def get_eod_fundamentals(ticker: str) -> Optional[dict]:
    """Get fundamentals from EOD Historical Data."""
    key = f"eod_fund:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_FINANCIALS)
    if cached:
        return cached
    if not config.EOD_API_KEY:
        return None
    try:
        resp = requests.get(
            f"{BASE_URLS['eod']}/fundamentals/{ticker}.US",
            params={"api_token": config.EOD_API_KEY, "fmt": "json"},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, dict) and data.get("General"):
            cache.set(key, data)
            return data
        return None
    except Exception:
        return None


def get_aggregated_news(ticker: str) -> List[dict]:
    """Aggregate news from multiple sources: yfinance, Finnhub, Marketaux, NewsAPI."""
    all_articles = []
    seen_titles = set()

    # Finnhub news
    fh_news = get_finnhub_company_news(ticker)
    if fh_news:
        for a in fh_news:
            title = a.get("title", "")
            if title and title not in seen_titles:
                seen_titles.add(title)
                all_articles.append(a)

    # Marketaux news
    mx_news = get_marketaux_news(ticker)
    if mx_news:
        for a in mx_news:
            title = a.get("title", "")
            if title and title not in seen_titles:
                seen_titles.add(title)
                all_articles.append(a)

    return all_articles


def get_comprehensive_stock_data(ticker: str) -> dict:
    """Get comprehensive data from all sources for a single stock."""
    result = {
        "ticker": ticker,
        "finnhub_quote": get_finnhub_quote(ticker),
        "finnhub_sentiment": get_finnhub_sentiment(ticker),
        "finnhub_peers": get_finnhub_peers(ticker),
        "fmp_profile": get_fmp_stock_profile(ticker),
        "macro": get_macro_dashboard(),
    }
    return result
