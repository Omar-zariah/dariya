import { currentUser } from '@/lib/auth';
import { createMaintenance, decideQuote, advanceRequest } from '@/actions/data';
import { Card, Alert, Field, Empty, Status } from '@/components/ui';
import { dateText, t, money } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { Plus, Check, X, ShieldAlert } from 'lucide-react';

interface Property {
  id: string;
  name: string;
}

interface MaintenanceRequest {
  id: string;
  property_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface MaintenanceQuote {
  id: string;
  request_id: string;
  amount: number | string;
  scope: string;
  status: string;
  created_at: string;
}

export default async function Maintenance({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ db, profile }, lang] = await Promise.all([
    currentUser(),
    language(),
  ]);

  const [pr, rr, qr] = await Promise.all([
    db.from('properties').select('id,name').order('name'),
    db
      .from('maintenance_requests')
      .select('id,property_id,title,description,status,priority,created_at')
      .order('created_at', { ascending: false }),
    db
      .from('maintenance_quotes')
      .select('id,request_id,amount,scope,status,created_at')
      .order('created_at', { ascending: false }),
  ]);

  const properties: Property[] = (pr.data || []) as Property[];
  const requests: MaintenanceRequest[] = (rr.data || []) as MaintenanceRequest[];
  const quotes: MaintenanceQuote[] = (qr.data || []) as MaintenanceQuote[];

  return (
    <>
      <div className="topbar" style={{ alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: '#0E6658' }}>
            PROPERTY CARE & REPAIRS
          </div>
          <h1 className="heading" style={{ margin: '4px 0 6px' }}>
            {t(lang, 'maintenance')}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Track issues, verify estimates, and authorize vetted Moroccan technicians.
          </p>
        </div>

        {['owner', 'admin'].includes(profile.role) && (
          <a href="#new-maintenance" className="btn">
            <Plus size={16} />
            <span>{t(lang, 'newRequest')}</span>
          </a>
        )}
      </div>

      <Alert searchParams={await searchParams} />

      <div className="two" style={{ alignItems: 'start' }}>
        {/* Left Column: Maintenance Requests & Quotes */}
        <section className="stack" style={{ gap: 14 }}>
          <div className="card-header-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              Requests & Approvals
            </h2>
            <span className="card-count-badge">
              {requests.length} {requests.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {requests.length ? (
            requests.map((r) => {
              const prop = properties.find((p) => p.id === r.property_id);
              const relatedQuotes = quotes.filter((q) => q.request_id === r.id);

              return (
                <Card key={r.id} className="log-item" style={{ margin: 0 }}>
                  <div className="row" style={{ marginBottom: 6 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#55756C',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {prop?.name || 'PROPERTY'} · {r.priority.toUpperCase()} PRIORITY
                      </span>
                      <strong style={{ fontSize: 16, color: 'var(--ink)' }}>{r.title}</strong>
                    </div>
                    <Status value={r.status} />
                  </div>

                  <p className="muted small" style={{ margin: '0 0 10px' }}>
                    Created {dateText(r.created_at, lang)}
                  </p>

                  <p style={{ fontSize: 13.5, color: '#3A524B', margin: '0 0 12px', lineHeight: 1.6 }}>
                    {r.description}
                  </p>

                  {/* Attached Quotes */}
                  {relatedQuotes.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        marginTop: 12,
                        padding: 14,
                        background: '#FAFBF9',
                        borderRadius: 12,
                        border: '1px solid #E5EBE6',
                      }}
                    >
                      <div className="row" style={{ marginBottom: 6 }}>
                        <b style={{ fontSize: 13.5, color: 'var(--ink)' }}>
                          {t(lang, 'quote')}: {money(Number(q.amount), lang)}
                        </b>
                        <Status value={q.status} />
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>
                        {q.scope}
                      </p>

                      {q.status === 'pending' && profile.role === 'owner' && (
                        <div className="form-actions" style={{ marginTop: 10 }}>
                          <form action={decideQuote}>
                            <input type="hidden" name="quote_id" value={q.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <button className="btn" type="submit" style={{ padding: '8px 14px', fontSize: 12 }}>
                              <Check size={14} />
                              {t(lang, 'approve')}
                            </button>
                          </form>
                          <form action={decideQuote}>
                            <input type="hidden" name="quote_id" value={q.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <button
                              className="btn danger"
                              type="submit"
                              style={{ padding: '8px 14px', fontSize: 12 }}
                            >
                              <X size={14} />
                              {t(lang, 'reject')}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Owner Close Confirmation */}
                  {r.status === 'completed' && profile.role === 'owner' && (
                    <form action={advanceRequest} style={{ marginTop: 14 }}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="closed" />
                      <button className="btn" type="submit">
                        Confirm work completion & close ticket
                      </button>
                    </form>
                  )}
                </Card>
              );
            })
          ) : (
            <Empty message="No issues reported yet. Your Moroccan properties are in good standing." />
          )}
        </section>

        {/* Right Column: New Maintenance Request */}
        <section id="new-maintenance">
          <Card>
            <div className="card-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>
                {t(lang, 'newRequest')}
              </h2>
              <span className="eyebrow" style={{ color: '#0E6658' }}>
                ISSUE REPORT
              </span>
            </div>
            <p className="muted small" style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
              Report a maintenance issue or request an intervention from our vetted network of plumbers, electricians, and painters in Tangier.
            </p>

            {['owner', 'admin'].includes(profile.role) ? (
              <form action={createMaintenance} className="stack" style={{ gap: 14 }}>
                <Field name="property_id" label="Property" required>
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Field>

                <Field name="title" label="Issue Title" required placeholder="e.g. Master bathroom water heater leaking" />

                <Field name="category" label="Category">
                  <option value="plumbing">Plumbing / Sanitaire</option>
                  <option value="electrical">Electrical / Électricité</option>
                  <option value="aircon">Air conditioning / Climatisation</option>
                  <option value="painting">Painting / Peinture & Plâtre</option>
                  <option value="cleaning">Deep Cleaning / Nettoyage</option>
                  <option value="locks">Doors, windows & locks / Serrurerie</option>
                  <option value="other">Other / Autre intervention</option>
                </Field>

                <label className="field">
                  Detailed Description
                  <textarea
                    name="description"
                    rows={4}
                    required
                    minLength={8}
                    placeholder="Describe where the issue is, when it was noticed, and any special access instructions..."
                  />
                </label>

                <Field name="priority" label="Urgency">
                  <option value="normal">Normal (scheduled within 48h)</option>
                  <option value="low">Low (routine upkeep)</option>
                  <option value="urgent">Urgent (active leak or electrical risk)</option>
                </Field>

                <div
                  style={{
                    background: '#FFF9F0',
                    border: '1px solid #FDE68A',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 11.5,
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <span>
                    A request opens an investigation record. No unauthorized spending occurs until you approve a written quote.
                  </span>
                </div>

                <button disabled={!properties.length} className="btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  Submit issue report
                </button>
              </form>
            ) : (
              <p className="muted small">Owners submit new requests here. Staff view and update assigned records.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
