import json
import os
from typing import Optional, List, Dict
from datetime import datetime
from backend.services import stock_data, cache
from backend.services.scoring_engine import compute_score

_DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
_DATA_DIR = os.getenv('DATA_DIR', _DEFAULT_DATA_DIR)
PORTFOLIO_FILE = os.path.join(_DATA_DIR, 'portfolio.json')

# Default holdings from user's spreadsheet
DEFAULT_HOLDINGS = [
    {"ticker": "ARKF", "shares": 12, "avg_cost": 37.45},
    {"ticker": "HIMS", "shares": 10, "avg_cost": 26.70},
    {"ticker": "SPYM", "shares": 14, "avg_cost": 71.54},
    {"ticker": "BAR", "shares": 7, "avg_cost": 39.79},
    {"ticker": "SCHG", "shares": 15, "avg_cost": 30.43},
    {"ticker": "F", "shares": 23, "avg_cost": 13.44},
    {"ticker": "ET", "shares": 10, "avg_cost": 16.42},
    {"ticker": "BAC", "shares": 14, "avg_cost": 57.06},
    {"ticker": "SLV", "shares": 17, "avg_cost": 68.80},
]

# Map ETF categories/names to sectors for proper classification
ETF_SECTOR_MAP = {
    "technology": "Technology",
    "tech": "Technology",
    "fintech": "Technology",
    "innovation": "Technology",
    "internet": "Technology",
    "software": "Technology",
    "semiconductor": "Technology",
    "health": "Healthcare",
    "biotech": "Healthcare",
    "pharma": "Healthcare",
    "financial": "Financials",
    "banking": "Financials",
    "bank": "Financials",
    "energy": "Energy",
    "oil": "Energy",
    "gas": "Energy",
    "midstream": "Energy",
    "pipeline": "Energy",
    "industrial": "Industrials",
    "consumer": "Consumer Discretionary",
    "retail": "Consumer Discretionary",
    "staple": "Consumer Staples",
    "material": "Materials",
    "gold": "Materials",
    "silver": "Materials",
    "metal": "Materials",
    "mining": "Materials",
    "commodit": "Materials",
    "precious": "Materials",
    "real estate": "Real Estate",
    "reit": "Real Estate",
    "utilit": "Utilities",
    "communication": "Communication Services",
    "media": "Communication Services",
    "growth": "Growth Blend",
    "value": "Value Blend",
    "large cap": "Large Cap Blend",
    "small cap": "Small Cap Blend",
    "mid cap": "Mid Cap Blend",
    "index": "Index Fund",
    "s&p": "Large Cap Blend",
    "total market": "Total Market",
    "bond": "Fixed Income",
    "fixed income": "Fixed Income",
    "treasury": "Fixed Income",
    "aggregate": "Fixed Income",
    "international": "International",
    "emerging": "Emerging Markets",
    "foreign": "International",
    "global": "International",
}

# Known ticker-to-sector overrides for common ETFs
TICKER_SECTOR_MAP = {
    "ARKF": "Technology",
    "ARKK": "Technology",
    "ARKG": "Healthcare",
    "ARKW": "Technology",
    "SPY": "Large Cap Blend",
    "QQQ": "Technology",
    "VOO": "Large Cap Blend",
    "VTI": "Total Market",
    "SPYM": "Large Cap Blend",
    "BAR": "Materials",
    "GLD": "Materials",
    "SLV": "Materials",
    "SCHG": "Growth Blend",
    "SCHD": "Dividend Blend",
    "VIG": "Dividend Blend",
    "VYM": "Dividend Blend",
    "BND": "Fixed Income",
    "AGG": "Fixed Income",
    "TLT": "Fixed Income",
    "HYG": "Fixed Income",
    "LQD": "Fixed Income",
    "VNQ": "Real Estate",
    "IYR": "Real Estate",
    "XLRE": "Real Estate",
    "XLK": "Technology",
    "XLF": "Financials",
    "XLV": "Healthcare",
    "XLE": "Energy",
    "XLI": "Industrials",
    "XLC": "Communication Services",
    "XLY": "Consumer Discretionary",
    "XLP": "Consumer Staples",
    "XLB": "Materials",
    "XLU": "Utilities",
    "SMH": "Technology",
    "SOXX": "Technology",
    "XBI": "Healthcare",
    "DIA": "Large Cap Blend",
    "IWM": "Small Cap Blend",
    "EEM": "Emerging Markets",
    "IEMG": "Emerging Markets",
    "VEA": "International",
    "VWO": "Emerging Markets",
}


