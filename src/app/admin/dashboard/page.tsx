import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { approveProperty, advanceRequest } from '@/actions/data';
import {
  Users, Building2, Wrench, ClipboardCheck, Star, MessageCircle,
  UserCheck, TrendingUp, AlertTriangle, Clock, ArrowRight, ShieldCheck,
  CheckCircle2, FileText
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { db } = await currentUser();
  const lang = await language();

  const [
    ownersRes, propertiesRes, requestsRes, quotesRes,
    inspectionsRes, providersRes, ticketsRes, subscriptionsRes,
    paymentsRes, expensesRes, activityRes
  ] = await Promise.all([
    db.from('profiles').select('id, full_name, role, created_at').eq('role', 'owner'),
    db.from('properties').select('id, name, city, address, status, owner_id, created_at').order('created_at', { ascending: false }),
    db.from('maintenance_requests').select('id, title, status, priority, category, property_id, created_at, properties(name, city)').order('created_at', { ascending: false }),
    db.from('maintenance_quotes').select('id, request_id, amount, scope, status, created_at'),
    db.from('inspections').select('id, status, scheduled_for, inspection_type, property_id, properties(name, city)').order('created_at', { ascending: false }),
    db.from('service_providers').select('id, business_name, specialty, verified'),
    db.from('support_tickets').select('id, subject, status, created_at, user_id').order('created_at', { ascending: false }),
    db.from('subscriptions').select('id, status, plan_id, owner_id'),
    db.from('rent_payments').select('amount, received_on'),
    db.from('expenses').select('amount, incurred_on'),
    db.from('activity_logs').select('id, action, entity_type, created_at, property_id').order('created_at', { ascending: false }).limit(6),
  ]);

  const properties = propertiesRes.data || [];
  const requests = requestsRes.data || [];
  const quotes = quotesRes.data || [];
  const inspections = inspectionsRes.data || [];
  const tickets = ticketsRes.data || [];
  const providers = providersRes.data || [];

  // Financial calculations for current month
  const todayMonth = new Date().toISOString().slice(0, 7);
  const totalIncome = (paymentsRes.data || []).filter(p => p.received_on?.startsWith(todayMonth)).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = (expensesRes.data || []).filter(e => e.incurred_on?.startsWith(todayMonth)).reduce((s, e) => s + Number(e.amount), 0);

  // Operational Attention Queues
  const pendingProps = properties.filter(p => p.status === 'pending_verification');
  const requestsSubmitted = requests.filter(r => r.status === 'submitted');
  const quotesPending = quotes.filter(q => q.status === 'pending');
  const requestsApproved = requests.filter(r => r.status === 'approved');
  const requestsInProgress = requests.filter(r => r.status === 'in_progress');
  const inspectionsPending = inspections.filter(i => i.status === 'requested');
  const inspectionsScheduled = inspections.filter(i => i.status === 'scheduled');
  const ticketsOpen = tickets.filter(t => t.status !== 'resolved');

  const totalUrgentActions = pendingProps.length + requestsSubmitted.length + requestsApproved.length + inspectionsPending.length + ticketsOpen.length;

  return (
    <>
      <div className="topbar" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>DARIYA / CENTRE DES OPÉRATIONS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Poste de Contrôle Opérationnel (Tanger)
          </h1>
          <p className="muted">
            Gestion centralisée des biens MRE, interventions artisans, inspections techniques et flux financiers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/maintenance" className="btn light">
            <Wrench size={16} /> File travaux
          </Link>
          <Link href="/admin/inspections" className="btn">
            <ClipboardCheck size={16} /> Inspections
          </Link>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Immediate Attention Callout */}
      {totalUrgentActions > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #93C5FD',
          padding: '16px 20px',
          marginBottom: 20,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#2563EB', color: '#FFF', display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 18,
            }}>
              {totalUrgentActions}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E3A8A' }}>
                Actions prioritaires requises aujourd&apos;hui
              </div>
              <div style={{ fontSize: 13, color: '#1E40AF' }}>
                {pendingProps.length > 0 && `${pendingProps.length} bien(s) à vérifier · `}
                {requestsSubmitted.length > 0 && `${requestsSubmitted.length} demande(s) à qualifier · `}
                {requestsApproved.length > 0 && `${requestsApproved.length} chantier(s) validé(s) à assigner · `}
                {inspectionsPending.length > 0 && `${inspectionsPending.length} inspection(s) à planifier · `}
                {ticketsOpen.length > 0 && `${ticketsOpen.length} ticket(s) support ouvert(s)`}
              </div>
            </div>
          </div>
          <Link href="/admin/maintenance" className="btn" style={{ background: '#1E40AF', color: '#FFF', border: 'none' }}>
            Traiter les priorités <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <div className="gridcards panel">
        {[
          { label: 'Propriétaires MRE', value: ownersRes.data?.length ?? 0, Icon: Users, color: '#3B82F6', sub: 'Actifs' },
          { label: 'Biens sous gestion', value: properties.length, Icon: Building2, color: '#10B981', sub: `${pendingProps.length} en attente` },
          { label: 'Chantiers actifs', value: requestsInProgress.length, Icon: Wrench, color: '#F59E0B', sub: `${requestsSubmitted.length} à qualifier` },
          { label: 'Inspections prévues', value: inspectionsScheduled.length, Icon: ClipboardCheck, color: '#6366F1', sub: `${inspectionsPending.length} demandées` },
          { label: 'Artisans partenaires', value: providers.filter(p => p.verified).length, Icon: UserCheck, color: '#06B6D4', sub: `${providers.length} référencés` },
          { label: 'Tickets ouverts', value: ticketsOpen.length, Icon: MessageCircle, color: '#EC4899', sub: 'Support client' },
          { label: 'Loyers encaissés', value: money(totalIncome, lang), Icon: TrendingUp, color: '#10B981', sub: todayMonth },
          { label: 'Dépenses travaux', value: money(totalExpense, lang), Icon: TrendingUp, color: '#EF4444', sub: todayMonth },
        ].map(({ label, value, Icon, color, sub }) => (
          <Card key={label}>
            <div className="row" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
              <span className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>
                {label}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: color + '15', color }}>
                <Icon size={16} />
              </div>
            </div>
            <div className="stats-number" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{value}</div>
            <div className="footnote muted" style={{ marginTop: 4 }}>{sub}</div>
          </Card>
        ))}
      </div>

      {/* Operational Queues */}
      <div className="two panel" style={{ marginTop: 24 }}>
        {/* Queue 1: Demandes de maintenance nécessitant qualification */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={18} style={{ color: '#F59E0B' }} />
              Demandes de maintenance en attente ({requestsSubmitted.length + requestsApproved.length})
            </h2>
            <Link href="/admin/maintenance" className="small muted" style={{ fontWeight: 600 }}>Voir tout →</Link>
          </div>

          {[...requestsSubmitted, ...requestsApproved].length > 0 ? (
            <div className="stack" style={{ gap: 10 }}>
              {[...requestsSubmitted, ...requestsApproved].slice(0, 5).map(r => {
                const p: any = Array.isArray(r.properties) ? r.properties[0] : r.properties;
                return (
                  <div key={r.id} className="list-item" style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--surface)' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>{r.title}</b>
                      <Status value={r.status} />
                    </div>
                    <p className="muted small" style={{ margin: '4px 0 8px' }}>
                      {p?.name || 'Bien'} ({p?.city || 'Tanger'}) · Urgence: <b>{r.priority}</b> · {dateText(r.created_at, lang)}
                    </p>
                    <div className="row" style={{ gap: 8 }}>
                      {r.status === 'submitted' && (
                        <form action={advanceRequest}>
                          <input type="hidden" name="request_id" value={r.id} />
                          <input type="hidden" name="next_status" value="reviewed" />
                          <button className="btn light" style={{ fontSize: 12, padding: '4px 10px' }}>
                            Qualifier le dossier
                          </button>
                        </form>
                      )}
                      <Link href={`/admin/maintenance?request_id=${r.id}`} className="btn" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {r.status === 'approved' ? 'Assigner artisan' : 'Créer devis'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="Toutes les demandes de travaux sont actuellement qualifiées ou assignées." />
          )}
        </Card>

        {/* Queue 2: Propriétés & Inspections à valider */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} style={{ color: '#10B981' }} />
              Biens & Inspections en attente ({pendingProps.length + inspectionsPending.length})
            </h2>
            <Link href="/admin/properties" className="small muted" style={{ fontWeight: 600 }}>Voir tout →</Link>
          </div>

          {pendingProps.length > 0 || inspectionsPending.length > 0 ? (
            <div className="stack" style={{ gap: 10 }}>
              {pendingProps.slice(0, 3).map(p => (
                <div key={p.id} className="list-item" style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--surface)' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{p.name}</b>
                    <Status value={p.status} />
                  </div>
                  <p className="muted small" style={{ margin: '4px 0 8px' }}>
                    {p.address}, {p.city} · Enregistré le {dateText(p.created_at, lang)}
                  </p>
                  <form action={approveProperty}>
                    <input type="hidden" name="property_id" value={p.id} />
                    <button className="btn" style={{ fontSize: 12, padding: '4px 12px' }}>
                      <CheckCircle2 size={12} /> Valider la propriété
                    </button>
                  </form>
                </div>
              ))}

              {inspectionsPending.slice(0, 3).map(i => {
                const p: any = Array.isArray(i.properties) ? i.properties[0] : i.properties;
                return (
                  <div key={i.id} className="list-item" style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--surface)' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>Inspection : {p?.name || 'Bien'}</b>
                      <Status value={i.status} />
                    </div>
                    <p className="muted small" style={{ margin: '4px 0 8px' }}>
                      Type: {i.inspection_type} · {p?.city || 'Tanger'}
                    </p>
                    <Link href={`/admin/inspections?selected=${i.id}`} className="btn light" style={{ fontSize: 12, padding: '4px 10px' }}>
                      Planifier l&apos;inspection
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="Aucun bien ni demande d'inspection en attente d'approbation." />
          )}
        </Card>
      </div>

      {/* Support & Audit Stream */}
      <div className="two panel" style={{ marginTop: 24 }}>
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Tickets Support Récents</h2>
            <Link href="/admin/support" className="small muted" style={{ fontWeight: 600 }}>Gérer tickets →</Link>
          </div>
          {tickets.length > 0 ? (
            <div className="stack" style={{ gap: 8 }}>
              {tickets.slice(0, 5).map(t => (
                <div key={t.id} className="list-item row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <b>{t.subject}</b>
                    <div className="footnote muted">{dateText(t.created_at, lang)}</div>
                  </div>
                  <Status value={t.status} />
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Aucun ticket d'assistance en cours." />
          )}
        </Card>

        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Journal d&apos;activité récent (Audit)</h2>
            <span className="footnote muted">Temps réel</span>
          </div>
          {activityRes.data && activityRes.data.length > 0 ? (
            <div className="stack" style={{ gap: 8 }}>
              {activityRes.data.map(log => (
                <div key={log.id} className="list-item row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1E3A8A' }}>
                      {log.action.replaceAll('_', ' ')}
                    </span>
                    <span className="muted"> · {log.entity_type}</span>
                  </div>
                  <span className="footnote muted">{dateText(log.created_at, lang)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Aucune activité récente enregistrée." />
          )}
        </Card>
      </div>
    </>
  );
}
