'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer, configured } from '@/lib/supabase/server';
import { currentUser, roleHome, Role } from '@/lib/auth';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';

const get = (data: FormData, key: string) => String(data.get(key) || '').trim();
const authError = (message: string) => '/login?error=' + encodeURIComponent(message.slice(0, 180));

const DEV_ACCOUNTS: Record<string, { id: string; role: Role; full_name: string }> = {
  'omarzaryah@gmail.com': {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'owner',
    full_name: 'Omar Benjelloun (Propriétaire)'
  },
  'owner@dariya.ma': {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'owner',
    full_name: 'Omar Benjelloun (Propriétaire)'
  },
  'omarzariah.dev@gmail.com': {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'admin',
    full_name: 'Omar Admin (Superviseur Tanger)'
  },
  'admin@dariya.ma': {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'admin',
    full_name: 'Omar Admin (Superviseur Tanger)'
  },
  'agent@dariya.ma': {
    id: '33333333-3333-3333-3333-333333333333',
    role: 'agent',
    full_name: 'Karim Tazi (Inspecteur Terrain)'
  },
  'provider@dariya.ma': {
    id: '44444444-4444-4444-4444-444444444444',
    role: 'provider',
    full_name: 'Hassan Artisans SARL (Prestataire)'
  }
};

async function setDevSession(email: string, targetRole?: Role, fullName?: string) {
  const norm = email.toLowerCase();
  const known = DEV_ACCOUNTS[norm];
  const role: Role = targetRole || known?.role || 'owner';
  const name = fullName || known?.full_name || email.split('@')[0];
  const id = known?.id || crypto.randomUUID();

  const jar = await cookies();
  jar.set('dariya_dev_session', JSON.stringify({
    id,
    email: norm,
    role,
    full_name: name
  }), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return role;
}

export async function quickLogin(data?: FormData) {
  const targetEmail = (data ? get(data, 'email') : '') || 'omarzaryah@gmail.com';
  const norm = targetEmail.toLowerCase();
  const known = DEV_ACCOUNTS[norm];

  // ── FAST PATH: known dev account → skip ALL Supabase network calls ────────
  if (known) {
    const role = await setDevSession(targetEmail, known.role, known.full_name);
    redirect(roleHome(role));
  }

  // ── LIVE PATH: unknown email → try real Supabase ──────────────────────────
  const defaultPassword = '1Billion$code0';
  if (configured()) {
    try {
      const db = await supabaseServer();
      const { error } = await db.auth.signInWithPassword({
        email: targetEmail,
        password: defaultPassword
      });

      if (!error) {
        const jar = await cookies();
        jar.delete('dariya_dev_session');
        const { data: { user: u2 } } = await db.auth.getUser();
        const { data: prof2 } = u2 ? await db.from('profiles').select('role').eq('id', u2.id).maybeSingle() : { data: null };
        redirect(roleHome(prof2?.role ?? 'owner'));
      }
    } catch {
      // Supabase is offline / unreachable
    }
  }

  // Fallback: Immediate local dev session
  const role = await setDevSession(targetEmail, (known as any)?.role, (known as any)?.full_name);
  redirect(roleHome(role));
}

export async function login(data: FormData) {
  const emailInput = get(data, 'email');
  const passwordInput = get(data, 'password');

  const valid = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }).safeParse({
    email: emailInput,
    password: passwordInput
  });

  if (!valid.success) {
    redirect(authError('Veuillez saisir une adresse e-mail valide et votre mot de passe.'));
  }

  const { email, password } = valid.data;
  const norm = email.toLowerCase();
  const known = DEV_ACCOUNTS[norm];

  // ── FAST PATH: known dev account with known test password ─────────────────
  // Skip ALL Supabase network calls; set cookie immediately → <10ms login
  const isTestPassword = password === '1Billion$code0' || password === 'Dariya2026!';
  if (known && isTestPassword) {
    const role = await setDevSession(email, known.role, known.full_name);
    redirect(roleHome(role));
  }

  // ── LIVE PATH: try real Supabase if configured and not a known dev account ──
  if (configured()) {
    try {
      const db = await supabaseServer();
      const { error } = await db.auth.signInWithPassword({ email, password });

      if (!error) {
        const jar = await cookies();
        jar.delete('dariya_dev_session');
        const { data: { user: uR } } = await db.auth.getUser();
        const { data: profR } = uR ? await db.from('profiles').select('role').eq('id', uR.id).maybeSingle() : { data: null };
        redirect(roleHome(profR?.role ?? 'owner'));
      }
    } catch {
      // Supabase cloud is unreachable (ENOTFOUND, network failure)
      // Fall through to dev fallback below
    }
  }

  // ── DEV FALLBACK: any test password on unknown email ─────────────────────
  if (isTestPassword || !configured()) {
    const role = await setDevSession(email, known?.role, known?.full_name);
    redirect(roleHome(role));
  }

  redirect(authError('Adresse e-mail ou mot de passe incorrect (ou serveur Supabase distant non joignable).'));
}

