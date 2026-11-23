'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { login, quickLogin } from '@/actions/auth';

interface LoginFormProps {
  error?: string;
  notice?: string;
  configured: boolean;
}

export function LoginForm({ error, notice, configured }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillTestCredentials = (chosenEmail = 'omarzaryah@gmail.com') => {
    setEmail(chosenEmail);
    setPassword('1Billion$code0');
  };

  return (
    <div className="auth-container" suppressHydrationWarning>
      {/* Brand Header */}
      <div className="auth-brand-wrap" suppressHydrationWarning>
        <Link href="/" className="brand">
          <span style={{ color: 'var(--gold)', fontSize: 24, marginRight: 6 }}>✦</span>
          <span>DARI<span className="brand-mark">Y</span>A</span>
        </Link>
        <span className="auth-brand-badge">Plateforme Propriétaire • Tanger</span>
      </div>

      {/* Main Glass Card */}
      <div className="auth-glass-card" suppressHydrationWarning>
        {/* Auth Mode Tabs */}
        <div className="auth-tabs">
          <div className="auth-tab active">
            <span>Connexion</span>
          </div>
          <Link href="/signup" className="auth-tab">
            <span>Créer un compte</span>
          </Link>
        </div>

        <div className="auth-card-body" suppressHydrationWarning>
          <div className="auth-header">
            <h1 className="auth-title">Bienvenue</h1>
            <p className="auth-subtitle">
              Accédez à vos rapports d&apos;inspection, contrats et suivi de bien à Tanger.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="auth-alert error" role="alert">
              <span className="auth-alert-icon">!</span>
              <div>
                <strong>Erreur de connexion</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {notice && (
            <div className="auth-alert notice" role="status">
              <CheckCircle2 size={16} className="auth-alert-icon-check" />
              <div>
                <strong>Information</strong>
                <p>{notice}</p>
              </div>
            </div>
          )}

          {!configured && (
            <div className="auth-alert error">
              <span className="auth-alert-icon">!</span>
              <div>
                <strong>Supabase non configuré</strong>
                <p>Veuillez vérifier les variables d&apos;environnement dans .env.local.</p>
              </div>
            </div>
          )}

          {/* Direct 1-Click Instant Login for all 4 roles */}
          <div className="auth-test-helper" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: 'rgba(20, 43, 59, 0.04)', borderRadius: 12, border: '1px solid rgba(20, 43, 59, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} style={{ color: 'var(--gold)' }} />
                <span>Tester par rôle (Connexion 1-Clic) :</span>
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
                MDP commun : <strong style={{ color: 'var(--gold)', letterSpacing: 0.5 }}>1Billion$code0</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {/* 1. Propriétaire (Owner) */}
              <form action={quickLogin} style={{ margin: 0 }}>
                <input type="hidden" name="email" value="omarzaryah@gmail.com" />
                <button
                  type="submit"
                  className="auth-test-btn"
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '9px 12px', gap: 3, borderLeft: '3px solid #142B3B' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#142B3B' }}>🏠 Propriétaire</span>
                    <span className="auth-test-badge" style={{ backgroundColor: '#142B3B', color: '#fff', fontSize: '0.68rem', padding: '2px 6px' }}>Entrer ➔</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>omarzaryah@gmail.com</span>
                </button>
              </form>

              {/* 2. Admin DARIYA */}
              <form action={quickLogin} style={{ margin: 0 }}>
                <input type="hidden" name="email" value="omarzariah.dev@gmail.com" />
                <button
                  type="submit"
                  className="auth-test-btn"
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '9px 12px', gap: 3, borderLeft: '3px solid #C87955' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#C87955' }}>🛡️ Administrateur</span>
                    <span className="auth-test-badge" style={{ backgroundColor: '#C87955', color: '#fff', fontSize: '0.68rem', padding: '2px 6px' }}>Entrer ➔</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>omarzariah.dev@gmail.com</span>
                </button>
              </form>

              {/* 3. Agent Inspecteur */}
              <form action={quickLogin} style={{ margin: 0 }}>
                <input type="hidden" name="email" value="agent@dariya.ma" />
                <button
                  type="submit"
                  className="auth-test-btn"
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '9px 12px', gap: 3, borderLeft: '3px solid #82958A' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#4d695b' }}>📋 Inspecteur Terrain</span>
                    <span className="auth-test-badge" style={{ backgroundColor: '#82958A', color: '#fff', fontSize: '0.68rem', padding: '2px 6px' }}>Entrer ➔</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>agent@dariya.ma</span>
                </button>
              </form>

              {/* 4. Prestataire / Artisan */}
              <form action={quickLogin} style={{ margin: 0 }}>
                <input type="hidden" name="email" value="provider@dariya.ma" />
                <button
                  type="submit"
                  className="auth-test-btn"
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '9px 12px', gap: 3, borderLeft: '3px solid #B8860B' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#856404' }}>🔧 Artisan / Prestataire</span>
                    <span className="auth-test-badge" style={{ backgroundColor: '#B8860B', color: '#fff', fontSize: '0.68rem', padding: '2px 6px' }}>Entrer ➔</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>provider@dariya.ma</span>
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--muted)', paddingTop: 4 }}>
              <span>Ou remplissez les champs pour vous connecter :</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('omarzaryah@gmail.com')}
                  style={{ background: 'none', border: 'none', color: 'var(--navy)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  Remplir Owner
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('omarzariah.dev@gmail.com')}
                  style={{ background: 'none', border: 'none', color: 'var(--terracotta)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  Remplir Admin
                </button>
              </div>
            </div>
          </div>

          <form
            action={async (formData: FormData) => {
              setIsSubmitting(true);
              try {
                await login(formData);
              } catch (e) {
                setIsSubmitting(false);
                throw e;
              }
            }}
            className="auth-form"
          >
            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Adresse e-mail
              </label>
              <div className="auth-input-wrap">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-label">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="auth-forgot-link">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input has-action"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="auth-submit-btn"
              type="submit"
              disabled={!configured || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="auth-spinner" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Se connecter à mon espace</span>
                  <ArrowRight size={15} style={{ marginInlineStart: 'auto' }} />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="auth-card-footer">
            <p className="auth-switch-text">
              Vous n&apos;avez pas encore d&apos;espace ?{' '}
              <Link href="/signup" className="auth-switch-link">
                Créer un compte propriétaire
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Security Guarantee */}
      <div className="auth-trust-strip">
        <div className="auth-trust-item">
          <ShieldCheck size={14} className="auth-trust-icon" />
          <span>PostgreSQL Row-Level Security</span>
        </div>
        <div className="auth-trust-item">
          <span className="auth-trust-dot" />
          <span>Données hébergées en conformité</span>
        </div>
        <div className="auth-trust-item">
          <span className="auth-trust-dot" />
          <span>Tanger, Maroc</span>
        </div>
      </div>

      {/* Return home */}
      <div className="auth-back-link-wrap">
        <Link href="/" className="auth-back-link">
          ← Retour à l&apos;accueil DARIYA
        </Link>
      </div>
    </div>
  );
}
