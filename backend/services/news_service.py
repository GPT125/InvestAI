from typing import List
import re
import requests
import yfinance as yf
from backend import config
from backend.services import cache


def _strip_html(text: str) -> str:
    """Remove HTML tags from text."""
    if not text:
        return ""
    return re.sub(r'<[^>]+>', '', text).strip()


def _parse_news_item(item: dict) -> dict:
    """Parse a news item from yfinance new format (content nested)."""
    # New yfinance format: data is nested under 'content'
    content = item.get("content", {})
    if not content or not isinstance(content, dict):
        content = item

    title = content.get("title", "") or ""

    # Description/summary - strip HTML tags
    raw_summary = content.get("summary") or content.get("description") or title
    description = _strip_html(raw_summary)

    # URL - nested under canonicalUrl or clickThroughUrl
    url = ""
    canonical = content.get("canonicalUrl")
    if isinstance(canonical, dict):
        url = canonical.get("url", "")
    elif isinstance(canonical, str):
        url = canonical
    if not url:
        click_through = content.get("clickThroughUrl")
        if isinstance(click_through, dict):
            url = click_through.get("url", "")
        elif isinstance(click_through, str):
            url = click_through
    if not url:
        url = content.get("url") or content.get("link") or item.get("link") or ""

    # Source/provider
    source = "Yahoo Finance"
    provider = content.get("provider")
    if isinstance(provider, dict):
        source = provider.get("displayName", "Yahoo Finance")
    elif isinstance(provider, str):
        source = provider

    # Published date
    published = content.get("pubDate") or content.get("displayTime") or ""

    # Thumbnail image
    image = ""
    thumb = content.get("thumbnail")
    if isinstance(thumb, dict):
        resolutions = thumb.get("resolutions")
        if resolutions and isinstance(resolutions, list) and len(resolutions) > 0:
            image = resolutions[0].get("url", "")
        if not image:
            image = thumb.get("originalUrl", "")

    return {
        "title": title,
        "description": description[:300] if description else "",
        "url": url,
        "source": source,
        "publishedAt": published,
        "image": image,
    }


def get_stock_news(ticker: str, company_name: str = "") -> List[dict]:
    key = f"news:stock:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_NEWS)
    if cached is not None:
        return cached

    articles = []
    seen_titles = set()

    # Try yfinance news first (free, no API key needed)
    try:
        stock = yf.Ticker(ticker)
        news_items = stock.news
        if news_items and isinstance(news_items, list):
            for item in news_items[:10]:
                parsed = _parse_news_item(item)
                if parsed["title"] and parsed["title"] not in seen_titles:
                    seen_titles.add(parsed["title"])
                    articles.append(parsed)
    except Exception:
        pass

    # Add Finnhub news
    try:
        from backend.services.multi_source import get_finnhub_company_news
        fh_news = get_finnhub_company_news(ticker)
        if fh_news:
            for a in fh_news:
                if a["title"] and a["title"] not in seen_titles:
                    seen_titles.add(a["title"])
                    articles.append(a)
    except Exception:
        pass

    # Add Marketaux news
    try:
        from backend.services.multi_source import get_marketaux_news
        mx_news = get_marketaux_news(ticker)
        if mx_news:
            for a in mx_news:
                if a["title"] and a["title"] not in seen_titles:
                    seen_titles.add(a["title"])
                    articles.append(a)
    except Exception:
        pass

    # Fall back to NewsAPI if still no articles
    if not articles and config.NEWS_API_KEY:
        query = f'"{company_name}" OR "{ticker} stock"' if company_name else f"{ticker} stock"
        try:
            resp = requests.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": query,
                    "sortBy": "relevancy",
                    "pageSize": 10,
                    "language": "en",
                    "apiKey": config.NEWS_API_KEY,
                },
                timeout=10,
            )
            data = resp.json()
            for a in data.get("articles", []):
                title = a.get("title", "")
                if title and title not in seen_titles:
                    seen_titles.add(title)
                    articles.append({
                        "title": title,
                        "description": a.get("description", ""),
                        "url": a.get("url", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "publishedAt": a.get("publishedAt", ""),
                        "image": a.get("urlToImage", ""),
                    })
        except Exception:
            pass

    cache.set(key, articles)
    return articles


def get_market_news() -> List[dict]:
    key = "news:market"
    cached = cache.get(key, config.CACHE_TTL_NEWS)
    if cached is not None:
        return cached

    articles = []

    # Try yfinance market news via SPY
    try:
        spy = yf.Ticker("SPY")
        news_items = spy.news
        if news_items and isinstance(news_items, list):
            for item in news_items[:12]:
                parsed = _parse_news_item(item)
                if parsed["title"]:
                    articles.append(parsed)
    except Exception:
        pass

    # Fall back to NewsAPI
    if not articles and config.NEWS_API_KEY:
        try:
            resp = requests.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": '"stock market" OR "S&P 500" OR "Wall Street"',
                    "sortBy": "publishedAt",
                    "pageSize": 10,
                    "language": "en",
                    "apiKey": config.NEWS_API_KEY,
                },
                timeout=10,
            )
            data = resp.json()
            for a in data.get("articles", []):
                articles.append({
                    "title": a.get("title", ""),
                    "description": a.get("description", ""),
                    "url": a.get("url", ""),
                    "source": a.get("source", {}).get("name", ""),
                    "publishedAt": a.get("publishedAt", ""),
                    "image": a.get("urlToImage", ""),
                })
        except Exception:
            pass

    cache.set(key, articles)
    return articles
