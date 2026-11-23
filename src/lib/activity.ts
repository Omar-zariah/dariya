import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ActivityPayload {
  actorId?: string | null;
  propertyId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any>;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
}

/** Record an immutable audit log entry in activity_logs */
export async function recordActivity(payload: ActivityPayload) {
  try {
    const admin = supabaseAdmin();
    if (!admin) return;
    await admin.from('activity_logs').insert({
      actor_id: payload.actorId || null,
      property_id: payload.propertyId || null,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId || null,
      details: payload.details || {},
    });
  } catch (err) {
    console.error('[ACTIVITY LOG ERROR]', err);
  }
}

/** Send in-app notification to a specific user */
export async function notifyUser(payload: NotificationPayload) {
  try {
    const admin = supabaseAdmin();
    if (!admin) return;
    await admin.from('notifications').insert({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
    });
  } catch (err) {
    console.error('[NOTIFY USER ERROR]', err);
  }
}

/** Notify all DARIYA administrators */
export async function notifyAdmins(title: string, body: string) {
  try {
    const admin = supabaseAdmin();
    if (!admin) return;
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    if (!admins || admins.length === 0) return;
    const records = admins.map(a => ({
      user_id: a.id,
      title,
      body,
    }));
    await admin.from('notifications').insert(records);
  } catch (err) {
    console.error('[NOTIFY ADMINS ERROR]', err);
  }
}