def _get_sector(ticker: str, info: dict) -> str:
    """Get a meaningful sector for any stock or ETF."""
    ticker_upper = ticker.upper()
    if ticker_upper in TICKER_SECTOR_MAP:
        return TICKER_SECTOR_MAP[ticker_upper]

    sector = info.get("sector", "")
    if sector and sector != "N/A" and sector.strip():
        return sector

    # For ETFs, derive from category or name
    category = (info.get("category") or "").lower()
    name = (info.get("shortName") or info.get("longName") or "").lower()

    for search_text in [category, name]:
        if search_text:
            for keyword, mapped_sector in ETF_SECTOR_MAP.items():
                if keyword in search_text:
                    return mapped_sector

    quote_type = info.get("quoteType", "").upper()
    if quote_type == "ETF":
        return "ETF - Other"

    return "Other"


def _load_portfolio() -> Dict:
    if not os.path.exists(PORTFOLIO_FILE):
        data = {"holdings": DEFAULT_HOLDINGS, "sold_holdings": []}
        _save_portfolio(data)
        return data
    try:
        with open(PORTFOLIO_FILE, "r") as f:
            data = json.load(f)
            if "sold_holdings" not in data:
                data["sold_holdings"] = []
            return data
    except Exception:
        return {"holdings": [], "sold_holdings": []}


