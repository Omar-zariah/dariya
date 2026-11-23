'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { currentUser, requireRole } from '@/lib/auth';
import { recordActivity, notifyUser, notifyAdmins } from '@/lib/activity';
import { supabaseAdmin } from '@/lib/supabase/admin';

const get = (fd: FormData, key: string) => String(fd.get(key) || '').trim();
const uid = z.string().uuid();

function fail(where: string, error: string): never {
  redirect(where + (where.includes('?') ? '&' : '?') + 'error=' + encodeURIComponent(error.slice(0, 180)));
}

/** 1. PROPERTIES */
export async function addProperty(fd: FormData) {
  const { db, user, profile } = await currentUser();
  if (profile.role !== 'owner' && profile.role !== 'admin') {
    fail('/owner/properties', 'Non autorisé');
  }

  const schema = z.object({
    name: z.string().min(2).max(120),
    property_type: z.enum(['apartment', 'house', 'villa', 'other']),
    city: z.string().min(2),
    address: z.string().min(4),
    bedrooms: z.coerce.number().int().min(0).max(50),
    surface_m2: z.coerce.number().min(0).max(100000),
  });

  const v = schema.safeParse(
    Object.fromEntries(['name', 'property_type', 'city', 'address', 'bedrooms', 'surface_m2'].map(x => [x, get(fd, x)]))
  );

  if (!v.success) fail('/owner/properties', 'Veuillez remplir tous les champs du bien');

  const propertyId = crypto.randomUUID();
  const { error } = await db.from('properties').insert({ ...v.data, id: propertyId, owner_id: user.id });
  if (error) fail('/owner/properties', error.message);

  await recordActivity({
    actorId: user.id,
    propertyId,
    action: 'property_registered',
    entityType: 'properties',
    entityId: propertyId,
    details: { name: v.data.name, city: v.data.city },
  });

  await notifyAdmins(
    'Nouveau bien en attente de vérification',
    `Le propriétaire ${profile.full_name || 'MRE'} a enregistré "${v.data.name}" à ${v.data.city}.`
  );

  revalidatePath('/owner/properties');
  revalidatePath('/admin/properties');
  revalidatePath('/owner/dashboard');
  redirect('/owner/properties?notice=Bien%20enregistré%20en%20attente%20de%20vérification');
}

export async function approveProperty(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const id = get(fd, 'property_id');
  if (!uid.safeParse(id).success) fail('/admin/properties', 'Identifiant propriété invalide');

  const { data: prop } = await db.from('properties').select('name, owner_id').eq('id', id).maybeSingle();
  const { error } = await db.from('properties').update({ status: 'active' }).eq('id', id);
  if (error) fail('/admin/properties', error.message);

  if (prop) {
    await recordActivity({
      actorId: profile.id,
      propertyId: id,
      action: 'property_approved',
      entityType: 'properties',
      entityId: id,
      details: { name: prop.name },
    });

    await notifyUser({
      userId: prop.owner_id,
      title: 'Bien vérifié et actif ! ✦',
      body: `Votre propriété "${prop.name}" a été validée par l'équipe DARIYA et est désormais active.`,
    });
  }

  revalidatePath('/admin/properties');
  revalidatePath('/owner/properties');
  revalidatePath(`/owner/properties/${id}`);
  redirect('/admin/properties?notice=Propriété%20vérifiée%20avec%20succès');
}

export async function rejectProperty(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const id = get(fd, 'property_id');
  const reason = get(fd, 'reason');
  if (!uid.safeParse(id).success) fail('/admin/properties', 'Identifiant propriété invalide');
  if (reason.length < 8) fail('/admin/properties', 'Veuillez préciser la raison du refus (min 8 caractères)');

  const { data: prop } = await db.from('properties').select('name, owner_id').eq('id', id).maybeSingle();
  const { error } = await db.from('properties').update({ status: 'paused', rejection_reason: reason }).eq('id', id);
  if (error) fail('/admin/properties', error.message);

  if (prop) {
    await recordActivity({
      actorId: profile.id,
      propertyId: id,
      action: 'property_rejected',
      entityType: 'properties',
      entityId: id,
      details: { name: prop.name, reason },
    });
    await notifyUser({
      userId: prop.owner_id,
      title: 'Vérification de propriété — informations requises',
      body: `Votre propriété "${prop.name}" nécessite des informations complémentaires : ${reason}`,
    });
  }

  revalidatePath('/admin/properties');
  revalidatePath('/owner/properties');
  redirect('/admin/properties?notice=Refus%20enregistré%20et%20propriétaire%20notifié');
}

export async function updatePropertyDetails(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const id = get(fd, 'property_id');
  if (!uid.safeParse(id).success) fail('/owner/properties', 'Identifiant propriété invalide');

  const { data: prop } = await db.from('properties').select('owner_id').eq('id', id).maybeSingle();
  if (!prop) fail('/owner/properties', 'Bien introuvable');
  if (profile.role !== 'admin' && prop.owner_id !== user.id) {
    fail('/owner/properties', 'Non autorisé à modifier ce bien');
  }

  const name = get(fd, 'name');
  const property_type = get(fd, 'property_type');
  const city = get(fd, 'city');
  const address = get(fd, 'address');
  const bedrooms = Number(get(fd, 'bedrooms')) || 0;
  const surface_m2 = Number(get(fd, 'surface_m2')) || 0;
  const occupancy = get(fd, 'occupancy');
  const emergency_authorized = fd.get('emergency_authorized') === 'true' || fd.get('emergency_authorized') === 'on';
  const emergency_limit_mad = Number(get(fd, 'emergency_limit_mad')) || 0;
  const co_owner_names = get(fd, 'co_owner_names');
  const representative_contact = get(fd, 'representative_contact');
  const access_authorization_notes = get(fd, 'access_authorization_notes');

  const updateData: Record<string, any> = {
    emergency_authorized,
    emergency_limit_mad,
    co_owner_names,
    representative_contact,
    access_authorization_notes,
  };

  if (name) updateData.name = name;
  if (property_type && ['apartment', 'house', 'villa', 'other'].includes(property_type)) updateData.property_type = property_type;
  if (city) updateData.city = city;
  if (address) updateData.address = address;
  if (bedrooms >= 0) updateData.bedrooms = bedrooms;
  if (surface_m2 >= 0) updateData.surface_m2 = surface_m2;
  if (occupancy && ['vacant', 'occupied', 'owner_used'].includes(occupancy)) updateData.occupancy = occupancy;

  const { error } = await db.from('properties').update(updateData).eq('id', id);
  const dest = profile.role === 'admin' ? '/admin/properties' : `/owner/properties/${id}`;
  if (error) fail(dest, error.message);

  await recordActivity({
    actorId: user.id,
    propertyId: id,
    action: 'property_updated',
    entityType: 'properties',
    entityId: id,
    details: { emergency_limit_mad, emergency_authorized },
  });

  revalidatePath(dest);
  revalidatePath('/owner/properties');
  revalidatePath('/admin/properties');
  redirect(`${dest}?notice=Paramètres%20du%20bien%20mis%20à%20jour`);
}

