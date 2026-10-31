'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');

  // Exact Active states check
  const isHomeActive = pathname === '/feed' || pathname === '/';
  const isNetworkActive = pathname === '/profile' && currentTab === 'network';
  const isAlertsActive = pathname === '/profile' && currentTab === 'notifications';
  const isJobsActive = pathname === '/profile' && currentTab === 'jobs';
  const isMenuActive = pathname === '/profile' && (!currentTab || currentTab === 'menu');

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: '/feed',
      isActive: isHomeActive,
      // Professional Clean Home SVG
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'network',
      label: 'Network',
      href: '/profile?tab=network',
      isActive: isNetworkActive,
      // Professional Users SVG
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'alerts',
      label: 'Alerts',
      href: '/profile?tab=notifications',
      isActive: isAlertsActive,
      // Professional Bell SVG
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      )
    },
    {
      id: 'jobs',
      label: 'Jobs',
      href: '/profile?tab=jobs',
      isActive: isJobsActive,
      // Professional Briefcase SVG
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 'menu',
      label: 'Menu',
      href: '/profile?tab=menu',
      isActive: isMenuActive,
      // Professional Grid/Menu SVG
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      )
    }
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        backgroundColor: '#070b14',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        padding: '0 0.8rem',
        zIndex: 9999,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.65)'
      }}
    >
      {navItems.map((item) => {
        const iconColor = item.isActive ? '#38bdf8' : '#64748b';
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '12px',
              minWidth: '64px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: item.isActive ? '#0f172a' : 'transparent',
              border: item.isActive
                ? '1px solid rgba(56, 189, 248, 0.4)'
                : '1px solid transparent',
              boxShadow: item.isActive
                ? '0 4px 14px rgba(2, 132, 199, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : 'none',
              transform: item.isActive ? 'translateY(-2px)' : 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.2rem',
                filter: item.isActive ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' : 'none'
              }}
            >
              {item.icon(iconColor)}
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: item.isActive ? '800' : '600',
                color: item.isActive ? '#ffffff' : '#94a3b8',
                letterSpacing: '0.3px'
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
