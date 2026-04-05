import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def _call_groq(messages: List[dict], temperature: float = 0.7, max_tokens: int = 700) -> Optional[str]:
    """Groq inference — llama-3.3-70b, very fast."""
    if not config.GROQ_API_KEY:
        return None
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception:
        return None


def _call_openrouter(messages: List[dict], temperature: float = 0.3, max_tokens: int = 1500, model: str = "deepseek/deepseek-chat") -> Optional[str]:
    """OpenRouter — routes to various models. Default: deepseek-chat."""
    if not config.OPENROUTER_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=60,
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def _call_perplexity(messages: List[dict], temperature: float = 0.5, max_tokens: int = 1000) -> Optional[str]:
    """Perplexity AI — has real-time web search built in. Best for current market info."""
    if not config.PERPLEXITY_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {config.PERPLEXITY_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "sonar",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=30,
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def _call_deepseek(messages: List[dict], temperature: float = 0.3, max_tokens: int = 1500) -> Optional[str]:
    """Fallback AI provider: Deepseek direct API."""
    if not config.DEEPSEEK_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=60,
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def _call_ai(messages: List[dict], temperature: float = 0.3, max_tokens: int = 1500) -> str:
    """Call AI with automatic fallback: DeepSeek -> OpenRouter -> Groq."""
    result = _call_deepseek(messages, temperature, max_tokens)
    if result:
        return result
    result = _call_openrouter(messages, temperature, max_tokens)
    if result:
        return result
    result = _call_groq(messages, temperature, max_tokens)
    if result:
        return result
    return "AI analysis unavailable — all AI providers failed."


def _ai_council(messages: List[dict], user_message: str) -> str:
    """Run 3 AI models in parallel, then synthesize their answers into one response.

    Panel:
      • Groq  — Llama 3.3 70B  (Meta, speed-optimised)
      • DeepSeek — deepseek-chat  (strong financial reasoning)
      • OpenRouter — Qwen 2.5 72B  (Alibaba, diverse perspective)

    A fourth call synthesises the three views into one definitive answer.
    """

    # Each analyst gets a shorter output budget — synthesis will merge them
    ANALYST_TOKENS = 600

    def _groq_analyst():
        return ("Groq · Llama 3.3 70B", _call_groq(messages, temperature=0.7, max_tokens=ANALYST_TOKENS))

    def _deepseek_analyst():
        return ("DeepSeek · deepseek-chat", _call_deepseek(messages, temperature=0.7, max_tokens=ANALYST_TOKENS))

    def _openrouter_analyst():
        # Qwen 2.5 72B — different architecture/training from the other two
        result = _call_openrouter(messages, temperature=0.7, max_tokens=ANALYST_TOKENS, model="qwen/qwen-2.5-72b-instruct")
        if not result:
            # Fallback to mistral for diversity
            result = _call_openrouter(messages, temperature=0.7, max_tokens=ANALYST_TOKENS, model="mistralai/mistral-7b-instruct:free")
        return ("OpenRouter · Qwen 2.5 72B", result)

    # ── Fire all three in parallel ──────────────────────────────────────────
    responses: List[tuple] = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_map = {
            executor.submit(_groq_analyst): "Groq",
            executor.submit(_deepseek_analyst): "DeepSeek",
            executor.submit(_openrouter_analyst): "OpenRouter",
        }
        for future in as_completed(future_map, timeout=50):
            try:
                name, result = future.result()
                if result and len(result.strip()) > 30:
                    responses.append((name, result.strip()))
            except Exception:
                pass

    if not responses:
        return "AI council unavailable — all providers failed."

    # Only one responded — return it directly (no synthesis needed)
    if len(responses) == 1:
        return responses[0][1]

    # ── Synthesis ───────────────────────────────────────────────────────────
    analyst_block = "\n\n".join(
        f"**{name}:**\n{resp}" for name, resp in responses
    )

    synthesis_msgs = [
        {
            "role": "system",
            "content": (
                "You are a chief investment strategist reviewing multiple AI analyst reports on the same question. "
                "Synthesize them into ONE authoritative, well-structured answer. Rules:\n"
                "- Where analysts agree, state it confidently as consensus.\n"
                "- Where they disagree, present both views with brief rationale.\n"
                "- Highlight any unique insight only one analyst raised.\n"
                "- Match the depth of a single analyst's response — do not balloon in length.\n"
                "- Do NOT say 'Analyst 1 says' or 'According to DeepSeek' — speak directly.\n"
                "- Always end with the standard disclaimer: not financial advice."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Original question: {user_message}\n\n"
                f"Three independent AI analysts answered:\n\n"
                f"{analyst_block}\n\n"
                "Synthesize the above into one unified answer. "
                "Open with the line: **🤝 AI Council Synthesis**"
            ),
        },
    ]

    # Use Groq for synthesis (fastest, excellent instruction-following)
    synthesis = _call_groq(synthesis_msgs, temperature=0.3, max_tokens=1100)
    if not synthesis:
        synthesis = _call_deepseek(synthesis_msgs, temperature=0.3, max_tokens=1100)
    if not synthesis:
        # Last resort: concatenate the top 2 responses
        return responses[0][1]

    contributor_names = " · ".join(name for name, _ in responses)
    return f"{synthesis}\n\n---\n*Council: {contributor_names}*"


def get_hf_sentiment(text: str) -> Optional[dict]:
    """Use HuggingFace Inference API for financial sentiment analysis."""
    if not config.HUGGINGFACE_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://router.huggingface.co/hf-inference/models/ProsusAI/finbert",
            headers={"Authorization": f"Bearer {config.HUGGINGFACE_API_KEY}"},
            json={"inputs": text[:512]},
            timeout=15,
        )
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            # FinBERT returns [[{label, score}, ...]] or [{label, score}, ...]
            items = data[0] if isinstance(data[0], list) else data
            sentiments = {s["label"]: round(s["score"], 4) for s in items if isinstance(s, dict)}
            return sentiments
        return None
    except Exception:
        return None


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

    # Get HuggingFace FinBERT sentiment on recent news
    hf_sentiment_text = ""
    if news:
        combined_headlines = ". ".join([n.get("title", "") for n in news[:5]])
        hf_result = get_hf_sentiment(combined_headlines)
        if hf_result:
            hf_sentiment_text = f"\n\nFinBERT AI Sentiment (on recent news): {hf_result}"
            prompt += hf_sentiment_text

    try:
        messages = [
            {"role": "system", "content": "You are an expert financial analyst. Always include a disclaimer that this is not financial advice."},
            {"role": "user", "content": prompt},
        ]
        result = _call_ai(messages, temperature=0.3, max_tokens=1500)
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