export async function updatePropertyStatus(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const id = get(fd, 'property_id');
  const status = get(fd, 'status');
  const reason = get(fd, 'reason');

  if (!uid.safeParse(id).success || !['active', 'paused', 'pending_verification'].includes(status)) {
    fail('/admin/properties', 'Statut invalide');
  }

  const { data: prop } = await db.from('properties').select('name, owner_id').eq('id', id).maybeSingle();
  const updateData: Record<string, any> = { status };
  if (reason) updateData.rejection_reason = reason;

  const { error } = await db.from('properties').update(updateData).eq('id', id);
  if (error) fail('/admin/properties', error.message);

  if (prop) {
    await recordActivity({
      actorId: profile.id,
      propertyId: id,
      action: 'property_status_changed',
      entityType: 'properties',
      entityId: id,
      details: { status, reason },
    });

    await notifyUser({
      userId: prop.owner_id,
      title: `Statut du bien mis à jour : ${status}`,
      body: reason ? `Raison : ${reason}` : `Votre bien "${prop.name}" est désormais ${status}.`,
    });
  }

  revalidatePath('/admin/properties');
  revalidatePath('/owner/properties');
  revalidatePath(`/owner/properties/${id}`);
  redirect('/admin/properties?notice=Statut%20propriété%20actualisé');
}

/** 2. MAINTENANCE WORKFLOW */
export async function createMaintenance(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const schema = z.object({
    property_id: uid,
    title: z.string().min(4).max(150),
    description: z.string().min(8).max(4000),
    category: z.enum(['plumbing', 'electrical', 'aircon', 'painting', 'cleaning', 'locks', 'other']),
    priority: z.enum(['low', 'normal', 'urgent']),
  });

  const v = schema.safeParse(
    Object.fromEntries(['property_id', 'title', 'description', 'category', 'priority'].map(x => [x, get(fd, x)]))
  );

  const fallback = profile.role === 'admin' ? '/admin/maintenance' : '/owner/maintenance';
  if (!v.success) fail(fallback, 'Veuillez compléter tous les détails de la demande');

  const requestId = crypto.randomUUID();
  const { error } = await db.from('maintenance_requests').insert({
    ...v.data,
    id: requestId,
    created_by: user.id,
    status: 'submitted',
  });
  if (error) fail(fallback, error.message);

  await recordActivity({
    actorId: user.id,
    propertyId: v.data.property_id,
    action: 'maintenance_requested',
    entityType: 'maintenance_requests',
    entityId: requestId,
    details: { title: v.data.title, priority: v.data.priority, category: v.data.category },
  });

  await notifyAdmins(
    `Demande de maintenance (${v.data.priority.toUpperCase()})`,
    `${v.data.title} — signalée pour le bien sélectionné.`
  );

  revalidatePath('/owner/maintenance');
  revalidatePath('/admin/maintenance');
  revalidatePath('/owner/dashboard');
  revalidatePath(`/owner/properties/${v.data.property_id}`);
  redirect(`${fallback}?notice=Demande%20de%20maintenance%20enregistrée`);
}

/** Create a maintenance request directly from an inspection observation */
export async function createMaintenanceFromInspection(fd: FormData) {
  const { db, user, profile } = await currentUser();
  if (!['admin', 'agent'].includes(profile.role)) fail('/login', 'Non autorisé');

  const property_id = get(fd, 'property_id');
  const inspection_id = get(fd, 'inspection_id');
  const area = get(fd, 'area');
  const condition = get(fd, 'condition');
  const notes = get(fd, 'notes');

  const fallback = `/agent/inspections?selected=${inspection_id}`;
  if (!uid.safeParse(property_id).success || !uid.safeParse(inspection_id).success) {
    fail(fallback, 'Paramètres invalides');
  }

  const categoryMap: Record<string, string> = {
    plumbing: 'plumbing',
    electricity: 'electrical',
    doors: 'locks',
    windows: 'locks',
    general: 'painting',
    kitchen: 'plumbing',
    bathroom: 'plumbing',
  };

  const category = categoryMap[area] || 'other';
  const priority = condition === 'critical' ? 'urgent' : 'normal';
  const title = `Anomalie inspection : ${area.replaceAll('_', ' ')}`;
  const description = `Signalé lors de l'inspection technique #${inspection_id.slice(0, 8)}.\nZone: ${area}\nConstat: ${condition}\nObservations: ${notes || 'Intervention recommandée par l\'inspecteur.'}`;

  const requestId = crypto.randomUUID();
  const { error } = await db.from('maintenance_requests').insert({
    id: requestId,
    property_id,
    created_by: user.id,
    category,
    priority,
    title,
    description,
    status: 'submitted',
  });

  if (error) fail(fallback, error.message);

  await recordActivity({
    actorId: user.id,
    propertyId: property_id,
    action: 'maintenance_from_inspection',
    entityType: 'maintenance_requests',
    entityId: requestId,
    details: { inspection_id, area, condition },
  });

  const { data: prop } = await db.from('properties').select('owner_id, name').eq('id', property_id).maybeSingle();
  if (prop) {
    await notifyUser({
      userId: prop.owner_id,
      title: 'Anomalie relevée lors d\'une inspection',
      body: `Une anomalie (${area}) a été identifiée sur "${prop.name}". Un dossier de maintenance a été ouvert.`,
    });
  }

  revalidatePath('/agent/inspections');
  revalidatePath('/admin/maintenance');
  revalidatePath('/owner/maintenance');
  redirect(`${fallback}&notice=Anomalie%20convertie%20en%20demande%20de%20travaux`);
}