export async function signup(data: FormData) {
  const schema = z.object({
    full_name: z.string().min(2, 'Le nom complet doit comporter au moins 2 caractères.'),
    email: z.string().email('Adresse e-mail invalide.'),
    password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères.'),
    phone: z.string().max(40).optional().default(''),
    country: z.string().min(2, 'Veuillez préciser votre pays de résidence.'),
    language: z.enum(['fr', 'en', 'ar']).default('fr')
  });

  const parsed = schema.safeParse({
    full_name: get(data, 'full_name'),
    email: get(data, 'email'),
    password: get(data, 'password'),
    phone: get(data, 'phone'),
    country: get(data, 'country'),
    language: get(data, 'language') || 'fr'
  });

  if (!parsed.success) {
    const err = parsed.error.issues[0]?.message || 'Vérifiez les champs obligatoires (mot de passe 8+ car.).';
    redirect('/signup?error=' + encodeURIComponent(err));
  }

  const { email, password, full_name } = parsed.data;

  // Try live Supabase signup if configured
  if (configured()) {
    try {
      const db = await supabaseServer();
      const { data: signUpData, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: parsed.data,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (!error) {
        const admin = supabaseAdmin();
        if (admin && signUpData?.user?.id) {
          try {
            await admin.auth.admin.updateUserById(signUpData.user.id, { email_confirm: true });
          } catch { }
        }
        await db.auth.signInWithPassword({ email, password });
        redirect('/owner/dashboard?notice=' + encodeURIComponent('Bienvenue sur DARIYA ! Votre espace propriétaire est prêt.'));
      }
    } catch {
      // Supabase offline, fall through to dev session
    }
  }

  // Dev fallback session for signup
  await setDevSession(email, 'owner', full_name);
  redirect('/owner/dashboard?notice=' + encodeURIComponent('Compte créé en mode local ! Bienvenue sur DARIYA.'));
}

export async function logout() {
  try {
    const jar = await cookies();
    jar.delete('dariya_dev_session');
    if (configured()) {
      const db = await supabaseServer();
      await db.auth.signOut();
    }
  } catch {
    // Ignore sign out network errors
  }
  redirect('/');
}

export async function requestPasswordReset(data: FormData) {
  const email = get(data, 'email');
  if (!z.string().email().safeParse(email).success) {
    redirect('/forgot-password?error=Invalid%20email');
  }

  if (configured()) {
    try {
      const db = await supabaseServer();
      await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`
      });
    } catch { }
  }

  redirect('/forgot-password?notice=' + encodeURIComponent('Si le compte existe, un e-mail de réinitialisation a été envoyé.'));
}

export async function updatePassword(data: FormData) {
  const password = get(data, 'password');
  if (password.length < 8) redirect('/reset-password?error=Password%20too%20short');

  if (configured()) {
    try {
      const db = await supabaseServer();
      const { error } = await db.auth.updateUser({ password });
      if (error) redirect('/reset-password?error=' + encodeURIComponent(error.message));
    } catch { }
  }

  redirect('/owner/dashboard?notice=' + encodeURIComponent('Mot de passe mis à jour avec succès.'));
}

export async function updateProfile(data: FormData) {
  const { db, user, profile } = await currentUser();
  const parsed = z.object({
    full_name: z.string().min(2).max(100),
    phone: z.string().max(40),
    country: z.string().max(80)
  }).safeParse({
    full_name: get(data, 'full_name'),
    phone: get(data, 'phone'),
    country: get(data, 'country')
  });

  const base = roleHome(profile.role);
  if (!parsed.success) redirect(base.replace('/dashboard', '/settings') + '?error=Invalid%20fields');

  try {
    await db.from('profiles').update(parsed.data).eq('id', user.id);
  } catch { }

  // Update dev session cookie if active
  const jar = await cookies();
  const devCookie = jar.get('dariya_dev_session')?.value;
  if (devCookie) {
    try {
      const session = JSON.parse(devCookie);
      session.full_name = parsed.data.full_name;
      jar.set('dariya_dev_session', JSON.stringify(session), { path: '/', httpOnly: true, sameSite: 'lax' });
    } catch { }
  }

  redirect(base.replace('/dashboard', '/settings') + '?notice=Updated');
}
