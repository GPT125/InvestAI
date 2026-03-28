from fastapi import APIRouter, HTTPException, Query
from typing import List
from backend.services import stock_data, multi_source
from backend import config
import requests

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("/")
def compare_stocks(tickers: str = Query(..., description="Comma-separated tickers")):
    """Compare multiple stocks side by side."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tickers to compare")
    if len(ticker_list) > 5:
        ticker_list = ticker_list[:5]

    results = []
    for ticker in ticker_list:
        detail = stock_data.get_detailed_stock(ticker)
        if detail:
            # Add FMP profile for extra data
            profile = multi_source.get_fmp_stock_profile(ticker)
            if profile:
                detail["fullTimeEmployees"] = profile.get("fullTimeEmployees")
                detail["ipoDate"] = profile.get("ipoDate")
                detail["ceo"] = profile.get("ceo")
                detail["exchange"] = profile.get("exchangeShortName")
                detail["country"] = profile.get("country")
            results.append(detail)

    if not results:
        raise HTTPException(status_code=404, detail="No stocks found")
    return results


@router.get("/history")
def compare_history(tickers: str = Query(...), period: str = "1y"):
    """Get normalized price history for comparison (rebased to 100)."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tickers")

    all_data = {}
    for ticker in ticker_list[:5]:
        hist = stock_data.get_price_history(ticker, period)
        if hist is not None and not hist.empty:
            base = hist["Close"].iloc[0]
            if base > 0:
                normalized = ((hist["Close"] / base) * 100).round(2)
                all_data[ticker] = [
                    {"date": date.strftime("%Y-%m-%d"), "value": float(val)}
                    for date, val in normalized.items()
                ]

    if not all_data:
        raise HTTPException(status_code=404, detail="No history data found")

    # Merge into unified date list
    all_dates = set()
    for ticker_data in all_data.values():
        for point in ticker_data:
            all_dates.add(point["date"])

    merged = []
    for date in sorted(all_dates):
        point = {"date": date}
        for ticker, data in all_data.items():
            val = next((d["value"] for d in data if d["date"] == date), None)
            point[ticker] = val
        merged.append(point)

    return {"tickers": ticker_list[:5], "data": merged}


@router.get("/ai-analysis")
def compare_ai_analysis(tickers: str = Query(...)):
    """Get AI comparison of multiple stocks."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 tickers")

    # Build context
    stocks_info = []
    for ticker in ticker_list[:5]:
        detail = stock_data.get_detailed_stock(ticker)
        if detail:
            stocks_info.append(detail)

    if not stocks_info:
        raise HTTPException(status_code=404, detail="No stocks found to compare")

    prompt = f"""Compare these stocks/ETFs side by side and provide a clear recommendation:

{', '.join(ticker_list[:5])}

Data for each:
"""
    for s in stocks_info:
        prompt += f"""
{s['ticker']} ({s['name']}):
- Price: ${s.get('price', 'N/A')}
- Market Cap: {s.get('marketCap', 'N/A')}
- P/E: {s.get('pe', 'N/A')}
- EPS: {s.get('eps', 'N/A')}
- Revenue Growth: {s.get('revenueGrowth', 'N/A')}
- Profit Margin: {s.get('profitMargin', 'N/A')}
- ROE: {s.get('returnOnEquity', 'N/A')}
- Beta: {s.get('beta', 'N/A')}
- Dividend: {s.get('dividend', 'N/A')}
- 52W High: {s.get('fiftyTwoWeekHigh', 'N/A')}
- 52W Low: {s.get('fiftyTwoWeekLow', 'N/A')}
- Target Price: {s.get('targetMeanPrice', 'N/A')}
- Analyst Rating: {s.get('recommendation', 'N/A')}
"""

    prompt += """
Provide:
1. Quick comparison table (key metrics)
2. Strengths and weaknesses of each
3. Which is the better investment and why
4. Risk assessment
5. Final recommendation with reasoning
"""

    # Use Groq API
    if not config.GROQ_API_KEY:
        return {"analysis": "AI analysis unavailable - no API key configured."}

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a professional stock analyst comparing investments."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
            },
            timeout=30,
        )
        data = resp.json()
        return {"analysis": data["choices"][0]["message"]["content"]}
    except Exception as e:
        return {"analysis": f"AI analysis failed: {str(e)}"}


@router.post("/correlation")
def get_correlation(body: dict):
    """Calculate price correlation matrix for a list of tickers over a given period."""
    tickers = body.get("tickers", [])
    period = body.get("period", "1y")

    if len(tickers) < 2 or len(tickers) > 10:
        raise HTTPException(status_code=400, detail="Provide 2-10 tickers")

    import pandas as pd
    import yfinance as yf

    # Download all price histories
    closes = {}
    for t in tickers:
        try:
            hist = yf.Ticker(t).history(period=period)
            if hist is not None and not hist.empty:
                closes[t] = hist['Close']
        except:
            continue

    if len(closes) < 2:
        raise HTTPException(status_code=400, detail="Not enough valid tickers")

    df = pd.DataFrame(closes)
    # Calculate daily returns correlation
    returns = df.pct_change().dropna()
    corr = returns.corr()

    # Convert to serializable format
    matrix = []
    tickers_found = list(corr.columns)
    for t1 in tickers_found:
        row = []
        for t2 in tickers_found:
            row.append(round(float(corr.loc[t1, t2]), 4))
        matrix.append(row)

    return {
        "tickers": tickers_found,
        "matrix": matrix,
        "period": period
    }