def _save_portfolio(data: Dict):
    os.makedirs(os.path.dirname(PORTFOLIO_FILE), exist_ok=True)
    with open(PORTFOLIO_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_portfolio() -> Dict:
    """Get portfolio with live prices and calculated metrics."""
    key = "portfolio:full"
    cached = cache.get(key, 60)
    if cached is not None:
        return cached

    data = _load_portfolio()
    holdings = data.get("holdings", [])
    sold_holdings = data.get("sold_holdings", [])

    enriched = []
    total_value = 0
    total_cost = 0

    for h in holdings:
        ticker = h["ticker"]
        shares = h["shares"]
        avg_cost = h["avg_cost"]

        info = stock_data.get_stock_info(ticker)
        current_price = None
        name = ticker
        sector = "Other"
        quote_type = "EQUITY"

        if info:
            current_price = info.get("regularMarketPrice") or info.get("currentPrice")
            name = info.get("shortName", info.get("longName", ticker))
            sector = _get_sector(ticker, info)
            quote_type = info.get("quoteType", "EQUITY")

        cost_basis = shares * avg_cost
        market_value = shares * current_price if current_price else cost_basis
        gain_loss = market_value - cost_basis
        gain_loss_pct = (gain_loss / cost_basis * 100) if cost_basis > 0 else 0

        total_value += market_value
        total_cost += cost_basis

        enriched.append({
            "ticker": ticker,
            "name": name,
            "shares": shares,
            "avgCost": avg_cost,
            "currentPrice": current_price,
            "costBasis": round(cost_basis, 2),
            "marketValue": round(market_value, 2),
            "gainLoss": round(gain_loss, 2),
            "gainLossPct": round(gain_loss_pct, 2),
            "sector": sector,
            "quoteType": quote_type,
        })

    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0

    # Sector allocation
    sector_map = {}
    for h in enriched:
        s = h["sector"]
        sector_map[s] = sector_map.get(s, 0) + h["marketValue"]
    sector_allocation = [
        {
            "sector": s,
            "value": round(v, 2),
            "percent": round(v / total_value * 100, 1) if total_value else 0,
        }
        for s, v in sorted(sector_map.items(), key=lambda x: -x[1])
    ]

    result = {
        "holdings": enriched,
        "soldHoldings": sold_holdings,
        "summary": {
            "totalValue": round(total_value, 2),
            "totalCost": round(total_cost, 2),
            "totalGainLoss": round(total_gain, 2),
            "totalGainLossPct": round(total_gain_pct, 2),
            "holdingsCount": len(enriched),
        },
        "sectorAllocation": sector_allocation,
    }

    cache.set(key, result)
    return result


def add_holding(ticker: str, shares: float, avg_cost: float) -> Dict:
    data = _load_portfolio()
    holdings = data.get("holdings", [])

    found = False
    for h in holdings:
        if h["ticker"].upper() == ticker.upper():
            total_shares = h["shares"] + shares
            total_cost = h["shares"] * h["avg_cost"] + shares * avg_cost
            h["shares"] = total_shares
            h["avg_cost"] = round(total_cost / total_shares, 2)
            found = True
            break

    if not found:
        holdings.append({
            "ticker": ticker.upper(),
            "shares": shares,
            "avg_cost": avg_cost,
        })

    data["holdings"] = holdings
    _save_portfolio(data)
    cache.set("portfolio:full", None)
    return get_portfolio()


def remove_holding(ticker: str) -> Dict:
    data = _load_portfolio()
    holdings = data.get("holdings", [])
    sold_holdings = data.get("sold_holdings", [])

    removed = None
    for h in holdings:
        if h["ticker"].upper() == ticker.upper():
            removed = h
            break

    if removed:
        info = stock_data.get_stock_info(ticker.upper())
        sell_price = None
        name = ticker.upper()
        if info:
            sell_price = info.get("regularMarketPrice") or info.get("currentPrice")
            name = info.get("shortName", info.get("longName", ticker.upper()))

        sold_holdings.append({
            "ticker": removed["ticker"],
            "name": name,
            "shares": removed["shares"],
            "avgCost": removed["avg_cost"],
            "soldPrice": sell_price,
            "soldDate": datetime.now().strftime("%Y-%m-%d"),
            "gainLoss": round((sell_price - removed["avg_cost"]) * removed["shares"], 2) if sell_price else 0,
            "gainLossPct": round((sell_price / removed["avg_cost"] - 1) * 100, 2) if sell_price and removed["avg_cost"] else 0,
        })

    data["holdings"] = [h for h in holdings if h["ticker"].upper() != ticker.upper()]
    data["sold_holdings"] = sold_holdings
    _save_portfolio(data)
    cache.set("portfolio:full", None)
    return get_portfolio()


def update_holding(ticker: str, shares: float = None, avg_cost: float = None) -> Dict:
    """Update an existing holding's shares or avg_cost."""
    data = _load_portfolio()
    holdings = data.get("holdings", [])

    found = False
    for h in holdings:
        if h["ticker"].upper() == ticker.upper():
            if shares is not None:
                h["shares"] = shares
            if avg_cost is not None:
                h["avg_cost"] = avg_cost
            found = True
            break

    if not found:
        return get_portfolio()

    data["holdings"] = holdings
    _save_portfolio(data)
    cache.set("portfolio:full", None)
    return get_portfolio()


def import_holdings(holdings_list: List[Dict]) -> Dict:
    data = _load_portfolio()
    data["holdings"] = []
    for h in holdings_list:
        data["holdings"].append({
            "ticker": h.get("ticker", "").upper(),
            "shares": h.get("shares", 0),
            "avg_cost": h.get("avg_cost", 0),
        })
    _save_portfolio(data)
    cache.set("portfolio:full", None)
    return get_portfolio()
