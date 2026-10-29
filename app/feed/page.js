'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function FeedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'pages', 'profiles'
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // New Personal Post state
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [posting, setPosting] = useState(false);

  // Fullscreen Photo Viewer (Lightbox Modal)
  const [previewImage, setPreviewImage] = useState(null);

  // Interaction states
  const [likedPosts, setLikedPosts] = useState({});
  const [postLikesCount, setPostLikesCount] = useState({});
  const [relayedPosts, setRelayedPosts] = useState({});
  const [postRelaysCount, setPostRelaysCount] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || null;
        setCurrentUser(user);

        if (user?.email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          setUserProfile(profile || {
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            username: user.email.split('@')[0],
            avatar_url: null
          });
        }

        // 1. Fetch Personal Posts
        const { data: personalPosts } = await supabase
          .from('user_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        // 2. Fetch Page Posts
        const { data: pagePosts } = await supabase
          .from('page_posts')
          .select(`
            id,
            content,
            image_url,
            created_at,
            pages (
              id,
              name,
              slug,
              logo_url,
              monetization_status
            )
          `)
          .order('created_at', { ascending: false })
          .limit(25);

        // 3. Fetch Relays
        const { data: relays } = await supabase
          .from('page_post_relays')
          .select(`
            id,
            user_email,
            created_at,
            post_id,
            page_posts (
              id,
              content,
              image_url,
              created_at,
              pages (
                id,
                name,
                slug,
                logo_url,
                monetization_status
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(25);

        // Format Personal Posts
        const formattedPersonal = (personalPosts || []).map(p => {
          const uname = p.user_email?.split('@')[0] || 'user';
          return {
            feedItemId: `user-${p.id}`,
            postId: p.id,
            postType: 'personal',
            authorName: p.user_name || uname,
            authorAvatar: p.avatar_url,
            authorLink: `/page/${uname}`,
            isVerified: false,
            content: p.content,
            imageUrl: p.image_url,
            createdAt: p.created_at,
            sortTime: new Date(p.created_at).getTime(),
            isRelay: false,
            relayedBy: null
          };
        });

        // Format Page Posts
        const formattedPages = (pagePosts || []).map(p => ({
          feedItemId: `page-${p.id}`,
          postId: p.id,
          postType: 'page',
          authorName: p.pages?.name || 'Shanora Page',
          authorAvatar: p.pages?.logo_url,
          authorLink: `/page/${p.pages?.slug || ''}`,
          isVerified: p.pages?.monetization_status === 'approved',
          content: p.content,
          imageUrl: p.image_url,
          createdAt: p.created_at,
          sortTime: new Date(p.created_at).getTime(),
          isRelay: false,
          relayedBy: null
        }));

        // Format Relays
        const formattedRelays = (relays || [])
          .filter(r => r.page_posts && r.page_posts.pages)
          .map(r => ({
            feedItemId: `relay-${r.id}`,
            postId: r.page_posts.id,
            postType: 'page',
            authorName: r.page_posts.pages?.name || 'Shanora Page',
            authorAvatar: r.page_posts.pages?.logo_url,
            authorLink: `/page/${r.page_posts.pages?.slug || ''}`,
            isVerified: r.page_posts.pages?.monetization_status === 'approved',
            content: r.page_posts.content,
            imageUrl: r.page_posts.image_url,
            createdAt: r.page_posts.created_at,
            sortTime: new Date(r.created_at).getTime(),
            isRelay: true,
            relayedBy: r.user_email?.split('@')[0] || 'A creator',
            relayedByLink: `/page/${r.user_email?.split('@')[0] || ''}`
          }));

        const merged = [...formattedPersonal, ...formattedPages, ...formattedRelays]
          .sort((a, b) => b.sortTime - a.sortTime);

        setFeedItems(merged);

        // Fetch counts for page posts
        const pagePostIds = merged.filter(m => m.postType === 'page').map(m => m.postId);
        if (pagePostIds.length > 0) {
          const { data: allLikes } = await supabase
            .from('page_post_likes')
            .select('*')
            .in('post_id', pagePostIds);

          if (allLikes) {
            const counts = {};
            const userLiked = {};
            allLikes.forEach(l => {
              counts[l.post_id] = (counts[l.post_id] || 0) + 1;
              if (user?.email && l.user_email === user.email) userLiked[l.post_id] = true;
            });
            setPostLikesCount(counts);
            setLikedPosts(userLiked);
          }

          const { data: allRelays } = await supabase
            .from('page_post_relays')
            .select('*')
            .in('post_id', pagePostIds);

          if (allRelays) {
            const rCounts = {};
            const userRelayed = {};
            allRelays.forEach(r => {
              rCounts[r.post_id] = (rCounts[r.post_id] || 0) + 1;
              if (user?.email && r.user_email === user.email) userRelayed[r.post_id] = true;
            });
            setPostRelaysCount(rCounts);
            setRelayedPosts(userRelayed);
          }

          const { data: allComments } = await supabase
            .from('page_post_comments')
            .select('*')
            .in('post_id', pagePostIds)
            .order('created_at', { ascending: true });

          if (allComments) {
            const grouped = {};
            allComments.forEach(c => {
              if (!grouped[c.post_id]) grouped[c.post_id] = [];
              grouped[c.post_id].push(c);
            });
            setPostComments(grouped);
          }
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Live Multi-Search for Pages and Profiles
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowSearchDropdown(true);

      try {
        // 1. Search in Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('id, name, slug, logo_url, category, monetization_status')
          .ilike('name', `%${q}%`)
          .limit(10);

        // 2. Search in Profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, username, email, avatar_url')
          .ilike('name', `%${q}%`)
          .limit(10);

        const formattedPages = (pagesData || []).map(p => ({
          id: `page-${p.id}`,
          type: 'page',
          title: p.name,
          subtitle: p.category || 'Official Page',
          avatar: p.logo_url,
          link: `/page/${p.slug}`,
          isVerified: p.monetization_status === 'approved'
        }));

        const formattedProfiles = (profilesData || []).map(u => {
          const uname = u.username || u.email?.split('@')[0] || 'user';
          return {
            id: `profile-${u.id || uname}`,
            type: 'profile',
            title: u.name || uname,
            subtitle: `@${uname} • Personal Account`,
            avatar: u.avatar_url,
            link: `/page/${uname}`,
            isVerified: false
          };
        });

        setSearchResults([...formattedPages, ...formattedProfiles]);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Submit Personal Post
  async function handleCreatePersonalPost(e) {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!postText.trim() && !postPhoto) return;

    setPosting(true);
    try {
      let finalImageUrl = null;

      if (postPhoto) {
        const fileExt = postPhoto.name.split('.').pop();
        const fileName = `personal_${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('page-media')
          .upload(filePath, postPhoto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('page-media').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const senderName = userProfile?.name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
      const senderAvatar = userProfile?.avatar_url || currentUser.user_metadata?.avatar_url || null;
      const senderSlug = currentUser.email.split('@')[0];

      const { data: newPost, error } = await supabase
        .from('user_posts')
        .insert([{
          user_email: currentUser.email,
          user_name: senderName,
          avatar_url: senderAvatar,
          content: postText,
          image_url: finalImageUrl
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedNew = {
        feedItemId: `user-${newPost.id}`,
        postId: newPost.id,
        postType: 'personal',
        authorName: senderName,
        authorAvatar: senderAvatar,
        authorLink: `/page/${senderSlug}`,
        isVerified: false,
        content: newPost.content,
        imageUrl: newPost.image_url,
        createdAt: newPost.created_at,
        sortTime: new Date(newPost.created_at).getTime(),
        isRelay: false,
        relayedBy: null
      };

      setFeedItems([formattedNew, ...feedItems]);
      setPostText('');
      setPostPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      alert('Post failed: ' + err.message);
    } finally {
      setPosting(false);
    }
  }

  // Direct Image Downloader
  async function handleDownloadImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `shanora_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  }

  async function handleToggleLike(postId, postType) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const isLiked = likedPosts[postId];
    const currentCount = postLikesCount[postId] || 0;

    setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
    setPostLikesCount(prev => ({ ...prev, [postId]: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1 }));

    try {
      if (postType === 'page') {
        if (isLiked) {
          await supabase.from('page_post_likes').delete().eq('post_id', postId).eq('user_email', currentUser.email);
        } else {
          await supabase.from('page_post_likes').insert([{ post_id: postId, user_email: currentUser.email }]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleRelay(postId) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const isRelayed = relayedPosts[postId];
    const currentCount = postRelaysCount[postId] || 0;

    setRelayedPosts(prev => ({ ...prev, [postId]: !isRelayed }));
    setPostRelaysCount(prev => ({ ...prev, [postId]: isRelayed ? Math.max(0, currentCount - 1) : currentCount + 1 }));

    try {
      if (isRelayed) {
        await supabase.from('page_post_relays').delete().eq('post_id', postId).eq('user_email', currentUser.email);
      } else {
        await supabase.from('page_post_relays').insert([{ post_id: postId, user_email: currentUser.email }]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddComment(postId) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    const text = commentInputs[postId]?.trim();
    if (!text || submittingComment) return;

    setSubmittingComment(true);
    try {
      const { data: newComment, error } = await supabase
        .from('page_post_comments')
        .insert([{
          post_id: postId,
          user_email: currentUser.email,
          comment_text: text
        }])
        .select()
        .single();

      if (error) throw error;

      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Comment failed: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  const currentUserName = userProfile?.name || currentUser?.email?.split('@')[0] || 'You';

  // Filtered search list
  const filteredResults = searchResults.filter(item => {
    if (searchFilter === 'pages') return item.type === 'page';
    if (searchFilter === 'profiles') return item.type === 'profile';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header with Facebook-Style Search Bar */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.65rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'space-between' }}>
          
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#38bdf8', whiteSpace: 'nowrap' }}>
              SHANORA<span style={{ color: '#fff' }}>.PK</span>
            </h1>
          </Link>

          {/* Facebook Style Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '22px', padding: '0.35rem 0.85rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginRight: '0.4rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search profiles & pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Dropdown Box */}
            {showSearchDropdown && (
              <div style={{ 
                position: 'absolute', 
                top: '42px', 
                left: 0, 
                right: 0, 
                backgroundColor: '#0f172a', 
                border: '1px solid #334155', 
                borderRadius: '12px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)', 
                zIndex: 150, 
                overflow: 'hidden',
                maxHeight: '380px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Search Filter Tabs: All, Pages, Profiles */}
                <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', backgroundColor: '#1e293b', padding: '0.3rem 0.5rem', gap: '0.4rem' }}>
                  {['all', 'pages', 'profiles'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSearchFilter(tab)}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        backgroundColor: searchFilter === tab ? '#0284c7' : 'transparent',
                        color: searchFilter === tab ? '#fff' : '#94a3b8'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                    {/* Results List */}
                <div style={{ overflowY: 'auto', padding: '0.4rem 0' }}>
                  {isSearching ? (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                      Searching...
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No {searchFilter === 'all' ? 'results' : searchFilter} found for "{searchQuery}"
                    </div>
                  ) : (
                    filteredResults.map(res => (
                      <Link
                        key={res.id}
                        href={res.link}
                        onClick={() => setShowSearchDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.7rem',
                          padding: '0.6rem 0.9rem',
                          textDecoration: 'none',
                          borderBottom: '1px solid #1e293b',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: res.type === 'page' ? '#1e293b' : '#0284c7',
                          backgroundImage: res.avatar ? `url(${res.avatar})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: '#fff',
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {!res.avatar && res.title.charAt(0).toUpperCase()}
                        </div>

                        {/* Title & Subtitle */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {res.title}
                            </span>
                            {res.isVerified && <span style={{ color: '#22c55e', fontSize: '0.75rem' }}>✓</span>}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {res.subtitle}
                          </div>
                        </div>

                        {/* Distinct Badge: Page vs Profile */}
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          backgroundColor: res.type === 'page' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: res.type === 'page' ? '#38bdf8' : '#4ade80',
                          border: res.type === 'page' ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)'
                        }}>
                          {res.type}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>+ Page</Link>
            <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none' }}>Portal 💼</Link>
          </div>

        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.8rem 3rem 0.8rem' }}>
        
        {/* Personal Post Box */}
        {currentUser && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleCreatePersonalPost}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                <Link href={`/page/${currentUser.email.split('@')[0]}`} style={{ textDecoration: 'none' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0, cursor: 'pointer' }}>
                    {currentUserName.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <input
                  type="text"
                  placeholder={`What's on your mind, ${currentUserName}?`}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              {photoPreview && (
                <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => { setPostPhoto(null); setPhotoPreview(''); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
                  🖼️ Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPostPhoto(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={posting || (!postText.trim() && !postPhoto)}
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 1.2rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: (postText.trim() || postPhoto) && !posting ? 'pointer' : 'not-allowed' }}
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feed Stream */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#38bdf8' }}>Loading feed...</div>
        ) : feedItems.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            No posts or relays on the feed yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedItems.map(item => {
              const isLiked = !!likedPosts[item.postId];
              const likesCount = postLikesCount[item.postId] || 0;
              const isRelayed = !!relayedPosts[item.postId];
              const relaysCount = postRelaysCount[item.postId] || 0;
              const commentsList = postComments[item.postId] || [];
              const isCommentsOpen = activeCommentPostId === item.feedItemId;

              return (
                <div key={item.feedItemId} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                  
                  {/* Relayed Banner */}
                  {item.isRelay && (
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: '#1e293b', fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #334155' }}>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🔄</span> 
                      <Link href={item.relayedByLink || '#'} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>
                        {item.relayedBy}
                      </Link>
                      <span>Relayed</span>
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <Link href={item.authorLink || '#'} style={{ textDecoration: 'none' }}>
                      <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        backgroundColor: '#1e293b', 
                        backgroundImage: item.authorAvatar ? `url(${item.authorAvatar})` : 'none', 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 'bold', 
                        color: '#38bdf8',
                        cursor: 'pointer',
                        border: '1px solid #334155'
                      }}>
                        {!item.authorAvatar && item.authorName.charAt(0).toUpperCase()}
                      </div>
                    </Link>

                    <div>
                      <Link href={item.authorLink || '#'} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                          <span>{item.authorName}</span>
                          {item.isVerified && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>✓</span>}
                        </div>
                      </Link>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Content */}
                  {item.content && (
                    <div style={{ padding: '0 1rem 0.8rem 1rem', margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.45, userSelect: 'text' }}>
                      {item.content}
                    </div>
                  )}

                  {/* Image with Click-to-Enlarge */}
                  {item.imageUrl && (
                    <div 
                      onClick={() => setPreviewImage(item.imageUrl)} 
                      style={{ width: '100%', backgroundColor: '#070b14', cursor: 'pointer', position: 'relative' }}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt="Post image" 
                        style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', display: 'block' }} 
                      />
                    </div>
                  )}

                  {/* Counts */}
                  {(likesCount > 0 || commentsList.length > 0 || relaysCount > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                      <span>{likesCount > 0 ? `👍 ${likesCount}` : ''}</span>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {commentsList.length > 0 && <span>{commentsList.length} comments</span>}
                        {relaysCount > 0 && <span>{relaysCount} relays</span>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #1e293b', padding: '0.3rem 0' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.postId, item.postType)}
                      style={{ background: 'none', border: 'none', color: isLiked ? '#38bdf8' : '#94a3b8', padding: '0.55rem', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      {isLiked ? '👍 Liked' : '👍 Like'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCommentPostId(isCommentsOpen ? null : item.feedItemId)}
                      style={{ background: 'none', border: 'none', color: isCommentsOpen ? '#38bdf8' : '#94a3b8', padding: '0.55rem', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      💬 Comment
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRelay(item.postId)}
                      style={{ background: 'none', border: 'none', color: isRelayed ? '#4ade80' : '#94a3b8', padding: '0.55rem', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      {isRelayed ? '🔄 Relayed' : '🔄 Relay'}
                    </button>
                  </div>

                  {/* Comments Drawer */}
                  {isCommentsOpen && (
                    <div style={{ padding: '0.8rem 1rem', backgroundColor: '#070b14', borderTop: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[item.postId] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [item.postId]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.postId)}
                          style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '18px', padding: '0.45rem 0.9rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                        />
                        <button
                          type="button"
                          disabled={submittingComment || !commentInputs[item.postId]?.trim()}
                          onClick={() => handleAddComment(item.postId)}
                          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '18px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Post
                        </button>
                      </div>

                      {commentsList.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.4rem' }}>
                          No comments yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {commentsList.map(c => (
                            <div key={c.id} style={{ backgroundColor: '#1e293b', padding: '0.5rem 0.8rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                              <Link href={`/page/${c.user_email?.split('@')[0] || ''}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700', fontSize: '0.75rem' }}>
                                {c.user_email?.split('@')[0]}
                              </Link>
                              <div style={{ color: '#f8fafc', marginTop: '0.15rem' }}>{c.comment_text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.95)', 
            zIndex: 999, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              padding: '1rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={() => handleDownloadImage(previewImage)}
              style={{
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#fff',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              ⬇️ Save Image
            </button>

            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          
              <img 
            onClick={(e) => e.stopPropagation()}
            src={previewImage} 
            alt="Enlarged view" 
            style={{ 
              maxWidth: '96vw', 
              maxHeight: '82vh', 
              objectFit: 'contain', 
              borderRadius: '6px'
            }} 
          />
        </div>
      )}

    </div>
  );
}
