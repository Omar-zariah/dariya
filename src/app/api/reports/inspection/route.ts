import { NextRequest, NextResponse } from 'next/server';
import { configured, supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const inspectionId = searchParams.get('id');

  if (!inspectionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId)) {
    return NextResponse.json({ error: 'Invalid inspection ID' }, { status: 400 });
  }

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 1. Fetch user profile to verify role
  const { data: profile } = await db.from('profiles').select('id, role, full_name').eq('id', user.id).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // 2. Fetch inspection record with property
  const { data: inspection, error: insErr } = await db
    .from('inspections')
    .select(`
      id,
      inspection_type,
      status,
      scheduled_for,
      completed_at,
      findings,
      report,
      created_at,
      agent_id,
      property_id,
      properties (
        id,
        name,
        address,
        city,
        property_type,
        bedrooms,
        surface_m2,
        owner_id
      )
    `)
    .eq('id', inspectionId)
    .maybeSingle();

  if (insErr || !inspection) {
    return NextResponse.json({ error: 'Inspection not found or access denied' }, { status: 404 });
  }

  const property: any = Array.isArray(inspection.properties) ? inspection.properties[0] : inspection.properties;

  // 3. Security check: user must be property owner, assigned agent, or admin
  const isOwner = property?.owner_id === user.id;
  const isAgent = inspection.agent_id === user.id;
  const isAdmin = profile.role === 'admin';

  if (!isOwner && !isAgent && !isAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // 4. Fetch inspector and owner names
  const [{ data: inspectorProfile }, { data: ownerProfile }, { data: checklists }, { data: mediaItems }] = await Promise.all([
    inspection.agent_id ? db.from('profiles').select('full_name, phone').eq('id', inspection.agent_id).maybeSingle() : Promise.resolve({ data: null }),
    property?.owner_id ? db.from('profiles').select('full_name').eq('id', property.owner_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('inspection_checklists').select('area, condition, notes').eq('inspection_id', inspectionId),
    db.from('inspection_media').select('id, caption, storage_path, created_at').eq('inspection_id', inspectionId),
  ]);

  // 5. Generate signed URLs for inspection evidence (valid for 1 hour for printing)
  const photosWithUrls = await Promise.all(
    (mediaItems || []).map(async (m) => {
      const { data } = await db.storage.from('inspection-evidence').createSignedUrl(m.storage_path, 3600);
      return { ...m, url: data?.signedUrl || null };
    })
  );

  const areasOrder = [
    { key: 'entrance', label: '1. Entrée & Hall' },
    { key: 'living_room', label: '2. Salon & Séjour' },
    { key: 'kitchen', label: '3. Cuisine & Équipements' },
    { key: 'bathroom', label: '4. Salle de bain & WC' },
    { key: 'bedrooms', label: '5. Chambres à coucher' },
    { key: 'windows', label: '6. Fenêtres & Volets' },
    { key: 'doors', label: '7. Portes & Serrures' },
    { key: 'electricity', label: '8. Électricité & Prises' },
    { key: 'plumbing', label: '9. Plomberie & Évacuation' },
    { key: 'general', label: '10. État Général & Murs' },
  ];

  const checklistMap = new Map((checklists || []).map(c => [c.area, c]));

  const typeLabels: Record<string, string> = {
    basic: 'Vérification mensuelle de vacance',
    detailed: 'Audit technique complet (10 zones)',
    move_in: "État des lieux d'entrée locataire",
    move_out: 'État des lieux de sortie locataire',
    maintenance: 'Contrôle post-travaux artisan',
  };

  const condBadge = (cond?: string) => {
    switch (cond) {
      case 'good':
        return '<span style="background:#DEF7EC;color:#03543F;padding:3px 8px;border-radius:4px;font-weight:700;font-size:12px;">✓ BON ÉTAT</span>';
      case 'attention':
        return '<span style="background:#FEF3C7;color:#92400E;padding:3px 8px;border-radius:4px;font-weight:700;font-size:12px;">⚠ À SURVEILLER</span>';
      case 'critical':
        return '<span style="background:#FEE2E2;color:#991B1B;padding:3px 8px;border-radius:4px;font-weight:700;font-size:12px;">✖ CRITIQUE</span>';
      default:
        return '<span style="background:#F3F4F6;color:#6B7280;padding:3px 8px;border-radius:4px;font-weight:600;font-size:12px;">Non vérifié</span>';
    }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    try {
      return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(d));
    } catch {
      return d;
    }
  };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compte-Rendu de Visite Technique Documentée — DARIYA (${property?.name || 'Bien'})</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #142B3B;
      background: #F7F5EF;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 36px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #142B3B;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #142B3B;
    }
    .brand span {
      color: #C87955;
    }
    .badge-certified {
      background: #142B3B;
      color: #F7F5EF;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-block;
    }
    .grid-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-size: 13.5px;
    }
    .meta-item strong {
      color: #64748B;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #142B3B;
      border-left: 4px solid #C87955;
      padding-left: 10px;
      margin: 28px 0 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #142B3B;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #FAFAFA;
    }
    .findings-box {
      background: #FFFBEB;
      border: 1.5px solid #FDE68A;
      border-radius: 6px;
      padding: 18px 20px;
      margin-bottom: 28px;
      font-size: 14px;
      line-height: 1.6;
    }
    .gallery {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .photo-card {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      overflow: hidden;
      background: #FFFFFF;
    }
    .photo-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }
    .photo-caption {
      padding: 8px 12px;
      font-size: 12px;
      color: #475569;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
    }
    .print-bar {
      margin-bottom: 20px;
      text-align: right;
    }
    .btn-print {
      background: #C87955;
      color: #FFFFFF;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #B36846;
    }
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-bar {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-bar">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimer / Sauvegarder en PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="brand">DARI<span>Y</span>A</div>
        <div style="font-size: 13px; color: #64748B; margin-top: 4px;">Plateforme de Gestion Immobilière • Tanger, Maroc</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-certified">Compte-Rendu de Visite Technique</span>
        <div style="font-size: 11px; color: #64748B; margin-top: 6px;">Réf: #${inspection.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <div class="grid-meta">
      <div class="meta-item">
        <strong>Bien Immobilier</strong>
        ${property?.name || 'Bien'} (${property?.property_type || 'Appartement'})
      </div>
      <div class="meta-item">
        <strong>Adresse & Localisation</strong>
        ${property?.address || 'Tanger'}, ${property?.city || 'Tanger'}
      </div>
      <div class="meta-item">
        <strong>Propriétaire</strong>
        ${ownerProfile?.full_name || 'Propriétaire MRE'}
      </div>
      <div class="meta-item">
        <strong>Type d'Inspection</strong>
        ${typeLabels[inspection.inspection_type] || inspection.inspection_type}
      </div>
      <div class="meta-item">
        <strong>Agent Inspecteur Terrain</strong>
        ${inspectorProfile?.full_name || 'Agent certifié DARIYA'}
      </div>
      <div class="meta-item">
        <strong>Date & Horodatage de Clôture</strong>
        ${formatDate(inspection.completed_at || inspection.scheduled_for || inspection.created_at)}
      </div>
    </div>

    <div class="section-title">Synthèse & Conclusions Générales de l'Inspecteur</div>
    <div class="findings-box">
      <strong>Avis technique :</strong><br />
      ${inspection.findings || inspection.report || 'Inspection conforme. Aucun désordre majeur constaté.'}
    </div>

    <div class="section-title">Grille d'Audit Technique des 10 Zones de Contrôle</div>
    <table>
      <thead>
        <tr>
          <th style="width: 32%;">Zone vérifiée</th>
          <th style="width: 20%;">Statut</th>
          <th style="width: 48%;">Observations & Recommandations</th>
        </tr>
      </thead>
      <tbody>
        ${areasOrder.map(area => {
    const check = checklistMap.get(area.key);
    return `<tr>
            <td><strong>${area.label}</strong></td>
            <td>${condBadge(check?.condition)}</td>
            <td style="color:#334155;">${check?.notes ? check.notes : '<em>Conforme, aucune anomalie signalée.</em>'}</td>
          </tr>`;
  }).join('')}
      </tbody>
    </table>

    ${photosWithUrls.length > 0 ? `
      <div class="section-title">Photographies Justificatives Horodatées (${photosWithUrls.length})</div>
      <div class="gallery">
        ${photosWithUrls.map(p => `
          <div class="photo-card">
            ${p.url ? `<img src="${p.url}" alt="${p.caption || 'Preuve d\'inspection'}" />` : '<div style="height:120px;display:grid;place-items:center;background:#F1F5F9;color:#94A3B8;font-size:12px;">Photo archivée</div>'}
            <div class="photo-caption">
              <strong>${p.caption || 'Preuve de passage'}</strong><br />
              <span style="font-size:10.5px;color:#94A3B8;">Archivée le ${formatDate(p.created_at)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="footer">
      <div>
        <strong>DARIYA Property Care</strong> • Tanger, Maroc<br />
        <span style="font-size: 11px; color: #64748B;">
          Ce compte-rendu technique consigne les constatations visuelles réalisées lors du passage sur site sur les éléments accessibles.
          Il ne constitue pas un diagnostic de conformité structurelle légale, une expertise judiciaire, ni un titre de propriété officiel.
        </span>
      </div>
      <div style="text-align: right;">
        Émis le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date())}<br />
        <span style="font-size: 11px; color: #64748B;">Horodatage numérique DARIYA</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
