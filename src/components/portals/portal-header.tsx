'use client';
import { usePathname } from 'next/navigation';

export function PortalHeader({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();

  // Build readable breadcrumb from last path segment
  const segment = pathname?.split('/').filter(Boolean).pop() ?? 'dashboard';
  const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

  const initials = name
    ? name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AM';

  const roleColor: Record<string, string> = {
    owner: '#C87955', admin: '#3B82F6', agent: '#10B981', provider: '#8B5CF6',
  };

  return (
    <header className="app-header">
      <div className="breadcrumb-nav">
        <span>DARIYA</span>
        <span className="sep">/</span>
        <span style={{ color: 'var(--ink)' }}>{title}</span>
      </div>
      <div className="header-actions">
        <div className="role-pill" title={`Connecté en tant que ${role}`}>
          <span style={{ color: roleColor[role] || '#7A9188', fontWeight: 700 }}>
            {role.charAt(0).toUpperCase() + role.slice(1)} portal
          </span>
        </div>
        <div className="avatar-badge" title={name} style={{ background: roleColor[role] || '#C87955' }}>
          {initials}
        </div>
      </div>
    </header>
  );
}
