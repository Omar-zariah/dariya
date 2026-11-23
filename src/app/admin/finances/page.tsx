import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Field, Status } from '@/components/ui';
import { setSubscription, setPlanPrice, addTenant, addContract, recordRent, createExpense, verifyManualPayment, recordUtilityBill } from '@/actions/data';
import { Wallet, FileText, Users, TrendingUp, TrendingDown, Plus, CreditCard, CheckCircle2, XCircle, Zap, ShieldAlert } from 'lucide-react';

export default async function AdminFinances({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const [{ data: payments }, { data: expenses }, { data: properties }, { data: owners }, { data: plans }, { data: tenants }, { data: manualPayments }, { data: utilityBills }] = await Promise.all([
    db.from('rent_payments').select('id,property_id,amount,received_on,reference').order('received_on', { ascending: false }).limit(30),
    db.from('expenses').select('id,property_id,amount,category,incurred_on,note').order('incurred_on', { ascending: false }).limit(30),
    db.from('properties').select('id,name,owner_id'),
    db.from('profiles').select('id,full_name,phone').eq('role', 'owner'),
    db.from('subscription_plans').select('*'),
    db.from('tenants').select('id,full_name,property_id'),
    db.from('manual_payments').select('id, amount, method, status, payment_type, reference_code, notes, created_at, owner_id, property_id, subscription_id').order('created_at', { ascending: false }),
    db.from('utility_bills').select('id, property_id, period_month, category, amount, reference, note, created_at').order('created_at', { ascending: false }).limit(30),
  ]);

  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';
  const ownerName = (id: string) => (owners || []).find(o => o.id === id)?.full_name || id;
  const totalIncome = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const net = totalIncome - totalExpense;

  const pendingPayments = (manualPayments || []).filter(p => p.status === 'pending');

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>FINANCES & FACTURATION</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={22} style={{ color: '#3B82F6' }} /> Trésorerie & Abonnements
          </h1>
          <p className="muted">Rapprochement bancaire, encaissements de loyers, dépenses et gestion des forfaits.</p>
        </div>
      </div>
      <Alert searchParams={params} />

      {/* Summary KPI */}
      <div className="gridcards panel">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', marginBottom: 12 }}>
            <TrendingUp size={15} /><span className="muted small" style={{ fontWeight: 700 }}>LOYERS TOTAUX ENCAISSÉS</span>
          </div>
          <div className="stats-number" style={{ color: '#10B981' }}>{money(totalIncome, lang)}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', marginBottom: 12 }}>
            <TrendingDown size={15} /><span className="muted small" style={{ fontWeight: 700 }}>DÉPENSES & FACTURES</span>
          </div>
          <div className="stats-number" style={{ color: '#EF4444' }}>{money(totalExpense, lang)}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: net >= 0 ? '#10B981' : '#EF4444', marginBottom: 12 }}>
            <Wallet size={15} /><span className="muted small" style={{ fontWeight: 700 }}>SOLDE NET EN COMPTE</span>
          </div>
          <div className="stats-number" style={{ color: net >= 0 ? '#10B981' : '#EF4444' }}>{money(net, lang)}</div>
        </Card>
      </div>

      {/* Pending Manual Payments Reconciliation Queue */}
      {pendingPayments.length > 0 && (
        <Card className="panel" style={{ borderLeft: '3px solid #F59E0B' }}>
          <h2 className="section-title" style={{ color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} color="#F59E0B" /> Règlements déclarés à rapprocher ({pendingPayments.length})
          </h2>
          <p className="small muted" style={{ marginTop: 2, marginBottom: 12 }}>
            Vérifiez l&apos;encaissement réel sur le compte bancaire DARIYA ou en agence Tanger avant de confirmer.
          </p>

          <div className="stack" style={{ gap: 10 }}>
            {pendingPayments.map(mp => (
              <div key={mp.id} className="list-item" style={{ padding: '14px 16px', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong style={{ fontSize: 16, color: '#92400E' }}>{money(Number(mp.amount), lang)}</strong>
                    <div className="small muted" style={{ marginTop: 2 }}>
                      Propriétaire : <b>{ownerName(mp.owner_id)}</b> · Bien : {propName(mp.property_id)}
                    </div>
                    <div className="small muted">
                      Mode : <b>{mp.method}</b> · Objet : {mp.payment_type} · Réf : {mp.reference_code || 'N/A'}
                    </div>
                    {mp.notes && <div className="footnote muted" style={{ marginTop: 4 }}>Note client : {mp.notes}</div>}
                    <div className="footnote muted">Déclaré le {dateText(mp.created_at, lang)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <form action={verifyManualPayment}>
                      <input type="hidden" name="payment_id" value={mp.id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <button className="btn" style={{ background: '#10B981', borderColor: '#059669', fontSize: 12.5, padding: '6px 12px' }}>
                        ✓ Confirmer réception
                      </button>
                    </form>
                    <form action={verifyManualPayment}>
                      <input type="hidden" name="payment_id" value={mp.id} />
                      <input type="hidden" name="status" value="failed" />
                      <button className="btn light" style={{ fontSize: 12.5, padding: '6px 12px', color: '#DC2626', borderColor: '#FCA5A5' }}>
                        ✕ Rejeter
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Record rent & expense */}
      <div className="two panel">
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} color="#10B981" /> Enregistrer un loyer encaissé
          </h2>
          <form action={recordRent} className="stack">
            <Field name="property_id" label="Propriété" required>
              <option value="">Sélectionner</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name} ({ownerName(p.owner_id)})</option>)}
            </Field>
            <Field name="amount" label="Montant reçu (MAD)" type="number" min={1} step="0.01" required />
            <Field name="date" label="Date de réception" type="date" required />
            <Field name="reference" label="Référence (virement, chèque…)" placeholder="ex: CHQ-2026-011" />
            <button className="btn" style={{ background: '#10B981', borderColor: '#059669' }}>Enregistrer le loyer</button>
          </form>
        </Card>

        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} color="#EF4444" /> Enregistrer une dépense
          </h2>
          <form action={createExpense} className="stack">
            <Field name="property_id" label="Propriété" required>
              <option value="">Sélectionner</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Field>
            <Field name="category" label="Catégorie">
              <option value="maintenance">Maintenance / Travaux</option>
              <option value="utility">Facture utilité</option>
              <option value="fee">Frais de gestion</option>
              <option value="cleaning">Nettoyage</option>
              <option value="other">Autre</option>
            </Field>
            <Field name="amount" label="Montant (MAD)" type="number" min={0} step="0.01" required />
            <Field name="date" label="Date de la dépense" type="date" required />
            <Field name="note" label="Note / Description" placeholder="ex: Remplacement chauffe-eau…" />
            <button className="btn" style={{ background: '#EF4444', borderColor: '#DC2626' }}>Enregistrer la dépense</button>
          </form>
        </Card>
      </div>

      {/* Record Utility Bill (Amendis / Syndic) */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="#F59E0B" /> Enregistrer une facture de fluides ou charges de copropriété
        </h2>
        <form action={recordUtilityBill} className="fields">
          <Field name="property_id" label="Bien concerné" required>
            <option value="">Sélectionner</option>
            {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Field>
          <Field name="period_month" label="Mois facturé (YYYY-MM)" placeholder="2026-11" required />
          <Field name="category" label="Prestation">
            <option value="electricity">Électricité (Amendis)</option>
            <option value="water">Eau potable (Amendis)</option>
            <option value="syndic">Charges de copropriété / Syndic</option>
            <option value="gas">Gaz</option>
            <option value="internet">Internet / Télécom</option>
            <option value="other">Autre charge</option>
          </Field>
          <Field name="amount" label="Montant (MAD)" type="number" min={0} step="0.01" required />
          <Field name="reference" label="N° Police / Compteur / Quittance" placeholder="Ex: POLICE-84912" />
          <Field name="note" label="Observations" placeholder="Index relevé, période de consommation..." />
          <div>
            <button className="btn" style={{ background: '#F59E0B', borderColor: '#D97706' }}>
              Enregistrer la facture de charges
            </button>
          </div>
        </form>
        <p className="footnote" style={{ marginTop: 8 }}>
          ✦ Rappel : Les factures de fluides constituent un suivi comptable opérationnel et ne valent pas titre de propriété foncière.
        </p>
      </Card>

      {/* Recent transactions */}
      <div className="two panel">
        <Card>
          <h2 className="section-title">Loyers reçus (30 derniers)</h2>
          {payments?.length ? payments.map(p => (
            <div key={p.id} className="list-item row">
              <div>
                <b style={{ fontSize: 14, color: '#10B981' }}>{money(Number(p.amount), lang)}</b>
                <p className="muted small">{propName(p.property_id)} · {dateText(p.received_on, lang)}</p>
                {p.reference && <p className="footnote">Réf: {p.reference}</p>}
              </div>
            </div>
          )) : <Empty message="Aucun loyer enregistré." />}
        </Card>
        <Card>
          <h2 className="section-title">Dépenses (30 dernières)</h2>
          {expenses?.length ? expenses.map(e => (
            <div key={e.id} className="list-item row">
              <div>
                <b style={{ fontSize: 14, color: '#EF4444' }}>{money(Number(e.amount), lang)}</b>
                <p className="muted small">{propName(e.property_id)} · {e.category} · {dateText(e.incurred_on, lang)}</p>
                {e.note && <p className="footnote">{e.note}</p>}
              </div>
            </div>
          )) : <Empty message="Aucune dépense enregistrée." />}
        </Card>
      </div>

      {/* Subscription pricing config */}
      <Card className="panel">
        <h2 className="section-title">Configuration des tarifs</h2>
        <div className="three">
          {(plans || []).map(p => (
            <form action={setPlanPrice} key={p.id} className="stack">
              <input type="hidden" name="plan_id" value={p.id} />
              <b>{p.name}</b>
              <Field name="price" label={p.id === 'full' ? '% des loyers perçus' : 'MAD par mois'} type="number" min={1} step="0.01"
                value={p.id === 'full' ? p.percent_of_collected_rent : p.monthly_mad} />
              <button className="btn light">Mettre à jour</button>
            </form>
          ))}
        </div>
      </Card>

      {/* Plan proposal */}
      <div className="two panel">
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Proposer un abonnement
          </h2>
          <form action={setSubscription} className="stack">
            <Field name="owner_id" label="Propriétaire" required>
              <option value="">Sélectionner</option>
              {(owners || []).map(o => <option key={o.id} value={o.id}>{o.full_name || o.id}</option>)}
            </Field>
            <Field name="property_id" label="Propriété" required>
              <option value="">Sélectionner</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name} ({ownerName(p.owner_id)})</option>)}
            </Field>
            <Field name="plan_id" label="Plan">
              <option value="basic">Basic</option>
              <option value="care">Care</option>
              <option value="full">Full management</option>
            </Field>
            <button className="btn">Créer la proposition</button>
          </form>
        </Card>

        {/* Add tenant */}
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} /> Enregistrer un locataire
          </h2>
          <form action={addTenant} className="stack">
            <Field name="property_id" label="Propriété" required>
              <option value="">Sélectionner</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Field>
            <Field name="full_name" label="Nom complet" required />
            <Field name="email" label="Email" />
            <Field name="phone" label="Téléphone" />
            <button className="btn">Enregistrer</button>
          </form>
        </Card>
      </div>

      {/* Contract */}
      <Card className="panel">
        <h2 className="section-title">Enregistrer un contrat de location</h2>
        <form action={addContract} className="fields">
          <Field name="property_id" label="Propriété" required>
            <option value="">Sélectionner</option>
            {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Field>
          <Field name="tenant_id" label="Locataire" required>
            <option value="">Sélectionner</option>
            {(tenants || []).map(t => <option key={t.id} value={t.id}>{t.full_name} — {propName(t.property_id)}</option>)}
          </Field>
          <Field name="start_date" label="Date de début" type="date" required />
          <Field name="monthly_rent" label="Loyer mensuel (MAD)" type="number" min={0} step="0.01" required />
          <div><button className="btn">Enregistrer le contrat</button></div>
        </form>
        <p className="footnote">Ceci est un enregistrement de données opérationnelles, pas un acte notarié officiel.</p>
      </Card>
    </>
  );
}
