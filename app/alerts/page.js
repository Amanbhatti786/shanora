'use client';

import { Suspense, useState, useEffect } from 'react';
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
            setNotifications(data);
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
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <span style={{ fontSize: '1.25rem' }}>🔔</span>
          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff' }}>Notifications & Alerts</span>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem 5.5rem 0.9rem' }}>
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
            {notifications.map((n) => (
              <div key={n.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>{n.title || 'Alert'}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{n.message || n.content}</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.4rem' }}>
                  {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading...</div>}>
      <AlertsContent />
    </Suspense>
  );
}
