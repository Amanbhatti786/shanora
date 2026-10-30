'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ProfilePortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'network');
  const [networkSubTab, setNetworkSubTab] = useState('pages');
  const [loading, setLoading] = useState(true);

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
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
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

        // Fetch Profile
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

        // Fetch Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('owner_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // Fetch Posts
        const { data: postsData } = await supabase
          .from('user_posts')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (postsData) setMyPosts(postsData);

        // Fetch Followers
        const { data: followersData } = await supabase
          .from('user_follows')
          .select('id, follower_email, created_at')
          .eq('following_email', currentUser.email);

        if (followersData) setFollowersList(followersData);

        // Fetch Following
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('id, following_email, created_at')
          .eq('follower_email', currentUser.email);

        if (followingData) setFollowingList(followingData);

        // Fetch Notifications
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
    if (!confirm('Kya aap logout karna chahte hain?')) return;
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

  // Mukammal Purane aur Naye Options ka Grid
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: '#38bdf8' },
    { id: 'profile', label: 'My Profile', icon: '👤', color: '#818cf8' },
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🚩', color: '#f97316' },
    { id: 'network', label: 'Network & Friends', icon: '👥', color: '#06b6d4' },
    { id: 'monetization', label: 'Monetization Hub', icon: '💰', color: '#eab308' },
    { id: 'resume', label: 'My Resume', icon: '📝', color: '#f59e0b' },
    { id: 'jobs', label: 'Find Jobs', icon: '🔍', color: '#22c55e' },
    { id: 'messages', label: 'Messages', icon: '💬', color: '#ec4899' },
    { id: 'notifications', label: `Alerts ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: '🔔', color: '#ef4444' },
    { id: 'settings', label: 'Settings & Privacy', icon: '⚙️', color: '#94a3b8' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. Header: Clean logo only */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.3rem', letterSpacing: '-0.5px' }}>
          SHANORA<span style={{ color: '#fff' }}>.PK</span>
        </Link>
      </header>

      {/* 2. Main Content */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.2rem 1rem 85px 1rem' }}>

        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <div>
            {/* Top Profile Card */}
            <div 
              onClick={() => setActiveTab('profile')}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '1rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.05rem' }}>{profile.full_name}</div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>View your profile ➔</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              All Shortcuts & Services
            </div>

            {/* Complete Menu Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.8rem' }}>
              {allMenuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'notifications') markNotificationsAsRead();
                  }}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '1.1rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '88px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', color: item.color, marginBottom: '0.4rem' }}>
                    {item.icon}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                padding: '0.9rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              <span>Logout from Shanora</span>
            </button>
          </div>
        )}

        {/* TAB: NETWORK (Followers, Following, Pages) */}
        {(activeTab === 'network' || activeTab === 'pages') && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.4rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <button
                onClick={() => setNetworkSubTab('pages')}
                style={{
                  flex: 1,
                  backgroundColor: networkSubTab === 'pages' ? '#0284c7' : 'transparent',
                  color: networkSubTab === 'pages' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Pages ({myPages.length})
              </button>

              <button
                onClick={() => setNetworkSubTab('followers')}
                style={{
                  flex: 1,
                  backgroundColor: networkSubTab === 'followers' ? '#0284c7' : 'transparent',
                  color: networkSubTab === 'followers' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Followers ({followersList.length})
              </button>

              <button
                onClick={() => setNetworkSubTab('following')}
                style={{
                  flex: 1,
                  backgroundColor: networkSubTab === 'following' ? '#0284c7' : 'transparent',
                  color: networkSubTab === 'following' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Following ({followingList.length})
              </button>
            </div>

            {/* Pages View */}
            {networkSubTab === 'pages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Your Pages ({myPages.length})</h3>
                  <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
                </div>

                {myPages.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Aapne koi page create nahi kiya.
                  </div>
                ) : (
                  myPages.map(page => (
                    <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}>{page.name}</Link>
                      <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>Visit</Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Followers View */}
            {networkSubTab === 'followers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followersList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Abhi tak koi follower nahi hai.
                  </div>
                ) : (
                  followersList.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                          {item.follower_email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem' }}>{item.follower_email}</div>
                      </div>
                      <Link href={`/view-profile?email=${encodeURIComponent(item.follower_email)}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 'bold' }}>Profile</Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Following View */}
            {networkSubTab === 'following' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followingList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Aap kisi ko follow nahi kar rahe.
                  </div>
                ) : (
                  followingList.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                          {item.following_email.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem' }}>{item.following_email}</div>
                      </div>
                      <Link href={`/view-profile?email=${encodeURIComponent(item.following_email)}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 'bold' }}>Profile</Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>Notifications 🔔</h3>
              <button onClick={markNotificationsAsRead} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PROFILE DETAILS */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff' }}>Personal Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div>👤 <strong>Full Name:</strong> {profile.full_name}</div>
              <div>📧 <strong>Email:</strong> {profile.email}</div>
              <div>📱 <strong>Phone:</strong> {profile.phone || 'Not provided'}</div>
              <div>📍 <strong>Location:</strong> {profile.city || 'Pakistan'}</div>
            </div>
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Creator & Network Hub</span>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>Welcome, {profile.full_name}</h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>Track network reach, followers growth, and managed pages.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Followers</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{followersList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Pages</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{myPages.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FIND JOBS */}
        {activeTab === 'jobs' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Explore Jobs & Internships</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Jobs portal integration is ready. You can browse and post opportunities.</p>
          </div>
        )}

        {/* TAB: MONETIZATION */}
        {activeTab === 'monetization' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Creator Monetization Hub</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Eligible creator pages can apply once minimum follower requirements are met.</p>
          </div>
        )}

        {/* TAB: RESUME */}
        {activeTab === 'resume' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>ATS Resume Hub</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Create, export, and scan professional ATS-compliant resumes.</p>
          </div>
        )}

        {/* TAB: MESSAGES */}
        {activeTab === 'messages' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Direct Messages</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>1-to-1 secure chat with professionals and creators.</p>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Account Settings & Privacy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div>Security & Login Credentials</div>
              <div>Profile Visibility Settings</div>
              <div>Notification Preferences</div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

export default function ProfilePortal() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    }>
      <ProfilePortalContent />
    </Suspense>
  );
          }
