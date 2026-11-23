import { currentUser } from '@/lib/auth';
import { OwnerSidebar } from '@/components/portals/portal-sidebar';
import { PortalHeader } from '@/components/portals/portal-header';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await currentUser();

  // Guard: only owners can access this portal
  if (profile.role !== 'owner') {
    const { redirect } = await import('next/navigation');
    const { roleHome } = await import('@/lib/auth');
    redirect(roleHome(profile.role));
  }

  return (
    <div className="app-shell">
      <OwnerSidebar name={profile.full_name || 'Propriétaire'} role={profile.role} />
      <main className="main">
        <PortalHeader name={profile.full_name || 'Propriétaire'} role={profile.role} />
        {children}
        <footer className="app-footer">
          <span>DARIYA · Gestion immobilière depuis l&apos;étranger</span>
          <span>Tous les montants en dirhams marocains (MAD)</span>
        </footer>
      </main>
    </div>
  );
}