/** 3. QUOTATIONS */
export async function createQuote(fd: FormData) {
  const { db, user, profile } = await currentUser();
  if (!['admin', 'provider'].includes(profile.role)) fail('/login', 'Non autorisé');

  const request_id = get(fd, 'request_id');
  const scope = get(fd, 'scope');
  const fallback = profile.role === 'provider' ? '/provider/quotations' : '/admin/maintenance';

  const labor_amount = Math.max(0, Number(get(fd, 'labor_amount')) || 0);
  const materials_amount = Math.max(0, Number(get(fd, 'materials_amount')) || 0);
  const tax_amount = Math.max(0, Number(get(fd, 'tax_amount')) || 0);
  const coordination_fee_mad = Math.max(0, Number(get(fd, 'coordination_fee_mad')) || 0);
  const rawAmount = Number(get(fd, 'amount')) || 0;

  const itemizedSum = labor_amount + materials_amount + tax_amount + coordination_fee_mad;
  const amount = itemizedSum > 0 ? itemizedSum : rawAmount;
  const exclusions = get(fd, 'exclusions');
  const valid_until = get(fd, 'valid_until') || null;

  if (!uid.safeParse(request_id).success || !Number.isFinite(amount) || amount <= 0 || scope.length < 6) {
    fail(fallback, 'Devis invalide (description min. 6 car., montant total positif)');
  }

  let provider_id: string | null = get(fd, 'provider_id') || null;
  if (profile.role === 'provider') {
    const { data: sp } = await db.from('service_providers').select('id').eq('profile_id', user.id).maybeSingle();
    if (sp) provider_id = sp.id;
  }

  const quoteId = crypto.randomUUID();
  const { error } = await db.from('maintenance_quotes').insert({
    id: quoteId,
    request_id,
    provider_id,
    scope,
    amount,
    labor_amount,
    materials_amount,
    tax_amount,
    coordination_fee_mad,
    exclusions: exclusions || null,
    valid_until: valid_until ? new Date(valid_until).toISOString() : null,
    status: 'pending',
  });
  if (error) fail(fallback, error.message);

  // Advance request to quoted
  await db.from('maintenance_requests').update({ status: 'quoted', updated_at: new Date().toISOString() }).eq('id', request_id);

  // Notify owner
  const { data: req } = await db.from('maintenance_requests').select('title, property_id, properties(owner_id, name)').eq('id', request_id).maybeSingle();
  if (req) {
    const p: any = Array.isArray(req.properties) ? req.properties[0] : req.properties;
    if (p?.owner_id) {
      await notifyUser({
        userId: p.owner_id,
        title: 'Nouveau devis travaux à valider',
        body: `Un devis détaillé de ${amount} MAD a été émis pour "${req.title}". Veuillez vous connecter pour le valider.`,
      });
      await recordActivity({
        actorId: user.id,
        propertyId: req.property_id,
        action: 'quote_issued',
        entityType: 'maintenance_quotes',
        entityId: quoteId,
        details: { amount, labor_amount, materials_amount, request_title: req.title },
      });
    }
  }

  revalidatePath('/admin/maintenance');
  revalidatePath('/provider/quotations');
  revalidatePath('/owner/maintenance');
  redirect(`${fallback}?notice=Devis%20soumis%20avec%20succès`);
}

export async function decideQuote(fd: FormData) {
  const { db, user } = await currentUser();
  const qid = get(fd, 'quote_id');
  const decision = get(fd, 'decision');

  if (!uid.safeParse(qid).success || !['approved', 'rejected'].includes(decision)) {
    fail('/owner/maintenance', 'Décision de devis invalide');
  }

  const { error } = await db.rpc('decide_maintenance_quote', { qid, decision });
  if (error) fail('/owner/maintenance', error.message);

  // Fetch quote details to notify admin and provider
  const admin = supabaseAdmin();
  if (admin) {
    const { data: q } = await admin
      .from('maintenance_quotes')
      .select('amount, request_id, provider_id, maintenance_requests(title, property_id)')
      .eq('id', qid)
      .maybeSingle();

    if (q) {
      const mr: any = Array.isArray(q.maintenance_requests) ? q.maintenance_requests[0] : q.maintenance_requests;
      if (decision === 'approved') {
        await notifyAdmins(
          'Devis accepté par le propriétaire ! ✦',
          `Le devis de ${q.amount} MAD pour "${mr?.title || 'Travaux'}" a été validé. Prêt pour assignation/planification.`
        );
        if (q.provider_id) {
          const { data: sp } = await admin.from('service_providers').select('profile_id').eq('id', q.provider_id).maybeSingle();
          if (sp?.profile_id) {
            await notifyUser({
              userId: sp.profile_id,
              title: 'Votre devis a été accepté !',
              body: `Le propriétaire a validé votre devis de ${q.amount} MAD pour "${mr?.title || 'Travaux'}".`,
            });
          }
        }
      } else {
        await notifyAdmins(
          'Devis refusé par le propriétaire',
          `Le devis de ${q.amount} MAD pour "${mr?.title || 'Travaux'}" a été décliné.`
        );
      }
    }
  }

  revalidatePath('/owner/maintenance');
  revalidatePath('/admin/maintenance');
  revalidatePath('/provider/quotations');
  revalidatePath('/provider/jobs');
  redirect(`/owner/maintenance?notice=${decision === 'approved' ? 'Devis%20approuvé%20avec%20succès' : 'Devis%20refusé'}`);
}

