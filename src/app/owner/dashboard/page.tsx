import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { House, Wrench, Wallet, ArrowUpRight, Plus, Bell, ClipboardCheck, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

export default async function OwnerDashboard({
  searchParams,
}: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db, profile } = await currentUser();
  const lang = await language();

  const [ps, ms, ins, rs, es, ns, qs] = await Promise.all([
    db.from('properties').select('id,name,city,status,occupancy,created_at').order('created_at', { ascending: false }),
    db.from('maintenance_requests').select('id,title,status,created_at,priority,property_id').order('created_at', { ascending: false }).limit(6),
    db.from('inspections').select('id,status,inspection_type,scheduled_for,created_at,property_id').order('created_at', { ascending: false }).limit(5),
    db.from('rent_payments').select('amount,received_on'),
    db.from('expenses').select('amount,incurred_on'),
    db.from('notifications').select('id,title,body,created_at,read_at').order('created_at', { ascending: false }).limit(5),
    db.from('maintenance_quotes').select('id,amount,scope,request_id,status').eq('status', 'pending'),
  ]);

  const properties = ps.data || [];
  const requests = ms.data || [];
  const pendingQuotes = qs.data || [];
  const today = new Date().toISOString().slice(0, 7);
  const rent = (rs.data || []).filter(x => x.received_on?.startsWith(today)).reduce((s, x) => s + Number(x.amount), 0);
  const expense = (es.data || []).filter(x => x.incurred_on?.startsWith(today)).reduce((s, x) => s + Number(x.amount), 0);
  const pendingRequests = requests.filter(r => !['completed', 'closed', 'rejected'].includes(r.status)).length;
  const upcomingInspections = (ins.data || []).filter(i => i.status === 'scheduled').length;

  return (
    <>
      <div className="topbar" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>ESPACE PROPRIÉTAIRE DARIYA</div>
          <h1 className="heading" style={{ margin: '4px 0 6px' }}>
            Bienvenue, {profile.full_name?.split(' ')[0] || 'Propriétaire'}.
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Supervision et gestion à distance de vos propriétés à Tanger.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/owner/maintenance" className="btn light">
            <Wrench size={16} /><span>Signaler un problème</span>
          </Link>
          <Link href="/owner/properties" className="btn">
            <Plus size={16} /><span>Ajouter un bien</span>
          </Link>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Action Required Banner: Pending quotes */}
      {pendingQuotes.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1.5px solid #F59E0B',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#D97706',
              color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 800,
            }}>
              {pendingQuotes.length}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400E', fontSize: 15 }}>
                {pendingQuotes.length === 1 ? '1 devis de travaux en attente de votre accord' : `${pendingQuotes.length} devis en attente de validation`}
              </div>
              <div style={{ fontSize: 13, color: '#B45309' }}>
                Nos artisans ont chiffré les réparations. Cliquez pour examiner et approuver le devis.
              </div>
            </div>
          </div>
          <Link href="/owner/maintenance" className="btn" style={{ background: '#D97706', borderColor: '#B45309', color: '#FFF' }}>
            Examiner les devis <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI Row */}
      <div className="gridcards panel">
        {[
          { label: 'Biens immobiliers', value: String(properties.length), Icon: House, color: '#C87955', tag: 'Portefeuille Tanger' },
          { label: 'Loyers perçus', value: money(rent, lang), Icon: Wallet, color: '#10B981', tag: today },
          { label: 'Dépenses travaux', value: money(expense, lang), Icon: TrendingUp, color: '#EF4444', tag: today },
          { label: 'Demandes actives', value: String(pendingRequests), Icon: Wrench, color: '#F59E0B', tag: 'En traitement' },
          { label: 'Visites planifiées', value: String(upcomingInspections), Icon: ClipboardCheck, color: '#3B82F6', tag: 'À venir' },
        ].map(({ label, value, Icon, color, tag }) => (
          <Card key={label}>
            <div className="row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
              <span className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: color + '18', color }}>
                <Icon size={18} />
              </div>
            </div>
            <div className="stats-number" style={{ color: 'var(--ink)' }}>{value}</div>
            <span className="footnote" style={{ color: '#7E968F' }}>{tag}</span>
          </Card>
        ))}
      </div>

      {/* Properties + Maintenance */}
      <div className="two panel">
        <Card>
          <div className="row" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Mes biens ({properties.length})</h2>
            <Link href="/owner/properties" className="muted small" style={{ fontWeight: 700, color: '#C87955' }}>Gérer tout ↗</Link>
          </div>
          {properties.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {properties.map(p => (
                <Link href={`/owner/properties/${p.id}`} key={p.id} className="log-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}>
                  <div>
                    <b style={{ color: 'var(--ink)', fontSize: 14 }}>{p.name}</b>
                    <p className="muted small" style={{ margin: '3px 0 0' }}>{p.city} · {p.occupancy}</p>
                  </div>
                  <Status value={p.status} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="Aucun bien enregistré. Ajoutez votre premier logement à Tanger." />
          )}
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Interventions & Maintenance</h2>
            <Link href="/owner/maintenance" className="muted small" style={{ fontWeight: 700, color: '#C87955' }}>Voir tout ↗</Link>
          </div>
          {requests.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {requests.map(r => (
                <div key={r.id} className="log-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}>
                  <div>
                    <b style={{ color: 'var(--ink)', fontSize: 14 }}>{r.title}</b>
                    <div className="muted small" style={{ margin: '3px 0 0' }}>{dateText(r.created_at, lang)} · {r.priority}</div>
                  </div>
                  <Status value={r.status} />
                </div>
              ))}
            </div>
          ) : <Empty message="Aucune demande de maintenance en cours." />}
        </Card>
      </div>

      {/* Inspections */}
      <Card className="panel">
        <div className="row" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Dernières inspections techniques</h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>Preuves photographiques et rapports certifiés par nos agents de terrain.</p>
          </div>
          <Link href="/owner/inspections" className="btn light">Toutes les visites <ArrowUpRight size={15} /></Link>
        </div>
        {(ins.data || []).length ? (
          <div className="stack" style={{ gap: 8 }}>
            {(ins.data || []).map(i => (
              <div key={i.id} className="log-item"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}>
                <div>
                  <b style={{ color: 'var(--ink)', fontSize: 14, textTransform: 'capitalize' }}>
                    {i.inspection_type?.replaceAll('_', ' ') || 'Inspection'}
                  </b>
                  <p className="muted small" style={{ margin: '3px 0 0' }}>
                    {i.scheduled_for ? `Planifié le ${dateText(i.scheduled_for, lang)}` : `Demandé le ${dateText(i.created_at, lang)}`}
                  </p>
                </div>
                <Status value={i.status} />
              </div>
            ))}
          </div>
        ) : <Empty message="Aucune inspection demandée pour le moment." />}
      </Card>

      {/* Notifications */}
      <Card className="panel">
        <div className="row" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} style={{ color: '#C87955' }} />
            <h2 className="section-title" style={{ margin: 0 }}>Notifications récentes</h2>
          </div>
          <Link href="/owner/notifications" className="muted small" style={{ color: '#C87955', fontWeight: 700 }}>Centre de notifications ↗</Link>
        </div>
        {ns.data?.length ? (
          <div className="stack" style={{ gap: 8 }}>
            {ns.data.map(n => (
              <div key={n.id} className="log-item" style={{ margin: 0, padding: '14px 16px' }}>
                <b style={{ color: 'var(--ink)', fontSize: 13.5 }}>{n.title}</b>
                <p className="muted small" style={{ margin: '4px 0' }}>{n.body}</p>
                <span className="footnote" style={{ color: '#7E968F' }}>{dateText(n.created_at, lang)}</span>
              </div>
            ))}
          </div>
        ) : <Empty message="Aucune notification." />}
      </Card>
    </>
  );
}
