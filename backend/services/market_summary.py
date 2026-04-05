from datetime import datetime, timezone
from backend.services import stock_data, cache, ai_service, news_service
from backend import config


def get_market_summary(force: bool = False):
    """Generate an AI-powered market summary with sources."""
    key = "market:summary"
    if not force:
        cached = cache.get(key, 1800)  # 30 min cache
        if cached is not None:
            return cached

    # Gather market data
    indices = {}
    for name, ticker in {"S&P 500": "^GSPC", "NASDAQ": "^IXIC", "Dow Jones": "^DJI"}.items():
        info = stock_data.get_stock_info(ticker)
        if info:
            indices[name] = {
                "price": info.get("regularMarketPrice"),
                "change": info.get("regularMarketChange", 0),
                "changePercent": info.get("regularMarketChangePercent", 0),
            }

    # Get market news
    news = news_service.get_market_news()
    news_text = ""
    sources = []
    for n in news[:5]:
        news_text += f"- {n.get('title', '')} ({n.get('source', '')})\n"
        if n.get("url"):
            sources.append({"title": n.get("title", ""), "url": n.get("url", ""), "source": n.get("source", "")})

    # Build prompt
    idx_text = ""
    for name, data in indices.items():
        pct = data.get("changePercent", 0)
        direction = "up" if pct >= 0 else "down"
        idx_text += f"- {name}: ${data['price']:,.2f} ({direction} {abs(pct):.2f}%)\n"

    prompt = f"""Provide a brief market summary for today based on this data:

Market Indices:
{idx_text}

Recent Headlines:
{news_text}

Write a 3-4 paragraph market summary covering:
1. How major indices are performing today
2. Key market drivers and notable moves
3. What investors should watch for

Keep it concise and professional. Include specific numbers."""

    summary_text = ai_service.chat(prompt)

    result = {
        "summary": summary_text,
        "indices": indices,
        "sources": sources,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

    cache.set(key, result)
    return result
