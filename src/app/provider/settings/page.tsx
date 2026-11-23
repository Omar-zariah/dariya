import { currentUser } from '@/lib/auth';
import { Card, Alert, Field } from '@/components/ui';
import { updateProfile } from '@/actions/auth';
import { UserRound, Wrench, ShieldCheck, BadgeCheck } from 'lucide-react';

export default async function ProviderSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db, profile } = await currentUser();

  const { data: sp } = await db
    .from('service_providers')
    .select('id, business_name, specialty, contact_phone, verified, rating')
    .eq('profile_id', user.id)
    .maybeSingle();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#D97706' }}>PROFIL ARTISAN</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserRound size={22} style={{ color: '#D97706' }} /> Paramètres & Informations Artisan
          </h1>
          <p className="muted">Gérez les coordonnées de votre entreprise et consultez votre statut de référencement.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <div className="grid-2">
        {/* Personal profile */}
        <Card className="panel">
          <h2 className="section-title">Coordonnées du responsable</h2>
          <form action={updateProfile} className="stack">
            <Field name="full_name" label="Nom du gérant / contact" value={profile.full_name} required />
            <Field name="phone" label="Téléphone mobile" value={profile.phone || ''} required placeholder="+212 6..." />
            <Field name="country" label="Ville d'établissement" value={profile.country || 'Tanger, Maroc'} />
            <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
              <strong>Statut de compte :</strong> Prestataire technique agréé DARIYA
            </div>
            <div><button className="btn" style={{ background: '#D97706', borderColor: '#B45309' }}>Enregistrer mes coordonnées</button></div>
          </form>
        </Card>

        {/* Business and accreditation info */}
        <div className="stack" style={{ gap: 20 }}>
          <Card className="panel">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BadgeCheck size={18} color={sp?.verified ? '#10B981' : '#F59E0B'} /> Fiche Entreprise & Agréments
            </h2>
            <div className="stack small" style={{ gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <strong>Nom commercial :</strong> {sp?.business_name || profile.full_name || 'En cours d\'enregistrement'}
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <strong>Corps d&apos;état / Spécialité :</strong> {sp?.specialty || 'Plomberie, Électricité, Serrurerie, Peinture'}
              </div>
              <div style={{ padding: 12, background: sp?.verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 8, color: sp?.verified ? '#065F46' : '#B45309' }}>
                <strong>Vérification DARIYA :</strong> {sp?.verified ? '✓ Partenaire Qualifié & Vérifié (Assurance RC Pro active)' : '⏳ Dossier en cours de revue réglementaire'}
              </div>
            </div>
          </Card>

          <Card className="panel">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#D97706" /> Charte de Qualité DARIYA
            </h2>
            <div className="small muted stack" style={{ gap: 8, lineHeight: 1.5 }}>
              <div>• Transparence totale des tarifs et devis détaillés avant intervention.</div>
              <div>• Respect des délais convenus avec les propriétaires et locataires.</div>
              <div>• Nettoyage systématique des lieux après réalisation des travaux.</div>
              <div>• Garantie de parfait achèvement sur toutes les réparations.</div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
