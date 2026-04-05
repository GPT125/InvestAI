/**
 * Investing Academy — full course structure.
 * Each module has lessons. Each lesson has either: video embed, written content,
 * a quiz, or an interactive activity. Progress saved per-user.
 */

export const COURSE = [
  {
    id: 'm1',
    title: 'Module 1 · Investing Foundations',
    summary: 'What the stock market is, why it exists, and how it can build wealth over decades.',
    lessons: [
      {
        id: 'm1l1',
        title: 'What Is the Stock Market?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/p7HKvqRI_Bo',
        body: `The stock market is a collection of exchanges where investors buy and sell ownership stakes (shares) in public companies. When you own a share, you own a tiny slice of that business. As the business grows and earns profits, your slice becomes more valuable.

**Why it matters:** Historically, the S&P 500 has returned about 10% per year on average. Thanks to compounding, even small amounts invested consistently can grow into life-changing sums over decades.`,
      },
      {
        id: 'm1l2',
        title: 'The Magic of Compound Interest',
        kind: 'text',
        body: `If you invest **$500/month starting at age 25** and earn 10% annually, you'll have about **$3.2 million by age 65**.

Wait until 35 to start? You'll only have about **$1.1 million** — losing **$2.1 million** in potential wealth.

**The rule:** Time in the market beats timing the market. Every year you delay costs you enormously in the final decade.`,
      },
      {
        id: 'm1l3',
        title: 'Quiz: Foundations',
        kind: 'quiz',
        questions: [
          {
            q: 'What does owning a share of stock represent?',
            options: ['A loan to the company', 'A fractional ownership of the company', 'A guaranteed return', 'A tax credit'],
            correct: 1,
          },
          {
            q: 'What is the historical average annual return of the S&P 500?',
            options: ['About 3%', 'About 5%', 'About 10%', 'About 25%'],
            correct: 2,
          },
          {
            q: 'Why does starting early matter so much?',
            options: ['Stocks are cheaper when young', 'Compound interest grows exponentially over time', 'Taxes are lower', 'Brokers charge less'],
            correct: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2 · Stocks vs ETFs vs Bonds',
    summary: 'The three building blocks of most portfolios — know the difference.',
    lessons: [
      {
        id: 'm2l1',
        title: 'What Is a Stock?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/F3QpgXBtDeo',
        body: `A stock (also called equity) is a share of ownership in a single company — Apple, Tesla, Microsoft, etc. Individual stocks can deliver huge gains but also huge losses. They are high risk, high reward.`,
      },
      {
        id: 'm2l2',
        title: 'What Is an ETF?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/-BH4vuBLNeE',
        body: `An ETF (Exchange-Traded Fund) is a basket of many stocks bundled together. One share of **VOO** gives you ownership of all 500 companies in the S&P 500. ETFs offer instant diversification with a single trade.

**Popular ETFs:**
- **VOO / SPY** — S&P 500 (500 biggest US companies)
- **QQQ** — Nasdaq 100 (tech-heavy)
- **VTI** — Total US Stock Market
- **SCHD** — Dividend-paying stocks
- **VXUS** — International stocks`,
      },
      {
        id: 'm2l3',
        title: 'What Is a Bond?',
        kind: 'text',
        body: `A bond is a loan you make to a government or corporation. They pay you interest (coupon) over time and return your principal when the bond matures.

Bonds are **safer** but **lower-return** than stocks. Typical portfolios mix stocks + bonds based on age/risk tolerance.

**The 110-age rule:** Subtract your age from 110 — that's roughly the percentage you should keep in stocks. (e.g., age 30 → 80% stocks, 20% bonds.)`,
      },
      {
        id: 'm2l4',
        title: 'Quiz: Asset Types',
        kind: 'quiz',
        questions: [
          { q: 'Which gives you instant diversification with one purchase?', options: ['Individual stock', 'ETF', 'Savings account', 'Certificate of Deposit'], correct: 1 },
          { q: 'Which is typically the safest (but lowest return)?', options: ['Stocks', 'ETFs', 'Bonds', 'Crypto'], correct: 2 },
          { q: 'What does VOO track?', options: ['Nasdaq 100', 'Dow Jones', 'S&P 500', 'Russell 2000'], correct: 2 },
        ],
      },
    ],
  },
  {
    id: 'm3',
    title: 'Module 3 · Opening an Account & Your First Trade',
    summary: 'Pick a broker, fund your account, and buy your first share.',
    lessons: [
      {
        id: 'm3l1',
        title: 'Choosing a Broker',
        kind: 'text',
        body: `A broker is a platform that lets you buy and sell stocks. Popular commission-free brokers:

- **Fidelity** — great all-rounder, excellent research tools
- **Charles Schwab** — strong customer service
- **Vanguard** — best for long-term index investors
- **Robinhood** — simple mobile-first interface
- **Interactive Brokers** — powerful, international markets

All of these offer $0 commissions on US stock and ETF trades.`,
      },
      {
        id: 'm3l2',
        title: 'Market Orders vs Limit Orders',
        kind: 'video',
        video: 'https://www.youtube.com/embed/tuSTWezI8kA',
        body: `**Market order** — buy/sell immediately at the best available price. Fast, but you don't control the exact price.

**Limit order** — buy/sell only at your specified price or better. You control the price, but the trade may not execute if the price never hits your limit.

For long-term investors buying big stocks (AAPL, VOO), market orders are fine. For thinly-traded or volatile stocks, use limit orders.`,
      },
      {
        id: 'm3l3',
        title: 'Activity: Paper Trade Your First Stock',
        kind: 'activity',
        body: `Head over to **Competitions** in the nav, create a competition with yourself, and practice buying your first stock — with virtual money. Try buying a few shares of VOO or AAPL, then check your portfolio.

This is exactly how real trading works — minus the risk.`,
        cta: { label: 'Go to Competitions', path: '/competitions' },
      },
    ],
  },
  {
    id: 'm4',
    title: 'Module 4 · How to Analyze a Stock',
    summary: 'Fundamental analysis — is this company actually worth buying?',
    lessons: [
      {
        id: 'm4l1',
        title: 'The Key Financial Metrics',
        kind: 'text',
        body: `When evaluating a stock, focus on a handful of metrics:

- **P/E Ratio** (price/earnings) — how much you pay for each dollar of profit. Lower = cheaper. 15-25 is typical for mature companies.
- **Revenue Growth** — is the company selling more each year? Want >10% for growth stocks.
- **Profit Margin** — how much of revenue becomes profit. >15% is excellent.
- **Debt-to-Equity** — too much debt is dangerous. <1.0 is generally safe.
- **Free Cash Flow** — cash left after running the business. Positive and growing = healthy.
- **Return on Equity (ROE)** — how efficiently management uses shareholder money. >15% is strong.`,
      },
      {
        id: 'm4l2',
        title: 'Reading an Earnings Report',
        kind: 'video',
        video: 'https://www.youtube.com/embed/WEDIj9JBTC8',
        body: `Every quarter, public companies report earnings. The market moves on three things:

1. **Revenue** vs analyst expectations
2. **EPS (earnings per share)** vs expectations
3. **Guidance** — what management expects next quarter

"Beat and raise" = beat expectations AND raise guidance = stock usually goes up. "Miss and cut" = the opposite.`,
      },
      {
        id: 'm4l3',
        title: 'Activity: Analyze a Real Stock',
        kind: 'activity',
        body: `Use the **Dashboard** search bar to look up any company (try MSFT, GOOGL, or NVDA). Look at their P/E ratio, revenue growth, and profit margin. Ask yourself: would you buy this business?`,
        cta: { label: 'Search Stocks', path: '/' },
      },
      {
        id: 'm4l4',
        title: 'Quiz: Stock Analysis',
        kind: 'quiz',
        questions: [
          { q: 'A low P/E ratio generally means...', options: ['The stock is expensive', 'The stock is cheaper relative to earnings', 'The company is losing money', 'The stock is about to fall'], correct: 1 },
          { q: 'What does ROE measure?', options: ['Revenue growth', 'How efficiently management uses shareholder money', 'Debt level', 'Stock price volatility'], correct: 1 },
          { q: 'What is typically most important on an earnings call?', options: ['CEO tone', 'Guidance for next quarter', 'Dividend date', 'Stock price that day'], correct: 1 },
        ],
      },
    ],
  },
  {
    id: 'm5',
    title: 'Module 5 · Diversification & Risk',
    summary: 'Don\'t put all your eggs in one basket.',
    lessons: [
      {
        id: 'm5l1',
        title: 'Why Diversification Works',
        kind: 'text',
        body: `If you put $10,000 into one stock and it drops 50%, you lose $5,000. If you put $10,000 into 20 stocks and one drops 50%, you lose only $250.

Diversification across:
- **Companies** (20+ holdings)
- **Sectors** (tech, healthcare, finance, energy, consumer)
- **Geographies** (US, international, emerging markets)
- **Asset classes** (stocks, bonds, real estate, commodities)

Reduces risk dramatically without sacrificing much return.`,
      },
      {
        id: 'm5l2',
        title: 'Position Sizing',
        kind: 'text',
        body: `**Rule of thumb:** Never put more than 5% of your portfolio into a single stock. For high-conviction picks, maybe 10%. Anything more, and one bad pick can wreck you.

For ETFs (which are already diversified), you can go much larger — 50%+ of your portfolio in a broad index ETF like VTI is fine for many investors.`,
      },
      {
        id: 'm5l3',
        title: 'Quiz: Risk Management',
        kind: 'quiz',
        questions: [
          { q: 'What is the maximum you should put in a single individual stock?', options: ['50%', '25%', '5-10%', '100%'], correct: 2 },
          { q: 'Diversification reduces...', options: ['Return', 'Specific company risk', 'Inflation', 'Taxes'], correct: 1 },
        ],
      },
    ],
  },
  {
    id: 'm6',
    title: 'Module 6 · Long-Term Strategies',
    summary: 'Proven strategies that build wealth over decades.',
    lessons: [
      {
        id: 'm6l1',
        title: 'Dollar-Cost Averaging',
        kind: 'video',
        video: 'https://www.youtube.com/embed/X1qzuPRvsM0',
        body: `Invest a fixed dollar amount on a fixed schedule (e.g., $500 every month), regardless of price. When prices are low, you buy more shares. When prices are high, you buy fewer.

Over time, this smooths out market volatility and removes emotion from investing. It's the single most proven retail strategy.`,
      },
      {
        id: 'm6l2',
        title: 'The Three-Fund Portfolio',
        kind: 'text',
        body: `A dead-simple portfolio that beats most hedge funds long-term:

- **60%** VTI (US Total Stock Market)
- **30%** VXUS (International Stocks)
- **10%** BND (US Bonds)

Rebalance once a year. That's it. No stock picking, no market timing, no stress.`,
      },
      {
        id: 'm6l3',
        title: 'Tax-Advantaged Accounts',
        kind: 'text',
        body: `**Always max these first:**

- **401(k)** — employer retirement plan. Contribute at least enough to get the full match (free money).
- **Roth IRA** — post-tax contributions, tax-free growth forever. $7,000/year limit (2024).
- **HSA** — if you have a high-deductible health plan, this is triple tax-advantaged.

Only after maxing these should you invest in a regular taxable brokerage account.`,
      },
    ],
  },
  {
    id: 'm7',
    title: 'Module 7 · Technical Analysis Basics',
    summary: 'Reading charts for short-term traders.',
    lessons: [
      {
        id: 'm7l1',
        title: 'Candlestick Charts',
        kind: 'video',
        video: 'https://www.youtube.com/embed/6TWGjnFVzfI',
        body: `A candlestick shows four prices over a time period (1 day, 1 hour, etc.):
- Open, High, Low, Close

Green candle = close > open (price went up). Red = close < open. The "wicks" show the range.

Patterns of candles (doji, hammer, engulfing, etc.) can signal reversals.`,
      },
      {
        id: 'm7l2',
        title: 'Support, Resistance & Trends',
        kind: 'text',
        body: `**Support** — a price level the stock keeps bouncing off (buyers step in). **Resistance** — a price level it keeps hitting and falling back from (sellers step in).

A stock breaking above resistance on high volume is often a bullish signal. Breaking below support is bearish.

**Trends** — draw lines connecting higher highs / higher lows. As long as the trend line holds, the trend is intact.`,
      },
      {
        id: 'm7l3',
        title: 'Moving Averages',
        kind: 'text',
        body: `The **50-day** and **200-day** moving averages are the most-watched lines in trading.

- Price above 200-day MA = long-term uptrend (bullish)
- Price below 200-day MA = long-term downtrend (bearish)
- **Golden cross** — 50-day crosses above 200-day = strong buy signal
- **Death cross** — 50-day crosses below 200-day = strong sell signal`,
      },
    ],
  },
  {
    id: 'm8',
    title: 'Module 8 · Day Trading & Advanced Topics',
    summary: 'For the brave — options, shorts, and day trading.',
    lessons: [
      {
        id: 'm8l1',
        title: 'What Is Day Trading?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/OmKLd74qJOo',
        body: `Day trading means buying and selling within the same day — no overnight positions. It's intense, stressful, and **~90% of day traders lose money** in their first year.

If you still want to try: start with paper trading (our Competitions feature), keep position sizes tiny, and never risk more than 1% of your account per trade.`,
      },
      {
        id: 'm8l2',
        title: 'Options: Calls and Puts',
        kind: 'text',
        body: `**Call option** — right to buy 100 shares at a fixed price by a future date. Bullish bet.

**Put option** — right to sell 100 shares at a fixed price. Bearish bet (or insurance for stock you own).

Options are leveraged — small moves in the underlying stock create huge % changes in option prices. You can lose your entire premium. **Learn with paper trades before using real money.**`,
      },
      {
        id: 'm8l3',
        title: 'Short Selling',
        kind: 'text',
        body: `Short selling means borrowing shares, selling them now, and buying them back later (hopefully cheaper) to return.

Profit = sell price – buy price. If the stock goes UP instead, your losses are unlimited — the stock can keep rising forever, but only drop to zero.

Short selling is for experienced traders only. Many retail investors blow up their accounts trying.`,
      },
      {
        id: 'm8l4',
        title: 'Final Quiz: Advanced',
        kind: 'quiz',
        questions: [
          { q: 'What is a day trade?', options: ['Trading only on weekdays', 'Buying and selling the same stock in the same day', 'A one-time trade', 'A retirement strategy'], correct: 1 },
          { q: 'A call option is a bet that the stock will...', options: ['Go down', 'Go up', 'Stay flat', 'Pay a dividend'], correct: 1 },
          { q: 'The biggest risk in short selling is...', options: ['Commission fees', 'Unlimited losses if the stock rises', 'Taxes', 'Low liquidity'], correct: 1 },
        ],
      },
    ],
  },
  {
    id: 'm9',
    title: 'Module 9 · Psychology of Investing',
    summary: 'The biggest enemy is you. Master your mind, master the market.',
    lessons: [
      {
        id: 'm9l1',
        title: 'Fear and Greed',
        kind: 'text',
        body: `The market runs on two emotions:

- **Fear** — makes people sell at the bottom (after losses), locking in pain.
- **Greed** — makes people buy at the top (after big gains), chasing performance.

Warren Buffett's rule: **"Be fearful when others are greedy, and greedy when others are fearful."**

The best returns come from buying when everyone is panicking.`,
      },
      {
        id: 'm9l2',
        title: 'The Most Important Rule',
        kind: 'text',
        body: `**Don't panic sell.** The S&P 500 has had dozens of 10%+ drops in its history. Every single one was followed by new all-time highs. People who sold during crashes locked in losses; people who held (or bought more) got rich.

Warren Buffett has said his ideal holding period is "forever." That's the mindset that builds generational wealth.`,
      },
      {
        id: 'm9l3',
        title: 'Final Quiz: Course Complete',
        kind: 'quiz',
        questions: [
          { q: 'When is the best time, according to Buffett, to buy?', options: ['When everyone is excited', 'When you see a hot tip', 'When others are fearful', 'Right before earnings'], correct: 2 },
          { q: 'What is the single biggest mistake retail investors make?', options: ['Holding too long', 'Panic selling during crashes', 'Using ETFs', 'Dollar-cost averaging'], correct: 1 },
          { q: 'What should you do during a market crash?', options: ['Sell everything', 'Check prices every 5 minutes', 'Stay the course and keep buying', 'Move to cash'], correct: 2 },
        ],
      },
    ],
  },
];

export const TOTAL_LESSONS = COURSE.reduce((sum, m) => sum + m.lessons.length, 0);
