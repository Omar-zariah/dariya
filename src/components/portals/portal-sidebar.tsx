'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Wrench, ClipboardCheck, Key, Wallet,
  FolderLock, Bell, MessageCircle, UserRound, Users, UserCheck,
  MessageSquare, Settings, Calendar, CheckSquare, FileText, CheckCircle2,
  LogOut
} from 'lucide-react';
import { logout } from '@/actions/auth';
import type { LucideIcon } from 'lucide-react';

interface SidebarItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
}

function BaseSidebar({
  role,
  name,
  items,
  accentColor,
  portalLabel,
}: {
  role: string;
  name: string;
  items: SidebarItem[];
  accentColor: string;
  portalLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand-wrap">
        <Link href="/" className="brand" style={{ color: '#FFFFFF', padding: '0 4px' }}>
          <span style={{ color: '#D4A373', fontSize: 18, marginRight: 2 }}>✦</span>
          <span>DARI<span className="brand-mark">Y</span>A</span>
        </Link>
        <span className="sidebar-tagline" style={{ paddingLeft: 4, color: accentColor, fontSize: 9, letterSpacing: '0.12em' }}>
          {portalLabel}
        </span>
      </div>

      {/* Navigation */}
      <div>
        <div className="sidebar-section-title">NAVIGATION</div>
        <nav className="stack" style={{ gap: 4 }} aria-label="Main navigation">
          {items.map(({ href, label, Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link href={href} key={href} className={isActive ? 'active' : ''}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User meta */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.05)',
        fontSize: 11.5,
        color: '#8CA89F',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <b style={{ color: '#FFFFFF', fontSize: 12.5 }}>{name}</b>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 50,
            background: 'rgba(255,255,255,0.08)', color: accentColor, letterSpacing: '0.06em',
          }}>
            {role.toUpperCase()}
          </span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="btn light"
            style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: 'transparent', color: '#A3BCB4', borderColor: '#24453C', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={13} /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}

const OWNER_ITEMS: SidebarItem[] = [
  { href: '/owner/dashboard',     label: 'Tableau de bord',  Icon: LayoutDashboard, exact: true },
  { href: '/owner/properties',    label: 'Mes Propriétés',   Icon: Building2 },
  { href: '/owner/maintenance',   label: 'Maintenance',      Icon: Wrench },
  { href: '/owner/inspections',   label: 'Inspections',      Icon: ClipboardCheck },
  { href: '/owner/rentals',       label: 'Gestion Locative', Icon: Key },
  { href: '/owner/finances',      label: 'Finances',         Icon: Wallet },
  { href: '/owner/documents',     label: 'Documents',        Icon: FolderLock },
  { href: '/owner/notifications', label: 'Notifications',    Icon: Bell },
  { href: '/owner/support',       label: 'Support Client',   Icon: MessageCircle },
  { href: '/owner/settings',      label: 'Mon Profil',       Icon: UserRound },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { href: '/admin/dashboard',   label: 'Vue d\'ensemble',   Icon: LayoutDashboard, exact: true },
  { href: '/admin/customers',   label: 'Clients & Usagers', Icon: Users },
  { href: '/admin/properties',  label: 'Propriétés',        Icon: Building2 },
  { href: '/admin/maintenance', label: 'Maintenance',       Icon: Wrench },
  { href: '/admin/inspections', label: 'Inspections',       Icon: ClipboardCheck },
  { href: '/admin/providers',   label: 'Prestataires',      Icon: UserCheck },
  { href: '/admin/finances',    label: 'Finances & Tarifs', Icon: Wallet },
  { href: '/admin/support',     label: 'Support & Tickets', Icon: MessageSquare },
  { href: '/admin/settings',    label: 'Paramètres',        Icon: Settings },
];

const AGENT_ITEMS: SidebarItem[] = [
  { href: '/agent/dashboard',   label: 'Tableau de bord',       Icon: LayoutDashboard, exact: true },
  { href: '/agent/assignments', label: 'Mes Missions',          Icon: Calendar },
  { href: '/agent/inspections', label: 'Inspections Terrain',    Icon: ClipboardCheck },
  { href: '/agent/tasks',       label: 'Tâches Opérationnelles',Icon: CheckSquare },
  { href: '/agent/settings',    label: 'Mon Profil Agent',      Icon: UserRound },
];

const PROVIDER_ITEMS: SidebarItem[] = [
  { href: '/provider/dashboard',  label: 'Tableau de bord',    Icon: LayoutDashboard, exact: true },
  { href: '/provider/jobs',       label: 'Interventions',      Icon: Wrench },
  { href: '/provider/quotations', label: 'Devis & Chiffrages', Icon: FileText },
  { href: '/provider/history',    label: 'Historique Travaux', Icon: CheckCircle2 },
  { href: '/provider/settings',   label: 'Mon Profil Artisan', Icon: UserRound },
];

export function OwnerSidebar({ name, role = 'owner' }: { name: string; role?: string }) {
  return <BaseSidebar role={role} name={name} items={OWNER_ITEMS} accentColor="#C87955" portalLabel="ESPACE PROPRIÉTAIRE" />;
}

export function AdminSidebar({ name, role = 'admin' }: { name: string; role?: string }) {
  return <BaseSidebar role={role} name={name} items={ADMIN_ITEMS} accentColor="#3B82F6" portalLabel="ADMINISTRATION" />;
}

export function AgentSidebar({ name, role = 'agent' }: { name: string; role?: string }) {
  return <BaseSidebar role={role} name={name} items={AGENT_ITEMS} accentColor="#10B981" portalLabel="PORTAIL AGENT TERRAIN" />;
}

export function ProviderSidebar({ name, role = 'provider' }: { name: string; role?: string }) {
  return <BaseSidebar role={role} name={name} items={PROVIDER_ITEMS} accentColor="#D97706" portalLabel="ESPACE PRESTATAIRE QUALIFIÉ" />;
}
