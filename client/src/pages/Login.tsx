import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Mail, ArrowRight, Zap, Eye, EyeOff, AlertCircle, Shield,
  Fingerprint, UserPlus, User, Sparkles,
} from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

type AuthMode = 'login' | 'register';

interface DemoPersona {
  initials: string;
  name: string;
  role: string;
  email: string;
  color: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  { initials: 'JD', name: 'Jane Doe', role: 'Executive', email: 'jane.doe@uos.com', color: '#6366F1' },
  { initials: 'MJ', name: 'Marcus Johnson', role: 'Engineering', email: 'marcus.johnson@uos.com', color: '#22C55E' },
  { initials: 'SC', name: 'Sarah Chen', role: 'People', email: 'sarah.chen@uos.com', color: '#F59E0B' },
  { initials: 'DK', name: 'David Kim', role: 'Finance', email: 'david.kim@uos.com', color: '#EF4444' },
];

const DEMO_PASSWORD = 'Password123!';

export function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuthStore();

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.login(loginEmail, loginPassword);
      login(data.token, data.refreshToken, data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
      setLoadingPersona(null);
    }
  };

  const handlePersonaClick = (persona: DemoPersona) => {
    setLoadingPersona(persona.email);
    setEmail(persona.email);
    setPassword(DEMO_PASSWORD);
    setError('');
    doLogin(persona.email, DEMO_PASSWORD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (mode === 'register' && (!firstName.trim() || !lastName.trim())) {
      setError('First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      let data;
      if (mode === 'register') {
        data = await authApi.register({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      } else {
        data = await authApi.login(email, password);
      }
      login(data.token, data.refreshToken, data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="login-page">
      {/* ─── Left Panel — Animated Brand ─── */}
      <div className="login-hero">
        <div className="login-mesh" />
        <div className="login-mesh-overlay" />

        {/* Floating geometric shapes */}
        <div className="login-shapes">
          <div className="login-shape login-shape-1" />
          <div className="login-shape login-shape-2" />
          <div className="login-shape login-shape-3" />
        </div>

        {/* 3D Animated Orb */}
        <div className="login-orb-container">
          <div className="login-orb">
            <div className="login-orb-ring login-orb-ring-1" />
            <div className="login-orb-ring login-orb-ring-2" />
            <div className="login-orb-ring login-orb-ring-3" />
            <div className="login-orb-core" />
          </div>
        </div>

        {/* Hero Content */}
        <motion.div
          className="login-hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="login-hero-logo">
            <div className="login-logo-mark">
              <Zap size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="login-logo-text">Unified Workforce OS</span>
          </div>

          <h1 className="login-hero-title">
            Operate your <br />
            <span className="login-hero-highlight">Global Payroll</span>
            <br />in one platform.
          </h1>

          <p className="login-hero-subtitle">
            The next-generation enterprise OS unifying HR, IT, Finance, CRM,
            and Workplace into a real-time, automated experience.
          </p>

          {/* Trust Signals */}
          <motion.div
            className="login-trust-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="login-trust-item">
              <div className="login-trust-value">31</div>
              <div className="login-trust-label">Active Team</div>
            </div>
            <div className="login-trust-divider" />
            <div className="login-trust-item">
              <div className="login-trust-value">100%</div>
              <div className="login-trust-label">Encrypted Fleet</div>
            </div>
            <div className="login-trust-divider" />
            <div className="login-trust-item">
              <div className="login-trust-value">99.99%</div>
              <div className="login-trust-label">SLA Uptime</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── Right Panel — Auth Form ─── */}
      <div className="login-form-panel">
        <motion.div
          className="login-form-wrapper"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <div className="login-logo-mark">
              <Zap size={18} color="white" strokeWidth={2.5} />
            </div>
            <span className="login-mobile-brand">Unified Workforce OS</span>
          </div>

          {/* Form Header */}
          <div className="login-form-header">
            <h2 className="login-form-title">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="login-form-desc">
              {mode === 'login'
                ? 'Select a quick persona or enter your credentials to sign in.'
                : 'Set up your credentials to get started.'}
            </p>
          </div>

          {/* Quick Demo Personas */}
          {mode === 'login' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="login-personas-header">
                <Sparkles size={13} />
                <span>Quick Demo Personas (1-Click)</span>
              </div>
              <div className="login-personas-grid">
                {DEMO_PERSONAS.map((persona) => (
                  <motion.button
                    key={persona.email}
                    type="button"
                    className={`login-persona-card ${loadingPersona === persona.email ? 'login-persona-loading' : ''}`}
                    onClick={() => handlePersonaClick(persona)}
                    disabled={isLoading}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className="login-persona-avatar"
                      style={{ background: persona.color }}
                    >
                      {persona.initials}
                    </div>
                    <div className="login-persona-info">
                      <div className="login-persona-name">{persona.name}</div>
                      <div className="login-persona-role">{persona.role}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="login-divider">
                <span>Or sign in with password</span>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="login-name-fields"
                >
                  <div className={`login-field ${focused === 'firstName' ? 'login-field-focused' : ''}`}>
                    <label className="login-label">First Name</label>
                    <div className="login-input-wrap">
                      <User size={15} className="login-input-icon" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onFocus={() => setFocused('firstName')}
                        onBlur={() => setFocused(null)}
                        placeholder="Jane"
                        autoComplete="given-name"
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className={`login-field ${focused === 'lastName' ? 'login-field-focused' : ''}`}>
                    <label className="login-label">Last Name</label>
                    <div className="login-input-wrap">
                      <User size={15} className="login-input-icon" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onFocus={() => setFocused('lastName')}
                        onBlur={() => setFocused(null)}
                        placeholder="Doe"
                        autoComplete="family-name"
                        className="login-input"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`login-field ${focused === 'email' ? 'login-field-focused' : ''}`}>
              <label className="login-label">Work Email</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="jane.doe@uos.com"
                  required
                  autoComplete="email"
                  className="login-input"
                />
              </div>
            </div>

            <div className={`login-field ${focused === 'password' ? 'login-field-focused' : ''}`}>
              <div className="login-label-row">
                <label className="login-label">Password</label>
                {mode === 'login' && (
                  <span className="login-forgot">Forgot?</span>
                )}
              </div>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder={mode === 'register' ? 'Min. 8 characters, mixed case + number' : '••••••••'}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle-pw"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !email || !password}
              className="login-submit"
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
            >
              {isLoading && !loadingPersona ? (
                <span className="login-spinner">
                  <span className="login-spinner-dot" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign in to Platform' : 'Create Account'}</span>
                  {mode === 'login' ? <ArrowRight size={16} /> : <UserPlus size={16} />}
                </>
              )}
            </motion.button>
          </form>

          {/* Mode Switch */}
          <div className="login-mode-switch">
            <span className="login-mode-text">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              className="login-mode-btn"
              onClick={switchMode}
            >
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          {/* Footer Badges */}
          <div className="login-footer">
            <div className="login-footer-badge">
              <Shield size={12} color="var(--success)" />
              <span>TLS 1.3 Encryption</span>
            </div>
            <div className="login-footer-badge">
              <Fingerprint size={12} color="#6366F1" />
              <span>SOC 2 & ISO 27001</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
export default Login;
