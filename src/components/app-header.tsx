'use client';

import { usePathname } from 'next/navigation';
import { ArrowLeftRight } from 'lucide-react';

export function AppHeader({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const pathname = usePathname();

  const getSectionTitle = () => {
    if (!pathname || pathname === '/app') return 'Overview';
    if (pathname.startsWith('/app/inspections')) return 'Inspections';
    if (pathname.startsWith('/app/properties')) return 'Properties';
    if (pathname.startsWith('/app/maintenance')) return 'Maintenance';
    if (pathname.startsWith('/app/finances')) return 'Finances';
    if (pathname.startsWith('/app/documents')) return 'Documents';
    if (pathname.startsWith('/app/support')) return 'Support';
    if (pathname.startsWith('/app/profile')) return 'Settings';
    if (pathname.startsWith('/app/admin')) return 'Admin';
    return 'Dashboard';
  };

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AM';

  const roleDisplay =
    role === 'owner'
      ? 'Owner view'
      : role === 'admin'
      ? 'Admin view'
      : role === 'agent'
      ? 'Agent view'
      : role === 'provider'
      ? 'Provider view'
      : `${role} view`;

  return (
    <header className="app-header">
      <div className="breadcrumb-nav">
        <span>MY ACCOUNT</span>
        <span className="sep">/</span>
        <span style={{ color: 'var(--ink)' }}>{getSectionTitle()}</span>
      </div>

      <div className="header-actions">
        <div className="demo-pill">
          <span className="demo-dot" />
          <span>LOCAL DEMO</span>
        </div>

        <div className="role-pill" title={`Logged in as ${role}`}>
          <span>{roleDisplay}</span>
          <ArrowLeftRight size={12} style={{ color: '#7A9188' }} />
        </div>

        <div className="avatar-badge" title={name}>
          {initials || 'ME'}
        </div>
      </div>
    </header>
  );
}
