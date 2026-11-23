import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status, Field } from '@/components/ui';
import { approveProperty, rejectProperty, verifyDocument } from '@/actions/data';
import { Building2, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Download, ShieldCheck } from 'lucide-react';

export default async function AdminProperties({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const [{ data: properties }, { data: owners }, { data: titleDocs }] = await Promise.all([
    db.from('properties')
      .select('id,name,city,address,status,occupancy,owner_id,property_type,bedrooms,surface_m2,emergency_authorized,emergency_limit_mad,created_at')
      .order('created_at', { ascending: false }),
    db.from('profiles').select('id,full_name,phone').eq('role', 'owner'),
    db.from('documents')
      .select('id, property_id, filename, category, is_title_deed, verification_status, storage_path, created_at, properties(name)')
      .or('is_title_deed.eq.true,category.eq.ownership')
      .order('created_at', { ascending: false }),
  ]);

  // Generate signed URLs for title deed inspection
  const titleDocsWithUrls = await Promise.all(
    (titleDocs || []).map(async (doc) => {
      const { data } = await db.storage.from('property-files').createSignedUrl(doc.storage_path, 3600);
      return { ...doc, url: data?.signedUrl || null };
    })
  );

  const pending = (properties || []).filter(p => p.status === 'pending_verification');
  const active = (properties || []).filter(p => p.status === 'active');
  const paused = (properties || []).filter(p => p.status === 'paused');
  const ownerName = (id: string) => (owners || []).find(o => o.id === id)?.full_name || id;
  const ownerPhone = (id: string) => (owners || []).find(o => o.id === id)?.phone || '';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#3B82F6' }}>PROPRIÉTÉS & CONFORMITÉ FONCIÈRE</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} style={{ color: '#3B82F6' }} /> Gestion du parc immobilier & Titres
          </h1>
          <p className="muted">Vérifiez les titres légaux, autorisez les biens et suivez la conformité opérationnelle à Tanger.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small muted">{pending.length} en attente</span>
          <span className="small" style={{ color: '#10B981', fontWeight: 700 }}>{active.length} actifs</span>
          <span className="small" style={{ color: '#9CA3AF', fontWeight: 700 }}>{paused.length} suspendus</span>
        </div>
      </div>

      <Alert searchParams={params} />

      {/* Title Deed Examination Queue */}
      {titleDocsWithUrls.length > 0 && (
        <Card className="panel" style={{ borderLeft: '3px solid #8B5CF6' }}>
          <h2 className="section-title" style={{ color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#8B5CF6" /> Titres de propriété téléversés ({titleDocsWithUrls.length})
          </h2>
          <p className="small muted" style={{ marginTop: 2, marginBottom: 12 }}>
            Contrôlez les actes adoulaires, certificats ANCFCC ou contrats notariés avant d&apos;activer la gestion du bien.
          </p>

          <div className="stack" style={{ gap: 10 }}>
            {titleDocsWithUrls.map((td: any) => {
              const prop = Array.isArray(td.properties) ? td.properties[0] : td.properties;
              return (
                <div key={td.id} className="list-item row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={18} color="#8B5CF6" />
                    <div>
                      <strong>{td.filename}</strong>
                      <div className="small muted">
                        Bien : <b>{prop?.name || 'Bien'}</b> · Téléversé le {dateText(td.created_at, lang)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {td.url && (
                      <a href={td.url} target="_blank" rel="noopener noreferrer" className="btn light" style={{ fontSize: 12, padding: '4px 10px' }}>
                        <Download size={12} /> Consulter l&apos;acte
                      </a>
                    )}

                    {td.verification_status !== 'verified' ? (
                      <form action={verifyDocument} style={{ display: 'inline-flex', gap: 6 }}>
                        <input type="hidden" name="document_id" value={td.id} />
                        <input type="hidden" name="verification_status" value="verified" />
                        <input type="hidden" name="is_title_deed" value="true" />
                        <button className="btn" style={{ background: '#10B981', borderColor: '#059669', fontSize: 12, padding: '4px 10px' }}>
                          ✓ Valider le titre foncier
                        </button>
                      </form>
                    ) : (
                      <span className="badge" style={{ background: '#DEF7EC', color: '#03543F', fontSize: 11 }}>
                        ✓ Titre validé
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pending verification */}
      {pending.length > 0 && (
        <Card className="panel" style={{ borderLeft: '3px solid #F59E0B' }}>
          <h2 className="section-title" style={{ color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#F59E0B" /> Biens en attente de validation ({pending.length})
          </h2>
          <div style={{
            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#92400E', marginBottom: 16
          }}>
            ⚠ La vérification de propriété est une procédure légale et opérationnelle. Validez les pièces justificatives
            foncières avant d&apos;activer la couverture DARIYA.
          </div>
          {pending.map(p => (
            <div key={p.id} className="list-item" style={{ padding: '16px 20px' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{p.name}</b>
                  <p className="muted small" style={{ marginTop: 3 }}>
                    {p.city} · {p.address}
                  </p>
                  <p className="muted small">
                    Propriétaire : <strong>{ownerName(p.owner_id)}</strong>
                    {ownerPhone(p.owner_id) && <> · 📞 {ownerPhone(p.owner_id)}</>}
                  </p>
                  <p className="muted small">
                    Type : {p.property_type} · {p.bedrooms} ch · {p.surface_m2 ? `${p.surface_m2} m²` : 'surface non renseignée'}
                  </p>
                  {p.emergency_authorized && (
                    <p className="small" style={{ color: '#D97706', marginTop: 4 }}>
                      ⚡ Pré-autorisation urgence activée (Plafond : {p.emergency_limit_mad} MAD)
                    </p>
                  )}
                  <p className="footnote">Enregistré le {dateText(p.created_at, lang)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                  <form action={approveProperty}>
                    <input name="property_id" type="hidden" value={p.id} />
                    <button className="btn" style={{ background: '#10B981', borderColor: '#059669', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} /> Valider & Activer la couverture
                    </button>
                  </form>
                  <details style={{ border: '1px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', background: '#FFF5F5' }}>
                    <summary style={{ cursor: 'pointer', fontSize: 13, color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={13} /> Refuser / demander des infos
                    </summary>
                    <form action={rejectProperty} className="stack" style={{ marginTop: 10 }}>
                      <input name="property_id" type="hidden" value={p.id} />
                      <Field name="reason" label="Motif du refus (communiqué au propriétaire)" required
                        placeholder="ex: Titre de propriété manquant, bien hors zone Tanger…" />
                      <button className="btn" style={{ background: '#DC2626', borderColor: '#B91C1C', fontSize: 13 }}>
                        Envoyer le refus
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Active properties */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color="#10B981" /> Propriétés actives ({active.length})
        </h2>
        {active.length ? active.map(p => (
          <div key={p.id} className="list-item">
            <div className="row">
              <div>
                <b>{p.name}</b>
                <p className="muted small">{p.city} · {p.property_type} · {ownerName(p.owner_id)}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Status value={p.occupancy} />
                <Status value={p.status} />
              </div>
            </div>
          </div>
        )) : <Empty message="Aucune propriété active." />}
      </Card>

      {/* Paused / rejected */}
      {paused.length > 0 && (
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#9CA3AF" /> Propriétés suspendues ({paused.length})
          </h2>
          {paused.map(p => (
            <div key={p.id} className="list-item">
              <div className="row">
                <div>
                  <b>{p.name}</b>
                  <p className="muted small">{p.city} · {ownerName(p.owner_id)} · Suspendu le {dateText(p.created_at, lang)}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Status value={p.status} />
                  <form action={approveProperty}>
                    <input name="property_id" type="hidden" value={p.id} />
                    <button className="btn light" style={{ fontSize: 12, padding: '4px 10px' }}>Réactiver</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
