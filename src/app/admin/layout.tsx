import { currentUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/portals/portal-sidebar';
import { PortalHeader } from '@/components/portals/portal-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await currentUser();

  if (profile.role !== 'admin') {
    const { redirect } = await import('next/navigation');
    const { roleHome } = await import('@/lib/auth');
    redirect(roleHome(profile.role));
  }

  return (
    <div className="app-shell">
      <AdminSidebar name={profile.full_name || 'Administrateur'} role={profile.role} />
      <main className="main">
        <PortalHeader name={profile.full_name || 'Admin'} role={profile.role} />
        {children}
        <footer className="app-footer">
          <span>DARIYA · Tableau d&apos;administration interne</span>
          <span>Tous les montants en dirhams marocains (MAD)</span>
        </footer>
      </main>
    </div>
  );
}
