'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilePortal() {
  const router = useRouter();

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Data States
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

  // Pages & Posts State
  const [myPages, setMyPages] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  // Jobs & Applications Placeholder
  const [applications, setApplications] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

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

        // 2. Fetch User's Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .eq('owner_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // 3. Fetch User's Posts
        const { data: postsData } = await supabase
          .from('user_posts')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (postsData) setMyPosts(postsData);

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

  // Primary 3 Clean Tabs on Screen
  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🚩' }
  ];

  // Facebook Style Full Menu Items
  const menuGridItems = [
    { id: 'dashboard', label: 'Professional Dashboard', icon: '📊', color: '#38bdf8' },
    { id: 'profile', label: 'My Profile', icon: '👤', color: '#60a5fa' },
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🚩', color: '#f97316' },
    { id: 'resume', label: 'My Resume', icon: '📝', color: '#f59e0b' },
    { id: 'messages', label: 'Messages', icon: '💬', color: '#ec4899' },
    { id: 'monetization', label: 'Monetization Hub', icon: '💰', color: '#eab308' },
    { id: 'jobs', label: 'Find Jobs', icon: '🔍', color: '#38bdf8' },
    { id: 'applications', label: `Applications (${applications.length})`, icon: '📄', color: '#a855f7' },
    { id: 'saved', label: `Saved (${savedJobIds.size})`, icon: '★', color: '#6366f1' },
    { id: 'ai-tools', label: 'Shanora AI Suite', icon: '⚡', color: '#10b981' },
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
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.15rem' }}>
            SHANORA<span style={{ color: '#fff' }}>.PK</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none' }}>Feed 🌐</Link>
          <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      {/* Main Clean Tab Bar (3 Clean Tabs + Menu Button) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.5rem 0.8rem',
        maxWidth: '680px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
          {primaryTabs.map(tab => {
            const isAct = activeTab === tab.id && !showMenuDrawer;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowMenuDrawer(false); }}
                style={{
                  flex: 1,
                  backgroundColor: isAct ? '#0284c7' : '#1e293b',
                  color: isAct ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem 0.4rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
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

        {/* Facebook Style Menu Trigger Button */}
        <button
          onClick={() => setShowMenuDrawer(!showMenuDrawer)}
          style={{
            marginLeft: '0.5rem',
            backgroundColor: showMenuDrawer ? '#0284c7' : '#1e293b',
            color: showMenuDrawer ? '#fff' : '#38bdf8',
            border: '1px solid #334155',
            padding: '0.55rem 0.9rem',
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

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1rem 0.8rem 3rem 0.8rem' }}>

        {/* FACEBOOK STYLE MENU VIEW */}
        {showMenuDrawer ? (
          <div>
            {/* Top User Profile Bar in Menu */}
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
              All Shortcuts
            </div>

            {/* 2-Column Grid Like Facebook Menu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {menuGridItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMenuDrawer(false); }}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '80px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', color: item.color, marginBottom: '0.5rem' }}>
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
          /* REGULAR TAB CONTENT */
          <div>
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', marginBottom: '1.2rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                    Creator & Network Hub
                  </span>
                  <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>
                    Welcome, {profile.full_name || 'Member'}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                    Track network reach, followers growth, and managed pages.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
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

            {/* TAB: MY PROFILE */}
            {activeTab === 'profile' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.4rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>Personal Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <div>👤 <strong>Full Name:</strong> {profile.full_name}</div>
                  <div>📧 <strong>Email:</strong> {profile.email}</div>
                  <div>📱 <strong>Phone:</strong> {profile.phone || 'Not provided'}</div>
                  <div>💼 <strong>Headline:</strong> {profile.headline || 'Member'}</div>
                </div>
              </div>
            )}

            {/* TAB: PAGES */}
            {activeTab === 'pages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Official Pages</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Create and manage pages for your brand or community</p>
                  </div>
                  {myPages?.length > 0 && (
                    <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', textDecoration: 'none' }}>
                      + Create Page
                    </Link>
                  )}
                </div>

                {(!myPages || myPages.length === 0) ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                      🚩
                    </div>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', color: '#fff' }}>Create a Page on Shanora</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0 auto 1.2rem auto', maxWidth: '360px', lineHeight: 1.5 }}>
                      Build an official presence, grow your followers, and unlock creator analytics on Shanora.pk.
                    </p>
                    <Link href="/create-page" style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#fff', padding: '0.65rem 1.4rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'none' }}>
                      + Create Page Now
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myPages.map(page => (
                      <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link href={`/page/${page.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', flex: 1 }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1e293b', backgroundImage: page.logo_url ? `url(${page.logo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8', border: '1px solid #334155', flexShrink: 0 }}>
                            {!page.logo_url && (page.name?.charAt(0) || 'P').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>{page.name}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{page.followers_count || 0} followers • {page.category || 'Creator'}</div>
                          </div>
                        </Link>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
                            Visit
                          </Link>
                          <Link href="/monetization" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
                            Dashboard
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MY RESUME */}
            {activeTab === 'resume' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.4rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>My Resume</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <div>🎓 <strong>Candidate Name:</strong> {profile.full_name}</div>
                  <div>🛠️ <strong>Key Skills:</strong> {profile.skills || 'Content Creation, Video Editing'}</div>
                  <div>📍 <strong>Location:</strong> {profile.city}</div>
                </div>
              </div>
            )}

            {/* TAB: MESSAGES */}
            {activeTab === 'messages' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                <h4 style={{ color: '#fff', margin: '0 0 0.4rem 0' }}>Messages & Inbox</h4>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No new messages yet.</p>
              </div>
            )}

             {/* TAB: MONETIZATION */}
            {activeTab === 'monetization' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <h4 style={{ color: '#fff', margin: '0 0 0.4rem 0' }}>Creator Monetization</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Check video earnings, follower milestones, and payouts.</p>
                <Link href="/monetization" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.55rem 1.2rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', textDecoration: 'none' }}>
                  Open Creator Hub
                </Link>
              </div>
            )}

            {/* OTHER SECTIONS */}
            {['jobs', 'applications', 'saved', 'ai-tools', 'settings'].includes(activeTab) && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <h4 style={{ color: '#fff', textTransform: 'capitalize' }}>{activeTab}</h4>
                <p style={{ fontSize: '0.85rem' }}>This section is active and ready for your data.</p>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
              }
