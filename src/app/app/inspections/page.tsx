import { currentUser } from '@/lib/auth';
import {
  requestInspection,
  finishInspection,
  addInspectionCheck,
  uploadInspectionMedia,
} from '@/actions/data';
import { Card, Field, Alert, Status, Empty } from '@/components/ui';
import { dateText, t } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { Plus } from 'lucide-react';

export default async function Inspections({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; new?: string }>;
}) {
  const [{ db, profile, user }, lang] = await Promise.all([
    currentUser(),
    language(),
  ]);
  const [pr, ir, check, media] = await Promise.all([
    db.from('properties').select('id,name,property_type'),
    db.from('inspections').select('*').order('created_at', { ascending: false }),
    db.from('inspection_checklists').select('*'),
    db.from('inspection_media').select('*'),
  ]);

  const properties = pr.data || [];
  const inspections = ir.data || [];
  const evidence = await Promise.all(
    (media.data || []).map(async (m) => ({
      ...m,
      url: (
        await db.storage
          .from('inspection-evidence')
          .createSignedUrl(m.storage_path, 300)
      ).data?.signedUrl,
    }))
  );

  return (
    <>
      {/* Top Page Header */}
      <div className="topbar" style={{ alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: '#0D604C' }}>
            EVIDENCE FIRST
          </div>
          <h1 className="heading" style={{ margin: '4px 0 6px' }}>
            Inspections & reports
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Proof of property condition, findings, and follow-up actions.
          </p>
        </div>

        {['owner', 'admin'].includes(profile.role) && (
          <a href="#request-inspection" className="btn">
            <Plus size={16} />
            <span>Request inspection</span>
          </a>
        )}
      </div>

      <Alert searchParams={await searchParams} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Main Property Inspection Log Card */}
        <Card>
          <div className="card-header-row">
            <h2 className="section-title" style={{ margin: 0, fontSize: 18 }}>
              Property inspection log
            </h2>
            <span className="card-count-badge">
              {inspections.length} {inspections.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {inspections.length ? (
            <div>
              {inspections.map((i) => {
                const property = properties.find((p) => p.id === i.property_id);
                const propLabel = property ? property.name.toUpperCase() : 'COASTAL APARTMENT';
                const formattedDate = dateText(i.created_at, lang).toUpperCase();
                const canWork =
                  ['admin', 'agent'].includes(profile.role) &&
                  i.status !== 'completed' &&
                  i.status !== 'cancelled' &&
                  (profile.role === 'admin' || i.agent_id === user.id);

                const itemChecks = (check.data || []).filter((c) => c.inspection_id === i.id);
                const itemEvidence = evidence.filter((m) => m.inspection_id === i.id);

                return (
                  <div key={i.id} className="log-item">
                    {/* Header Row: Date · Property & Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#55756C',
                        }}
                      >
                        {formattedDate} · {propLabel}
                      </span>
                      <Status value={i.status} />
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        margin: '0 0 10px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {i.inspection_type === 'basic'
                        ? 'Monthly vacancy check'
                        : i.inspection_type.replaceAll('_', ' ') + ' check'}
                    </h3>

                    {/* Findings & Evidence */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      <div style={{ color: '#4B635C' }}>
                        <strong style={{ color: 'var(--ink)' }}>Finding: </strong>
                        <span>{i.findings || 'No anomalies recorded yet'}</span>
                      </div>

                      <div style={{ color: '#4B635C' }}>
                        <strong style={{ color: 'var(--ink)' }}>Evidence record: </strong>
                        {itemEvidence.length ? (
                          <span>
                            {itemEvidence.map((m, idx) => (
                              <span key={m.id}>
                                {idx > 0 && ', '}
                                {m.url ? (
                                  <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#0D604C', textDecoration: 'underline' }}
                                  >
                                    {m.caption || `Evidence #${idx + 1}`}
                                  </a>
                                ) : (
                                  m.caption || 'Restricted file'
                                )}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span style={{ color: '#7E968F' }}>
                            Bathroom moisture readings and 7 labeled inspection photos (demo descriptions only).
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checklist observations if present */}
                    {itemChecks.length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: '1px solid #EAEFEA',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 12,
                          fontSize: 12,
                        }}
                      >
                        {itemChecks.map((c) => (
                          <div key={c.area} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                              {c.area.replaceAll('_', ' ')}:
                            </span>
                            <Status value={c.condition} />
                            {c.notes && <span style={{ color: 'var(--muted)' }}>({c.notes})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin/Agent workflow */}
                    {canWork && (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 14,
                          borderTop: '1px dashed #CAD6CF',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                        }}
                      >
                        <form action={addInspectionCheck} className="stack" style={{ gap: 8 }}>
                          <input type="hidden" name="inspection_id" value={i.id} />
                          <div className="fields">
                            <Field name="area" label="Inspection area">
                              <option value="entrance">Entrance</option>
                              <option value="living_room">Living room</option>
                              <option value="kitchen">Kitchen</option>
                              <option value="bathroom">Bathroom</option>
                              <option value="bedrooms">Bedrooms</option>
                              <option value="windows">Windows</option>
                              <option value="doors">Doors</option>
                              <option value="electricity">Electricity</option>
                              <option value="plumbing">Plumbing</option>
                              <option value="general">General</option>
                            </Field>
                            <Field name="condition" label="Condition">
                              <option value="good">Good</option>
                              <option value="attention">Needs attention</option>
                              <option value="critical">Critical</option>
                              <option value="not_checked">Not checked</option>
                            </Field>
                          </div>
                          <Field name="notes" label="Observation" />
                          <button className="btn light" style={{ alignSelf: 'flex-start' }}>
                            Save checklist item
                          </button>
                        </form>

                        <form action={uploadInspectionMedia} className="stack" style={{ gap: 8 }}>
                          <input type="hidden" name="inspection_id" value={i.id} />
                          <label className="field">
                            Photo or PDF evidence
                            <input
                              type="file"
                              name="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              required
                            />
                          </label>
                          <Field name="caption" label="Caption" />
                          <button className="btn light" style={{ alignSelf: 'flex-start' }}>
                            Upload evidence
                          </button>
                        </form>

                        <form action={finishInspection} className="stack" style={{ gap: 8 }}>
                          <input type="hidden" name="inspection_id" value={i.id} />
                          <label className="field">
                            Verified inspection findings
                            <textarea
                              name="findings"
                              rows={3}
                              minLength={5}
                              required
                              placeholder="Record observations from the actual visit"
                            />
                          </label>
                          <button className="btn" style={{ alignSelf: 'flex-start' }}>
                            Publish report
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="No property inspections registered yet. Click 'Request inspection' above to schedule one." />
          )}
        </Card>

        {/* Disclaimer Banner — Exactly matching screenshot */}
        <div className="disclaimer-banner">
          Demo evidence is text only. Production inspections should include time-stamped original
          photos/video, verifier identity, access controls and tamper-resistant storage.
        </div>

        {/* Request Inspection Section */}
        {['owner', 'admin'].includes(profile.role) && (
          <div id="request-inspection">
            <Card>
              <div className="card-header-row">
                <h2 className="section-title" style={{ margin: 0, fontSize: 18 }}>
                  Request an inspection
                </h2>
                <span className="eyebrow" style={{ color: '#0D604C' }}>
                  SCHEDULE VISIT
                </span>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
                Our licensed local team in Tangier inspects every room, checks locks and plumbing,
                and generates timestamped evidence records for your peace of mind.
              </p>

              <form action={requestInspection} className="stack" style={{ maxWidth: 640 }}>
                <Field name="property_id" label="Property" required>
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Field>

                <Field name="inspection_type" label="Inspection Type">
                  <option value="basic">Basic vacancy check (monthly)</option>
                  <option value="detailed">Detailed deep-inspection</option>
                  <option value="move_in">Move-in tenant inspection</option>
                  <option value="move_out">Move-out tenant inspection</option>
                  <option value="maintenance">Post-maintenance verification</option>
                </Field>

                <button
                  type="submit"
                  className="btn"
                  disabled={!properties.length}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                  <Plus size={16} />
                  Submit inspection request
                </button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
