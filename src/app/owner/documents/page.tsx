import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Field, Status } from '@/components/ui';
import { uploadFile, deleteDocument } from '@/actions/data';
import { FolderLock, Upload, Download, Trash2, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

export default async function OwnerDocuments({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { db } = await currentUser();
  const lang = await language();
  const params = await searchParams;

  const [{ data: properties }, { data: documents }] = await Promise.all([
    db.from('properties').select('id,name').order('name'),
    db.from('documents')
      .select('id, property_id, filename, category, is_title_deed, verification_status, created_at, storage_path')
      .order('created_at', { ascending: false }),
  ]);

  // Generate expiring signed URLs for private downloads (valid 5 minutes)
  const docsWithUrls = await Promise.all(
    (documents || []).map(async (d) => {
      const { data } = await db.storage.from('property-files').createSignedUrl(d.storage_path, 300);
      return { ...d, url: data?.signedUrl || null };
    })
  );

  const propName = (id: string) => (properties || []).find(p => p.id === id)?.name || '—';

  const categoryLabel: Record<string, string> = {
    ownership: 'Titre de propriété foncière',
    contract: 'Contrat de location',
    tenant: 'Dossier locataire',
    invoice: 'Facture travaux / prestation',
    utility: 'Facture de charges (Eau/Électricité/Syndic)',
    inspection: 'Compte-rendu de visite technique',
    photo: 'Photographie du bien',
    other: 'Autre document',
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#C87955' }}>DOCUMENTS & TITRES</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderLock size={22} style={{ color: '#C87955' }} /> Coffre-fort numérique de documents
          </h1>
          <p className="muted">
            Stockage sécurisé, horodaté et privé pour vos titres de propriété, baux locatifs et factures à Tanger.
          </p>
        </div>
      </div>

      <Alert searchParams={params} />

      {/* Upload form */}
      <Card className="panel">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={16} style={{ color: '#C87955' }} /> Ajouter un document ou un justificatif
        </h2>
        <form action={uploadFile} className="fields">
          <Field name="property_id" label="Bien concerné" required>
            <option value="">Sélectionner un bien</option>
            {(properties || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Field>

          <Field name="category" label="Nature du document">
            <option value="ownership">Titre de propriété (Certificat conservation foncière, Moulkiya, Contrat notarié)</option>
            <option value="contract">Contrat de location / Bail</option>
            <option value="utility">Facture de charges courantes (Amendis Eau/Électricité, Syndic)</option>
            <option value="invoice">Facture artisan / Quittance</option>
            <option value="inspection">Compte-rendu de visite</option>
            <option value="photo">Photo d&apos;état des lieux</option>
            <option value="other">Autre document</option>
          </Field>

          <label className="field">
            Fichier numérique (PDF, JPG, PNG — max 10 Mo)
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              required
              style={{ padding: '8px 12px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'var(--surface)' }}
            />
          </label>

          <div style={{ marginTop: 8 }}>
            <button className="btn" type="submit">
              <FolderLock size={14} /> Chiffrer & Enregistrer le document
            </button>
          </div>
        </form>

        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          ✦ <b>Règle de conformité DARIYA :</b> Les titres de propriété téléversés sont examinés par notre équipe avant validation du statut foncier du bien. Les factures de fluides (Amendis) constituent des justificatifs de charges courantes et ne peuvent pas être substituées à un titre officiel de propriété.
        </div>
      </Card>

      {/* Documents list */}
      <Card className="panel">
        <h2 className="section-title">Mes documents enregistrés ({docsWithUrls.length})</h2>

        {docsWithUrls.length ? (
          <div className="stack" style={{ gap: 10 }}>
            {docsWithUrls.map(d => (
              <div key={d.id} className="list-item" style={{ padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: '#C87955' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <b style={{ fontSize: 14, color: 'var(--ink)' }}>{d.filename}</b>
                    <p className="muted small" style={{ margin: '2px 0 0' }}>
                      {categoryLabel[d.category] || d.category} · Bien : <b>{propName(d.property_id)}</b> · Ajouté le {dateText(d.created_at, lang)}
                    </p>
                    {d.is_title_deed && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge" style={{
                          background: d.verification_status === 'verified' ? '#DEF7EC' : '#FEF3C7',
                          color: d.verification_status === 'verified' ? '#03543F' : '#92400E',
                          fontSize: 11
                        }}>
                          {d.verification_status === 'verified' ? '✓ Titre vérifié par DARIYA' : '⏳ Titre en cours d\'examen'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn light"
                      style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Download size={13} /> Consulter / Télécharger
                    </a>
                  )}

                  <form action={deleteDocument}>
                    <input type="hidden" name="document_id" value={d.id} />
                    <button
                      className="btn light"
                      type="submit"
                      style={{ fontSize: 12, padding: '6px 10px', color: '#DC2626', borderColor: '#FCA5A5' }}
                      title="Supprimer ce document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="Aucun document téléversé pour le moment." />
        )}
      </Card>
    </>
  );
}
