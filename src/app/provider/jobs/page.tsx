import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { advanceRequest } from '@/actions/data';
import { Wrench, MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ProviderJobsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db } = await currentUser();
  const lang = await language();

  const { data: sp } = await db
    .from('service_providers')
    .select('id, business_name')
    .eq('profile_id', user.id)
    .maybeSingle();

  let jobs: any[] = [];
  if (sp) {
    const { data: assignments } = await db
      .from('service_assignments')
      .select('assigned_at, maintenance_requests(id, title, description, priority, status, created_at, properties(name, address, city))')
      .eq('provider_id', sp.id)
      .order('assigned_at', { ascending: false });

    jobs = (assignments ?? []).map(a => {
      const mr: any = Array.isArray(a.maintenance_requests) ? a.maintenance_requests[0] : a.maintenance_requests;
      return mr ? { ...mr, assigned_at: a.assigned_at } : null;
    }).filter(Boolean);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#D97706' }}>INTERVENTIONS & CHANTIERS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wrench size={22} style={{ color: '#D97706' }} /> Mes Chantiers & Missions Travaux
          </h1>
          <p className="muted">Suivez l&apos;avancement de vos réparations, interventions d&apos;urgence et travaux de maintenance.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <Card className="panel">
        <h2 className="section-title">Chantiers assignés ({jobs.length})</h2>

        {jobs.length > 0 ? (
          <div className="stack" style={{ gap: 16 }}>
            {jobs.map(job => {
              const prop = Array.isArray(job.properties) ? job.properties[0] : job.properties;
              return (
                <div key={job.id} className="list-item" style={{ padding: '18px 20px', borderRadius: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ flex: '1 1 340px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{job.title}</span>
                        <Status value={job.status} />
                        <span className="small" style={{
                          padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 700,
                          background: job.priority === 'urgent' ? '#FEE2E2' : job.priority === 'low' ? '#F0FDF4' : '#FEF3C7',
                          color: job.priority === 'urgent' ? '#DC2626' : job.priority === 'low' ? '#16A34A' : '#D97706',
                        }}>
                          {job.priority === 'urgent' ? 'URGENT' : job.priority === 'low' ? 'bas' : 'normal'}
                        </span>
                      </div>

                      <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <MapPin size={13} /> {prop?.name} — {prop?.address}, {prop?.city}
                      </div>

                      <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 6, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                        {job.description}
                      </div>

                      <div className="small muted" style={{ marginTop: 8 }}>
                        Attribué le : {dateText(job.assigned_at, lang)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                      <Link href={`/provider/quotations?request_id=${job.id}`} className="btn light" style={{ fontSize: 13, textAlign: 'center' }}>
                        Déposer un devis
                      </Link>

                      {job.status === 'approved' && (
                        <form action={advanceRequest}>
                          <input type="hidden" name="request_id" value={job.id} />
                          <input type="hidden" name="next_status" value="in_progress" />
                          <button className="btn" style={{ width: '100%', fontSize: 13, background: '#D97706', borderColor: '#B45309' }}>
                            ▶ Démarrer l&apos;intervention
                          </button>
                        </form>
                      )}

                      {job.status === 'in_progress' && (
                        <form action={advanceRequest}>
                          <input type="hidden" name="request_id" value={job.id} />
                          <input type="hidden" name="next_status" value="completed" />
                          <button className="btn" style={{ width: '100%', fontSize: 13, background: '#10B981', borderColor: '#059669' }}>
                            ✓ Déclarer travaux terminés
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune intervention attribuée pour le moment." />
        )}
      </Card>
    </>
  );
}
