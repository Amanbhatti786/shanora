'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

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

    fetchUnreadNotifications();
  }, [pathname]);

  const navItems = [
    { label: 'Home', icon: '🏠', href: '/feed' },
    { label: 'Network', icon: '👥', href: '/profile?tab=pages' },
    { label: 'Post', icon: '➕', href: '/feed' },
    { label: 'Notifications', icon: '🔔', href: '/profile?tab=notifications', badge: unreadCount },
    { label: 'Jobs', icon: '💼', href: '/profile?tab=dashboard' }
  ];

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Main Body Content */}
        <div style={{ paddingBottom: '70px' }}>
          {children}
        </div>

        {/* Global Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 9999,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    +
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700' }}>{item.label}</span>
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
                <div style={{ fontSize: '1.25rem', position: 'relative' }}>
                  {item.icon}
                  {item.badge > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '1px 5px',
                      borderRadius: '10px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: isCurrent ? '700' : '500' }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

      </body>
    </html>
  );
}
