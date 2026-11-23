import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { addProvider, verifyProvider } from '@/actions/data';
import { UserCheck, Plus } from 'lucide-react';

export default async function AdminProviders({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const { data: providers } = await db
    .from('service_providers')
    .select('id,business_name,specialty,contact_phone,verified,created_at,profile_id')
    .order('created_at', { ascending: false });

  const verified = (providers || []).filter(p => p.verified);
  const unverified = (providers || []).filter(p => !p.verified);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>PRESTATAIRES</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={22} style={{ color: '#3B82F6' }} /> Gestion des prestataires
          </h1>
          <p className="muted">Enregistrez et vérifiez les prestataires de services locaux.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* Register new provider */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Enregistrer un prestataire
        </h2>
        <form action={addProvider} className="fields">
          <Field name="business_name" label="Nom de l'entreprise" required />
          <Field name="specialty" label="Spécialité" required placeholder="Ex: Plomberie, Électricité..." />
          <Field name="phone" label="Téléphone de contact" />
          <div><button className="btn">Enregistrer</button></div>
        </form>
        <p className="footnote">La vérification est opérationnelle (hors-plateforme). Cliquer sur Vérifier enregistre la décision uniquement.</p>
      </Card>

      {/* Pending verification */}
      {unverified.length > 0 && (
        <Card className="panel" style={{ borderLeft: '3px solid #F59E0B' }}>
          <h2 className="section-title" style={{ color: '#92400E' }}>En attente de vérification ({unverified.length})</h2>
          {unverified.map(p => (
            <div key={p.id} className="list-item row">
              <div>
                <b>{p.business_name}</b>
                <p className="muted small">{p.specialty} · {p.contact_phone || '—'}</p>
              </div>
              <form action={verifyProvider}>
                <input type="hidden" name="provider_id" value={p.id} />
                <button className="btn" style={{ background: '#10B981', borderColor: '#10B981', fontSize: 12 }}>Vérifier</button>
              </form>
            </div>
          ))}
        </Card>
      )}

      {/* Verified providers */}
      <Card className="panel">
        <h2 className="section-title">Prestataires vérifiés ({verified.length})</h2>
        {verified.length ? verified.map(p => (
          <div key={p.id} className="list-item row">
            <div>
              <b>{p.business_name}</b>
              <p className="muted small">{p.specialty} · {p.contact_phone || '—'}</p>
            </div>
            <Status value="verified" />
          </div>
        )) : <Empty message="Aucun prestataire vérifié." />}
      </Card>
    </>
  );
}
