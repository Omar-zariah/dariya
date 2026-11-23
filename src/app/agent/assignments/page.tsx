import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { Calendar, MapPin, Building2, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function AgentAssignmentsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db } = await currentUser();
  const lang = await language();

  // Fetch all assignments for this agent
  const { data: assignments } = await db
    .from('inspections')
    .select('id, scheduled_for, status, report, property_id, properties(id, name, address, city)')
    .eq('agent_id', user.id)
    .order('scheduled_for', { ascending: false });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#10B981' }}>MISSIONS ATTRIBUÉES</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={22} style={{ color: '#10B981' }} /> Mes Missions & Visites Terrain
          </h1>
          <p className="muted">Liste de toutes les inspections et interventions qui vous sont attribuées à Tanger.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <Card className="panel">
        <h2 className="section-title">Missions d&apos;inspection ({assignments?.length ?? 0})</h2>

        {assignments && assignments.length > 0 ? (
          <div className="stack" style={{ gap: 14 }}>
            {assignments.map(a => {
              const prop = Array.isArray(a.properties) ? a.properties[0] : a.properties;
              return (
                <div key={a.id} className="list-item" style={{ padding: '16px 20px', borderRadius: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Building2 size={16} color="#10B981" />
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{prop?.name || 'Bien immobilier'}</span>
                        <Status value={a.status} />
                      </div>
                      <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <MapPin size={13} /> {prop?.address}, {prop?.city}
                      </div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        Date planifiée : <strong>{a.scheduled_for ? dateText(a.scheduled_for, lang) : 'Date à confirmer'}</strong>
                      </div>
                      {a.report && (
                        <div style={{ marginTop: 8, fontSize: 13, background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 6 }}>
                          <strong>Synthèse rapport :</strong> {a.report.slice(0, 140)}...
                        </div>
                      )}
                    </div>

                    <Link href={`/agent/inspections?selected=${a.id}`} className="btn" style={{ background: '#10B981', borderColor: '#059669', fontSize: 13, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Eye size={14} /> Accéder à la fiche
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune mission d'inspection ne vous est actuellement attribuée." />
        )}
      </Card>
    </>
  );
}
