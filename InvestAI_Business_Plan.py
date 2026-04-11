#!/usr/bin/env python3
"""Generate the InvestAI Business Plan PDF — all table cells use Paragraph for proper word-wrap."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable,
)
from reportlab.lib import colors
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "InvestAI_Business_Plan.pdf")

# ── Page metrics ──────────────────────────────────────────────────────────────
# Letter = 8.5 in. Margins = 0.85 in each side → usable = 6.8 in
LEFT_M = RIGHT_M = 0.85 * inch
USABLE_W = 8.5 * inch - LEFT_M - RIGHT_M   # 6.8 in

# ── Brand colours ─────────────────────────────────────────────────────────────
C_PRIMARY   = HexColor("#5a67d8")
C_DARK      = HexColor("#1a1a2e")
C_MED       = HexColor("#2d2d52")
C_BORDER    = HexColor("#b0b0cc")
C_ROW_ALT   = HexColor("#f0f0fa")
C_WHITE     = colors.white

# ── Styles ────────────────────────────────────────────────────────────────────
SS = getSampleStyleSheet()

def _add(name, **kw):
    SS.add(ParagraphStyle(name=name, **kw))

_add("CoverTitle",  fontName="Helvetica-Bold",   fontSize=34, textColor=C_DARK,
     alignment=TA_CENTER, spaceAfter=8,  leading=40)
_add("CoverSub",    fontName="Helvetica",         fontSize=14, textColor=C_MED,
     alignment=TA_CENTER, spaceAfter=6,  leading=20)
_add("CoverDate",   fontName="Helvetica-Oblique", fontSize=10, textColor=HexColor("#666688"),
     alignment=TA_CENTER, spaceBefore=18)
_add("Sec",         fontName="Helvetica-Bold",   fontSize=17, textColor=C_DARK,
     spaceBefore=22, spaceAfter=8, leading=22)
_add("Sub",         fontName="Helvetica-Bold",   fontSize=12, textColor=C_MED,
     spaceBefore=12, spaceAfter=5, leading=15)
_add("Body",        fontName="Helvetica",         fontSize=10, textColor=C_DARK,
     alignment=TA_JUSTIFY, spaceAfter=7, leading=14)
_add("BulletP",     fontName="Helvetica",         fontSize=10, textColor=C_DARK,
     leftIndent=18, spaceAfter=4, leading=14)
_add("FooterP",     fontName="Helvetica-Oblique", fontSize=8,  textColor=HexColor("#888899"),
     alignment=TA_CENTER)
# Table cell styles
_add("TH",          fontName="Helvetica-Bold",   fontSize=9,  textColor=C_WHITE,
     alignment=TA_CENTER, leading=12)
_add("TC",          fontName="Helvetica",         fontSize=9,  textColor=C_DARK,
     alignment=TA_LEFT,   leading=12, wordWrap='CJK')
_add("TCC",         fontName="Helvetica",         fontSize=9,  textColor=C_DARK,
     alignment=TA_CENTER, leading=12, wordWrap='CJK')

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr():
    return HRFlowable(width="100%", thickness=0.8, color=C_BORDER,
                      spaceAfter=10, spaceBefore=4)

def sec(t):   return Paragraph(t, SS["Sec"])
def sub(t):   return Paragraph(t, SS["Sub"])
def body(t):  return Paragraph(t, SS["Body"])
def sp(n=8):  return Spacer(1, n)

def bul(text):
    return Paragraph(f"\u2022\u2002{text}", SS["BulletP"])

def bulb(label, text):
    return Paragraph(f"\u2022\u2002<b>{label}:</b>\u2002{text}", SS["BulletP"])

def p(text, style="TC"):
    """Wrap a string in a Paragraph for safe table cell rendering."""
    return Paragraph(str(text), SS[style])

def ph(text):
    """Table header cell."""
    return Paragraph(str(text), SS["TH"])

def pc(text):
    """Centred table cell."""
    return Paragraph(str(text), SS["TCC"])

def make_table(headers, rows, col_widths, centre_cols=None):
    """
    Build a properly-wrapped ReportLab table.
    headers    : list of header strings
    rows       : list of lists of strings
    col_widths : list of floats (must sum <= USABLE_W)
    centre_cols: set of column indices to centre-align
    """
    centre_cols = set(centre_cols or [])

    def wrap_row(row, is_header=False):
        out = []
        for i, cell in enumerate(row):
            if is_header:
                out.append(ph(cell))
            elif i in centre_cols:
                out.append(pc(cell))
            else:
                out.append(p(cell))
        return out

    data = [wrap_row(headers, is_header=True)] + [wrap_row(r) for r in rows]

    t = Table(data, colWidths=col_widths, repeatRows=1,
              hAlign="LEFT", splitByRow=True)
    ts = TableStyle([
        # Header row
        ("BACKGROUND",    (0, 0), (-1, 0), C_PRIMARY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 9),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        ("VALIGN",        (0, 0), (-1, 0), "MIDDLE"),
        # Data rows
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("VALIGN",        (0, 1), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [C_WHITE, C_ROW_ALT]),
        # Grid
        ("GRID",          (0, 0), (-1, -1), 0.4, C_BORDER),
        # Padding
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ])
    t.setStyle(ts)
    return t

# ── Column-width presets (sum must stay <= USABLE_W = 6.8 in) ────────────────
W = USABLE_W

def cw(*ratios):
    """Convert ratios to column widths that fill USABLE_W exactly."""
    total = sum(ratios)
    return [W * r / total for r in ratios]

# ── Build ─────────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=LEFT_M, rightMargin=RIGHT_M,
        topMargin=0.75*inch, bottomMargin=0.75*inch,
    )
    S = []   # story

    # ── COVER ─────────────────────────────────────────────────────────────────
    S += [
        Spacer(1, 1.6*inch),
        Paragraph("InvestAI", SS["CoverTitle"]),
        Spacer(1, 6),
        Paragraph("AI-Powered Investment Analysis &amp; Education Platform", SS["CoverSub"]),
        HRFlowable(width="35%", thickness=2.5, color=C_PRIMARY,
                   spaceAfter=14, spaceBefore=14),
        Paragraph("Comprehensive Business Plan", SS["CoverSub"]),
        Spacer(1, 28),
        Paragraph("Prepared: April 2026", SS["CoverDate"]),
        Paragraph("Confidential", SS["CoverDate"]),
        PageBreak(),
    ]

    # ── TABLE OF CONTENTS ─────────────────────────────────────────────────────
    S += [sec("Table of Contents"), hr()]
    for item in [
        "1. Executive Summary",
        "2. Company Overview",
        "3. Problem Statement &amp; Market Opportunity",
        "4. Product Description &amp; Features",
        "5. Technology Stack &amp; Architecture",
        "6. Revenue Model &amp; Pricing Strategy",
        "7. Target Market &amp; Customer Segments",
        "8. Competitive Analysis",
        "9. Go-to-Market Strategy",
        "10. Operational Plan &amp; Infrastructure",
        "11. Financial Projections",
        "12. Milestones &amp; Roadmap",
        "13. Risk Analysis &amp; Mitigation",
        "14. Team &amp; Organizational Needs",
        "15. Conclusion",
    ]:
        S.append(Paragraph(item, SS["Body"]))
    S.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────────────
    S += [sec("1. Executive Summary"), hr()]
    S.append(body(
        "InvestAI is a comprehensive, AI-powered investment analysis and financial education platform "
        "designed to democratize access to professional-grade stock research, portfolio management, and "
        "investor education. The platform combines real-time market data from over 12 financial data "
        "providers with advanced AI capabilities powered by large language models to deliver actionable "
        "insights to retail investors of all experience levels."
    ))
    S.append(body(
        "The platform features over 20 distinct tools including AI-powered stock analysis, portfolio "
        "stress testing, a full 12-course investment academy with interactive games and quizzes, global "
        "market tracking across 30+ countries, virtual trading competitions, and a conversational AI "
        "assistant. InvestAI is built on React 19 (frontend) and FastAPI/Python (backend), with SQLite "
        "for user data persistence."
    ))
    S.append(body(
        "The business model centers on a freemium approach: a free tier supported by Google Ads, with "
        "Pro and Max subscription tiers offering advanced features, faster data refresh, and premium AI "
        "capabilities. The platform is engineered for cost-efficient deployment on GitHub Pages (frontend) "
        "and Firebase or Render (backend)."
    ))
    S.append(sub("Key Highlights"))
    for b_ in [
        "20+ built-in investment tools and analysis features",
        "12-course educational academy with videos, articles, quizzes, and interactive games",
        "Real-time data from 12+ financial APIs (Finnhub, Alpha Vantage, FMP, FRED, yfinance, and more)",
        "AI analysis powered by Groq (Llama 3.3 70B), OpenRouter (DeepSeek), and Perplexity",
        "Global market coverage: 30+ countries, forex, commodities, crypto, bonds, and futures",
        "Guest mode for frictionless onboarding; Google OAuth and email/password auth for accounts",
        "Freemium monetization: Google Ads (free tier) + Pro/Max subscription revenue",
    ]:
        S.append(bul(b_))
    S.append(PageBreak())

    # ── 2. COMPANY OVERVIEW ───────────────────────────────────────────────────
    S += [sec("2. Company Overview"), hr()]
    S.append(sub("Mission"))
    S.append(body(
        "To make professional-quality investment research, education, and AI-driven insights accessible "
        "to every retail investor, regardless of experience or budget."
    ))
    S.append(sub("Vision"))
    S.append(body(
        "To become the leading all-in-one platform where new and experienced investors learn, research, "
        "analyze, and grow their portfolios with the help of artificial intelligence."
    ))
    S.append(sub("Core Values"))
    for label, text in [
        ("Accessibility", "Investing knowledge should be free and available to everyone."),
        ("Accuracy", "Data-driven insights backed by real-time financial data from trusted sources."),
        ("Education First", "Empowering users to make informed decisions through comprehensive learning resources."),
        ("Innovation", "Continuously leveraging the latest AI models and technology to improve the user experience."),
    ]:
        S.append(bulb(label, text))
    S.append(sub("Legal Structure"))
    S.append(body(
        "InvestAI is currently a pre-revenue software product in active development. The recommended "
        "legal structure for launch is a Delaware LLC (or C-Corp if pursuing venture capital), to be "
        "established prior to monetization."
    ))

    # ── 3. PROBLEM & MARKET OPPORTUNITY ──────────────────────────────────────
    S += [sec("3. Problem Statement &amp; Market Opportunity"), hr()]
    S.append(sub("The Problem"))
    for b_ in [
        "Retail investors lack access to the same caliber of research tools used by institutional investors.",
        "Platforms like Google Finance and Yahoo Finance provide raw data but no AI-driven analysis or structured education.",
        "Financial literacy remains critically low — most new investors do not understand P/E ratios, ETFs, or portfolio diversification.",
        "Paid alternatives (Bloomberg Terminal ~$24K/yr, Morningstar Premium, Seeking Alpha Pro) are prohibitively expensive for beginners.",
    ]:
        S.append(bul(b_))
    S.append(sub("The Opportunity"))
    S.append(body(
        "The retail investing market has exploded since 2020, with over 10 million new brokerage accounts "
        "opened in that year alone. These investors need tools that combine research with education in a "
        "single, intuitive platform. InvestAI fills this gap directly."
    ))
    for b_ in [
        "AI-powered stock analysis that explains results in plain English",
        "A structured learning path through a 12-course academy covering beginner to intermediate topics",
        "Interactive tools — simulators, games, and virtual competitions — that teach investing by doing",
        "Global market coverage far beyond US equities, including crypto, forex, commodities, and bonds",
    ]:
        S.append(bul(b_))
    S.append(PageBreak())

    # ── 4. PRODUCT DESCRIPTION ────────────────────────────────────────────────
    S += [sec("4. Product Description &amp; Features"), hr()]
    S.append(body(
        "InvestAI is a web-based platform accessible from any modern browser. Below is a comprehensive "
        "breakdown of the platform's current feature set, organized by category."
    ))

    S.append(sub("4.1  AI-Powered Analysis Tools"))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["AI Stock Analysis", "Comprehensive AI-generated analysis of any stock including scoring, valuation, news sentiment, and plain-English recommendations."],
            ["AI Chat Assistant", "Multi-turn conversational AI for investment Q&A, accessible from the Chat page and a floating sidebar available on every page."],
            ["Stock Scoring Engine", "Proprietary algorithm that rates stocks across multiple dimensions (value, growth, momentum, sentiment) with a composite score."],
            ["Momentum Radar", "Identifies stocks with unusual volume and momentum breakout patterns across the broader market."],
            ["Smart Patterns", "Technical chart pattern scanner detecting head-and-shoulders, double bottoms, cup-and-handle, and more."],
            ["Portfolio X-Ray", "Deep analysis of portfolio holdings including concentration risk, sector allocation, and correlation matrix."],
            ["Stress Testing", "Simulates portfolio performance under historical and hypothetical scenarios (2008 crisis, COVID crash, rate hike cycles)."],
            ["Battle Arena", "Head-to-head AI-analyzed stock comparisons to help users evaluate two investments side by side."],
        ],
        cw(1.5, 5.3),
    ))
    S.append(sp(10))

    S.append(sub("4.2  Market Intelligence"))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Global Markets Dashboard", "Real-time data for 30+ country indices organized by region, 12 currency pairs, categorized commodities, crypto, bonds, futures, and a VIX-based Fear &amp; Greed gauge."],
            ["Global Heat Map", "Color-coded visual grid showing all world indices by daily % change for instant market assessment."],
            ["MacroPulse", "Macro-economic indicators dashboard tracking interest rates, CPI inflation, GDP growth, and employment data via the Federal Reserve's FRED API."],
            ["Sector Rotation", "Relative Rotation Graph (RRG) and sector money-flow tracking to identify capital rotation trends."],
            ["International News", "Auto-updating news feed aggregated from global ETF-associated news sources, refreshing every 10 minutes."],
            ["Dividend Calendar", "Forward-looking dividend schedule with income projections and dividend growth tracking."],
            ["Time Machine", "Historical investment simulator showing what-if results for any past investment date and amount."],
            ["Market Summary", "Customizable daily market summary with sector performance, fear &amp; greed, and key movers."],
        ],
        cw(1.8, 5),
    ))
    S.append(sp(10))

    S.append(sub("4.3  Portfolio &amp; Trading Tools"))
    S.append(make_table(
        ["Feature", "Description"],
        [
            ["Portfolio Tracker", "Import or manually add holdings with real-time P&amp;L tracking and AI-powered portfolio analysis."],
            ["Watchlist", "Personal stock watchlist with real-time price monitoring and quick-access analytics."],
            ["Virtual Competitions", "Create or join stock trading competitions with friends or AI opponents, with customizable durations ($1K–$100K budgets) and leaderboards."],
            ["Stock Comparison", "Side-by-side comparison of multiple stocks with AI analysis, correlation coefficients, and peer benchmarking."],
            ["Financial Statements", "Full income statements, balance sheets, cash flow statements, earnings surprises, and key financial ratios for any public company."],
        ],
        cw(1.8, 5),
    ))
    S.append(PageBreak())

    S.append(sub("4.4  Educational Academy — 12 Courses"))
    S.append(body(
        "The InvestAI Academy is a structured curriculum designed to take users from complete beginners "
        "to confident investors. Each course contains a mix of lesson types: video, article, quiz, "
        "interactive game, and activity."
    ))
    S.append(make_table(
        ["Course", "Level", "Key Topics"],
        [
            ["Investing 101", "Beginner", "Stock market basics, compound interest, stocks vs ETFs vs bonds, market corrections, practice trades"],
            ["ETFs Deep Dive", "Beginner", "Index vs active ETFs, expense ratios, top 10 ETFs, sector ETFs, portfolio building game"],
            ["Choosing a Broker", "Beginner", "Schwab, Fidelity, Vanguard, Robinhood comparison; account types; fee structures"],
            ["Building Your First Portfolio", "Beginner", "Asset allocation, age-based rules, Three-Fund Portfolio, DCA vs lump-sum game"],
            ["Retirement Accounts", "Beginner", "401(k), IRA, Roth IRA, employer matching, retirement planning milestones"],
            ["Analyze Any Stock", "Intermediate", "Fundamental analysis, financial metrics, P/E, EV/EBITDA, DCF valuation"],
            ["Technical Analysis", "Intermediate", "Chart patterns, SMA/RSI/MACD indicators, support &amp; resistance, trading signals"],
            ["Dividend Investing", "Intermediate", "Dividend yield, payout ratio, DRIP strategies, building an income portfolio"],
            ["Options Trading", "Intermediate", "Calls, puts, covered calls, basic multi-leg strategies and risk management"],
            ["Psychology of Investing", "All Levels", "Behavioral biases, loss aversion, FOMO, emotional control strategies"],
            ["Crypto Basics", "Beginner", "Bitcoin, Ethereum, blockchain, wallets, exchange risks, portfolio sizing"],
            ["Investor Taxes", "Intermediate", "Capital gains, tax-loss harvesting, wash-sale rule, tax-advantaged accounts"],
        ],
        cw(1.8, 0.9, 4.1),
        centre_cols={1},
    ))
    S.append(sp(8))
    S.append(sub("Interactive Lesson Types"))
    for label, text in [
        ("Video Lessons", "Embedded YouTube content with structured learning objectives"),
        ("Articles", "In-depth reading materials with key concept breakdowns and examples"),
        ("Quizzes", "Randomized multiple-choice questions — seeded Fisher-Yates shuffle ensures a different question order on every retry"),
        ("Interactive Games", "Compound interest simulator, DCA vs lump-sum calculator, risk tolerance quiz, portfolio builder (4 games)"),
        ("Activities", "Guided hands-on exercises using the platform's own analysis tools"),
    ]:
        S.append(bulb(label, text))
    S.append(PageBreak())

    # ── 5. TECHNOLOGY ─────────────────────────────────────────────────────────
    S += [sec("5. Technology Stack &amp; Architecture"), hr()]

    S.append(sub("5.1  Frontend"))
    S.append(make_table(
        ["Technology", "Version", "Purpose"],
        [
            ["React", "19.2", "Core UI framework"],
            ["React Router", "7.13", "Client-side routing and protected route management"],
            ["Vite", "Latest", "Build tool and development server"],
            ["Axios", "1.13", "HTTP client with automatic cold-start retry interceptors"],
            ["Recharts", "2.15", "Interactive data visualization and charting library"],
            ["Lucide React", "0.577", "Comprehensive icon library (500+ icons)"],
            ["Google OAuth", "0.13", "Social sign-in via Google accounts"],
        ],
        cw(1.5, 0.8, 4.5),
        centre_cols={1},
    ))
    S.append(sp(10))

    S.append(sub("5.2  Backend"))
    S.append(make_table(
        ["Technology", "Version", "Purpose"],
        [
            ["FastAPI", "0.115", "High-performance async Python API framework"],
            ["Uvicorn", "0.30", "ASGI production server"],
            ["SQLite", "Built-in", "User data, chat history, portfolios, academy progress (zero infrastructure cost)"],
            ["PyJWT + bcrypt", "2.8+ / 4.0+", "JWT token authentication and secure password hashing"],
            ["Pandas / NumPy", "2.0+ / 1.24+", "Financial data processing and numerical analysis"],
            ["ThreadPoolExecutor", "Built-in", "Parallel API calls — up to 12 concurrent workers for fast data aggregation"],
        ],
        cw(1.8, 0.9, 4.1),
        centre_cols={1},
    ))
    S.append(sp(10))

    S.append(sub("5.3  External Data Providers (12 Integrations)"))
    S.append(make_table(
        ["Provider", "Data Supplied"],
        [
            ["yfinance (Yahoo Finance)", "Real-time quotes, historical prices, financial statements, ETF holdings, options chains"],
            ["Finnhub", "Real-time stock data, company profiles, earnings calendar, insider transactions, webhooks"],
            ["Alpha Vantage", "Historical OHLCV data, technical indicators (SMA, RSI, MACD)"],
            ["Financial Modeling Prep (FMP)", "Income statements, balance sheets, cash flow, key ratios, peer comparisons"],
            ["FRED (Federal Reserve)", "Macro indicators: GDP, CPI, Fed funds rate, unemployment, yield curve"],
            ["NewsAPI", "Global financial and market news aggregation"],
            ["MarketAux", "Additional market data, sentiment scores, and categorized news"],
            ["Groq — Llama 3.3 70B", "Primary LLM for stock analysis, AI chat, title generation, and insights"],
            ["OpenRouter — DeepSeek", "Fallback LLM for extended context and alternative model capabilities"],
            ["Perplexity", "Real-time AI research with live web search for up-to-date market events"],
            ["HuggingFace", "NLP models for news sentiment classification and text analysis"],
            ["Google OAuth 2.0", "Passwordless social sign-in via existing Google accounts"],
        ],
        cw(2.2, 4.6),
    ))
    S.append(sp(10))

    S.append(sub("5.4  Architecture Highlights"))
    for label, text in [
        ("Cold-Start Resilience", "Axios response interceptor silently retries 502/503/504 errors up to 5 times with 1.5 s exponential backoff — transparent to the user even on free-tier hosting that spins down during inactivity."),
        ("Multi-Layer Caching", "In-memory cache with per-endpoint TTLs: 2 min for prices, 5 min for market data, 1 hr for news, 2 hr for AI analysis — dramatically reduces external API costs."),
        ("Parallel Data Fetching", "ThreadPoolExecutor enables 12 concurrent API workers for aggregate endpoints like Global Markets, reducing wait times from 30 s+ to under 5 s."),
        ("Guest Mode", "Users can explore the full platform without registering. Guest sessions persist via localStorage and are automatically restricted from settings and competitions."),
        ("Progress Sync", "Academy progress, portfolio holdings, watchlists, AI conversations, and user settings all persist to SQLite and sync on login across devices."),
    ]:
        S.append(bulb(label, text))
    S.append(PageBreak())

    # ── 6. REVENUE MODEL ──────────────────────────────────────────────────────
    S += [sec("6. Revenue Model &amp; Pricing Strategy"), hr()]
    S.append(body(
        "InvestAI employs a three-tier freemium model. The free tier generates ad revenue while delivering "
        "full educational value. Premium tiers unlock higher limits, real-time data, and advanced tools."
    ))
    S.append(make_table(
        ["Feature", "Free", "Pro — $9.99/mo", "Max — $19.99/mo"],
        [
            ["AI Stock Analysis", "5 per day", "50 per day", "Unlimited"],
            ["AI Chat Messages", "10 per day", "100 per day", "Unlimited"],
            ["Academy Access", "Full", "Full", "Full + Priority Content"],
            ["Global Markets Data", "5-min delay", "Real-time", "Real-time + Price Alerts"],
            ["Portfolios", "1 portfolio", "5 portfolios", "Unlimited"],
            ["Competitions", "Join only", "Create + Join", "Create, Join + AI opponent"],
            ["Stress Test Scenarios", "3 preset", "All presets", "Custom scenarios"],
            ["Data Cache Refresh", "5 minutes", "2 minutes", "30 seconds"],
            ["Image Upload in Chat", "No", "Yes", "Yes"],
            ["Ads Displayed", "Yes", "No", "No"],
            ["Support", "Community", "Email (48 hr)", "Priority (24 hr)"],
        ],
        cw(1.7, 1.2, 1.8, 2.1),
        centre_cols={1, 2, 3},
    ))
    S.append(sp(12))
    S.append(sub("Revenue Streams"))
    for label, text in [
        ("Google Ads — Free Tier", "Display and native finance ads served through Google AdSense. Finance is a premium vertical with eCPMs of $2–$5, significantly above average."),
        ("Pro Subscriptions", "$9.99/month or $99/year. Targets active self-directed investors who need higher AI usage and real-time data. Annual plan provides 17% savings to incentivize commitment."),
        ("Max Subscriptions", "$19.99/month or $179/year. Targets serious investors, semi-professional traders, and finance enthusiasts who want the full platform experience."),
        ("Broker Affiliate Revenue (Future)", "Referral partnerships with major brokers (Schwab, Fidelity, Robinhood) surfaced naturally through the Academy's broker comparison course and platform sign-up flows."),
    ]:
        S.append(bulb(label, text))

    # ── 7. TARGET MARKET ──────────────────────────────────────────────────────
    S += [sec("7. Target Market &amp; Customer Segments"), hr()]
    S.append(sub("Primary Segments"))
    S.append(make_table(
        ["Segment", "Profile", "Core Needs", "Target Tier"],
        [
            ["New / First-Time Investors", "Ages 18–30; just opened first brokerage account; limited financial literacy", "Education, step-by-step guidance, simple tools", "Free"],
            ["Active Retail Investors", "Ages 25–45; self-directed; manage $10K–$500K; research-driven", "AI analysis, real-time data, portfolio management tools", "Pro"],
            ["Finance Students", "College/university students studying finance, economics, or business", "Practical experience, learning tools, career-ready simulations", "Free / Pro"],
            ["Serious Hobbyists", "Ages 30–55; manage $100K+; want institutional-grade research without institutional prices", "Advanced analysis, stress testing, unlimited AI access", "Max"],
        ],
        cw(1.5, 1.9, 2, 1.4),
        centre_cols={3},
    ))
    S.append(sp(8))
    S.append(sub("Addressable Market"))
    for b_ in [
        "Total Addressable Market (TAM): 100M+ retail investors in the US alone; 500M+ globally",
        "Serviceable Addressable Market (SAM): ~30M self-directed investors who actively research and manage their own portfolios",
        "Serviceable Obtainable Market (SOM, Year 1): 10,000 users — achievable through organic growth and community marketing",
    ]:
        S.append(bul(b_))
    S.append(PageBreak())

    # ── 8. COMPETITIVE ANALYSIS ───────────────────────────────────────────────
    S += [sec("8. Competitive Analysis"), hr()]
    S.append(make_table(
        ["Feature", "InvestAI", "Google Finance", "Yahoo Finance", "Seeking Alpha", "Bloomberg"],
        [
            ["Price", "Free / $9.99–$19.99", "Free", "Free / $35/mo", "$29.99/mo", "$24,000/yr"],
            ["AI Stock Analysis", "Yes — LLM-powered", "No", "No", "Limited", "Limited"],
            ["AI Conversational Chat", "Yes — multi-turn", "No", "No", "No", "No"],
            ["Structured Education", "12-course academy", "None", "Articles only", "Articles only", "None"],
            ["Interactive Games", "Yes — 4 simulators", "No", "No", "No", "No"],
            ["Global Market Coverage", "30+ countries", "Yes", "Yes", "US-focused", "Yes"],
            ["Portfolio Tools", "Full suite + AI", "Basic", "Basic", "Yes", "Yes"],
            ["Virtual Competitions", "Yes", "No", "No", "No", "No"],
            ["Stress Testing", "Yes", "No", "No", "No", "Yes"],
            ["Guest / No-Login Mode", "Yes", "Yes", "Yes", "No", "No"],
        ],
        cw(1.6, 1.2, 0.9, 0.9, 1.0, 1.2),
        centre_cols={1, 2, 3, 4, 5},
    ))
    S.append(sp(10))
    S.append(sub("Competitive Advantages"))
    for label, text in [
        ("All-in-One Platform", "InvestAI is the only platform that combines AI analysis, a structured education academy, interactive games, global data, and portfolio tools in a single product."),
        ("AI-Native Architecture", "Built from the ground up with LLM integration — not bolted on. Every tool from stock scoring to the academy benefits from AI."),
        ("Learn-by-Doing", "Interactive games and virtual competitions create engagement and retention that static data platforms cannot match."),
        ("Accessible Price Point", "The free tier with full educational access removes all barriers to entry, while Pro/Max provide clear upgrade value."),
        ("Cost-Efficient Infrastructure", "Built to run at near-zero cost during early growth, allowing the business to reach profitability without significant capital investment."),
    ]:
        S.append(bulb(label, text))

    # ── 9. GO-TO-MARKET ───────────────────────────────────────────────────────
    S += [sec("9. Go-to-Market Strategy"), hr()]
    S.append(sub("Phase 1 — Soft Launch (Months 1–3)"))
    for b_ in [
        "Deploy frontend to GitHub Pages and backend to Firebase / Render free tier",
        "Invite 100–200 beta users from investing communities (Reddit: r/stocks, r/investing; Discord investment servers)",
        "Collect structured feedback via in-app surveys; iterate rapidly on UX pain points",
        "Validate that all 20+ features work reliably for real users across devices",
    ]:
        S.append(bul(b_))

    S.append(sub("Phase 2 — Public Launch (Months 4–6)"))
    for b_ in [
        "Integrate Google AdSense on free tier to activate ad revenue",
        "Integrate Stripe payment processing; launch Pro subscription tier",
        "Content marketing: publish beginner investing guides and platform tutorials on YouTube, TikTok, and Instagram",
        "SEO strategy targeting high-intent finance search terms (e.g., 'best free stock analysis tool', 'learn investing for beginners')",
        "Submit to Product Hunt, HackerNews Show HN, and BetaList for organic discovery",
    ]:
        S.append(bul(b_))

    S.append(sub("Phase 3 — Growth (Months 7–12)"))
    for b_ in [
        "Launch Max subscription tier with full feature set",
        "Optimize mobile experience with Progressive Web App (PWA) support",
        "Pursue broker affiliate partnerships surfaced through the Academy's broker comparison lesson",
        "Targeted sponsorships on finance-focused YouTube channels (e.g., Graham Stephan, Andrei Jikh, Meet Kevin) and podcasts",
        "Scale backend to paid cloud hosting tier as monthly active users cross 5,000",
    ]:
        S.append(bul(b_))
    S.append(PageBreak())

    # ── 10. OPERATIONAL PLAN ──────────────────────────────────────────────────
    S += [sec("10. Operational Plan &amp; Infrastructure"), hr()]
    S.append(sub("Hosting Strategy — Optimized for Low Cost"))
    S.append(make_table(
        ["Component", "Initial — Free", "Scale-Up — Paid"],
        [
            ["Frontend", "GitHub Pages (free, unlimited bandwidth)", "Vercel Pro ($20/mo) or Cloudflare Pages (free)"],
            ["Backend API", "Render free tier or Firebase free tier", "Render Starter ($7/mo) or Railway ($5/mo)"],
            ["Database", "SQLite file-based (zero cost, built into backend)", "Supabase PostgreSQL or PlanetScale (free tiers available)"],
            ["AI Models", "Groq free tier + OpenRouter free credits", "Groq Developer plan + dedicated API budget"],
            ["CDN &amp; HTTPS", "GitHub Pages built-in / Cloudflare free", "Cloudflare Pro ($20/mo) for advanced DDoS protection"],
        ],
        cw(1.2, 2.7, 2.9),
    ))
    S.append(sp(10))
    S.append(sub("Estimated Monthly Operating Costs"))
    S.append(make_table(
        ["Phase", "Users", "Hosting", "Data APIs", "AI Models", "Est. Total"],
        [
            ["Soft Launch", "0–500", "$0", "$0 (free tiers)", "$0 (free tiers)", "$0/mo"],
            ["Public Launch", "500–5K", "$27/mo", "$50/mo", "$30/mo", "~$107/mo"],
            ["Growth", "5K–50K", "$100/mo", "$200/mo", "$150/mo", "~$450/mo"],
            ["Scale", "50K+", "$300/mo", "$500/mo", "$400/mo", "~$1,200/mo"],
        ],
        cw(1.2, 0.9, 0.95, 1.05, 1.05, 1.0),
        centre_cols={1, 2, 3, 4, 5},
    ))

    # ── 11. FINANCIAL PROJECTIONS ─────────────────────────────────────────────
    S += [sec("11. Financial Projections — 3-Year"), hr()]
    S.append(body(
        "Projections are based on conservative assumptions: 3% free-to-Pro conversion rate (industry "
        "SaaS average), 1% free-to-Max conversion rate, $3 eCPM for finance ads, and purely organic "
        "user growth with no paid acquisition in Year 1."
    ))
    S.append(make_table(
        ["Metric", "Year 1", "Year 2", "Year 3"],
        [
            ["Total Registered Users", "10,000", "75,000", "500,000"],
            ["Monthly Active Users (60%)", "6,000", "45,000", "300,000"],
            ["Pro Subscribers (3%)", "300", "2,250", "15,000"],
            ["Max Subscribers (1%)", "100", "750", "5,000"],
            ["Ad Revenue (free users)", "$1,800", "$27,000", "$225,000"],
            ["Pro Subscription Revenue", "$35,964", "$269,730", "$1,798,200"],
            ["Max Subscription Revenue", "$23,988", "$179,910", "$1,199,400"],
            ["Total Revenue", "$61,752", "$476,640", "$3,222,600"],
            ["Total Operating Costs", "$5,400", "$54,000", "$240,000"],
            ["Net Revenue", "$56,352", "$422,640", "$2,982,600"],
        ],
        cw(2.5, 1.3, 1.3, 1.7),
        centre_cols={1, 2, 3},
    ))
    S.append(sp(8))
    S.append(body(
        "<i>Disclaimer: These are forward-looking estimates, not guarantees. Year 1 assumes minimal "
        "marketing spend and purely organic growth. Years 2–3 assume reinvestment of early revenue "
        "into content marketing and infrastructure. Actual results may vary significantly.</i>"
    ))
    S.append(PageBreak())

    # ── 12. MILESTONES ────────────────────────────────────────────────────────
    S += [sec("12. Milestones &amp; Roadmap"), hr()]
    S.append(make_table(
        ["Timeline", "Milestone", "Status"],
        [
            ["Completed", "Core platform with 20+ analysis and research tools", "Done"],
            ["Completed", "12-course Academy with video, article, quiz, game, and activity lessons", "Done"],
            ["Completed", "AI Chat with persistent conversation history and auto-generated titles", "Done"],
            ["Completed", "Global Markets dashboard: 30+ countries, crypto, bonds, futures, heat map, Fear &amp; Greed gauge", "Done"],
            ["Completed", "Guest mode for frictionless, no-account exploration", "Done"],
            ["Completed", "Google OAuth + email verification authentication system", "Done"],
            ["Completed", "Cold-start resilience: automatic retry on 502/503/504 errors", "Done"],
            ["Completed", "User settings and preferences saved per account with backend sync", "Done"],
            ["Q2 2026", "Google AdSense integration on free tier", "Planned"],
            ["Q2 2026", "Stripe payment integration for subscription billing", "Planned"],
            ["Q2 2026", "Deploy to GitHub Pages (frontend) + Firebase (backend)", "Planned"],
            ["Q3 2026", "Launch Pro subscription tier ($9.99/mo)", "Planned"],
            ["Q3 2026", "Image upload and file attachments in AI Chat", "Planned"],
            ["Q3 2026", "Mobile PWA optimization for iOS and Android", "Planned"],
            ["Q4 2026", "Launch Max subscription tier ($19.99/mo)", "Planned"],
            ["Q4 2026", "Broker affiliate partnership integrations", "Planned"],
            ["2027", "Native mobile app (React Native)", "Future"],
            ["2027", "Social features: follow investors, share portfolios publicly", "Future"],
        ],
        cw(1.0, 4.5, 1.3),
        centre_cols={0, 2},
    ))

    # ── 13. RISK ANALYSIS ─────────────────────────────────────────────────────
    S += [sec("13. Risk Analysis &amp; Mitigation"), hr()]
    S.append(make_table(
        ["Risk", "Impact", "Likelihood", "Mitigation Strategy"],
        [
            ["API rate limits &amp; escalating costs", "High", "Medium", "Multi-layer caching with per-endpoint TTLs; 12 redundant data providers; usage quotas enforced per subscription tier."],
            ["Free-tier hosting spin-downs", "Medium", "High", "Cold-start retry logic already built into the Axios client; migrate to paid hosting once monthly revenue exceeds $100."],
            ["AI model hallucination / inaccuracy", "High", "Medium", "Prominent disclaimers on all AI-generated content; multiple model providers for cross-checking; no direct trade execution."],
            ["Regulatory risk (investment advice laws)", "High", "Low", "Platform explicitly provides information and education only — not personalized financial advice. All AI output includes legal disclaimers."],
            ["Competition from established platforms", "Medium", "Medium", "Strong differentiation through education-first approach + AI integration. Target underserved beginner segment ignored by Bloomberg and Seeking Alpha."],
            ["Data provider API deprecation", "Medium", "Low", "Abstracted data service layer allows provider swapping without frontend changes. 12 providers create significant redundancy."],
            ["Slow user acquisition", "Medium", "Medium", "Focus on SEO and community-driven organic growth before paid acquisition. Low operating costs mean extended runway even at slow growth."],
        ],
        cw(1.5, 0.65, 0.8, 3.8),
        centre_cols={1, 2},
    ))
    S.append(PageBreak())

    # ── 14. TEAM ──────────────────────────────────────────────────────────────
    S += [sec("14. Team &amp; Organizational Needs"), hr()]
    S.append(sub("Current Team"))
    S.append(bulb(
        "Founder / Full-Stack Developer",
        "Solely responsible for all platform development, product design, and business strategy. "
        "Built the entire platform end-to-end: React 19 frontend, FastAPI backend, 12 API integrations, "
        "SQLite database architecture, 12-course Academy curriculum, 4 interactive investment games, "
        "and all AI integrations (Groq, OpenRouter, Perplexity)."
    ))
    S.append(sp(8))
    S.append(sub("Planned Hires — As Revenue Allows"))
    S.append(make_table(
        ["Role", "Priority", "Target Timing", "Estimated Cost"],
        [
            ["Marketing / Growth Manager", "High", "Month 4–6", "Part-time contractor, $2,000–3,000/mo"],
            ["Financial Content Creator", "Medium", "Month 6–9", "Freelance, $1,500–2,500/mo for Academy content expansion"],
            ["Backend / DevOps Engineer", "Medium", "Month 9–12", "Full-time, $80,000–120,000/yr"],
            ["Customer Support Specialist", "Low", "Month 12+", "Part-time, ~$1,500/mo"],
            ["UI/UX Designer", "Low", "Month 12+", "Freelance on-demand, $50–100/hr"],
        ],
        cw(1.9, 0.8, 1.1, 3.0),
        centre_cols={1},
    ))

    # ── 15. CONCLUSION ────────────────────────────────────────────────────────
    S += [sec("15. Conclusion"), hr()]
    S.append(body(
        "InvestAI is a feature-complete, AI-powered investment platform that fills a genuine and "
        "underserved gap between free but limited tools like Google Finance and prohibitively expensive "
        "professional platforms like Bloomberg Terminal. With over 20 tools already built, a 12-course "
        "educational academy covering beginner through intermediate investing, integration with 12+ "
        "financial data providers, and a modern React 19 + FastAPI architecture, the platform is "
        "production-ready today."
    ))
    S.append(body(
        "The freemium business model — combining Google Ads revenue on the free tier with Pro ($9.99/mo) "
        "and Max ($19.99/mo) subscriptions — creates multiple revenue streams while keeping the core "
        "product freely accessible to all investors. The cost-optimized infrastructure strategy "
        "(GitHub Pages + Firebase/Render) ensures near-zero operating expenses during the critical "
        "early-growth phase, giving the business a long runway without requiring outside capital."
    ))
    S.append(body(
        "With conservative projections of 10,000 registered users in Year 1 growing to 500,000 by "
        "Year 3, and a 3–5% conversion rate to paid tiers, InvestAI has a clear, achievable path to "
        "profitability. The platform's unique combination of AI analysis, structured education, "
        "interactive learning, and real-time global data positions it strongly in a large and growing "
        "market. The immediate priorities are: deploying to production hosting, integrating Google Ads "
        "and Stripe payments, and executing a soft launch with beta users from investing communities."
    ))
    S.append(sp(30))
    S.append(HRFlowable(width="55%", thickness=0.8, color=C_BORDER,
                         spaceAfter=12, spaceBefore=12))
    S.append(Paragraph(
        "InvestAI \u2014 Confidential Business Plan \u2014 April 2026",
        SS["FooterP"]
    ))
    S.append(Paragraph(
        "This document is intended for planning and internal use only. Not for distribution.",
        SS["FooterP"]
    ))

    doc.build(S)
    print(f"PDF saved: {OUTPUT}")

if __name__ == "__main__":
    build()
