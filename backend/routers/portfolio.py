from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services import portfolio_service, ai_service, stock_data
from backend.services.scoring_engine import compute_score

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


class HoldingRequest(BaseModel):
    ticker: str
    shares: float
    avg_cost: float


class ImportRequest(BaseModel):
    holdings: List[dict]


@router.get("")
def get_portfolio():
    return portfolio_service.get_portfolio()


@router.post("/holdings")
def add_holding(req: HoldingRequest):
    if req.shares <= 0 or req.avg_cost <= 0:
        raise HTTPException(status_code=400, detail="Shares and cost must be positive")
    return portfolio_service.add_holding(req.ticker, req.shares, req.avg_cost)


@router.delete("/holdings/{ticker}")
def remove_holding(ticker: str):
    return portfolio_service.remove_holding(ticker.upper())


@router.post("/import")
def import_holdings(req: ImportRequest):
    return portfolio_service.import_holdings(req.holdings)


@router.put("/holdings/{ticker}")
def update_holding(ticker: str, data: dict):
    """Update shares or avg_cost for an existing holding."""
    from backend.services import portfolio_service
    return portfolio_service.update_holding(
        ticker.upper(),
        shares=data.get("shares"),
        avg_cost=data.get("avg_cost"),
    )


@router.get("/analysis")
def portfolio_analysis():
    portfolio = portfolio_service.get_portfolio()
    holdings = portfolio.get("holdings", [])
    summary = portfolio.get("summary", {})
    sectors = portfolio.get("sectorAllocation", [])

    if not holdings:
        return {"analysis": "No holdings in portfolio to analyze."}

    # Build context for AI
    holdings_text = []
    for h in holdings:
        ticker = h["ticker"]
        info = stock_data.get_stock_info(ticker)
        history = stock_data.get_price_history(ticker, "1y")
        score = compute_score(info, history) if info else {}
        holdings_text.append(
            f"- {ticker} ({h['name']}): {h['shares']} shares @ ${h['avgCost']:.2f} avg cost, "
            f"current ${h.get('currentPrice', 0):.2f}, "
            f"gain/loss {h['gainLossPct']:+.1f}%, sector: {h['sector']}, "
            f"score: {score.get('composite', 'N/A')}/100 ({score.get('rating', 'N/A')})"
        )

    sector_text = ", ".join([f"{s['sector']}: {s['percent']:.1f}%" for s in sectors])

    prompt = f"""Analyze this investment portfolio and provide a comprehensive review.

Portfolio Summary:
- Total Value: ${summary.get('totalValue', 0):,.2f}
- Total Cost: ${summary.get('totalCost', 0):,.2f}
- Total Gain/Loss: ${summary.get('totalGainLoss', 0):+,.2f} ({summary.get('totalGainLossPct', 0):+.2f}%)
- Number of Holdings: {summary.get('holdingsCount', 0)}

Sector Allocation: {sector_text}

Holdings:
{chr(10).join(holdings_text)}

Provide your analysis in this format:
## Portfolio Overview
Brief assessment of the overall portfolio.

## Strengths
- Key strengths (3-4 points)

## Risks & Concerns
- Key risks (3-4 points)

## Diversification Analysis
Assessment of sector/asset diversification.

## Recommendations
- Specific actionable suggestions (3-5 points)"""

    # Use _call_ai directly (clean single response, no council overhead)
    messages = [
        {"role": "system", "content": "You are an expert financial analyst. Provide clear, well-structured, confident portfolio analysis using the markdown format requested."},
        {"role": "user", "content": prompt},
    ]
    analysis = ai_service._call_ai(messages, temperature=0.3, max_tokens=1200)
    return {"analysis": analysis}
