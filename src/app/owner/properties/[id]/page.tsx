import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { Card, Status, Empty, Alert } from '@/components/ui';
import { dateText, money } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { Building2, MapPin, Wrench, ClipboardCheck, FolderLock, Plus, ArrowLeft, Key, Wallet, Upload, ShieldCheck, AlertTriangle, Printer, Siren, Users } from 'lucide-react';
import { uploadFile, updatePropertyDetails } from '@/actions/data';

export default async function OwnerPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ db }, lang, { id }] = await Promise.all([
    currentUser(),
    language(),
    params,
  ]);

  // Fetch property
  const { data: p } = await db.from('properties').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();

  // Fetch related records
  const [requests, inspections, rents, expenses, photos, docs, tenants, contracts, logsRes] = await Promise.all([
    db.from('maintenance_requests').select('*').eq('property_id', id).order('created_at', { ascending: false }),
    db.from('inspections').select('*').eq('property_id', id).order('created_at', { ascending: false }),
    db.from('rent_payments').select('*').eq('property_id', id).order('received_on', { ascending: false }),
    db.from('expenses').select('*').eq('property_id', id).order('incurred_on', { ascending: false }),
    db.from('property_images').select('*').eq('property_id', id),
    db.from('documents').select('id,filename,category,created_at').eq('property_id', id).order('created_at', { ascending: false }),
    db.from('tenants').select('id,full_name,email,phone').eq('property_id', id),
    db.from('rental_contracts').select('*').eq('property_id', id).eq('status', 'active'),
    db.from('activity_logs').select('id, action, entity_type, details, created_at').eq('property_id', id).order('created_at', { ascending: false }).limit(20),
  ]);
  const activityLogs = logsRes.data || [];

  // Generate signed URLs for property photos
  const images = await Promise.all(
    (photos.data || []).map(async (x) => {
      const { data } = await db.storage.from('property-files').createSignedUrl(x.storage_path, 300);
      return { ...x, url: data?.signedUrl };
    })
  );

  const totalRent = (rents.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalExpenses = (expenses.data || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const netBalance = totalRent - totalExpenses;

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Link href="/owner/properties" className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Retour à mes propriétés
        </Link>
      </div>

      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>
            {p.city?.toUpperCase()} · {p.property_type?.toUpperCase()}
          </div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} style={{ color: '#C87955' }} /> {p.name}
          </h1>
          <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> {p.address}, {p.city} · {p.bedrooms} chambre(s) · {p.surface_m2 ? `${p.surface_m2} m²` : 'Surface non précisée'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Status value={p.occupancy} />
          <Status value={p.status} />
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      {/* Ownership Verification Status & Document Upload */}
      {p.status === 'pending_verification' && (
        <Card className="panel" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFBEB', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FDE68A', display: 'grid', placeItems: 'center', color: '#92400E', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#92400E' }}>
                Vérification du titre de propriété en cours
              </h3>
              <p className="small muted" style={{ margin: '0 0 12px', color: '#B45309', lineHeight: 1.5 }}>
                Pour valider la prise en charge de votre logement à Tanger, l&apos;équipe DARIYA procède à la vérification de votre titre légal (Certificat de conservation foncière ANCFCC, acte adoulaire / Moulkiya, ou contrat d&apos;achat notarié).
                <br /><em style={{ fontSize: 12 }}>Note : Une facture d&apos;eau/électricité Amendis peut servir de justificatif d&apos;usage ou de charges, mais ne constitue pas une preuve de propriété foncière.</em>
              </p>
              <form action={uploadFile} className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="hidden" name="property_id" value={p.id} />
                <input type="hidden" name="category" value="ownership" />
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  style={{ fontSize: 13, background: '#FFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #FDE68A' }}
                />
                <button className="btn" style={{ background: '#D97706', borderColor: '#B45309', fontSize: 13, padding: '7px 14px' }}>
                  <Upload size={14} /> Transmettre le justificatif
                </button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {p.status === 'paused' && (
        <Card className="panel" style={{ borderLeft: '4px solid #DC2626', background: '#FEF2F2', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'grid', placeItems: 'center', color: '#DC2626', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#991B1B' }}>
                Propriété suspendue — Action requise
              </h3>
              <p className="small" style={{ margin: '0 0 12px', color: '#B91C1C', lineHeight: 1.5 }}>
                {p.rejection_reason || 'Ce bien a été temporairement suspendu par les administrateurs DARIYA en attente de pièces complémentaires.'}
              </p>
              <form action={uploadFile} className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="hidden" name="property_id" value={p.id} />
                <input type="hidden" name="category" value="ownership" />
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  style={{ fontSize: 13, background: '#FFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #FCA5A5' }}
                />
                <button className="btn" style={{ background: '#DC2626', borderColor: '#B91C1C', fontSize: 13, padding: '7px 14px' }}>
                  <Upload size={14} /> Téléverser le document demandé
                </button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Cards for this property */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <Card className="panel" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="small muted">Loyers encaissés</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            {money(totalRent, lang)}
          </div>
        </Card>
        <Card className="panel" style={{ borderLeft: '4px solid #EF4444' }}>
          <div className="small muted">Dépenses & Travaux</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#EF4444', marginTop: 4 }}>
            {money(totalExpenses, lang)}
          </div>
        </Card>
        <Card className="panel" style={{ borderLeft: `4px solid ${netBalance >= 0 ? '#10B981' : '#EF4444'}` }}>
          <div className="small muted">Solde Net</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: netBalance >= 0 ? '#10B981' : '#EF4444', marginTop: 4 }}>
            {money(netBalance, lang)}
          </div>
        </Card>
      </div>

      {/* Quick Action Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href={`/owner/inspections?property_id=${p.id}`} className="btn light" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardCheck size={15} color="#C87955" /> Demander une inspection
        </Link>
        <Link href={`/owner/maintenance?property_id=${p.id}`} className="btn light" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wrench size={15} color="#C87955" /> Signaler un problème
        </Link>
        <Link href={`/owner/documents?property_id=${p.id}`} className="btn light" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderLock size={15} color="#C87955" /> Ajouter un document / photo
        </Link>
      </div>

      {/* Photos Gallery */}
      <Card className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Galerie de photos ({images.filter(x => x.url).length})</h2>
          <Link href="/owner/documents" className="small" style={{ color: '#C87955', fontWeight: 600 }}>
            + Téléverser des photos
          </Link>
        </div>
        {images.filter(x => x.url).length ? (
          <div className="grid-3" style={{ gap: 12 }}>
            {images.filter(x => x.url).map((x) => (
              <a href={x.url} key={x.id} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <img src={x.url} alt={x.caption || p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                {x.caption && (
                  <div className="small muted" style={{ padding: '6px 10px', background: 'var(--surface-2)' }}>
                    {x.caption}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <Empty message="Aucune photo enregistrée pour ce bien. Ajoutez des clichés dans l'espace Documents." />
        )}
      </Card>

      {/* Two columns: Maintenance & Inspections */}
      <div className="two panel" style={{ marginTop: 20 }}>
        {/* Maintenance */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wrench size={16} color="#C87955" /> Maintenance & Pannes ({requests.data?.length || 0})
            </h2>
            <Link href="/owner/maintenance" className="small" style={{ color: '#C87955', fontWeight: 600 }}>Voir tout ↗</Link>
          </div>
          {requests.data?.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {requests.data.slice(0, 4).map((r) => (
                <div key={r.id} className="list-item" style={{ padding: '10px 12px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{r.title}</strong>
                      <div className="small muted" style={{ marginTop: 2 }}>{r.category} · {dateText(r.created_at, lang)}</div>
                    </div>
                    <Status value={r.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Aucune demande de maintenance." />
          )}
        </Card>

        {/* Inspections */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={16} color="#C87955" /> Inspections & Visites ({inspections.data?.length || 0})
            </h2>
            <Link href="/owner/inspections" className="small" style={{ color: '#C87955', fontWeight: 600 }}>Voir tout ↗</Link>
          </div>
          {inspections.data?.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {inspections.data.slice(0, 4).map((i) => (
                <div key={i.id} className="list-item" style={{ padding: '10px 12px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ textTransform: 'capitalize' }}>{i.inspection_type?.replaceAll('_', ' ')}</strong>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {dateText(i.completed_at || i.scheduled_for || i.created_at, lang)}
                      </div>
                    </div>
                    <Status value={i.status} />
                  </div>
                  {i.findings && (
                    <p className="small muted" style={{ margin: '6px 0 0', lineHeight: 1.4 }}>
                      {i.findings.slice(0, 90)}...
                    </p>
                  )}
                  {i.status === 'completed' && (
                    <div style={{ marginTop: 8 }}>
                      <Link
                        href={`/api/reports/inspection?id=${i.id}`}
                        target="_blank"
                        className="small"
                        style={{ color: '#C87955', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Printer size={12} /> Voir le compte-rendu technique (PDF)
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Aucune inspection réalisée." />
          )}
        </Card>
      </div>

      {/* Tenancy & Documents */}
      <div className="two panel" style={{ marginTop: 20 }}>
        {/* Tenants & Lease */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={16} color="#C87955" /> Locataires & Bail
            </h2>
            <Link href="/owner/rentals" className="small" style={{ color: '#C87955', fontWeight: 600 }}>Gestion locative ↗</Link>
          </div>
          {tenants.data?.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {tenants.data.map((t) => (
                <div key={t.id} className="list-item" style={{ padding: '10px 12px' }}>
                  <strong>{t.full_name}</strong>
                  <div className="small muted" style={{ marginTop: 2 }}>{t.phone || t.email || 'Contact non renseigné'}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Logement actuellement vacant ou occupé par le propriétaire." />
          )}
        </Card>

        {/* Documents */}
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderLock size={16} color="#C87955" /> Documents associés ({docs.data?.length || 0})
            </h2>
            <Link href="/owner/documents" className="small" style={{ color: '#C87955', fontWeight: 600 }}>Coffre-fort ↗</Link>
          </div>
          {docs.data?.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {docs.data.slice(0, 4).map((d) => (
                <div key={d.id} className="list-item" style={{ padding: '8px 12px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.filename}</span>
                    <span className="small muted" style={{ textTransform: 'capitalize' }}>{d.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty message="Aucun document rattaché à ce bien." />
          )}
        </Card>
      </div>

      {/* Emergency Pre-Authorization & Access Settings */}
      <Card className="panel" style={{ marginTop: 24, borderLeft: '4px solid #D97706' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Siren size={18} color="#D97706" /> Interventions d&apos;urgence & Protocole d&apos;accès
            </h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Définissez les autorisations accordées à DARIYA en cas d&apos;incident grave (fuite d&apos;eau majeure, court-circuit, effraction) et précisez la gestion des clés.
            </p>
          </div>
        </div>

        <form action={updatePropertyDetails} className="stack" style={{ gap: 14 }}>
          <input type="hidden" name="property_id" value={p.id} />

          <div style={{ background: 'var(--surface-2)', padding: '14px 16px', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="emergency_authorized"
                value="true"
                defaultChecked={Boolean(p.emergency_authorized)}
                style={{ marginTop: 3, width: 16, height: 16 }}
              />
              <div>
                <strong style={{ fontSize: 14, color: 'var(--ink)' }}>
                  Pré-autoriser DARIYA à déclencher une intervention d&apos;urgence conservatoire
                </strong>
                <p className="small muted" style={{ margin: '4px 0 0', lineHeight: 1.4 }}>
                  En cochant cette option, vous permettez à notre équipe de mandater immédiatement un artisan pour sécuriser votre bien sans attendre la validation d&apos;un devis préalable, dans la limite du plafond ci-dessous.
                </p>
              </div>
            </label>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360 }}>
              <label className="small" style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                Plafond d&apos;urgence max (MAD) :
              </label>
              <input
                type="number"
                name="emergency_limit_mad"
                defaultValue={p.emergency_limit_mad || 1000}
                min={0}
                step={100}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--line)', background: 'var(--surface)', width: 120, fontSize: 13 }}
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">
              Co-propriétaires ou ayants droit
              <input
                type="text"
                name="co_owner_names"
                defaultValue={p.co_owner_names || ''}
                placeholder="Ex: Époux/épouse, indivision familiale..."
                style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13.5 }}
              />
            </label>

            <label className="field">
              Contact local mandaté à Tanger (gardien, proche)
              <input
                type="text"
                name="representative_contact"
                defaultValue={p.representative_contact || ''}
                placeholder="Ex: Rachid (Gardien) : +212 6 XX XX XX XX"
                style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13.5 }}
              />
            </label>
          </div>

          <label className="field">
            Consignes d&apos;accès et gardiennage des clés
            <textarea
              name="access_authorization_notes"
              rows={2}
              defaultValue={p.access_authorization_notes || ''}
              placeholder="Précisez où sont conservés les doubles de clés (coffre DARIYA Tanger, boîte à code sur place, gardien d'immeuble, etc.)..."
              style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid var(--line)', background: 'var(--surface)', fontSize: 13.5 }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" type="submit" style={{ fontSize: 13 }}>
              Enregistrer le protocole d&apos;urgence
            </button>
          </div>
        </form>
      </Card>

      {/* Property Activity Timeline / Digital History */}
      <Card className="panel" style={{ marginTop: 24, borderLeft: '4px solid #C87955' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>
              ✦ Carnet de vie & Historique numérique du bien
            </h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Traçabilité chronologique complète de toutes les opérations, inspections, devis et paiements.
            </p>
          </div>
          <span className="badge" style={{ background: '#C8795518', color: '#C87955', fontWeight: 700, padding: '4px 10px', borderRadius: 50, fontSize: 12 }}>
            {activityLogs.length} événements tracés
          </span>
        </div>

        {activityLogs.length > 0 ? (
          <div className="stack" style={{ gap: 12, borderLeft: '2px solid var(--line)', paddingLeft: 18, marginLeft: 8 }}>
            {activityLogs.map((log: any) => {
              const actionLabels: Record<string, string> = {
                property_registered: 'Enregistrement du bien sur DARIYA',
                property_approved: 'Bien vérifié et validé par l\'équipe DARIYA',
                inspection_requested: 'Demande d\'inspection technique enregistrée',
                inspection_scheduled: 'Visite d\'inspection planifiée',
                inspection_completed: 'Rapport d\'inspection certifié et publié',
                maintenance_requested: 'Signalement d\'un problème de maintenance',
                maintenance_from_inspection: 'Demande de travaux suite à anomalie constatée',
                quote_issued: 'Émission d\'un devis de travaux',
                quote_approved: 'Devis approuvé par le propriétaire',
                quote_rejected: 'Devis refusé',
                provider_assigned: 'Artisan partenaire assigné au chantier',
                work_started: 'Intervention débutée sur site',
                work_completed: 'Travaux achevés et vérifiés',
                document_uploaded: 'Document ou photo téléversé',
                expense_recorded: 'Dépense enregistrée sur le bien',
                rent_collected: 'Loyer mensuel encaissé',
              };

              const label = actionLabels[log.action] || log.action.replaceAll('_', ' ');

              return (
                <div key={log.id} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: -25,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#C87955',
                    border: '2px solid #FFF',
                    boxShadow: '0 0 0 2px #C8795540',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                      {label}
                    </span>
                    <span className="footnote muted">
                      {dateText(log.created_at, lang)}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="footnote muted" style={{ marginTop: 2, background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                      {log.details.title || log.details.name || log.details.filename || (log.details.amount ? `${log.details.amount} MAD` : '') || ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty message="Aucun événement historique pour l'instant. Toutes les actions futures seront archivées ici." />
        )}
      </Card>
    </>
  );
}
