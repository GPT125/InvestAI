import { useState } from 'react';
import { Check, X, Zap, Crown, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLAN_ICONS = { Free: Star, Pro: Zap, Max: Crown };

function makePlans(annual) {
  return [
    {
      name: 'Free',
      priceMonthly: '$0',
      priceAnnual: '$0',
      period: 'forever',
      description: 'Perfect for getting started with investing',
      features: [
        { name: 'AI Stock Analysis',        value: '5 / day',            included: true  },
        { name: 'AI Chat Messages',         value: '10 / day',           included: true  },
        { name: 'Academy Access',           value: 'Full',               included: true  },
        { name: 'Global Markets Data',      value: '15-min delayed',     included: true  },
        { name: 'Portfolios',               value: '1',                  included: true  },
        { name: 'Competitions',             value: 'Join only',          included: true  },
        { name: 'Stress Test & Time Machine', value: '3 presets',        included: true  },
        { name: 'Real-time alerts',         value: '',                   included: false },
        { name: 'Image upload in chat',     value: '',                   included: false },
        { name: 'Priority support',         value: 'Community only',     included: false },
      ],
      cta: 'Current Plan',
      ctaDisabled: true,
      accent: '#64748b',
    },
    {
      name: 'Pro',
      priceMonthly: '$9.99',
      priceAnnual: '$99',
      period: annual ? '/year' : '/month',
      annualNote: annual ? 'Save 17% vs monthly' : 'or $99/year — save 17%',
      description: 'For active self-directed investors',
      popular: true,
      features: [
        { name: 'AI Stock Analysis',          value: '50 / day',          included: true },
        { name: 'AI Chat Messages',           value: '100 / day',         included: true },
        { name: 'Academy Access',             value: 'Full + certificates', included: true },
        { name: 'Global Markets Data',        value: 'Real-time',         included: true },
        { name: 'Portfolios',                 value: '5',                 included: true },
        { name: 'Competitions',               value: 'Create + Join',     included: true },
        { name: 'Stress Test & Time Machine', value: 'All presets',       included: true },
        { name: 'Real-time alerts',           value: 'Email + In-app',    included: true },
        { name: 'Image upload in chat',       value: 'Unlimited',         included: true },
        { name: 'Priority support',           value: 'Email (48 hr)',     included: true },
      ],
      cta: 'Upgrade to Pro',
      ctaDisabled: false,
      accent: '#7c8cf8',
    },
    {
      name: 'Max',
      priceMonthly: '$19.99',
      priceAnnual: '$179',
      period: annual ? '/year' : '/month',
      annualNote: annual ? 'Save 25% vs monthly' : 'or $179/year — save 25%',
      description: 'For serious investors who want everything',
      features: [
        { name: 'AI Stock Analysis',          value: 'Unlimited',              included: true },
        { name: 'AI Chat Messages',           value: 'Unlimited',              included: true },
        { name: 'Academy Access',             value: 'Full + live office hours', included: true },
        { name: 'Global Markets Data',        value: 'Real-time + Alerts',     included: true },
        { name: 'Portfolios',                 value: 'Unlimited',              included: true },
        { name: 'Competitions',               value: 'Create + AI opponents',  included: true },
        { name: 'Stress Test & Time Machine', value: 'Custom scenarios',       included: true },
        { name: 'Real-time alerts',           value: 'SMS + Email + In-app',   included: true },
        { name: 'Image upload in chat',       value: 'Unlimited',              included: true },
        { name: 'Priority support',           value: 'Priority (24 hr)',       included: true },
      ],
      cta: 'Upgrade to Max',
      ctaDisabled: false,
      accent: '#f59e0b',
    },
  ];
}

const FAQS = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes — upgrade or downgrade at any time. Changes take effect immediately and we prorate any unused balance.',
  },
  {
    q: 'Is the Academy really free on every plan?',
    a: 'Yes, all 12 courses are completely free on every plan. We believe investing education should be accessible to everyone.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards, plus Apple Pay and Google Pay through our Stripe payment integration.',
  },
  {
    q: 'Is InvestAI financial advice?',
    a: 'No. InvestAI provides educational information and AI-generated analysis only. It is not personalized financial advice. Always consult a licensed financial advisor before making investment decisions.',
  },
  {
    q: 'Can I cancel whenever I want?',
    a: 'Absolutely. Cancel in one click from your settings — no questions asked. You keep access until the end of the current billing period.',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [annual, setAnnual] = useState(true);
  const plans = makePlans(annual);

  const handleUpgrade = (planName) => {
    alert(
      `Checkout for the ${planName} plan is coming soon. Once Stripe is connected, clicking here will take you straight to the payment page.`
    );
  };

  return (
    <div className="dashboard pricing-page">
      {/* Hero */}
      <div className="pricing-hero">
        <div className="pricing-hero-badge">
          <Sparkles size={13} /> Simple, transparent pricing
        </div>
        <h1 className="pricing-hero-title">Upgrade your investing edge</h1>
        <p className="pricing-hero-sub">
          Free to start. Unlock unlimited AI analysis, real-time data, and advanced tools when
          you're ready. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="pricing-toggle">
          <button
            className={`pricing-toggle-btn ${!annual ? 'active' : ''}`}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`pricing-toggle-btn ${annual ? 'active' : ''}`}
            onClick={() => setAnnual(true)}
          >
            Yearly <span className="pricing-save-pill">Save up to 25%</span>
          </button>
        </div>
      </div>

      {/* Plan grid */}
      <div className="pricing-grid">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name];
          const price = annual ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={plan.name}
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              style={plan.popular ? { '--plan-accent': plan.accent } : undefined}
            >
              {plan.popular && <div className="pricing-popular-badge">★ Most Popular</div>}

              <div className="pricing-card-head">
                <div className="pricing-plan-name">
                  <span
                    className="pricing-plan-icon"
                    style={{ background: plan.accent + '22', color: plan.accent }}
                  >
                    <Icon size={18} />
                  </span>
                  <h3>{plan.name}</h3>
                </div>
                <div className="pricing-price-row">
                  <span className="pricing-price">{price}</span>
                  <span className="pricing-period">{plan.period}</span>
                </div>
                {plan.annualNote && (
                  <div className="pricing-annual-note" style={{ color: plan.accent }}>
                    {plan.annualNote}
                  </div>
                )}
                <p className="pricing-desc">{plan.description}</p>
              </div>

              <ul className="pricing-features">
                {plan.features.map((f, i) => (
                  <li key={i} className={f.included ? 'included' : 'excluded'}>
                    {f.included ? (
                      <Check size={15} className="pricing-check" />
                    ) : (
                      <X size={15} className="pricing-x" />
                    )}
                    <span className="pricing-feature-name">{f.name}</span>
                    {f.value && <span className="pricing-feature-val">{f.value}</span>}
                  </li>
                ))}
              </ul>

              <button
                className={`pricing-cta ${plan.popular ? 'primary' : ''}`}
                disabled={plan.ctaDisabled}
                onClick={() => !plan.ctaDisabled && handleUpgrade(plan.name)}
                style={plan.popular ? { background: plan.accent } : undefined}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust strip */}
      <div className="pricing-trust">
        <div className="pricing-trust-item">
          <ShieldCheck size={18} />
          <div>
            <strong>Bank-grade security</strong>
            <span>256-bit encryption · SOC 2 roadmap</span>
          </div>
        </div>
        <div className="pricing-trust-item">
          <Check size={18} />
          <div>
            <strong>Cancel anytime</strong>
            <span>No contracts, no hidden fees</span>
          </div>
        </div>
        <div className="pricing-trust-item">
          <Sparkles size={18} />
          <div>
            <strong>7-day money back</strong>
            <span>Full refund on Pro & Max</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="pricing-faq">
        <h2>Frequently asked questions</h2>
        <div className="pricing-faq-grid">
          {FAQS.map((f, i) => (
            <div key={i} className="pricing-faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-footer-note">
        Signed in as <strong>{user?.name || user?.email || 'guest'}</strong>. Payments are
        processed securely by Stripe — we never see or store your card details.
      </div>
    </div>
  );
}
