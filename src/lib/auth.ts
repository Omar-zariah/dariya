import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';

export type Role = 'owner' | 'admin' | 'agent' | 'provider';

/** Canonical home URL for each role */
export function roleHome(role: Role | string): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'agent': return '/agent/dashboard';
    case 'provider': return '/provider/dashboard';
    default: return '/owner/dashboard';
  }
}

export async function currentUser() {
  // ── PRIORITY 1: check dev cookie BEFORE any network call ──────────────────
  // This avoids the ~1100ms Supabase timeout when the remote project is offline.
  const jar = await cookies();
  const devCookie = jar.get('dariya_dev_session')?.value;
  if (devCookie) {
    try {
      const parsed = JSON.parse(devCookie);
      if (parsed?.id && parsed?.role) {
        const profile = {
          id: parsed.id,
          full_name: parsed.full_name || parsed.email?.split('@')[0] || 'Utilisateur DARIYA',
          role: parsed.role as Role,
          language: parsed.language || 'fr',
          country: parsed.country || 'Maroc',
          phone: parsed.phone || '+212 600 000 000'
        };
        const devUser = {
          id: parsed.id,
          email: parsed.email || 'user@dariya.ma',
          user_metadata: { full_name: profile.full_name, role: profile.role }
        };
        // Create the db client lazily (no auth.getUser() call needed)
        const db = await supabaseServer();
        return {
          db,
          user: devUser,
          profile: profile as { id: string; full_name: string; role: Role; language: string; country: string | null; phone: string | null }
        };
      }
    } catch {
      // Invalid/corrupt dev cookie — fall through to live Supabase
    }
  }

  // ── PRIORITY 2: live Supabase auth ────────────────────────────────────────
  const db = await supabaseServer();
  let user: any = null;

  try {
    const { data } = await db.auth.getUser();
    user = data?.user;
  } catch {
    // Supabase remote service unreachable
    user = null;
  }

  if (!user) {
    redirect('/login');
  }

  // Live Supabase user profile resolution
  let profile = null;
  try {
    const res = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = res.data;
  } catch {
    profile = null;
  }

  if (!profile) {
    const meta = user.user_metadata || {};
    const fallbackRole = (meta.role && ['owner', 'admin', 'agent', 'provider'].includes(meta.role)) ? meta.role : 'owner';
    const lang = ['fr', 'en', 'ar'].includes(meta.language) ? meta.language : 'fr';
    try {
      const { data: created } = await db.from('profiles').upsert({
        id: user.id,
        full_name: meta.full_name || user.email?.split('@')[0] || 'Property Owner',
        phone: meta.phone || null,
        country: meta.country || null,
        language: lang,
        role: fallbackRole
      }).select('*').maybeSingle();
      if (created) profile = created;
    } catch {
      profile = {
        id: user.id,
        full_name: meta.full_name || 'Utilisateur DARIYA',
        phone: null,
        country: null,
        language: lang,
        role: fallbackRole
      };
    }
  }

  if (!profile) {
    redirect('/login?error=' + encodeURIComponent('Could not load account profile. Please log in again.'));
  }

  return {
    db,
    user,
    profile: profile as { id: string; full_name: string; role: Role; language: string; country: string | null; phone: string | null }
  };
}

export async function requireRole(roles: Role[]) {
  const ctx = await currentUser();
  if (!roles.includes(ctx.profile.role)) redirect('/login?error=access');
  return ctx;
}
