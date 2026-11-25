'use client';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { OwlMark } from './Logo';

const FEATURES = [
  ['Pipeline you can drag', 'Move deals between stages and see the weighted forecast update instantly.'],
  ['Metrics with the math shown', 'Win rate, sales cycle and sales velocity, each with its formula.'],
  ['An AI copilot', 'Ask what to prioritize or which deals are at risk, answered from your own data.'],
];

export function AuthScreen({ onDemo }: { onDemo(): void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMessage({ tone: 'error', text: error.message });
    else if (mode === 'signup' && !data.session)
      setMessage({ tone: 'info', text: 'Check your inbox to confirm your email, then sign in.' });
  };

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="auth-logo">
          <OwlMark size={48} />
          <div>
            <b>
              Wise<span>CRM</span>
            </b>
            <small>by WiseSource</small>
          </div>
        </div>
        <h1 className="display">
          The sales CRM that <em>explains</em> its numbers.
        </h1>
        <ul>
          {FEATURES.map(([title, text]) => (
            <li key={title}>
              <b>{title}</b>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <div className="auth-owl" aria-hidden="true">
          <OwlMark size={170} />
        </div>
      </section>

      <section className="auth-card panel">
        <h2>{mode === 'signin' ? 'Sign in' : 'Create your account'}</h2>
        <p className="muted small">Your data stays private to your workspace.</p>
        <button className="btn block demo-btn" onClick={onDemo}>
          Try the live demo, no sign-up
        </button>
        <div className="divider">
          <span>or use your account</span>
        </div>
        <form onSubmit={submit} className="form-grid single">
          <label>
            Email
            <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              className="field"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {message && <p className={`form-msg ${message.tone}`}>{message.text}</p>}
          <button className="ghost block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="small muted center">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button className="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </div>
  );
}
