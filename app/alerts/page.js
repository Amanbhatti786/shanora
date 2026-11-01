'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AlertsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || null;
        setCurrentUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        const myEmail = user.email.toLowerCase();

        // 1. Fetch user notifications
        const { data: notifs, error } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('user_email', myEmail)
          .order('created_at', { ascending: false });

        if (!error && notifs) {
          setNotifications(notifs);

          // 2. Mark unread alerts as read
          const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
          if (unreadIds.length > 0) {
            await supabase
              .from('user_notifications')
              .update({ is_read: true })
              .in('id', unreadIds);
          }
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'job_apply': return '💼';
      default: return '🔔';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff' }}>Notifications</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {notifications.length} Alerts
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 0.8rem 5.5rem 0.8rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading notifications...</div>
        ) : !currentUser ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Please sign in to view your alerts.</p>
            <Link href="/auth" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem' }}>
              Sign In
            </Link>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🔕</div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>No notifications yet</div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              When people interact with your posts, comments, or follow you, updates will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {notifications.map((item) => (
              <Link
                key={item.id}
                href={item.target_link || '/feed'}
                style={{
                  textDecoration: 'none',
                  backgroundColor: item.is_read ? '#0f172a' : 'rgba(2, 132, 199, 0.1)',
                  border: item.is_read ? '1px solid #1e293b' : '1px solid rgba(2, 132, 199, 0.35)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'background 0.2s ease'
                }}
              >
                {/* Notification Icon Badge */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  {getAlertIcon(item.type)}
                </div>

                {/* Message Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <strong style={{ color: '#38bdf8' }}>{item.sender_name || item.sender_email?.split('@')[0]}</strong>{' '}
                    {item.message}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Unread dot */}
                {!item.is_read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', flexShrink: 0 }} />
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
                }
        
