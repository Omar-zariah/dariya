import { ReactNode, CSSProperties } from 'react';

export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={'card ' + className} style={style}>{children}</div>;
}

export function Field({
  name,label,type='text',value,required=false,placeholder='',children,min,step
}:{
  name:string;label:string;type?:string;value?:string|number;required?:boolean;placeholder?:string;children?:ReactNode;min?:number;step?:string;
}){
  return (
    <label className="field">
      {label}
      {children ? (
        <select name={name} required={required}>{children}</select>
      ) : (
        <input name={name} type={type} defaultValue={value} required={required} placeholder={placeholder} min={min} step={step}/>
      )}
    </label>
  );
}

export function Alert({searchParams}:{searchParams?:{error?:string;notice?:string}}){
  return (
    <>
      {searchParams?.error && <div className="notice error" role="alert">{searchParams.error}</div>}
      {searchParams?.notice && <div className="notice" role="status">{searchParams.notice}</div>}
    </>
  );
}

const STATUS_LABELS: Record<string, { label: string; type: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  submitted: { label: 'Demande reçue', type: 'warn' },
  under_review: { label: 'En cours d\'analyse', type: 'neutral' },
  reviewed: { label: 'Dossier analysé', type: 'neutral' },
  quote_preparation: { label: 'Chiffrage en cours', type: 'neutral' },
  quoted: { label: 'Devis à valider', type: 'warn' },
  waiting_owner_approval: { label: 'Devis à valider', type: 'warn' },
  approved: { label: 'Devis validé', type: 'good' },
  assigned: { label: 'Artisan assigné', type: 'neutral' },
  technician_assigned: { label: 'Artisan assigné', type: 'neutral' },
  scheduled: { label: 'Intervention planifiée', type: 'warn' },
  in_progress: { label: 'Travaux en cours', type: 'warn' },
  completed_by_provider: { label: 'Travaux terminés (à vérifier)', type: 'warn' },
  completed: { label: 'Terminé & Vérifié', type: 'good' },
  closed: { label: 'Dossier clôturé', type: 'neutral' },
  rejected: { label: 'Refusé / Annulé', type: 'bad' },
  cancelled: { label: 'Annulé', type: 'bad' },
  active: { label: 'Actif', type: 'good' },
  pending_verification: { label: 'En attente de vérification', type: 'warn' },
  vacant: { label: 'Vacant', type: 'neutral' },
  occupied: { label: 'Occupé / Loué', type: 'good' },
  owner_used: { label: 'Usage propriétaire', type: 'neutral' },
  good: { label: 'Bon état', type: 'good' },
  attention: { label: 'À surveiller', type: 'warn' },
  critical: { label: 'Anomalie critique', type: 'bad' },
  not_checked: { label: 'Non contrôlé', type: 'neutral' },
};

export function Status({ value }: { value: string }) {
  const key = (value || '').toLowerCase();
  const entry = STATUS_LABELS[key];
  const type = entry ? entry.type : (
    ['completed', 'active', 'good', 'approved', 'verified', 'paid'].includes(key) ? 'good' :
    ['submitted', 'pending', 'requested', 'quoted', 'pending_verification', 'scheduled', 'in_progress', 'draft', 'attention'].includes(key) ? 'warn' :
    ['rejected', 'critical', 'failed', 'cancelled', 'late'].includes(key) ? 'bad' : 'neutral'
  );
  const displayLabel = entry ? entry.label : (value ? value.replaceAll('_', ' ') : '—');

  return (
    <span className={`status-badge status-${type}`} title={value}>
      <span className="status-dot" />
      {displayLabel}
    </span>
  );
}

export function Empty({
  message = 'Aucun élément pour le moment.',
  actionHref,
  actionLabel,
}: {
  message?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="empty" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{message}</p>
      {actionHref && actionLabel && (
        <div style={{ marginTop: 12 }}>
          <a href={actionHref} className="btn light" style={{ display: 'inline-flex', fontSize: 13, padding: '6px 14px' }}>
            {actionLabel}
          </a>
        </div>
      )}
    </div>
  );
}