def _get_live_market_context() -> str:
    """Fetch live market data from our backend to inject into AI context."""
    from backend.services import stock_data as sd
    from backend.services import cache as _cache
    from backend.data.sp500_tickers import SP500_TICKERS

    lines = []

    # Market indices
    INDEX_TICKERS = {"S&P 500": "^GSPC", "NASDAQ": "^IXIC", "Dow Jones": "^DJI", "Russell 2000": "^RUT"}
    index_lines = []
    for name, sym in INDEX_TICKERS.items():
        info = sd.get_stock_info(sym)
        if info:
            price = info.get("regularMarketPrice") or info.get("previousClose", 0)
            chg = info.get("regularMarketChangePercent", 0)
            sign = "+" if chg >= 0 else ""
            index_lines.append(f"  {name}: ${price:,.2f} ({sign}{chg:.2f}%)")
    if index_lines:
        lines.append("Market Indices (live):\n" + "\n".join(index_lines))

    # Top movers from S&P 500 (use cached quick quotes)
    gainers, losers = [], []
    for ticker in SP500_TICKERS[:60]:
        info = sd.get_stock_info(ticker)
        if not info:
            continue
        chg = info.get("regularMarketChangePercent", 0)
        price = info.get("regularMarketPrice") or 0
        name = info.get("shortName", ticker)
        entry = f"{ticker} ({name}): ${price:.2f} ({'+' if chg>=0 else ''}{chg:.2f}%)"
        if chg > 0:
            gainers.append((chg, entry))
        elif chg < 0:
            losers.append((chg, entry))

    gainers.sort(reverse=True)
    losers.sort()
    if gainers:
        lines.append("Top Gainers Today:\n" + "\n".join(f"  {e}" for _, e in gainers[:5]))
    if losers:
        lines.append("Top Losers Today:\n" + "\n".join(f"  {e}" for _, e in losers[:5]))

    return "\n\n".join(lines)


