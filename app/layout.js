'use client';
import './globals.css';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');
  const [unreadCount, setUnreadCount] = useState(0);

  const hideBottomNav = pathname === '/' || pathname === '/auth';

  useEffect(() => {
    async function fetchUnreadNotifications() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_email', session.user.email)
          .eq('is_read', false);

        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Error fetching unread notifications count:', err);
      }
    }

    if (!hideBottomNav) {
      fetchUnreadNotifications();
    }
  }, [pathname, hideBottomNav]);

  if (hideBottomNav) return null;

  // Real URL queries matching
  const isHomeActive = pathname === '/feed';
  const isNetworkActive = pathname === '/profile' && currentTab === 'network';
  const isAlertsActive = pathname === '/profile' && currentTab === 'notifications';
  const isJobsActive = pathname === '/profile' && currentTab === 'jobs';
  const isMenuActive = pathname === '/profile' && (!currentTab || currentTab === 'menu');

  const navItems = [
    {
      label: 'Home',
      href: '/feed',
      isActive: isHomeActive,
      activeColor: '#38bdf8',
      cardBg: 'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderColor: 'rgba(56, 189, 248, 0.55)',
      glowColor: 'rgba(56, 189, 248, 0.35)',
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      label: 'Network',
      href: '/profile?tab=network',
      isActive: isNetworkActive,
      activeColor: '#10b981',
      cardBg: 'linear-gradient(180deg, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.55)',
      glowColor: 'rgba(16, 185, 129, 0.35)',
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      label: 'Alerts',
      href: '/profile?tab=notifications',
      isActive: isAlertsActive,
      activeColor: '#f43f5e',
      cardBg: 'linear-gradient(180deg, rgba(244, 63, 94, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderColor: 'rgba(244, 63, 94, 0.55)',
      glowColor: 'rgba(244, 63, 94, 0.35)',
      badge: unreadCount,
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      )
    },
    {
      label: 'Jobs',
      href: '/profile?tab=jobs',
      isActive: isJobsActive,
      activeColor: '#a855f7',
      cardBg: 'linear-gradient(180deg, rgba(168, 85, 247, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderColor: 'rgba(168, 85, 247, 0.55)',
      glowColor: 'rgba(168, 85, 247, 0.35)',
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      label: 'Menu',
      href: '/profile?tab=menu',
      isActive: isMenuActive,
      activeColor: '#f59e0b',
      cardBg: 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.55)',
      glowColor: 'rgba(245, 158, 11, 0.35)',
      icon: (color) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      )
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        height: '68px',
        backgroundColor: '#070b14',
        borderTop: '1px solid rgba(30, 41, 59, 0.85)',
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        zIndex: 99999,
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.85)',
        padding: '0 8px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(16px)'
      }}
    >
      {navItems.map((item) => {
        const iconColor = item.isActive ? item.activeColor : '#64748b';

        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.45rem 0.85rem',
              borderRadius: '14px',
              minWidth: '60px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: item.isActive ? item.cardBg : 'transparent',
              border: item.isActive ? `1px solid ${item.borderColor}` : '1px solid transparent',
              boxShadow: item.isActive ? `0 4px 16px ${item.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.15)` : 'none',
              transform: item.isActive ? 'translateY(-3px)' : 'none'
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '2px',
                filter: item.isActive ? `drop-shadow(0 0 8px ${item.activeColor})` : 'none',
                transition: 'filter 0.2s ease'
              }}
            >
              {item.icon(iconColor)}

              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-7px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    lineHeight: '1',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: item.isActive ? '800' : '600',
                color: item.isActive ? '#ffffff' : '#94a3b8',
                letterSpacing: '0.2px',
                transition: 'color 0.2s ease'
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Shanora.pk | Pakistan’s Professional Networking & Career Hub</title>
        <meta name="description" content="Connect with verified creators, discover executive career opportunities, build ATS-friendly resumes, and grow your professional network on Shanora." />
        
        {/* OpenGraph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shanora-pk.vercel.app" />
        <meta property="og:site_name" content="SHANORA.PK" />
        <meta property="og:title" content="Shanora.pk | Professional Networking & Creator Platform" />
        <meta property="og:description" content="Empowering Pakistan’s talent with executive networking, verified credentials, and ATS resume tools." />
        <meta property="og:image" content="https://shanora-pk.vercel.app/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shanora.pk | Professional Networking Hub" />
        <meta name="twitter:description" content="Connect, apply for jobs, and monetize your influence on Shanora.pk." />
        <meta name="twitter:image" content="https://shanora-pk.vercel.app/og-image.png" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#070b14',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          width: '100%',
          overflowX: 'hidden'
        }}
      >
        <div style={{ paddingBottom: '76px', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
          {children}
        </div>

        <Suspense fallback={null}>
          <BottomNavigation />
        </Suspense>
      </body>
    </html>
  );
}
