import { currentUser } from '@/lib/auth';
import { Card, Alert, Field } from '@/components/ui';
import { updateProfile } from '@/actions/auth';
import { Settings, ShieldCheck, Server, Globe } from 'lucide-react';

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { profile } = await currentUser();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#2563EB' }}>CONFIGURATION</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={22} style={{ color: '#2563EB' }} /> Paramètres & Administration
          </h1>
          <p className="muted">Gérez vos informations de compte administrateur et visualisez l&apos;état du système.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <div className="grid-2">
        {/* Admin profile */}
        <Card className="panel">
          <h2 className="section-title">Profil Administrateur</h2>
          <form action={updateProfile} className="stack">
            <Field name="full_name" label="Nom complet" value={profile.full_name} required />
            <Field name="phone" label="Téléphone" />
            <Field name="country" label="Pays de résidence" value={profile.country || 'Maroc'} />
            <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
              <strong>Rôle de sécurité :</strong> Administrateur système (Accès complet)
            </div>
            <div><button className="btn">Mettre à jour le profil</button></div>
          </form>
        </Card>

        {/* System & Platform status */}
        <div className="stack" style={{ gap: 20 }}>
          <Card className="panel">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#2563EB" /> Sécurité & Conformité
            </h2>
            <div className="stack small muted" style={{ gap: 10, lineHeight: 1.5 }}>
              <div>• <strong>Isolation multi-tenant :</strong> RLS activé et vérifié au niveau PostgreSQL.</div>
              <div>• <strong>Authentification :</strong> Supabase Auth avec sessions sécurisées côté serveur.</div>
              <div>• <strong>Vérification d&apos;identité :</strong> Requis avant activation des mandats de gestion.</div>
              <div>• <strong>Chiffrement :</strong> Toutes les pièces justificatives sont chiffrées au repos dans Supabase Storage.</div>
            </div>
          </Card>

          <Card className="panel">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={18} color="#2563EB" /> Informations Plateforme
            </h2>
            <div className="stack small muted" style={{ gap: 10, lineHeight: 1.5 }}>
              <div>• <strong>Application :</strong> DARIYA Property Management v1.0.0</div>
              <div>• <strong>Périmètre géographique :</strong> Tanger et région Nord (Maroc)</div>
              <div>• <strong>Devise de référence :</strong> Dirham Marocain (MAD)</div>
              <div>• <strong>Langues actives :</strong> Français (défaut), Arabe (RTL), Anglais</div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
