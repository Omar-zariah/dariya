import { currentUser } from '@/lib/auth';
import { AgentSidebar } from '@/components/portals/portal-sidebar';
import { PortalHeader } from '@/components/portals/portal-header';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await currentUser();

  if (profile.role !== 'agent') {
    const { redirect } = await import('next/navigation');
    const { roleHome } = await import('@/lib/auth');
    redirect(roleHome(profile.role));
  }

  return (
    <div className="app-shell">
      <AgentSidebar name={profile.full_name || 'Agent Opérations'} role={profile.role} />
      <main className="main">
        <PortalHeader name={profile.full_name || 'Agent'} role={profile.role} />
        {children}
        <footer className="app-footer">
          <span>DARIYA · Espace Agent de Terrain (Tanger)</span>
          <span>Inspections & Suivi opérationnel</span>
        </footer>
      </main>
    </div>
  );
}
