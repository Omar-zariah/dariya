import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty } from '@/components/ui';
import { markAllNotificationsRead, markNotificationRead } from '@/actions/data';
import { Bell, CheckCheck, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerNotifications({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; filter?: string }>;
}) {
  const { db, user } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const { data: notifications } = await db
    .from('notifications')
    .select('id, title, body, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const all = notifications || [];
  const unread = all.filter(n => !n.read_at);
  const items = params.filter === 'unread' ? unread : all;

  // Helper to determine deep link
  const getLink = (title: string, body: string) => {
    const text = (title + ' ' + body).toLowerCase();
    if (text.includes('devis') || text.includes('travaux') || text.includes('maintenance')) {
      return { href: '/owner/maintenance', label: 'Voir la demande de maintenance' };
    }
    if (text.includes('inspection')) {
      return { href: '/owner/inspections', label: 'Consulter l\'inspection' };
    }
    if (text.includes('bien') || text.includes('propriété')) {
      return { href: '/owner/properties', label: 'Voir mes biens' };
    }
    if (text.includes('loyer') || text.includes('dépense') || text.includes('facture')) {
      return { href: '/owner/finances', label: 'Consulter mes finances' };
    }
    return null;
  };

  return (
    <>
      <div className="topbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>CENTRE DE NOTIFICATIONS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={22} style={{ color: '#C87955' }} /> Notifications & Alertes
          </h1>
          <p className="muted">Suivi en direct des événements affectant votre patrimoine immobilier au Maroc.</p>
        </div>

        {unread.length > 0 && (
          <form action={markAllNotificationsRead}>
            <button className="btn light" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <CheckCheck size={16} /> Tout marquer comme lu ({unread.length})
            </button>
          </form>
        )}
      </div>

      <Alert searchParams={params} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Link
          href="/owner/notifications"
          className="btn light"
          style={{
            fontSize: 13,
            fontWeight: !params.filter ? 700 : 500,
            background: !params.filter ? '#C8795515' : undefined,
            color: !params.filter ? '#C87955' : undefined,
            borderColor: !params.filter ? '#C87955' : undefined,
          }}
        >
          Toutes ({all.length})
        </Link>
        <Link
          href="/owner/notifications?filter=unread"
          className="btn light"
          style={{
            fontSize: 13,
            fontWeight: params.filter === 'unread' ? 700 : 500,
            background: params.filter === 'unread' ? '#C8795515' : undefined,
            color: params.filter === 'unread' ? '#C87955' : undefined,
            borderColor: params.filter === 'unread' ? '#C87955' : undefined,
          }}
        >
          Non lues ({unread.length})
        </Link>
      </div>

      <Card className="panel">
        {items.length ? (
          <div className="stack" style={{ gap: 12 }}>
            {items.map(n => {
              const isUnread = !n.read_at;
              const link = getLink(n.title, n.body);

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 8,
                    background: isUnread ? '#FFFDF8' : 'var(--surface)',
                    border: `1px solid ${isUnread ? '#FDE68A' : 'var(--line)'}`,
                    borderLeft: `4px solid ${isUnread ? '#C87955' : '#9CA3AF'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <b style={{ color: 'var(--ink)', fontSize: 14.5 }}>{n.title}</b>
                        {isUnread && (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 50,
                            background: '#C87955',
                            color: '#FFF',
                            textTransform: 'uppercase',
                          }}>
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="muted" style={{ margin: '6px 0 8px', fontSize: 13.5, lineHeight: 1.5 }}>
                        {n.body}
                      </p>
                      <div className="footnote muted">
                        {dateText(n.created_at, lang)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      {link && (
                        <Link
                          href={link.href}
                          className="btn light"
                          style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {link.label} <ArrowRight size={12} />
                        </Link>
                      )}
                      {isUnread && (
                        <form action={markNotificationRead}>
                          <input type="hidden" name="id" value={n.id} />
                          <button
                            type="submit"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--muted)',
                              cursor: 'pointer',
                              fontSize: 12,
                              textDecoration: 'underline',
                              padding: 0,
                            }}
                          >
                            Marquer comme lu
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
          <Empty message={params.filter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification pour le moment.'} />
        )}
      </Card>
    </>
  );
}
