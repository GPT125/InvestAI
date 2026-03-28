from typing import Optional, List, Dict
import yfinance as yf
import pandas as pd
import numpy as np
from backend.services import cache
from backend import config


def get_stock_info(ticker: str) -> Optional[dict]:
    key = f"info:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_STOCK_INFO)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        if not info or info.get("regularMarketPrice") is None:
            return None
        cache.set(key, info)
        return info
    except Exception:
        return None


def get_price_history(ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
    key = f"history:{ticker}:{period}"
    cached = cache.get(key, config.CACHE_TTL_PRICE_HISTORY)
    if cached is not None:
        return cached

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        if hist.empty:
            return None
        cache.set(key, hist)
        return hist
    except Exception:
        return None


def get_quick_quote(ticker: str) -> Optional[dict]:
    info = get_stock_info(ticker)
    if not info:
        return None

    return {
        "ticker": ticker,
        "name": info.get("shortName", info.get("longName", ticker)),
        "price": info.get("regularMarketPrice") or info.get("currentPrice"),
        "change": info.get("regularMarketChange", 0),
        "changePercent": info.get("regularMarketChangePercent", 0),
        "volume": info.get("regularMarketVolume", 0),
        "marketCap": info.get("marketCap", 0),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "quoteType": info.get("quoteType", "EQUITY"),
    }


def get_detailed_stock(ticker: str) -> Optional[dict]:
    info = get_stock_info(ticker)
    if not info:
        return None

    is_etf = info.get("quoteType", "").upper() == "ETF"

    # Try Finnhub for more real-time price data
    finnhub_quote = None
    try:
        from backend.services.multi_source import get_finnhub_quote
        finnhub_quote = get_finnhub_quote(ticker)
    except Exception:
        pass

    # Use Finnhub price if available and non-zero (more real-time), else yfinance
    price = info.get("regularMarketPrice") or info.get("currentPrice")
    change = info.get("regularMarketChange", 0)
    change_pct = info.get("regularMarketChangePercent", 0)
    if finnhub_quote and finnhub_quote.get("current"):
        price = finnhub_quote["current"]
        if finnhub_quote.get("change") is not None:
            change = finnhub_quote["change"]
        if finnhub_quote.get("changePercent") is not None:
            change_pct = finnhub_quote["changePercent"]

    result = {
        "ticker": ticker,
        "name": info.get("shortName", info.get("longName", ticker)),
        "price": price,
        "previousClose": info.get("previousClose"),
        "open": info.get("regularMarketOpen") or info.get("open"),
        "dayHigh": info.get("regularMarketDayHigh") or info.get("dayHigh"),
        "dayLow": info.get("regularMarketDayLow") or info.get("dayLow"),
        "volume": info.get("regularMarketVolume") or info.get("volume"),
        "avgVolume": info.get("averageVolume"),
        "marketCap": info.get("marketCap"),
        "pe": info.get("trailingPE"),
        "forwardPE": info.get("forwardPE"),
        "pb": info.get("priceToBook"),
        "ps": info.get("priceToSalesTrailing12Months"),
        "peg": info.get("pegRatio"),
        "eps": info.get("trailingEps"),
        "dividend": round(info.get("dividendYield", 0) / 100, 6) if info.get("dividendYield") else None,
        "beta": info.get("beta"),
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
        "fiftyDayAvg": info.get("fiftyDayAverage"),
        "twoHundredDayAvg": info.get("twoHundredDayAverage"),
        "revenueGrowth": info.get("revenueGrowth"),
        "earningsGrowth": info.get("earningsGrowth"),
        "profitMargin": info.get("profitMargins"),
        "operatingMargin": info.get("operatingMargins"),
        "returnOnEquity": info.get("returnOnEquity"),
        "debtToEquity": info.get("debtToEquity"),
        "freeCashflow": info.get("freeCashflow"),
        "currentRatio": info.get("currentRatio"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "description": info.get("longBusinessSummary", ""),
        "website": info.get("website", ""),
        "recommendation": info.get("recommendationKey", ""),
        "targetMeanPrice": info.get("targetMeanPrice"),
        "targetHighPrice": info.get("targetHighPrice"),
        "targetLowPrice": info.get("targetLowPrice"),
        "numberOfAnalysts": info.get("numberOfAnalystOpinions"),
        "change": change,
        "changePercent": change_pct,
        "quoteType": info.get("quoteType", "EQUITY"),
        "isETF": is_etf,
        # Pre/post market
        "preMarketPrice": info.get("preMarketPrice"),
        "preMarketChange": info.get("preMarketChange"),
        "preMarketChangePercent": info.get("preMarketChangePercent"),
        "postMarketPrice": info.get("postMarketPrice"),
        "postMarketChange": info.get("postMarketChange"),
        "postMarketChangePercent": info.get("postMarketChangePercent"),
    }

    # ETF-specific fields
    if is_etf:
        result["expenseRatio"] = info.get("annualReportExpenseRatio") or info.get("expenseRatio")
        result["totalAssets"] = info.get("totalAssets")
        result["ytdReturn"] = info.get("ytdReturn")
        result["threeYearReturn"] = info.get("threeYearAverageReturn")
        result["fiveYearReturn"] = info.get("fiveYearAverageReturn")
        result["fundFamily"] = info.get("fundFamily", "N/A")
        result["category"] = info.get("category", "N/A")

    return result


def search_tickers(query: str, tickers_list: list) -> List[dict]:
    query = query.upper().strip()
    results = []
    for ticker in tickers_list:
        if query in ticker:
            quote = get_quick_quote(ticker)
            if quote:
                results.append(quote)
            if len(results) >= 10:
                break
    return results


def search_all_tickers(query: str) -> List[dict]:
    """Search for ANY stock/ETF using yfinance, not limited to our static list."""
    key = f"search:{query}"
    cached = cache.get(key, 300)
    if cached is not None:
        return cached

    query = query.strip()
    if not query:
        return []

    results = []
    seen = set()

    # Try direct ticker lookup first
    try:
        ticker_upper = query.upper()
        quote = get_quick_quote(ticker_upper)
        if quote and quote.get("price"):
            results.append(quote)
            seen.add(ticker_upper)
    except Exception:
        pass

    # Also try yfinance search for broader results
    try:
        search_obj = yf.Search(query, max_results=15)
        search_quotes = search_obj.quotes if search_obj.quotes else []
        for item in search_quotes:
            sym = item.get("symbol", "")
            exchange = item.get("exchange", "")
            # Include US-traded stocks and ETFs
            us_exchanges = ("NMS", "NYQ", "NGM", "NCM", "PCX", "ASE", "BTS", "NAS")
            if sym and sym not in seen and item.get("quoteType") in ("EQUITY", "ETF") and exchange in us_exchanges:
                q = get_quick_quote(sym)
                if q and q.get("price"):
                    results.append(q)
                    seen.add(sym)
                if len(results) >= 15:
                    break
    except Exception:
        pass

    cache.set(key, results)
    return results


def get_extended_hours(ticker: str) -> Optional[dict]:
    """Get pre-market and post-market data."""
    info = get_stock_info(ticker)
    if not info:
        return None

    return {
        "ticker": ticker,
        "preMarketPrice": info.get("preMarketPrice"),
        "preMarketChange": info.get("preMarketChange"),
        "preMarketChangePercent": info.get("preMarketChangePercent"),
        "postMarketPrice": info.get("postMarketPrice"),
        "postMarketChange": info.get("postMarketChange"),
        "postMarketChangePercent": info.get("postMarketChangePercent"),
    }


def get_extended_hours_history(ticker: str) -> Optional[List[dict]]:
    """Get recent after-hours price data points for charting."""
    key = f"ext_hist:{ticker}"
    cached = cache.get(key, 120)
    if cached is not None:
        return cached

    try:
        stock = yf.Ticker(ticker)
        # Get 5-day intraday data which includes pre/post market
        # Use 15m interval for cleaner chart with fewer data points
        hist = stock.history(period="5d", interval="15m", prepost=True)
        if hist is None or hist.empty:
            return None

        points = []
        for date, row in hist.iterrows():
            # yfinance returns exchange-timezone-aware timestamps
            # Convert to US/Eastern if needed for accurate market hour detection
            try:
                import pytz
                et = pytz.timezone("US/Eastern")
                local_dt = date.astimezone(et) if date.tzinfo else date
            except Exception:
                local_dt = date

            hour = local_dt.hour
            minute = local_dt.minute
            # Regular market hours: 9:30 AM - 4:00 PM Eastern
            is_regular = (hour == 9 and minute >= 30) or (10 <= hour < 16)
            is_extended = not is_regular

            close_val = row["Close"]
            if pd.notna(close_val):
                points.append({
                    "date": local_dt.strftime("%Y-%m-%d %H:%M"),
                    "close": round(float(close_val), 2),
                    "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
                    "isExtended": is_extended,
                })

        cache.set(key, points)
        return points
    except Exception:
        return None


def get_etf_holdings(ticker: str) -> Optional[dict]:
    """Get ETF top holdings with weights, sector weights, and fund info."""
    key = f"etf_holdings:{ticker}"
    cached = cache.get(key, config.CACHE_TTL_STOCK_INFO)
    if cached is not None:
        return cached

    try:
        etf = yf.Ticker(ticker)
        info = etf.info

        if info.get("quoteType", "").upper() != "ETF":
            return None

        result = {
            "ticker": ticker,
            "name": info.get("shortName", info.get("longName", ticker)),
            "expenseRatio": info.get("annualReportExpenseRatio") or info.get("expenseRatio"),
            "totalAssets": info.get("totalAssets"),
            "fundFamily": info.get("fundFamily", "N/A"),
            "category": info.get("category", "N/A"),
            "ytdReturn": info.get("ytdReturn"),
            "threeYearReturn": info.get("threeYearAverageReturn"),
            "fiveYearReturn": info.get("fiveYearAverageReturn"),
            "holdings": [],
            "sectorWeights": [],
        }

        # Try funds_data.top_holdings first (has actual stock holdings with weights)
        try:
            funds = etf.funds_data
            if hasattr(funds, 'top_holdings') and funds.top_holdings is not None:
                top = funds.top_holdings
                if not top.empty:
                    for symbol, row in top.iterrows():
                        weight = row.get("Holding Percent", 0)
                        if isinstance(weight, (int, float)):
                            weight_pct = round(weight * 100, 2)
                        else:
                            weight_pct = 0
                        result["holdings"].append({
                            "symbol": str(symbol),
                            "name": str(row.get("Name", symbol)),
                            "weight": weight_pct,
                        })
            # Try sector weightings
            if hasattr(funds, 'sector_weightings') and funds.sector_weightings is not None:
                sw = funds.sector_weightings
                if isinstance(sw, dict):
                    for sector, weight in sw.items():
                        result["sectorWeights"].append({
                            "sector": sector.replace("_", " ").title(),
                            "weight": round(weight * 100, 2) if isinstance(weight, (int, float)) else 0,
                        })
                elif isinstance(sw, list):
                    for item in sw:
                        if isinstance(item, dict):
                            for sector, weight in item.items():
                                result["sectorWeights"].append({
                                    "sector": sector.replace("_", " ").title(),
                                    "weight": round(weight * 100, 2) if isinstance(weight, (int, float)) else 0,
                                })
        except Exception:
            pass

        # Fallback to institutional_holders if no holdings yet
        if not result["holdings"]:
            try:
                top_holders = etf.institutional_holders
                if top_holders is not None and not top_holders.empty:
                    for _, row in top_holders.head(15).iterrows():
                        result["holdings"].append({
                            "symbol": "",
                            "name": str(row.get("Holder", "")),
                            "weight": 0,
                            "shares": int(row.get("Shares", 0)) if pd.notna(row.get("Shares")) else 0,
                            "value": float(row.get("Value", 0)) if pd.notna(row.get("Value")) else 0,
                        })
            except Exception:
                pass

        cache.set(key, result)
        return result
    except Exception:
        return None


def get_earnings_data(ticker: str) -> Optional[dict]:
    """Get quarterly earnings (EPS actual vs estimate) and revenue data."""
    key = f"earnings:{ticker}"
    cached = cache.get(key, 3600)
    if cached is not None:
        return cached

    try:
        stock = yf.Ticker(ticker)
        result = {"ticker": ticker, "quarterly_earnings": [], "quarterly_revenue": []}

        # Quarterly earnings (EPS actual vs estimate)
        try:
            earnings = stock.quarterly_earnings
            if earnings is not None and not earnings.empty:
                for idx, row in earnings.iterrows():
                    result["quarterly_earnings"].append({
                        "quarter": str(idx),
                        "actual": round(float(row.get("Earnings", 0)), 2) if pd.notna(row.get("Earnings")) else None,
                        "estimate": round(float(row.get("Revenue", 0)), 2) if pd.notna(row.get("Revenue")) else None,
                    })
        except Exception:
            pass

        # Try earnings_history for EPS actual vs estimate
        try:
            eh = stock.earnings_history
            if eh is not None and not eh.empty:
                eps_data = []
                for idx, row in eh.iterrows():
                    quarter_str = idx.strftime("%Y-Q") + str((idx.month - 1) // 3 + 1) if hasattr(idx, 'strftime') else str(idx)
                    eps_data.append({
                        "date": idx.strftime("%Y-%m-%d") if hasattr(idx, 'strftime') else str(idx),
                        "quarter": quarter_str,
                        "epsActual": round(float(row.get("epsActual", 0)), 2) if pd.notna(row.get("epsActual")) else None,
                        "epsEstimate": round(float(row.get("epsEstimate", 0)), 2) if pd.notna(row.get("epsEstimate")) else None,
                        "surprise": round(float(row.get("surprisePercent", 0)) * 100, 2) if pd.notna(row.get("surprisePercent")) else None,
                    })
                result["eps_history"] = eps_data
        except Exception:
            pass

        # Fallback: Try earnings_dates if earnings_history was empty
        if not result.get("eps_history"):
            try:
                edates = stock.earnings_dates
                if edates is not None and not edates.empty:
                    eps_data = []
                    for idx, row in edates.head(8).iterrows():
                        eps_actual = row.get("Reported EPS")
                        eps_est = row.get("EPS Estimate")
                        surprise = row.get("Surprise(%)")
                        quarter_str = idx.strftime("%Y-Q") + str((idx.month - 1) // 3 + 1)
                        eps_data.append({
                            "date": idx.strftime("%Y-%m-%d"),
                            "quarter": quarter_str,
                            "epsActual": round(float(eps_actual), 2) if pd.notna(eps_actual) else None,
                            "epsEstimate": round(float(eps_est), 2) if pd.notna(eps_est) else None,
                            "surprise": round(float(surprise), 2) if pd.notna(surprise) else None,
                        })
                    result["eps_history"] = eps_data
            except Exception:
                pass

        # Quarterly financials for revenue + earnings bars
        try:
            qf = stock.quarterly_financials
            if qf is not None and not qf.empty:
                rev_data = []
                for col in list(qf.columns)[:8]:
                    quarter_label = col.strftime("%Q%q") if hasattr(col, 'strftime') else str(col)
                    revenue = qf.loc["Total Revenue", col] if "Total Revenue" in qf.index else None
                    net_income = qf.loc["Net Income", col] if "Net Income" in qf.index else None
                    rev_data.append({
                        "quarter": col.strftime("%Y-Q") + str((col.month - 1) // 3 + 1) if hasattr(col, 'strftime') else str(col),
                        "revenue": int(revenue) if pd.notna(revenue) else None,
                        "earnings": int(net_income) if pd.notna(net_income) else None,
                    })
                result["quarterly_revenue"] = list(reversed(rev_data))
        except Exception:
            pass

        cache.set(key, result)
        return result
    except Exception:
        return None


def get_performance_comparison(ticker: str) -> Optional[dict]:
    """Get YTD, 1Y, 3Y, 5Y returns compared to S&P 500."""
    key = f"perf_comp:{ticker}"
    cached = cache.get(key, 3600)
    if cached is not None:
        return cached

    try:
        stock = yf.Ticker(ticker)
        spy = yf.Ticker("^GSPC")

        periods = {
            "ytd": "ytd",
            "1y": "1y",
            "3y": "3y",
            "5y": "5y",
        }

        result = {"ticker": ticker, "periods": {}}

        for label, period in periods.items():
            try:
                stock_hist = stock.history(period=period)
                spy_hist = spy.history(period=period)

                if stock_hist is not None and not stock_hist.empty and spy_hist is not None and not spy_hist.empty:
                    stock_return = ((stock_hist["Close"].iloc[-1] / stock_hist["Close"].iloc[0]) - 1) * 100
                    spy_return = ((spy_hist["Close"].iloc[-1] / spy_hist["Close"].iloc[0]) - 1) * 100
                    result["periods"][label] = {
                        "stockReturn": round(stock_return, 2),
                        "spReturn": round(spy_return, 2),
                    }
            except Exception:
                pass

        cache.set(key, result)
        return result
    except Exception:
        return None


def get_analyst_data(ticker: str) -> Optional[dict]:
    """Get detailed analyst recommendations, price targets, and ratings."""
    key = f"analyst:{ticker}"
    cached = cache.get(key, 3600)
    if cached is not None:
        return cached

    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}

        result = {
            "ticker": ticker,
            "targetLow": info.get("targetLowPrice"),
            "targetMean": info.get("targetMeanPrice"),
            "targetMedian": info.get("targetMedianPrice"),
            "targetHigh": info.get("targetHighPrice"),
            "currentPrice": info.get("regularMarketPrice") or info.get("currentPrice"),
            "numberOfAnalysts": info.get("numberOfAnalystOpinions"),
            "recommendation": info.get("recommendationKey", ""),
            "recommendationMean": info.get("recommendationMean"),
            "recommendations_history": [],
        }

        # Get recommendations timeline
        try:
            recs = stock.recommendations
            if recs is not None and not recs.empty:
                # Group by month for chart
                monthly = {}
                for idx, row in recs.tail(100).iterrows():
                    date = idx if hasattr(idx, 'strftime') else pd.Timestamp(idx)
                    month_key = date.strftime("%Y-%m")
                    if month_key not in monthly:
                        monthly[month_key] = {"strongBuy": 0, "buy": 0, "hold": 0, "sell": 0, "strongSell": 0}

                    grade = str(row.get("To Grade", "")).lower()
                    if "strong buy" in grade or "outperform" in grade:
                        monthly[month_key]["strongBuy"] += 1
                    elif "buy" in grade or "overweight" in grade:
                        monthly[month_key]["buy"] += 1
                    elif "hold" in grade or "neutral" in grade or "equal" in grade or "market perform" in grade:
                        monthly[month_key]["hold"] += 1
                    elif "sell" in grade or "underweight" in grade or "underperform" in grade:
                        monthly[month_key]["sell"] += 1

                # Get last 4 months
                sorted_months = sorted(monthly.keys(), reverse=True)[:4]
                for m in reversed(sorted_months):
                    result["recommendations_history"].append({
                        "month": m,
                        **monthly[m],
                    })

                # Latest individual rating
                last_rec = recs.tail(1).iloc[0]
                last_idx = recs.tail(1).index[0]
                result["latestRating"] = {
                    "date": last_idx.strftime("%Y-%m-%d") if hasattr(last_idx, 'strftime') else str(last_idx),
                    "firm": str(last_rec.get("Firm", "")),
                    "action": str(last_rec.get("Action", "")),
                    "fromGrade": str(last_rec.get("From Grade", "")),
                    "toGrade": str(last_rec.get("To Grade", "")),
                }
        except Exception:
            pass

        cache.set(key, result)
        return result
    except Exception:
        return None


def get_financial_stats(ticker: str) -> Optional[dict]:
    """Get detailed valuation measures and financial highlights."""
    key = f"fin_stats:{ticker}"
    cached = cache.get(key, 3600)
    if cached is not None:
        return cached

    try:
        info = get_stock_info(ticker)
        if not info:
            return None

        result = {
            "ticker": ticker,
            "valuation": {
                "marketCap": info.get("marketCap"),
                "enterpriseValue": info.get("enterpriseValue"),
                "trailingPE": info.get("trailingPE"),
                "forwardPE": info.get("forwardPE"),
                "pegRatio": info.get("pegRatio"),
                "priceToSales": info.get("priceToSalesTrailing12Months"),
                "priceToBook": info.get("priceToBook"),
                "evToRevenue": info.get("enterpriseToRevenue"),
                "evToEbitda": info.get("enterpriseToEbitda"),
            },
            "financials": {
                "profitMargin": info.get("profitMargins"),
                "returnOnAssets": info.get("returnOnAssets"),
                "returnOnEquity": info.get("returnOnEquity"),
                "revenue": info.get("totalRevenue"),
                "netIncome": info.get("netIncomeToCommon"),
                "dilutedEPS": info.get("trailingEps"),
                "totalCash": info.get("totalCash"),
                "totalDebt": info.get("totalDebt"),
                "debtToEquity": info.get("debtToEquity"),
                "freeCashflow": info.get("freeCashflow"),
                "operatingCashflow": info.get("operatingCashflow"),
                "currentRatio": info.get("currentRatio"),
                "bookValue": info.get("bookValue"),
            },
            "dividends": {
                "dividendRate": info.get("dividendRate"),
                "dividendYield": round(info.get("dividendYield", 0) / 100, 6) if info.get("dividendYield") else None,
                "exDividendDate": info.get("exDividendDate"),
                "payoutRatio": info.get("payoutRatio"),
                "fiveYearAvgDividendYield": info.get("fiveYearAvgDividendYield"),
            },
        }

        cache.set(key, result)
        return result
    except Exception:
        return None


def get_historical_summary(ticker: str) -> Optional[dict]:
    """Get yearly historical summary - fetch max available data (up to 30+ years)."""
    key = f"hist_summary:{ticker}"
    cached = cache.get(key, 3600)
    if cached is not None:
        return cached

    try:
        # Fetch maximum available history
        hist = get_price_history(ticker, "max")
        if hist is None or hist.empty:
            return None

        yearly = {}
        for date, row in hist.iterrows():
            year = date.year
            if year not in yearly:
                yearly[year] = {"highs": [], "lows": [], "opens": [], "closes": []}
            yearly[year]["highs"].append(row["High"])
            yearly[year]["lows"].append(row["Low"])
            yearly[year]["opens"].append(row["Open"])
            yearly[year]["closes"].append(row["Close"])

        summary = []
        for year in sorted(yearly.keys()):
            data = yearly[year]
            year_open = data["opens"][0]
            year_close = data["closes"][-1]
            year_return = ((year_close - year_open) / year_open * 100) if year_open else 0
            summary.append({
                "year": year,
                "high": round(max(data["highs"]), 2),
                "low": round(min(data["lows"]), 2),
                "open": round(year_open, 2),
                "close": round(year_close, 2),
                "returnPct": round(year_return, 2),
            })

        result = {"ticker": ticker, "years": summary, "yearsAvailable": len(summary)}
        cache.set(key, result)
        return result
    except Exception:
        return None


def get_peer_comparison(ticker: str) -> Optional[dict]:
    """Get comparison data for a stock's peers in the same sector."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        sector = info.get("sector", "")
        industry = info.get("industry", "")

        # Get stock's own data
        current = {
            "ticker": ticker,
            "name": info.get("shortName", ticker),
            "price": info.get("regularMarketPrice") or info.get("currentPrice", 0),
            "marketCap": info.get("marketCap", 0),
            "pe": info.get("trailingPE"),
            "forwardPE": info.get("forwardPE"),
            "pb": info.get("priceToBook"),
            "dividendYield": info.get("dividendYield"),
            "profitMargin": info.get("profitMargins"),
            "revenueGrowth": info.get("revenueGrowth"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"),
            "beta": info.get("beta"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
        }

        # Find peers from SP500 in same sector
        from backend.data.sp500_tickers import SP500_TICKERS
        peers = []
        for t in SP500_TICKERS[:100]:
            if t == ticker:
                continue
            try:
                p_info = get_stock_info(t)
                if p_info and p_info.get("sector") == sector:
                    peers.append({
                        "ticker": t,
                        "name": p_info.get("shortName", t),
                        "price": p_info.get("regularMarketPrice") or p_info.get("currentPrice", 0),
                        "marketCap": p_info.get("marketCap", 0),
                        "pe": p_info.get("trailingPE"),
                        "forwardPE": p_info.get("forwardPE"),
                        "pb": p_info.get("priceToBook"),
                        "dividendYield": p_info.get("dividendYield"),
                        "profitMargin": p_info.get("profitMargins"),
                        "revenueGrowth": p_info.get("revenueGrowth"),
                        "roe": p_info.get("returnOnEquity"),
                        "debtToEquity": p_info.get("debtToEquity"),
                        "beta": p_info.get("beta"),
                    })
                    if len(peers) >= 5:
                        break
            except:
                continue

        return {"current": current, "peers": peers, "sector": sector, "industry": industry}
    except:
        return None


def get_technical_indicators(ticker: str) -> Optional[dict]:
    """Compute thinkorswim-style technical indicators from 1 year of daily data."""
    key = f"technicals:{ticker}"
    cached = cache.get(key, 300)
    if cached is not None:
        return cached

    try:
        hist = get_price_history(ticker, "1y")
        if hist is None or hist.empty or len(hist) < 50:
            return None

        close = hist["Close"].astype(float)
        high = hist["High"].astype(float)
        low = hist["Low"].astype(float)
        volume = hist["Volume"].astype(float)

        # --- RSI (14-period) ---
        delta = close.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = (-delta).where(delta < 0, 0.0)
        avg_gain = gain.ewm(alpha=1 / 14, min_periods=14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1 / 14, min_periods=14, adjust=False).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi_series = 100 - (100 / (1 + rs))
        rsi = round(float(rsi_series.iloc[-1]), 2) if pd.notna(rsi_series.iloc[-1]) else None

        # --- MACD (12, 26, 9) ---
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_histogram = macd_line - signal_line
        macd_val = round(float(macd_line.iloc[-1]), 4) if pd.notna(macd_line.iloc[-1]) else None
        signal_val = round(float(signal_line.iloc[-1]), 4) if pd.notna(signal_line.iloc[-1]) else None
        hist_val = round(float(macd_histogram.iloc[-1]), 4) if pd.notna(macd_histogram.iloc[-1]) else None

        # --- Bollinger Bands (20-period, 2 std dev) ---
        bb_middle = close.rolling(window=20).mean()
        bb_std = close.rolling(window=20).std()
        bb_upper = bb_middle + 2 * bb_std
        bb_lower = bb_middle - 2 * bb_std
        bb_upper_val = round(float(bb_upper.iloc[-1]), 2) if pd.notna(bb_upper.iloc[-1]) else None
        bb_middle_val = round(float(bb_middle.iloc[-1]), 2) if pd.notna(bb_middle.iloc[-1]) else None
        bb_lower_val = round(float(bb_lower.iloc[-1]), 2) if pd.notna(bb_lower.iloc[-1]) else None

        # --- SMA 50 & 200 ---
        sma50_series = close.rolling(window=50).mean()
        sma200_series = close.rolling(window=200).mean()
        sma50 = round(float(sma50_series.iloc[-1]), 2) if pd.notna(sma50_series.iloc[-1]) else None
        sma200 = round(float(sma200_series.iloc[-1]), 2) if len(close) >= 200 and pd.notna(sma200_series.iloc[-1]) else None

        # --- EMA 50 & 200 ---
        ema50_series = close.ewm(span=50, adjust=False).mean()
        ema200_series = close.ewm(span=200, adjust=False).mean()
        ema50 = round(float(ema50_series.iloc[-1]), 2) if pd.notna(ema50_series.iloc[-1]) else None
        ema200 = round(float(ema200_series.iloc[-1]), 2) if len(close) >= 200 and pd.notna(ema200_series.iloc[-1]) else None

        # --- Volume SMA (20-day) ---
        vol_sma20 = volume.rolling(window=20).mean()
        volume_sma20 = int(round(float(vol_sma20.iloc[-1]))) if pd.notna(vol_sma20.iloc[-1]) else None

        # --- ATR (14-period) ---
        prev_close = close.shift(1)
        tr = pd.concat([
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ], axis=1).max(axis=1)
        atr_series = tr.ewm(alpha=1 / 14, min_periods=14, adjust=False).mean()
        atr = round(float(atr_series.iloc[-1]), 2) if pd.notna(atr_series.iloc[-1]) else None

        # --- Stochastic Oscillator (14, 3, 3) ---
        low14 = low.rolling(window=14).min()
        high14 = high.rolling(window=14).max()
        stoch_k = 100 * (close - low14) / (high14 - low14).replace(0, np.nan)
        stoch_k_smooth = stoch_k.rolling(window=3).mean()  # %K smoothed
        stoch_d = stoch_k_smooth.rolling(window=3).mean()   # %D
        k_val = round(float(stoch_k_smooth.iloc[-1]), 2) if pd.notna(stoch_k_smooth.iloc[-1]) else None
        d_val = round(float(stoch_d.iloc[-1]), 2) if pd.notna(stoch_d.iloc[-1]) else None

        # --- Individual Signals ---
        current_price = float(close.iloc[-1])
        signals = {}

        # RSI signal
        if rsi is not None:
            if rsi > 70:
                signals["rsi"] = "Bearish"
            elif rsi < 30:
                signals["rsi"] = "Bullish"
            else:
                signals["rsi"] = "Neutral"
        else:
            signals["rsi"] = "Neutral"

        # MACD signal
        if macd_val is not None and signal_val is not None and hist_val is not None:
            if macd_val > signal_val and hist_val > 0:
                signals["macd"] = "Bullish"
            elif macd_val < signal_val and hist_val < 0:
                signals["macd"] = "Bearish"
            else:
                signals["macd"] = "Neutral"
        else:
            signals["macd"] = "Neutral"

        # Bollinger signal
        if bb_upper_val is not None and bb_lower_val is not None:
            if current_price > bb_upper_val:
                signals["bollinger"] = "Bearish"
            elif current_price < bb_lower_val:
                signals["bollinger"] = "Bullish"
            else:
                signals["bollinger"] = "Neutral"
        else:
            signals["bollinger"] = "Neutral"

        # Moving average signal
        if sma50 is not None and sma200 is not None:
            if current_price > sma50 and sma50 > sma200:
                signals["movingAvg"] = "Bullish"
            elif current_price < sma50 and sma50 < sma200:
                signals["movingAvg"] = "Bearish"
            else:
                signals["movingAvg"] = "Neutral"
        elif sma50 is not None:
            signals["movingAvg"] = "Bullish" if current_price > sma50 else "Bearish"
        else:
            signals["movingAvg"] = "Neutral"

        # Stochastic signal
        if k_val is not None and d_val is not None:
            if k_val > 80 and d_val > 80:
                signals["stochastic"] = "Bearish"
            elif k_val < 20 and d_val < 20:
                signals["stochastic"] = "Bullish"
            else:
                signals["stochastic"] = "Neutral"
        else:
            signals["stochastic"] = "Neutral"

        # --- Overall Signal (composite) ---
        score = 0
        for sig in signals.values():
            if sig == "Bullish":
                score += 1
            elif sig == "Bearish":
                score -= 1

        if score >= 2:
            overall = "Bullish"
        elif score <= -2:
            overall = "Bearish"
        else:
            overall = "Neutral"

        result = {
            "ticker": ticker,
            "rsi": rsi,
            "macd": {"macd": macd_val, "signal": signal_val, "histogram": hist_val},
            "bollingerBands": {"upper": bb_upper_val, "middle": bb_middle_val, "lower": bb_lower_val},
            "sma50": sma50,
            "sma200": sma200,
            "ema50": ema50,
            "ema200": ema200,
            "volumeSma20": volume_sma20,
            "atr": atr,
            "stochastic": {"k": k_val, "d": d_val},
            "overallSignal": overall,
            "signals": signals,
        }

        cache.set(key, result)
        return result
    except Exception:
        return None
