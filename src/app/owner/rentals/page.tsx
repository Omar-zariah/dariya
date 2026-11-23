import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { FileText, Users, Wallet, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function OwnerRentals({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const [{ data: properties }, { data: contracts }, { data: tenants }, { data: payments }] = await Promise.all([
    db.from('properties').select('id,name,occupancy'),
    db.from('rental_contracts').select('id,property_id,tenant_id,start_date,end_date,monthly_rent,status').order('start_date', { ascending: false }),
    db.from('tenants').select('id,full_name,email,phone,property_id'),
    db.from('rent_payments').select('id,property_id,amount,received_on,reference,contract_id').order('received_on', { ascending: false }).limit(30),
  ]);

  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';
  const tenantName = (id: string) => (tenants || []).find(t => t.id === id)?.full_name || '—';
  const totalRent = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const activeContracts = (contracts || []).filter(c => c.status === 'active');

  // Due-date analysis
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
  const expiringContracts = activeContracts.filter(c => {
    if (!c.end_date) return false;
    const end = new Date(c.end_date);
    return end >= today && end <= in30;
  });
  const expiredContracts = activeContracts.filter(c => {
    if (!c.end_date) return false;
    return new Date(c.end_date) < today;
  });

  // Expected vs received rent this month
  const thisMonth = today.toISOString().slice(0, 7);
  const expectedRent = activeContracts.reduce((s, c) => s + Number(c.monthly_rent), 0);
  const receivedThisMonth = (payments || [])
    .filter(p => p.received_on?.startsWith(thisMonth))
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>LOCATION</div>
          <h1 className="heading">Gestion locative</h1>
          <p className="muted">Suivez vos locataires, contrats et paiements de loyer.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* Expiry alerts */}
      {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {expiredContracts.length > 0 && (
            <div style={{
              background: '#FFF5F5', border: '1.5px solid #FCA5A5', borderRadius: 10,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <AlertTriangle size={20} color="#DC2626" />
              <div>
                <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 14 }}>
                  {expiredContracts.length} contrat(s) arrivé(s) à échéance
                </div>
                <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 2 }}>
                  {expiredContracts.map(c => `${tenantName(c.tenant_id)} (${propName(c.property_id)})`).join(' · ')}
                  {' — '}Contactez votre gestionnaire DARIYA pour renouveler ou clôturer.
                </div>
              </div>
            </div>
          )}
          {expiringContracts.length > 0 && (
            <div style={{
              background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Calendar size={20} color="#D97706" />
              <div>
                <div style={{ fontWeight: 700, color: '#92400E', fontSize: 14 }}>
                  {expiringContracts.length} contrat(s) expirant dans 30 jours
                </div>
                <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>
                  {expiringContracts.map(c => `${tenantName(c.tenant_id)} — fin le ${dateText(c.end_date, lang)}`).join(' · ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="gridcards panel">
        <Card>
          <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} />Locataires</div>
          </div>
          <div className="stats-number">{tenants?.length ?? 0}</div>
        </Card>
        <Card>
          <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} />Contrats actifs</div>
          </div>
          <div className="stats-number">{activeContracts.length}</div>
        </Card>
        <Card>
          <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={14} />Loyers attendus / mois</div>
          </div>
          <div className="stats-number" style={{ color: '#10B981', fontSize: 20 }}>{money(expectedRent, lang)}</div>
        </Card>
      </div>

      {/* Current month rent status */}
      {activeContracts.length > 0 && (
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#C87955" /> Suivi des loyers — {thisMonth}
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <span className="small muted">Attendu ce mois</span>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>{money(expectedRent, lang)}</div>
            </div>
            <div style={{ width: 1, background: 'var(--line)' }} />
            <div>
              <span className="small muted">Reçu ce mois</span>
              <div style={{ fontWeight: 700, fontSize: 20, color: receivedThisMonth >= expectedRent ? '#10B981' : '#F59E0B' }}>
                {money(receivedThisMonth, lang)}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--line)' }} />
            <div>
              <span className="small muted">Écart</span>
              <div style={{ fontWeight: 700, fontSize: 20, color: receivedThisMonth >= expectedRent ? '#10B981' : '#EF4444' }}>
                {money(receivedThisMonth - expectedRent, lang)}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, expectedRent > 0 ? (receivedThisMonth / expectedRent) * 100 : 0)}%`,
              background: receivedThisMonth >= expectedRent ? '#10B981' : '#F59E0B',
              borderRadius: 100,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p className="footnote" style={{ marginTop: 8, color: 'var(--muted)' }}>
            {receivedThisMonth >= expectedRent
              ? '✓ Tous les loyers du mois ont été reçus.'
              : 'Les loyers sont enregistrés manuellement par votre gestionnaire DARIYA après confirmation de réception.'}
          </p>
        </Card>
      )}

      {/* Tenants + Contracts */}
      <div className="two panel">
        <Card>
          <h2 className="section-title">Locataires</h2>
          {tenants?.length ? tenants.map(t => (
            <div key={t.id} className="list-item">
              <div className="row">
                <b>{t.full_name}</b>
                <span className="muted small">{propName(t.property_id)}</span>
              </div>
              <p className="muted small">
                {t.email ? <>{t.email}<br /></> : null}
                {t.phone || '—'}
              </p>
            </div>
          )) : <Empty message="Aucun locataire enregistré. Contactez DARIYA pour ajouter un locataire." />}
        </Card>

        <Card>
          <h2 className="section-title">Contrats de location</h2>
          {contracts?.length ? contracts.map(c => {
            const isExpired = c.end_date && new Date(c.end_date) < today;
            const isExpiring = c.end_date && !isExpired && new Date(c.end_date) <= in30;
            return (
              <div key={c.id} className="list-item" style={{
                borderLeft: `3px solid ${isExpired ? '#EF4444' : isExpiring ? '#F59E0B' : '#10B981'}`
              }}>
                <div className="row">
                  <div>
                    <b>{tenantName(c.tenant_id)}</b>
                    <p className="muted small">{propName(c.property_id)}</p>
                  </div>
                  <Status value={isExpired ? 'paused' : c.status} />
                </div>
                <p className="muted small" style={{ marginTop: 4 }}>
                  Depuis le {dateText(c.start_date, lang)} ·&nbsp;
                  <strong style={{ color: '#10B981' }}>{money(Number(c.monthly_rent), lang)}/mois</strong>
                  {c.end_date && (
                    <span style={{ color: isExpired ? '#DC2626' : isExpiring ? '#D97706' : undefined }}>
                      {' '}· {isExpired ? '⚠ Expiré le' : isExpiring ? '⏰ Expire le' : '· Fin le'} {dateText(c.end_date, lang)}
                    </span>
                  )}
                </p>
                {isExpired && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      Contrat échu — contacter DARIYA pour renouvellement ou état des lieux
                    </span>
                  </div>
                )}
                {isExpiring && !isExpired && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      Expire dans 30 jours — renouvellement à planifier
                    </span>
                  </div>
                )}
              </div>
            );
          }) : <Empty message="Aucun contrat enregistré." />}
        </Card>
      </div>

      {/* Rent payments history */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color="#10B981" /> Historique des paiements ({payments?.length ?? 0} derniers)
        </h2>
        {payments?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Bien</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Montant</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Référence</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 10px' }}>{propName(p.property_id)}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: '#10B981', fontWeight: 700 }}>{money(Number(p.amount), lang)}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--muted)' }}>{dateText(p.received_on, lang)}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--muted)', fontSize: 12 }}>{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line)' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{money(totalRent, lang)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : <Empty message="Aucun paiement de loyer enregistré pour le moment." />}
      </Card>

      <p className="footnote panel" style={{ textAlign: 'center', color: 'var(--muted)', lineHeight: 1.6 }}>
        ℹ️ Les paiements sont enregistrés manuellement par votre gestionnaire DARIYA après confirmation de réception réelle.
        Aucun prélèvement automatique ou paiement en ligne n&apos;est actif.
      </p>
    </>
  );
}
