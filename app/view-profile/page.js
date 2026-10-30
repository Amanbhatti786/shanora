'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ViewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetEmail = searchParams?.get('email')?.trim().toLowerCase() || '';

  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!targetEmail) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const loggedUser = session?.user || null;
        setCurrentUser(loggedUser);

        // 1. Check if this is a Page
        const slugAttempt = targetEmail.split('@')[0];
        const { data: pageMatch } = await supabase
          .from('pages')
          .select('*')
          .or(`owner_email.ilike.${targetEmail},slug.eq.${slugAttempt}`)
          .maybeSingle();

        // 2. Fetch User Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', targetEmail)
          .maybeSingle();

        const displayName = prof?.name || pageMatch?.name || slugAttempt;
        const displayAvatar = prof?.avatar_url || pageMatch?.logo_url || null;
        const displayBio = prof?.bio || pageMatch?.description || 'Creator on SHANORA.PK';
        const displayCity = prof?.city || 'Pakistan';

        setProfileData({
          email: targetEmail,
          name: displayName,
          avatar_url: displayAvatar,
          bio: displayBio,
          city: displayCity,
          isPage: !!pageMatch,
          pageSlug: pageMatch?.slug || null
        });

        // 3. Fetch Real Followers & Following Counts
        const { count: fCount } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .ilike('following_email', targetEmail);

        const { count: ingCount } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .ilike('follower_email', targetEmail);

        setFollowersCount(fCount || 0);
        setFollowingCount(ingCount || 0);

        // 4. Check if Current Logged-in User Follows this target
        if (loggedUser?.email) {
          const { data: followRel } = await supabase
            .from('user_follows')
            .select('id')
            .ilike('follower_email', loggedUser.email.toLowerCase())
            .ilike('following_email', targetEmail)
            .maybeSingle();

          setIsFollowing(!!followRel);
        }

        // 5. Fetch Posts of this User/Creator
        const { data: posts } = await supabase
          .from('user_posts')
          .select('*')
          .ilike('user_email', targetEmail)
          .order('created_at', { ascending: false })
          .limit(20);

        if (posts) setUserPosts(posts);

      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [targetEmail]);

  async function handleToggleFollow() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const myEmail = currentUser.email.toLowerCase();
    if (myEmail === targetEmail) return;

    setFollowLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextState) {
        await supabase
          .from('user_follows')
          .insert([{ follower_email: myEmail, following_email: targetEmail }]);

        await supabase
          .from('notifications')
          .insert([{
            recipient_email: targetEmail,
            sender_name: currentUser.user_metadata?.full_name || myEmail.split('@')[0],
            action_type: 'follow',
            content: 'started following your profile.',
            is_read: false
          }]);
      } else {
        await supabase
          .from('user_follows')
          .delete()
          .ilike('follower_email', myEmail)
          .ilike('following_email', targetEmail);
      }
    } catch (err) {
      console.error('Follow error:', err);
      setIsFollowing(!nextState);
      setFollowersCount(prev => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading profile...
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>Profile Not Found</div>
        <Link href="/feed" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Feed</Link>
      </div>
    );
  }

  const isSelf = currentUser?.email?.toLowerCase() === targetEmail;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
        <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.15rem' }}>
          SHANORA<span style={{ color: '#fff' }}>.PK</span>
        </Link>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 0 80px 0' }}>

        {/* Facebook Style Cover Banner */}
        <div style={{ height: '140px', background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', position: 'relative' }}></div>

        {/* Profile Card Header */}
        <div style={{ padding: '0 1.2rem 1.2rem 1.2rem', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'relative' }}>
          
          {/* Large Round Avatar */}
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            backgroundImage: profileData.avatar_url ? `url(${profileData.avatar_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '4px solid #0f172a',
            marginTop: '-45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
          }}>
            {!profileData.avatar_url && (profileData.name || 'U').charAt(0).toUpperCase()}
          </div>

          {/* Name & Username */}
          <div style={{ marginTop: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
              {profileData.name}
            </h2>
            <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '0.2rem' }}>
              @{profileData.email.split('@')[0]}
            </div>
          </div>

          {/* Bio */}
          <div style={{ color: '#cbd5e1', fontSize: '0.88rem', marginTop: '0.6rem', lineHeight: 1.4 }}>
            {profileData.bio}
          </div>

          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            📍 {profileData.city}
          </div>

          {/* Followers & Following Counters */}
          <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.8rem' }}>
            <div>
              <strong style={{ color: '#fff', fontSize: '1rem' }}>{followersCount}</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem', marginLeft: '0.3rem' }}>Followers</span>
            </div>
            <div>
              <strong style={{ color: '#fff', fontSize: '1rem' }}>{followingCount}</strong>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem', marginLeft: '0.3rem' }}>Following</span>
            </div>
          </div>

          {/* Action Buttons: Follow / Unfollow / Visit Page */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
            {!isSelf && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                style={{
                  flex: 1,
                  backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                  color: isFollowing ? '#94a3b8' : '#fff',
                  border: isFollowing ? '1px solid #334155' : 'none',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>
            )}

            {profileData.isPage && profileData.pageSlug && (
              <Link
                href={`/page/${profileData.pageSlug}`}
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🚩 Visit Official Page
              </Link>
            )}
          </div>

        </div>

        {/* User Posts Feed */}
        <div style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
            Posts ({userPosts.length})
          </div>

          {userPosts.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Is user ne abhi tak koi post share nahi ki.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {userPosts.map(post => (
                <div key={post.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                  {post.content && (
                    <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.45 }}>
                      {post.content}
                    </div>
                  )}
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post" 
                      style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.7rem' }} 
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

export default function ViewProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    }>
      <ViewProfileContent />
    </Suspense>
  );
}
