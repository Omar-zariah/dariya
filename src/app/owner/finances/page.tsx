import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Field, Status } from '@/components/ui';
import { TrendingUp, TrendingDown, Wallet, Download, CreditCard, PlusCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { recordManualPayment } from '@/actions/data';
import Link from 'next/link';

export default async function OwnerFinances({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db, user } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const [{ data: properties }, { data: payments }, { data: expenses }, { data: manualPayments }, { data: utilityBills }] = await Promise.all([
    db.from('properties').select('id,name').order('name'),
    db.from('rent_payments').select('id,property_id,amount,received_on,reference').order('received_on', { ascending: false }),
    db.from('expenses').select('id,property_id,amount,category,incurred_on,note').order('incurred_on', { ascending: false }),
    db.from('manual_payments').select('id, amount, method, status, payment_type, reference_code, notes, created_at, property_id').eq('owner_id', user.id).order('created_at', { ascending: false }),
    db.from('utility_bills').select('id, property_id, period_month, category, amount, reference, note, created_at').order('created_at', { ascending: false }),
  ]);

  const totalIncome = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const net = totalIncome - totalExpense;
  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';

  // Group by month (last 6 months)
  const byMonth: Record<string, { income: number; expense: number }> = {};
  (payments || []).forEach(p => {
    const m = p.received_on?.slice(0, 7) || 'Unknown';
    byMonth[m] = byMonth[m] || { income: 0, expense: 0 };
    byMonth[m].income += Number(p.amount);
  });
  (expenses || []).forEach(e => {
    const m = e.incurred_on?.slice(0, 7) || 'Unknown';
    byMonth[m] = byMonth[m] || { income: 0, expense: 0 };
    byMonth[m].expense += Number(e.amount);
  });
  const months = Object.keys(byMonth).sort().reverse().slice(0, 6).reverse();
  const maxVal = Math.max(...months.map(m => Math.max(byMonth[m].income, byMonth[m].expense)), 1);

  const methodLabels: Record<string, string> = {
    bank_transfer: 'Virement bancaire (RIB Maroc)',
    cash_agency: 'Espèces (Agence DARIYA Tanger)',
    cmi_card: 'Carte bancaire marocaine / CMI',
    wafa_cash: 'Transfert Wafa Cash / Cash Plus',
    other: 'Autre moyen',
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'En attente de rapprochement' },
    confirmed: { bg: '#DEF7EC', text: '#03543F', label: 'Paiement confirmé ✓' },
    failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Échec / Rejeté' },
    refunded: { bg: '#F3F4F6', text: '#4B5563', label: 'Remboursé' },
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>FINANCES & SUIVI COMPTABLE</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={22} style={{ color: '#C87955' }} /> Tableau de bord financier
          </h1>
          <p className="muted">Revenus locatifs, dépenses de maintenance, factures de charges et règlements de vos biens à Tanger.</p>
        </div>
        <Link href="/api/reports/finance" className="btn light" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Exporter le grand livre (CSV)
        </Link>
      </div>

      <Alert searchParams={params} />

      {/* KPI Summary */}
      <div className="gridcards panel">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', marginBottom: 12 }}>
            <TrendingUp size={16} /><span className="muted small" style={{ fontWeight: 700 }}>REVENUS LOCATIFS TOTAUX</span>
          </div>
          <div className="stats-number" style={{ color: '#10B981' }}>{money(totalIncome, lang)}</div>
          <span className="footnote" style={{ color: '#7E968F' }}>{(payments || []).length} loyers encaissés</span>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', marginBottom: 12 }}>
            <TrendingDown size={16} /><span className="muted small" style={{ fontWeight: 700 }}>DÉPENSES & TRAVAUX</span>
          </div>
          <div className="stats-number" style={{ color: '#EF4444' }}>{money(totalExpense, lang)}</div>
          <span className="footnote" style={{ color: '#7E968F' }}>{(expenses || []).length} charges décaissées</span>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: net >= 0 ? '#10B981' : '#EF4444', marginBottom: 12 }}>
            <Wallet size={16} /><span className="muted small" style={{ fontWeight: 700 }}>SOLDE NET EN BANQUE</span>
          </div>
          <div className="stats-number" style={{ color: net >= 0 ? '#10B981' : '#EF4444' }}>{money(net, lang)}</div>
          <span className="footnote" style={{ color: net >= 0 ? '#10B981' : '#EF4444' }}>
            {net >= 0 ? '↑ Excédent net' : '↓ Solde débiteur'}
          </span>
        </Card>
      </div>

      {/* Cash-flow bar chart */}
      {months.length > 0 && (
        <Card className="panel">
          <h2 className="section-title">Flux de trésorerie — 6 derniers mois</h2>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, minWidth: 400, paddingBottom: 8 }}>
              {months.map(m => {
                const inc = byMonth[m].income;
                const exp = byMonth[m].expense;
                const incH = Math.round((inc / maxVal) * 120);
                const expH = Math.round((exp / maxVal) * 120);
                const label = m.slice(0, 7);
                return (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 130 }}>
                      <div
                        title={`Revenus: ${money(inc, lang)}`}
                        style={{
                          width: 18, height: Math.max(incH, 2),
                          background: 'linear-gradient(180deg, #34D399 0%, #10B981 100%)',
                          borderRadius: '3px 3px 0 0',
                          cursor: 'default',
                        }}
                      />
                      <div
                        title={`Dépenses: ${money(exp, lang)}`}
                        style={{
                          width: 18, height: Math.max(expH, 2),
                          background: 'linear-gradient(180deg, #FCA5A5 0%, #EF4444 100%)',
                          borderRadius: '3px 3px 0 0',
                          cursor: 'default',
                        }}
                      />
                    </div>
                    <span className="footnote" style={{ fontSize: 10, textAlign: 'center', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#10B981', display: 'inline-block' }} />
              Revenus locatifs perçus
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: '#EF4444', display: 'inline-block' }} />
              Dépenses & travaux décaissés
            </span>
          </div>
        </Card>
      )}

      {/* Manual Payment Tracking & Declaration Form */}
      <div className="two panel">
        {/* Declare payment */}
        <Card>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} color="#C87955" /> Déclarer un règlement effectué
          </h2>
          <p className="small muted" style={{ marginTop: 2, marginBottom: 14 }}>
            Déclarez vos virements pour abonnement DARIYA ou validation de devis travaux afin que notre comptabilité rapproche votre compte.
          </p>

          <form action={recordManualPayment} className="stack">
            <Field name="property_id" label="Bien concerné (facultatif)">
              <option value="">Sélectionner si applicable</option>
              {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Field>

            <Field name="payment_type" label="Objet du paiement" required>
              <option value="subscription">Abonnement annuel / mensuel DARIYA</option>
              <option value="maintenance_quote">Règlement d&apos;un devis travaux approuvé</option>
              <option value="management_fee">Frais de gestion locative</option>
              <option value="other">Autre charge</option>
            </Field>

            <div className="grid-2" style={{ gap: 12 }}>
              <Field name="amount" label="Montant versé (MAD)" type="number" min={1} step="10" placeholder="Ex: 1200" required />
              <Field name="method" label="Mode de versement" required>
                <option value="bank_transfer">Virement bancaire (RIB Maroc)</option>
                <option value="wafa_cash">Wafa Cash / Cash Plus</option>
                <option value="cash_agency">Espèces agence DARIYA Tanger</option>
                <option value="cmi_card">Carte bancaire (CMI)</option>
                <option value="other">Autre moyen</option>
              </Field>
            </div>

            <Field name="reference_code" label="Numéro de transaction / Référence virement" placeholder="Ex: VIR-2026-98124" />
            <Field name="notes" label="Notes ou précisions pour la comptabilité" placeholder="Ex: Virement effectué depuis mon compte Attijariwafa..." />

            <div style={{ marginTop: 4 }}>
              <button className="btn" type="submit">
                <CheckCircle size={14} /> Déclarer le paiement
              </button>
            </div>
          </form>
        </Card>

        {/* Declared payments list */}
        <Card>
          <h2 className="section-title">Mes règlements déclarés ({manualPayments?.length || 0})</h2>
          {manualPayments?.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {manualPayments.map(mp => {
                const st = statusColors[mp.status] || statusColors.pending;
                return (
                  <div key={mp.id} className="list-item" style={{ padding: '12px 14px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 15, color: 'var(--ink)' }}>{money(Number(mp.amount), lang)}</strong>
                      <span className="badge" style={{ background: st.bg, color: st.text, fontSize: 11 }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {methodLabels[mp.method] || mp.method} · {mp.payment_type}
                    </div>
                    {mp.reference_code && (
                      <div className="footnote" style={{ marginTop: 2, color: 'var(--muted)' }}>
                        Réf : {mp.reference_code}
                      </div>
                    )}
                    <div className="footnote muted" style={{ marginTop: 4 }}>
                      Déclaré le {dateText(mp.created_at, lang)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="Aucun règlement en attente ou déclaré pour le moment." />
          )}
        </Card>
      </div>

      {/* Utility Bills / Charges Courantes */}
      {utilityBills && utilityBills.length > 0 && (
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#F59E0B" /> Factures de fluides & Charges de copropriété ({utilityBills.length})
          </h2>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left', color: 'var(--muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>Période</th>
                  <th style={{ padding: '8px 12px' }}>Bien</th>
                  <th style={{ padding: '8px 12px' }}>Catégorie</th>
                  <th style={{ padding: '8px 12px' }}>Réf. Compteur</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {utilityBills.map(ub => (
                  <tr key={ub.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ub.period_month}</td>
                    <td style={{ padding: '10px 12px' }}>{propName(ub.property_id)}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{ub.category}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{ub.reference || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#EF4444' }}>
                      {money(Number(ub.amount), lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transactions detail */}
      <div className="two panel">
        <Card>
          <h2 className="section-title">Loyers reçus</h2>
          {payments?.length ? payments.map(p => (
            <div key={p.id} className="list-item row">
              <div>
                <b style={{ fontSize: 14 }}>{money(Number(p.amount), lang)}</b>
                <p className="muted small">{propName(p.property_id)} · {dateText(p.received_on, lang)}</p>
                {p.reference && <p className="footnote">Réf: {p.reference}</p>}
              </div>
              <span style={{ color: '#10B981', fontWeight: 700, fontSize: 13 }}>✓</span>
            </div>
          )) : <Empty message="Aucun loyer enregistré." />}
        </Card>
        <Card>
          <h2 className="section-title">Dépenses</h2>
          {expenses?.length ? expenses.map(e => (
            <div key={e.id} className="list-item row">
              <div>
                <b style={{ fontSize: 14 }}>{money(Number(e.amount), lang)}</b>
                <p className="muted small">{propName(e.property_id)} · <span style={{ textTransform: 'capitalize' }}>{e.category}</span> · {dateText(e.incurred_on, lang)}</p>
                {e.note && <p className="footnote">{e.note}</p>}
              </div>
              <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 13 }}>↓</span>
            </div>
          )) : <Empty message="Aucune dépense enregistrée." />}
        </Card>
      </div>

      <p className="footnote panel" style={{ textAlign: 'center', color: 'var(--muted)', lineHeight: 1.6 }}>
        ℹ️ Les données financières reflètent les opérations réellement confirmées et rapprochées à Tanger par l&apos;équipe DARIYA.
        Ce carnet de compte est un outil de traçabilité opérationnelle et de transparence pour les propriétaires non résidents.
      </p>
    </>
  );
}
