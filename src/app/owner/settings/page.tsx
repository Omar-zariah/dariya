import { currentUser } from '@/lib/auth';
import { Card, Alert, Field, Status } from '@/components/ui';
import { updateProfile } from '@/actions/auth';
import { UserRound, Shield, CreditCard, Building } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerSettings({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { profile, user, db } = await currentUser();
  const params = await searchParams;

  const { data: sub } = await db
    .from('subscriptions')
    .select('id, plan_id, status, created_at, subscription_plans(name, monthly_mad, details)')
    .eq('owner_id', user.id)
    .maybeSingle();

  const plan = Array.isArray(sub?.subscription_plans) ? sub.subscription_plans[0] : sub?.subscription_plans;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>PROFIL & PARAMÈTRES</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserRound size={22} style={{ color: '#C87955' }} /> Mon compte & Abonnement
          </h1>
          <p className="muted">Gérez vos informations de contact, votre forfait DARIYA et vos préférences.</p>
        </div>
      </div>

      <Alert searchParams={params} />

      <div className="two panel" style={{ alignItems: 'flex-start' }}>
        {/* Profile info form */}
        <Card className="panel">
          <h2 className="section-title">Informations personnelles</h2>
          <form action={updateProfile} className="stack">
            <Field name="full_name" label="Nom complet" value={profile.full_name} required />
            <Field name="phone" label="Téléphone (WhatsApp)" value={profile.phone || ''} placeholder="+33 6..." />
            <Field name="country" label="Pays de résidence (MRE / Étranger)" value={profile.country || ''} placeholder="Ex: France, Belgique, Espagne..." />

            <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: '#6B7280' }}>
              <strong>Rôle de compte :</strong> Propriétaire (Owner) — Les privilèges administrateur et prestataire sont strictement assignés par DARIYA.
            </div>

            <div>
              <button className="btn" type="submit">Enregistrer les modifications</button>
            </div>
          </form>
        </Card>

        {/* Subscription & Payment details */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#C87955" /> Mon abonnement DARIYA
          </h2>

          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16, color: 'var(--ink)' }}>
                {plan?.name ? `Formule ${plan.name}` : 'Formule DARIYA Care'}
              </strong>
              <Status value={sub?.status || 'active'} />
            </div>
            <p className="small muted" style={{ marginTop: 6, lineHeight: 1.4 }}>
              {plan?.details || 'Accès plateforme, suivi technique, carnet de santé numérique, gestion des devis et inspections sur site à Tanger.'}
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              Coordonnées de règlement DARIYA Maroc
            </h3>
            <p className="small muted" style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
              Pour le règlement de votre abonnement ou l&apos;approvisionnement de votre compte de travaux, utilisez les canaux officiels ci-dessous :
            </p>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: 8, fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
              <strong>Banque :</strong> Attijariwafa Bank Tanger Grand Large<br />
              <strong>Bénéficiaire :</strong> DARIYA Property Care S.A.R.L.<br />
              <strong>RIB (24 chiffres) :</strong> 007 640 0001234567890123 45<br />
              <strong>SWIFT / BIC :</strong> BCMAMAMC<br />
              <strong>Agence physique :</strong> Bd Mohamed VI, Tanger, Maroc
            </div>

            <div style={{ marginTop: 12 }}>
              <Link href="/owner/finances" className="btn light" style={{ fontSize: 12.5, width: '100%', justifyContent: 'center' }}>
                <CreditCard size={14} /> Déclarer un virement effectué
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
