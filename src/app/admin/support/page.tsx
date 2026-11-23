import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { updateTicketStatus } from '@/actions/data';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const { data: tickets } = await db
    .from('support_tickets')
    .select('id, subject, body, status, created_at, user_id, profiles(full_name, role)')
    .order('created_at', { ascending: false });

  const openTickets = tickets?.filter(t => t.status === 'open') ?? [];
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress') ?? [];
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved') ?? [];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#2563EB' }}>SUPPORT & TICKETS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={22} style={{ color: '#2563EB' }} /> Support Client & Réclamations
          </h1>
          <p className="muted">Gérez et répondez aux demandes d&apos;assistance de tous les utilisateurs de la plateforme.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Stats summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Card className="panel" style={{ padding: 18, borderLeft: '4px solid #EF4444' }}>
          <div className="small muted">Tickets Ouverts</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#EF4444' }}>{openTickets.length}</div>
        </Card>
        <Card className="panel" style={{ padding: 18, borderLeft: '4px solid #F59E0B' }}>
          <div className="small muted">En Cours</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{inProgressTickets.length}</div>
        </Card>
        <Card className="panel" style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
          <div className="small muted">Résolus</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10B981' }}>{resolvedTickets.length}</div>
        </Card>
      </div>

      {/* Tickets queue */}
      <Card className="panel">
        <h2 className="section-title">File des demandes ({tickets?.length ?? 0})</h2>
        {tickets && tickets.length > 0 ? (
          <div className="stack" style={{ gap: 16 }}>
            {tickets.map(t => {
              const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
              return (
                <div key={t.id} className="list-item" style={{ borderLeft: `4px solid ${t.status === 'open' ? '#EF4444' : t.status === 'in_progress' ? '#F59E0B' : '#10B981'}`, padding: '16px 20px', borderRadius: 8 }}>
                  <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{t.subject}</span>
                        <Status value={t.status} />
                      </div>
                      <div className="small muted" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                        <span>Demandeur : <strong>{prof?.full_name ?? 'Utilisateur'}</strong> ({prof?.role ?? 'client'})</span>
                        <span>•</span>
                        <span>Date : {dateText(t.created_at, lang)}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 6, lineHeight: 1.5 }}>
                        {t.body}
                      </div>
                    </div>

                    <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <form action={updateTicketStatus} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input type="hidden" name="ticket_id" value={t.id} />
                        <label className="small muted">Mettre à jour le statut</label>
                        <select name="status" defaultValue={t.status}
                          style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--surface)' }}>
                          <option value="open">Ouvert</option>
                          <option value="in_progress">En cours</option>
                          <option value="resolved">Résolu</option>
                        </select>
                        <button className="btn" style={{ padding: '6px 12px', fontSize: 12, alignSelf: 'flex-start' }}>Enregistrer</button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucun ticket d'assistance enregistré." />
        )}
      </Card>
    </>
  );
}
