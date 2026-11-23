import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText, money } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { createMaintenance, decideQuote, advanceRequest } from '@/actions/data';
import { Wrench, Plus, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

export default async function OwnerMaintenance({
  searchParams,
}: { searchParams: Promise<{ error?: string; notice?: string; property_id?: string }> }) {
  const { db, user } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const [{ data: properties }, { data: requests }, { data: quotes }] = await Promise.all([
    db.from('properties').select('id, name, city').order('name'),
    db.from('maintenance_requests')
      .select('id, title, status, priority, category, description, created_at, property_id')
      .order('created_at', { ascending: false }),
    db.from('maintenance_quotes').select('id, request_id, amount, labor_amount, materials_amount, tax_amount, coordination_fee_mad, exclusions, valid_until, scope, status, provider_id, created_at, service_providers(business_name, specialty)'),
  ]);

  const open = (requests || []).filter(r => !['completed', 'closed', 'rejected'].includes(r.status));
  const completed = (requests || []).filter(r => r.status === 'completed');
  const closed = (requests || []).filter(r => ['closed', 'rejected'].includes(r.status));

  const steps = [
    { key: 'submitted', label: 'Signalée' },
    { key: 'reviewed', label: 'Analysée' },
    { key: 'quoted', label: 'Devis émis' },
    { key: 'approved', label: 'Approuvée' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'completed', label: 'Terminée' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'submitted': return 1;
      case 'reviewed': return 2;
      case 'quoted': return 3;
      case 'approved': return 4;
      case 'in_progress': return 5;
      case 'completed': return 6;
      case 'closed': return 6;
      default: return 1;
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>MAINTENANCE & TRAVAUX</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wrench size={22} style={{ color: '#C87955' }} /> Demandes de maintenance
          </h1>
          <p className="muted">
            Signalez un dysfonctionnement, approuvez les devis de nos artisans vérifiés et suivez les réparations.
          </p>
        </div>
      </div>

      <Alert searchParams={params} />

      {/* New request form */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} style={{ color: '#C87955' }} /> Signaler un problème sur un bien
        </h2>
        <form action={createMaintenance} className="fields">
          <Field name="property_id" label="Bien concerné" required>
            <option value="">Sélectionner une propriété</option>
            {(properties || []).map(p => (
              <option key={p.id} value={p.id} selected={p.id === params.property_id}>
                {p.name} ({p.city})
              </option>
            ))}
          </Field>
          <Field name="title" label="Résumé du problème" required placeholder="Ex: Fuite sous évier cuisine, panne climatiseur salon..." />
          <Field name="category" label="Catégorie d'intervention">
            <option value="plumbing">Plomberie & Sanitaire</option>
            <option value="electrical">Électricité & Éclairage</option>
            <option value="aircon">Climatisation & Chauffage</option>
            <option value="painting">Peinture & Murs</option>
            <option value="cleaning">Nettoyage approfondi</option>
            <option value="locks">Serrurerie & Menuiserie</option>
            <option value="other">Autre intervention</option>
          </Field>
          <Field name="priority" label="Niveau d'urgence">
            <option value="normal">Normal (Sous 48-72h)</option>
            <option value="urgent">Urgent (Intervention prioritaire)</option>
            <option value="low">Faible (Entretien préventif)</option>
          </Field>
          <Field name="description" label="Description détaillée" required placeholder="Précisez la pièce, les symptômes observés, les consignes d'accès..." />
          <div>
            <button className="btn" type="submit">
              <Wrench size={14} /> Envoyer la demande à DARIYA
            </button>
          </div>
        </form>
      </Card>

      {/* Open requests — with quote approval & progress */}
      <Card className="panel">
        <h2 className="section-title">Demandes actives ({open.length + completed.length})</h2>
        {[...open, ...completed].length ? [...open, ...completed].map(r => {
          const rq = (quotes || []).filter(q => q.request_id === r.id);
          const pendingQuotes = rq.filter(q => q.status === 'pending');
          const approvedQuote = rq.find(q => q.status === 'approved');
          const prop = (properties || []).find(p => p.id === r.property_id);
          const currentStep = getStepIndex(r.status);

          return (
            <div key={r.id} className="list-item" style={{ padding: '20px 22px', borderRadius: 10, background: 'var(--surface-2)', marginBottom: 14 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <b style={{ fontSize: 16, color: 'var(--ink)' }}>{r.title}</b>
                  <p className="muted small" style={{ margin: '4px 0 0' }}>
                    {prop?.name} ({prop?.city}) · Catégorie: <b>{r.category}</b> · Signalé le {dateText(r.created_at, lang)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Status value={r.priority} />
                  <Status value={r.status} />
                </div>
              </div>

              {/* Step indicator */}
              <div style={{ margin: '16px 0 12px', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {steps.map((st, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;
                  return (
                    <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 50,
                        fontSize: 11,
                        fontWeight: 600,
                        background: isCurrent ? '#C87955' : isDone ? '#10B98120' : 'var(--line)',
                        color: isCurrent ? '#FFF' : isDone ? '#059669' : 'var(--muted)',
                      }}>
                        <span>{stepNum}.</span> {st.label}
                      </div>
                      {idx < steps.length - 1 && <span style={{ color: 'var(--muted)', fontSize: 12 }}>→</span>}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 8, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5, margin: '8px 0' }}>
                {r.description}
              </div>

              {/* Approved quote display */}
              {approvedQuote && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46' }}>
                  ✓ <b>Devis validé : {money(Number(approvedQuote.amount), lang)}</b> · {approvedQuote.scope}
                </div>
              )}

              {/* Pending quotes awaiting owner approval */}
              {pendingQuotes.map(q => {
                const sp = Array.isArray(q.service_providers) ? q.service_providers[0] : q.service_providers;
                return (
                  <div key={q.id} style={{
                    marginTop: 12, padding: '16px 18px', background: '#FEF3E2',
                    borderRadius: 10, border: '1px solid #F59E0B66'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#92400E', fontSize: 15 }}>
                        ✦ Devis détaillé DARIYA — {money(Number(q.amount), lang)}
                      </p>
                      <span className="badge" style={{ background: '#F59E0B22', color: '#B45309', fontSize: 11 }}>
                        En attente de votre accord
                      </span>
                    </div>

                    {sp?.business_name && (
                      <div className="small muted" style={{ marginTop: 4 }}>
                        Artisan partenaire : <b>{sp.business_name}</b> ({sp.specialty || 'Spécialiste agréé'})
                      </div>
                    )}

                    <div style={{
                      margin: '10px 0',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 8,
                      border: '1px solid #FDE68A',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 8,
                      fontSize: 12.5,
                      color: '#78350F'
                    }}>
                      <div>Main d&apos;œuvre : <b>{money(Number(q.labor_amount || 0), lang)}</b></div>
                      <div>Fournitures & pièces : <b>{money(Number(q.materials_amount || 0), lang)}</b></div>
                      {q.coordination_fee_mad > 0 && <div>Coordination : <b>{money(Number(q.coordination_fee_mad), lang)}</b></div>}
                      {q.tax_amount > 0 && <div>Taxes/TVA : <b>{money(Number(q.tax_amount), lang)}</b></div>}
                      {q.valid_until && <div>Validité jusqu&apos;au : <b>{dateText(q.valid_until, lang)}</b></div>}
                    </div>

                    <p className="small" style={{ margin: '6px 0 6px', color: '#78350F', lineHeight: 1.5 }}>
                      <b>Prestations & fournitures incluses :</b> {q.scope}
                    </p>

                    {q.exclusions && (
                      <p className="small" style={{ margin: '4px 0 12px', color: '#991B1B', lineHeight: 1.4 }}>
                        <b>Exclusions explicites :</b> {q.exclusions}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <form action={decideQuote}>
                        <input type="hidden" name="quote_id" value={q.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button className="btn" style={{ background: '#10B981', borderColor: '#059669', fontSize: 12.5 }}>
                          <CheckCircle2 size={14} /> Valider le devis & Autoriser les travaux
                        </button>
                      </form>
                      <form action={decideQuote}>
                        <input type="hidden" name="quote_id" value={q.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button className="btn light" style={{ fontSize: 12.5 }}>
                          <XCircle size={14} /> Refuser le devis
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}

              {/* Close completed intervention */}
              {r.status === 'completed' && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <form action={advanceRequest}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <input type="hidden" name="next_status" value="closed" />
                    <button className="btn light" style={{ fontSize: 13, borderColor: '#10B981', color: '#059669' }}>
                      <CheckCircle2 size={14} /> Clôturer l&apos;intervention avec satisfaction
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        }) : (
          <Empty message="Aucune demande de maintenance active. Vos biens sont en parfait état." />
        )}
      </Card>

      {/* Closed requests */}
      {closed.length > 0 && (
        <Card className="panel">
          <h2 className="section-title">Historique des interventions clôturées ({closed.length})</h2>
          <div className="stack" style={{ gap: 8 }}>
            {closed.map(r => (
              <div key={r.id} className="list-item row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <b>{r.title}</b>
                  <div className="footnote muted">{dateText(r.created_at, lang)}</div>
                </div>
                <Status value={r.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
