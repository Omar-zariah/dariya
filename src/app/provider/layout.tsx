import { currentUser } from '@/lib/auth';
import { ProviderSidebar } from '@/components/portals/portal-sidebar';
import { PortalHeader } from '@/components/portals/portal-header';

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await currentUser();

  if (profile.role !== 'provider') {
    const { redirect } = await import('next/navigation');
    const { roleHome } = await import('@/lib/auth');
    redirect(roleHome(profile.role));
  }

  return (
    <div className="app-shell">
      <ProviderSidebar name={profile.full_name || 'Artisan Prestataire'} role={profile.role} />
      <main className="main">
        <PortalHeader name={profile.full_name || 'Prestataire'} role={profile.role} />
        {children}
        <footer className="app-footer">
          <span>DARIYA · Réseau d&apos;artisans partenaires (Tanger)</span>
          <span>Interventions & Chiffrages certifiés</span>
        </footer>
      </main>
    </div>
  );
}