/** 4. TECHNICIAN ASSIGNMENTS & STATUS ADVANCE */
export async function assignProvider(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const request_id = get(fd, 'request_id');
  const provider_id = get(fd, 'provider_id');

  if (!uid.safeParse(request_id).success || !uid.safeParse(provider_id).success) {
    fail('/admin/maintenance', 'Assignation invalide');
  }

  const { error } = await db.from('service_assignments').insert({ request_id, provider_id });
  if (error) fail('/admin/maintenance', error.message);

  // Notify technician
  const admin = supabaseAdmin();
  if (admin) {
    const { data: sp } = await admin.from('service_providers').select('profile_id, business_name').eq('id', provider_id).maybeSingle();
    const { data: req } = await admin.from('maintenance_requests').select('title, property_id, properties(name)').eq('id', request_id).maybeSingle();
    if (sp?.profile_id && req) {
      const prop: any = Array.isArray(req.properties) ? req.properties[0] : req.properties;
      await notifyUser({
        userId: sp.profile_id,
        title: 'Nouveau chantier assigné',
        body: `Vous avez été assigné aux travaux "${req.title}" pour ${prop?.name || 'un bien DARIYA'}.`,
      });
      await recordActivity({
        actorId: profile.id,
        propertyId: req.property_id,
        action: 'provider_assigned',
        entityType: 'service_assignments',
        entityId: request_id,
        details: { provider_name: sp.business_name },
      });
    }
  }

  revalidatePath('/admin/maintenance');
  revalidatePath('/provider/jobs');
  revalidatePath('/provider/dashboard');
  redirect('/admin/maintenance?notice=Prestataire%20assigné%20avec%20succès');
}

export async function advanceRequest(fd: FormData) {
  const { db, profile, user } = await currentUser();
  const request_id = get(fd, 'request_id');
  const next_status = get(fd, 'next_status');

  const dest = profile.role === 'provider' ? '/provider/jobs' : profile.role === 'admin' ? '/admin/maintenance' : '/owner/maintenance';
  if (!uid.safeParse(request_id).success) fail(dest, 'Demande invalide');

  const { error } = await db.rpc('advance_maintenance', { rid: request_id, next_state: next_status });
  if (error) fail(dest, error.message);

  // Connected side-effects
  const admin = supabaseAdmin();
  if (admin) {
    const { data: req } = await admin
      .from('maintenance_requests')
      .select('title, property_id, properties(owner_id, name)')
      .eq('id', request_id)
      .maybeSingle();

    if (req) {
      const p: any = Array.isArray(req.properties) ? req.properties[0] : req.properties;

      if (next_status === 'in_progress') {
        if (p?.owner_id) {
          await notifyUser({
            userId: p.owner_id,
            title: 'Intervention en cours ✦',
            body: `Les travaux pour "${req.title}" ont démarré sur votre propriété.`,
          });
        }
      } else if (next_status === 'completed') {
        // Automatically register expense record for the property if an approved quote exists!
        const { data: approvedQuote } = await admin
          .from('maintenance_quotes')
          .select('amount, scope')
          .eq('request_id', request_id)
          .eq('status', 'approved')
          .maybeSingle();

        if (approvedQuote) {
          await admin.from('expenses').insert({
            property_id: req.property_id,
            category: 'maintenance',
            amount: approvedQuote.amount,
            incurred_on: new Date().toISOString().slice(0, 10),
            note: `Travaux: ${req.title} — ${approvedQuote.scope}`,
          });
        }

        if (p?.owner_id) {
          await notifyUser({
            userId: p.owner_id,
            title: 'Travaux terminés et vérifiés ! ✦',
            body: `L'intervention pour "${req.title}" est achevée avec succès. Vous pouvez consulter les détails sur votre espace.`,
          });
        }
      } else if (next_status === 'closed') {
        await notifyAdmins(
          'Dossier clôturé par le propriétaire',
          `Le propriétaire a clôturé l'intervention "${req.title}".`
        );
      }
    }
  }

  revalidatePath('/admin/maintenance');
  revalidatePath('/provider/jobs');
  revalidatePath('/owner/maintenance');
  revalidatePath('/owner/finances');
  revalidatePath('/admin/finances');
  redirect(`${dest}?notice=Statut%20mis%20à%20jour`);
}

/** 5. INSPECTION WORKFLOW */
export async function requestInspection(fd: FormData) {
  const { db, user } = await currentUser();
  const property_id = get(fd, 'property_id');
  if (!uid.safeParse(property_id).success) fail('/owner/inspections', 'Propriété invalide');

  const inspection_type = get(fd, 'inspection_type');
  if (!['basic', 'detailed', 'move_in', 'move_out', 'maintenance'].includes(inspection_type)) {
    fail('/owner/inspections', 'Type d\'inspection invalide');
  }

  const inspectionId = crypto.randomUUID();
  const { error } = await db.from('inspections').insert({
    id: inspectionId,
    property_id,
    inspection_type,
    requested_by: user.id,
    status: 'requested',
  });
  if (error) fail('/owner/inspections', error.message);

  await recordActivity({
    actorId: user.id,
    propertyId: property_id,
    action: 'inspection_requested',
    entityType: 'inspections',
    entityId: inspectionId,
    details: { inspection_type },
  });

  await notifyAdmins(
    'Nouvelle demande d\'inspection',
    `Un propriétaire a demandé une inspection (${inspection_type}) pour son bien.`
  );

  revalidatePath('/owner/inspections');
  revalidatePath('/admin/inspections');
  revalidatePath('/owner/dashboard');
  redirect('/owner/inspections?notice=Demande%20d\'inspection%20enregistrée');
}

