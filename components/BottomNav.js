'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');

  // Active check karne ka accurate logic
  const isHomeActive = pathname === '/feed' || pathname === '/';
  const isNetworkActive = pathname === '/profile' && currentTab === 'network';
  const isAlertsActive = pathname === '/profile' && currentTab === 'notifications';
  const isJobsActive = pathname === '/profile' && currentTab === 'jobs';
  const isMenuActive = pathname === '/profile' && (!currentTab || currentTab === 'menu');

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      href: '/feed',
      isActive: isHomeActive,
    },
    {
      id: 'network',
      label: 'Network',
      icon: '👥',
      href: '/profile?tab=network',
      isActive: isNetworkActive,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: '🔔',
      href: '/profile?tab=notifications',
      isActive: isAlertsActive,
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: '💼',
      href: '/profile?tab=jobs',
      isActive: isJobsActive,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: '☰',
      href: '/profile?tab=menu',
      isActive: isMenuActive,
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '66px',
        backgroundColor: '#0a0f1d',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 0.5rem',
        zIndex: 999,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            padding: '0.45rem 0.75rem',
            borderRadius: '12px',
            minWidth: '58px',
            transition: 'all 0.25s ease',
            backgroundColor: item.isActive
              ? 'rgba(2, 132, 199, 0.18)'
              : 'transparent',
            border: item.isActive
              ? '1px solid rgba(56, 189, 248, 0.4)'
              : '1px solid transparent',
            boxShadow: item.isActive
              ? '0 2px 10px rgba(2, 132, 199, 0.25)'
              : 'none',
          }}
        >
          <span
            style={{
              fontSize: '1.2rem',
              lineHeight: 1,
              marginBottom: '0.2rem',
              transform: item.isActive ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.2s ease',
              filter: item.isActive ? 'drop-shadow(0 0 6px #38bdf8)' : 'none',
            }}
          >
            {item.icon}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: item.isActive ? '800' : '600',
              color: item.isActive ? '#38bdf8' : '#64748b',
              letterSpacing: '0.2px',
            }}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
