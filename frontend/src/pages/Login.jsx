import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '47634608563-5ujf418s9d2imgli6qf5ne4geal510ub.apps.googleusercontent.com';

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, googleLogin, verifyEmail, resendVerification, user, loading } = useAuth();

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      const fromLoc = location.state?.from;
      const from = fromLoc ? `${fromLoc.pathname || '/'}${fromLoc.search || ''}${fromLoc.hash || ''}` : '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email verification step
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (isSignUp) {
        result = await register(email, password, name);
      } else {
        result = await login(email, password);
      }

      // Check if email verification is needed
      if (result?.pending_verification) {
        setVerificationEmail(result.email || email);
        setVerificationStep(true);
        setResendCooldown(60);
        return;
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 8) {
      setError('Please enter the full 8-digit code');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await verifyEmail(verificationEmail, verificationCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await resendVerification(verificationEmail);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  // ── Verification Code Screen ──────────────────────────────────────────────
  if (verificationStep) {
    return (
      <div className="login-page">
        <div className="login-container verify-container">
          <div className="login-form-side" style={{ width: '100%' }}>
            <div className="login-form-wrapper">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(124,140,248,0.15)', border: '2px solid rgba(124,140,248,0.3)',
                  marginBottom: 20,
                }}>
                  <ShieldCheck size={34} style={{ color: 'var(--color-primary, #7c8cf8)' }} />
                </div>
                <h1 style={{ marginBottom: 8 }}>Verify Your Email</h1>
                <p className="login-subtitle" style={{ marginBottom: 6 }}>
                  We sent an 8-digit code to
                </p>
                <p style={{ color: 'var(--color-primary, #7c8cf8)', fontWeight: 600, fontSize: 15, margin: 0 }}>
                  {verificationEmail}
                </p>
              </div>

              <form onSubmit={handleVerifyCode}>
                <div className="login-field" style={{ marginBottom: 6 }}>
                  <ShieldCheck size={16} className="field-icon" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00000000"
                    value={verificationCode}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setVerificationCode(v);
                    }}
                    maxLength={8}
                    autoFocus
                    style={{ letterSpacing: '6px', fontSize: 26, textAlign: 'center', fontWeight: 700 }}
                  />
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 20 }}>
                  Expires in 15 minutes · Check your spam folder if you don't see it
                </p>

                {error && (
                  <div className="login-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="login-submit" disabled={submitting || verificationCode.length !== 8}>
                  {submitting ? (
                    <div className="login-spinner" />
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  style={{
                    background: 'none', border: 'none',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    color: resendCooldown > 0 ? '#555' : 'var(--color-primary, #7c8cf8)',
                    fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <RefreshCw size={13} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <p className="login-toggle" style={{ marginTop: 24 }}>
                Wrong email?{' '}
                <button type="button" onClick={() => {
                  setVerificationStep(false);
                  setVerificationCode('');
                  setError('');
                }}>
                  Go back
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Login / Sign Up Form ─────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - branding */}
        <div className="login-branding">
          <div className="login-brand-content">
            <div className="login-logo">
              <TrendingUp size={40} />
              <span>InvestAI</span>
            </div>
            <h2>Smart investing starts with better insights</h2>
            <p>AI-powered stock analysis, real-time data, and comprehensive financial tools — all in one platform.</p>
            <div className="login-features">
              <div className="login-feature">
                <div className="feature-dot" />
                <span>Real-time market data from 10+ sources</span>
              </div>
              <div className="login-feature">
                <div className="feature-dot" />
                <span>AI analysis powered by multiple models</span>
              </div>
              <div className="login-feature">
                <div className="feature-dot" />
                <span>Portfolio tracking & performance insights</span>
              </div>
              <div className="login-feature">
                <div className="feature-dot" />
                <span>Compare stocks side by side</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className="login-form-side">
          <div className="login-form-wrapper">
            <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="login-subtitle">
              {isSignUp ? 'Sign up to save your settings and portfolio' : 'Sign in to your account'}
            </p>

            {/* Google OAuth */}
            {GOOGLE_CLIENT_ID ? (
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  width="100%"
                  text={isSignUp ? 'signup_with' : 'signin_with'}
                  shape="rectangular"
                />
              </div>
            ) : (
              <button className="google-btn" type="button" onClick={() => setError('Google OAuth not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.')}>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            )}

            <div className="login-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="login-field">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="login-field">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isSignUp && (
                <div className="login-field">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="login-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="login-submit" disabled={submitting}>
                {submitting ? (
                  <div className="login-spinner" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Continue' : 'Sign In'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="login-toggle">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            {isSignUp && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-muted, #888)', marginTop: 10 }}>
                📧 We'll send a verification code to your email to confirm your account.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginForm />
      </GoogleOAuthProvider>
    );
  }
  return <LoginForm />;
}
