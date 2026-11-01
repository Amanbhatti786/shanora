'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AlertsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let notifChannel;

    async function initAlerts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || null;
        setCurrentUser(user);

        if (!user?.email) {
          setLoading(false);
          return;
        }

        const myEmail = user.email.toLowerCase().trim();

        // 1. Original Notifications Query
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .ilike('recipient_email', myEmail)
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }

        // 2. Original Realtime Listener
        notifChannel = supabase
          .channel(`alerts_realtime_${myEmail}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_email=eq.${myEmail}`
            },
            (payload) => {
              setNotifications((prev) => [payload.new, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    initAlerts();

    return () => {
      if (notifChannel) {
        supabase.removeChannel(notifChannel);
      }
    };
  }, []);

  // Mark all as read
  async function markAllAsRead() {
    if (unreadCount === 0 || !currentUser?.email) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .ilike('recipient_email', currentUser.email.toLowerCase().trim());
  }

  const getActionBadge = (actionType) => {
    switch (actionType) {
      case 'follow':
        return { icon: '👤', bg: '#0284c7' };
      case 'like':
        return { icon: '❤️', bg: '#38bdf8' };
      case 'comment':
        return { icon: '💬', bg: '#22c55e' };
      case 'pro':
        return { icon: '⭐', bg: '#facc15' };
      default:
        return { icon: '🔔', bg: '#0284c7' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#070b14',
                border: '1px solid #1e293b',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: 0
              }}
            >
              ←
            </button>
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <span style={{ fontWeight: '900', fontSize: '1.05rem', color: '#fff' }}>Notifications</span>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: '700',
                padding: '0.2rem 0.5rem'
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.8rem 5.5rem 0.8rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading notifications...</div>
        ) : !currentUser ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Please log in to check your alerts.</p>
            <Link href="/auth" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem' }}>
              Sign In
            </Link>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔕</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No notifications yet</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>When someone follows you or interacts with your content, it will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {notifications.map((n) => {
              const senderEmail = n.sender_email || '';
              const senderName = n.sender_name || (senderEmail ? senderEmail.split('@')[0] : 'Member');
              const targetProfileUrl = senderEmail 
                ? `/view-profile?email=${encodeURIComponent(senderEmail)}` 
                : '/feed';
              const badge = getActionBadge(n.action_type);

              const createdTime = new Date(n.created_at).getTime();
              const diffMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
              let timeLabel = 'Just now';
              if (diffMinutes >= 1440) {
                timeLabel = `${Math.floor(diffMinutes / 1440)}d ago`;
              } else if (diffMinutes >= 60) {
                timeLabel = `${Math.floor(diffMinutes / 60)}h ago`;
              } else if (diffMinutes > 0) {
                timeLabel = `${diffMinutes}m ago`;
              }

              return (
                <Link
                  key={n.id}
                  href={targetProfileUrl}
                  onClick={() => {
                    if (!n.is_read) {
                      supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                    }
                  }}
                  style={{
                    backgroundColor: n.is_read ? '#0f172a' : 'rgba(2, 132, 199, 0.1)',
                    border: n.is_read ? '1px solid #1e293b' : '1px solid rgba(2, 132, 199, 0.35)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    textDecoration: 'none',
                    transition: 'background 0.2s'
                  }}
                >
                  {/* Sender Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #1e293b'
                    }}>
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: badge.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      border: '2px solid #0f172a',
                      color: '#fff'
                    }}>
                      {badge.icon}
                    </div>
                  </div>

                  {/* Text details */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.35' }}>
                      <strong style={{ color: '#fff', fontWeight: '700' }}>{senderName}</strong> {n.content || 'interacted with your profile.'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: n.is_read ? '#64748b' : '#38bdf8', marginTop: '0.2rem', fontWeight: n.is_read ? '500' : '700' }}>
                      {timeLabel}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#38bdf8',
                      flexShrink: 0
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