export async function scheduleInspection(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const inspection_id = get(fd, 'inspection_id');
  const date = get(fd, 'date');

  if (!uid.safeParse(inspection_id).success || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail('/admin/inspections', 'Date d\'inspection invalide');
  }

  const agent_id = get(fd, 'agent_id') || null;
  if (agent_id && !uid.safeParse(agent_id).success) fail('/admin/inspections', 'Agent invalide');

  const { error } = await db.from('inspections').update({
    status: 'scheduled',
    scheduled_for: date,
    agent_id,
  }).eq('id', inspection_id);
  if (error) fail('/admin/inspections', error.message);

  const admin = supabaseAdmin();
  if (admin) {
    const { data: ins } = await admin
      .from('inspections')
      .select('property_id, properties(owner_id, name)')
      .eq('id', inspection_id)
      .maybeSingle();

    if (ins) {
      const p: any = Array.isArray(ins.properties) ? ins.properties[0] : ins.properties;
      if (p?.owner_id) {
        await notifyUser({
          userId: p.owner_id,
          title: 'Visite d\'inspection planifiée ✦',
          body: `Une inspection de votre bien "${p.name}" a été programmée pour le ${date}.`,
        });
      }
      if (agent_id) {
        await notifyUser({
          userId: agent_id,
          title: 'Nouvelle mission d\'inspection assignée',
          body: `Vous êtes assigné à l'inspection de "${p?.name || 'un bien'}" prévue le ${date}.`,
        });
      }
      await recordActivity({
        actorId: profile.id,
        propertyId: ins.property_id,
        action: 'inspection_scheduled',
        entityType: 'inspections',
        entityId: inspection_id,
        details: { scheduled_for: date, agent_id },
      });
    }
  }

  revalidatePath('/admin/inspections');
  revalidatePath('/agent/assignments');
  revalidatePath('/agent/inspections');
  revalidatePath('/owner/inspections');
  redirect('/admin/inspections?notice=Inspection%20programmée%20avec%20succès');
}

export async function addInspectionCheck(fd: FormData) {
  const { db, profile } = await currentUser();
  if (!['admin', 'agent'].includes(profile.role)) fail('/login', 'Non autorisé');

  const iid = get(fd, 'inspection_id');
  const fallback = profile.role === 'agent' ? `/agent/inspections?selected=${iid}` : '/admin/inspections';
  if (!uid.safeParse(iid).success) fail(fallback, 'Inspection invalide');

  const { error } = await db.rpc('add_inspection_check', {
    iid,
    checked_area: get(fd, 'area'),
    checked_condition: get(fd, 'condition'),
    checked_notes: get(fd, 'notes'),
  });
  if (error) fail(fallback, error.message);

  revalidatePath('/agent/inspections');
  revalidatePath('/admin/inspections');
  redirect(`${fallback}&notice=Point%20de%20contrôle%20enregistré`);
}

export async function uploadInspectionMedia(fd: FormData) {
  const { db, profile } = await currentUser();
  if (!['admin', 'agent'].includes(profile.role)) fail('/login', 'Non autorisé');

  const iid = get(fd, 'inspection_id');
  const file = fd.get('file');
  const fallback = profile.role === 'agent' ? `/agent/inspections?selected=${iid}` : '/admin/inspections';

  if (!uid.safeParse(iid).success || !(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    fail(fallback, 'Fichier invalide (max 10MB JPEG/PNG/PDF)');
  }

  const { data: inspection } = await db.from('inspections').select('id').eq('id', iid).maybeSingle();
  if (!inspection) fail(fallback, 'Inspection non trouvée ou non assignée');

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
  const path = `${iid}/${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadErr } = await db.storage.from('inspection-evidence').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) fail(fallback, uploadErr.message);

  const { error } = await db.from('inspection_media').insert({
    inspection_id: iid,
    storage_path: path,
    caption: get(fd, 'caption').slice(0, 120) || cleanName,
  });

  if (error) {
    await db.storage.from('inspection-evidence').remove([path]);
    fail(fallback, error.message);
  }

  revalidatePath('/agent/inspections');
  revalidatePath('/admin/inspections');
  redirect(`${fallback}&notice=Photo%20justificative%20enregistrée`);
}

export async function finishInspection(fd: FormData) {
  const { db, profile } = await currentUser();
  if (!['admin', 'agent'].includes(profile.role)) fail('/login', 'Non autorisé');

  const iid = get(fd, 'inspection_id');
  const findings = get(fd, 'findings');
  const fallback = profile.role === 'agent' ? `/agent/inspections?selected=${iid}` : '/admin/inspections';

  if (!uid.safeParse(iid).success || findings.length < 5) {
    fail(fallback, 'Rapport de conclusions trop court');
  }

  const { error } = await db.rpc('finalize_inspection', { iid, report: findings });
  if (error) fail(fallback, error.message);

  const admin = supabaseAdmin();
  if (admin) {
    const { data: ins } = await admin
      .from('inspections')
      .select('property_id, properties(owner_id, name)')
      .eq('id', iid)
      .maybeSingle();

    if (ins) {
      const p: any = Array.isArray(ins.properties) ? ins.properties[0] : ins.properties;
      if (p?.owner_id) {
        await notifyUser({
          userId: p.owner_id,
          title: 'Rapport d\'inspection certifié disponible ! ✦',
          body: `L'inspection de votre bien "${p.name}" est finalisée. Le rapport complet et les photos sont disponibles.`,
        });
      }
      await recordActivity({
        actorId: profile.id,
        propertyId: ins.property_id,
        action: 'inspection_completed',
        entityType: 'inspections',
        entityId: iid,
        details: { report_length: findings.length },
      });
    }
  }

  revalidatePath('/agent/inspections');
  revalidatePath('/admin/inspections');
  revalidatePath('/owner/inspections');
  redirect(`${fallback}&notice=Inspection%20finalisée%20avec%20succès`);
}

/** 6. NOTIFICATIONS */
export async function markNotificationRead(fd: FormData) {
  const { db, user } = await currentUser();
  const id = get(fd, 'id');
  if (uid.safeParse(id).success) {
    await db.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
  }
  revalidatePath('/owner/notifications');
  revalidatePath('/owner/dashboard');
}

export async function markAllNotificationsRead() {
  const { db, user } = await currentUser();
  await db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/owner/notifications');
  revalidatePath('/owner/dashboard');
  redirect('/owner/notifications?notice=Toutes%20les%20notifications%20marquées%20comme%20lues');
}

