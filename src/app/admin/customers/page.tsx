import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { Users } from 'lucide-react';

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    db.from('profiles').select('id,full_name,role,created_at,country,phone').order('created_at', { ascending: false }),
    db.from('subscriptions').select('owner_id,status,plan_id'),
  ]);

  const subForOwner = (id: string) => (subscriptions || []).find(s => s.owner_id === id);

  const roleColor: Record<string, string> = {
    owner: '#C87955', admin: '#3B82F6', agent: '#10B981', provider: '#8B5CF6',
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>GESTION CLIENTS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} style={{ color: '#3B82F6' }} /> Tous les utilisateurs
          </h1>
          <p className="muted">Tous les comptes enregistrés sur la plateforme DARIYA.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      <Card className="panel">
        <h2 className="section-title">Utilisateurs ({profiles?.length ?? 0})</h2>
        {profiles?.length ? profiles.map(p => {
          const sub = subForOwner(p.id);
          return (
            <div key={p.id} className="list-item">
              <div className="row">
                <b style={{ fontSize: 15 }}>{p.full_name || '—'}</b>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 50,
                    background: (roleColor[p.role] || '#ccc') + '22', color: roleColor[p.role] || '#555',
                    letterSpacing: '0.06em',
                  }}>{p.role.toUpperCase()}</span>
                  {sub && <Status value={sub.status} />}
                </div>
              </div>
              <p className="muted small">
                {p.country || '—'} · {p.phone || '—'} · Inscrit le {dateText(p.created_at, lang)}
              </p>
              {sub && <p className="footnote">Plan : {sub.plan_id}</p>}
            </div>
          );
        }) : <Empty message="Aucun utilisateur." />}
      </Card>
    </>
  );
}
