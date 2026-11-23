import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { addInspectionCheck, uploadInspectionMedia, finishInspection, createMaintenanceFromInspection } from '@/actions/data';
import { ClipboardCheck, Camera, CheckCircle2, AlertTriangle, Building2, MapPin, Wrench, Printer } from 'lucide-react';
import Link from 'next/link';

const AREAS = [
  { id: 'entrance', label: '1. Entrée & Hall' },
  { id: 'living_room', label: '2. Salon & Séjour' },
  { id: 'kitchen', label: '3. Cuisine & Équipements' },
  { id: 'bathroom', label: '4. Salle de bain & WC' },
  { id: 'bedrooms', label: '5. Chambres à coucher' },
  { id: 'windows', label: '6. Fenêtres & Volets' },
  { id: 'doors', label: '7. Portes & Serrures' },
  { id: 'electricity', label: '8. Électricité & Prises' },
  { id: 'plumbing', label: '9. Plomberie & Évacuation' },
  { id: 'general', label: '10. État Général & Murs' },
];

export default async function AgentInspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string; error?: string; notice?: string }>;
}) {
  const { user, db } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  // Fetch inspections assigned to this agent
  const { data: inspections } = await db
    .from('inspections')
    .select('id, scheduled_for, status, report, findings, property_id, properties(id, name, address, city)')
    .eq('agent_id', user.id)
    .order('scheduled_for', { ascending: false });

  const selectedId = params.selected || inspections?.[0]?.id;
  const currentInspection = inspections?.find(i => i.id === selectedId);

  // If we have an active inspection, fetch checklist items and media
  let checklists: Array<{ id: string; area: string; condition: string; notes: string }> = [];
  let media: Array<{ id: string; caption: string; storage_path: string; created_at: string }> = [];

  if (currentInspection) {
    const { data: cData } = await db
      .from('inspection_checklists')
      .select('id, area, condition, notes')
      .eq('inspection_id', currentInspection.id);
    checklists = cData ?? [];

    const { data: mData } = await db
      .from('inspection_media')
      .select('id, caption, storage_path, created_at')
      .eq('inspection_id', currentInspection.id);
    media = mData ?? [];
  }

  const checklistMap = new Map(checklists.map(c => [c.area, c]));

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#10B981' }}>INSPECTIONS TERRAIN</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={22} style={{ color: '#10B981' }} /> Fiche d&apos;Inspection Technique
          </h1>
          <p className="muted">Exécutez les 10 points de contrôle, capturez les photos justificatives et finalisez le rapport.</p>
        </div>
      </div>

      <Alert searchParams={params} />

      {/* Select inspection */}
      {inspections && inspections.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
          {inspections.map(i => {
            const p = Array.isArray(i.properties) ? i.properties[0] : i.properties;
            const isSel = i.id === selectedId;
            return (
              <Link
                key={i.id}
                href={`/agent/inspections?selected=${i.id}`}
                className="btn light"
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  borderColor: isSel ? '#10B981' : undefined,
                  background: isSel ? 'rgba(16,185,129,0.08)' : undefined,
                  color: isSel ? '#059669' : undefined,
                  fontWeight: isSel ? 700 : 500,
                }}
              >
                {p?.name || 'Bien'} ({i.status})
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty message="Aucune inspection ne vous est attribuée." />
      )}

      {currentInspection && (
        <div className="stack" style={{ gap: 24 }}>
          {/* Inspection details card */}
          {(() => {
            const prop = Array.isArray(currentInspection.properties) ? currentInspection.properties[0] : currentInspection.properties;
            return (
              <Card className="panel" style={{ borderLeft: '4px solid #10B981' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>{prop?.name}</h2>
                    <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} /> {prop?.address}, {prop?.city}
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      Date prévue : <strong>{currentInspection.scheduled_for ? dateText(currentInspection.scheduled_for, lang) : 'Non définie'}</strong>
                    </div>
                  </div>
                  <Status value={currentInspection.status} />
                </div>
              </Card>
            );
          })()}

          {/* 10 Checklist points */}
          <Card className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>Grille des 10 points de contrôle</h2>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  Progression : <strong>{checklists.length} / 10 vérifiés</strong> (tous obligatoires pour clôturer)
                </p>
              </div>
            </div>

            <div className="stack" style={{ gap: 14 }}>
              {AREAS.map(area => {
                const item = checklistMap.get(area.id);
                return (
                  <div
                    key={area.id}
                    style={{
                      padding: '14px 16px',
                      background: item ? 'var(--surface-2)' : 'var(--surface)',
                      border: `1.5px solid ${item ? 'var(--line)' : 'var(--line)'}`,
                      borderLeft: `4px solid ${
                        item?.condition === 'good'
                          ? '#10B981'
                          : item?.condition === 'attention'
                          ? '#F59E0B'
                          : item?.condition === 'critical'
                          ? '#EF4444'
                          : '#9CA3AF'
                      }`,
                      borderRadius: 8,
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{area.label}</span>
                      {item ? (
                        <span className="small" style={{ fontWeight: 700, textTransform: 'uppercase', color: item.condition === 'good' ? '#10B981' : item.condition === 'attention' ? '#F59E0B' : '#EF4444' }}>
                          ✓ {item.condition}
                        </span>
                      ) : (
                        <span className="small muted">À vérifier</span>
                      )}
                    </div>

                    <form action={addInspectionCheck} className="row" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <input type="hidden" name="inspection_id" value={currentInspection.id} />
                      <input type="hidden" name="area" value={area.id} />

                      <div style={{ flex: '1 1 140px' }}>
                        <label className="small muted">État constaté</label>
                        <select name="condition" defaultValue={item?.condition || 'good'} style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--surface)' }}>
                          <option value="good">Bon état (Conforme)</option>
                          <option value="attention">À surveiller (Usure)</option>
                          <option value="critical">Critique (Défaut urgent)</option>
                          <option value="not_checked">Non applicable</option>
                        </select>
                      </div>

                      <div style={{ flex: '3 1 240px' }}>
                        <label className="small muted">Remarques / Observations</label>
                        <input
                          type="text"
                          name="notes"
                          defaultValue={item?.notes || ''}
                          placeholder="Ex: Légère trace d'humidité, joints sains..."
                          style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--surface)' }}
                        />
                      </div>

                      <button className="btn" style={{ padding: '6px 14px', fontSize: 13, background: '#10B981', borderColor: '#059669' }}>
                        Enregistrer
                      </button>
                    </form>

                    {item && (item.condition === 'attention' || item.condition === 'critical') && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                        <form action={createMaintenanceFromInspection}>
                          <input type="hidden" name="inspection_id" value={currentInspection.id} />
                          <input type="hidden" name="property_id" value={currentInspection.property_id} />
                          <input type="hidden" name="area" value={area.id} />
                          <input type="hidden" name="condition" value={item.condition} />
                          <input type="hidden" name="notes" value={item.notes || ''} />
                          <button
                            className="btn light"
                            style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: item.condition === 'critical' ? '#DC2626' : '#D97706',
                              borderColor: item.condition === 'critical' ? '#FCA5A5' : '#FDE68A',
                              background: item.condition === 'critical' ? '#FEF2F2' : '#FFFBEB',
                            }}
                          >
                            <Wrench size={13} />
                            ✦ Convertir cette anomalie ({item.condition}) en demande de maintenance
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Media & Evidence */}
          <div className="grid-2">
            <Card className="panel">
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="#10B981" /> Photos & Preuves de visite ({media.length})
              </h2>
              <form action={uploadInspectionMedia} className="stack">
                <input type="hidden" name="inspection_id" value={currentInspection.id} />
                <Field name="caption" label="Légende de la photo" placeholder="Ex: Compteur d'eau, salon sud..." required />
                <label className="field">
                  Fichier photo (JPEG, PNG, WebP)
                  <input type="file" name="file" accept="image/*,application/pdf" required style={{ fontSize: 13, marginTop: 4 }} />
                </label>
                <div>
                  <button className="btn" style={{ background: '#10B981', borderColor: '#059669', fontSize: 13 }}>
                    Téléverser la photo
                  </button>
                </div>
              </form>

              {media.length > 0 && (
                <div className="stack" style={{ gap: 8, marginTop: 16 }}>
                  {media.map(m => (
                    <div key={m.id} className="list-item" style={{ padding: '8px 12px', fontSize: 13 }}>
                      <strong>{m.caption}</strong>
                      <span className="small muted" style={{ display: 'block' }}>{dateText(m.created_at, lang)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Finalization card */}
            <Card className="panel" style={{ border: currentInspection.status === 'completed' ? '1.5px solid #10B981' : undefined }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color={currentInspection.status === 'completed' ? '#10B981' : '#F59E0B'} />
                {currentInspection.status === 'completed' ? 'Rapport Finalisé' : 'Clôture du Rapport'}
              </h2>

              {currentInspection.status === 'completed' ? (
                <div className="stack" style={{ gap: 10 }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', padding: '12px 14px', borderRadius: 8, fontSize: 14 }}>
                    ✓ Cette inspection a été validée et clôturée. Le rapport est accessible par le propriétaire.
                  </div>
                  <div>
                    <strong>Conclusions enregistrées :</strong>
                    <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text)', background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                      {currentInspection.findings || currentInspection.report}
                    </p>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Link
                      href={`/api/reports/inspection?id=${currentInspection.id}`}
                      target="_blank"
                      className="btn light"
                      style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                    >
                      <Printer size={15} color="#10B981" /> Imprimer / Exporter le Compte-Rendu Technique (PDF)
                    </Link>
                  </div>
                </div>
              ) : (
                <form action={finishInspection} className="stack">
                  <input type="hidden" name="inspection_id" value={currentInspection.id} />
                  <p className="small muted">
                    Conditions requises : 10/10 points de contrôle enregistrés et au moins 1 photo justificative téléversée.
                  </p>
                  <label className="field">
                    Synthèse & Conclusions Générales
                    <textarea
                      name="findings"
                      required
                      rows={5}
                      placeholder="Indiquez ici l'état général du logement, les réparations éventuelles à prévoir, et votre avis technique..."
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}
                    />
                  </label>
                  <div>
                    <button
                      className="btn"
                      disabled={checklists.length < 10 || media.length === 0}
                      style={{
                        background: (checklists.length === 10 && media.length > 0) ? '#10B981' : '#9CA3AF',
                        borderColor: (checklists.length === 10 && media.length > 0) ? '#059669' : '#9CA3AF',
                        cursor: (checklists.length === 10 && media.length > 0) ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Valider et clôturer l&apos;inspection
                    </button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
