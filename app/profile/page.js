'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilePortal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation States
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'dashboard');
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  // User & Data States
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: 'Pakistan',
    headline: '',
    bio: '',
    avatar_url: '',
    skills: ''
  });

  const [myPages, setMyPages] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    async function initPortal() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (profileData) {
          setProfile(prev => ({
            ...prev,
            ...profileData,
            full_name: profileData.name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
            email: currentUser.email
          }));
        } else {
          setProfile(prev => ({
            ...prev,
            full_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
            email: currentUser.email
          }));
        }

        // 2. Fetch Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('owner_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // 3. Fetch Posts
        const { data: postsData } = await supabase
          .from('user_posts')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (postsData) setMyPosts(postsData);

        // 4. Fetch Notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_email', currentUser.email)
          .order('created_at', { ascending: false })
          .limit(30);

        if (notifData) {
          setNotifications(notifData);
          setUnreadCount(notifData.filter(n => !n.is_read).length);
        }

      } catch (err) {
        console.error('Portal init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initPortal();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  async function markNotificationsAsRead() {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    if (user?.email) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_email', user.email);
    }
  }

  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'notifications', label: `Alerts ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: '🔔' }
  ];

  const menuGridItems = [
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🚩', color: '#f97316' },
    { id: 'monetization', label: 'Monetization Hub', icon: '💰', color: '#eab308' },
    { id: 'resume', label: 'My Resume', icon: '📝', color: '#f59e0b' },
    { id: 'messages', label: 'Messages', icon: '💬', color: '#ec4899' },
    { id: 'jobs', label: 'Find Jobs', icon: '🔍', color: '#38bdf8' },
    { id: 'settings', label: 'Settings & Privacy', icon: '⚙️', color: '#94a3b8' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading Portal...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '75px' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#fff' }}>.PK</span>
        </Link>
        <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Tabs Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.5rem 0.8rem',
        maxWidth: '680px',
        margin: '0 auto',
        gap: '0.4rem'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
          {primaryTabs.map(tab => {
            const isAct = activeTab === tab.id && !showMenuDrawer;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMenuDrawer(false);
                  if (tab.id === 'notifications') markNotificationsAsRead();
                }}
                style={{
                  flex: 1,
                  backgroundColor: isAct ? '#0284c7' : '#1e293b',
                  color: isAct ? '#fff' : '#94a3b8',
                  border: isAct ? 'none' : '1px solid #334155',
                  padding: '0.55rem 0.2rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                <span>{tab.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Facebook Menu Drawer Button */}
        <button
          onClick={() => setShowMenuDrawer(!showMenuDrawer)}
          style={{
            backgroundColor: showMenuDrawer ? '#0284c7' : '#1e293b',
            color: showMenuDrawer ? '#fff' : '#38bdf8',
            border: '1px solid #334155',
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <span>☰</span>
          <span>Menu</span>
        </button>
      </div>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1rem 0.8rem' }}>

        {/* MENU DRAWER */}
        {showMenuDrawer ? (
          <div>
            <div 
              onClick={() => { setActiveTab('profile'); setShowMenuDrawer(false); }}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '0.9rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '1.2rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem' }}>{profile.full_name}</div>
                <div style={{ color: '#38bdf8', fontSize: '0.76rem' }}>View your profile ➔</div>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
              All Shortcuts & Services
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {menuGridItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMenuDrawer(false); }}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '1rem 0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '85px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', color: item.color, marginBottom: '0.4rem' }}>
                    {item.icon}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Notifications 🔔</h3>
                  <button onClick={markNotificationsAsRead} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Mark all as read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Koi naya notification nahi hai.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{
                        backgroundColor: n.is_read ? '#0f172a' : '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '0.8rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem'
                      }}>
                        <div style={{ fontSize: '1.2rem' }}>
                          {n.action_type === 'like' && '👍'}
                          {n.action_type === 'comment' && '💬'}
                          {n.action_type === 'relay' && '🔄'}
                          {n.action_type === 'follow' && '👥'}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.85rem', color: '#cbd5e1' }}>
                          <strong style={{ color: '#fff' }}>{n.sender_name || 'A user'}</strong> {n.content || 'interacted with your content.'}
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {!n.is_read && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', marginBottom: '1.2rem' }}>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Creator & Network Hub</span>
                  <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>Welcome, {profile.full_name || 'Member'}</h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Track network reach, followers growth, and managed pages.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Pages</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>{myPages.length}</div>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Personal Posts</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#22c55e' }}>{myPosts.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.4rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>Personal Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <div>👤 <strong>Full Name:</strong> {profile.full_name}</div>
                  <div>📧 <strong>Email:</strong> {profile.email}</div>
                  <div>📱 <strong>Phone:</strong> {profile.phone || 'Not provided'}</div>
                </div>
              </div>
            )}

            {/* TAB: PAGES */}
            {activeTab === 'pages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Your Pages ({myPages.length})</h3>
                  <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
                </div>
                {myPages.map(page => (
                  <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>{page.name}</Link>
                    <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 'bold' }}>Visit</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
                  }
                     
