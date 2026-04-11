/**
 * InvestAI Academy — Multi-course curriculum.
 *
 * Each COURSE is standalone (its own page) and mixes:
 *   • videos (YouTube embeds)
 *   • reading lessons ("text")
 *   • quizzes ("quiz" with multiple-choice questions)
 *   • interactive games / simulators ("game": compound, dca, risk, etc.)
 *
 * Lesson ids MUST be globally unique because progress is stored by id.
 * Routes:
 *   /academy                       → all courses
 *   /academy/:courseId             → course overview + lesson list
 *   /academy/:courseId/:lessonId   → individual lesson page
 */

export const COURSES = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. INVESTING 101
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'investing-101',
    title: 'Investing 101: From Zero to Confident',
    tagline: 'The complete beginner crash-course. No jargon, no prior knowledge.',
    icon: '🎓',
    color: '#7c8cf8',
    level: 'Beginner',
    duration: '~2 hours',
    summary: 'Learn what the stock market is, why it exists, and how ordinary people build real wealth with it over time.',
    lessons: [
      {
        id: 'inv101-l1',
        title: 'What is the stock market, really?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/p7HKvqRI_Bo',
        body: `The stock market is just a giant marketplace where people buy and sell tiny slices of companies. That's it. When you buy a share of Apple, you literally own a microscopic piece of Apple — and if Apple becomes more valuable, so does your slice.

**Why do companies sell shares?** To raise money. Instead of borrowing from a bank, they sell pieces of themselves to thousands of investors. In exchange, investors get a claim on future profits.

**Why do you care?** Because over the last 100 years, owning pieces of good businesses has been the single best way for regular people to build wealth. Better than savings accounts. Better than gold. Better than real estate for most people.`,
      },
      {
        id: 'inv101-l2',
        title: 'The magic of compound interest',
        kind: 'text',
        body: `Compound interest is what makes investing powerful. Instead of earning money only on your original investment, you also earn money on the money your money already made.

**Example:** Start with $1,000 at 10% per year.
- Year 1: $1,100
- Year 10: $2,594
- Year 20: $6,727
- Year 30: $17,449
- Year 40: $45,259

You contributed only $1,000, but after 40 years it's worth **$45,000+** — and you did nothing.

**The lesson:** Time is the single most important variable in investing. Every year you wait is a year of exponential growth you'll never get back. Albert Einstein allegedly called compound interest "the eighth wonder of the world."`,
      },
      {
        id: 'inv101-game-compound',
        title: 'Game: The Compound Interest Simulator',
        kind: 'game',
        game: 'compound',
        body: `Play with the numbers yourself! Change how much you invest monthly, how long you invest for, and your return rate to see the power of compounding in real time.`,
      },
      {
        id: 'inv101-l3',
        title: 'Stocks, ETFs, and bonds — explained simply',
        kind: 'text',
        body: `The three basic things you can invest in:

**1. Stocks** — a slice of ONE company. High risk, high reward. If Tesla does amazing, your Tesla shares do amazing. If Tesla flops, you lose money.

**2. ETFs (Exchange-Traded Funds)** — a basket of many stocks bundled together. Buying one share of **VOO** gives you a tiny piece of all 500 biggest US companies. Much safer than individual stocks because one company failing barely matters.

**3. Bonds** — you lend money to a government or company, and they pay you interest. Low risk, low reward. Good for when you want stability.

**Quick analogy:** If investing were pizza, stocks are single toppings, ETFs are the whole pizza, and bonds are the bread.`,
      },
      {
        id: 'inv101-l4',
        title: 'Video: Stocks vs ETFs — which is better?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/-BH4vuBLNeE',
        body: `Most beginners should start with broad-market ETFs like VOO or VTI. They're diversified, cheap, and have beaten 90%+ of professional fund managers over 20+ year periods. Individual stock picking is fun but much harder than it looks.`,
      },
      {
        id: 'inv101-q1',
        title: 'Quiz: Do you know the basics?',
        kind: 'quiz',
        questions: [
          {
            q: 'What does owning a share of stock actually mean?',
            options: [
              'You are lending money to the company',
              'You own a small piece of the company',
              'You have a savings account with the company',
              'You work for the company',
            ],
            correct: 1,
          },
          {
            q: 'Why is starting to invest early so powerful?',
            options: [
              'Stocks are cheaper for young people',
              'Taxes are lower when you\'re young',
              'Compound interest grows exponentially over time',
              'Brokers give students discounts',
            ],
            correct: 2,
          },
          {
            q: 'What\'s the main advantage of an ETF over a single stock?',
            options: [
              'ETFs always go up',
              'ETFs give instant diversification across many companies',
              'ETFs pay better dividends',
              'ETFs are free to buy',
            ],
            correct: 1,
          },
          {
            q: 'Which investment is typically safest (but lowest returning)?',
            options: ['Stocks', 'Crypto', 'Bonds', 'Options'],
            correct: 2,
          },
        ],
      },
      {
        id: 'inv101-l5',
        title: 'Bull markets, bear markets, and corrections',
        kind: 'text',
        body: `You'll hear these terms every day. They're easy:

- **Bull market** 🐂 — prices generally rising over months/years. Investors are optimistic.
- **Bear market** 🐻 — prices fall 20%+ from recent highs. Investors are scared.
- **Correction** — a smaller drop of 10-20%. Happens roughly once a year on average.
- **Crash** — a sudden, violent drop (like March 2020 COVID).

**The crucial truth:** Every bear market in history has been followed by new all-time highs. Every. Single. One. The investors who made the most money are the ones who kept buying during bear markets while everyone else was scared.`,
      },
      {
        id: 'inv101-l6',
        title: 'Activity: Try your first practice trade',
        kind: 'activity',
        body: `Ready to practice? Head over to **Competitions** and create a solo competition to paper-trade with virtual money. Try buying a few shares of VOO or AAPL and watch how it moves. No real money at risk — this is exactly how you'd do it for real, just on training wheels.`,
        cta: { label: 'Open Competitions', path: '/competitions' },
      },
      {
        id: 'inv101-q2',
        title: 'Final Quiz: Investing 101',
        kind: 'quiz',
        questions: [
          {
            q: 'What is a bear market?',
            options: [
              'When prices rise 20%+',
              'When prices fall 20%+ from recent highs',
              'When the market is closed',
              'When bonds pay more than stocks',
            ],
            correct: 1,
          },
          {
            q: 'What should a long-term investor do during a market crash?',
            options: [
              'Sell everything immediately',
              'Panic and check prices every 5 minutes',
              'Stay calm and keep buying on schedule',
              'Move all money to crypto',
            ],
            correct: 2,
          },
          {
            q: 'Roughly how often does the stock market have a 10%+ "correction"?',
            options: ['Once every 10 years', 'Once a year on average', 'Never', 'Twice a day'],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ETFs DEEP DIVE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'etfs-deep-dive',
    title: 'ETFs Deep Dive: The Lazy Investor\'s Best Friend',
    tagline: 'Master the one investment vehicle that beats 90% of professionals.',
    icon: '📊',
    color: '#22c55e',
    level: 'Beginner',
    duration: '~90 minutes',
    summary: 'Index funds, sector ETFs, thematic ETFs, expense ratios, dividends — everything you need to build a bulletproof ETF portfolio.',
    lessons: [
      {
        id: 'etf-l1',
        title: 'What exactly is an ETF?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/C8wRQoxlCOU',
        body: `ETF stands for **Exchange-Traded Fund**. It's a basket of investments (usually stocks) that trades on the stock market just like an individual share.

**Key properties:**
- Bought and sold all day during market hours (unlike mutual funds, which trade only at end of day)
- One ETF can hold hundreds or thousands of stocks
- Most have very low fees (0.03%-0.20%/year)
- Automatically diversified

If you buy one share of **VOO** for ~$500, you instantly own a tiny piece of Apple, Microsoft, Google, Amazon, Tesla, and 495 other companies.`,
      },
      {
        id: 'etf-l2',
        title: 'Index ETFs vs active ETFs',
        kind: 'text',
        body: `**Index ETFs** mechanically track a market index (like the S&P 500). No human stock-picking — they just buy whatever is in the index. Example: VOO, SPY, VTI, QQQ.

**Active ETFs** have managers trying to beat the market by picking stocks. They charge higher fees and, statistically, 80-90% of them underperform their index over 15+ years.

**The verdict:** For almost everyone, low-fee index ETFs win. Warren Buffett famously instructed his wife's trust to invest 90% in a simple S&P 500 index fund after his death.`,
      },
      {
        id: 'etf-l3',
        title: 'Expense ratios — the silent killer',
        kind: 'text',
        body: `An expense ratio is the % fee you pay the fund manager each year. It comes out of the fund automatically — you never see the charge.

**Example:** You invest $100,000 for 30 years at 10% returns.
- 0.03% expense ratio (VOO): final value ≈ **$1,725,000**
- 1.00% expense ratio (typical active fund): final value ≈ **$1,324,000**
- Difference: **$401,000 lost to fees**

**Rule:** Never own an ETF with an expense ratio over 0.25% unless it has a very specific reason. For US stocks, you can find ETFs at 0.03%.`,
      },
      {
        id: 'etf-l4',
        title: 'The top 10 ETFs every investor should know',
        kind: 'text',
        body: `**Core US equity:**
- **VOO / SPY / IVV** — S&P 500 (top 500 US companies). 0.03% fees.
- **VTI** — Total US Stock Market. Includes small-caps. 0.03%.
- **QQQ** — Nasdaq 100, tech-heavy. 0.20%.

**International:**
- **VXUS** — Total international stocks (non-US). 0.07%.
- **VWO** — Emerging markets only (China, India, Brazil). 0.07%.

**Income / dividends:**
- **SCHD** — High-quality US dividend payers. 0.06%.
- **VYM** — Broader US dividend ETF. 0.06%.

**Bonds:**
- **BND** — Total US bond market. 0.03%.
- **BNDX** — International bonds. 0.06%.

**Gold:**
- **GLD** — Physical gold. 0.40%.`,
      },
      {
        id: 'etf-l5',
        title: 'Video: How to pick the right ETF',
        kind: 'video',
        video: 'https://www.youtube.com/embed/jJ44zO8MtH0',
        body: `When comparing two ETFs that track similar things, look at:
1. **Expense ratio** — lower is better
2. **Assets under management (AUM)** — bigger is safer (less chance of closure)
3. **Average daily volume** — higher = easier to buy/sell at fair prices
4. **Tracking error** — how closely does it actually match its index?`,
      },
      {
        id: 'etf-game-portfolio',
        title: 'Game: Build your own ETF portfolio',
        kind: 'game',
        game: 'portfolio-builder',
        body: `Drag allocations to build your ideal 3-ETF portfolio. See how different mixes would have performed historically.`,
      },
      {
        id: 'etf-l6',
        title: 'Sector and thematic ETFs',
        kind: 'text',
        body: `Want exposure to a specific industry without picking individual stocks? Sector ETFs do that.

**Popular sector ETFs:**
- **XLK** — Technology
- **XLV** — Healthcare
- **XLE** — Energy
- **XLF** — Financials
- **XLY** — Consumer discretionary

**Thematic ETFs** target specific trends:
- **ICLN** — Clean energy
- **ROBO** — Robotics & AI
- **ARKK** — Disruptive innovation
- **SOXX** — Semiconductors
- **URNM** — Uranium

**Warning:** Thematic ETFs are more volatile and often have higher fees. They're fine as a small "satellite" holding (5-15%) but shouldn't replace a core broad-market ETF.`,
      },
      {
        id: 'etf-q1',
        title: 'Quiz: ETF mastery',
        kind: 'quiz',
        questions: [
          {
            q: 'Which ETF tracks the S&P 500 with the lowest fees?',
            options: ['SPY', 'QQQ', 'VOO', 'ARKK'],
            correct: 2,
          },
          {
            q: 'What does "expense ratio" mean?',
            options: [
              'How expensive an ETF is to buy',
              'The annual fee the fund charges you',
              'The commission your broker charges',
              'Taxes on the ETF',
            ],
            correct: 1,
          },
          {
            q: 'Why do most actively managed ETFs underperform over time?',
            options: [
              'Managers are lazy',
              'They have higher fees and stock-picking is very hard',
              'The stock market is rigged',
              'They only invest in bad stocks',
            ],
            correct: 1,
          },
          {
            q: 'Which ticker is the total US stock market ETF?',
            options: ['VOO', 'VTI', 'VXUS', 'BND'],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. CHOOSING A BROKER
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'choosing-broker',
    title: 'Choosing a Broker: Schwab, Fidelity, Vanguard & More',
    tagline: 'A side-by-side look at where to actually open your account.',
    icon: '🏦',
    color: '#f59e0b',
    level: 'Beginner',
    duration: '~60 minutes',
    summary: 'Step-by-step walkthroughs of the top US brokers so you can pick the right one and get started in minutes.',
    lessons: [
      {
        id: 'broker-l1',
        title: 'What a broker actually does',
        kind: 'text',
        body: `A broker is the middleman that executes your trades on the stock exchange. Think of them as Uber for investing — you don't directly call the NYSE, you go through an app like Schwab or Robinhood.

**All legit US brokers are:**
- Regulated by the SEC and FINRA
- Members of **SIPC** (protects up to $500,000 if the broker fails — like FDIC for banks)
- Required to follow strict client-money rules

**The good news:** Since 2019, all major brokers charge **$0 commission** on US stock and ETF trades. The competition is now about features, interface, and research tools.`,
      },
      {
        id: 'broker-l2',
        title: 'Charles Schwab — the all-rounder',
        kind: 'text',
        body: `**Best for:** Most people. Strong customer service, excellent research, great mobile app, and a solid desktop platform (thinkorswim, inherited from TD Ameritrade).

**Pros:**
- $0 stock/ETF commissions
- Fractional shares (buy $5 of a $500 stock)
- 24/7 phone support
- Free research from Morningstar, Argus, Credit Suisse
- Excellent retirement account options (IRA, Roth IRA, solo 401k)
- Built-in checking/debit card tied to your account

**Cons:**
- Mobile app is good but not as sleek as Robinhood
- Some international trades have fees

**How to open:** schwab.com → "Open an Account" → pick Brokerage → fill out forms (10 min) → verify ID → link bank → done.`,
      },
      {
        id: 'broker-l3',
        title: 'Fidelity — the research champion',
        kind: 'text',
        body: `**Best for:** Serious investors who want deep research tools and the best retirement account ecosystem.

**Pros:**
- $0 commissions
- Industry-best research tools
- ZERO-expense-ratio index funds (FNILX, FZROX) — literally 0.00% fees
- Fractional shares
- Top-rated customer service
- Strong HSA accounts

**Cons:**
- Mobile app slightly cluttered
- Desktop platform (Active Trader Pro) has a learning curve

**How to open:** fidelity.com → "Open an Account" → Individual → 10-15 minute application → link bank.`,
      },
      {
        id: 'broker-l4',
        title: 'Vanguard — the index fund pioneer',
        kind: 'text',
        body: `**Best for:** Buy-and-hold index investors. Vanguard invented the index fund in 1976 and is owned by its fund shareholders (unique structure that keeps fees rock-bottom).

**Pros:**
- Lowest-fee index funds in the industry
- Best for long-term retirement investing
- No-frills, safe, boring (in a good way)

**Cons:**
- Website/app feel dated
- Not great for active trading
- Customer service can be slow
- No fractional shares for individual stocks (only Vanguard funds)

**How to open:** investor.vanguard.com → "Open an Account" → straightforward flow.`,
      },
      {
        id: 'broker-l5',
        title: 'Robinhood — the mobile-first disruptor',
        kind: 'text',
        body: `**Best for:** Young investors who want a slick, beginner-friendly mobile experience.

**Pros:**
- Beautiful, simple mobile app
- Fractional shares from $1
- Instant deposits
- Cash management account with a debit card
- Robinhood Gold (paid tier) gets IRA matching

**Cons:**
- Limited research tools
- No mutual funds
- Has a history of outages during volatile days
- Payment-for-order-flow model has been controversial
- Lesser retirement account support

**How to open:** robinhood.com → download app → sign up in 5 minutes.`,
      },
      {
        id: 'broker-l6',
        title: 'Video: Side-by-side broker comparison',
        kind: 'video',
        video: 'https://www.youtube.com/embed/ztkLY4QcxFw',
        body: `In general:
- **Long-term investor, want simplicity:** Vanguard or Fidelity
- **Want everything + great app:** Schwab
- **Mobile-first, beginner:** Robinhood
- **Active trader:** Schwab (thinkorswim) or Interactive Brokers
- **International investor:** Interactive Brokers`,
      },
      {
        id: 'broker-l7',
        title: 'Step-by-step: Opening your first account',
        kind: 'text',
        body: `Here's exactly what happens when you open a brokerage account (same steps at all major brokers):

**1. Personal info** — name, address, date of birth, SSN (required by law), phone, email.

**2. Employment info** — job title, industry, employer name. Used for compliance.

**3. Financial info** — annual income, net worth, investing experience. Don't sweat this — the options are ranges.

**4. Account type** — for most beginners: **Individual Taxable Brokerage**. If saving for retirement, also open a **Roth IRA** (separate account, same broker).

**5. Agreement docs** — click through a few disclosures.

**6. ID verification** — usually instant, sometimes takes 1-2 days.

**7. Link your bank** — use routing + account number. First deposit usually clears in 1-3 business days.

**8. Make your first trade** — search for a ticker (try VOO), click Buy, enter dollar amount or shares, click Place Order.

That's it. You're an investor.`,
      },
      {
        id: 'broker-q1',
        title: 'Quiz: Brokers',
        kind: 'quiz',
        questions: [
          {
            q: 'What does SIPC protect you from?',
            options: [
              'Stock price drops',
              'Your broker going bankrupt (up to $500k)',
              'Bad investment decisions',
              'Inflation',
            ],
            correct: 1,
          },
          {
            q: 'Which broker is best known for the lowest-fee index funds?',
            options: ['Robinhood', 'Vanguard', 'E*TRADE', 'Webull'],
            correct: 1,
          },
          {
            q: 'For a young investor who wants a simple mobile app, the best fit is typically:',
            options: ['Interactive Brokers', 'Vanguard', 'Robinhood', 'TD Ameritrade'],
            correct: 2,
          },
          {
            q: 'What does $0 commission mean?',
            options: [
              'Investing is free',
              'The broker doesn\'t charge you a fee per trade',
              'You don\'t pay taxes',
              'The stock price is $0',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. BUILDING YOUR FIRST PORTFOLIO
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'first-portfolio',
    title: 'Building Your First Portfolio',
    tagline: 'Asset allocation, diversification, and the 3-fund portfolio that beats Wall Street.',
    icon: '🏗️',
    color: '#a855f7',
    level: 'Beginner',
    duration: '~75 minutes',
    summary: 'Stop guessing. Learn the proven frameworks professionals use to build portfolios that match your age, goals, and risk tolerance.',
    lessons: [
      {
        id: 'port-l1',
        title: 'What is asset allocation?',
        kind: 'text',
        body: `Asset allocation is how you split your money between different types of investments — stocks, bonds, cash, real estate, etc.

**Why it matters:** Studies show asset allocation explains ~90% of a portfolio's long-term returns. Which specific stocks you pick matters far less than **how much you put in stocks vs. bonds**.

The right mix depends on:
- **Age** — younger = more stocks (can ride out crashes)
- **Goals** — retirement in 40 years vs. house down payment in 3 years = totally different
- **Risk tolerance** — can you sleep if your account drops 40%?`,
      },
      {
        id: 'port-l2',
        title: 'The 110-minus-age rule',
        kind: 'text',
        body: `A classic rule of thumb: **(110 − your age) = % in stocks**.

- Age 25 → 85% stocks, 15% bonds
- Age 35 → 75% stocks, 25% bonds
- Age 45 → 65% stocks, 35% bonds
- Age 55 → 55% stocks, 45% bonds
- Age 65 → 45% stocks, 55% bonds

It's not gospel, but it's a great starting point. As you age, you gradually shift toward more bonds to protect against crashes right before retirement.`,
      },
      {
        id: 'port-l3',
        title: 'The Three-Fund Portfolio',
        kind: 'text',
        body: `The simplest portfolio that beats most hedge funds over 30+ years:

**Aggressive (ages 20-35):**
- 60% VTI — US total stock market
- 30% VXUS — International stocks
- 10% BND — US bonds

**Balanced (ages 35-50):**
- 50% VTI
- 30% VXUS
- 20% BND

**Conservative (ages 50-65):**
- 40% VTI
- 25% VXUS
- 35% BND

Rebalance once a year (sell whatever is too high, buy whatever is too low to return to target %). That's the entire strategy. No stock picking. No market timing. Done.`,
      },
      {
        id: 'port-game-allocation',
        title: 'Game: Risk tolerance quiz & portfolio builder',
        kind: 'game',
        game: 'risk-tolerance',
        body: `Answer a few questions about your goals and risk tolerance, and we'll suggest an asset allocation tailored to you.`,
      },
      {
        id: 'port-l4',
        title: 'Dollar-Cost Averaging (DCA)',
        kind: 'video',
        video: 'https://www.youtube.com/embed/X1qzuPRvsM0',
        body: `Dollar-cost averaging means investing a fixed dollar amount at regular intervals (weekly, biweekly, monthly) regardless of market conditions.

**Why it works:**
- Removes emotion — you never wait for "the right time"
- When prices drop, your fixed $ buys MORE shares (automatically buying low)
- When prices rise, your fixed $ buys fewer shares
- Over time, your average cost is lower than the average price

**How to set it up:** Most brokers let you schedule automatic recurring buys. Set it once and forget it.`,
      },
      {
        id: 'port-game-dca',
        title: 'Game: DCA vs Lump Sum Simulator',
        kind: 'game',
        game: 'dca',
        body: `See for yourself how dollar-cost averaging performs vs. lump-sum investing across real historical market data.`,
      },
      {
        id: 'port-l5',
        title: 'Rebalancing — the free lunch',
        kind: 'text',
        body: `Over time, your allocation drifts. Stocks do great → now you're 85% stocks when you wanted 60%. Bonds underperform → now only 10% when you wanted 30%.

**Rebalancing** fixes this. Once a year, sell whatever's over-allocated and buy whatever's under-allocated to return to target %.

**Why it helps:** It forces you to sell high and buy low — automatically. Studies show disciplined rebalancing adds 0.5-1.5% per year in returns with no extra risk. It's called "the only free lunch in finance."

**When to rebalance:**
- Once per year on your birthday or every January 1
- Or whenever an allocation drifts more than 5% from target`,
      },
      {
        id: 'port-l6',
        title: 'Emergency fund first!',
        kind: 'text',
        body: `Before you invest a single dollar, build an **emergency fund**: 3-6 months of expenses in a high-yield savings account (HYSA). Currently paying ~4% at places like Ally, Marcus, or SoFi.

**Why this matters:** If you lose your job during a market crash and have no emergency fund, you'll be forced to sell stocks at the worst possible time. The emergency fund lets you hold steady (or even buy more) through hard times.

**Order of operations:**
1. Emergency fund (3-6 months)
2. 401k match (free money from employer)
3. Pay off high-interest debt (>7%)
4. Max out Roth IRA ($7,000/year)
5. Max out 401k ($23,000/year)
6. Then invest in taxable brokerage`,
      },
      {
        id: 'port-q1',
        title: 'Quiz: Portfolio construction',
        kind: 'quiz',
        questions: [
          {
            q: 'What does asset allocation mean?',
            options: [
              'How you split money between asset types (stocks, bonds, etc.)',
              'How much money you have',
              'Which broker you use',
              'When you buy and sell',
            ],
            correct: 0,
          },
          {
            q: 'Using the 110-minus-age rule, a 30-year-old should hold roughly what % in stocks?',
            options: ['50%', '70%', '80%', '95%'],
            correct: 2,
          },
          {
            q: 'What is dollar-cost averaging?',
            options: [
              'Only investing when stocks are cheap',
              'Investing a fixed dollar amount on a regular schedule',
              'Averaging the price of all your stocks',
              'A tax strategy',
            ],
            correct: 1,
          },
          {
            q: 'Why is an emergency fund important before investing?',
            options: [
              'It\'s required by law',
              'So you\'re not forced to sell stocks in a crisis',
              'Banks pay better than stocks',
              'It gets you a tax break',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. RETIREMENT ACCOUNTS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'retirement-accounts',
    title: 'Retirement Accounts: 401(k), Roth IRA, HSA',
    tagline: 'The tax-advantaged accounts Uncle Sam practically pays you to use.',
    icon: '🏖️',
    color: '#06b6d4',
    level: 'Intermediate',
    duration: '~60 minutes',
    summary: 'Millions of dollars in extra wealth come from using retirement accounts properly. Here\'s how.',
    lessons: [
      {
        id: 'ret-l1',
        title: 'Why retirement accounts are a cheat code',
        kind: 'text',
        body: `Normal (taxable) investing means you pay taxes on:
- Dividends every year
- Capital gains when you sell

Retirement accounts are either **tax-deferred** (pay later) or **tax-free** (never pay). Over 30-40 years, this alone can turn $500K into $1.5M+ of extra wealth.

**The three main types:**
1. **401(k)** — offered by employers, tax-deferred
2. **IRA / Roth IRA** — open yourself at any broker
3. **HSA** — health savings account, triple tax-advantaged`,
      },
      {
        id: 'ret-l2',
        title: '401(k) — always get the match',
        kind: 'text',
        body: `A 401(k) is a retirement account offered by your employer. You contribute pre-tax dollars (lowers your taxable income today), and it grows tax-deferred.

**The employer match is the #1 financial rule in the universe:** If your company offers to match 50% of your contributions up to 6% of salary, you MUST contribute at least 6%. Otherwise you're leaving free money on the table. That's a **50% instant return** on your contribution.

**2024 contribution limit:** $23,000/year ($30,500 if 50+).

**Tax-deferred means:** You don't pay income tax on the money now, but you do when you withdraw it in retirement. Since most people are in a lower tax bracket in retirement, this usually wins.`,
      },
      {
        id: 'ret-l3',
        title: 'Roth IRA — the best account ever invented',
        kind: 'video',
        video: 'https://www.youtube.com/embed/PgBD-nHxDNo',
        body: `A Roth IRA is a self-directed retirement account where you contribute **after-tax** money. But then it grows **tax-free forever**, and withdrawals in retirement are **tax-free**.

**Example:** Contribute $7,000/year for 40 years, average 10% return:
- Total contributed: $280,000
- Value at retirement: ~$3,100,000
- Taxes owed in retirement: **$0**

In a taxable account, you'd owe 15-20% capital gains on the ~$2.8M of growth = **~$500,000 in taxes**. Roth saves all of that.

**2024 limit:** $7,000/year ($8,000 if 50+).

**Income limits:** Single filers under $161k can contribute fully. (Above that, look up "backdoor Roth").`,
      },
      {
        id: 'ret-l4',
        title: 'Traditional IRA vs Roth IRA',
        kind: 'text',
        body: `**Traditional IRA:**
- Contribute pre-tax (get a deduction now)
- Grows tax-deferred
- Pay income tax on withdrawals in retirement

**Roth IRA:**
- Contribute after-tax (no deduction now)
- Grows tax-free
- Withdrawals in retirement are tax-free

**Which to pick?**
- **Young & low tax bracket now?** → **Roth** (you're paying tax at a cheap rate now, enjoying tax-free forever)
- **High earner near retirement?** → **Traditional** (get the big deduction now, pay lower tax later)
- **Unsure?** → Most people under 35 should choose **Roth**`,
      },
      {
        id: 'ret-l5',
        title: 'HSA — the secret triple-tax account',
        kind: 'text',
        body: `If your employer offers a **High Deductible Health Plan (HDHP)**, you can open a **Health Savings Account (HSA)**. It's the only account in America with **three** tax breaks:

1. **Tax-deductible contributions** (lowers taxable income)
2. **Tax-free growth**
3. **Tax-free withdrawals for medical expenses** — ever

**The stealth retirement trick:** After age 65, you can withdraw HSA money for ANY reason (taxed as regular income, like a Traditional IRA). Meanwhile, qualified medical withdrawals stay tax-free.

**Key insight:** You DON'T have to use HSA money for medical expenses right away. Keep your receipts, let the money grow for decades invested in index funds, then reimburse yourself later for those receipts — tax-free.

**2024 limit:** $4,150 individual / $8,300 family.`,
      },
      {
        id: 'ret-l6',
        title: 'The optimal contribution order',
        kind: 'text',
        body: `If you have limited money, fund accounts in this order for maximum wealth:

1. **401(k) up to employer match** — free money
2. **HSA up to max** — triple tax benefit (if eligible)
3. **Roth IRA up to max** — tax-free forever
4. **401(k) up to max** — big tax deferral
5. **Taxable brokerage** — everything else

**Why this order?** Tax savings compounded over decades dwarf returns. Maxing retirement accounts first can add **$1M-$3M+** to your retirement vs. using only a taxable account.`,
      },
      {
        id: 'ret-q1',
        title: 'Quiz: Retirement accounts',
        kind: 'quiz',
        questions: [
          {
            q: 'What\'s the #1 rule about 401(k)s?',
            options: [
              'Never contribute more than 3%',
              'Always get the full employer match',
              'Only use traditional, never Roth',
              'Withdraw early for big purchases',
            ],
            correct: 1,
          },
          {
            q: 'Which account has three tax advantages (deduction + growth + withdrawals)?',
            options: ['Traditional IRA', '401(k)', 'HSA', 'Taxable brokerage'],
            correct: 2,
          },
          {
            q: 'Roth IRA withdrawals in retirement are...',
            options: [
              'Taxed at your income rate',
              'Taxed at capital gains rate',
              'Tax-free',
              'Subject to a 10% penalty',
            ],
            correct: 2,
          },
          {
            q: 'What\'s the 2024 Roth IRA contribution limit (under 50)?',
            options: ['$3,000', '$7,000', '$15,000', '$23,000'],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. HOW TO ANALYZE A STOCK
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'analyze-stock',
    title: 'How to Analyze a Stock',
    tagline: 'Fundamental analysis — is this company actually worth buying?',
    icon: '🔍',
    color: '#ec4899',
    level: 'Intermediate',
    duration: '~90 minutes',
    summary: 'Learn the metrics professionals use to value companies: P/E, revenue growth, profit margin, ROE, and free cash flow.',
    lessons: [
      {
        id: 'ana-l1',
        title: 'The P/E ratio — price vs profits',
        kind: 'text',
        body: `The **Price-to-Earnings (P/E) ratio** is the most famous valuation metric. It tells you how much you're paying for each $1 of company profits.

**Formula:** P/E = Share Price / Earnings Per Share (EPS)

**Example:** Apple stock at $180, EPS of $6 → P/E = 30. You're paying $30 for each $1 of annual profit.

**Rough benchmarks:**
- **< 10** — often deep-value or declining business
- **10-20** — typical for mature, stable companies
- **20-35** — growth companies (investors paying up for future growth)
- **> 40** — high-growth or speculative (risky)
- **Negative** — company loses money

**Crucial:** Always compare P/E to similar companies. A P/E of 30 is cheap for a fast-growing tech firm but expensive for a utility.`,
      },
      {
        id: 'ana-l2',
        title: 'Revenue and profit growth',
        kind: 'text',
        body: `A growing business is a healthy business. Look at year-over-year (YoY) growth rates:

**Revenue growth** — is the company selling more?
- **>20%** — hypergrowth (often early-stage tech)
- **10-20%** — strong growth
- **5-10%** — mature but healthy
- **<5%** — stagnant
- **Negative** — shrinking business (usually bad)

**Earnings growth** — is profit growing faster than revenue?
- If yes → the company is becoming more efficient (great sign)
- If no → margins are compressing (warning sign)

**Watch for:** Revenue growing while profits shrink can mean the company is "buying" growth with unsustainable spending.`,
      },
      {
        id: 'ana-l3',
        title: 'Profit margin — quality of earnings',
        kind: 'text',
        body: `Profit margin = Net Income / Revenue. It tells you how much of every dollar of sales becomes actual profit.

**Benchmarks by industry:**
- **Grocery (Walmart):** 2-5%
- **Auto (Toyota):** 5-10%
- **Apparel (Nike):** 10-15%
- **Tech (Apple, MSFT):** 20-30%
- **Software (Oracle):** 30%+

**Higher is better**, but compare to industry peers, not across industries.

**Gross margin** (more fundamental) = how much revenue remains after cost of goods sold. High gross margin = pricing power (e.g., Apple, Nvidia, LVMH).`,
      },
      {
        id: 'ana-l4',
        title: 'Return on Equity (ROE)',
        kind: 'text',
        body: `ROE measures how efficiently management uses shareholder money to generate profits.

**Formula:** ROE = Net Income / Shareholder Equity

**Benchmarks:**
- **> 20%** — excellent (elite companies)
- **15-20%** — very good
- **10-15%** — average
- **< 10%** — weak (capital is being used inefficiently)

Warren Buffett loves companies with **consistently high ROE** (20%+) because it means the business throws off cash that can be reinvested profitably — the engine of compounding wealth.

**Caveat:** Very high ROE from heavy debt is dangerous. Check debt levels too.`,
      },
      {
        id: 'ana-l5',
        title: 'Free Cash Flow — the truth-teller',
        kind: 'video',
        video: 'https://www.youtube.com/embed/0-kFzJGXrv0',
        body: `Free Cash Flow (FCF) is cash left after running and reinvesting in the business. Unlike "earnings" (which can be manipulated), FCF is hard to fake.

**Formula:** Operating Cash Flow − Capital Expenditures

**Why it matters:** Companies with growing FCF can:
- Return cash to shareholders (dividends, buybacks)
- Acquire competitors
- Invest in new products
- Weather downturns

**Rule:** If a company shows "earnings" but flat or negative free cash flow for years, be very skeptical. (Enron, WeWork, and many frauds had "earnings" but bleeding cash.)`,
      },
      {
        id: 'ana-l6',
        title: 'Debt-to-equity ratio',
        kind: 'text',
        body: `Debt isn't inherently bad — but too much is dangerous, especially in a downturn.

**Debt-to-Equity (D/E)** = Total Debt / Shareholder Equity

**Benchmarks:**
- **< 0.5** — conservative (Apple, Google)
- **0.5-1.0** — typical
- **1.0-2.0** — elevated
- **> 2.0** — high risk (unless it's a bank or utility, where high leverage is normal)

**Watch also:** **Interest Coverage Ratio** = Operating Income / Interest Expense. Should be > 4. If it drops below 2, the company is in danger of not being able to service its debt.`,
      },
      {
        id: 'ana-l7',
        title: 'Activity: Analyze a real stock',
        kind: 'activity',
        body: `Time to practice. Search for any company on the **Dashboard** (try MSFT, GOOGL, JNJ, or JPM). Look at:
- P/E ratio
- Revenue growth YoY
- Profit margin
- ROE
- Free cash flow
- Debt-to-equity

Ask yourself: is this a healthy business? Would you own a piece of it for the next 10 years?`,
        cta: { label: 'Open Dashboard', path: '/' },
      },
      {
        id: 'ana-q1',
        title: 'Quiz: Stock analysis',
        kind: 'quiz',
        questions: [
          {
            q: 'A P/E ratio of 15 typically means the stock is priced at...',
            options: [
              '15% of its revenue',
              '$15 of price for every $1 of annual earnings',
              '15 times its book value',
              '15% growth per year',
            ],
            correct: 1,
          },
          {
            q: 'What does ROE measure?',
            options: [
              'Revenue over equity',
              'Return on employee',
              'How efficiently management turns equity into profit',
              'Rate of executive salary',
            ],
            correct: 2,
          },
          {
            q: 'Why is Free Cash Flow often more trustworthy than reported earnings?',
            options: [
              'It\'s always bigger',
              'It\'s harder to manipulate with accounting',
              'The SEC requires it',
              'It includes dividends',
            ],
            correct: 1,
          },
          {
            q: 'A company with high earnings but negative free cash flow is:',
            options: [
              'Always a great buy',
              'A warning sign worth investigating',
              'Definitely a fraud',
              'Normal for all industries',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. TECHNICAL ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'technical-analysis',
    title: 'Technical Analysis: Reading the Charts',
    tagline: 'Candlesticks, trends, support/resistance, and moving averages.',
    icon: '📈',
    color: '#ef4444',
    level: 'Advanced',
    duration: '~75 minutes',
    summary: 'Learn to read price charts like traders do. Spot trends, reversals, and key levels.',
    lessons: [
      {
        id: 'ta-l1',
        title: 'Candlestick charts 101',
        kind: 'video',
        video: 'https://www.youtube.com/embed/6TWGjnFVzfI',
        body: `A candlestick represents four prices over a time period (1 minute, 1 hour, 1 day, etc.):
- **Open** — price at the start of the period
- **Close** — price at the end
- **High** — highest price reached
- **Low** — lowest price reached

**Green (or white) candle** → close > open (price went up)
**Red (or black) candle** → close < open (price went down)

The thin lines above/below (called "wicks" or "shadows") show the high and low — how far price moved before settling at the close.`,
      },
      {
        id: 'ta-l2',
        title: 'Support and resistance',
        kind: 'text',
        body: `**Support** is a price level where buyers repeatedly step in — the stock keeps bouncing up from that level.

**Resistance** is a price level where sellers repeatedly step in — the stock keeps falling back from that level.

**Why they work:** Psychological. Traders remember past prices. If a stock hit $100 three times and bounced, the fourth time it falls toward $100, buyers pile in expecting another bounce.

**Breakouts** (price pushing through resistance on high volume) are bullish signals — the pressure is resolved.

**Breakdowns** (price falling below support) are bearish — support becomes new resistance.`,
      },
      {
        id: 'ta-l3',
        title: 'Trends: higher highs and higher lows',
        kind: 'text',
        body: `A **trend** is the general direction of price movement.

**Uptrend:** each swing high is higher than the last, each swing low is higher than the last. Draw a line connecting the lows — that's the **trendline**. As long as price stays above it, the uptrend is intact.

**Downtrend:** each swing high is lower, each swing low is lower.

**Sideways / range:** price bounces between horizontal support and resistance.

**Rule #1 of trading:** Trade with the trend. Buying in a downtrend or shorting in an uptrend is called "catching a falling knife" and usually ends in pain.`,
      },
      {
        id: 'ta-l4',
        title: 'Moving averages',
        kind: 'text',
        body: `A **moving average (MA)** smooths out price action by averaging the last N days of closing prices. The most-watched:

- **50-day MA** — medium-term trend
- **200-day MA** — long-term trend

**Rules of thumb:**
- Price **above** the 200-day MA → long-term uptrend (bullish bias)
- Price **below** the 200-day MA → long-term downtrend (bearish bias)
- **Golden Cross** — 50-day MA crosses above 200-day MA → strong buy signal
- **Death Cross** — 50-day MA crosses below 200-day MA → strong sell signal

**Pro tip:** The 200-day MA is so widely watched that it often acts as support/resistance by itself — simply because millions of traders are looking at it.`,
      },
      {
        id: 'ta-l5',
        title: 'Volume — the conviction indicator',
        kind: 'text',
        body: `Volume is how many shares traded in a period. It tells you the **conviction** behind a price move.

**Rules:**
- Big move UP on HIGH volume → strong buying, usually continues
- Big move UP on LOW volume → weak rally, often fades
- Big move DOWN on HIGH volume → panic selling, possible bottom forming (or continuation)
- Big move DOWN on LOW volume → quiet drift, may reverse

**Breakout with volume = real. Breakout without volume = fake.**`,
      },
      {
        id: 'ta-l6',
        title: 'RSI — overbought and oversold',
        kind: 'text',
        body: `The **Relative Strength Index (RSI)** is an oscillator between 0 and 100 that measures how "stretched" a stock is from its recent average price.

- **RSI > 70** → overbought (possible pullback ahead)
- **RSI < 30** → oversold (possible bounce ahead)
- **RSI ~50** → neutral

**Don't use in isolation.** Stocks can stay overbought for months in strong trends. RSI is best as a confirmation with other signals.

**Divergence** is powerful: if price makes a new high but RSI makes a lower high, the uptrend is weakening (bearish divergence). Vice versa for bullish.`,
      },
      {
        id: 'ta-q1',
        title: 'Quiz: Chart reading',
        kind: 'quiz',
        questions: [
          {
            q: 'What does a green candlestick mean?',
            options: [
              'Volume was high',
              'Close was higher than open',
              'The stock is safe',
              'RSI was above 70',
            ],
            correct: 1,
          },
          {
            q: 'What is a Golden Cross?',
            options: [
              '50-day MA crosses below 200-day MA',
              '50-day MA crosses above 200-day MA',
              'Price hits an all-time high',
              'Volume doubles',
            ],
            correct: 1,
          },
          {
            q: 'RSI above 70 generally means the stock is:',
            options: ['Oversold', 'Undervalued', 'Overbought', 'Trending sideways'],
            correct: 2,
          },
          {
            q: 'A breakout on LOW volume is typically:',
            options: [
              'Very reliable',
              'Suspicious and often fails',
              'A golden cross',
              'A buy signal',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. DIVIDEND INVESTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'dividend-investing',
    title: 'Dividend Investing: Cash Flow for Life',
    tagline: 'Get paid to own stocks — build passive income that grows every year.',
    icon: '💰',
    color: '#10b981',
    level: 'Intermediate',
    duration: '~60 minutes',
    summary: 'Learn how dividends work, what a Dividend Aristocrat is, and how to build a portfolio that pays you every month.',
    lessons: [
      {
        id: 'div-l1',
        title: 'What is a dividend?',
        kind: 'text',
        body: `A dividend is a cash payment a company makes to its shareholders — usually quarterly. Think of it as your share of the profits.

**Example:** You own 100 shares of Johnson & Johnson. JNJ pays $1.19/share per quarter → you get $119 every 3 months, or $476/year, just for owning the stock. Plus any stock price gains.

**Key facts:**
- Not all companies pay dividends. Growth companies (Tesla, Amazon until 2024) usually reinvest all profits.
- Mature, profitable companies (P&G, Coca-Cola, Microsoft) return cash via dividends.
- Dividends are declared by the company's board and can be cut or eliminated if the business struggles.`,
      },
      {
        id: 'div-l2',
        title: 'Dividend yield and payout ratio',
        kind: 'text',
        body: `**Dividend Yield** = Annual Dividend / Share Price × 100%

Example: PEP at $170/share pays $5.06/year → yield = 2.98%.

**Benchmarks:**
- **1-3%** — "growth dividend" (Microsoft, Apple)
- **3-5%** — typical blue-chip (PEP, JNJ)
- **5-7%** — high yield (utilities, REITs)
- **> 8%** — danger zone, often signals trouble

**Payout Ratio** = Dividend / Earnings. How much of profits go to dividends?
- **< 40%** — very safe, lots of room to grow
- **40-60%** — healthy
- **60-80%** — stretched
- **> 90%** — unsustainable (dividend may be cut)

**Yield trap warning:** A 15% yield often means the stock price collapsed because the dividend is about to be cut. High yield ≠ safe.`,
      },
      {
        id: 'div-l3',
        title: 'Dividend Aristocrats & Kings',
        kind: 'text',
        body: `**Dividend Aristocrats** = S&P 500 companies that have RAISED their dividend every single year for **25+ consecutive years**. There are ~67 of them.

**Dividend Kings** = 50+ consecutive years of increases. There are ~50 of them. This list includes legendary businesses:

- **Coca-Cola (KO)** — 60+ years
- **Procter & Gamble (PG)** — 67 years
- **Johnson & Johnson (JNJ)** — 60+ years
- **3M (MMM)** — 65+ years
- **Colgate-Palmolive (CL)** — 60+ years

These companies have survived wars, recessions, pandemics, and still kept raising their payouts. They're not guaranteed to keep doing so, but historically they've been some of the safest long-term investments available.`,
      },
      {
        id: 'div-l4',
        title: 'DRIP: Dividend Reinvestment Plans',
        kind: 'video',
        video: 'https://www.youtube.com/embed/f5j9v9JaCFw',
        body: `DRIP stands for Dividend Reinvestment Plan. Instead of taking dividends as cash, they automatically buy more shares for you (usually fractional, with no commission).

**Why it's magic:** Reinvested dividends compound. Over 30 years, DRIP can easily double your wealth vs. taking dividends as cash. Every major broker lets you toggle DRIP on with one click.

**Example (real numbers):** $10,000 in Coca-Cola in 1994 with DRIP → ~$200,000 by 2024. Without DRIP (cash dividends only) → ~$60,000. Compounding in action.`,
      },
      {
        id: 'div-l5',
        title: 'Dividend ETFs — the easy path',
        kind: 'text',
        body: `Don't want to research individual dividend stocks? Use a dividend ETF.

**Best dividend ETFs:**
- **SCHD** — Schwab US Dividend Equity. Focuses on high-quality dividend payers. 0.06% fees, ~3.5% yield. A fan favorite.
- **VYM** — Vanguard High Dividend Yield. Broader, ~3% yield. 0.06% fees.
- **VIG** — Vanguard Dividend Appreciation. Focuses on dividend GROWERS rather than highest yields. 0.06% fees.
- **JEPI** — JPMorgan Equity Premium Income. ~7% yield, uses options (more complex, higher fees).

**For most people:** SCHD + VTI + VXUS is an excellent 3-fund dividend portfolio.`,
      },
      {
        id: 'div-l6',
        title: 'Taxes on dividends',
        kind: 'text',
        body: `Dividends come in two flavors for tax purposes:

**Qualified dividends** — taxed at favorable long-term capital gains rates (0%, 15%, or 20%). Most US dividend stocks held 60+ days qualify.

**Non-qualified (ordinary) dividends** — taxed at your full income tax rate (up to 37%). Includes REIT dividends, MLP distributions, and dividends from stocks held less than 60 days.

**Tax-efficient tip:** Hold high-yield and non-qualified dividend assets (like REITs, BDCs, and JEPI) in a **Roth IRA** or **Traditional IRA**. There you pay ZERO tax on the dividends. Hold growth stocks with low dividends in taxable accounts.`,
      },
      {
        id: 'div-q1',
        title: 'Quiz: Dividends',
        kind: 'quiz',
        questions: [
          {
            q: 'What is a Dividend Aristocrat?',
            options: [
              'Any stock paying over 5%',
              'A European noble family stock',
              'S&P 500 company that has raised dividends 25+ years',
              'A dividend paid by a royal bank',
            ],
            correct: 2,
          },
          {
            q: 'A dividend yield of 15% is usually:',
            options: [
              'A safe choice',
              'A sign of a great company',
              'A yield trap — likely about to be cut',
              'Normal for tech stocks',
            ],
            correct: 2,
          },
          {
            q: 'What does DRIP stand for?',
            options: [
              'Daily Return Investment Plan',
              'Dividend Reinvestment Plan',
              'Diverse Income Portfolio',
              'Dynamic Rate Investment Plan',
            ],
            correct: 1,
          },
          {
            q: 'Qualified dividends are taxed at:',
            options: [
              'Your full income tax rate',
              'A flat 50% rate',
              'Long-term capital gains rates (0/15/20%)',
              'Nothing — always tax-free',
            ],
            correct: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. OPTIONS BASICS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'options-basics',
    title: 'Options Basics: Calls, Puts & How Not to Blow Up',
    tagline: 'Understand options without losing your shirt.',
    icon: '⚡',
    color: '#f97316',
    level: 'Advanced',
    duration: '~90 minutes',
    summary: 'Options are powerful and dangerous. This course teaches the fundamentals and when NOT to use them.',
    lessons: [
      {
        id: 'opt-l1',
        title: 'What is an option?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/SuTS0SVnSzw',
        body: `An **option** is a contract that gives you the **right, but not the obligation**, to buy or sell a stock at a specific price by a specific date.

**Two types:**
- **Call option** — right to BUY 100 shares at a fixed "strike" price. Bullish bet (you want the stock to go UP).
- **Put option** — right to SELL 100 shares at a fixed strike price. Bearish bet (you want it to go DOWN, or you want insurance for stock you own).

**Key terms:**
- **Strike price** — the price at which you'd buy/sell
- **Expiration date** — when the contract dies
- **Premium** — the price you pay to buy the option
- **Contract size** — 1 contract = 100 shares`,
      },
      {
        id: 'opt-l2',
        title: 'Call options explained',
        kind: 'text',
        body: `**Example:** Tesla is at $250. You think it's going to $300 soon.

- You buy 1 call option with **strike $260**, **expiration 1 month**, **premium $5** per share.
- 1 contract = 100 shares, so you pay **$500 total**.

**Three outcomes at expiration:**

1. **Tesla at $260 or below** → your option is worthless. You lose $500.
2. **Tesla at $280** → your option is worth ($280 − $260) = $20/share × 100 = **$2,000**. Profit: $2,000 − $500 = **$1,500** (300% gain).
3. **Tesla at $310** → option worth $5,000. Profit: **$4,500** (900% gain).

**The tradeoff:** Options give you massive leverage, but most expire worthless. You can lose 100% of your premium easily.`,
      },
      {
        id: 'opt-l3',
        title: 'Put options and hedging',
        kind: 'text',
        body: `**Puts as insurance:** You own 100 shares of NVDA at $500. You're worried about a crash. You buy a **$450 put** expiring in 3 months for $8 ($800 total).

If NVDA stays above $450, your put expires worthless (like insurance you didn't need). Cost: $800.

If NVDA crashes to $350, your put is worth $100/share × 100 = **$10,000**. You profit $9,200 on the put, offsetting most of your stock losses. That's hedging.

**Puts as bearish bets:** Same logic. Buy a put if you think a stock will fall. If it falls below the strike minus premium, you profit.`,
      },
      {
        id: 'opt-l4',
        title: 'The Greeks (briefly)',
        kind: 'text',
        body: `Options prices are affected by multiple factors, called "Greeks":

- **Delta** — how much the option price moves per $1 stock move. (0.5 means option moves $0.50 per $1 stock move.)
- **Theta** — time decay. Options LOSE value every day as expiration approaches. This is the biggest risk for option buyers.
- **Vega** — sensitivity to volatility changes. Higher volatility = more expensive options.
- **Gamma** — how fast delta changes.

**The brutal truth about theta:** An option loses value EVERY DAY you hold it, even if the stock price doesn't move. If you buy a 1-month option and the stock stays flat, you still lose most of your premium by expiration.`,
      },
      {
        id: 'opt-l5',
        title: 'Selling options: covered calls',
        kind: 'text',
        body: `Instead of BUYING options, you can SELL them (also called "writing" options) to collect premium as income.

**Covered call** — the safest option strategy:
1. You already own 100 shares of a stock.
2. You sell 1 call option above the current price.
3. You collect the premium immediately.
4. If the stock stays flat or goes down, you keep the premium.
5. If the stock rises above the strike, you're forced to sell your shares at the strike (you capped your upside).

**Example:** Own 100 AAPL at $180. Sell a $190 call expiring in 30 days for $3. You collect $300 immediately. If AAPL stays under $190, you keep the $300. If AAPL rockets to $200, you're forced to sell at $190 — missed the extra $10 × 100 = $1,000 gain.

**The tradeoff:** Steady income in exchange for capped upside.`,
      },
      {
        id: 'opt-l6',
        title: 'The #1 rule: position size',
        kind: 'text',
        body: `Options are the fastest way to lose all your money. **90% of retail options traders lose money.** Here's how to survive:

**Rules:**
1. Never risk more than **1-3%** of your total portfolio on any single option trade.
2. Never buy options with less than 30-45 days to expiration (theta is brutal).
3. Never sell "naked" options (selling options on stocks you don't own) as a beginner.
4. Always paper-trade in a simulator for 6+ months before using real money.
5. If you don't fully understand the trade, DON'T take it.

**Most investors should NEVER trade options.** Boring index funds will make you richer over 30 years than any options strategy will. Options are for experienced traders hedging specific risks, not for beginners trying to get rich quick.`,
      },
      {
        id: 'opt-q1',
        title: 'Quiz: Options',
        kind: 'quiz',
        questions: [
          {
            q: 'A call option gives you the right to:',
            options: [
              'Call the CEO',
              'Buy 100 shares at a fixed price',
              'Sell 100 shares at a fixed price',
              'Get a dividend',
            ],
            correct: 1,
          },
          {
            q: 'What does "theta" measure?',
            options: [
              'Stock volatility',
              'Time decay of option value',
              'Interest rates',
              'Option delta',
            ],
            correct: 1,
          },
          {
            q: 'A "covered call" means you:',
            options: [
              'Buy a call option',
              'Sell a call option on stock you already own',
              'Buy 100 shares and a call',
              'Call your broker for advice',
            ],
            correct: 1,
          },
          {
            q: 'Roughly what % of retail options traders lose money?',
            options: ['10%', '50%', '90%', '100%'],
            correct: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. PSYCHOLOGY OF INVESTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'psychology',
    title: 'The Psychology of Investing',
    tagline: 'The biggest enemy of your portfolio is the person in the mirror.',
    icon: '🧠',
    color: '#8b5cf6',
    level: 'Intermediate',
    duration: '~60 minutes',
    summary: 'Behavioral finance, cognitive biases, and the mental rules that separate rich investors from broke ones.',
    lessons: [
      {
        id: 'psy-l1',
        title: 'Fear and greed — the market\'s engine',
        kind: 'text',
        body: `Markets are driven by two emotions:
- **Fear** — causes panic selling at the bottom
- **Greed** — causes FOMO buying at the top

Warren Buffett's famous rule: **"Be fearful when others are greedy, and greedy when others are fearful."**

**The data:** Retail investors, on average, underperform the S&P 500 by 3-4% per year — not because they pick bad stocks, but because they **buy high** (when excited) and **sell low** (when scared). Over 30 years, that gap means hundreds of thousands of dollars in lost returns.

**Your edge:** Most humans are programmed to do the wrong thing. If you can train yourself to act rationally when others panic, you'll beat the vast majority of retail investors automatically.`,
      },
      {
        id: 'psy-l2',
        title: 'Loss aversion',
        kind: 'text',
        body: `Psychologists Kahneman and Tversky discovered humans feel the pain of losing $100 about **twice as strongly** as the joy of gaining $100.

**Consequences for investors:**
- People hold losing stocks way too long (hoping they'll "come back"), while selling winners too early (locking in small gains).
- This leads to the classic disaster: a portfolio of losers.
- The psychological pain of a 20% drawdown is MUCH worse than it looks on paper.

**Counter-strategy:** Set rules BEFORE you buy. "I will sell this if it drops 15%" or "I will hold this for 10 years regardless." Pre-commit so your emotional self doesn't hijack your rational self.`,
      },
      {
        id: 'psy-l3',
        title: 'Confirmation bias',
        kind: 'text',
        body: `Once you own a stock, your brain starts ignoring bad news about it and amplifying good news. You'll read a rosy analyst report and dismiss a damning one.

**How to fight it:**
- Actively seek out the **bear case** for every stock you own. Read the most critical article you can find. Is there anything there?
- Keep a trade journal. Write down why you bought before you buy. Review it every quarter.
- When you're wrong, admit it early. Don't let pride compound a bad decision.`,
      },
      {
        id: 'psy-l4',
        title: 'The most dangerous four words',
        kind: 'text',
        body: `**"This time is different."**

These four words have cost investors more money than any other phrase. Every bubble — dot-com 1999, housing 2007, crypto 2021, AI 2024 — had a story about why the old rules no longer applied. They always did.

**The discipline:**
- History rhymes. Extreme valuations always correct eventually.
- When you find yourself justifying a P/E of 100 with "but growth!" — pause.
- When you hear "it'll never go down" — that's near the top, not the bottom.`,
      },
      {
        id: 'psy-l5',
        title: 'The "Do Nothing" portfolio',
        kind: 'text',
        body: `In a famous Fidelity study, the accounts that performed BEST over 10 years belonged to:
1. People who had died
2. People who had forgotten they had accounts

Why? They didn't trade. They didn't panic. They didn't try to time.

**The lesson:** The most valuable skill in investing isn't finding the next Tesla or calling the next crash. It's **doing nothing** when everyone around you is panicking or celebrating.

Jack Bogle (founder of Vanguard) called it: **"Don't just do something — stand there."**`,
      },
      {
        id: 'psy-l6',
        title: 'Video: Buffett on temperament',
        kind: 'video',
        video: 'https://www.youtube.com/embed/gY-IzJs2TTw',
        body: `Warren Buffett says: "The most important quality for an investor is temperament, not intellect. You don't need to be a genius — you just need average intelligence and extraordinary patience and discipline."`,
      },
      {
        id: 'psy-q1',
        title: 'Quiz: Behavioral finance',
        kind: 'quiz',
        questions: [
          {
            q: 'What is loss aversion?',
            options: [
              'Refusing to ever sell',
              'Feeling losses about twice as strongly as equivalent gains',
              'Avoiding stocks that lose money',
              'A type of tax credit',
            ],
            correct: 1,
          },
          {
            q: 'Who said "Be fearful when others are greedy"?',
            options: ['Elon Musk', 'Peter Lynch', 'Warren Buffett', 'Jim Cramer'],
            correct: 2,
          },
          {
            q: 'Which Fidelity account type performed best long-term?',
            options: [
              'Active traders',
              'Professional managers',
              'Forgotten / dormant accounts',
              'Accounts using stop-losses',
            ],
            correct: 2,
          },
          {
            q: 'The phrase "This time is different" is typically:',
            options: [
              'A signal of a new paradigm',
              'Always true',
              'A dangerous rationalization at market tops',
              'Great investing advice',
            ],
            correct: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 11. CRYPTO BASICS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'crypto-basics',
    title: 'Crypto Basics: Bitcoin, Ethereum & Beyond',
    tagline: 'Understand crypto without the hype — and decide if it belongs in your portfolio.',
    icon: '₿',
    color: '#eab308',
    level: 'Intermediate',
    duration: '~50 minutes',
    summary: 'What blockchain actually is, how Bitcoin works, the difference between coins, and whether crypto belongs in a long-term portfolio.',
    lessons: [
      {
        id: 'crypto-l1',
        title: 'What is Bitcoin, actually?',
        kind: 'video',
        video: 'https://www.youtube.com/embed/bBC-nXj3Ng4',
        body: `Bitcoin is a digital currency that runs on a decentralized network of computers (no bank or company controls it). Every transaction is recorded on a public ledger called the **blockchain**.

**Key properties:**
- **Fixed supply** — only 21 million BTC will ever exist. No inflation by printing.
- **Decentralized** — no government or company can shut it down.
- **Pseudonymous** — transactions are public but linked to wallet addresses, not names.
- **Peer-to-peer** — no middlemen needed.

**Why people like it:** A hedge against money printing, a way to send value anywhere on Earth in minutes, and an asset that can't be confiscated if you hold it yourself.

**Why people don't:** Volatile, consumes lots of energy to secure, no intrinsic cash flow, and price has had 70%+ drawdowns multiple times.`,
      },
      {
        id: 'crypto-l2',
        title: 'Ethereum and smart contracts',
        kind: 'text',
        body: `Ethereum (ETH) is the second-biggest crypto. While Bitcoin is mostly "digital gold," Ethereum is a **programmable blockchain**. You can deploy code ("smart contracts") that runs automatically — enabling decentralized apps, NFTs, DeFi (decentralized finance), and more.

**Examples of what runs on Ethereum:**
- **Uniswap** — decentralized stock exchange for tokens
- **Aave** — lending and borrowing without a bank
- **OpenSea** — NFT marketplace
- **ENS** — human-readable blockchain names

**Supply:** ~120 million ETH, and it's slightly deflationary post-2022 (burns fees).`,
      },
      {
        id: 'crypto-l3',
        title: 'Other coins: the good, the bad, the ugly',
        kind: 'text',
        body: `There are 20,000+ cryptocurrencies. The vast majority are worthless or scams. Categories:

**Tier 1 (legitimate, large):** BTC, ETH
**Tier 2 (established alts):** SOL, LINK, DOT, MATIC, AVAX — real projects, high risk
**Stablecoins:** USDC, USDT, DAI — pegged to $1, used for moving between crypto
**Memecoins:** DOGE, SHIB, PEPE — pure speculation, usually end in tears
**Scams / rug pulls:** 95% of new tokens — avoid

**Warning:** If someone on TikTok or Twitter is pumping a new coin with "100x potential," it's almost certainly a scam. Legitimate projects don't need shilling.`,
      },
      {
        id: 'crypto-l4',
        title: 'How to buy crypto safely',
        kind: 'text',
        body: `**Step 1: Pick a reputable exchange.**
- **Coinbase** — US, regulated, beginner-friendly, higher fees
- **Kraken** — US, well-regarded for security
- **Binance** — largest globally (Binance.US for Americans)
- **Gemini** — US, regulated, Winklevoss-founded

**Step 2: Account setup**
- Use strong password + 2FA (authenticator app, not SMS)
- Verify your identity (required by law)

**Step 3: Storage**
- Small amounts (<$1,000): fine to leave on exchange
- Larger amounts: move to a **hardware wallet** (Ledger Nano, Trezor) — a USB device that keeps your crypto offline, immune to hacks

**Rule #1:** "Not your keys, not your coins." If an exchange collapses (FTX, Celsius, Mt. Gox — it happens), funds on the exchange can vanish. Hardware wallets protect you.`,
      },
      {
        id: 'crypto-l5',
        title: 'Does crypto belong in your portfolio?',
        kind: 'text',
        body: `**The honest answer:** Maybe — as a small allocation for most people. Specifically:

- **0-5% of portfolio** — reasonable for most investors who want exposure
- **5-15%** — for crypto believers who can stomach massive drawdowns
- **>20%** — only if you deeply understand the space and can handle losing it all

**What crypto is NOT:**
- A replacement for a diversified index fund portfolio
- A guaranteed way to get rich
- A safe asset (it's not — regular 60%+ drawdowns)
- A substitute for an emergency fund

**What crypto MIGHT be:**
- A long-term hedge against fiat currency debasement
- A growth asset in a diversified portfolio
- A tool to send money globally cheaply

**Rule:** Never put crypto money you can't afford to lose entirely, and never borrow to buy it.`,
      },
      {
        id: 'crypto-q1',
        title: 'Quiz: Crypto basics',
        kind: 'quiz',
        questions: [
          {
            q: 'What\'s the fixed maximum supply of Bitcoin?',
            options: ['1 million', '21 million', '100 million', 'Infinite'],
            correct: 1,
          },
          {
            q: 'What are smart contracts?',
            options: [
              'Legally binding signed contracts',
              'Self-executing code on a blockchain',
              'NFT purchase agreements',
              'AI-written documents',
            ],
            correct: 1,
          },
          {
            q: 'What does "not your keys, not your coins" mean?',
            options: [
              'Never give your password away',
              'If you don\'t hold the private keys, you don\'t truly own the crypto',
              'Only buy cheap coins',
              'Use a car key instead of a USB',
            ],
            correct: 1,
          },
          {
            q: 'What\'s a reasonable crypto allocation for most investors?',
            options: ['0-5%', '25-50%', '75-100%', '500%'],
            correct: 0,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 12. TAXES FOR INVESTORS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'investor-taxes',
    title: 'Taxes for Investors',
    tagline: 'Keep more of your gains — legally.',
    icon: '📑',
    color: '#64748b',
    level: 'Advanced',
    duration: '~50 minutes',
    summary: 'Capital gains, wash sales, tax-loss harvesting, and the strategies that save investors thousands.',
    lessons: [
      {
        id: 'tax-l1',
        title: 'Short-term vs long-term capital gains',
        kind: 'text',
        body: `When you sell an investment for a profit, you owe **capital gains tax**. The rate depends on how long you held it:

**Short-term capital gains** (held ≤ 1 year):
- Taxed at your normal income tax rate (10-37%)
- Punishing if you're a high earner

**Long-term capital gains** (held > 1 year):
- Taxed at 0%, 15%, or 20% depending on income
- For most people, the rate is **15%** — much lower than income tax

**Massive lesson:** Holding a winning stock for **366 days** instead of **364 days** can cut your tax bill in HALF. Always, always, always cross the 1-year threshold when possible.`,
      },
      {
        id: 'tax-l2',
        title: 'Wash sale rule',
        kind: 'text',
        body: `If you sell a stock at a LOSS to claim a tax deduction, you cannot buy back the "substantially identical" security within **30 days** (before or after). If you do, the IRS disallows the loss.

**Example:** Sell AAPL at a $5,000 loss on December 1. If you buy AAPL again on December 15, the loss is disallowed. It gets added to the cost basis of your new shares instead.

**How to work around it:**
- Wait 31 days before re-buying
- Or buy a similar (but not identical) ETF (e.g., sell VOO, buy VTI — different enough for IRS)

**Sneaky trap:** The 30-day window counts across ALL your accounts, including IRAs. And buying the same stock in your Roth IRA while selling at a loss in your taxable account triggers a permanent loss of the deduction.`,
      },
      {
        id: 'tax-l3',
        title: 'Tax-loss harvesting',
        kind: 'text',
        body: `**Tax-loss harvesting** = deliberately selling losing positions to offset gains and reduce your tax bill.

**How it works:**
1. You have $10,000 of realized gains this year
2. You also have $8,000 of unrealized losses in another stock
3. Sell the loser → you now have only $2,000 of net taxable gains
4. Tax saved: $8,000 × 15% = **$1,200**
5. You can re-buy a similar (not identical) ETF to maintain market exposure

**Even better:** If losses exceed gains, up to **$3,000** can be deducted against regular income (with excess carried forward indefinitely). You can permanently reduce your income tax.

**Best practice:** Review your taxable account every December for tax-loss harvesting opportunities.`,
      },
      {
        id: 'tax-l4',
        title: 'Asset location — what to hold where',
        kind: 'text',
        body: `Different account types have different tax properties. Smart investors put tax-inefficient assets in tax-advantaged accounts and tax-efficient assets in taxable accounts.

**Put in TAX-ADVANTAGED accounts (Roth IRA, 401k, HSA):**
- Bonds (interest is taxed as income)
- REITs (non-qualified dividends)
- High-dividend stocks (JEPI, SCHD)
- Actively traded positions
- Crypto (for US investors, if allowed)

**Put in TAXABLE brokerage:**
- Long-term index ETFs (VOO, VTI, VXUS)
- Growth stocks you'll hold 10+ years (Apple, Google)
- Tax-exempt muni bonds
- Stocks you plan to donate or leave as inheritance

**Why:** This alone can add 0.5-1% per year in after-tax returns. Over 30 years, that's **hundreds of thousands of dollars**.`,
      },
      {
        id: 'tax-l5',
        title: 'The step-up in basis (estate planning)',
        kind: 'text',
        body: `Here's a little-known quirk of the US tax code: when someone dies and leaves you appreciated stock, your cost basis is **stepped up** to the value on the date of death. All pre-existing gains become **permanently tax-free**.

**Example:** Your parent bought AAPL in 1995 for $1. It's worth $180 when they die. You inherit it at a cost basis of $180. If you sell immediately, you owe **$0** in capital gains — the full $179 of appreciation escaped tax forever.

**Implication for retirees:** There's almost no reason to sell long-held winners in old age — just hold them for your heirs. Spend from bonds and cash first, keep the appreciated stocks untouched, and pass them on.`,
      },
      {
        id: 'tax-q1',
        title: 'Quiz: Investor taxes',
        kind: 'quiz',
        questions: [
          {
            q: 'Stocks held over 1 year get which tax rate?',
            options: [
              'Short-term (ordinary income)',
              'Long-term capital gains (0/15/20%)',
              'Flat 25%',
              'Zero tax',
            ],
            correct: 1,
          },
          {
            q: 'The wash sale rule prohibits repurchasing the same security within:',
            options: ['1 day', '7 days', '30 days', '1 year'],
            correct: 2,
          },
          {
            q: 'Tax-loss harvesting is:',
            options: [
              'Illegal',
              'Selling losers to offset gains and reduce your tax bill',
              'A retirement strategy',
              'Donating stock to charity',
            ],
            correct: 1,
          },
          {
            q: 'Which asset should typically go in a Roth IRA (not taxable brokerage)?',
            options: [
              'Long-term S&P 500 ETF',
              'High-yield REITs and bonds',
              'Municipal bonds',
              'Stock you\'ll hold 20 years',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },
];

// Total lesson count across all courses
export const TOTAL_LESSONS = COURSES.reduce((sum, c) => sum + c.lessons.length, 0);

// Helper: find a course by id
export const findCourse = (courseId) => COURSES.find(c => c.id === courseId);

// Helper: find a lesson by courseId + lessonId
export const findLesson = (courseId, lessonId) => {
  const course = findCourse(courseId);
  if (!course) return null;
  return course.lessons.find(l => l.id === lessonId);
};

// Helper: flat list of all lessons for next/prev navigation
export const flatLessons = () =>
  COURSES.flatMap(c => c.lessons.map(l => ({ courseId: c.id, lessonId: l.id })));
