'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import BottomNav from '../../components/BottomNav';
import ResumeStudio from '../../components/ResumeStudio';

// Imported Modular Component Tabs
import ProTab from '../../components/ProTab';
import DashboardTab from '../../components/DashboardTab';
import MyProfileTab from '../../components/MyProfileTab';
import PagesTab from '../../components/PagesTab';
import SavedPostsTab from '../../components/SavedPostsTab';
import NetworkTab from '../../components/NetworkTab';

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ProfilePortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', city: 'Pakistan', bio: '', headline: '', skills: '', avatar_url: '', resume_url: '', is_pro: false, is_ambassador: false, referral_badge: false, is_monetized: false, wallet_balance: 0
  });

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: '', headline: '', phone: '', city: 'Pakistan', bio: '', skills: '', avatar_url: '', resume_url: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [resumeData, setResumeData] = useState({
    summary: '', skills: '', experience: 'Senior Freelance Creator & Specialist (2024 - Present)', education: 'Bachelor of Science', languages: 'English, Urdu'
  });

  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [submittingPro, setSubmittingPro] = useState(false);
  const [latestProRequest, setLatestProRequest] = useState(null);

  const [myPostsCount, setMyPostsCount] = useState(0);
  const [myPages, setMyPages] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [savedPostsList, setSavedPostsList] = useState([]);

  const navigateToTab = (newTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: newTab }, '', `/profile?tab=${newTab}`);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) setActiveTab(tabParam);
    }
  }, []);

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

        const { data: profileData } = await supabase.from('profiles').select('*').ilike('email', myEmail).maybeSingle();

        const defaultProfile = {
          full_name: profileData?.full_name || profileData?.name || currentUser.user_metadata?.full_name || myEmail.split('@')[0],
          email: currentUser.email,
          phone: profileData?.phone || '',
          city: profileData?.city || 'Pakistan',
          headline: profileData?.headline || 'Professional Member on Shanora',
          bio: profileData?.bio || 'Passionate creator & professional on Shanora.pk',
          skills: profileData?.skills || '',
          avatar_url: profileData?.avatar_url || '',
          resume_url: profileData?.resume_url || '',
          is_pro: !!profileData?.is_pro,
          is_ambassador: !!profileData?.is_ambassador,
          referral_badge: !!profileData?.referral_badge,
          is_monetized: !!profileData?.is_monetized,
          wallet_balance: Number(profileData?.wallet_balance || 0)
        };

        setProfile(defaultProfile);
        setEditProfileForm(defaultProfile);

        const { data: followsData } = await supabase.from('user_follows').select('id, follower_email, following_email');
        if (followsData) {
          const myFollowersRaw = followsData.filter(f => (f.following_email || '').toLowerCase() === myEmail);
          const myFollowingsRaw = followsData.filter(f => (f.follower_email || '').toLowerCase() === myEmail);

          const curMap = {};
          myFollowingsRaw.forEach(f => { if (f.following_email) curMap[f.following_email.toLowerCase()] = true; });
          setFollowingMap(curMap);
          setFollowersList(myFollowersRaw);
          setFollowingList(myFollowingsRaw);
        }

        supabase.from('user_posts').select('id', { count: 'exact', head: true }).ilike('user_email', myEmail).then(({ count }) => { if (count !== null) setMyPostsCount(count); });
        supabase.from('pro_requests').select('*').ilike('user_email', myEmail).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => { if (data) setLatestProRequest(data); });
        supabase.from('pages').select('*').ilike('owner_email', myEmail).then(({ data }) => { if (data) setMyPages(data); });
        supabase.from('saved_posts').select('*, user_posts(*)').ilike('user_email', myEmail).then(({ data }) => { if (data) setSavedPostsList(data); });
        supabase.from('profiles').select('*').limit(30).then(({ data }) => {
          if (data) setDiscoverUsers(data.filter(p => (p.email || '').toLowerCase() !== myEmail));
        });
      } catch (err) {
        console.error('Error loading portal:', err);
      } finally {
        setLoading(false);
      }
    }
    initPortal();
  }, [router]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const updates = {
        email: user.email.toLowerCase(),
        full_name: sanitizeInput(editProfileForm.full_name?.trim()),
        headline: sanitizeInput(editProfileForm.headline?.trim()),
        phone: sanitizeInput(editProfileForm.phone?.trim()),
        city: sanitizeInput(editProfileForm.city?.trim()),
        bio: sanitizeInput(editProfileForm.bio?.trim()),
        skills: sanitizeInput(editProfileForm.skills?.trim()),
        avatar_url: editProfileForm.avatar_url,
        resume_url: editProfileForm.resume_url,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'email' });
      if (error) throw error;
      setProfile(prev => ({ ...prev, ...updates }));
      setShowEditProfileModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleProActivation(e) {
    e.preventDefault();
    if (!trxId.trim()) {
      alert('Please enter a valid Transaction ID.');
      return;
    }
    setSubmittingPro(true);
    try {
      const { data, error } = await supabase.from('pro_requests').insert([{
        user_email: user.email.toLowerCase(),
        transaction_id: trxId.trim(),
        payment_method: paymentMethod,
        amount: 499,
        status: 'pending'
      }]).select().single();

      if (error) throw error;
      setLatestProRequest(data);
      setTrxId('');
      alert('PRO request submitted successfully!');
    } catch (err) {
      alert('Error submitting request: ' + err.message);
    } finally {
      setSubmittingPro(false);
    }
  }

  async function handleToggleFollow(targetEmail) {
    if (!user || !targetEmail) return;
    const myEmail = user.email.toLowerCase();
    const cleanTarget = targetEmail.toLowerCase();
    const isFollowing = !!followingMap[cleanTarget];

    setActionLoading(prev => ({ ...prev, [cleanTarget]: true }));
    setFollowingMap(prev => ({ ...prev, [cleanTarget]: !isFollowing }));

    try {
      if (isFollowing) {
        await supabase.from('user_follows').delete().ilike('follower_email', myEmail).ilike('following_email', cleanTarget);
      } else {
        await supabase.from('user_follows').insert([{ follower_email: myEmail, following_email: cleanTarget }]);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [cleanTarget]: false }));
    }
  }

  async function handleRemoveSavedPost(savedId) {
    try {
      const { error } = await supabase.from('saved_posts').delete().eq('id', savedId);
      if (error) throw error;
      setSavedPostsList(prev => prev.filter(p => p.id !== savedId));
    } catch (err) {
      alert('Error removing saved post: ' + err.message);
    }
  }

  const allMenuItems = [
    { id: 'pro', label: 'Shanora PRO 👑', icon: '👑', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' },
    { id: 'invite_friends', label: 'Invite Friends 👥', icon: '👥', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.35)' },
    { id: 'advertiser_portal', label: 'Ads Manager 📢', icon: '📢', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', isLink: true, route: '/ads-manager' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
    { id: 'profile', label: 'My Profile', icon: '👤', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
    { id: 'messages', label: 'Messages', icon: '💬', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)', isLink: true, route: '/messages' },
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🏢', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
    { id: 'resume', label: 'My Resume 📄', icon: '📄', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    { id: 'monetization', label: 'Monetization 💰', icon: '💰', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', isLink: true, route: '/monetization' },
    { id: 'saved', label: `Saved Posts (${savedPostsList.length})`, icon: '🔖', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
    { id: 'network', label: 'Network & Connections', icon: '👥', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
    { id: 'alerts', label: 'Notifications 🔔', icon: '🔔', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', isLink: true, route: '/alerts' },
    { id: 'security', label: 'Account Security 🔒', icon: '🔒', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', isLink: true, route: '/settings/security' }
  ];

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'menu') navigateToTab('menu');
              else router.push('/feed');
            }}
            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
          >
            {activeTab !== 'menu' ? '←' : '✕'}
          </button>
          <Link href="/feed" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem', backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.28rem 0.65rem 0.28rem 0.35rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>S</div>
            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ fontSize: '0.55rem', color: '#38bdf8', verticalAlign: 'super' }}>.PK</span></span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem' }}>
        
        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <div>
            <div onClick={() => navigateToTab('profile')} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.2rem', cursor: 'pointer' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.full_name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{profile.full_name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{profile.headline || 'View profile'}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Shortcuts & Services</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem', marginBottom: '1.2rem' }}>
              {allMenuItems.map(item => {
                const card = (
                  <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.65rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: item.bg, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{item.icon}</div>
                    <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                  </div>
                );

                if (item.isLink) {
                  return <Link key={item.id} href={item.route} style={{ textDecoration: 'none' }}>{card}</Link>;
                }

                return (
                  <div key={item.id} onClick={() => {
                    if (item.id === 'invite_friends') setShowInviteModal(true);
                    else navigateToTab(item.id);
                  }}>
                    {card}
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={() => setShowLogoutModal(true)} style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
              Log Out
            </button>
          </div>
        )}

        {/* LINKED TABS FROM SEPARATE COMPONENTS */}
        {activeTab === 'pro' && (
          <ProTab profile={profile} latestProRequest={latestProRequest} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} trxId={trxId} setTrxId={setTrxId} submittingPro={submittingPro} handleProActivation={handleProActivation} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab profile={profile} myPostsCount={myPostsCount} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'profile' && (
          <MyProfileTab profile={profile} setShowEditProfileModal={setShowEditProfileModal} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'pages' && (
          <PagesTab myPages={myPages} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'resume' && (
          <ResumeStudio profile={profile} resumeData={resumeData} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'saved' && (
          <SavedPostsTab savedPostsList={savedPostsList} handleRemoveSavedPost={handleRemoveSavedPost} navigateToTab={navigateToTab} />
        )}

        {activeTab === 'network' && (
          <NetworkTab followersList={followersList} followingList={followingList} discoverUsers={discoverUsers} followingMap={followingMap} actionLoading={actionLoading} handleToggleFollow={handleToggleFollow} navigateToTab={navigateToTab} />
        )}

      </main>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div onClick={() => setShowEditProfileModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Edit Profile</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input type="text" value={editProfileForm.full_name} onChange={(e) => setEditProfileForm({...editProfileForm, full_name: e.target.value})} placeholder="Full Name" style={{ backgroundColor: '#1e293b', padding: '0.6rem', color: '#fff', borderRadius: '8px', border: '1px solid #334155' }} />
              <input type="text" value={editProfileForm.headline} onChange={(e) => setEditProfileForm({...editProfileForm, headline: e.target.value})} placeholder="Headline" style={{ backgroundColor: '#1e293b', padding: '0.6rem', color: '#fff', borderRadius: '8px', border: '1px solid #334155' }} />
              <textarea value={editProfileForm.bio} onChange={(e) => setEditProfileForm({...editProfileForm, bio: e.target.value})} placeholder="Bio" style={{ backgroundColor: '#1e293b', padding: '0.6rem', color: '#fff', borderRadius: '8px', border: '1px solid #334155' }} rows={3} />
              <button type="submit" disabled={updatingProfile} style={{ backgroundColor: '#38bdf8', color: '#000', padding: '0.7rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{updatingProfile ? 'Saving...' : 'Save Profile'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div onClick={() => setShowLogoutModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#0f172a', border: '1px solid #ef4444', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', maxWidth: '350px', width: '100%' }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Log Out?</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); }} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Yes, Logout</button>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, backgroundColor: '#1e293b', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function ProfilePortal() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading...</div>}>
      <ProfilePortalContent />
    </Suspense>
  );
  }
