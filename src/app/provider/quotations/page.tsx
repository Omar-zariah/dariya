import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { createQuote } from '@/actions/data';
import { FileText, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default async function ProviderQuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; error?: string; notice?: string }>;
}) {
  const { user, db } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const { data: sp } = await db
    .from('service_providers')
    .select('id, business_name')
    .eq('profile_id', user.id)
    .maybeSingle();

  // Fetch assigned requests to allow quoting
  let assignedRequests: any[] = [];
  let quotes: any[] = [];

  if (sp) {
    const { data: assignments } = await db
      .from('service_assignments')
      .select('request_id, maintenance_requests(id, title, status, properties(name))')
      .eq('provider_id', sp.id);

    assignedRequests = (assignments ?? [])
      .map(a => a.maintenance_requests)
      .filter(Boolean);

    const { data: qData } = await db
      .from('maintenance_quotes')
      .select('id, amount, labor_amount, materials_amount, tax_amount, coordination_fee_mad, exclusions, valid_until, scope, status, created_at, request_id, maintenance_requests(title, properties(name))')
      .eq('provider_id', sp.id)
      .order('created_at', { ascending: false });

    quotes = qData ?? [];
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#D97706' }}>DEVIS & TARIFICATION</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ color: '#D97706' }} /> Devis & Chiffrages Travaux
          </h1>
          <p className="muted">Émettez vos propositions tarifaires pour validation par le propriétaire ou l&apos;équipe DARIYA.</p>
        </div>
      </div>

      <Alert searchParams={params} />

      <div className="grid-2">
        {/* New quote form */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={18} color="#D97706" /> Déposer un nouveau devis
          </h2>

          {assignedRequests.length > 0 ? (
            <form action={createQuote} className="stack">
              <label className="field">
                Intervention concernée
                <select
                  name="request_id"
                  defaultValue={params.request_id || assignedRequests[0]?.id}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'var(--surface)', fontSize: 14 }}
                >
                  {assignedRequests.map(r => {
                    const prop = Array.isArray(r.properties) ? r.properties[0] : r.properties;
                    return (
                      <option key={r.id} value={r.id}>
                        {r.title} ({prop?.name || 'Bien'})
                      </option>
                    );
                  })}
                </select>
              </label>

              <div className="grid-2" style={{ gap: 12 }}>
                <Field
                  name="labor_amount"
                  label="Main d'œuvre (MAD)"
                  type="number"
                  min={0}
                  step="10"
                  placeholder="Ex: 400"
                  required
                />
                <Field
                  name="materials_amount"
                  label="Fournitures & Pièces (MAD)"
                  type="number"
                  min={0}
                  step="10"
                  placeholder="Ex: 350"
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <Field
                  name="tax_amount"
                  label="Taxes / TVA éventuelle (MAD)"
                  type="number"
                  min={0}
                  step="5"
                  placeholder="Ex: 0"
                />
                <Field
                  name="coordination_fee_mad"
                  label="Frais déplacement & logistique (MAD)"
                  type="number"
                  min={0}
                  step="10"
                  placeholder="Ex: 100"
                />
              </div>

              <Field
                name="valid_until"
                label="Date de validité du devis"
                type="date"
              />

              <label className="field">
                Détail précis des prestations & fournitures incluses
                <textarea
                  name="scope"
                  rows={3}
                  required
                  placeholder="Détaillez les fournitures incluses, marques prévues, durée estimée de l'intervention..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'var(--surface)', fontSize: 14 }}
                />
              </label>

              <label className="field">
                Exclusions explicites du devis (ce qui n&apos;est pas compris)
                <textarea
                  name="exclusions"
                  rows={2}
                  placeholder="Ex: Peinture de finition non comprise, évacuation gravats lourds à la charge de la copropriété..."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'var(--surface)', fontSize: 14 }}
                />
              </label>

              <div>
                <button className="btn" style={{ background: '#D97706', borderColor: '#B45309' }}>
                  Transmettre le devis officiel
                </button>
              </div>
            </form>
          ) : (
            <Empty message="Vous n'avez pas encore d'intervention assignée pour laquelle émettre un devis." />
          )}
        </Card>

        {/* Existing quotes */}
        <Card className="panel">
          <h2 className="section-title">Historique de mes devis ({quotes.length})</h2>

          {quotes.length > 0 ? (
            <div className="stack" style={{ gap: 12 }}>
              {quotes.map(q => {
                const req = Array.isArray(q.maintenance_requests) ? q.maintenance_requests[0] : q.maintenance_requests;
                return (
                  <div key={q.id} className="list-item" style={{ padding: '12px 16px', borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{money(q.amount)}</strong>
                        <div className="small muted" style={{ marginTop: 2 }}>
                          {req?.title || 'Demande de travaux'}
                        </div>
                      </div>
                      <Status value={q.status} />
                    </div>
                    <div className="small" style={{ marginTop: 6, color: 'var(--text)', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 6 }}>
                      {q.scope}
                    </div>
                    {(q.labor_amount > 0 || q.materials_amount > 0) && (
                      <div className="small muted" style={{ marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>MO: <b>{money(q.labor_amount || 0)}</b></span>
                        <span>Fournitures: <b>{money(q.materials_amount || 0)}</b></span>
                        {q.coordination_fee_mad > 0 && <span>Logistique: <b>{money(q.coordination_fee_mad)}</b></span>}
                        {q.valid_until && <span>Validité: <b>{dateText(q.valid_until, lang)}</b></span>}
                      </div>
                    )}
                    {q.exclusions && (
                      <div className="small" style={{ marginTop: 4, color: '#991B1B', fontSize: 11.5 }}>
                        Exclusions : {q.exclusions}
                      </div>
                    )}
                    <div className="small muted" style={{ marginTop: 4 }}>
                      Émis le {dateText(q.created_at, lang)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="Aucun devis soumis pour le moment." />
          )}
        </Card>
      </div>
    </>
  );
}
