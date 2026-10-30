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
    city: 'Pakistan',
    resume_url: ''
  });

  const [myPages, setMyPages] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Jobs States
  const [jobsList, setJobsList] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    job_type: 'Full-time',
    salary_range: '',
    description: ''
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // Apply Modal & Form State
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: 'Fresh Graduate',
    resume_link: '',
    cover_note: ''
  });

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
            city: profileData.city || 'Pakistan',
            resume_url: profileData.resume_url || profileData.resume_link || ''
          });
        } else {
          setProfile({
            full_name: currentUser.user_metadata?.full_name || myEmail.split('@')[0],
            email: currentUser.email,
            phone: '',
            city: 'Pakistan',
            resume_url: ''
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

        // 4. Fetch Discover Users
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

        // 6. Fetch Jobs & User Applications
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (allJobs) setJobsList(allJobs);

        const { data: myApps } = await supabase
          .from('job_applications')
          .select('job_id')
          .ilike('applicant_email', myEmail);

        if (myApps) {
          const appMap = {};
          myApps.forEach(a => {
            if (a.job_id) appMap[a.job_id] = true;
          });
          setAppliedJobsMap(appMap);
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

  // Open Form Modal with Auto-filled Profile Data
  function openApplyModal(job) {
    if (!user) {
      router.push('/auth');
      return;
    }

    setApplyForm({
      name: profile.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      phone: profile.phone || '',
      city: profile.city || 'Pakistan',
      experience: 'Fresh Graduate',
      resume_link: profile.resume_url || '',
      cover_note: ''
    });

    setSelectedJobForApply(job);
  }

  // Submit Job Application Form
  async function handleSubmitApplication(e) {
    e.preventDefault();
    if (!selectedJobForApply || !user) return;

    if (!applyForm.phone.trim()) {
      alert('Kripya apna phone/WhatsApp number darj karein.');
      return;
    }

    setSubmittingApplication(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: selectedJobForApply.id,
          applicant_email: user.email.toLowerCase(),
          applicant_name: applyForm.name,
          phone: applyForm.phone,
          city: applyForm.city,
          experience: applyForm.experience,
          resume_link: applyForm.resume_link,
          cover_note: applyForm.cover_note
        }]);

      if (error) throw error;

      setAppliedJobsMap(prev => ({ ...prev, [selectedJobForApply.id]: true }));
      setSelectedJobForApply(null);
      alert('Aapki application successfully submit ho gayi hai! 🚀');
    } catch (err) {
      alert('Application submit nahi ho saki: ' + err.message);
    } finally {
      setSubmittingApplication(false);
    }
  }

  // Post New Job Handler
  async function handleCreateJob(e) {
    e.preventDefault();
    if (!user) return;
    if (!jobFormData.title || !jobFormData.company_name) {
      alert('Title and Company Name are required.');
      return;
    }

    setSubmittingJob(true);
    try {
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert([{
          employer_email: user.email.toLowerCase(),
          company_name: jobFormData.company_name,
          title: jobFormData.title,
          location: jobFormData.location || 'Pakistan',
          job_type: jobFormData.job_type,
          salary_range: jobFormData.salary_range,
          description: jobFormData.description
        }])
        .select()
        .single();

      if (error) throw error;

      setJobsList([newJob, ...jobsList]);
      setShowPostJobModal(false);
      setJobFormData({
        title: '',
        company_name: '',
        location: '',
        job_type: 'Full-time',
        salary_range: '',
        description: ''
      });
      alert('Job posted successfully! 💼');
    } catch (err) {
      alert('Failed to post job: ' + err.message);
    } finally {
      setSubmittingJob(false);
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

            {/* People You May Know */}
            <div style={{ marginTop: '2.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                  People you may know
                </span>
                <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>
                  Discover
                </span>
              </div>

              {discoverUsers.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Koi naya creator daryaft nahi hua.
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0 0.2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Notifications</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Earlier updates & interactions</span>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markNotificationsAsRead} 
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', padding: '0.3rem 0.5rem', borderRadius: '6px' }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔔</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No notifications yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>When someone follows you or interacts with your posts, you'll see it here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifications.map(n => {
                  const senderEmail = n.sender_email || '';
                  const senderName = n.sender_name || (senderEmail ? senderEmail.split('@')[0] : 'Someone');
                  const targetProfileUrl = senderEmail 
                    ? `/view-profile?email=${encodeURIComponent(senderEmail)}`
                    : (n.sender_name ? `/view-profile?email=${encodeURIComponent(n.sender_name)}` : '#');

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
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '1.15rem',
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
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: n.action_type === 'follow' ? '#0284c7' : (n.action_type === 'like' ? '#38bdf8' : '#22c55e'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          border: '2px solid #0f172a',
                          color: '#fff'
                        }}>
                          {n.action_type === 'follow' ? '👤' : (n.action_type === 'like' ? '👍' : '💬')}
                        </div>
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.35' }}>
                          <strong style={{ color: '#fff', fontWeight: '700' }}>{senderName}</strong> {n.content || 'interacted with you.'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: n.is_read ? '#64748b' : '#38bdf8', marginTop: '0.2rem', fontWeight: n.is_read ? '500' : '700' }}>
                          {timeLabel}
                        </div>
                      </div>

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
              {profile.resume_url && (
                <div>📄 <strong>Resume Link:</strong> <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>View uploaded CV</a></div>
              )}
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
          <div>
            {/* Header + Post Job Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0 0.2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Opportunities & Careers</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Explore internships and full-time roles</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPostJobModal(!showPostJobModal)}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {showPostJobModal ? '✕ Close' : '+ Post a Job'}
              </button>
            </div>

            {/* Post Job Form */}
            {showPostJobModal && (
              <form onSubmit={handleCreateJob} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>Post New Opening</h4>
                
                <input
                  type="text"
                  placeholder="Job Title (e.g. Frontend Developer, Video Editor)"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input
                    type="text"
                    placeholder="Company / Page Name"
                    value={jobFormData.company_name}
                    onChange={(e) => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Remote, Karachi)"
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <select
                    value={jobFormData.job_type}
                    onChange={(e) => setJobFormData({ ...jobFormData, job_type: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Salary / Stipend (e.g. 50k - 80k PKR)"
                    value={jobFormData.salary_range}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_range: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <textarea
                  placeholder="Job brief description and requirements..."
                  rows={3}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
                />

                <button
                  type="submit"
                  disabled={submittingJob}
                  style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: submittingJob ? 'not-allowed' : 'pointer' }}
                >
                  {submittingJob ? 'Publishing...' : 'Publish Vacancy'}
                </button>
              </form>
            )}

            {/* Jobs List */}
            {jobsList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>💼</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No job openings active yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Be the first company or creator to post an opening!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {jobsList.map(job => {
                  const isApplied = !!appliedJobsMap[job.id];
                  const isOwner = user?.email && (job.employer_email || '').toLowerCase() === user.email.toLowerCase();

                  return (
                    <div key={job.id} style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '14px',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.7rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>{job.title}</div>
                          <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '600', marginTop: '0.15rem' }}>{job.company_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            📍 {job.location || 'Pakistan'} • ⏱️ {job.job_type || 'Full-time'}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          flexShrink: 0
                        }}>
                          {job.salary_range || 'Market Competitive'}
                        </span>
                      </div>

                      {job.description && (
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {job.description}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </span>

                        {isOwner ? (
                          <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: '700' }}>Your Listing ✓</span>
                        ) : (
                          <button
                            type="button"
                            disabled={isApplied}
                            onClick={() => openApplyModal(job)}
                            style={{
                              backgroundColor: isApplied ? '#1e293b' : '#0284c7',
                              color: isApplied ? '#94a3b8' : '#fff',
                              border: isApplied ? '1px solid #334155' : 'none',
                              padding: '0.42rem 1.1rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: isApplied ? 'default' : 'pointer'
                            }}
                          >
                            {isApplied ? 'Applied ✓' : 'Easy Apply ⚡'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* POP-UP FORM MODAL (EASY APPLY WITH AUTO-FILL) */}
      {selectedJobForApply && (
        <div 
          onClick={() => setSelectedJobForApply(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.4rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Apply for {selectedJobForApply.title}</h3>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{selectedJobForApply.company_name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedJobForApply(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Full Name (Auto-filled)</label>
                <input
                  type="text"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Email Address</label>
                <input
                  type="email"
                  value={applyForm.email}
                  disabled
                  style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#94a3b8', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>WhatsApp / Phone *</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Current City</label>
                  <input
                    type="text"
                    placeholder="e.g. Sukkur, Karachi"
                    value={applyForm.city}
                    onChange={(e) => setApplyForm({ ...applyForm, city: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Experience Level</label>
                <select
                  value={applyForm.experience}
                  onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Fresh Graduate">Fresh Graduate / Student</option>
                  <option value="1-2 Years">1 - 2 Years Experience</option>
                  <option value="3-5 Years">3 - 5 Years Experience</option>
                  <option value="5+ Years">Senior (5+ Years)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Resume / Portfolio Link</label>
                  {profile.resume_url && (
                    <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: '700' }}>Auto-linked from profile ✓</span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Paste Google Drive or LinkedIn CV link"
                  value={applyForm.resume_link}
                  onChange={(e) => setApplyForm({ ...applyForm, resume_link: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Short Note (Optional)</label>
                <textarea
                  placeholder="Why are you suitable for this role?"
                  rows={2}
                  value={applyForm.cover_note}
                  onChange={(e) => setApplyForm({ ...applyForm, cover_note: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedJobForApply(null)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApplication}
                  style={{ flex: 2, backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: submittingApplication ? 'not-allowed' : 'pointer' }}
                >
                  {submittingApplication ? 'Submitting...' : 'Submit Application 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