/** 7. DOCUMENTS & MEDIA */
export async function uploadFile(fd: FormData) {
  const { db, user } = await currentUser();
  const property_id = get(fd, 'property_id');
  const category = get(fd, 'category');
  const file = fd.get('file');

  if (!uid.safeParse(property_id).success || !(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) {
    fail('/owner/documents', 'Sélectionnez un fichier valide (max 10MB)');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) fail('/owner/documents', 'Formats autorisés: PDF, PNG, JPEG, WebP');
  if (!['ownership', 'contract', 'tenant', 'invoice', 'utility', 'inspection', 'other', 'photo'].includes(category)) {
    fail('/owner/documents', 'Catégorie invalide');
  }

  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const path = `${user.id}/${property_id}/${crypto.randomUUID()}-${clean}`;

  const { error: uploadErr } = await db.storage.from('property-files').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) fail('/owner/documents', uploadErr.message);

  const isTitleDeed = category === 'ownership';
  const verificationStatus = isTitleDeed ? 'pending_review' : 'unverified';

  const { error } = category === 'photo'
    ? await db.from('property_images').insert({ property_id, storage_path: path, caption: clean })
    : await db.from('documents').insert({
        property_id,
        filename: clean,
        category,
        storage_path: path,
        uploaded_by: user.id,
        is_title_deed: isTitleDeed,
        verification_status: verificationStatus,
      });

  if (error) {
    await db.storage.from('property-files').remove([path]);
    fail('/owner/documents', error.message);
  }

  await recordActivity({
    actorId: user.id,
    propertyId: property_id,
    action: 'document_uploaded',
    entityType: 'documents',
    entityId: null,
    details: { filename: clean, category, is_title_deed: isTitleDeed },
  });

  if (isTitleDeed) {
    await notifyAdmins(
      'Nouveau titre de propriété téléversé',
      `Un document de propriété ("${clean}") a été soumis pour vérification par l'équipe DARIYA.`
    );
  }

  revalidatePath('/owner/documents');
  revalidatePath(`/owner/properties/${property_id}`);
  redirect('/owner/documents?notice=Document%20téléversé%20avec%20succès');
}

export async function deleteDocument(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const doc_id = get(fd, 'document_id');
  if (!uid.safeParse(doc_id).success) fail('/owner/documents', 'Document invalide');

  const { data: doc } = await db.from('documents').select('*').eq('id', doc_id).maybeSingle();
  if (!doc) fail('/owner/documents', 'Document introuvable');

  if (profile.role !== 'admin' && doc.uploaded_by !== user.id) {
    fail('/owner/documents', 'Non autorisé à supprimer ce document');
  }

  await db.storage.from('property-files').remove([doc.storage_path]);
  await db.from('documents').delete().eq('id', doc_id);

  revalidatePath('/owner/documents');
  revalidatePath(`/owner/properties/${doc.property_id}`);
  redirect('/owner/documents?notice=Document%20supprimé%20avec%20succès');
}

export async function verifyDocument(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const document_id = get(fd, 'document_id');
  const verification_status = get(fd, 'verification_status'); // 'verified' | 'rejected'
  const verification_note = get(fd, 'verification_note');
  const is_title_deed = fd.get('is_title_deed') === 'true' || fd.get('is_title_deed') === 'on';

  if (!uid.safeParse(document_id).success || !['verified', 'rejected'].includes(verification_status)) {
    fail('/admin/properties', 'Paramètres de vérification invalides');
  }

  const { data: doc } = await db.from('documents').select('property_id, filename, category').eq('id', document_id).maybeSingle();
  if (!doc) fail('/admin/properties', 'Document introuvable');

  const { error } = await db.from('documents').update({
    verification_status,
    verification_note: verification_note || null,
    is_title_deed,
    verified_at: new Date().toISOString(),
  }).eq('id', document_id);
  if (error) fail('/admin/properties', error.message);

  // If verified title deed, update property verification_status
  if (is_title_deed && verification_status === 'verified') {
    await db.from('properties').update({
      verification_status: 'verified',
      verification_notes: 'Titre de propriété vérifié par l\'équipe DARIYA',
    }).eq('id', doc.property_id);
  }

  revalidatePath('/admin/properties');
  revalidatePath('/owner/documents');
  revalidatePath(`/owner/properties/${doc.property_id}`);
  redirect('/admin/properties?notice=Document%20vérifié%20avec%20succès');
}

/** 8. FINANCES & EXPENSES */
export async function createExpense(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const property_id = get(fd, 'property_id');
  const amount = Number(get(fd, 'amount'));
  const category = get(fd, 'category');
  const date = get(fd, 'date');
  const note = get(fd, 'note');

  if (!uid.safeParse(property_id).success || !Number.isFinite(amount) || amount < 0 ||
    !['maintenance', 'utility', 'fee', 'cleaning', 'other'].includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail('/admin/finances', 'Dépense invalide');
  }

  const expenseId = crypto.randomUUID();
  const { error } = await db.from('expenses').insert({
    id: expenseId,
    property_id,
    amount,
    category,
    incurred_on: date,
    note,
  });
  if (error) fail('/admin/finances', error.message);

  await recordActivity({
    actorId: profile.id,
    propertyId: property_id,
    action: 'expense_recorded',
    entityType: 'expenses',
    entityId: expenseId,
    details: { amount, category, note },
  });

  const { data: prop } = await db.from('properties').select('owner_id, name').eq('id', property_id).maybeSingle();
  if (prop) {
    await notifyUser({
      userId: prop.owner_id,
      title: 'Nouvelle dépense enregistrée',
      body: `Une dépense de ${amount} MAD (${category}) a été ajoutée pour "${prop.name}".`,
    });
  }

  revalidatePath('/admin/finances');
  revalidatePath('/owner/finances');
  revalidatePath(`/owner/properties/${property_id}`);
  redirect('/admin/finances?notice=Dépense%20enregistrée%20avec%20succès');
}

export async function recordRent(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const property_id = get(fd, 'property_id');
  const amount = Number(get(fd, 'amount'));
  const date = get(fd, 'date');
  const reference = get(fd, 'reference');

  if (!uid.safeParse(property_id).success || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail('/admin/finances', 'Paiement de loyer invalide');
  }

  const rentId = crypto.randomUUID();
  const { error } = await db.from('rent_payments').insert({
    id: rentId,
    property_id,
    amount,
    received_on: date,
    reference,
  });
  if (error) fail('/admin/finances', error.message);

  await recordActivity({
    actorId: profile.id,
    propertyId: property_id,
    action: 'rent_collected',
    entityType: 'rent_payments',
    entityId: rentId,
    details: { amount, reference },
  });

  const { data: prop } = await db.from('properties').select('owner_id, name').eq('id', property_id).maybeSingle();
  if (prop) {
    await notifyUser({
      userId: prop.owner_id,
      title: 'Loyer encaissé ! ✦',
      body: `Un loyer de ${amount} MAD a été enregistré pour "${prop.name}".`,
    });
  }

  revalidatePath('/admin/finances');
  revalidatePath('/owner/finances');
  revalidatePath('/owner/rentals');
  revalidatePath(`/owner/properties/${property_id}`);
  redirect('/admin/finances?notice=Loyer%20enregistré%20avec%20succès');
}

