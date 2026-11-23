'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Phone, Globe, Languages, UserPlus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { signup } from '@/actions/auth';

interface SignupFormProps {
  error?: string;
  notice?: string;
  configured: boolean;
}

const COUNTRIES = [
  { code: 'FR', label: 'France 🇫🇷' },
  { code: 'MA', label: 'Maroc 🇲🇦' },
  { code: 'ES', label: 'Espagne 🇪🇸' },
  { code: 'BE', label: 'Belgique 🇧🇪' },
  { code: 'GB', label: 'Royaume-Uni 🇬🇧' },
  { code: 'NL', label: 'Pays-Bas 🇳🇱' },
  { code: 'CA', label: 'Canada 🇨🇦' },
  { code: 'AE', label: 'Émirats Arabes Unis 🇦🇪' },
  { code: 'US', label: 'États-Unis 🇺🇸' },
  { code: 'DE', label: 'Allemagne 🇩🇪' },
  { code: 'IT', label: 'Italie 🇮🇹' },
  { code: 'OTHER', label: 'Autre pays 🌍' },
];

export function SignupForm({ error, notice, configured }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordLongEnough = password.length >= 8;

  return (
    <div className="auth-container">
      {/* Brand Header */}
      <div className="auth-brand-wrap">
        <Link href="/" className="brand">
          <span style={{ color: 'var(--gold)', fontSize: 24, marginRight: 6 }}>✦</span>
          <span>DARI<span className="brand-mark">Y</span>A</span>
        </Link>
        <span className="auth-brand-badge">Espace Propriétaire • Tanger</span>
      </div>

      {/* Main Glass Card */}
      <div className="auth-glass-card" style={{ maxWidth: 520 }}>
        {/* Auth Mode Tabs */}
        <div className="auth-tabs">
          <Link href="/login" className="auth-tab">
            <span>Connexion</span>
          </Link>
          <div className="auth-tab active">
            <span>Créer un compte</span>
          </div>
        </div>

        <div className="auth-card-body">
          <div className="auth-header">
            <h1 className="auth-title">Créer votre espace</h1>
            <p className="auth-subtitle">
              Rejoignez DARIYA pour faire inspecter, entretenir et valoriser vos biens immobiliers à Tanger.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="auth-alert error" role="alert">
              <span className="auth-alert-icon">!</span>
              <div>
                <strong>Erreur d&apos;inscription</strong>
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

          <form
            action={async (formData: FormData) => {
              setIsSubmitting(true);
              try {
                await signup(formData);
              } catch (e) {
                setIsSubmitting(false);
                throw e;
              }
            }}
            className="auth-form"
          >
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="full_name" className="auth-label">
                Nom complet
              </label>
              <div className="auth-input-wrap">
                <User size={17} className="auth-input-icon" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="ex. Omar Benjelloun"
                  autoComplete="name"
                  className="auth-input"
                />
              </div>
            </div>

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
                  className="auth-input"
                />
              </div>
            </div>

            {/* Phone (WhatsApp) */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="phone" className="auth-label">
                  Numéro de téléphone (WhatsApp)
                </label>
                <span className="auth-hint-badge">Rapports & Alertes</span>
              </div>
              <div className="auth-input-wrap">
                <Phone size={17} className="auth-input-icon" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+33 6 ... ou +212 6 ..."
                  className="auth-input"
                />
              </div>
            </div>

            {/* Two columns: Country & Language */}
            <div className="auth-fields-row">
              <div className="auth-field">
                <label htmlFor="country" className="auth-label">
                  Pays de résidence
                </label>
                <div className="auth-input-wrap">
                  <Globe size={17} className="auth-input-icon" />
                  <select id="country" name="country" required className="auth-select" defaultValue="FR">
                    <option value="" disabled>Sélectionnez un pays</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="language" className="auth-label">
                  Langue préférée
                </label>
                <div className="auth-input-wrap">
                  <Languages size={17} className="auth-input-icon" />
                  <select id="language" name="language" defaultValue="fr" className="auth-select">
                    <option value="fr">Français 🇫🇷</option>
                    <option value="en">English 🇬🇧</option>
                    <option value="ar">العربية 🇲🇦</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Mot de passe
              </label>
              <div className="auth-input-wrap">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input has-action"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password checklist */}
              <div className="auth-password-checklist">
                <span className={`checklist-item ${isPasswordLongEnough ? 'valid' : ''}`}>
                  <span className="checklist-bullet">{isPasswordLongEnough ? '✓' : '○'}</span>
                  <span>Au moins 8 caractères</span>
                </span>
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
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  <span>Créer mon compte propriétaire</span>
                  <ArrowRight size={15} style={{ marginInlineStart: 'auto' }} />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="auth-card-footer">
            <p className="auth-switch-text">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="auth-switch-link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Privacy */}
      <div className="auth-trust-strip">
        <div className="auth-trust-item">
          <ShieldCheck size={14} className="auth-trust-icon" />
          <span>Données isolées par propriétaire</span>
        </div>
        <div className="auth-trust-item">
          <span className="auth-trust-dot" />
          <span>Vérification d&apos;identité sécurisée</span>
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
