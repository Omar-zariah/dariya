import { Role } from '@/lib/auth';

export type MaintenanceStatus =
  | 'submitted'
  | 'reviewed'
  | 'quoted'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'rejected';

export type QuoteStatus = 'pending' | 'approved' | 'rejected';

export type InspectionStatus =
  | 'requested'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface StatusMeta {
  code: string;
  labelFr: string;
  labelEn: string;
  labelAr: string;
  badgeType: 'good' | 'warn' | 'bad' | 'neutral';
  descriptionFr: string;
  stepIndex: number;
}

export const MAINTENANCE_STATUS_MAP: Record<MaintenanceStatus, StatusMeta> = {
  submitted: {
    code: 'submitted',
    labelFr: 'Demande reçue',
    labelEn: 'Requested',
    labelAr: 'طلب مرسل',
    badgeType: 'warn',
    descriptionFr: 'Demande enregistrée, en attente d\'analyse par l\'équipe DARIYA.',
    stepIndex: 1,
  },
  reviewed: {
    code: 'reviewed',
    labelFr: 'Dossier analysé',
    labelEn: 'Reviewed',
    labelAr: 'تمت المراجعة',
    badgeType: 'neutral',
    descriptionFr: 'Demande qualifiée par DARIYA. Chiffrage et recherche d\'artisan en cours.',
    stepIndex: 2,
  },
  quoted: {
    code: 'quoted',
    labelFr: 'Devis à approuver',
    labelEn: 'Quote Pending',
    labelAr: 'عرض السعر بانتظار الموافقة',
    badgeType: 'warn',
    descriptionFr: 'Un devis détaillé a été émis. En attente de votre accord.',
    stepIndex: 3,
  },
  approved: {
    code: 'approved',
    labelFr: 'Devis approuvé',
    labelEn: 'Approved',
    labelAr: 'تمت الموافقة',
    badgeType: 'good',
    descriptionFr: 'Devis validé. Assignation et planification de l\'artisan en cours.',
    stepIndex: 4,
  },
  in_progress: {
    code: 'in_progress',
    labelFr: 'Intervention en cours',
    labelEn: 'In Progress',
    labelAr: 'الأشغال جارية',
    badgeType: 'warn',
    descriptionFr: 'L\'artisan est sur site ou les réparations sont activement en cours.',
    stepIndex: 5,
  },
  completed: {
    code: 'completed',
    labelFr: 'Travaux terminés & Vérifiés',
    labelEn: 'Completed & Verified',
    labelAr: 'تم الإصلاح والتحقق',
    badgeType: 'good',
    descriptionFr: 'Réparations achevées et vérifiées par DARIYA. Factures et photos disponibles.',
    stepIndex: 6,
  },
  closed: {
    code: 'closed',
    labelFr: 'Dossier clôturé',
    labelEn: 'Closed',
    labelAr: 'ملف مقفل',
    badgeType: 'neutral',
    descriptionFr: 'Intervention clôturée avec satisfaction.',
    stepIndex: 7,
  },
  rejected: {
    code: 'rejected',
    labelFr: 'Demande annulée',
    labelEn: 'Cancelled / Rejected',
    labelAr: 'ملغى / مرفوض',
    badgeType: 'bad',
    descriptionFr: 'Demande ou devis non retenu.',
    stepIndex: 0,
  },
};

export const INSPECTION_STATUS_MAP: Record<InspectionStatus, StatusMeta> = {
  requested: {
    code: 'requested',
    labelFr: 'Inspection demandée',
    labelEn: 'Requested',
    labelAr: 'طلب معاينة',
    badgeType: 'warn',
    descriptionFr: 'Demande d\'inspection enregistrée par le propriétaire.',
    stepIndex: 1,
  },
  scheduled: {
    code: 'scheduled',
    labelFr: 'Visite planifiée',
    labelEn: 'Scheduled',
    labelAr: 'مجدولة',
    badgeType: 'warn',
    descriptionFr: 'Inspecteur assigné et date d\'intervention fixée.',
    stepIndex: 2,
  },
  in_progress: {
    code: 'in_progress',
    labelFr: 'Visite en cours',
    labelEn: 'In Progress',
    labelAr: 'المعاينة جارية',
    badgeType: 'warn',
    descriptionFr: 'Inspecteur sur place réalisant les contrôles.',
    stepIndex: 3,
  },
  completed: {
    code: 'completed',
    labelFr: 'Rapport vérifié',
    labelEn: 'Completed',
    labelAr: 'تم الفحص بنجاح',
    badgeType: 'good',
    descriptionFr: 'Inspection réalisée avec photos justificatives et rapport certifié.',
    stepIndex: 4,
  },
  cancelled: {
    code: 'cancelled',
    labelFr: 'Annulée',
    labelEn: 'Cancelled',
    labelAr: 'ملغاة',
    badgeType: 'bad',
    descriptionFr: 'Visite annulée.',
    stepIndex: 0,
  },
};

/** Central transition validator for maintenance requests */
export function canTransitionMaintenance(
  current: MaintenanceStatus,
  target: MaintenanceStatus,
  role: Role
): boolean {
  if (role === 'admin') {
    // Admin has full operational governance but cannot jump backwards from closed
    if (current === 'closed') return false;
    return true;
  }

  if (role === 'owner') {
    // Owner can only approve/reject pending quotes, or close completed requests
    if (current === 'quoted' && (target === 'approved' || target === 'rejected')) return true;
    if (current === 'completed' && target === 'closed') return true;
    if (current === 'submitted' && target === 'rejected') return true; // Owner can cancel their own submission
    return false;
  }

  if (role === 'provider') {
    // Provider can only advance approved job to in_progress, and in_progress to completed
    if (current === 'approved' && target === 'in_progress') return true;
    if (current === 'in_progress' && target === 'completed') return true;
    return false;
  }

  return false;
}