/** 9. PROVIDERS & SUPPORT */
export async function addProvider(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const business_name = get(fd, 'business_name');
  const specialty = get(fd, 'specialty');

  if (business_name.length < 2 || specialty.length < 2) fail('/admin/providers', 'Données prestataire invalides');

  const { error } = await db.from('service_providers').insert({
    business_name,
    specialty,
    contact_phone: get(fd, 'phone'),
    verified: false,
  });
  if (error) fail('/admin/providers', error.message);

  revalidatePath('/admin/providers');
  redirect('/admin/providers?notice=Prestataire%20enregistré%20(en%20attente%20de%20vérification)');
}

export async function verifyProvider(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const id = get(fd, 'provider_id');
  if (!uid.safeParse(id).success) fail('/admin/providers', 'Identifiant prestataire invalide');

  const { error } = await db.from('service_providers').update({ verified: true }).eq('id', id);
  if (error) fail('/admin/providers', error.message);

  revalidatePath('/admin/providers');
  revalidatePath('/provider/dashboard');
  redirect('/admin/providers?notice=Prestataire%20vérifié%20avec%20succès');
}

export async function addSupportTicket(fd: FormData) {
  const { db, user } = await currentUser();
  const subject = get(fd, 'subject');
  const body = get(fd, 'body');

  if (subject.length < 4 || body.length < 8) fail('/owner/support', 'Veuillez préciser le sujet et la description');

  const { error } = await db.from('support_tickets').insert({ user_id: user.id, subject, body });
  if (error) fail('/owner/support', error.message);

  await notifyAdmins('Nouveau ticket support client', `${subject} : ${body.slice(0, 100)}...`);

  revalidatePath('/owner/support');
  revalidatePath('/admin/support');
  redirect('/owner/support?notice=Ticket%20d\'assistance%20créé%20avec%20succès');
}

export async function updateTicketStatus(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const id = get(fd, 'ticket_id');
  const status = get(fd, 'status');

  if (!uid.safeParse(id).success || !['open', 'in_progress', 'resolved'].includes(status)) {
    fail('/admin/support', 'Invalid ticket update');
  }

  const { error } = await db.from('support_tickets').update({ status }).eq('id', id);
  if (error) fail('/admin/support', error.message);

  revalidatePath('/admin/support');
  redirect('/admin/support?notice=Statut%20du%20ticket%20mis%20à%20jour');
}

export async function addTenant(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const property_id = get(fd, 'property_id');
  const full_name = get(fd, 'full_name');

  if (!uid.safeParse(property_id).success || full_name.length < 2) fail('/admin/finances', 'Nom du locataire invalide');

  const { error } = await db.from('tenants').insert({
    property_id,
    full_name,
    email: get(fd, 'email'),
    phone: get(fd, 'phone'),
  });
  if (error) fail('/admin/finances', error.message);

  revalidatePath('/admin/finances');
  revalidatePath('/owner/rentals');
  redirect('/admin/finances?notice=Locataire%20enregistré');
}

export async function addContract(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const property_id = get(fd, 'property_id');
  const tenant_id = get(fd, 'tenant_id');
  const start_date = get(fd, 'start_date');
  const monthly_rent = Number(get(fd, 'monthly_rent'));

  if (!uid.safeParse(property_id).success || !uid.safeParse(tenant_id).success ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !Number.isFinite(monthly_rent) || monthly_rent < 0) {
    fail('/admin/finances', 'Données de contrat invalides');
  }

  const { data: tenant } = await db.from('tenants').select('property_id').eq('id', tenant_id).maybeSingle();
  if (tenant?.property_id !== property_id) fail('/admin/finances', 'Le locataire n\'appartient pas à ce bien');

  const { error } = await db.from('rental_contracts').insert({
    property_id,
    tenant_id,
    start_date,
    monthly_rent,
    status: 'active',
  });
  if (error) fail('/admin/finances', error.message);

  // Mark property occupancy as occupied
  await db.from('properties').update({ occupancy: 'occupied' }).eq('id', property_id);

  revalidatePath('/admin/finances');
  revalidatePath('/owner/rentals');
  revalidatePath(`/owner/properties/${property_id}`);
  redirect('/admin/finances?notice=Contrat%20de%20location%20enregistré');
}

export async function setPlanPrice(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const id = get(fd, 'plan_id');
  const amount = Number(get(fd, 'price'));

  if (!['basic', 'care', 'full'].includes(id) || !Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    fail('/admin/finances', 'Tarif invalide');
  }

  const data = id === 'full' ? { percent_of_collected_rent: amount } : { monthly_mad: amount };
  const { error } = await db.from('subscription_plans').update(data).eq('id', id);
  if (error) fail('/admin/finances', error.message);

  revalidatePath('/admin/finances');
  redirect('/admin/finances?notice=Tarif%20mis%20à%20jour');
}

export async function setSubscription(fd: FormData) {
  const { db } = await requireRole(['admin']);
  const owner_id = get(fd, 'owner_id');
  const property_id = get(fd, 'property_id');
  const plan_id = get(fd, 'plan_id');

  if (!uid.safeParse(owner_id).success || !uid.safeParse(property_id).success || !['basic', 'care', 'full'].includes(plan_id)) {
    fail('/admin/finances', 'Abonnement invalide');
  }

  const { data: p } = await db.from('properties').select('owner_id').eq('id', property_id).maybeSingle();
  if (p?.owner_id !== owner_id) fail('/admin/finances', 'Propriétaire ne correspond pas');

  const { error } = await db.from('subscriptions').insert({ owner_id, property_id, plan_id, status: 'proposed' });
  if (error) fail('/admin/finances', error.message);

  revalidatePath('/admin/finances');
  redirect('/admin/finances?notice=Proposition%20d\'abonnement%20enregistrée');
}

