import { useState } from 'react';
import { Brain, ChevronRight, RotateCcw, TrendingUp, Shield, Zap, DollarSign, Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const QUESTIONS = [
  {
    q: "The market drops 20% in a week. What do you do?",
    options: [
      { text: "Panic sell everything", score: { risk: 1, patience: 1, conviction: 1 } },
      { text: "Hold and wait it out", score: { risk: 3, patience: 4, conviction: 3 } },
      { text: "Buy more — stocks are on sale", score: { risk: 5, patience: 5, conviction: 5 } },
      { text: "Hedge with puts, then evaluate", score: { risk: 3, patience: 3, conviction: 4, strategy: 5 } },
    ],
  },
  {
    q: "How long would you hold a stock that hasn't moved in 18 months?",
    options: [
      { text: "I'd sell after 3 months", score: { patience: 1, momentum: 5 } },
      { text: "6-12 months max", score: { patience: 3, momentum: 3 } },
      { text: "Years if the thesis is intact", score: { patience: 5, conviction: 5, value: 4 } },
      { text: "Depends on what else I could invest in", score: { patience: 3, strategy: 4 } },
    ],
  },
  {
    q: "A stock you own misses earnings by 5%. What's your move?",
    options: [
      { text: "Sell immediately", score: { momentum: 5, patience: 1, risk: 2 } },
      { text: "Research why and decide", score: { strategy: 5, conviction: 3, patience: 3 } },
      { text: "Buy the dip if I believe long-term", score: { conviction: 5, value: 4, patience: 4 } },
      { text: "Trim position but hold some", score: { risk: 3, strategy: 4 } },
    ],
  },
  {
    q: "Which best describes your ideal investment?",
    options: [
      { text: "High-growth tech disruptors", score: { growth: 5, risk: 4, momentum: 4 } },
      { text: "Undervalued companies with strong cash flow", score: { value: 5, patience: 4, conviction: 3 } },
      { text: "Dividend aristocrats for steady income", score: { income: 5, patience: 5, risk: 1 } },
      { text: "A mix of everything — diversification", score: { strategy: 5, risk: 3, value: 3, growth: 3 } },
    ],
  },
  {
    q: "How do you primarily research investments?",
    options: [
      { text: "Charts, technicals, and momentum signals", score: { momentum: 5, strategy: 3 } },
      { text: "Earnings reports, balance sheets, DCF models", score: { value: 5, strategy: 5, conviction: 4 } },
      { text: "News, social sentiment, and trends", score: { momentum: 4, risk: 4 } },
      { text: "I use AI and automated screeners", score: { strategy: 5, growth: 3 } },
    ],
  },
  {
    q: "How much of your portfolio would you put in a single stock?",
    options: [
      { text: "Up to 50% if I'm really convinced", score: { conviction: 5, risk: 5, strategy: 1 } },
      { text: "Max 20% — concentration matters", score: { conviction: 4, risk: 3, strategy: 3 } },
      { text: "Never more than 5% — stay diversified", score: { risk: 1, strategy: 5, patience: 3 } },
      { text: "I prefer index funds", score: { risk: 1, patience: 4, strategy: 4 } },
    ],
  },
  {
    q: "What's your reaction to a trending meme stock?",
    options: [
      { text: "YOLO — throw some money at it", score: { risk: 5, momentum: 5, conviction: 1 } },
      { text: "Analyze it first, maybe buy with a small position", score: { strategy: 4, risk: 3, momentum: 3 } },
      { text: "Stay far away — fundamentals matter", score: { value: 5, patience: 4, risk: 1 } },
      { text: "Buy puts — profit from the inevitable crash", score: { strategy: 5, risk: 4, momentum: 4 } },
    ],
  },
  {
    q: "How often do you check your portfolio?",
    options: [
      { text: "Multiple times per day", score: { momentum: 5, patience: 1, risk: 4 } },
      { text: "Once a day", score: { momentum: 3, patience: 3 } },
      { text: "Weekly", score: { patience: 4, value: 3 } },
      { text: "Monthly or less", score: { patience: 5, conviction: 4, income: 3 } },
    ],
  },
];

const INVESTOR_TYPES = [
  { name: "The Momentum Surfer", icon: Zap, color: '#7c8cf8', condition: (s) => s.momentum >= 4 && s.risk >= 3,
    desc: "You ride trends and capture momentum. Quick to act, you thrive in fast markets. Watch out for whipsaws and remember to take profits.",
    strategy: "Focus: Technical analysis, trend-following, breakout trading. Ideal tools: Momentum Radar, Smart Pattern Scanner.",
  },
  { name: "The Value Hunter", icon: DollarSign, color: '#22c55e', condition: (s) => s.value >= 4 && s.patience >= 3,
    desc: "You seek bargains and have the patience to wait for the market to recognize true value. Warren Buffett would approve.",
    strategy: "Focus: Fundamental analysis, DCF models, margin of safety. Ideal tools: Screener with value filters, Stock Battle Arena.",
  },
  { name: "The Income Architect", icon: Shield, color: '#f59e0b', condition: (s) => s.income >= 4 || (s.patience >= 4 && s.risk <= 2),
    desc: "You build a fortress of dividend income. Steady and reliable, you prefer predictable cash flows over speculative gains.",
    strategy: "Focus: Dividend aristocrats, REIT allocation, bond ladders. Ideal tools: Dividend Calendar, Portfolio X-Ray.",
  },
  { name: "The Growth Visionary", icon: TrendingUp, color: '#a78bfa', condition: (s) => s.growth >= 4 && s.conviction >= 3,
    desc: "You see the future before others do. Willing to pay a premium for companies disrupting their industries.",
    strategy: "Focus: Revenue growth rates, TAM analysis, competitive moats. Ideal tools: AI Analysis, Sector Rotation Tracker.",
  },
  { name: "The Strategic Architect", icon: Target, color: '#06b6d4', condition: (s) => s.strategy >= 4,
    desc: "You approach investing like a chess game — every move calculated. You blend multiple strategies and manage risk methodically.",
    strategy: "Focus: Portfolio construction, factor exposure, risk-adjusted returns. Ideal tools: Portfolio X-Ray, Macro Pulse, Stress Test.",
  },
];

export default function InvestorQuiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    if (currentQ + 1 >= QUESTIONS.length) {
      calculateResult(newAnswers);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const calculateResult = (allAnswers) => {
    const traits = { risk: 0, patience: 0, conviction: 0, strategy: 0, momentum: 0, value: 0, growth: 0, income: 0 };
    const counts = { ...traits };

    allAnswers.forEach(a => {
      Object.entries(a.score).forEach(([key, val]) => {
        if (key in traits) {
          traits[key] += val;
          counts[key] += 1;
        }
      });
    });

    // Average
    const avgTraits = {};
    Object.keys(traits).forEach(k => {
      avgTraits[k] = counts[k] > 0 ? Math.round((traits[k] / counts[k]) * 20) / 20 : 2.5;
    });

    // Find matching type
    let investorType = INVESTOR_TYPES[INVESTOR_TYPES.length - 1];
    for (const type of INVESTOR_TYPES) {
      if (type.condition(avgTraits)) {
        investorType = type;
        break;
      }
    }

    setResult({ traits: avgTraits, type: investorType });
  };

  const restart = () => {
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
  };

  const progress = ((currentQ + (result ? 1 : 0)) / QUESTIONS.length) * 100;

  const radarData = result ? [
    { trait: 'Risk', value: result.traits.risk * 20 },
    { trait: 'Patience', value: result.traits.patience * 20 },
    { trait: 'Conviction', value: result.traits.conviction * 20 },
    { trait: 'Strategy', value: result.traits.strategy * 20 },
    { trait: 'Momentum', value: result.traits.momentum * 20 },
    { trait: 'Value', value: result.traits.value * 20 },
    { trait: 'Growth', value: result.traits.growth * 20 },
    { trait: 'Income', value: result.traits.income * 20 },
  ] : [];

  return (
    <div className="quiz-page">
      <div className="page-header-row">
        <div>
          <h1><Brain size={28} /> Investor Personality Quiz</h1>
          <p className="page-subtitle">Discover your investing style and get personalized recommendations</p>
        </div>
        {(currentQ > 0 || result) && <button className="refresh-btn" onClick={restart}><RotateCcw size={16} /> Restart</button>}
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="quiz-progress-label">{result ? 'Complete!' : `Question ${currentQ + 1} of ${QUESTIONS.length}`}</div>

      {/* Question */}
      {!result && (
        <div className="quiz-question-card">
          <h2>{QUESTIONS[currentQ].q}</h2>
          <div className="quiz-options">
            {QUESTIONS[currentQ].options.map((opt, i) => (
              <button key={i} className="quiz-option" onClick={() => handleAnswer(opt)}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt.text}
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <div className="quiz-result-card" style={{ borderColor: result.type.color }}>
            <div className="result-icon" style={{ color: result.type.color }}>
              <result.type.icon size={48} />
            </div>
            <h2 style={{ color: result.type.color }}>You are: {result.type.name}</h2>
            <p className="result-desc">{result.type.desc}</p>
            <div className="result-strategy">
              <h4>Recommended Strategy</h4>
              <p>{result.type.strategy}</p>
            </div>
          </div>

          <div className="feature-card">
            <h3>Your Investment DNA</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: '#ccc', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Your Profile" dataKey="value" stroke={result.type.color} fill={result.type.color} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="feature-card">
            <h3>Trait Breakdown</h3>
            <div className="trait-bars">
              {Object.entries(result.traits).map(([k, v]) => (
                <div key={k} className="trait-bar-row">
                  <span className="trait-name">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  <div className="trait-bar">
                    <div className="trait-bar-fill" style={{ width: `${v * 20}%`, background: result.type.color }} />
                  </div>
                  <span className="trait-val">{(v).toFixed(1)}/5</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
