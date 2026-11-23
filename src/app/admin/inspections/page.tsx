import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { scheduleInspection, finishInspection, addInspectionCheck, uploadInspectionMedia, cancelInspection } from '@/actions/data';
import { ClipboardCheck, Printer, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminInspections({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const [{ data: inspections }, { data: properties }, { data: agents }] = await Promise.all([
    db.from('inspections').select('id,property_id,status,scheduled_for,agent_id,inspection_type,created_at').order('created_at', { ascending: false }),
    db.from('properties').select('id,name'),
    db.from('profiles').select('id,full_name').eq('role', 'agent'),
  ]);

  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';
  const agentName = (id: string | null) => id ? (agents || []).find(a => a.id === id)?.full_name || 'Non assigné' : 'Non assigné';
  const pending = (inspections || []).filter(i => i.status !== 'completed');

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>INSPECTIONS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={22} style={{ color: '#3B82F6' }} /> Gestion des inspections
          </h1>
          <p className="muted">Planifiez et coordonnez les visites sur le terrain.</p>
        </div>
      </div>
      <Alert searchParams={await searchParams} />

      {/* Schedule/assign */}
      <Card className="panel">
        <h2 className="section-title">Planifier / assigner une inspection</h2>
        {pending.length ? pending.map(i => (
          <div key={i.id} className="list-item">
            <div className="row">
              <div>
                <b>{propName(i.property_id)}</b>
                <p className="muted small">
                  {i.inspection_type?.replaceAll('_', ' ')} · Agent : {agentName(i.agent_id)} · {i.scheduled_for ? dateText(i.scheduled_for, lang) : 'Non planifié'}
                </p>
              </div>
              <Status value={i.status} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 10 }}>
              <form action={scheduleInspection} className="stack" style={{ flex: '1 1 300px' }}>
                <input name="inspection_id" type="hidden" value={i.id} />
                <Field name="date" label="Date planifiée" type="date" required />
                <Field name="agent_id" label="Assigner agent">
                  <option value="">Non assigné</option>
                  {(agents || []).map(a => <option key={a.id} value={a.id} selected={a.id === i.agent_id}>{a.full_name}</option>)}
                </Field>
                <button className="btn light" style={{ width: 'fit-content' }}>Planifier / Réassigner</button>
              </form>

              <form action={cancelInspection} style={{ flexShrink: 0 }}>
                <input name="inspection_id" type="hidden" value={i.id} />
                <input name="reason" type="hidden" value="Annulée par la coordination" />
                <button className="btn light" style={{ fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}>
                  <XCircle size={12} /> Annuler la visite
                </button>
              </form>
            </div>
          </div>
        )) : <Empty message="Toutes les inspections sont terminées." />}
      </Card>

      {/* Completed inspections */}
      <Card className="panel">
        <h2 className="section-title">Inspections terminées</h2>
        {(inspections || []).filter(i => i.status === 'completed').length ? (
          (inspections || []).filter(i => i.status === 'completed').map(i => (
            <div key={i.id} className="list-item">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{propName(i.property_id)}</b>
                  <p className="muted small" style={{ margin: '2px 0 0' }}>Agent : {agentName(i.agent_id)} · {dateText(i.scheduled_for, lang)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Status value={i.status} />
                  <Link
                    href={`/api/reports/inspection?id=${i.id}`}
                    target="_blank"
                    className="btn light"
                    style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Printer size={13} color="#3B82F6" /> Rapport PDF
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : <Empty message="Aucune inspection terminée." />}
      </Card>
    </>
  );
}