/** 10. MANUAL PAYMENTS & UTILITIES */
export async function recordManualPayment(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const property_id = get(fd, 'property_id') || null;
  const subscription_id = get(fd, 'subscription_id') || null;
  const quote_id = get(fd, 'quote_id') || null;
  const payment_type = get(fd, 'payment_type') || 'subscription';
  const amount = Number(get(fd, 'amount'));
  const method = get(fd, 'method') || 'bank_transfer';
  const reference_code = get(fd, 'reference_code');
  const notes = get(fd, 'notes');

  const fallback = profile.role === 'admin' ? '/admin/finances' : '/owner/finances';
  if (!Number.isFinite(amount) || amount <= 0) {
    fail(fallback, 'Montant de paiement invalide');
  }

  const allowedMethods = ['bank_transfer', 'cash_agency', 'cmi_card', 'wafa_cash', 'other'];
  if (!allowedMethods.includes(method)) fail(fallback, 'Mode de règlement invalide');

  const paymentId = crypto.randomUUID();
  const { error } = await db.from('manual_payments').insert({
    id: paymentId,
    owner_id: user.id,
    property_id: property_id && uid.safeParse(property_id).success ? property_id : null,
    subscription_id: subscription_id && uid.safeParse(subscription_id).success ? subscription_id : null,
    quote_id: quote_id && uid.safeParse(quote_id).success ? quote_id : null,
    payment_type,
    amount,
    method,
    reference_code,
    notes,
    status: profile.role === 'admin' ? 'confirmed' : 'pending',
    verified_by: profile.role === 'admin' ? user.id : null,
    verified_at: profile.role === 'admin' ? new Date().toISOString() : null,
  });

  if (error) fail(fallback, error.message);

  await recordActivity({
    actorId: user.id,
    propertyId: property_id || undefined,
    action: 'payment_recorded',
    entityType: 'manual_payments',
    entityId: paymentId,
    details: { amount, method, payment_type, reference_code },
  });

  if (profile.role !== 'admin') {
    await notifyAdmins(
      'Nouveau règlement déclaré',
      `Un paiement de ${amount} MAD (${method}) a été déclaré par le propriétaire (Réf: ${reference_code || 'N/A'}).`
    );
  }

  revalidatePath('/owner/finances');
  revalidatePath('/admin/finances');
  redirect(`${fallback}?notice=Règlement%20déclaré%20avec%20succès%20(en%20attente%20de%20rapprochement)`);
}

export async function verifyManualPayment(fd: FormData) {
  const { db, profile } = await requireRole(['admin']);
  const payment_id = get(fd, 'payment_id');
  const status = get(fd, 'status'); // 'confirmed' | 'failed' | 'refunded'
  const notes = get(fd, 'notes');

  if (!uid.safeParse(payment_id).success || !['confirmed', 'failed', 'refunded'].includes(status)) {
    fail('/admin/finances', 'Statut de paiement invalide');
  }

  const { data: payment } = await db.from('manual_payments').select('*').eq('id', payment_id).maybeSingle();
  if (!payment) fail('/admin/finances', 'Règlement introuvable');

  const { error } = await db.from('manual_payments').update({
    status,
    notes: notes || payment.notes,
    verified_by: profile.id,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', payment_id);

  if (error) fail('/admin/finances', error.message);

  // If confirmed and linked to a subscription, activate the subscription!
  if (status === 'confirmed' && payment.subscription_id) {
    await db.from('subscriptions').update({ status: 'active' }).eq('id', payment.subscription_id);
  }

  // Notify owner
  await notifyUser({
    userId: payment.owner_id,
    title: status === 'confirmed' ? 'Règlement confirmé ! ✦' : `Mise à jour règlement : ${status}`,
    body: `Votre paiement de ${payment.amount} MAD (${payment.method}) a été marqué comme "${status}".`,
  });

  revalidatePath('/admin/finances');
  revalidatePath('/owner/finances');
  revalidatePath('/owner/dashboard');
  redirect('/admin/finances?notice=Statut%20du%20règlement%20mis%20à%20jour');
}

export async function recordUtilityBill(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const property_id = get(fd, 'property_id');
  const period_month = get(fd, 'period_month');
  const category = get(fd, 'category') || 'electricity';
  const amount = Number(get(fd, 'amount'));
  const reference = get(fd, 'reference');
  const note = get(fd, 'note');

  const fallback = profile.role === 'admin' ? '/admin/finances' : '/owner/finances';
  if (!uid.safeParse(property_id).success || !Number.isFinite(amount) || amount < 0 || !/^\d{4}-\d{2}$/.test(period_month)) {
    fail(fallback, 'Facture de charges invalide (format mois YYYY-MM requis)');
  }

  const { error } = await db.from('utility_bills').insert({
    property_id,
    period_month,
    category,
    amount,
    reference,
    note: `${note || ''} (Facture d'usage courant — ne constitue pas un titre de propriété)`,
    created_by: user.id,
  });

  if (error) fail(fallback, error.message);

  revalidatePath('/owner/finances');
  revalidatePath('/admin/finances');
  revalidatePath(`/owner/properties/${property_id}`);
  redirect(`${fallback}?notice=Facture%20de%20charges%20enregistrée`);
}

export async function cancelInspection(fd: FormData) {
  const { db, user, profile } = await currentUser();
  const iid = get(fd, 'inspection_id');
  const reason = get(fd, 'reason') || 'Non précisé';

  const fallback = profile.role === 'admin' ? '/admin/inspections' : '/owner/inspections';
  if (!uid.safeParse(iid).success) fail(fallback, 'Inspection invalide');

  const { error } = await db.from('inspections').update({
    status: 'cancelled',
    cancellation_reason: reason,
  }).eq('id', iid);

  if (error) fail(fallback, error.message);

  await recordActivity({
    actorId: user.id,
    action: 'inspection_cancelled',
    entityType: 'inspections',
    entityId: iid,
    details: { reason },
  });

  revalidatePath('/admin/inspections');
  revalidatePath('/owner/inspections');
  revalidatePath('/agent/inspections');
  redirect(`${fallback}?notice=Inspection%20annulée`);
}
