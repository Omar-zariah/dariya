'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  LayoutDashboard,
  Wrench,
  ClipboardCheck,
  Wallet,
  FolderLock,
  ShieldCheck,
  LogOut,
  UserRound,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import { logout } from '@/actions/auth';
import { Role } from '@/lib/auth';
import { Lang, t } from '@/lib/i18n';
import { LanguagePicker } from './language';

export function Sidebar({
  role,
  lang,
  name,
}: {
  role: Role;
  lang: Lang;
  name: string;
}) {
  const pathname = usePathname();

  type NavItem = { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; exact: boolean; badge?: string };

  // Nav items scoped by role
  const ownerItems: NavItem[] = [
    { href: '/app',            label: t(lang, 'dashboard'),   Icon: LayoutDashboard, exact: true },
    { href: '/app/properties', label: t(lang, 'properties'),  Icon: House,           exact: false },
    { href: '/app/inspections',label: t(lang, 'inspections'), Icon: ClipboardCheck,  exact: false },
    { href: '/app/maintenance', label: t(lang, 'maintenance'),Icon: Wrench,          exact: false, badge: '0' },
    { href: '/app/finances',   label: t(lang, 'finances'),    Icon: Wallet,          exact: false },
    { href: '/app/documents',  label: t(lang, 'documents'),   Icon: FolderLock,      exact: false },
    { href: '/app/support',    label: 'Support',              Icon: MessageCircle,   exact: false },
    { href: '/app/profile',    label: t(lang, 'settings'),    Icon: UserRound,       exact: false },
  ];

  const adminItems: NavItem[] = [
    { href: '/app',            label: 'Overview',             Icon: LayoutDashboard, exact: true },
    { href: '/app/admin',      label: t(lang, 'admin'),       Icon: ShieldCheck,     exact: false },
    { href: '/app/properties', label: t(lang, 'properties'),  Icon: House,           exact: false },
    { href: '/app/inspections',label: t(lang, 'inspections'), Icon: ClipboardCheck,  exact: false },
    { href: '/app/maintenance', label: t(lang, 'maintenance'),Icon: Wrench,          exact: false },
    { href: '/app/finances',   label: t(lang, 'finances'),    Icon: Wallet,          exact: false },
    { href: '/app/support',    label: 'Support',              Icon: MessageCircle,   exact: false },
    { href: '/app/profile',    label: t(lang, 'settings'),    Icon: UserRound,       exact: false },
  ];

  const agentItems: NavItem[] = [
    { href: '/app',            label: 'Overview',             Icon: LayoutDashboard, exact: true },
    { href: '/app/admin',      label: 'Field operations',     Icon: ShieldCheck,     exact: false },
    { href: '/app/inspections',label: t(lang, 'inspections'), Icon: ClipboardCheck,  exact: false },
    { href: '/app/maintenance', label: t(lang, 'maintenance'),Icon: Wrench,          exact: false },
    { href: '/app/profile',    label: t(lang, 'settings'),    Icon: UserRound,       exact: false },
  ];

  const providerItems: NavItem[] = [
    { href: '/app',            label: 'Overview',             Icon: LayoutDashboard, exact: true },
    { href: '/app/admin',      label: 'My workspace',         Icon: ShieldCheck,     exact: false },
    { href: '/app/profile',    label: t(lang, 'settings'),    Icon: UserRound,       exact: false },
  ];

  const items =
    role === 'admin'    ? adminItems    :
    role === 'agent'    ? agentItems    :
    role === 'provider' ? providerItems :
    ownerItems;

  return (
    <aside className="sidebar">
      {/* Brand header */}
      <div className="sidebar-brand-wrap">
        <Link href="/" className="brand" style={{ color: '#FFFFFF', padding: '0 4px' }}>
          <span style={{ color: '#D4A373', fontSize: 18, marginRight: 2 }}>✦</span>
          <span>DARI<span className="brand-mark">Y</span>A</span>
        </Link>
        <span className="sidebar-tagline" style={{ paddingLeft: 4 }}>HOME, CONNECTED</span>
      </div>

      {/* Main navigation */}
      <div>
        <div className="sidebar-section-title">YOUR SPACE</div>
        <nav className="stack" style={{ gap: 4 }} aria-label="Main navigation">
          {items.map(({ href, label, Icon, exact, badge }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname?.startsWith(href + '/');

            return (
              <Link
                href={href}
                key={href}
                className={isActive ? 'active' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{label}</span>
                </div>
                {badge && <span className="sidebar-badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom promo / care card */}
      <div className="sidebar-promo">
        <div className="sidebar-promo-eyebrow">LOCAL CARE, GLOBAL PEACE OF MIND</div>
        <h4 className="sidebar-promo-title">
          You&apos;re far away.<br />We&apos;re close to home.
        </h4>
        <p className="sidebar-promo-desc">
          Every inspection, quote and expense in one place.
        </p>
        <Link href="/app/inspections" className="sidebar-promo-link">
          <span>Book an inspection</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* User meta & controls */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: 11.5,
          color: '#8CA89F',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <b style={{ color: '#FFFFFF', fontSize: 12.5 }}>{name}</b>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 50,
              background: '#1F3C34',
              color: '#8AD2B8',
              letterSpacing: '0.06em',
            }}
          >
            {role.toUpperCase()}
          </span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 10.5, color: '#6A8880' }}>
          PROTOTYPE · SAMPLE DATA
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <LanguagePicker current={lang} path="/app" />
          <form action={logout}>
            <button
              type="submit"
              className="btn light"
              style={{
                padding: '6px 10px',
                fontSize: 11,
                borderRadius: 8,
                background: 'transparent',
                color: '#A3BCB4',
                borderColor: '#24453C',
              }}
              title={t(lang, 'logout')}
            >
              <LogOut size={13} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
