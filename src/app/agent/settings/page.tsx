import { currentUser } from '@/lib/auth';
import { Card, Alert, Field } from '@/components/ui';
import { updateProfile } from '@/actions/auth';
import { UserRound, BadgeCheck, ShieldAlert } from 'lucide-react';

export default async function AgentSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { profile } = await currentUser();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#10B981' }}>COMPTE AGENT</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserRound size={22} style={{ color: '#10B981' }} /> Profil & Coordonnées Agent
          </h1>
          <p className="muted">Gérez vos informations de contact pour les propriétaires et prestataires.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <div className="grid-2">
        <Card className="panel">
          <h2 className="section-title">Coordonnées professionnelles</h2>
          <form action={updateProfile} className="stack">
            <Field name="full_name" label="Nom complet" value={profile.full_name} required />
            <Field name="phone" label="Téléphone portable direct" value={profile.phone || ''} required placeholder="+212 6..." />
            <Field name="country" label="Zone d'intervention" value={profile.country || 'Maroc (Tanger)'} />
            <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
              <strong>Rôle système :</strong> Agent de terrain DARIYA (Opérations locales)
            </div>
            <div><button className="btn" style={{ background: '#10B981', borderColor: '#059669' }}>Mettre à jour mes informations</button></div>
          </form>
        </Card>

        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BadgeCheck size={18} color="#10B981" /> Habilitations & Sécurité
          </h2>
          <div className="stack small muted" style={{ gap: 12, lineHeight: 1.5 }}>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <strong>Zone d&apos;attribution</strong>
              <p style={{ margin: '4px 0 0' }}>Tanger-Médina, Malabata, Marshan, Centre-ville, California, Achakar, Gzenaya.</p>
            </div>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <strong>Droits d&apos;accès</strong>
              <p style={{ margin: '4px 0 0' }}>Accès en lecture et saisie aux inspections assignées. Dépôt de preuves photographiques et constatations contradictoires.</p>
            </div>
            <div style={{ padding: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#DC2626' }}>
              <strong>Règle de neutralité</strong>
              <p style={{ margin: '4px 0 0' }}>L&apos;agent DARIYA agit en tiers de confiance objectif. Toutes les constatations doivent être appuyées par des photographies horodatées.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
