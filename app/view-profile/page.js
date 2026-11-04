'use client';



import { Suspense, useState, useEffect } from 'react';

import Link from 'next/link';

import { useRouter, useSearchParams } from 'next/navigation';

import { supabase } from '../../lib/supabaseClient';

import BottomNav from '../../components/BottomNav';



// Sleek Executive PRO Verified Badge (Cyan / Electric Blue)

function ProVerifiedBadge({ size = 18 }) {

  return (

    <span 

      title="Verified PRO Member" 

      style={{ 

        display: 'inline-flex', 

        alignItems: 'center', 

        justifyContent: 'center',

        verticalAlign: 'middle',

        marginLeft: '5px',

        flexShrink: 0

      }}

    >

      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

        <circle cx="12" cy="12" r="10.5" fill="url(#fbProGrad)" stroke="#38bdf8" strokeWidth="1.2" />

        <path d="M7.5 12.2L10.3 15L16.5 9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        <defs>

          <linearGradient id="fbProGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">

            <stop stopColor="#0284c7" />

            <stop offset="1" stopColor="#0369a1" />

          </linearGradient>

        </defs>

      </svg>

    </span>

  );

}



function ViewProfileContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const targetEmailParam = searchParams?.get('email');



  const [currentUser, setCurrentUser] = useState(null);

  const [targetUser, setTargetUser] = useState(null);

  const [loading, setLoading] = useState(true);



  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photos', 'about'

  const [isFollowing, setIsFollowing] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);



  const [followersList, setFollowersList] = useState([]);

  const [followingList, setFollowingList] = useState([]);

  const [userPosts, setUserPosts] = useState([]);

  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);



  useEffect(() => {

    async function loadProfile() {

      if (!targetEmailParam) {

        setLoading(false);

        return;

      }



      try {

        const { data: { session } } = await supabase.auth.getSession();

        const me = session?.user || null;

        setCurrentUser(me);



        const cleanTargetEmail = decodeURIComponent(targetEmailParam).trim().toLowerCase();



        // 1. Fetch Target Profile

        const { data: profileData } = await supabase

          .from('profiles')

          .select('*')

          .ilike('email', cleanTargetEmail)

          .maybeSingle();



        if (profileData) {

          setTargetUser(profileData);

        } else {

          // Fallback if profile row is not yet initialized

          setTargetUser({

            email: cleanTargetEmail,

            full_name: cleanTargetEmail.split('@')[0],

            headline: 'Professional Member on Shanora.pk',

            city: 'Pakistan',

            bio: '',

            skills: '',

            avatar_url: '',

            resume_url: '',

            is_pro: false

          });

        }



        // 2. Fetch Network / Follow Relationships

        const { data: followsData } = await supabase

          .from('user_follows')

          .select('*');



        if (followsData) {

          const myEmail = (me?.email || '').toLowerCase();

          const targetFollowers = followsData.filter(f => (f.following_email || '').toLowerCase() === cleanTargetEmail);

          const targetFollowing = followsData.filter(f => (f.follower_email || '').toLowerCase() === cleanTargetEmail);



          setFollowersList(targetFollowers);

          setFollowingList(targetFollowing);



          // Check if currently logged in user follows this profile

          if (myEmail) {

            const alreadyFollowing = targetFollowers.some(f => (f.follower_email || '').toLowerCase() === myEmail);

            setIsFollowing(alreadyFollowing);

          }



          // Fetch Followers preview avatars

          const previewEmails = targetFollowers.map(f => (f.follower_email || '').toLowerCase()).slice(0, 10);

          if (previewEmails.length > 0) {

            const { data: previewProfiles } = await supabase

              .from('profiles')

              .select('email, name, full_name, avatar_url, last_seen')

              .in('email', previewEmails);



            if (previewProfiles) {

              setFollowersList(previewProfiles);

            }

          }

        }



        // 3. Fetch Target User's Feed Posts

        const { data: postsData } = await supabase

          .from('user_posts')

          .select('*')

          .ilike('user_email', cleanTargetEmail)

          .order('created_at', { ascending: false });



        if (postsData) {

          setUserPosts(postsData);

        }

      } catch (err) {

        console.error('Error loading public profile:', err);

      } finally {

        setLoading(false);

      }

    }



    loadProfile();

  }, [targetEmailParam]);



  // Handle Follow / Unfollow

  async function handleToggleFollow() {

    if (!currentUser) {

      router.push('/auth');

      return;

    }

    if (!targetUser?.email) return;



    const myEmail = currentUser.email.toLowerCase();

    const targetEmail = targetUser.email.toLowerCase();



    if (myEmail === targetEmail) {

      alert('You cannot follow your own profile.');

      return;

    }



    setActionLoading(true);

    const nextFollowingState = !isFollowing;

    setIsFollowing(nextFollowingState);



    try {

      if (!nextFollowingState) {

        await supabase

          .from('user_follows')

          .delete()

          .ilike('follower_email', myEmail)

          .ilike('following_email', targetEmail);

      } else {

        await supabase

          .from('user_follows')

          .insert([{ follower_email: myEmail, following_email: targetEmail }]);

      }

    } catch (err) {

      console.error('Follow action failed:', err);

      setIsFollowing(!nextFollowingState);

    } finally {

      setActionLoading(false);

    }

  }



  // Handle Direct Message Redirection to Profile/Messenger tab

  function handleOpenMessage() {

    if (!currentUser) {

      router.push('/auth');

      return;

    }

    if (!targetUser?.email) return;



    // Navigate to /profile with messenger tab and receiver preloaded

    router.push(`/profile?tab=messages&chat=${encodeURIComponent(targetUser.email)}`);

  }



  function handleCopyProfileLink() {

    if (typeof window !== 'undefined' && navigator.clipboard) {

      navigator.clipboard.writeText(window.location.href);

      setCopiedLink(true);

      setTimeout(() => setCopiedLink(false), 2000);

    }

  }



  function isUserOnline(lastSeen) {

    if (!lastSeen) return false;

    const diff = Date.now() - new Date(lastSeen).getTime();

    return diff >= 0 && diff < 3 * 60 * 1000;

  }



  if (loading) {

    return (

      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>

        Loading Profile...

      </div>

    );

  }



  if (!targetUser) {

    return (

      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', padding: '1.5rem', textAlign: 'center' }}>

        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>👤</div>

        <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Profile Not Found</h3>

        <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>The user profile you are looking for does not exist or has been modified.</p>

        <button onClick={() => router.push('/feed')} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>

          Back to Feed

        </button>

      </div>

    );

  }



  const isMe = currentUser?.email && currentUser.email.toLowerCase() === targetUser.email.toLowerCase();

  const displayName = targetUser.full_name || targetUser.name || targetUser.email.split('@')[0];



  return (

    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top Header (Facebook Style with Back arrow and Title) */}

      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>

          <button

            type="button"

            onClick={() => router.back()}

            style={{

              width: '32px',

              height: '32px',

              borderRadius: '8px',

              backgroundColor: '#1e293b',

              border: '1px solid #334155',

              color: '#38bdf8',

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

          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

            <span>{displayName}</span>

            {targetUser.is_pro && <ProVerifiedBadge size={16} />}

          </div>

        </div>



        <button

          type="button"

          onClick={() => setShowOptionsModal(true)}

          style={{

            backgroundColor: '#1e293b',

            border: '1px solid #334155',

            color: '#fff',

            borderRadius: '8px',

            width: '34px',

            height: '34px',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

            cursor: 'pointer',

            fontSize: '1rem'

          }}

        >

          •••

        </button>

      </header>



      {/* Main Profile Body Container */}

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 0 90px 0' }}>

        

        {/* Profile Banner Background */}

        <div style={{

          height: '140px',

          background: 'linear-gradient(135deg, #0369a1 0%, #0b1322 100%)',

          position: 'relative',

          borderBottom: '1px solid #1e293b'

        }} />



        {/* User Avatar & Identity Header */}

        <div style={{ padding: '0 1rem', position: 'relative', marginTop: '-50px', marginBottom: '1rem' }}>

          <div style={{ position: 'relative', display: 'inline-block' }}>

            <div style={{

              width: '96px',

              height: '96px',

              borderRadius: '50%',

              backgroundColor: '#0284c7',

              border: '4px solid #070b14',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              fontSize: '2.4rem',

              fontWeight: '900',

              color: '#fff',

              overflow: 'hidden',

              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'

            }}>

              {targetUser.avatar_url ? (

                <img src={targetUser.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              ) : (

                displayName.charAt(0).toUpperCase()

              )}

            </div>



            {isUserOnline(targetUser.last_seen) && (

              <div 

                title="Active Now" 

                style={{ 

                  position: 'absolute', 

                  bottom: '6px', 

                  right: '6px', 

                  width: '16px', 

                  height: '16px', 

                  borderRadius: '50%', 

                  backgroundColor: '#22c55e', 

                  border: '3px solid #070b14',

                  boxShadow: '0 0 8px #22c55e'

                }} 

              />

            )}

          </div>



          <div style={{ marginTop: '0.65rem' }}>

            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>

              <span>{displayName}</span>

              {targetUser.is_pro && <ProVerifiedBadge size={22} />}

            </h1>

            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.15rem' }}>

              @{targetUser.username || targetUser.email.split('@')[0]}

            </div>



            {targetUser.bio && (

              <p style={{ margin: '0.65rem 0 0.8rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.45' }}>

                {targetUser.bio}

              </p>

            )}



            {/* Followers / Following Stats */}

            <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.82rem', marginTop: '0.5rem', color: '#94a3b8' }}>

              <div>

                <strong style={{ color: '#fff' }}>{followersList.length}</strong> Followers

              </div>

              <div>

                <strong style={{ color: '#fff' }}>{followingList.length}</strong> Following

              </div>

              <div>

                <strong style={{ color: '#fff' }}>{userPosts.length}</strong> Posts

              </div>

            </div>

          </div>



          {/* EXACT FACEBOOK-STYLE ACTION BUTTONS (FOLLOW + MESSAGE + MORE) */}

          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', marginTop: '1.1rem' }}>

            {isMe ? (

              <button

                type="button"

                onClick={() => router.push('/profile')}

                style={{

                  flex: 1,

                  backgroundColor: '#1e293b',

                  border: '1px solid #334155',

                  color: '#38bdf8',

                  padding: '0.65rem 1rem',

                  borderRadius: '10px',

                  fontSize: '0.85rem',

                  fontWeight: '800',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  gap: '0.4rem'

                }}

              >

                <span>✏️</span>

                <span>Edit Profile</span>

              </button>

            ) : (

              <>

                {/* 1. Friends / Following Button (Grey / Dark Facebook Style) */}

                <button

                  type="button"

                  onClick={handleToggleFollow}

                  disabled={actionLoading}

                  style={{

                    flex: 1,

                    backgroundColor: isFollowing ? '#1e293b' : '#334155',

                    color: isFollowing ? '#cbd5e1' : '#fff',

                    border: '1px solid #475569',

                    padding: '0.65rem 1rem',

                    borderRadius: '10px',

                    fontSize: '0.85rem',

                    fontWeight: '800',

                    cursor: 'pointer',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    gap: '0.45rem',

                    transition: 'all 0.2s ease'

                  }}

                >

                  <span>{isFollowing ? '👥 Following' : '➕ Follow'}</span>

                </button>



                {/* 2. Facebook Messenger Official Blue Button */}

                <button

                  type="button"

                  onClick={handleOpenMessage}

                  style={{

                    flex: 1.2,

                    backgroundColor: '#1877f2', // Official Facebook Messenger Blue

                    color: '#ffffff',

                    border: 'none',

                    padding: '0.65rem 1rem',

                    borderRadius: '10px',

                    fontSize: '0.85rem',

                    fontWeight: '800',

                    cursor: 'pointer',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    gap: '0.5rem',

                    boxShadow: '0 4px 12px rgba(24, 119, 242, 0.35)',

                    transition: 'all 0.2s ease'

                  }}

                >

                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">

                    <path d="M12 2C6.48 2 2 6.03 2 11C2 13.82 3.44 16.32 5.7 17.84V22L9.62 19.86C10.38 20.06 11.18 20.17 12 20.17C17.52 20.17 22 16.14 22 11.17C22 6.2 17.52 2 12 2ZM13.06 14.16L10.74 11.69L6.2 14.16L11.2 8.84L13.52 11.31L18.06 8.84L13.06 14.16Z" />

                  </svg>

                  <span>Message</span>

                </button>



                {/* 3. Three Dots Options */}

                <button

                  type="button"

                  onClick={() => setShowOptionsModal(true)}

                  style={{

                    backgroundColor: '#1e293b',

                    border: '1px solid #334155',

                    color: '#cbd5e1',

                    padding: '0.65rem 0.9rem',

                    borderRadius: '10px',

                    fontSize: '0.9rem',

                    fontWeight: 'bold',

                    cursor: 'pointer'

                  }}

                >

                  •••

                </button>

              </>

            )}

          </div>

        </div>



        {/* TAB BAR NAVIGATION (REELS EXCLUDED) */}

        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '0 0.5rem' }}>

          {[

            { id: 'all', label: 'All Posts' },

            { id: 'photos', label: 'Photos' },

            { id: 'about', label: 'About Details' }

          ].map(tab => (

            <button

              key={tab.id}

              type="button"

              onClick={() => setActiveTab(tab.id)}

              style={{

                flex: 1,

                padding: '0.75rem 0.5rem',

                background: 'none',

                border: 'none',

                borderBottom: activeTab === tab.id ? '2.5px solid #1877f2' : '2.5px solid transparent',

                color: activeTab === tab.id ? '#1877f2' : '#94a3b8',

                fontWeight: activeTab === tab.id ? '800' : '600',

                fontSize: '0.85rem',

                cursor: 'pointer',

                transition: 'all 0.2s'

              }}

            >

              {tab.label}

            </button>

          ))}

        </div>



        {/* TAB CONTENT */}

        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          

          {/* PERSONAL DETAILS SECTION (FACEBOOK STYLE ICONOGRAPHY) */}

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>

            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#fff' }}>

              Personal Details

            </h3>



            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: '#cbd5e1' }}>

              

              {/* Location */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>📍</span>

                <div>

                  Lives in <strong style={{ color: '#fff' }}>{targetUser.city || 'Pakistan'}</strong>

                </div>

              </div>



              {/* Work / Designation */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>💼</span>

                <div>

                  Work: <strong style={{ color: '#fff' }}>{targetUser.headline || 'Professional Specialist on Shanora'}</strong>

                </div>

              </div>



              {/* Education */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>🎓</span>

                <div>

                  Education: <strong style={{ color: '#fff' }}>{targetUser.education || 'Higher Professional Studies'}</strong>

                </div>

              </div>



              {/* Skills */}

              {targetUser.skills && (

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.2rem' }}>

                  <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>⚡</span>

                  <div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Key Competencies:</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>

                      {targetUser.skills.split(',').map((skill, idx) => (

                        <span key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '600' }}>

                          {skill.trim()}

                        </span>

                      ))}

                    </div>

                  </div>

                </div>

              )}



              {/* Attached CV / Portfolio */}

              {targetUser.resume_url && (

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.7rem' }}>

                  <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>📄</span>

                  <div>

                    <a href={targetUser.resume_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem' }}>

                      View Verified CV / Portfolio ↗

                    </a>

                  </div>

                </div>

              )}

            </div>

          </div>



          {/* NETWORK / FRIENDS HORIZONTAL PREVIEW GRID */}

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>

              <div>

                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#fff' }}>

                  Network & Friends

                </h3>

                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{followersList.length} total connections</span>

              </div>

              <span style={{ color: '#1877f2', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>

                See all

              </span>

            </div>



            {followersList.length === 0 ? (

              <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>

                No public connections visible yet.

              </div>

            ) : (

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>

                {followersList.slice(0, 4).map((f, idx) => {

                  const fName = f.full_name || f.name || f.email?.split('@')[0] || 'Member';

                  return (

                    <Link

                      key={idx}

                      href={`/view-profile?email=${encodeURIComponent(f.email || '')}`}

                      style={{ textDecoration: 'none', textAlign: 'center', overflow: 'hidden' }}

                    >

                      <div style={{

                        width: '56px',

                        height: '56px',

                        borderRadius: '12px',

                        backgroundColor: '#1e293b',

                        border: '1px solid #334155',

                        margin: '0 auto 0.35rem auto',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        color: '#38bdf8',

                        fontWeight: 'bold',

                        overflow: 'hidden'

                      }}>

                        {f.avatar_url ? (

                          <img src={f.avatar_url} alt={fName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        ) : (

                          fName.charAt(0).toUpperCase()

                        )}

                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#fff', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                        {fName}

                      </div>

                    </Link>

                  );

                })}

              </div>

            )}

          </div>



          {/* ALL POSTS TAB */}

          {activeTab === 'all' && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>

                Posts ({userPosts.length})

              </div>



              {userPosts.length === 0 ? (

                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>

                  No updates posted by {displayName} yet.

                </div>

              ) : (

                userPosts.map(post => (

                  <div key={post.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>

                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', overflow: 'hidden' }}>

                        {targetUser.avatar_url ? (

                          <img src={targetUser.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        ) : (

                          displayName.charAt(0).toUpperCase()

                        )}

                      </div>

                      <div>

                        <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>

                          <span>{displayName}</span>

                          {targetUser.is_pro && <ProVerifiedBadge size={14} />}

                        </div>

                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>

                          {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

                        </div>

                      </div>

                    </div>



                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.45', whiteSpace: 'pre-line' }}>

                      {post.content}

                    </p>



                    {post.image_url && (

                      <img src={post.image_url} alt="Post attachment" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '10px', marginTop: '0.3rem' }} />

                    )}

                  </div>

                ))

              )}

            </div>

          )}



          {/* PHOTOS TAB */}

          {activeTab === 'photos' && (

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>

              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.8rem' }}>

                Uploaded Photos

              </div>

              {userPosts.filter(p => Boolean(p.image_url)).length === 0 ? (

                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.82rem' }}>

                  No photos shared yet.

                </div>

              ) : (

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>

                  {userPosts.filter(p => Boolean(p.image_url)).map((p, idx) => (

                    <img key={idx} src={p.image_url} alt="User media" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />

                  ))}

                </div>

              )}

            </div>

          )}



          {/* ABOUT DETAILS TAB */}

          {activeTab === 'about' && (

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>

                About {displayName}

              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>

                Official Shanora ID: <strong style={{ color: '#fff' }}>{targetUser.email}</strong>

              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>

                Member Status: <strong style={{ color: targetUser.is_pro ? '#38bdf8' : '#cbd5e1' }}>{targetUser.is_pro ? 'PRO Verified ✓' : 'Standard Member'}</strong>

              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>

                Profile Summary: <span style={{ color: '#cbd5e1' }}>{targetUser.bio || 'Professional member actively networking on Shanora.pk'}</span>

              </div>

            </div>

          )}

        </div>

      </main>



      {/* OPTIONS MODAL (•••) */}

      {showOptionsModal && (

        <div 

          onClick={() => setShowOptionsModal(false)}

          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}

        >

          <div 

            onClick={(e) => e.stopPropagation()}

            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '360px', width: '100%', padding: '1.2rem', color: '#fff' }}

          >

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem', marginBottom: '0.8rem' }}>

              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Profile Options</div>

              <button type="button" onClick={() => setShowOptionsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            </div>



            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

              <button

                type="button"

                onClick={handleCopyProfileLink}

                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}

              >

                <span>🔗</span>

                <span>{copiedLink ? 'Link Copied! ✓' : 'Copy Link to Profile'}</span>

              </button>



              <button

                type="button"

                onClick={handleOpenMessage}

                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}

              >

                <span>💬</span>

                <span>Send Direct Message</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setShowOptionsModal(false);

                  alert('Thank you. Profile reported for administrative review.');

                }}

                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}

              >

                <span>🚩</span>

                <span>Report Profile</span>

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Persistent Bottom Nav Bar */}

      <BottomNav />

    </div>

  );

}



export default function ViewProfilePage() {

  return (

    <Suspense fallback={

      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>

        Loading Profile...

      </div>

    }>

      <ViewProfileContent />

    </Suspense>

  );

}
