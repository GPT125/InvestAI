#!/usr/bin/env python3
"""Generate the InvestAI Business Plan PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib import colors
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "InvestAI_Business_Plan.pdf")

# Colors
BRAND_PRIMARY = HexColor("#7c8cf8")
BRAND_DARK = HexColor("#0f0f1a")
ACCENT = HexColor("#4ade80")
TEXT_DARK = HexColor("#1a1a2e")
TEXT_MED = HexColor("#333355")
BORDER = HexColor("#c0c0d8")
LIGHT_BG = HexColor("#f4f4fc")

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="Helvetica-Bold", fontSize=32,
    textColor=TEXT_DARK, alignment=TA_CENTER, spaceAfter=10, leading=38
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName="Helvetica", fontSize=14,
    textColor=TEXT_MED, alignment=TA_CENTER, spaceAfter=6, leading=20
))
styles.add(ParagraphStyle(
    name="CoverDate", fontName="Helvetica-Oblique", fontSize=11,
    textColor=HexColor("#666688"), alignment=TA_CENTER, spaceBefore=20
))
styles.add(ParagraphStyle(
    name="SectionTitle", fontName="Helvetica-Bold", fontSize=18,
    textColor=TEXT_DARK, spaceBefore=24, spaceAfter=10, leading=22
))
styles.add(ParagraphStyle(
    name="SubSection", fontName="Helvetica-Bold", fontSize=13,
    textColor=TEXT_MED, spaceBefore=14, spaceAfter=6, leading=16
))
styles.add(ParagraphStyle(
    name="Body", fontName="Helvetica", fontSize=10.5,
    textColor=TEXT_DARK, alignment=TA_JUSTIFY, spaceAfter=8, leading=15
))
styles.add(ParagraphStyle(
    name="BulletCustom", fontName="Helvetica", fontSize=10.5,
    textColor=TEXT_DARK, leftIndent=24, spaceAfter=4, leading=14,
    bulletIndent=12, bulletFontName="Helvetica"
))
styles.add(ParagraphStyle(
    name="BulletBoldCustom", fontName="Helvetica-Bold", fontSize=10.5,
    textColor=TEXT_DARK, leftIndent=24, spaceAfter=4, leading=14,
    bulletIndent=12
))
styles.add(ParagraphStyle(
    name="TableHeader", fontName="Helvetica-Bold", fontSize=9.5,
    textColor=colors.white, alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    name="TableCell", fontName="Helvetica", fontSize=9,
    textColor=TEXT_DARK, alignment=TA_LEFT, leading=12
))
styles.add(ParagraphStyle(
    name="Footer", fontName="Helvetica-Oblique", fontSize=8,
    textColor=HexColor("#999999"), alignment=TA_CENTER
))

def hr():
    return HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12, spaceBefore=6)

def section(title):
    return Paragraph(title, styles["SectionTitle"])

def sub(title):
    return Paragraph(title, styles["SubSection"])

def body(text):
    return Paragraph(text, styles["Body"])

def bullet(text):
    return Paragraph(f"\u2022  {text}", styles["BulletCustom"])

def bullet_bold(label, text):
    return Paragraph(f"\u2022  <b>{label}:</b> {text}", styles["BulletCustom"])

def make_table(headers, rows, col_widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    t.setStyle(TableStyle(style))
    return t

def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.9*inch, rightMargin=0.9*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
    )
    story = []

    # ── COVER PAGE ──
    story.append(Spacer(1, 1.8*inch))
    story.append(Paragraph("InvestAI", styles["CoverTitle"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("AI-Powered Investment Analysis &amp; Education Platform", styles["CoverSub"]))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="40%", thickness=2, color=BRAND_PRIMARY, spaceAfter=12, spaceBefore=12))
    story.append(Paragraph("Comprehensive Business Plan", styles["CoverSub"]))
    story.append(Spacer(1, 30))
    story.append(Paragraph("Prepared: April 2026", styles["CoverDate"]))
    story.append(Paragraph("Confidential", styles["CoverDate"]))
    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    story.append(section("Table of Contents"))
    story.append(hr())
    toc_items = [
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
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles["Body"]))
    story.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ──
    story.append(section("1. Executive Summary"))
    story.append(hr())
    story.append(body(
        "InvestAI is a comprehensive, AI-powered investment analysis and financial education platform "
        "designed to democratize access to professional-grade stock research, portfolio management, and "
        "investor education. The platform combines real-time market data from over 12 financial data "
        "providers with advanced AI capabilities powered by large language models to deliver actionable "
        "insights to retail investors of all experience levels."
    ))
    story.append(body(
        "The platform currently features over 20 distinct tools including AI-powered stock analysis, "
        "portfolio stress testing, a full 12-course investment academy with interactive games and quizzes, "
        "global market tracking across 30+ countries, virtual trading competitions, and a conversational "
        "AI assistant. InvestAI is built on a modern technology stack consisting of React 19 on the "
        "frontend and FastAPI (Python) on the backend, with SQLite for user data persistence."
    ))
    story.append(body(
        "The business model centers on a freemium approach: a free tier supported by Google Ads, with "
        "Pro and Max subscription tiers offering advanced features, faster data refresh rates, and "
        "premium AI capabilities. The platform is designed for cost-efficient deployment, with the "
        "frontend hosted on GitHub Pages and the backend on Firebase or a comparable free/low-cost "
        "cloud provider during the initial growth phase."
    ))
    story.append(sub("Key Highlights"))
    story.append(bullet("20+ built-in investment tools and analysis features"))
    story.append(bullet("12-course educational academy with videos, articles, quizzes, and interactive games"))
    story.append(bullet("Real-time data from 12+ financial APIs (Finnhub, Alpha Vantage, FMP, FRED, yfinance, and more)"))
    story.append(bullet("AI analysis powered by Groq (Llama 3.3 70B), OpenRouter (DeepSeek), and Perplexity"))
    story.append(bullet("Global market coverage: 30+ countries, forex, commodities, crypto, bonds, and futures"))
    story.append(bullet("Guest mode for frictionless onboarding; Google OAuth and email/password auth for accounts"))
    story.append(bullet("Freemium monetization: Google Ads (free tier) + Pro/Max subscription revenue"))
    story.append(PageBreak())

    # ── 2. COMPANY OVERVIEW ──
    story.append(section("2. Company Overview"))
    story.append(hr())
    story.append(sub("Mission"))
    story.append(body(
        "To make professional-quality investment research, education, and AI-driven insights accessible "
        "to every retail investor, regardless of experience or budget."
    ))
    story.append(sub("Vision"))
    story.append(body(
        "To become the leading all-in-one platform where new and experienced investors learn, research, "
        "analyze, and grow their portfolios with the help of artificial intelligence."
    ))
    story.append(sub("Core Values"))
    story.append(bullet_bold("Accessibility", "Investing knowledge should be free and available to everyone."))
    story.append(bullet_bold("Accuracy", "Data-driven insights backed by real-time financial data from trusted sources."))
    story.append(bullet_bold("Education First", "Empowering users to make informed decisions through comprehensive learning resources."))
    story.append(bullet_bold("Innovation", "Continuously leveraging the latest AI models and technology to improve the user experience."))
    story.append(sub("Legal Structure"))
    story.append(body(
        "InvestAI is currently operating as a pre-revenue software product in development. The recommended "
        "legal structure for launch is a Delaware LLC (or C-Corp if seeking venture capital), to be established "
        "prior to monetization."
    ))

    # ── 3. PROBLEM & MARKET OPPORTUNITY ──
    story.append(section("3. Problem Statement &amp; Market Opportunity"))
    story.append(hr())
    story.append(sub("The Problem"))
    story.append(bullet("Retail investors lack access to the same caliber of research tools used by institutional investors."))
    story.append(bullet("Existing platforms like Google Finance and Yahoo Finance provide raw data but minimal AI-driven analysis or educational guidance."))
    story.append(bullet("Financial literacy remains critically low: most new investors do not understand fundamental concepts like P/E ratios, ETFs, or portfolio diversification."))
    story.append(bullet("Paid alternatives (Bloomberg Terminal, Morningstar Premium, Seeking Alpha Pro) are prohibitively expensive for beginners."))
    story.append(sub("The Opportunity"))
    story.append(body(
        "The retail investing market has exploded since 2020. Over 10 million new brokerage accounts were opened "
        "in 2020 alone, and the trend has continued. These new investors need tools that combine research with "
        "education in a single, intuitive platform. InvestAI fills this gap by providing:"
    ))
    story.append(bullet("AI-powered stock analysis that explains results in plain English"))
    story.append(bullet("A structured learning path through a 12-course academy"))
    story.append(bullet("Interactive tools (simulators, games, virtual competitions) that teach by doing"))
    story.append(bullet("Global market coverage that goes far beyond US equities"))
    story.append(PageBreak())

    # ── 4. PRODUCT DESCRIPTION ──
    story.append(section("4. Product Description &amp; Features"))
    story.append(hr())
    story.append(body(
        "InvestAI is a web-based platform accessible from any modern browser. Below is a comprehensive "
        "breakdown of the platform's current feature set, organized by category."
    ))

    # Analysis Tools
    story.append(sub("4.1 AI-Powered Analysis Tools"))
    story.append(make_table(
        ["Feature", "Description"],
        [
            ["AI Stock Analysis", "Comprehensive AI-generated analysis of any stock including scoring, valuation, news sentiment, and recommendations."],
            ["AI Chat Assistant", "Multi-turn conversational AI for investment Q&A, accessible from the dedicated Chat page or the floating AI sidebar on any page."],
            ["Stock Scoring Engine", "Proprietary scoring algorithm that rates stocks across multiple dimensions with a composite score."],
            ["Momentum Radar", "Identifies stocks with unusual volume and momentum breakout patterns across the market."],
            ["Smart Patterns", "Technical chart pattern scanner that detects formations like head-and-shoulders, double bottoms, and cup-and-handle."],
            ["Portfolio X-Ray", "Deep analysis of portfolio holdings including concentration risk, sector allocation, and correlation."],
            ["Stress Testing", "Simulates portfolio performance under historical and hypothetical market scenarios (2008 crash, COVID, rate hikes)."],
            ["Battle Arena", "Head-to-head AI-analyzed stock comparisons to help users evaluate two investments side by side."],
        ],
        col_widths=[1.8*inch, 4.8*inch]
    ))

    story.append(Spacer(1, 12))
    story.append(sub("4.2 Market Intelligence"))
    story.append(make_table(
        ["Feature", "Description"],
        [
            ["Global Markets Dashboard", "Real-time data for 30+ country indices, 12 currency pairs, categorized commodities, crypto, bonds, futures, and a VIX-based Fear & Greed gauge."],
            ["Heat Map", "Color-coded visual representation of global index performance for quick market assessment."],
            ["MacroPulse", "Macro economic indicators dashboard tracking interest rates, inflation (CPI), GDP growth, and employment data via FRED."],
            ["Sector Rotation", "Relative Rotation Graph (RRG) and sector money-flow tracking."],
            ["International News", "Auto-updating news feed aggregated from global ETF-associated news sources."],
            ["Dividend Calendar", "Forward-looking dividend schedule with income projections and dividend growth tracking."],
            ["Time Machine", "Historical investment simulator showing what-if scenarios for past investments."],
            ["Market Summary", "Customizable daily market summary with sector performance and key movers."],
        ],
        col_widths=[1.8*inch, 4.8*inch]
    ))

    story.append(Spacer(1, 12))
    story.append(sub("4.3 Portfolio &amp; Trading"))
    story.append(make_table(
        ["Feature", "Description"],
        [
            ["Portfolio Tracker", "Import or manually add holdings with real-time P&L tracking and AI-powered analysis."],
            ["Watchlist", "Personal stock watchlist with real-time price monitoring."],
            ["Virtual Competitions", "Create or join stock trading competitions with friends or AI opponents, with customizable durations and budgets."],
            ["Stock Comparison", "Side-by-side comparison of multiple stocks with AI-generated analysis and correlation data."],
            ["Financial Statements", "Full access to income statements, balance sheets, cash flow, earnings, and key ratios for any public company."],
        ],
        col_widths=[1.8*inch, 4.8*inch]
    ))
    story.append(PageBreak())

    story.append(sub("4.4 Educational Academy"))
    story.append(body(
        "The InvestAI Academy is a structured 12-course curriculum designed to take users from complete beginners "
        "to confident, knowledgeable investors. Each course contains a mix of lesson types."
    ))
    story.append(make_table(
        ["Course", "Level", "Topics"],
        [
            ["Investing 101", "Beginner", "Stock market basics, compound interest, stocks vs ETFs vs bonds, market corrections"],
            ["ETFs Deep Dive", "Beginner", "Index vs active ETFs, expense ratios, top 10 ETFs, sector ETFs"],
            ["Choosing a Broker", "Beginner", "Schwab, Fidelity, Vanguard, Robinhood comparison, account types"],
            ["Building Your First Portfolio", "Beginner", "Asset allocation, age-based rules, Three-Fund Portfolio strategy"],
            ["Retirement Accounts", "Beginner", "401(k), IRA, Roth IRA, employer matching, retirement planning"],
            ["How to Analyze Any Stock", "Intermediate", "Fundamental analysis, financial metrics, valuation techniques"],
            ["Technical Analysis", "Intermediate", "Chart patterns, indicators (SMA, RSI, MACD), trading signals"],
            ["Dividend Investing", "Intermediate", "Dividend stocks, yield analysis, DRIP strategies, income portfolios"],
            ["Options Trading", "Intermediate", "Calls, puts, covered calls, basic options strategies"],
            ["Psychology of Investing", "All Levels", "Behavioral finance, emotional control, cognitive biases"],
            ["Crypto Basics", "Beginner", "Bitcoin, Ethereum, blockchain fundamentals, risks"],
            ["Investor Taxes", "Intermediate", "Capital gains, tax-loss harvesting, tax-advantaged accounts"],
        ],
        col_widths=[1.8*inch, 1*inch, 3.8*inch]
    ))
    story.append(Spacer(1, 8))
    story.append(sub("Lesson Types"))
    story.append(bullet_bold("Video Lessons", "Embedded YouTube content with structured learning"))
    story.append(bullet_bold("Articles", "In-depth reading materials with key concept breakdowns"))
    story.append(bullet_bold("Quizzes", "Randomized multiple-choice questions (seeded shuffle ensures different order on each retry)"))
    story.append(bullet_bold("Interactive Games", "Compound interest simulator, DCA calculator, risk tolerance quiz, portfolio builder game"))
    story.append(bullet_bold("Activities", "Guided hands-on exercises using the platform's own tools"))
    story.append(PageBreak())

    # ── 5. TECHNOLOGY ──
    story.append(section("5. Technology Stack &amp; Architecture"))
    story.append(hr())
    story.append(sub("5.1 Frontend"))
    story.append(make_table(
        ["Technology", "Version", "Purpose"],
        [
            ["React", "19.2", "UI framework"],
            ["React Router", "7.13", "Client-side routing"],
            ["Vite", "Latest", "Build tool and dev server"],
            ["Axios", "1.13", "HTTP client with retry interceptors for cold-start handling"],
            ["Recharts", "2.15", "Data visualization and charting"],
            ["Lucide React", "0.577", "Icon library (500+ icons)"],
            ["Google OAuth", "0.13", "Social authentication"],
        ],
        col_widths=[1.8*inch, 1*inch, 3.8*inch]
    ))
    story.append(Spacer(1, 10))
    story.append(sub("5.2 Backend"))
    story.append(make_table(
        ["Technology", "Version", "Purpose"],
        [
            ["FastAPI", "0.115", "High-performance async API framework"],
            ["Uvicorn", "0.30", "ASGI server"],
            ["SQLite", "Built-in", "User data, conversations, portfolios, progress"],
            ["PyJWT", "2.8+", "JWT token-based authentication"],
            ["bcrypt", "4.0+", "Password hashing"],
            ["Pandas / NumPy", "2.0+ / 1.24+", "Financial data processing and analysis"],
            ["ThreadPoolExecutor", "Built-in", "Parallel API calls for fast data aggregation"],
        ],
        col_widths=[1.8*inch, 1*inch, 3.8*inch]
    ))
    story.append(Spacer(1, 10))
    story.append(sub("5.3 External Data Providers (12 APIs)"))
    story.append(make_table(
        ["Provider", "Data Type"],
        [
            ["yfinance (Yahoo Finance)", "Real-time quotes, historical prices, financials, ETF holdings"],
            ["Finnhub", "Real-time stock data, webhooks, company profiles"],
            ["Alpha Vantage", "Historical data, technical indicators"],
            ["Financial Modeling Prep (FMP)", "Financial statements, company metrics, ratios"],
            ["FRED (Federal Reserve)", "Macro indicators: GDP, CPI, interest rates, unemployment"],
            ["NewsAPI", "Global financial news aggregation"],
            ["MarketAux", "Additional market data and news"],
            ["Groq (Llama 3.3 70B)", "Primary AI model for analysis and chat"],
            ["OpenRouter (DeepSeek)", "Fallback AI model for extended capabilities"],
            ["Perplexity", "Real-time AI research with web search"],
            ["HuggingFace", "NLP models for sentiment analysis"],
            ["Google OAuth", "User authentication via Google accounts"],
        ],
        col_widths=[2.5*inch, 4.1*inch]
    ))
    story.append(Spacer(1, 10))
    story.append(sub("5.4 Architecture Highlights"))
    story.append(bullet_bold("Cold-Start Resilience", "Axios interceptor automatically retries 502/503/504 errors up to 5 times with 1.5s exponential backoff, making the platform usable on free-tier hosting."))
    story.append(bullet_bold("Multi-Layer Caching", "In-memory cache with configurable TTLs (2 min for prices, 5 min for market data, 1 hr for news, 2 hr for AI analysis) reduces API costs and improves response times."))
    story.append(bullet_bold("Parallel Data Fetching", "ThreadPoolExecutor enables concurrent API calls (up to 12 workers) for endpoints like Global Markets that aggregate data from dozens of tickers simultaneously."))
    story.append(bullet_bold("Guest Mode", "Users can explore the platform without creating an account. Guest sessions persist via localStorage with limited feature access (no settings, no competitions)."))
    story.append(PageBreak())

    # ── 6. REVENUE MODEL ──
    story.append(section("6. Revenue Model &amp; Pricing Strategy"))
    story.append(hr())
    story.append(body(
        "InvestAI will employ a three-tier freemium model, generating revenue through advertising on the free tier "
        "and subscription fees on premium tiers."
    ))
    story.append(make_table(
        ["", "Free Tier", "Pro ($9.99/mo)", "Max ($19.99/mo)"],
        [
            ["AI Analysis", "5 per day", "50 per day", "Unlimited"],
            ["AI Chat", "10 messages/day", "100 messages/day", "Unlimited"],
            ["Academy Access", "Full", "Full", "Full + Priority"],
            ["Global Markets", "Delayed (5 min)", "Real-time", "Real-time + Alerts"],
            ["Portfolio Tools", "1 portfolio", "5 portfolios", "Unlimited"],
            ["Competitions", "Join only", "Create + Join", "Create + Join + AI opponent"],
            ["Stress Testing", "3 basic scenarios", "All scenarios", "Custom scenarios"],
            ["Data Refresh", "5-minute cache", "2-minute cache", "30-second cache"],
            ["Ads", "Google Ads shown", "No ads", "No ads"],
            ["Support", "Community", "Email support", "Priority support"],
            ["Image Upload (Chat)", "No", "Yes", "Yes"],
        ],
        col_widths=[1.5*inch, 1.6*inch, 1.7*inch, 1.8*inch]
    ))
    story.append(Spacer(1, 12))
    story.append(sub("Revenue Streams"))
    story.append(bullet_bold("Google Ads (Free Tier)", "Display and native ads served to free-tier users. Expected eCPM of $2-5 for finance vertical."))
    story.append(bullet_bold("Pro Subscriptions", "$9.99/month or $99/year. Targets active retail investors who need more AI analysis and real-time data."))
    story.append(bullet_bold("Max Subscriptions", "$19.99/month or $179/year. Targets serious investors and semi-professional traders."))
    story.append(bullet_bold("Affiliate Revenue (Future)", "Broker referral partnerships (Schwab, Fidelity, Robinhood) through academy content and comparison tools."))

    # ── 7. TARGET MARKET ──
    story.append(section("7. Target Market &amp; Customer Segments"))
    story.append(hr())
    story.append(sub("Primary Segments"))
    story.append(make_table(
        ["Segment", "Profile", "Needs", "Tier"],
        [
            ["New Investors", "Ages 18-30, just opened a brokerage account, minimal financial knowledge", "Education, guidance, simple tools", "Free"],
            ["Active Retail Investors", "Ages 25-45, self-directed, manage $10K-$500K", "AI analysis, real-time data, portfolio tools", "Pro"],
            ["Finance Students", "College/university students studying finance or economics", "Learning tools, practical experience, simulations", "Free / Pro"],
            ["Serious Hobbyists", "Ages 30-55, manage $100K+, want institutional-grade tools", "Advanced analysis, stress testing, custom scenarios", "Max"],
        ],
        col_widths=[1.3*inch, 1.8*inch, 1.8*inch, 1.2*inch]
    ))
    story.append(Spacer(1, 8))
    story.append(sub("Addressable Market"))
    story.append(bullet("Total Addressable Market (TAM): 100M+ retail investors in the US alone"))
    story.append(bullet("Serviceable Addressable Market (SAM): ~30M self-directed investors who actively research stocks"))
    story.append(bullet("Serviceable Obtainable Market (SOM): 50,000 users in Year 1, growing to 500,000 by Year 3"))
    story.append(PageBreak())

    # ── 8. COMPETITIVE ANALYSIS ──
    story.append(section("8. Competitive Analysis"))
    story.append(hr())
    story.append(make_table(
        ["Feature", "InvestAI", "Google Finance", "Yahoo Finance", "Seeking Alpha", "Bloomberg"],
        [
            ["Price", "Free + $9.99-$19.99/mo", "Free", "Free / $35/mo", "$29.99/mo", "$24,000/yr"],
            ["AI Analysis", "Yes (LLM)", "No", "No", "Limited", "Limited"],
            ["AI Chat", "Yes", "No", "No", "No", "No"],
            ["Education", "12-course academy", "No", "Basic articles", "Articles only", "No"],
            ["Interactive Games", "Yes (4 games)", "No", "No", "No", "No"],
            ["Global Markets", "30+ countries", "Yes", "Yes", "US-focused", "Yes"],
            ["Portfolio Tools", "Full suite", "Basic", "Basic", "Yes", "Yes"],
            ["Competitions", "Yes", "No", "No", "No", "No"],
            ["Stress Testing", "Yes", "No", "No", "No", "Yes"],
        ],
        col_widths=[1.2*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch]
    ))
    story.append(Spacer(1, 10))
    story.append(sub("Competitive Advantages"))
    story.append(bullet_bold("All-in-One Platform", "Unlike competitors that specialize in either data OR education, InvestAI combines both with AI-powered insights."))
    story.append(bullet_bold("AI-Native", "Built from the ground up with LLM integration, not bolted on as an afterthought."))
    story.append(bullet_bold("Learn-by-Doing", "Interactive games, simulators, and virtual competitions make learning engaging and sticky."))
    story.append(bullet_bold("Cost Efficient", "Designed to run on free/low-cost infrastructure, keeping operating costs minimal during growth."))
    story.append(bullet_bold("Modern Tech Stack", "React 19 + FastAPI enables rapid feature iteration and excellent performance."))

    # ── 9. GO-TO-MARKET ──
    story.append(section("9. Go-to-Market Strategy"))
    story.append(hr())
    story.append(sub("Phase 1: Soft Launch (Months 1-3)"))
    story.append(bullet("Deploy frontend to GitHub Pages and backend to Firebase/Render free tier"))
    story.append(bullet("Invite 100-200 beta users from investing communities (Reddit r/stocks, r/investing, Discord servers)"))
    story.append(bullet("Collect feedback and iterate on UI/UX and feature gaps"))
    story.append(bullet("Ensure all 20+ features are stable and all 12 academy courses are complete"))

    story.append(sub("Phase 2: Public Launch (Months 4-6)"))
    story.append(bullet("Enable Google Ads on free tier to begin generating revenue"))
    story.append(bullet("Launch Pro subscription tier with Stripe payment integration"))
    story.append(bullet("Content marketing: publish investment guides, tutorials, and platform walkthroughs on social media"))
    story.append(bullet("SEO optimization for finance-related search terms"))
    story.append(bullet("Launch on Product Hunt and HackerNews"))

    story.append(sub("Phase 3: Growth (Months 7-12)"))
    story.append(bullet("Launch Max subscription tier"))
    story.append(bullet("Add mobile-responsive PWA support for mobile users"))
    story.append(bullet("Explore broker affiliate partnerships for referral revenue"))
    story.append(bullet("Begin targeted advertising on finance YouTube channels and podcasts"))
    story.append(bullet("Scale backend to paid cloud hosting as user base grows"))
    story.append(PageBreak())

    # ── 10. OPERATIONAL PLAN ──
    story.append(section("10. Operational Plan &amp; Infrastructure"))
    story.append(hr())
    story.append(sub("Hosting Strategy (Cost-Optimized)"))
    story.append(make_table(
        ["Component", "Initial (Free)", "Scale-Up (Paid)"],
        [
            ["Frontend", "GitHub Pages (free)", "Vercel Pro ($20/mo) or Cloudflare Pages"],
            ["Backend", "Firebase free tier or Render free", "Render Starter ($7/mo) or Railway"],
            ["Database", "SQLite (file-based, zero cost)", "PostgreSQL on Supabase or PlanetScale"],
            ["AI Models", "Groq free tier / OpenRouter", "Groq paid + dedicated API keys"],
            ["CDN", "GitHub Pages built-in", "Cloudflare (free tier)"],
        ],
        col_widths=[1.5*inch, 2.5*inch, 2.6*inch]
    ))
    story.append(Spacer(1, 10))
    story.append(sub("Estimated Monthly Operating Costs"))
    story.append(make_table(
        ["Phase", "Users", "Hosting", "APIs", "AI", "Total"],
        [
            ["Soft Launch", "0-500", "$0", "$0 (free tiers)", "$0 (free tiers)", "$0/mo"],
            ["Public Launch", "500-5,000", "$27/mo", "$50/mo", "$30/mo", "~$107/mo"],
            ["Growth", "5,000-50,000", "$100/mo", "$200/mo", "$150/mo", "~$450/mo"],
            ["Scale", "50,000+", "$300/mo", "$500/mo", "$400/mo", "~$1,200/mo"],
        ],
        col_widths=[1.2*inch, 1*inch, 1*inch, 1.3*inch, 1.3*inch, 1*inch]
    ))

    # ── 11. FINANCIAL PROJECTIONS ──
    story.append(section("11. Financial Projections (3-Year)"))
    story.append(hr())
    story.append(body(
        "The following projections are based on conservative estimates with a freemium conversion rate of 3-5% "
        "(industry average for SaaS), $3 eCPM for finance-vertical ads, and organic user growth."
    ))
    story.append(make_table(
        ["Metric", "Year 1", "Year 2", "Year 3"],
        [
            ["Total Users", "10,000", "75,000", "500,000"],
            ["Pro Subscribers (3%)", "300", "2,250", "15,000"],
            ["Max Subscribers (1%)", "100", "750", "5,000"],
            ["Ad Revenue", "$1,800", "$27,000", "$225,000"],
            ["Pro Revenue", "$35,964", "$269,730", "$1,798,200"],
            ["Max Revenue", "$23,988", "$179,910", "$1,199,400"],
            ["Total Revenue", "$61,752", "$476,640", "$3,222,600"],
            ["Operating Costs", "$5,400", "$54,000", "$240,000"],
            ["Net Revenue", "$56,352", "$422,640", "$2,982,600"],
        ],
        col_widths=[1.8*inch, 1.5*inch, 1.5*inch, 1.5*inch]
    ))
    story.append(Spacer(1, 8))
    story.append(body(
        "<i>Note: Year 1 assumes slow organic growth with minimal marketing spend. Years 2-3 assume reinvestment "
        "of revenue into marketing and infrastructure. These are estimates, not guarantees.</i>"
    ))
    story.append(PageBreak())

    # ── 12. MILESTONES ──
    story.append(section("12. Milestones &amp; Roadmap"))
    story.append(hr())
    story.append(make_table(
        ["Timeline", "Milestone", "Status"],
        [
            ["Completed", "Core platform with 20+ tools built and functional", "Done"],
            ["Completed", "12-course Academy with mixed lesson types (video, text, quiz, game)", "Done"],
            ["Completed", "AI Chat with conversation history and auto-generated titles", "Done"],
            ["Completed", "Global Markets dashboard with 30+ countries, crypto, bonds, futures", "Done"],
            ["Completed", "Guest mode for frictionless onboarding", "Done"],
            ["Completed", "Google OAuth + email verification authentication", "Done"],
            ["Completed", "Cold-start resilience (auto-retry on 502/503/504)", "Done"],
            ["Q2 2026", "Google Ads integration on free tier", "Planned"],
            ["Q2 2026", "Stripe payment integration for Pro/Max subscriptions", "Planned"],
            ["Q2 2026", "Deploy frontend to GitHub Pages, backend to Firebase", "Planned"],
            ["Q3 2026", "Launch Pro subscription tier", "Planned"],
            ["Q3 2026", "Image upload and file attachment in AI Chat", "Planned"],
            ["Q3 2026", "Mobile-responsive PWA optimization", "Planned"],
            ["Q4 2026", "Launch Max subscription tier", "Planned"],
            ["Q4 2026", "Broker affiliate partnerships", "Planned"],
            ["2027", "Native mobile app (React Native)", "Future"],
            ["2027", "Social features (follow investors, share portfolios)", "Future"],
        ],
        col_widths=[1.2*inch, 4*inch, 1.2*inch]
    ))

    # ── 13. RISK ANALYSIS ──
    story.append(section("13. Risk Analysis &amp; Mitigation"))
    story.append(hr())
    story.append(make_table(
        ["Risk", "Impact", "Likelihood", "Mitigation"],
        [
            ["API rate limits / costs", "High", "Medium", "Multi-layer caching, fallback providers, usage quotas per tier"],
            ["Free-tier hosting limitations", "Medium", "High", "Cold-start retry logic already built; migrate to paid hosting as revenue grows"],
            ["AI model accuracy / hallucination", "High", "Medium", "Disclaimers on all AI output; multiple model providers for cross-validation"],
            ["Regulatory concerns (investment advice)", "High", "Low", "Clear disclaimers that InvestAI provides information, not financial advice; no direct trading"],
            ["Competition from established players", "Medium", "Medium", "Differentiate through education + AI integration; target underserved beginner segment"],
            ["Data provider API changes", "Medium", "Medium", "Abstracted data layer supports swapping providers; 12 APIs provide redundancy"],
            ["User acquisition costs", "Medium", "Medium", "Focus on organic growth, SEO, content marketing before paid acquisition"],
        ],
        col_widths=[1.3*inch, 0.7*inch, 0.8*inch, 3.5*inch]
    ))
    story.append(PageBreak())

    # ── 14. TEAM ──
    story.append(section("14. Team &amp; Organizational Needs"))
    story.append(hr())
    story.append(sub("Current"))
    story.append(bullet_bold("Founder / Full-Stack Developer", "Responsible for all platform development, design, and strategy. Built the entire platform including frontend (React 19), backend (FastAPI), AI integrations, and the 12-course academy curriculum."))
    story.append(sub("Planned Hires (As Revenue Allows)"))
    story.append(make_table(
        ["Role", "Priority", "When", "Estimated Cost"],
        [
            ["Marketing / Growth", "High", "Month 4-6", "Part-time contractor, $2,000-3,000/mo"],
            ["Content Creator (Academy)", "Medium", "Month 6-9", "Freelance, $1,500-2,500/mo"],
            ["Backend Engineer", "Medium", "Month 9-12", "Full-time, $80,000-120,000/yr"],
            ["Customer Support", "Low", "Month 12+", "Part-time, $1,500/mo"],
            ["Designer / UI/UX", "Low", "Month 12+", "Freelance as needed"],
        ],
        col_widths=[1.8*inch, 1*inch, 1.2*inch, 2.2*inch]
    ))

    # ── 15. CONCLUSION ──
    story.append(section("15. Conclusion"))
    story.append(hr())
    story.append(body(
        "InvestAI is a feature-complete, AI-powered investment platform that fills a critical gap in the market "
        "between free but limited tools (Google Finance) and prohibitively expensive professional platforms "
        "(Bloomberg Terminal). With over 20 tools already built, a 12-course educational academy, integration "
        "with 12+ financial data providers, and a modern React + FastAPI architecture, the platform is ready "
        "for public launch."
    ))
    story.append(body(
        "The freemium business model\u2014combining Google Ads revenue on the free tier with Pro ($9.99/mo) and "
        "Max ($19.99/mo) subscriptions\u2014provides multiple revenue streams while keeping the core product "
        "accessible to all investors. The cost-optimized infrastructure strategy (GitHub Pages + Firebase) "
        "ensures minimal operating expenses during the critical early growth phase."
    ))
    story.append(body(
        "With conservative projections of 10,000 users in Year 1 growing to 500,000 by Year 3, and a 3-5% "
        "conversion rate to paid tiers, InvestAI has a clear path to profitability. The immediate next steps "
        "are deploying the platform to production hosting, integrating Google Ads and Stripe payments, and "
        "executing the soft launch with beta users from investing communities."
    ))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="60%", thickness=1, color=BORDER, spaceAfter=12, spaceBefore=12))
    story.append(Paragraph("InvestAI \u2014 Confidential Business Plan \u2014 April 2026", styles["Footer"]))
    story.append(Paragraph("For inquiries, contact the founding team.", styles["Footer"]))

    doc.build(story)
    print(f"Business plan saved to: {OUTPUT}")

if __name__ == "__main__":
    build()