def chat(message: str, history: Optional[List[dict]] = None) -> str:
    if not (config.PERPLEXITY_API_KEY or config.GROQ_API_KEY or config.DEEPSEEK_API_KEY or config.OPENROUTER_API_KEY):
        return "AI chat unavailable — no API key configured."

    from backend.services import stock_data as sd
    from backend.services.scoring_engine import compute_score
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%A, %B %d, %Y at %I:%M %p UTC")

    # ── 1. Inject live market overview (indices + movers) ──────────────────
    market_context = ""
    try:
        market_context = _get_live_market_context()
    except Exception:
        pass

    # ── 2. Inject live data for any tickers mentioned in the message ───────
    tickers = _detect_tickers(message)
    ticker_parts = []
    for t in tickers[:4]:
        info = sd.get_stock_info(t)
        if info:
            price = info.get("regularMarketPrice") or info.get("currentPrice")
            chg = info.get("regularMarketChangePercent", 0)
            hist = sd.get_price_history(t, "1y")
            score = compute_score(info, hist)
            ticker_parts.append(
                f"{t} ({info.get('shortName', t)}): Price ${price}, "
                f"Change {'+' if chg>=0 else ''}{chg:.2f}% today, "
                f"Score {score.get('composite')}/100 ({score.get('rating')}), "
                f"Sector: {info.get('sector', 'N/A')}, P/E: {info.get('trailingPE', 'N/A')}, "
                f"52W Range: ${info.get('fiftyTwoWeekLow', '?')}-${info.get('fiftyTwoWeekHigh', '?')}, "
                f"Market Cap: {info.get('marketCap', 'N/A')}"
            )

    # ── 3. Build system prompt with all live data ──────────────────────────
    system_content = (
        f"You are StockAI, an expert stock market assistant with access to LIVE, REAL-TIME market data. "
        f"The current date and time is {today_str}. "
        f"You have been provided with live market data pulled directly from Yahoo Finance right now — "
        f"use this data to answer questions accurately. Do NOT say you lack real-time data. "
        f"Be concise, insightful, and always note this is not financial advice.\n\n"
    )

    if market_context:
        system_content += f"=== LIVE MARKET DATA (fetched right now) ===\n{market_context}\n\n"

    if ticker_parts:
        system_content += f"=== LIVE TICKER DATA ===\n" + "\n".join(ticker_parts) + "\n\n"

    system_content += (
        "When asked about today's top stocks, movers, or market performance, "
        "use the live data above — it reflects current prices. "
        "For stocks not listed above, you can say you'd need to look them up. "
        "Format responses clearly with bold for key numbers."
    )

    messages = [{"role": "system", "content": system_content}]

    if history:
        for h in history[-10:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    messages.append({"role": "user", "content": message})

    try:
        # Perplexity has real-time web search — use it if key is configured
        result = _call_perplexity(messages, temperature=0.5, max_tokens=1200)
        if result:
            return result

        # AI Council: Groq + DeepSeek + OpenRouter answer in parallel,
        # then a synthesiser merges the three views into one definitive response.
        return _ai_council(messages, message)
    except Exception as e:
        return f"Chat error: {str(e)}"
