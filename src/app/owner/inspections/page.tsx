import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { requestInspection } from '@/actions/data';
import { ClipboardCheck, CheckCircle2, Clock, Camera, FileText, Printer } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerInspections({
  searchParams,
}: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();

  const [{ data: properties }, { data: inspections }] = await Promise.all([
    db.from('properties').select('id,name').order('name'),
    db.from('inspections')
      .select('id,property_id,inspection_type,status,scheduled_for,created_at,completed_at,findings,report')
      .order('created_at', { ascending: false }),
  ]);

  // Fetch checklist summaries for completed inspections
  const completedIds = (inspections || []).filter(i => i.status === 'completed').map(i => i.id);
  let mediaList: any[] = [];
  let checklistItems: any[] = [];

  if (completedIds.length > 0) {
    const [{ data: mData }, { data: cData }] = await Promise.all([
      db.from('inspection_media').select('id,inspection_id,caption,storage_path,created_at').in('inspection_id', completedIds),
      db.from('inspection_checklists').select('id,inspection_id,area,condition,notes').in('inspection_id', completedIds),
    ]);
    mediaList = mData ?? [];
    checklistItems = cData ?? [];
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>INSPECTIONS & AUDITS</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={22} style={{ color: '#C87955' }} /> Inspections & États des lieux
          </h1>
          <p className="muted">Commandez des inspections sur place à Tanger et consultez les comptes-rendus techniques documentés avec photos horodatées.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Request inspection */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={18} style={{ color: '#C87955' }} /> Demander une nouvelle inspection
        </h2>
        <form action={requestInspection} className="fields">
          <Field name="property_id" label="Bien à inspecter" required>
            <option value="">Sélectionner un bien</option>
            {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Field>
          <Field name="inspection_type" label="Type d'intervention">
            <option value="basic">Vérification mensuelle de vacance</option>
            <option value="detailed">Audit technique complet (10 zones)</option>
            <option value="move_in">État des lieux d&apos;entrée locataire</option>
            <option value="move_out">État des lieux de sortie locataire</option>
            <option value="maintenance">Contrôle post-travaux artisan</option>
          </Field>
          <div>
            <button className="btn">Transmettre la demande d&apos;inspection</button>
          </div>
        </form>
      </Card>

      {/* Inspection list */}
      <Card className="panel">
        <h2 className="section-title">Historique des inspections ({inspections?.length ?? 0})</h2>
        {inspections && inspections.length > 0 ? (
          <div className="stack" style={{ gap: 16 }}>
            {inspections.map(i => {
              const prop = (properties || []).find(p => p.id === i.property_id);
              const myMedia = mediaList.filter(m => m.inspection_id === i.id);
              const myChecks = checklistItems.filter(c => c.inspection_id === i.id);

              return (
                <div key={i.id} className="list-item" style={{ padding: '16px 20px', borderRadius: 10 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
                        {i.inspection_type === 'basic' ? 'Vérification mensuelle' : i.inspection_type?.replaceAll('_', ' ')}
                      </span>
                      <span className="small muted" style={{ marginLeft: 8 }}>
                        — {prop?.name || 'Bien immobilier'}
                      </span>
                    </div>
                    <Status value={i.status} />
                  </div>

                  <p className="small muted" style={{ margin: '4px 0 10px' }}>
                    {i.status === 'completed' && i.completed_at
                      ? `Réalisée et clôturée le ${dateText(i.completed_at, lang)}`
                      : i.scheduled_for
                      ? `Planifiée pour le ${dateText(i.scheduled_for, lang)}`
                      : `Demandée le ${dateText(i.created_at, lang)}`}
                  </p>

                  {/* If completed, show findings report */}
                  {(i.findings || i.report) && (
                    <div style={{
                      background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8,
                      borderLeft: '3px solid #10B981', marginTop: 10, fontSize: 13.5, lineHeight: 1.5,
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#065F46' }}>
                        <FileText size={15} /> Conclusions de l&apos;inspecteur :
                      </div>
                      <p style={{ margin: 0, color: 'var(--text)' }}>{i.findings || i.report}</p>
                    </div>
                  )}

                  {/* Checklist summary pills if available */}
                  {myChecks.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div className="small muted" style={{ fontWeight: 600, marginBottom: 6 }}>Points de contrôle validés ({myChecks.length}/10) :</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {myChecks.map(c => (
                          <span key={c.id} style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11.5,
                            background: c.condition === 'good' ? '#DEF7EC' : c.condition === 'attention' ? '#FEF3C7' : '#FEE2E2',
                            color: c.condition === 'good' ? '#03543F' : c.condition === 'attention' ? '#92400E' : '#991B1B',
                            fontWeight: 600, textTransform: 'capitalize'
                          }}>
                            {c.area?.replaceAll('_', ' ')} : {c.condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence media indicators */}
                  {myMedia.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                      <Camera size={14} color="#10B981" />
                      <span>{myMedia.length} photographie(s) justificative(s) horodatée(s) et archivée(s)</span>
                    </div>
                  )}

                  {/* Certified report download / print link */}
                  {i.status === 'completed' && (
                    <div style={{ marginTop: 14 }}>
                      <Link
                        href={`/api/reports/inspection?id=${i.id}`}
                        target="_blank"
                        className="btn light"
                        style={{ fontSize: 12.5, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#142B3B', borderColor: '#142B3B30' }}
                      >
                        <Printer size={14} color="#C87955" /> Consulter & Imprimer le Compte-Rendu Technique (PDF)
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucune inspection demandée pour le moment." />
        )}
      </Card>
    </>
  );
}
