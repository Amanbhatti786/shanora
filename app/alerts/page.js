'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function AlertsContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAlerts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user || null;

        if (!user) {
          const { data: userData } = await supabase.auth.getUser();
          user = userData?.user || null;
        }

        if (user && isMounted) {
          setCurrentUser(user);
          const userEmail = (user.email || '').trim().toLowerCase();

          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .ilike('recipient_email', userEmail)
            .order('created_at', { ascending: false });

          if (!error && data && isMounted) {
            const senderEmails = Array.from(
              new Set(data.map((n) => (n.sender_email || '').toLowerCase()).filter(Boolean))
            );

            let profilesMap = {};
            if (senderEmails.length > 0) {
              const { data: profs } = await supabase
                .from('profiles')
                .select('email, name, full_name, avatar_url')
                .in('email', senderEmails);

              (profs || []).forEach((p) => {
                if (p.email) {
                  profilesMap[p.email.toLowerCase()] = p;
                }
              });
            }

            const formatted = data.map((n) => {
              const sEmail = (n.sender_email || '').toLowerCase();
              const profileMatch = profilesMap[sEmail] || {};
              const resolvedName =
                n.sender_name ||
                profileMatch.name ||
                profileMatch.full_name ||
                (sEmail ? sEmail.split('@')[0] : (n.title || 'System Notification'));

              return {
                ...n,
                displayName: resolvedName,
                avatarUrl: profileMatch.avatar_url || n.sender_avatar || null
              };
            });

            setNotifications(formatted);
          }
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Exact Shanora Header (Pixel-perfect match with Network tab) */}
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
      {/* Back Button */}
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

      {/* SHANORA.PK Brand Capsule */}
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

    {/* Right Action: Chat Button */}
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
</header>
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0.9rem 0.9rem 5.5rem 0.9rem' }}>
        {/* Tab Title Banner */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔔</span>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>Notifications & Alerts</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading alerts...</div>
        ) : !currentUser ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            Please log in to view your notifications.
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            No new notifications yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => {
              const isFollow = n.type === 'follow' || (n.message && n.message.toLowerCase().includes('following'));
              const isPro = n.message && n.message.toLowerCase().includes('blue tick');

              return (
                <div
                  key={n.id}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '14px',
                    padding: '0.95rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isPro ? '#f59e0b' : isFollow ? '#0284c7' : '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: '800',
                      color: '#fff',
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {n.avatarUrl ? (
                      <img src={n.avatarUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isPro ? (
                      '👑'
                    ) : isFollow ? (
                      '👤'
                    ) : (
                      (n.displayName || 'S').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {n.sender_email ? (
                        <Link
                          href={`/view-profile?email=${encodeURIComponent(n.sender_email)}`}
                          style={{
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '0.92rem',
                            textDecoration: 'none'
                          }}
                        >
                          {n.displayName}
                        </Link>
                      ) : (
                        <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.92rem' }}>
                          {n.displayName}
                        </span>
                      )}

                      {isFollow && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px'
                          }}
                        >
                          Follower
                        </span>
                      )}
                    </div>

                    <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '0.2rem', lineHeight: '1.4' }}>
                      {n.message || n.content || ''}
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.45rem' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
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
