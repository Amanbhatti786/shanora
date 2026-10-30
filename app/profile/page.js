'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ProfilePortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'network');
  const [networkSubTab, setNetworkSubTab] = useState('followers');
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: 'Pakistan'
  });

  const [myPages, setMyPages] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
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
        const myEmail = (currentUser.email || '').trim().toLowerCase();

        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', myEmail)
          .maybeSingle();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || profileData.name || currentUser.user_metadata?.full_name || myEmail.split('@')[0],
            email: currentUser.email,
            phone: profileData.phone || '',
            city: profileData.city || 'Pakistan'
          });
        } else {
          setProfile({
            full_name: currentUser.user_metadata?.full_name || myEmail.split('@')[0],
            email: currentUser.email,
            phone: '',
            city: 'Pakistan'
          });
        }

        // 2. Fetch Pages (For Menu only)
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .ilike('owner_email', myEmail)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // 3. Fetch Real Followers & Following
        const { data: followsData } = await supabase
          .from('user_follows')
          .select('id, follower_email, following_email, created_at');

        const curMap = {};
        if (followsData) {
          const myFollowers = followsData.filter(f => (f.following_email || '').toLowerCase() === myEmail);
          const myFollowings = followsData.filter(f => (f.follower_email || '').toLowerCase() === myEmail);

          setFollowersList(myFollowers);
          setFollowingList(myFollowings);

          myFollowings.forEach(f => {
            if (f.following_email) curMap[f.following_email.toLowerCase()] = true;
          });
          setFollowingMap(curMap);
        }

        // 4. Fetch Discover Users (People you may know)
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .limit(50);

        let discoveredList = [];
        if (allProfiles && allProfiles.length > 0) {
          discoveredList = allProfiles
            .filter(p => {
              const pEmail = (p.email || '').toLowerCase();
              return pEmail && pEmail !== myEmail && !curMap[pEmail];
            })
            .map(p => ({
              id: p.id || p.email,
              name: p.full_name || p.name || (p.email ? p.email.split('@')[0] : 'User'),
              email: p.email,
              avatar_url: p.avatar_url || null
            }));
        }

        // Fallback: Agar profiles table mein na milein toh posts table se collect karein
        if (discoveredList.length === 0) {
          const { data: postUsers } = await supabase
            .from('user_posts')
            .select('user_email, user_name')
            .limit(30);

          if (postUsers) {
            const uniqueUsers = {};
            postUsers.forEach(u => {
              const uEmail = (u.user_email || '').toLowerCase();
              if (uEmail && uEmail !== myEmail && !curMap[uEmail] && !uniqueUsers[uEmail]) {
                uniqueUsers[uEmail] = {
                  id: uEmail,
                  name: u.user_name || uEmail.split('@')[0],
                  email: uEmail,
                  avatar_url: null
                };
              }
            });
            discoveredList = Object.values(uniqueUsers);
          }
        }

        setDiscoverUsers(discoveredList);

        // 5. Fetch Notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .ilike('recipient_email', myEmail)
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

  async function handleToggleFollow(targetEmail) {
    if (!user || !targetEmail) return;

    const myEmail = (user.email || '').trim().toLowerCase();
    const cleanTarget = targetEmail.trim().toLowerCase();
    const isFollowing = !!followingMap[cleanTarget];

    setActionLoading(prev => ({ ...prev, [cleanTarget]: true }));
    setFollowingMap(prev => ({ ...prev, [cleanTarget]: !isFollowing }));

    if (isFollowing) {
      setFollowingList(prev => prev.filter(item => (item.following_email || '').toLowerCase() !== cleanTarget));
    } else {
      setFollowingList(prev => [...prev, { id: Date.now(), following_email: cleanTarget, follower_email: myEmail, created_at: new Date().toISOString() }]);
      // Discover list se foran hata dein
      setDiscoverUsers(prev => prev.filter(item => (item.email || '').toLowerCase() !== cleanTarget));
    }

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .ilike('follower_email', myEmail)
          .ilike('following_email', cleanTarget);
      } else {
        await supabase
          .from('user_follows')
          .insert([{ follower_email: myEmail, following_email: cleanTarget }]);

        await supabase
          .from('notifications')
          .insert([{
            recipient_email: cleanTarget,
            sender_name: profile.full_name || myEmail.split('@')[0],
            action_type: 'follow',
            content: 'started following you.',
            is_read: false
          }]);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      setFollowingMap(prev => ({ ...prev, [cleanTarget]: isFollowing }));
    } finally {
      setActionLoading(prev => ({ ...prev, [cleanTarget]: false }));
    }
  }

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
        .ilike('recipient_email', user.email.toLowerCase());
    }
  }

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Analytics & Overview', icon: '📊', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
    { id: 'profile', label: 'My Profile', desc: 'View & Edit Details', icon: '👤', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
    { id: 'network', label: 'Followers', desc: 'Followers & Following', icon: '👥', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)' },
    { id: 'pages', label: `Pages (${myPages.length})`, desc: 'Manage your pages', icon: '🚩', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
    { id: 'monetization', label: 'Monetization', desc: 'Earning Hub', icon: '💰', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.25)' },
    { id: 'resume', label: 'My Resume', desc: 'ATS Resume Builder', icon: '📝', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    { id: 'jobs', label: 'Find Jobs', desc: 'Internships & Careers', icon: '💼', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)' },
    { id: 'messages', label: 'Messages', desc: 'Direct 1-on-1 Chat', icon: '💬', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)' },
    { id: 'notifications', label: `Alerts ${unreadCount > 0 ? `(${unreadCount})` : ''}`, desc: 'Recent Updates', icon: '🔔', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
    { id: 'settings', label: 'Settings', desc: 'Privacy & Account', icon: '⚙️', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)' }
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
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
          SHANORA<span style={{ color: '#fff' }}>.PK</span>
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem 80px 0.9rem' }}>

        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <div>
            <div 
              onClick={() => setActiveTab('profile')}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '1.2rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{profile.full_name}</div>
                <div style={{ color: '#38bdf8', fontSize: '0.74rem' }}>View your profile →</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shortcuts & Services
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', marginBottom: '1.5rem' }}>
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
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: item.bg,
                    border: `1px solid ${item.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* TAB: NETWORK / FOLLOWERS */}
        {activeTab === 'network' && (
          <div>
            {/* Segment Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
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
                  cursor: 'pointer',
                  transition: 'background 0.2s'
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
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Following ({followingList.length})
              </button>
            </div>

            {/* Followers List View */}
            {networkSubTab === 'followers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followersList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Abhi tak aapka koi follower nahi hai.
                  </div>
                ) : (
                  followersList.map(item => {
                    const email = item.follower_email;
                    const cleanEmail = (email || '').toLowerCase();
                    const username = cleanEmail.split('@')[0];
                    const isFollowingBack = !!followingMap[cleanEmail];
                    return (
                      <div key={item.id} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {(cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Follows you
                            </div>
                          </div>
                        </Link>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(cleanEmail)}
                            disabled={actionLoading[cleanEmail]}
                            style={{
                              backgroundColor: isFollowingBack ? '#1e293b' : '#0284c7',
                              color: isFollowingBack ? '#94a3b8' : '#fff',
                              border: isFollowingBack ? '1px solid #334155' : 'none',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isFollowingBack ? 'Following' : 'Follow Back'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Following List View */}
            {networkSubTab === 'following' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followingList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Aap kisi ko follow nahi kar rahe.
                  </div>
                ) : (
                  followingList.map(item => {
                    const email = item.following_email;
                    const cleanEmail = (email || '').toLowerCase();
                    const username = cleanEmail.split('@')[0];
                    return (
                      <div key={item.id} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#38bdf8',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {(cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Following
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(cleanEmail)}
                          disabled={actionLoading[cleanEmail]}
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Unfollow
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* People You May Know / Discover */}
            <div style={{ marginTop: '2.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                  People you may know[cite: 12]
                </span>
                <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>
                  Discover[cite: 12]
                </span>
              </div>

              {discoverUsers.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Koi naya creator daryaft nahi hua[cite: 12].
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {discoverUsers.map(creator => {
                    const cleanEmail = (creator.email || '').toLowerCase();
                    const username = creator.name || cleanEmail.split('@')[0];
                    const isFollowing = !!followingMap[cleanEmail];
                    return (
                      <div key={creator.id || cleanEmail} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {(creator.name || cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {cleanEmail}
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(cleanEmail)}
                          disabled={actionLoading[cleanEmail]}
                          style={{
                            backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                            color: isFollowing ? '#94a3b8' : '#fff',
                            border: isFollowing ? '1px solid #334155' : 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            flexShrink: 0
                          }}
                        >
                          {isFollowing ? 'Following' : '+ Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: PAGES */}
        {activeTab === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Your Pages ({myPages.length})</h3>
              <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
            </div>

            {myPages.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Aapne abhi tak koi page create nahi kiya.
              </div>
            ) : (
              myPages.map(page => (
                <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem' }}>{page.name}</Link>
                  <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}>Visit</Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Notifications 🔔</h3>
              <button onClick={markNotificationsAsRead} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold' }}>
                Mark all as read
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Koi naya notification nahi hai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    backgroundColor: n.is_read ? '#0f172a' : '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem'
                  }}>
                    <div style={{ fontSize: '1.1rem' }}>
                      {n.action_type === 'like' && '👍'}
                      {n.action_type === 'comment' && '💬'}
                      {n.action_type === 'relay' && '🔄'}
                      {n.action_type === 'follow' && '👥'}
                    </div>
                    <div style={{ flex: 1, fontSize: '0.82rem', color: '#cbd5e1' }}>
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
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem' }}>
            <h3 style={{ margin: '0 0 0.9rem 0', fontSize: '1.1rem', color: '#fff' }}>Personal Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: '#cbd5e1' }}>
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
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Creator Hub</span>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>Welcome, {profile.full_name}</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Track network reach and managed pages.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Total Followers</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#38bdf8' }}>{followersList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Total Following</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#22c55e' }}>{followingList.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: JOBS */}
        {activeTab === 'jobs' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>💼</div>
            <h3 style={{ color: '#fff', margin: '0 0 0.4rem 0', fontSize: '1.05rem' }}>Jobs & Internships</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Browse opportunities and track your job applications.</p>
          </div>
        )}

        {/* OTHER SERVICE TABS */}
        {['monetization', 'resume', 'messages', 'settings'].includes(activeTab) && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.4rem 0', fontSize: '1.05rem', textTransform: 'capitalize' }}>{activeTab}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Feature hub is connected and active.</p>
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
