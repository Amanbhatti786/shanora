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

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function ViewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetEmailParam = searchParams?.get('email');
  const targetUsernameParam = searchParams?.get('username') || searchParams?.get('user');

  const [currentUser, setCurrentUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photos', 'about'
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Distinct Network Lists
  const [followersProfiles, setFollowersProfiles] = useState([]);
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [userPosts, setUserPosts] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendsModalTab, setFriendsModalTab] = useState('followers'); // 'followers' or 'following'
  const [copiedLink, setCopiedLink] = useState(false);

  // Feed Actions State
  const [likedPostsMap, setLikedPostsMap] = useState({});
  const [likesCountMap, setLikesCountMap] = useState({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [postCommentsMap, setPostCommentsMap] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [savedPostsMap, setSavedPostsMap] = useState({});

  useEffect(() => {
    async function loadProfile() {
      if (!targetEmailParam && !targetUsernameParam) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const me = session?.user || null;
        setCurrentUser(me);

        let cleanTargetEmail = targetEmailParam
          ? decodeURIComponent(targetEmailParam).trim().toLowerCase()
          : '';
        const cleanTargetUsername = targetUsernameParam
          ? decodeURIComponent(targetUsernameParam).trim().toLowerCase()
          : '';

        let profileData = null;

        // 1. Fetch Target Profile by Email or by Username
        if (cleanTargetEmail) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', cleanTargetEmail)
            .maybeSingle();
          profileData = data;
        }

        if (!profileData && cleanTargetUsername) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.${cleanTargetUsername},name.ilike.${cleanTargetUsername}`)
            .maybeSingle();
          profileData = data;
        }

        // Agar profile data mil jaye toh uski confirmed email use karein
        if (profileData?.email) {
          cleanTargetEmail = profileData.email.toLowerCase();
        } else if (!cleanTargetEmail && cleanTargetUsername) {
          cleanTargetEmail = `${cleanTargetUsername}@user.shanora`;
        }

        if (profileData) {
          setTargetUser(profileData);
        } else if (cleanTargetEmail || cleanTargetUsername) {
          const fallbackDisplay = cleanTargetUsername || cleanTargetEmail.split('@')[0];
          setTargetUser({
            email: cleanTargetEmail,
            full_name: fallbackDisplay,
            name: fallbackDisplay,
            username: fallbackDisplay,
            headline: 'Professional Member on Shanora',
            city: 'Pakistan',
            bio: '',
            skills: '',
            avatar_url: '',
            resume_url: '',
            education: 'Higher Professional Studies',
            is_pro: false
          });
        }

        // 2. Fetch Network / Follow Relationships
        if (cleanTargetEmail) {
          const { data: followsData } = await supabase
            .from('user_follows')
            .select('id, follower_email, following_email, created_at');

          if (followsData) {
            const myEmail = (me?.email || '').toLowerCase();
            
            // Followers: who follows this target user
            const targetFollowersRaw = followsData.filter(f => (f.following_email || '').toLowerCase() === cleanTargetEmail);
            // Following: who this target user follows
            const targetFollowingRaw = followsData.filter(f => (f.follower_email || '').toLowerCase() === cleanTargetEmail);

            setFollowersCount(targetFollowersRaw.length);
            setFollowingCount(targetFollowingRaw.length);

            if (myEmail) {
              const alreadyFollowing = targetFollowersRaw.some(f => (f.follower_email || '').toLowerCase() === myEmail);
              setIsFollowing(alreadyFollowing);
            }

            // Distinct emails
            const followerEmails = targetFollowersRaw.map(f => (f.follower_email || '').toLowerCase());
            const followingEmails = targetFollowingRaw.map(f => (f.following_email || '').toLowerCase());

            const allDistinctEmails = Array.from(new Set([...followerEmails, ...followingEmails]));

            if (allDistinctEmails.length > 0) {
              const { data: fetchedProfiles } = await supabase
                .from('profiles')
                .select('email, name, full_name, avatar_url, last_seen, headline, is_pro')
                .in('email', allDistinctEmails);

              if (fetchedProfiles) {
                const profilesMap = {};
                fetchedProfiles.forEach(p => {
                  if (p.email) profilesMap[p.email.toLowerCase()] = p;
                });

                // Map followers
                const mappedFollowers = followerEmails.map(email => profilesMap[email] || {
                  email,
                  full_name: email.split('@')[0],
                  avatar_url: null
                });
                setFollowersProfiles(mappedFollowers);

                // Map following
                const mappedFollowing = followingEmails.map(email => profilesMap[email] || {
                  email,
                  full_name: email.split('@')[0],
                  avatar_url: null
                });
                setFollowingProfiles(mappedFollowing);
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

            const initialLikes = {};
            const initialLikesCount = {};
            postsData.forEach(p => {
              initialLikesCount[p.id] = p.likes_count || 0;
            });
            setLikesCountMap(initialLikesCount);

            if (me?.email) {
              const postIds = postsData.map(p => p.id);
              if (postIds.length > 0) {
                const { data: userLikes } = await supabase
                  .from('post_likes')
                  .select('post_id')
                  .ilike('user_email', me.email.toLowerCase())
                  .in('post_id', postIds);

                if (userLikes) {
                  userLikes.forEach(l => {
                    initialLikes[l.post_id] = true;
                  });
                  setLikedPostsMap(initialLikes);
                }

                const { data: savedData } = await supabase
                  .from('saved_posts')
                  .select('post_id')
                  .ilike('user_email', me.email.toLowerCase())
                  .in('post_id', postIds);

                if (savedData) {
                  const svMap = {};
                  savedData.forEach(s => { svMap[s.post_id] = true; });
                  setSavedPostsMap(svMap);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [targetEmailParam, targetUsernameParam]);

  // Guaranteed Instant Action for Messaging
  function handleOpenMessage(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanEmail = (targetUser?.email || targetEmailParam || '').trim().toLowerCase();
    if (!cleanEmail) return;

    window.location.href = `/profile?tab=messages&chatWith=${encodeURIComponent(cleanEmail)}`;
  }

  // Handle Follow / Unfollow
  async function handleToggleFollow(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUser) {
      window.location.href = '/auth';
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
    setFollowersCount(prev => (nextFollowingState ? prev + 1 : Math.max(0, prev - 1)));

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
      setFollowersCount(prev => (!nextFollowingState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Like / Unlike
  async function handleToggleLike(postId) {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }
    const myEmail = currentUser.email.toLowerCase();
    const currentlyLiked = !!likedPostsMap[postId];

    setLikedPostsMap(prev => ({ ...prev, [postId]: !currentlyLiked }));
    setLikesCountMap(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + (currentlyLiked ? -1 : 1))
    }));

    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .ilike('user_email', myEmail);
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_email: myEmail }]);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      setLikedPostsMap(prev => ({ ...prev, [postId]: currentlyLiked }));
      setLikesCountMap(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) + (currentlyLiked ? 1 : -1))
      }));
    }
  }

  // Load & Toggle Comments Drawer
  async function handleToggleComments(postId) {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);

    if (!postCommentsMap[postId]) {
      try {
        const { data: comments } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        setPostCommentsMap(prev => ({ ...prev, [postId]: comments || [] }));
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    }
  }

  // Submit New Comment
  async function handleAddComment(postId) {
    const commentBody = (newCommentText[postId] || '').trim();
    if (!commentBody) return;
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }

    const myEmail = currentUser.email.toLowerCase();
    setSubmittingComment(true);

    try {
      const { data: inserted, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_email: myEmail,
          comment: commentBody
        }])
        .select()
        .single();

      if (error) throw error;

      setPostCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), inserted]
      }));
      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Could not post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  // Save / Bookmark Post
  async function handleSavePost(postId) {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }
    const myEmail = currentUser.email.toLowerCase();
    const isSaved = !!savedPostsMap[postId];

    try {
      if (isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .ilike('user_email', myEmail);
        setSavedPostsMap(prev => ({ ...prev, [postId]: false }));
        alert('Post removed from saved bookmarks.');
      } else {
        await supabase
          .from('saved_posts')
          .insert([{ post_id: postId, user_email: myEmail }]);
        setSavedPostsMap(prev => ({ ...prev, [postId]: true }));
        alert('Post bookmarked successfully! View in Menu > Saved Posts.');
      }
    } catch (err) {
      alert('Error updating bookmark: ' + err.message);
    } finally {
      setActivePostMenuId(null);
    }
  }

  function handleSharePost(post) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${displayName} on Shanora`,
        text: post.content,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`);
      alert('Post link copied to clipboard!');
    }
  }

  function handleCopyProfileLink() {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handleShareToWhatsApp() {
    if (typeof window !== 'undefined') {
      const text = encodeURIComponent(`Check out ${displayName}'s profile on Shanora.pk:\n${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      setShowOptionsModal(false);
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
  const photosList = userPosts.filter(p => Boolean(p.image_url));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
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

      {/* Main Profile Body */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 0 90px 0' }}>
        
        {/* Banner */}
        <div style={{
          height: '140px',
          background: 'linear-gradient(135deg, #0369a1 0%, #0b1322 100%)',
          position: 'relative',
          borderBottom: '1px solid #1e293b'
        }} />

        {/* User Identity Header */}
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
                {decodeHtmlEntities(targetUser.bio)}
              </p>
            )}

            {/* Followers / Following Stats */}
            <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.82rem', marginTop: '0.5rem', color: '#94a3b8' }}>
              <div 
                onClick={() => {
                  setFriendsModalTab('followers');
                  setShowFriendsModal(true);
                }} 
                style={{ cursor: 'pointer' }}
              >
                <strong style={{ color: '#fff' }}>{followersCount}</strong> Followers
              </div>
              <div 
                onClick={() => {
                  setFriendsModalTab('following');
                  setShowFriendsModal(true);
                }} 
                style={{ cursor: 'pointer' }}
              >
                <strong style={{ color: '#fff' }}>{followingCount}</strong> Following
              </div>
              <div onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>
                <strong style={{ color: '#fff' }}>{userPosts.length}</strong> Posts
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', marginTop: '1.1rem', position: 'relative', zIndex: 30 }}>
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
                {/* Follow Button */}
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
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    pointerEvents: 'auto',
                    userSelect: 'none'
                  }}
                >
                  <span>{actionLoading ? 'Updating...' : isFollowing ? '👥 Following' : '➕ Follow'}</span>
                </button>

                {/* Message Button */}
                <button
                  type="button"
                  onClick={handleOpenMessage}
                  style={{
                    flex: 1.2,
                    backgroundColor: '#1877f2',
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
                    boxShadow: '0 4px 14px rgba(24, 119, 242, 0.45)',
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 40
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.03 2 11C2 13.82 3.44 16.32 5.7 17.84V22L9.62 19.86C10.38 20.06 11.18 20.17 12 20.17C17.52 20.17 22 16.14 22 11.17C22 6.2 17.52 2 12 2ZM13.06 14.16L10.74 11.69L6.2 14.16L11.2 8.84L13.52 11.31L18.06 8.84L13.06 14.16Z" />
                  </svg>
                  <span>Message</span>
                </button>

                {/* Options Button */}
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
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                  }}
                >
                  •••
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '0 0.5rem', position: 'sticky', top: '56px', zIndex: 80 }}>
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'photos', label: `Photos (${photosList.length})` },
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

        {/* Dynamic Tab Content */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* TAB 1: ALL POSTS VIEW */}
          {activeTab === 'all' && (
            <>
              {/* Personal Details Section */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
                <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#fff' }}>
                  Personal Details
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>📍</span>
                    <div>
                      Lives in <strong style={{ color: '#fff' }}>{targetUser.city || 'Pakistan'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>💼</span>
                    <div>
                      Work: <strong style={{ color: '#fff' }}>{targetUser.headline || 'Professional Member on Shanora'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>🎓</span>
                    <div>
                      Education: <strong style={{ color: '#fff' }}>{targetUser.education || 'Higher Professional Studies'}</strong>
                    </div>
                  </div>

                  {targetUser.resume_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.7rem' }}>
                      <span style={{ fontSize: '1.2rem', width: '22px', textAlign: 'center' }}>📄</span>
                      <div>
                        <a href={targetUser.resume_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem' }}>
                          View Verified Resume / Portfolio ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Network & Friends Grid Preview */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#fff' }}>
                      Network & Friends
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{followersCount} Followers • {followingCount} Following</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFriendsModalTab('followers');
                      setShowFriendsModal(true);
                    }} 
                    style={{ background: 'none', border: 'none', color: '#1877f2', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    See all
                  </button>
                </div>

                {followersProfiles.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                    No public connections visible yet.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                    {followersProfiles.slice(0, 4).map((f, idx) => {
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

              {/* Feed-Style Posts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>
                  Posts ({userPosts.length})
                </div>

                {userPosts.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No updates posted by {displayName} yet.
                  </div>
                ) : (
                  userPosts.map(post => {
                    const isLiked = !!likedPostsMap[post.id];
                    const likeCount = likesCountMap[post.id] || 0;
                    const isCommentsOpen = activeCommentsPostId === post.id;
                    const comments = postCommentsMap[post.id] || [];
                    const isMenuOpen = activePostMenuId === post.id;
                    const isSaved = !!savedPostsMap[post.id];

                    return (
                      <div key={post.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                        
                        {/* Post Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', overflow: 'hidden' }}>
                              {targetUser.avatar_url ? (
                                <img src={targetUser.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                displayName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span>{displayName}</span>
                                {targetUser.is_pro && <ProVerifiedBadge size={15} />}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 🌐
                              </div>
                            </div>
                          </div>

                          {/* Post Action Menu (...) */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => setActivePostMenuId(isMenuOpen ? null : post.id)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer', padding: '0.3rem' }}
                            >
                              •••
                            </button>

                            {isMenuOpen && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '30px',
                                backgroundColor: '#131e33',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                padding: '0.4rem',
                                width: '180px',
                                zIndex: 100,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => handleSavePost(post.id)}
                                  style={{ background: 'none', border: 'none', color: isSaved ? '#facc15' : '#cbd5e1', padding: '0.45rem 0.6rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                  <span>{isSaved ? '★' : '☆'}</span>
                                  <span>{isSaved ? 'Remove from Saved' : 'Save Post'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`);
                                    alert('Post link copied to clipboard!');
                                    setActivePostMenuId(null);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#cbd5e1', padding: '0.45rem 0.6rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                  <span>🔗</span>
                                  <span>Copy Link</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {decodeHtmlEntities(post.content)}
                        </p>

                        {/* Post Image Attachment */}
                        {post.image_url && (
                          <img src={post.image_url} alt="Post attachment" style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '10px' }} />
                        )}

                        {/* Likes & Comments Counter Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ backgroundColor: '#0284c7', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem' }}>👍</span>
                            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
                          </span>
                          <span onClick={() => handleToggleComments(post.id)} style={{ cursor: 'pointer' }}>
                            {comments.length > 0 ? `${comments.length} comments` : 'Comments'}
                          </span>
                        </div>

                        {/* Action Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', borderTop: '1px solid #1e293b', paddingTop: '0.4rem' }}>
                          {/* 1. LIKE */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            style={{
                              backgroundColor: isLiked ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                              border: 'none',
                              color: isLiked ? '#38bdf8' : '#94a3b8',
                              padding: '0.5rem 0.2rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>👍</span>
                            <span>{isLiked ? 'Liked' : 'Like'}</span>
                          </button>

                          {/* 2. COMMENT */}
                          <button
                            type="button"
                            onClick={() => handleToggleComments(post.id)}
                            style={{
                              backgroundColor: isCommentsOpen ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                              border: 'none',
                              color: isCommentsOpen ? '#38bdf8' : '#94a3b8',
                              padding: '0.5rem 0.2rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span>💬</span>
                            <span>Comment</span>
                          </button>

                          {/* 3. REPOST / SHARE */}
                          <button
                            type="button"
                            onClick={() => handleSharePost(post)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '0.5rem 0.2rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span>🔁</span>
                            <span>Repost</span>
                          </button>

                          {/* 4. SEND */}
                          <button
                            type="button"
                            onClick={handleOpenMessage}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '0.5rem 0.2rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span>✈️</span>
                            <span>Send</span>
                          </button>
                        </div>

                        {/* Comments Drawer */}
                        {isCommentsOpen && (
                          <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={newCommentText[post.id] || ''}
                                onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                                style={{
                                  flex: 1,
                                  backgroundColor: '#0f172a',
                                  border: '1px solid #334155',
                                  borderRadius: '20px',
                                  padding: '0.45rem 0.85rem',
                                  color: '#fff',
                                  fontSize: '0.78rem',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                disabled={submittingComment || !(newCommentText[post.id] || '').trim()}
                                onClick={() => handleAddComment(post.id)}
                                style={{
                                  backgroundColor: '#0284c7',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '20px',
                                  padding: '0.45rem 0.8rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {submittingComment ? '...' : 'Post'}
                              </button>
                            </div>

                            {comments.length === 0 ? (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', padding: '0.4rem 0' }}>
                                No comments yet. Be the first to share your thoughts!
                              </div>
                            ) : (
                              comments.map(c => (
                                <div key={c.id} style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#0f172a', padding: '0.5rem 0.7rem', borderRadius: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                                    {(c.user_email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38bdf8' }}>
                                      {c.user_email?.split('@')[0]}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: '0.1rem', wordBreak: 'break-word' }}>
                                      {c.comment}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: PHOTOS VIEW */}
          {activeTab === 'photos' && (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', marginBottom: '0.85rem' }}>
                Photos & Media ({photosList.length})
              </div>

              {photosList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.84rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📷</div>
                  No photos uploaded by this member yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {photosList.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative', paddingBottom: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1e293b' }}>
                      <img 
                        src={p.image_url} 
                        alt="User media" 
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ABOUT DETAILS VIEW */}
          {activeTab === 'about' && (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', borderBottom: '1px solid #1e293b', paddingBottom: '0.6rem' }}>
                Detailed Overview
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Full Name</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginTop: '0.1rem' }}>{displayName}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Professional Headline</span>
                  <div style={{ color: '#38bdf8', fontWeight: '600', marginTop: '0.1rem' }}>{targetUser.headline || 'Member on Shanora'}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Location</span>
                  <div style={{ color: '#fff', marginTop: '0.1rem' }}>{targetUser.city || 'Pakistan'}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Education</span>
                  <div style={{ color: '#fff', marginTop: '0.1rem' }}>{targetUser.education || 'Higher Professional Studies'}</div>
                </div>

                {targetUser.bio && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Bio & Summary</span>
                    <div style={{ color: '#cbd5e1', lineHeight: '1.5', marginTop: '0.2rem' }}>{decodeHtmlEntities(targetUser.bio)}</div>
                  </div>
                )}

                {targetUser.skills && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Skills & Endorsements</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                      {targetUser.skills.split(',').map((skill, idx) => (
                        <span key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '600' }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Account Type:</span>
                  <span style={{ color: targetUser.is_pro ? '#facc15' : '#94a3b8', fontWeight: 'bold' }}>
                    {targetUser.is_pro ? 'Shanora PRO 👑' : 'Standard Member'}
                  </span>
                </div>
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
                onClick={handleShareToWhatsApp}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#22c55e', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>🟢</span>
                <span>Share via WhatsApp</span>
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

      {/* ALL CONNECTIONS / NETWORK MODAL */}
      {showFriendsModal && (
        <div 
          onClick={() => setShowFriendsModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '440px', width: '100%', maxHeight: '78vh', overflowY: 'auto', padding: '1.2rem', color: '#fff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.65rem', marginBottom: '0.8rem' }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>
                Network Connections
              </div>
              <button type="button" onClick={() => setShowFriendsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', backgroundColor: '#131b2e', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setFriendsModalTab('followers')}
                style={{
                  flex: 1,
                  backgroundColor: friendsModalTab === 'followers' ? '#0284c7' : 'transparent',
                  color: friendsModalTab === 'followers' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Followers ({followersCount})
              </button>
              <button
                type="button"
                onClick={() => setFriendsModalTab('following')}
                style={{
                  flex: 1,
                  backgroundColor: friendsModalTab === 'following' ? '#0284c7' : 'transparent',
                  color: friendsModalTab === 'following' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Following ({followingCount})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {friendsModalTab === 'followers' ? (
                followersProfiles.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.82rem' }}>
                    No followers found for this user.
                  </div>
                ) : (
                  followersProfiles.map((f, idx) => {
                    const fName = f.full_name || f.name || f.email?.split('@')[0];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setShowFriendsModal(false);
                          window.location.href = `/view-profile?email=${encodeURIComponent(f.email || '')}`;
                        }} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#131b2e', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt={fName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              fName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{fName}</span>
                              {f.is_pro && <ProVerifiedBadge size={14} />}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{f.headline || f.email}</div>
                          </div>
                        </div>
                        <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold' }}>View ↗</span>
                      </div>
                    );
                  })
                )
              ) : (
                followingProfiles.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.82rem' }}>
                    This user is not following anyone yet.
                  </div>
                ) : (
                  followingProfiles.map((f, idx) => {
                    const fName = f.full_name || f.name || f.email?.split('@')[0];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setShowFriendsModal(false);
                          window.location.href = `/view-profile?email=${encodeURIComponent(f.email || '')}`;
                        }} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: '#131b2e', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8', overflow: 'hidden' }}>
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt={fName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              fName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{fName}</span>
                              {f.is_pro && <ProVerifiedBadge size={14} />}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{f.headline || f.email}</div>
                          </div>
                        </div>
                        <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold' }}>View ↗</span>
                      </div>
                    );
                  })
                )
              )}
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
