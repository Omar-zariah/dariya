import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { CheckCircle2, Star, TrendingUp, Award } from 'lucide-react';

export default async function ProviderHistoryPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db } = await currentUser();
  const lang = await language();

  const { data: sp } = await db
    .from('service_providers')
    .select('id, business_name, rating, verified')
    .eq('profile_id', user.id)
    .maybeSingle();

  let completedJobs: any[] = [];
  let totalBilled = 0;

  if (sp) {
    const { data: assignments } = await db
      .from('service_assignments')
      .select('assigned_at, maintenance_requests(id, title, description, status, created_at, properties(name, city))')
      .eq('provider_id', sp.id);

    completedJobs = (assignments ?? [])
      .map(a => Array.isArray(a.maintenance_requests) ? a.maintenance_requests[0] : a.maintenance_requests)
      .filter((r: any) => r && (r.status === 'completed' || r.status === 'closed'));

    const { data: acceptedQuotes } = await db
      .from('maintenance_quotes')
      .select('amount')
      .eq('provider_id', sp.id)
      .eq('status', 'accepted');

    totalBilled = (acceptedQuotes ?? []).reduce((sum, q) => sum + Number(q.amount || 0), 0);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#D97706' }}>BILAN D&apos;ACTIVITÉ</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={22} style={{ color: '#D97706' }} /> Historique & Performances Artisan
          </h1>
          <p className="muted">Retrouvez l&apos;ensemble de vos chantiers menés à terme avec succès sur le réseau DARIYA.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Card className="panel" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="small muted">Interventions Finalisées</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            {completedJobs.length}
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="small muted">Note Qualité Moyenne</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#F59E0B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={24} fill="#F59E0B" color="#F59E0B" /> {sp?.rating ? Number(sp.rating).toFixed(1) : '5.0'} / 5
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div className="small muted">Volume Devis Validés</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3B82F6', marginTop: 4 }}>
            {money(totalBilled)}
          </div>
        </Card>
      </div>

      <Card className="panel">
        <h2 className="section-title">Chantiers clôturés ({completedJobs.length})</h2>

        {completedJobs.length > 0 ? (
          <div className="stack" style={{ gap: 12 }}>
            {completedJobs.map(job => {
              const prop = Array.isArray(job.properties) ? job.properties[0] : job.properties;
              return (
                <div key={job.id} className="list-item" style={{ padding: '14px 18px', borderRadius: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{job.title}</span>
                        <Status value={job.status} />
                      </div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {prop?.name} ({prop?.city})
                      </div>
                      <p className="small muted" style={{ marginTop: 4 }}>
                        {job.description}
                      </p>
                    </div>
                    <span className="small" style={{ color: '#10B981', fontWeight: 700 }}>
                      ✓ Terminé
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune intervention clôturée dans l'historique pour le moment." />
        )}
      </Card>
    </>
  );
}
