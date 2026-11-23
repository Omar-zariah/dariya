import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { addProperty } from '@/actions/data';
import { Plus } from 'lucide-react';

export default async function OwnerProperties({
  searchParams,
}: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const { data: properties } = await db
    .from('properties')
    .select('id,name,city,property_type,address,bedrooms,surface_m2,occupancy,status,created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>MES BIENS</div>
          <h1 className="heading">Gestion de mes propriétés</h1>
          <p className="muted">Vos biens immobiliers enregistrés à Tanger et au Maroc.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* Add Property Form */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: '#C87955' }} /> Ajouter un bien
        </h2>
        <form action={addProperty} className="fields">
          <Field name="name" label="Nom du bien" required placeholder="Ex: Appartement Marina Tanger" />
          <Field name="property_type" label="Type de bien">
            <option value="apartment">Appartement</option>
            <option value="house">Maison</option>
            <option value="villa">Villa</option>
            <option value="other">Autre</option>
          </Field>
          <Field name="city" label="Ville" required placeholder="Tanger" />
          <Field name="address" label="Adresse complète" required />
          <Field name="bedrooms" label="Chambres" type="number" min={0} />
          <Field name="surface_m2" label="Surface (m²)" type="number" min={0} />
          <div><button className="btn" type="submit">Enregistrer le bien</button></div>
        </form>
        <p className="footnote">Votre bien sera soumis à vérification avant activation. Cette procédure est réalisée hors-plateforme.</p>
      </Card>

      {/* Properties List */}
      <Card className="panel">
        <h2 className="section-title">Mes biens ({properties?.length ?? 0})</h2>
        {properties?.length ? (
          <div className="stack" style={{ gap: 12 }}>
            {properties.map(p => (
              <div key={p.id} className="list-item" style={{ padding: '16px 20px', borderRadius: 8 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Link href={`/owner/properties/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <b style={{ fontSize: 16, color: 'var(--ink)' }}>{p.name}</b>
                    </Link>
                    <p className="muted small" style={{ margin: '4px 0 0' }}>
                      {p.city} · {p.address} · {p.bedrooms} ch. · {p.surface_m2 ? `${p.surface_m2} m²` : '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Status value={p.occupancy} />
                    <Status value={p.status} />
                    <Link href={`/owner/properties/${p.id}`} className="btn light" style={{ fontSize: 13, padding: '6px 12px' }}>
                      Consulter →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="Aucun bien enregistré. Ajoutez votre premier logement ci-dessus." />
        )}
      </Card>
    </>
  );
}
