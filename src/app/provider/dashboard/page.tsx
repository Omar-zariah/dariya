import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { money, dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { Wrench, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ProviderDashboard({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db, profile } = await currentUser();
  const lang = await language();

  // Find provider profile
  const { data: sp } = await db
    .from('service_providers')
    .select('id, business_name, specialty, verified, rating')
    .eq('profile_id', user.id)
    .maybeSingle();

  // Fetch assigned requests
  let assignedRequests: any[] = [];
  let quotes: any[] = [];

  if (sp) {
    const { data: assignments } = await db
      .from('service_assignments')
      .select('request_id, assigned_at, maintenance_requests(id, title, description, priority, status, created_at, properties(name, address, city))')
      .eq('provider_id', sp.id)
      .order('assigned_at', { ascending: false });

    assignedRequests = (assignments ?? [])
      .map(a => a.maintenance_requests)
      .filter(Boolean);

    const { data: qData } = await db
      .from('maintenance_quotes')
      .select('id, amount, scope, status, created_at, request_id')
      .eq('provider_id', sp.id)
      .order('created_at', { ascending: false });

    quotes = qData ?? [];
  }

  const activeJobs = assignedRequests.filter(r => r.status === 'in_progress' || r.status === 'approved');
  const pendingQuotes = quotes.filter(q => q.status === 'pending');
  const acceptedQuotes = quotes.filter(q => q.status === 'approved');

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#D97706' }}>ESPACE ARTISAN PARTENAIRE</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Bonjour, {sp?.business_name || profile.full_name || 'Artisan'} 👋
          </h1>
          <p className="muted">
            {sp?.verified
              ? '✓ Prestataire vérifié et référencé DARIYA (Tanger)'
              : 'Profil artisan en cours de vérification par les équipes DARIYA'}
          </p>
        </div>
        <Link href="/provider/quotations" className="btn" style={{ background: '#D97706', borderColor: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={16} /> Établir un devis
        </Link>
      </div>

      <Alert searchParams={await searchParams} />

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Card className="panel" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench size={15} color="#3B82F6" /> Interventions en cours
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3B82F6', marginTop: 4 }}>
            {activeJobs.length}
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #D97706' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} color="#D97706" /> Devis en attente validation
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
            {pendingQuotes.length}
          </div>
        </Card>

        <Card className="panel" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} color="#10B981" /> Devis acceptés / Validés
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            {acceptedQuotes.length}
          </div>
        </Card>
      </div>

      {/* Active Jobs Queue */}
      <Card className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Missions & Interventions attribuées</h2>
          <Link href="/provider/jobs" className="small" style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
            Voir toutes les interventions <ArrowRight size={14} />
          </Link>
        </div>

        {assignedRequests.length > 0 ? (
          <div className="stack" style={{ gap: 12 }}>
            {assignedRequests.slice(0, 5).map(req => {
              const prop = Array.isArray(req.properties) ? req.properties[0] : req.properties;
              return (
                <div key={req.id} className="list-item" style={{ padding: '14px 18px', borderRadius: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{req.title}</span>
                        <Status value={req.status} />
                        <span className="small" style={{
                          padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 700,
                          background: req.priority === 'urgent' ? '#FEE2E2' : req.priority === 'low' ? '#F0FDF4' : '#FEF3C7',
                          color: req.priority === 'urgent' ? '#DC2626' : req.priority === 'low' ? '#16A34A' : '#D97706',
                        }}>
                          {req.priority === 'urgent' ? 'URGENCE' : req.priority === 'low' ? 'bas' : 'normal'}
                        </span>
                      </div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        Lieu : <strong>{prop?.name || 'Bien'}</strong> — {prop?.address}, {prop?.city}
                      </div>
                      <p className="small" style={{ color: 'var(--text)', marginTop: 6 }}>
                        {req.description}
                      </p>
                    </div>

                    <Link href={`/provider/quotations?request_id=${req.id}`} className="btn light" style={{ fontSize: 13, padding: '8px 14px' }}>
                      Chiffrer un devis →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune intervention ne vous est assignée actuellement." />
        )}
      </Card>
    </>
  );
}
