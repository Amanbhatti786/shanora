'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function AlertsContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [prefs, setPrefs] = useState({
    push_enabled: true,
    email_enabled: true,
    likes: true,
    comments: true,
    follows: true,
    connections: true,
    jobs: true
  });

  const PAGE_SIZE = 15;
  const pageRef = useRef(0);

  // Helper to extract sender email from multiple possible database keys
  const getSenderEmail = (notif) => {
    return (
      notif.sender_email ||
      notif.actor_email ||
      notif.user_email ||
      notif.from_email ||
      notif.from_user ||
      ''
    ).trim().toLowerCase();
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const enrichNotificationsWithProfiles = async (rawList) => {
    const senderEmails = Array.from(
      new Set(rawList.map((n) => getSenderEmail(n)).filter(Boolean))
    );

    let profilesMap = {};
    if (senderEmails.length > 0) {
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('email, name, full_name, avatar_url, username')
          .in('email', senderEmails);

        (profs || []).forEach((p) => {
          if (p.email) profilesMap[p.email.toLowerCase()] = p;
        });
      } catch (err) {
        console.error('Error fetching sender profiles:', err);
      }
    }

    return rawList.map((n) => {
      const sEmail = getSenderEmail(n);
      const p = profilesMap[sEmail] || {};
      const resolvedName =
        n.sender_name ||
        p.name ||
        p.full_name ||
        (sEmail ? sEmail.split('@')[0] : (n.title || 'Shanora Member'));

      return {
        ...n,
        resolvedSenderEmail: sEmail,
        displayName: resolvedName,
        avatarUrl: n.sender_avatar || p.avatar_url || null,
        targetUsername: p.username || null
      };
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function initUserAndAlerts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user || null;
        if (!user) {
          const { data: userData } = await supabase.auth.getUser();
          user = userData?.user || null;
        }

        if (!user || !isMounted) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        const userEmail = user.email.trim().toLowerCase();

        const savedPrefs = localStorage.getItem(`shanora_notify_pref_${user.id}`);
        if (savedPrefs) {
          try {
            setPrefs(JSON.parse(savedPrefs));
          } catch (_) {}
        }

        pageRef.current = 0;
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .ilike('recipient_email', userEmail)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (!error && data && isMounted) {
          const enriched = await enrichNotificationsWithProfiles(data);
          setNotifications(enriched);
          if (data.length < PAGE_SIZE) setHasMore(false);
        }
      } catch (err) {
        console.error('Error initializing notifications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initUserAndAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    const userEmail = currentUser.email.trim().toLowerCase();

    const channel = supabase
      .channel(`realtime_notifications_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new;
            if (newNotif.recipient_email?.toLowerCase() === userEmail) {
              const [enriched] = await enrichNotificationsWithProfiles([newNotif]);
              setNotifications((prev) => {
                if (prev.some((item) => item.id === enriched.id)) return prev;
                return [enriched, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setNotifications((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old;
            setNotifications((prev) => prev.filter((item) => item.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const loadMoreNotifications = async () => {
    if (!currentUser || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const userEmail = currentUser.email.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .ilike('recipient_email', userEmail)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        if (data.length < PAGE_SIZE) setHasMore(false);
        pageRef.current = nextPage;
        const enriched = await enrichNotificationsWithProfiles(data);
        setNotifications((prev) => [...prev, ...enriched]);
      }
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation();
    if (notif.is_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .ilike('recipient_email', currentUser.email.toLowerCase())
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser || notifications.length === 0) return;
    const confirmClear = window.confirm('Are you sure you want to clear all notifications?');
    if (!confirmClear) return;

    setNotifications([]);
    try {
      await supabase
        .from('notifications')
        .delete()
        .ilike('recipient_email', currentUser.email.toLowerCase());
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Profile navigate function for Avatar and Name clicks
  const navigateToUserProfile = (notif, e) => {
    if (e) e.stopPropagation();
    handleMarkAsRead(notif);

    const email = notif.resolvedSenderEmail || getSenderEmail(notif);
    if (email) {
      router.push(`/view-profile?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/profile?tab=network');
    }
  };

  // Smart Navigation Handler
  const handleNotificationClick = (notif) => {
    handleMarkAsRead(notif);

    const type = (notif.type || '').toLowerCase();
    const msg = (notif.message || '').toLowerCase();
    const senderEmail = notif.resolvedSenderEmail || getSenderEmail(notif);
    const targetPostId = notif.post_id || notif.target_id;

    // Follower notification -> Always User Profile
    if (type.includes('follow') || msg.includes('following') || msg.includes('started following')) {
      if (senderEmail) {
        router.push(`/view-profile?email=${encodeURIComponent(senderEmail)}`);
      } else {
        router.push('/profile?tab=network');
      }
      return;
    }

    // Likes, Comments, Reposts
    if (
      type.includes('like') ||
      type.includes('comment') ||
      type.includes('repost') ||
      msg.includes('liked') ||
      msg.includes('commented')
    ) {
      if (targetPostId) {
        router.push(`/feed?postId=${encodeURIComponent(targetPostId)}`);
      } else {
        router.push('/feed');
      }
      return;
    }

    // Connection Requests
    if (type.includes('connection')) {
      router.push('/profile?tab=network');
      return;
    }

    // Direct Messages
    if (type.includes('message') || msg.includes('message')) {
      if (senderEmail) {
        router.push(`/chat?recipient=${encodeURIComponent(senderEmail)}`);
      } else {
        router.push('/chat');
      }
      return;
    }

    // Jobs
    if (type.includes('job') || msg.includes('job')) {
      router.push('/jobs');
      return;
    }

    // Default Fallback: sender profile if exists, else network tab
    if (senderEmail) {
      router.push(`/view-profile?email=${encodeURIComponent(senderEmail)}`);
    } else {
      router.push('/profile?tab=network');
    }
  };

  const getTypeMeta = (notif) => {
    const t = (notif.type || '').toLowerCase();
    const m = (notif.message || '').toLowerCase();

    if (t.includes('like') || m.includes('liked')) {
      return { icon: '❤️', bg: 'rgba(239, 68, 68, 0.18)', border: '#ef4444', text: '#f87171' };
    }
    if (t.includes('comment') || m.includes('commented')) {
      return { icon: '💬', bg: 'rgba(56, 189, 248, 0.18)', border: '#38bdf8', text: '#38bdf8' };
    }
    if (t.includes('repost') || m.includes('reposted')) {
      return { icon: '🔁', bg: 'rgba(16, 185, 129, 0.18)', border: '#10b981', text: '#34d399' };
    }
    if (t.includes('connection') || m.includes('connection')) {
      return { icon: '🤝', bg: 'rgba(168, 85, 247, 0.18)', border: '#a855f7', text: '#c084fc' };
    }
    if (t.includes('job') || m.includes('job')) {
      return { icon: '💼', bg: 'rgba(245, 158, 11, 0.18)', border: '#f59e0b', text: '#fbbf24' };
    }
    return { icon: '👤', bg: 'rgba(2, 132, 199, 0.18)', border: '#0284c7', text: '#38bdf8' };
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'Unread') return !n.is_read;
      if (activeFilter === 'Mentions') {
        const text = `${n.type || ''} ${n.message || ''} ${n.title || ''}`.toLowerCase();
        return text.includes('mention') || text.includes('@');
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const unreadTotal = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Match with Network Tab */}
      <header
        style={{
          backgroundColor: '#070b14',
          borderBottom: '1px solid #1e293b',
          padding: '0.65rem 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                padding: 0
              }}
            >
              ←
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                backgroundColor: '#0f172a',
                padding: '0.35rem 0.85rem',
                borderRadius: '14px',
                border: '1px solid #1e293b',
                height: '38px',
                boxSizing: 'border-box'
              }}
            >
              <span
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  fontWeight: '900',
                  fontSize: '0.95rem',
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                S
              </span>
              <span
                style={{
                  fontWeight: '900',
                  fontSize: '1.05rem',
                  letterSpacing: '0.5px',
                  color: '#ffffff'
                }}
              >
                SHANORA<span style={{ color: '#38bdf8', fontSize: '0.78rem' }}>.PK</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title="Notification Preferences"
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                color: '#94a3b8',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem'
              }}
            >
              ⚙️
            </button>

            <Link
              href="/chat"
              style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                border: '1px solid #1e293b',
                borderRadius: '20px',
                height: '38px',
                padding: '0 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '1rem' }}>💬</span> Chat
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0.9rem 0.9rem 6rem 0.9rem' }}>
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>
              Notifications & Alerts
            </span>
            {unreadTotal > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}
              >
                {unreadTotal} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.95rem' }}>
          {[
            { id: 'All', label: 'All' },
            { id: 'Unread', label: `Unread (${unreadTotal})` },
            { id: 'Mentions', label: 'Mentions' }
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  backgroundColor: isSelected ? '#0284c7' : '#0f172a',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid #1e293b',
                  borderRadius: '20px',
                  padding: '0.35rem 0.9rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#38bdf8', fontSize: '0.9rem' }}>
            Loading alerts...
          </div>
        ) : !currentUser ? (
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}
          >
            Please log in to view your notifications.
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '3rem 1rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>
              No notifications found
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {activeFilter === 'Unread'
                ? "You're all caught up!"
                : 'Activity and updates from your network will appear here.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredNotifications.map((n) => {
              const meta = getTypeMeta(n);
              const isUnread = !n.is_read;

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    backgroundColor: isUnread ? '#0f1d36' : '#0f172a',
                    border: isUnread ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid #1e293b',
                    borderRadius: '14px',
                    padding: '0.85rem 0.95rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isUnread && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '0px',
                        top: '12px',
                        bottom: '12px',
                        width: '3.5px',
                        backgroundColor: '#38bdf8',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 8px #38bdf8'
                      }}
                    />
                  )}

                  {/* Avatar Icon */}
                  <div
                    onClick={(e) => navigateToUserProfile(n, e)}
                    style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '800',
                        color: '#fff',
                        overflow: 'hidden',
                        border: '1.5px solid #1e293b'
                      }}
                    >
                      {n.avatarUrl ? (
                        <img
                          src={n.avatarUrl}
                          alt={n.displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (n.displayName || 'S').charAt(0).toUpperCase()
                      )}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        width: '19px',
                        height: '19px',
                        borderRadius: '50%',
                        backgroundColor: meta.bg,
                        border: `1.5px solid ${meta.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.62rem'
                      }}
                    >
                      {meta.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div
                        onClick={(e) => navigateToUserProfile(n, e)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.88rem' }}>
                          {n.displayName}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isUnread && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => handleMarkAsRead(n, e)}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#38bdf8',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          />
                        )}
                        <button
                          type="button"
                          title="Delete notification"
                          onClick={(e) => handleDeleteNotification(n.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            padding: '0 4px',
                            lineHeight: 1
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        color: isUnread ? '#f1f5f9' : '#cbd5e1',
                        fontSize: '0.82rem',
                        marginTop: '0.2rem',
                        lineHeight: '1.4'
                      }}
                    >
                      {n.message || n.content || ''}
                    </div>

                    <div
                      style={{
                        color: isUnread ? '#38bdf8' : '#64748b',
                        fontSize: '0.7rem',
                        fontWeight: isUnread ? '700' : '500',
                        marginTop: '0.4rem'
                      }}
                    >
                      {formatRelativeTime(n.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadMoreNotifications}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    color: '#38bdf8',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: loadingMore ? 'wait' : 'pointer'
                  }}
                >
                  {loadingMore ? 'Loading older alerts...' : 'Load more notifications'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#fff' }}>Notification Preferences</span>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'push_enabled', label: 'Push Notifications' },
                { key: 'email_enabled', label: 'Email Notifications' },
                { key: 'likes', label: 'Likes & Reactions' },
                { key: 'comments', label: 'Comments' },
                { key: 'follows', label: 'Follow Alerts' }
              ].map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '0.82rem' }}>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!prefs[item.key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
          Loading alerts...
        </div>
      }
    >
      <AlertsContent />
    </Suspense>
  );
}
