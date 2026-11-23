import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Field, Status } from '@/components/ui';
import { addSupportTicket } from '@/actions/data';
import { MessageCircle } from 'lucide-react';

export default async function OwnerSupport({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const { data: tickets } = await db
    .from('support_tickets')
    .select('id,subject,body,status,created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>SUPPORT</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={22} style={{ color: '#C87955' }} /> Centre d&apos;assistance
          </h1>
          <p className="muted">Contactez l&apos;équipe DARIYA pour toute question ou problème.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* New ticket */}
      <Card className="panel">
        <h2 className="section-title">Ouvrir un ticket</h2>
        <form action={addSupportTicket} className="stack">
          <Field name="subject" label="Sujet" required placeholder="Ex: Question sur ma facture" />
          <label className="field">
            Description
            <textarea name="body" required rows={4} placeholder="Décrivez votre problème en détail..."
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, resize: 'vertical', background: 'var(--surface)' }} />
          </label>
          <div><button className="btn">Envoyer</button></div>
        </form>
      </Card>

      {/* Existing tickets */}
      <Card className="panel">
        <h2 className="section-title">Mes tickets ({tickets?.length ?? 0})</h2>
        {tickets?.length ? tickets.map(t => (
          <div key={t.id} className="list-item">
            <div className="row">
              <b>{t.subject}</b><Status value={t.status} />
            </div>
            <p className="muted small">{dateText(t.created_at, lang)}</p>
            <p className="muted small">{t.body?.slice(0, 100)}</p>
          </div>
        )) : <Empty message="Aucun ticket ouvert pour le moment." />}
      </Card>
    </>
  );
}
