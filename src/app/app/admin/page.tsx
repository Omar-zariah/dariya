import { currentUser } from '@/lib/auth';
import { Card, Field, Alert, Empty, Status } from '@/components/ui';
import {
  createQuote, createExpense, recordRent, addProvider, assignProvider,
  verifyProvider, approveProperty, scheduleInspection, setPlanPrice,
  advanceRequest, addTenant, addContract, setSubscription,
} from '@/actions/data';
import { dateText, money } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import {
  ShieldCheck, Users, Building2, ClipboardList, Wrench,
  CheckCircle2, UserCheck, Banknote, Receipt, FileText, Star,
} from 'lucide-react';

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { db, profile } = await currentUser();
  if (!['admin', 'agent', 'provider'].includes(profile.role))
    return (
      <div role="alert" style={{ padding: 32, color: 'var(--ink)' }}>
        <h2>Access denied.</h2>
        <p className="muted">This area is restricted to staff accounts.</p>
      </div>
    );

  const lang = await language();
  const isAdmin = profile.role === 'admin';
  const isAgent = profile.role === 'agent';
  const isProvider = profile.role === 'provider';

  // ── Shared data (each query is scoped by RLS) ────────────────────────────
  const [properties, requests, quotes, inspections, providers, agents, plans, tenants, tickets, ownerProfiles, subscriptions] =
    await Promise.all([
      db.from('properties').select('id,name,city,owner_id,status').order('created_at', { ascending: false }),
      db.from('maintenance_requests').select('id,title,status,property_id,priority').order('created_at', { ascending: false }),
      db.from('maintenance_quotes').select('id,request_id,status,amount'),
      db.from('inspections').select('id,property_id,status,scheduled_for,agent_id').order('created_at', { ascending: false }),
      db.from('service_providers').select('id,business_name,specialty,verified,profile_id'),
      db.from('profiles').select('id,full_name,role').eq('role', 'agent'),
      db.from('subscription_plans').select('*'),
      db.from('tenants').select('id,property_id,full_name'),
      db.from('support_tickets').select('id,subject,status,user_id'),
      db.from('profiles').select('id,full_name,role').eq('role', 'owner'),
      db.from('subscriptions').select('id,status,plan_id'),
    ]);

  const ps = properties.data || [];
  const rs = requests.data || [];
  const qs = quotes.data || [];
  const ins = inspections.data || [];
  const sps = providers.data || [];

  // ════════════════════════════════════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ════════════════════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <>
        {/* Header */}
        <div className="topbar">
          <div>
            <div className="eyebrow">DARIYA / ADMINISTRATION</div>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={24} style={{ color: '#C87955' }} /> Admin Control Panel
            </h1>
            <p className="muted">Full platform visibility. All actions are double-enforced by Postgres RLS.</p>
          </div>
          <Status value="admin" />
        </div>

        <Alert searchParams={await searchParams} />

        {/* KPI row */}
        <div className="gridcards panel">
          {[
            { label: 'Owners', value: ownerProfiles.data?.length ?? 0, Icon: Users, color: '#3B82F6' },
            { label: 'Properties', value: ps.length, Icon: Building2, color: '#10B981' },
            { label: 'Active subscriptions', value: subscriptions.data?.filter(s => s.status === 'active').length ?? 0, Icon: Star, color: '#F59E0B' },
            { label: 'Open support cases', value: tickets.data?.filter(x => x.status !== 'resolved').length ?? 0, Icon: ClipboardList, color: '#EF4444' },
          ].map(({ label, value, Icon, color }) => (
            <Card key={label}>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: color + '18', color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="stats-number">{value}</div>
            </Card>
          ))}
        </div>

        {/* Maintenance queue */}
        <div className="two panel">
          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={16} style={{ color: '#C87955' }} /> Maintenance queue
            </h2>
            {rs.length ? rs.map(r => (
              <div className="list-item" key={r.id}>
                <div className="row">
                  <b>{r.title}</b><Status value={r.status} />
                </div>
                <p className="muted small">{ps.find(x => x.id === r.property_id)?.name || 'Property'} · {r.priority}</p>
                {qs.filter(q => q.request_id === r.id).map(q => (
                  <p key={q.id} className="small">Quote {money(Number(q.amount), lang)} · <Status value={q.status} /></p>
                ))}
                <div className="form-actions">
                  {r.status === 'submitted' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="reviewed" />
                      <button className="btn light">Mark reviewed</button>
                    </form>
                  )}
                  {r.status === 'approved' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="in_progress" />
                      <button className="btn light">Start approved work</button>
                    </form>
                  )}
                  {r.status === 'in_progress' && (
                    <form action={advanceRequest}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="next_status" value="completed" />
                      <button className="btn light">Mark complete</button>
                    </form>
                  )}
                </div>
              </div>
            )) : <Empty />}
          </Card>

          {/* Inspection schedule */}
          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#3B82F6' }} /> Inspection schedule
            </h2>
            {ins.length ? ins.map(i => (
              <div className="list-item" key={i.id}>
                <div className="row">
                  <b>{ps.find(p => p.id === i.property_id)?.name || 'Property'}</b>
                  <Status value={i.status} />
                </div>
                <p className="muted small">{dateText(i.scheduled_for, lang)}</p>
                {i.status !== 'completed' && (
                  <form action={scheduleInspection} className="stack">
                    <input name="inspection_id" type="hidden" value={i.id} />
                    <Field name="date" label="Scheduled date" type="date" required />
                    <Field name="agent_id" label="Field agent">
                      <option value="">Unassigned</option>
                      {(agents.data || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </Field>
                    <button className="btn light">Update schedule</button>
                  </form>
                )}
              </div>
            )) : <Empty />}
          </Card>
        </div>

        {/* Property verification + Providers */}
        <div className="two panel">
          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} style={{ color: '#10B981' }} /> Property verification
            </h2>
            {ps.filter(p => p.status === 'pending_verification').map(p => (
              <div className="row list-item" key={p.id}>
                <span>{p.name} · {p.city}</span>
                <form action={approveProperty}>
                  <input name="property_id" type="hidden" value={p.id} />
                  <button className="btn light">Mark verified</button>
                </form>
              </div>
            ))}
            {!ps.some(p => p.status === 'pending_verification') && <Empty />}
            <p className="footnote">Verify legal authorization off-platform before marking a property active.</p>
          </Card>

          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={16} style={{ color: '#8B5CF6' }} /> Service providers
            </h2>
            {sps.map(s => (
              <div className="row list-item" key={s.id}>
                <span>{s.business_name} · {s.specialty} <Status value={s.verified ? 'verified' : 'unverified'} /></span>
                {!s.verified && (
                  <form action={verifyProvider}>
                    <input type="hidden" name="provider_id" value={s.id} />
                    <button className="btn light">Verify</button>
                  </form>
                )}
              </div>
            ))}
            <form action={addProvider} className="stack" style={{ marginTop: 16 }}>
              <Field name="business_name" label="Business name" required />
              <Field name="specialty" label="Trade" required />
              <Field name="phone" label="Contact phone" />
              <button className="btn">Register provider</button>
            </form>
            <p className="footnote">Verification must be performed in the real world.</p>
          </Card>
        </div>

        {/* Assign provider + Record rent */}
        <div className="two panel">
          <Card>
            <h2 className="section-title">Assign provider to request</h2>
            <form action={assignProvider} className="stack">
              <Field name="request_id" label="Request" required>
                <option value="">Choose request</option>
                {rs.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
              </Field>
              <Field name="provider_id" label="Verified provider" required>
                <option value="">Choose provider</option>
                {sps.filter(s => s.verified).map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </Field>
              <button className="btn">Assign</button>
            </form>
          </Card>

          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Banknote size={16} style={{ color: '#10B981' }} /> Record rent received
            </h2>
            <form action={recordRent} className="stack">
              <Field name="property_id" label="Property" required>
                <option value="">Select</option>
                {ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Field>
              <Field name="amount" label="Amount (MAD)" type="number" step="0.01" min={0} required />
              <Field name="date" label="Date received" type="date" required />
              <Field name="reference" label="Receipt / reference" />
              <button className="btn">Record rent</button>
            </form>
          </Card>
        </div>

        {/* Record expense + Quotation */}
        <div className="two panel">
          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={16} style={{ color: '#EF4444' }} /> Record expense
            </h2>
            <form action={createExpense} className="stack">
              <Field name="property_id" label="Property" required>
                <option value="">Choose</option>
                {ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Field>
              <Field name="category" label="Category">
                <option value="maintenance">Maintenance</option>
                <option value="utility">Utility</option>
                <option value="fee">Fee</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </Field>
              <Field name="amount" label="Cost (MAD)" type="number" step="0.01" min={0} required />
              <Field name="date" label="Date incurred" type="date" required />
              <Field name="note" label="Invoice reference" />
              <button className="btn">Record expense</button>
            </form>
          </Card>

          <Card>
            <h2 className="section-title">Submit quotation</h2>
            <p className="muted small">Quotations require owner approval before work starts.</p>
            <form action={createQuote} className="stack">
              <Field name="request_id" label="Maintenance request" required>
                <option value="">Select request</option>
                {rs.filter(x => ['submitted', 'reviewed', 'quoted'].includes(x.status)).map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </Field>
              <Field name="provider_id" label="Provider">
                <option value="">DARIYA operations</option>
                {sps.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}
              </Field>
              <Field name="amount" label="Quoted amount (MAD)" type="number" min={0} step="0.01" required />
              <Field name="scope" label="Scope of work" required />
              <button className="btn">Send for review</button>
            </form>
          </Card>
        </div>

        {/* Tenant register + Rental agreement */}
        <div className="two panel">
          <Card>
            <h2 className="section-title">Tenant register</h2>
            <form action={addTenant} className="stack">
              <Field name="property_id" label="Property" required>
                <option value="">Choose</option>
                {ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Field>
              <Field name="full_name" label="Tenant full name" required />
              <Field name="email" label="Email" />
              <Field name="phone" label="Phone" />
              <button className="btn">Register tenant</button>
            </form>
          </Card>

          <Card>
            <h2 className="section-title">Rental agreement record</h2>
            <form action={addContract} className="stack">
              <Field name="property_id" label="Property" required>
                <option value="">Choose</option>
                {ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Field>
              <Field name="tenant_id" label="Tenant" required>
                <option value="">Choose</option>
                {(tenants.data || []).map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} — {ps.find(p => p.id === t.property_id)?.name}</option>
                ))}
              </Field>
              <Field name="start_date" label="Start date" type="date" required />
              <Field name="monthly_rent" label="Monthly rent (MAD)" type="number" min={0} step="0.01" required />
              <button className="btn">Record agreement</button>
            </form>
            <p className="footnote">This is a record only, not a legal e-signature.</p>
          </Card>
        </div>

        {/* Plan proposal + Pricing */}
        <div className="two panel">
          <Card>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} style={{ color: '#F59E0B' }} /> Plan proposal
            </h2>
            <form action={setSubscription} className="stack">
              <Field name="owner_id" label="Owner" required>
                <option value="">Select</option>
                {(ownerProfiles.data || []).map(p => <option key={p.id} value={p.id}>{p.full_name || p.id}</option>)}
              </Field>
              <Field name="property_id" label="Property" required>
                <option value="">Select same owner's property</option>
                {ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Field>
              <Field name="plan_id" label="Plan">
                <option value="basic">Basic</option>
                <option value="care">Care</option>
                <option value="full">Full management</option>
              </Field>
              <button className="btn">Create proposal</button>
            </form>
          </Card>

          <Card>
            <h2 className="section-title">Subscription pricing</h2>
            <div className="three">
              {(plans.data || []).map(p => (
                <form action={setPlanPrice} key={p.id} className="stack">
                  <input type="hidden" name="plan_id" value={p.id} />
                  <b>{p.name}</b>
                  <Field name="price" label={p.id === 'full' ? '% of collected rent' : 'MAD per month'} type="number" min={1} step="0.01" value={p.id === 'full' ? p.percent_of_collected_rent : p.monthly_mad} />
                  <button className="btn light">Update plan</button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        {/* Support queue */}
        <Card className="panel">
          <h2 className="section-title">Customer support queue</h2>
          {tickets.data?.length ? tickets.data.map(x => (
            <div key={x.id} className="list-item row">
              <span>{x.subject}</span>
              <Status value={x.status} />
            </div>
          )) : <Empty />}
          <p className="footnote">Ticket messaging will be expanded in Phase 2.</p>
        </Card>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  AGENT DASHBOARD  – Field operations only
  // ════════════════════════════════════════════════════════════════════════
  if (isAgent) {
    const myInspections = ins; // RLS already filters to assigned agent
    return (
      <>
        <div className="topbar">
          <div>
            <div className="eyebrow">DARIYA / FIELD OPERATIONS</div>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={24} style={{ color: '#3B82F6' }} /> Agent Workspace
            </h1>
            <p className="muted">Your assigned inspections and on-the-ground tasks.</p>
          </div>
          <Status value="agent" />
        </div>

        <Alert searchParams={await searchParams} />

        {/* KPI row */}
        <div className="gridcards panel">
          {[
            { label: 'Assigned inspections', value: myInspections.length, color: '#3B82F6' },
            { label: 'Scheduled', value: myInspections.filter(i => i.status === 'scheduled').length, color: '#10B981' },
            { label: 'In progress', value: myInspections.filter(i => i.status === 'in_progress').length, color: '#F59E0B' },
            { label: 'Completed', value: myInspections.filter(i => i.status === 'completed').length, color: '#8B5CF6' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
              <div className="stats-number" style={{ color }}>{value}</div>
            </Card>
          ))}
        </div>

        {/* Inspections list */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={16} style={{ color: '#3B82F6' }} /> My Assigned Inspections
          </h2>
          <p className="muted small" style={{ marginBottom: 16 }}>
            Go to the <a href="/app/inspections" style={{ color: '#0D604C', fontWeight: 700 }}>Inspections section</a> to enter findings, upload photos and submit the checklist report for each inspection.
          </p>
          {myInspections.length ? myInspections.map(i => (
            <div className="list-item" key={i.id}>
              <div className="row">
                <b>{ps.find(p => p.id === i.property_id)?.name || 'Assigned property'}</b>
                <Status value={i.status} />
              </div>
              <p className="muted small">{dateText(i.scheduled_for, lang)}</p>
              <a href={`/app/inspections`} className="btn light" style={{ marginTop: 6, display: 'inline-flex', fontSize: 12 }}>
                Open report →
              </a>
            </div>
          )) : (
            <Empty message="No inspections assigned to your account yet. Contact admin to get scheduled." />
          )}
        </Card>

        {/* Maintenance queue visible to agent */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={16} style={{ color: '#C87955' }} /> Maintenance queue (read-only)
          </h2>
          <p className="muted small" style={{ marginBottom: 16 }}>
            Maintenance requests you may be asked to coordinate. Assignment is done by admin.
          </p>
          {rs.length ? rs.map(r => (
            <div className="list-item" key={r.id}>
              <div className="row">
                <b>{r.title}</b><Status value={r.status} />
              </div>
              <p className="muted small">{ps.find(x => x.id === r.property_id)?.name || 'Property'} · {r.priority}</p>
            </div>
          )) : <Empty />}
        </Card>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PROVIDER DASHBOARD  – Quotations & assigned work only
  // ════════════════════════════════════════════════════════════════════════
  if (isProvider) {
    const myProvider = sps.find(s => s.profile_id === profile.id);
    const myQuotes = qs.filter(q => myProvider && q.request_id);
    const assignableRequests = rs.filter(x => ['submitted', 'reviewed', 'quoted'].includes(x.status));
    const activeRequests = rs.filter(x => ['approved', 'in_progress'].includes(x.status));

    return (
      <>
        <div className="topbar">
          <div>
            <div className="eyebrow">DARIYA / PROVIDER WORKSPACE</div>
            <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench size={24} style={{ color: '#C87955' }} /> Provider Workspace
            </h1>
            <p className="muted">
              {myProvider
                ? `${myProvider.business_name} · ${myProvider.specialty}`
                : 'Your account is not yet linked to a provider record. Contact admin.'}
            </p>
          </div>
          <Status value={myProvider?.verified ? 'verified' : 'unverified'} />
        </div>

        <Alert searchParams={await searchParams} />

        {!myProvider && (
          <Card className="panel">
            <p className="muted">Your profile is not yet linked to a verified provider record. Please contact the DARIYA admin team.</p>
          </Card>
        )}

        {/* KPI row */}
        <div className="gridcards panel">
          {[
            { label: 'Open requests', value: assignableRequests.length, color: '#F59E0B' },
            { label: 'Active work', value: activeRequests.length, color: '#10B981' },
            { label: 'My quotes submitted', value: myQuotes.length, color: '#3B82F6' },
            { label: 'Verified status', value: myProvider?.verified ? 'Yes' : 'No', color: myProvider?.verified ? '#10B981' : '#EF4444' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
              <div className="stats-number" style={{ color }}>{value}</div>
            </Card>
          ))}
        </div>

        {/* Active work I'm doing */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> Active work orders
          </h2>
          <p className="muted small" style={{ marginBottom: 16 }}>Requests that have been approved and assigned to you.</p>
          {activeRequests.length ? activeRequests.map(r => (
            <div className="list-item" key={r.id}>
              <div className="row">
                <b>{r.title}</b><Status value={r.status} />
              </div>
              <p className="muted small">{ps.find(x => x.id === r.property_id)?.name || 'Property'} · {r.priority}</p>
              <div className="form-actions">
                {r.status === 'approved' && (
                  <form action={advanceRequest}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <input type="hidden" name="next_status" value="in_progress" />
                    <button className="btn light">Start work</button>
                  </form>
                )}
                {r.status === 'in_progress' && (
                  <form action={advanceRequest}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <input type="hidden" name="next_status" value="completed" />
                    <button className="btn">Mark complete</button>
                  </form>
                )}
              </div>
            </div>
          )) : <Empty message="No active work orders assigned to you." />}
        </Card>

        {/* Submit quotation */}
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={16} style={{ color: '#C87955' }} /> Submit a quotation
          </h2>
          <p className="muted small" style={{ marginBottom: 16 }}>
            Only quote for requests explicitly assigned to you. All quotations require owner approval before work begins.
          </p>
          {assignableRequests.length ? (
            <form action={createQuote} className="fields">
              <Field name="request_id" label="Maintenance request" required>
                <option value="">Select request</option>
                {assignableRequests.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </Field>
              <Field name="provider_id" label="Provider">
                {myProvider
                  ? <option value={myProvider.id}>{myProvider.business_name}</option>
                  : <option value="">Not linked</option>}
              </Field>
              <Field name="amount" label="Quoted amount (MAD)" type="number" min={0} step="0.01" required />
              <Field name="scope" label="Scope of work" required />
              <div><button className="btn" type="submit">Send quotation for review</button></div>
            </form>
          ) : (
            <Empty message="No open requests to quote on right now." />
          )}
        </Card>

        {/* My submitted quotes */}
        <Card className="panel">
          <h2 className="section-title">My submitted quotes</h2>
          {myQuotes.length ? myQuotes.map(q => (
            <div key={q.id} className="list-item row">
              <span>{rs.find(r => r.id === q.request_id)?.title || 'Request'} — {money(Number(q.amount), lang)}</span>
              <Status value={q.status} />
            </div>
          )) : <Empty message="No quotes submitted yet." />}
        </Card>
      </>
    );
  }

  return null;
}
