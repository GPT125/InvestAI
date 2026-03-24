from pydantic import BaseModel
from typing import Optional, List


class QuickQuote(BaseModel):
    ticker: str
    name: str
    price: Optional[float] = None
    change: Optional[float] = 0
    changePercent: Optional[float] = 0
    volume: Optional[int] = 0
    marketCap: Optional[int] = 0
    sector: str = "N/A"
    industry: str = "N/A"


class StockDetail(BaseModel):
    ticker: str
    name: str
    price: Optional[float] = None
    previousClose: Optional[float] = None
    open: Optional[float] = None
    dayHigh: Optional[float] = None
    dayLow: Optional[float] = None
    volume: Optional[int] = None
    avgVolume: Optional[int] = None
    marketCap: Optional[int] = None
    pe: Optional[float] = None
    forwardPE: Optional[float] = None
    pb: Optional[float] = None
    ps: Optional[float] = None
    peg: Optional[float] = None
    eps: Optional[float] = None
    dividend: Optional[float] = None
    beta: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    fiftyDayAvg: Optional[float] = None
    twoHundredDayAvg: Optional[float] = None
    revenueGrowth: Optional[float] = None
    earningsGrowth: Optional[float] = None
    profitMargin: Optional[float] = None
    operatingMargin: Optional[float] = None
    returnOnEquity: Optional[float] = None
    debtToEquity: Optional[float] = None
    freeCashflow: Optional[float] = None
    sector: str = "N/A"
    industry: str = "N/A"
    description: str = ""
    website: str = ""
    recommendation: str = ""
    targetMeanPrice: Optional[float] = None
    numberOfAnalysts: Optional[int] = None
    change: Optional[float] = 0
    changePercent: Optional[float] = 0


class PricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class ScreenerRequest(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sectors: Optional[List[str]] = None
    min_market_cap: Optional[int] = None
    max_market_cap: Optional[int] = None
    min_score: Optional[float] = None
    sort_by: str = "score"
    sort_order: str = "desc"
    limit: int = 50


class ScoreBreakdown(BaseModel):
    composite: float
    valuation: float
    growth: float
    momentum: float
    sentiment: float
    volume: float
    rating: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    ticker: Optional[str] = None


class AnalyzeRequest(BaseModel):
    ticker: str
