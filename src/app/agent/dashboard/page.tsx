import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { ClipboardCheck, Calendar, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function AgentDashboard({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db, profile } = await currentUser();
  const lang = await language();

  // Fetch inspections assigned to this agent
  const { data: myInspections } = await db
    .from('inspections')
    .select('id, scheduled_for, status, report, property_id, properties(name, address, city)')
    .eq('agent_id', user.id)
    .order('scheduled_for', { ascending: true });

  const scheduled = myInspections?.filter(i => i.status === 'scheduled') ?? [];
  const completed = myInspections?.filter(i => i.status === 'completed') ?? [];
  const inProgress = myInspections?.filter(i => i.status === 'in_progress' || i.status === 'pending') ?? [];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#10B981' }}>AGENT TERRAIN · TANGER</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Bonjour, {profile.full_name?.split(' ')[0] || 'Agent'} 👋
          </h1>
          <p className="muted">Bienvenue sur votre portail d&apos;opérations terrain DARIYA.</p>
        </div>
        <Link href="/agent/inspections" className="btn" style={{ background: '#10B981', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardCheck size={16} /> Réaliser une inspection
        </Link>
      </div>

      <Alert searchParams={await searchParams} />

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Card className="panel" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color="#F59E0B" /> Missions Planifiées
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>
            {scheduled.length}
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} color="#3B82F6" /> En attente / En cours
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3B82F6', marginTop: 4 }}>
            {inProgress.length}
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} color="#10B981" /> Inspections Terminées
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            {completed.length}
          </div>
        </Card>
      </div>

      {/* Upcoming missions */}
      <Card className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Prochaines missions programmées</h2>
          <Link href="/agent/assignments" className="small" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {scheduled.length > 0 ? (
          <div className="stack" style={{ gap: 12 }}>
            {scheduled.map(ins => {
              const prop = Array.isArray(ins.properties) ? ins.properties[0] : ins.properties;
              return (
                <div key={ins.id} className="list-item" style={{ padding: '14px 18px', borderRadius: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{prop?.name ?? 'Propriété DARIYA'}</span>
                        <Status value={ins.status} />
                      </div>
                      <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <MapPin size={13} /> {prop?.address}, {prop?.city}
                      </div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        Date prévue : <strong>{ins.scheduled_for ? dateText(ins.scheduled_for, lang) : 'À planifier'}</strong>
                      </div>
                    </div>
                    <Link href={`/agent/inspections?selected=${ins.id}`} className="btn light" style={{ fontSize: 13, padding: '8px 14px' }}>
                      Ouvrir le rapport →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune mission d'inspection planifiée pour le moment." />
        )}
      </Card>
    </>
  );
}
