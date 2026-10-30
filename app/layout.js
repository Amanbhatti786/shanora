'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function RootLayout({ children }) {
  const pathname = usePathname();
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

  const navItems = [
    { label: 'Home', icon: '🏠', href: '/feed' },
    { label: 'Network', icon: '👥', href: '/profile?tab=network' },
    { label: 'Post', icon: '➕', href: '/feed' },
    { label: 'Alerts', icon: '🔔', href: '/profile?tab=notifications', badge: unreadCount },
    { label: 'Jobs', icon: '💼', href: '/profile?tab=jobs' },
    { label: 'Menu', icon: '☰', href: '/profile?tab=menu' }
  ];

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', overflowX: 'hidden' }}>
        
        <div style={{ paddingBottom: hideBottomNav ? '0px' : '70px', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
          {children}
        </div>

        {!hideBottomNav && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            maxWidth: '100vw',
            height: '62px',
            backgroundColor: '#0f172a',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 9999,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            padding: '0 4px',
            boxSizing: 'border-box'
          }}>
            {navItems.map(item => {
              const isCurrent = item.href && pathname === item.href.split('?')[0];

              if (item.label === 'Post') {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      color: '#38bdf8'
                    }}
                  >
                    <div style={{
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      +
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700' }}>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    position: 'relative',
                    color: isCurrent ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  <div style={{ fontSize: '1.2rem', position: 'relative' }}>
                    {item.icon}
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-8px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '0.62rem',
                        fontWeight: 'bold',
                        padding: '1px 4px',
                        borderRadius: '10px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: isCurrent ? '700' : '500' }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

      </body>
    </html>
  );
                    }
