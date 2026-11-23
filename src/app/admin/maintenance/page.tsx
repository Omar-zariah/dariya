import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { createQuote, assignProvider, advanceRequest, createExpense, recordRent } from '@/actions/data';
import { Wrench, Banknote, Receipt } from 'lucide-react';

export default async function AdminMaintenance({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const [{ data: properties }, { data: requests }, { data: quotes }, { data: providers }] = await Promise.all([
    db.from('properties').select('id,name'),
    db.from('maintenance_requests').select('id,title,status,priority,property_id,created_at').order('created_at', { ascending: false }),
    db.from('maintenance_quotes').select('id,request_id,amount,scope,status'),
    db.from('service_providers').select('id,business_name,verified').eq('verified', true),
  ]);

  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>MAINTENANCE</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wrench size={22} style={{ color: '#3B82F6' }} /> Gestion de la maintenance
          </h1>
          <p className="muted">Coordonnez toutes les interventions et prestataires.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* Maintenance queue */}
      <div className="two panel">
        <Card>
          <h2 className="section-title">Demandes en cours</h2>
          {(requests || []).filter(r => !['completed', 'closed', 'rejected'].includes(r.status)).map(r => {
            const rq = (quotes || []).filter(q => q.request_id === r.id);
            return (
              <div key={r.id} className="list-item">
                <div className="row"><b>{r.title}</b><Status value={r.status} /></div>
                <p className="muted small">{propName(r.property_id)} · {r.priority} · {dateText(r.created_at, lang)}</p>
                {rq.map(q => <p key={q.id} className="small">Devis {money(Number(q.amount), lang)} · <Status value={q.status} /></p>)}
                <div className="form-actions" style={{ marginTop: 8 }}>
                  {r.status === 'submitted' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="reviewed" />
                      <button className="btn light" style={{ fontSize: 12 }}>Marquer révisé</button>
                    </form>
                  )}
                  {r.status === 'approved' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="in_progress" />
                      <button className="btn light" style={{ fontSize: 12 }}>Démarrer</button>
                    </form>
                  )}
                  {r.status === 'in_progress' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="completed" />
                      <button className="btn" style={{ fontSize: 12 }}>Marquer terminé</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          {!(requests || []).some(r => !['completed', 'closed', 'rejected'].includes(r.status)) && <Empty />}
        </Card>

        {/* Assign provider */}
        <Card>
          <h2 className="section-title">Assigner un prestataire</h2>
          <form action={assignProvider} className="stack">
            <Field name="request_id" label="Demande" required>
              <option value="">Choisir</option>
              {(requests || []).map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </Field>
            <Field name="provider_id" label="Prestataire vérifié" required>
              <option value="">Choisir</option>
              {(providers || []).map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
            </Field>
            <button className="btn">Assigner</button>
          </form>
        </Card>
      </div>

      {/* Quote + Expense + Rent */}
      <div className="two panel">
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={16} /> Créer un devis
          </h2>
          <form action={createQuote} className="stack">
            <Field name="request_id" label="Demande" required>
              <option value="">Sélectionner</option>
              {(requests || []).filter(r => ['submitted', 'reviewed', 'quoted'].includes(r.status)).map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </Field>
            <Field name="provider_id" label="Prestataire">
              <option value="">DARIYA opérations</option>
              {(providers || []).map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
            </Field>
            <Field name="amount" label="Montant (MAD)" type="number" min={0} step="0.01" required />
            <Field name="scope" label="Description des travaux" required />
            <button className="btn">Envoyer le devis</button>
          </form>
        </Card>
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Banknote size={16} /> Enregistrer un loyer
          </h2>
          <form action={recordRent} className="stack">
            <Field name="property_id" label="Propriété" required>
              <option value="">Sélectionner</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Field>
            <Field name="amount" label="Montant (MAD)" type="number" step="0.01" min={0} required />
            <Field name="date" label="Date de réception" type="date" required />
            <Field name="reference" label="Référence / reçu" />
            <button className="btn">Enregistrer</button>
          </form>
        </Card>
      </div>

      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={16} /> Enregistrer une dépense
        </h2>
        <form action={createExpense} className="fields">
          <Field name="property_id" label="Propriété" required>
            <option value="">Sélectionner</option>
            {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Field>
          <Field name="category" label="Catégorie">
            <option value="maintenance">Maintenance</option>
            <option value="utility">Utilitaire</option>
            <option value="fee">Frais</option>
            <option value="cleaning">Nettoyage</option>
            <option value="other">Autre</option>
          </Field>
          <Field name="amount" label="Montant (MAD)" type="number" step="0.01" min={0} required />
          <Field name="date" label="Date" type="date" required />
          <Field name="note" label="Référence facture" />
          <div><button className="btn">Enregistrer la dépense</button></div>
        </form>
      </Card>
    </>
  );
}
