import re
from typing import Optional, List
from groq import Groq
from backend import config
from backend.services import cache

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=config.GROQ_API_KEY)
    return _client


def _format_val(val):
    if val is None:
        return "N/A"
    return val


def analyze_stock(ticker: str, stock_data_dict: dict, score_data: dict, hist_summary: dict = None, news: list = None, etf_data: dict = None) -> str:
    key = f"ai:analysis:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_AI_ANALYSIS)
    if cached is not None:
        return cached

    if not config.GROQ_API_KEY:
        return "AI analysis unavailable — no API key configured."

    is_etf = stock_data_dict.get("isETF", False)

    # Build historical context
    hist_text = ""
    if hist_summary and hist_summary.get("years"):
        hist_text = "\n\nHistorical Performance (Yearly):\n"
        for y in hist_summary["years"]:
            hist_text += f"  {y['year']}: Open ${y['open']}, Close ${y['close']}, High ${y['high']}, Low ${y['low']}, Return {y['returnPct']:+.1f}%\n"

    # Build news context
    news_text = ""
    if news:
        news_text = "\n\nRecent News Headlines:\n"
        for n in news[:5]:
            news_text += f"  - {n.get('title', '')} ({n.get('source', '')})\n"

    # ETF-specific context
    etf_text = ""
    if is_etf and etf_data:
        etf_text = f"""
ETF Details:
- Expense Ratio: {_format_val(etf_data.get('expenseRatio'))}
- Total Assets: {_format_val(etf_data.get('totalAssets'))}
- Fund Family: {_format_val(etf_data.get('fundFamily'))}
- Category: {_format_val(etf_data.get('category'))}
- YTD Return: {_format_val(etf_data.get('ytdReturn'))}
- 3Y Return: {_format_val(etf_data.get('threeYearReturn'))}
- 5Y Return: {_format_val(etf_data.get('fiveYearReturn'))}
"""

    # Build score breakdown text based on type
    if score_data.get("scoreType") == "etf":
        score_text = f"""Our Scoring System Results (ETF):
- Overall Score: {score_data.get('composite', 'N/A')}/100 ({score_data.get('rating', 'N/A')})
- Cost Efficiency: {score_data.get('costEfficiency', 'N/A')}/100
- Performance: {score_data.get('performance', 'N/A')}/100
- Momentum: {score_data.get('momentum', 'N/A')}/100
- Liquidity: {score_data.get('liquidity', 'N/A')}/100
- Issuer Quality: {score_data.get('issuerQuality', 'N/A')}/100"""
    else:
        score_text = f"""Our Scoring System Results (Stock):
- Overall Score: {score_data.get('composite', 'N/A')}/100 ({score_data.get('rating', 'N/A')})
- Valuation: {score_data.get('valuation', 'N/A')}/100
- Growth: {score_data.get('growth', 'N/A')}/100
- Financial Health: {score_data.get('financialHealth', 'N/A')}/100
- Momentum: {score_data.get('momentum', 'N/A')}/100
- Dividends: {score_data.get('dividends', 'N/A')}/100
- Analyst: {score_data.get('analyst', 'N/A')}/100"""

    prompt = f"""You are an expert financial analyst with access to decades of market data. Analyze the following {'ETF' if is_etf else 'stock'} and provide a detailed assessment. Use the historical data provided (which may span up to 30+ years) to identify long-term trends.

{'ETF' if is_etf else 'Stock'}: {ticker} - {stock_data_dict.get('name', '')}
Sector: {stock_data_dict.get('sector', 'N/A')} | Industry: {stock_data_dict.get('industry', 'N/A')}

Current Price: ${_format_val(stock_data_dict.get('price'))}
Market Cap: {_format_val(stock_data_dict.get('marketCap'))}
P/E Ratio: {_format_val(stock_data_dict.get('pe'))}
Forward P/E: {_format_val(stock_data_dict.get('forwardPE'))}
PEG Ratio: {_format_val(stock_data_dict.get('peg'))}
EPS: {_format_val(stock_data_dict.get('eps'))}
Beta: {_format_val(stock_data_dict.get('beta'))}
Dividend Yield: {_format_val(stock_data_dict.get('dividend'))}
52-Week High: ${_format_val(stock_data_dict.get('fiftyTwoWeekHigh'))}
52-Week Low: ${_format_val(stock_data_dict.get('fiftyTwoWeekLow'))}
Revenue Growth: {_format_val(stock_data_dict.get('revenueGrowth'))}
Debt/Equity: {_format_val(stock_data_dict.get('debtToEquity'))}
Free Cash Flow: {_format_val(stock_data_dict.get('freeCashflow'))}
Profit Margin: {_format_val(stock_data_dict.get('profitMargin'))}
Analyst Recommendation: {_format_val(stock_data_dict.get('recommendation'))}
Target Price: ${_format_val(stock_data_dict.get('targetMeanPrice'))}
{etf_text}
{score_text}
{hist_text}
{news_text}

Provide your analysis in this format:
## Summary
Brief 2-3 sentence overview.

## Strengths
- Key strengths (3-4 bullet points)

## Risks
- Key risks (3-4 bullet points)

## Price Target Analysis
- Current Price: State the current price
- 1-Month Target: Estimated price in 1 month with reasoning
- 3-Month Target: Estimated price in 3 months with reasoning
- 6-Month Target: Estimated price in 6 months with reasoning
- 12-Month Target: Estimated price in 12 months with reasoning
- Analyst Consensus Target: State the mean analyst target price if available
- Estimated Time to Analyst Target: How long to reach the analyst consensus target

## Long-Term Trend Analysis
Based on the historical data (up to 30+ years if available), describe major trends, cycles, and pattern analysis.

## Recommendation
Your recommendation with reasoning.

IMPORTANT: This is not financial advice. This is for educational and informational purposes only."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert financial analyst. Always include a disclaimer that this is not financial advice."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        result = response.choices[0].message.content
        cache.set(key, result)
        return result
    except Exception as e:
        return f"AI analysis error: {str(e)}"


def _detect_tickers(message: str) -> List[str]:
    """Detect stock/ETF tickers mentioned in user message."""
    # Match uppercase 1-5 letter words that look like tickers
    words = re.findall(r'\b[A-Z]{1,5}\b', message.upper())
    # Filter common English words
    ignore = {"I", "A", "THE", "AND", "OR", "IS", "IT", "IN", "ON", "AT", "TO", "DO", "MY", "ME", "IF", "SO", "NO", "UP", "BY", "BE", "AM", "AN", "AS", "VS", "ALL", "FOR", "NOT", "BUT", "HOW", "WHO", "CAN", "HAS", "HAD", "HIS", "HER", "BUY", "SELL", "ETF"}
    return [w for w in words if w not in ignore]


def chat(message: str, history: Optional[List[dict]] = None) -> str:
    if not config.GROQ_API_KEY:
        return "AI chat unavailable — no API key configured."

    # Auto-detect tickers and inject live data
    from backend.services import stock_data as sd
    from backend.services.scoring_engine import compute_score

    tickers = _detect_tickers(message)
    context_parts = []
    for t in tickers[:3]:  # Limit to 3 to avoid prompt bloat
        info = sd.get_stock_info(t)
        if info:
            price = info.get("regularMarketPrice") or info.get("currentPrice")
            hist = sd.get_price_history(t, "1y")
            score = compute_score(info, hist)
            context_parts.append(
                f"{t} ({info.get('shortName', t)}): Price ${price}, "
                f"Score {score.get('composite')}/100 ({score.get('rating')}), "
                f"Sector: {info.get('sector', 'N/A')}, P/E: {info.get('trailingPE', 'N/A')}, "
                f"52W: ${info.get('fiftyTwoWeekLow', '?')}-${info.get('fiftyTwoWeekHigh', '?')}"
            )

    system_content = (
        "You are a helpful stock market assistant with access to live market data. "
        "You help users understand stocks, ETFs, market trends, and investment concepts. "
        "Always remind users that this is not financial advice. Be concise and informative."
    )

    if context_parts:
        system_content += "\n\nLive market data for referenced tickers:\n" + "\n".join(context_parts)

    messages = [{"role": "system", "content": system_content}]

    if history:
        for h in history[-10:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Chat error: {str(e)}"
