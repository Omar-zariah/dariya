import Link from 'next/link';
import { House, Wrench, Wallet, ArrowUpRight, Plus, Bell } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { money, t, dateText } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { Card, Alert, Empty, Status } from '@/components/ui';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ db, profile }, lang] = await Promise.all([
    currentUser(),
    language(),
  ]);

  const [ps, ms, ins, rs, es, ns] = await Promise.all([
    db
      .from('properties')
      .select('id,name,city,status,occupancy,created_at')
      .order('created_at', { ascending: false }),
    db
      .from('maintenance_requests')
      .select('id,title,status,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('inspections')
      .select('id,status,inspection_type,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('rent_payments').select('amount,received_on'),
    db.from('expenses').select('amount,incurred_on'),
    db
      .from('notifications')
      .select('id,title,body,created_at')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const properties = ps.data || [];
  const requests = ms.data || [];
  const today = new Date().toISOString().slice(0, 7);
  const rent = (rs.data || [])
    .filter((x) => x.received_on.startsWith(today))
    .reduce((s, x) => s + Number(x.amount), 0);
  const expense = (es.data || [])
    .filter((x) => x.incurred_on.startsWith(today))
    .reduce((s, x) => s + Number(x.amount), 0);

  // ── Staff roles: redirect to their specific workspace ───────────────────
  if (profile.role !== 'owner') {
    const roleLabel: Record<string, string> = {
      admin: 'Admin Control Panel',
      agent: 'Agent Workspace',
      provider: 'Provider Workspace',
    };
    const roleDesc: Record<string, string> = {
      admin: 'Full platform visibility — properties, maintenance, inspections, tenants, subscriptions.',
      agent: 'Your assigned inspections and on-the-ground coordination tasks.',
      provider: 'Open work orders and quotation submissions assigned to your provider account.',
    };
    return (
      <>
        <Alert searchParams={await searchParams} />
        <div className="topbar" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow" style={{ color: '#0D604C' }}>DARIYA / STAFF PORTAL</div>
            <h1 className="heading" style={{ margin: '4px 0 6px' }}>
              Welcome, {profile.full_name?.split(' ')[0] || 'Staff'}.
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {roleDesc[profile.role]}
            </p>
          </div>
          <Link href="/app/admin" className="btn">
            <span>Open {roleLabel[profile.role]}</span>
          </Link>
        </div>

        <div className="gridcards panel">
          {[
            { label: 'Open maintenance requests', value: requests.filter(x => !['completed','closed','rejected'].includes(x.status)).length, color: '#C87955' },
            { label: 'Total properties (platform)', value: properties.length, color: '#3B82F6' },
            { label: 'Pending inspections', value: (ins.data || []).filter(i => i.status !== 'completed').length, color: '#10B981' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
              <div className="stats-number" style={{ color }}>{value}</div>
            </Card>
          ))}
        </div>

        <div className="two panel">
          <Card>
            <h2 className="section-title">Recent maintenance</h2>
            {requests.length ? requests.slice(0, 5).map(r => (
              <div className="list-item" key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <b style={{ fontSize: 14 }}>{r.title}</b>
                <Status value={r.status} />
              </div>
            )) : <Empty message="No pending requests." />}
          </Card>
          <Card>
            <h2 className="section-title">Recent inspections</h2>
            {(ins.data || []).length ? (ins.data || []).slice(0, 5).map(i => (
              <div className="list-item" key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <b style={{ fontSize: 14, textTransform: 'capitalize' }}>{i.inspection_type?.replaceAll('_', ' ') || 'Inspection'}</b>
                <Status value={i.status} />
              </div>
            )) : <Empty message="No inspections yet." />}
          </Card>
        </div>
      </>
    );
  }


  const stats = [
    {
      label: t(lang, 'properties'),
      value: String(properties.length),
      Icon: House,
      tag: 'Portfolio',
    },
    {
      label: t(lang, 'rent'),
      value: money(rent, lang),
      Icon: Wallet,
      tag: today,
    },
    {
      label: t(lang, 'expenses'),
      value: money(expense, lang),
      Icon: Wallet,
      tag: today,
    },
    {
      label: t(lang, 'pending'),
      value: String(
        requests.filter((x) => !['completed', 'closed', 'rejected'].includes(x.status)).length
      ),
      Icon: Wrench,
      tag: 'Action needed',
    },
  ];

  return (
    <>
      <div className="topbar" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ color: '#0D604C' }}>
            PORTFOLIO OVERVIEW
          </div>
          <h1 className="heading" style={{ margin: '4px 0 6px' }}>
            {t(lang, 'welcome')}, {profile.full_name?.split(' ')[0] || 'Member'}.
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Your Moroccan properties at a glance. Real recorded transactions and on-the-ground proof.
          </p>
        </div>

        <Link href="/app/properties" className="btn">
          <Plus size={16} />
          <span>{t(lang, 'newProperty')}</span>
        </Link>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Metrics Row */}
      <div className="gridcards panel">
        {stats.map(({ label, value, Icon, tag }) => (
          <Card key={label}>
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#E8F5EE',
                  color: '#0D604C',
                }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="stats-number" style={{ color: 'var(--ink)' }}>
              {value}
            </div>
            <span className="footnote" style={{ color: '#7E968F' }}>
              {tag}
            </span>
          </Card>
        ))}
      </div>

      {/* Properties & Maintenance Side by Side */}
      <div className="two panel">
        <Card>
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              {t(lang, 'properties')}
            </h2>
            <Link
              href="/app/properties"
              className="muted small"
              style={{ fontWeight: 700, color: '#0D604C' }}
            >
              {t(lang, 'seeAll')} ↗
            </Link>
          </div>

          {properties.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {properties.map((p) => (
                <Link
                  href={'/app/properties/' + p.id}
                  key={p.id}
                  className="log-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}
                >
                  <div>
                    <b style={{ color: 'var(--ink)', fontSize: 14 }}>{p.name}</b>
                    <p className="muted small" style={{ margin: '3px 0 0' }}>
                      {p.city} · {p.occupancy}
                    </p>
                  </div>
                  <Status value={p.status} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No properties registered. Add your first home or apartment in Tangier to get started." />
          )}
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              {t(lang, 'maintenance')}
            </h2>
            <Link
              href="/app/maintenance"
              className="muted small"
              style={{ fontWeight: 700, color: '#0D604C' }}
            >
              {t(lang, 'seeAll')} ↗
            </Link>
          </div>

          {requests.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {requests.map((r) => (
                <div
                  className="log-item"
                  key={r.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}
                >
                  <div>
                    <b style={{ color: 'var(--ink)', fontSize: 14 }}>{r.title}</b>
                    <div className="muted small" style={{ margin: '3px 0 0' }}>
                      {dateText(r.created_at, lang)}
                    </div>
                  </div>
                  <Status value={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <Empty message="No pending maintenance requests." />
          )}
        </Card>
      </div>

      {/* Recent Inspections Card */}
      <Card className="panel">
        <div className="row" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              Recent inspections
            </h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Time-stamped photographic evidence and checklist reports from our licensed technicians.
            </p>
          </div>
          <Link href="/app/inspections" className="btn light">
            {t(lang, 'view')} <ArrowUpRight size={15} />
          </Link>
        </div>

        {(ins.data || []).length ? (
          <div className="stack" style={{ gap: 8 }}>
            {(ins.data || []).map((i) => (
              <div
                key={i.id}
                className="log-item"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', margin: 0 }}
              >
                <div>
                  <b style={{ color: 'var(--ink)', fontSize: 14, textTransform: 'capitalize' }}>
                    {i.inspection_type === 'basic'
                      ? 'Monthly vacancy check'
                      : i.inspection_type.replaceAll('_', ' ') + ' check'}
                  </b>
                  <p className="muted small" style={{ margin: '3px 0 0' }}>
                    Requested {dateText(i.created_at, lang)}
                  </p>
                </div>
                <Status value={i.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No inspections requested yet." />
        )}
      </Card>

      {/* Notifications Card */}
      <Card className="panel">
        <div className="row" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} style={{ color: '#0D604C' }} />
            <h2 className="section-title" style={{ margin: 0 }}>
              Notifications & Updates
            </h2>
          </div>
        </div>
        {ns.data?.length ? (
          <div className="stack" style={{ gap: 8 }}>
            {ns.data.map((n) => (
              <div className="log-item" key={n.id} style={{ margin: 0, padding: '14px 16px' }}>
                <b style={{ color: 'var(--ink)', fontSize: 13.5 }}>{n.title}</b>
                <p className="muted small" style={{ margin: '4px 0' }}>
                  {n.body}
                </p>
                <span className="footnote" style={{ color: '#7E968F' }}>
                  {dateText(n.created_at, lang)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No notifications." />
        )}
      </Card>
    </>
  );
}
