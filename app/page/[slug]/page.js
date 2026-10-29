'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function PublicPageView() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [pageData, setPageData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Posts & Interactions state
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [posting, setPosting] = useState(false);

  // Likes & Comments State
  const [likedPosts, setLikedPosts] = useState({});
  const [postLikesCount, setPostLikesCount] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState(null);

  // Facebook-Style Post Options Menu (...)
  const [selectedPostMenu, setSelectedPostMenu] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('Pakistan');
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    async function fetchPageAndPosts() {
      if (!slug) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        const { data: page, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !page) {
          setPageData(null);
        } else {
          setPageData(page);
          setFollowerCount(page.followers_count || 0);
          
          setEditName(page.name || '');
          setEditCategory(page.category || 'Creator / Influencer');
          setEditHeadline(page.headline || '');
          setEditBio(page.about || '');
          setEditCity(page.city || '');
          setEditCountry(page.country || 'Pakistan');

          if (session?.user?.email) {
            const { data: followRecord } = await supabase
              .from('page_followers')
              .select('id')
              .eq('page_id', page.id)
              .eq('follower_email', session.user.email)
              .maybeSingle();

            if (followRecord) setIsFollowing(true);
          }

          const { data: postList } = await supabase
            .from('page_posts')
            .select('*')
            .eq('page_id', page.id)
            .order('created_at', { ascending: false });

          if (postList && postList.length > 0) {
            setPosts(postList);

            const postIds = postList.map(p => p.id);
            const { data: allLikes } = await supabase
              .from('page_post_likes')
              .select('*')
              .in('post_id', postIds);

            if (allLikes) {
              const counts = {};
              const userLiked = {};
              allLikes.forEach(l => {
                counts[l.post_id] = (counts[l.post_id] || 0) + 1;
                if (session?.user?.email && l.user_email === session.user.email) {
                  userLiked[l.post_id] = true;
                }
              });
              setPostLikesCount(counts);
              setLikedPosts(userLiked);
            }

            const { data: allComments } = await supabase
              .from('page_post_comments')
              .select('*')
              .in('post_id', postIds)
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
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPageAndPosts();
  }, [slug]);

  const isOwner = currentUser?.email && pageData?.owner_email === currentUser?.email;

  async function handleMediaUpload(e, type) {
    const file = e.target.files[0];
    if (!file || !pageData || uploadingMedia) return;

    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${pageData.slug}_${Date.now()}.${fileExt}`;
      const filePath = `pages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('page-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('page-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const updateField = type === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl };
      await supabase.from('pages').update(updateField).eq('id', pageData.id);

      setPageData(prev => ({ ...prev, ...updateField }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleToggleFollow() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!pageData || actionLoading) return;

    setActionLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('page_followers')
          .delete()
          .eq('page_id', pageData.id)
          .eq('follower_email', currentUser.email);

        const newCount = Math.max(0, followerCount - 1);
        await supabase.from('pages').update({ followers_count: newCount }).eq('id', pageData.id);
        setIsFollowing(false);
        setFollowerCount(newCount);
      } else {
        await supabase
          .from('page_followers')
          .insert([{ page_id: pageData.id, follower_email: currentUser.email }]);

        const newCount = followerCount + 1;
        await supabase.from('pages').update({ followers_count: newCount }).eq('id', pageData.id);
        setIsFollowing(true);
        setFollowerCount(newCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postText.trim() && !postPhoto) return;

    setPosting(true);
    try {
      let finalImageUrl = null;

      if (postPhoto) {
        const fileExt = postPhoto.name.split('.').pop();
        const fileName = `post_${pageData.id}_${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('page-media')
          .upload(filePath, postPhoto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('page-media').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      const { data: newPost, error } = await supabase
        .from('page_posts')
        .insert([{
          page_id: pageData.id,
          content: postText,
          image_url: finalImageUrl
        }])
        .select()
        .single();

      if (error) throw error;

      setPosts([newPost, ...posts]);
      setPostText('');
      setPostPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      alert('Post creation failed: ' + err.message);
    } finally {
      setPosting(false);
    }
  }

  // Delete Post Action
  async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('page_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      setSelectedPostMenu(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Save Edited Post Action
  async function handleSaveEditedPost() {
    if (!editingPost) return;
    setSavingEdit(true);

    try {
      const { error } = await supabase
        .from('page_posts')
        .update({ content: editPostContent })
        .eq('id', editingPost.id);

      if (error) throw error;

      setPosts(posts.map(p => p.id === editingPost.id ? { ...p, content: editPostContent } : p));
      setEditingPost(null);
      setSelectedPostMenu(null);
    } catch (err) {
      alert('Edit failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleLike(postId) {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const isLiked = likedPosts[postId];
    const currentCount = postLikesCount[postId] || 0;

    setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
    setPostLikesCount(prev => ({ ...prev, [postId]: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1 }));

    try {
      if (isLiked) {
        await supabase
          .from('page_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_email', currentUser.email);
      } else {
        await supabase
          .from('page_post_likes')
          .insert([{ post_id: postId, user_email: currentUser.email }]);
      }
    } catch (err) {
      console.error('Like failed:', err);
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

  function handleSharePost(postId) {
    const postUrl = `${window.location.origin}/page/${slug}#post-${postId}`;
    navigator.clipboard.writeText(postUrl);
    setCopiedPostId(postId);
    setSelectedPostMenu(null);
    setTimeout(() => setCopiedPostId(null), 2500);
  }

  async function handleSaveDetails() {
    setUpdatingDetails(true);
    try {
      const updates = {
        name: editName,
        category: editCategory,
        headline: editHeadline,
        about: editBio,
        city: editCity,
        country: editCountry
      };

      const { error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', pageData.id);

      if (error) throw error;

      setPageData(prev => ({ ...prev, ...updates }));
      setShowEditModal(false);
    } catch (err) {
      alert('Error updating details: ' + err.message);
    } finally {
      setUpdatingDetails(false);
    }
  }

  const allPagePhotos = [
    ...(pageData?.banner_url ? [{ id: 'banner', url: pageData.banner_url, title: 'Cover Photo' }] : []),
    ...(pageData?.logo_url ? [{ id: 'logo', url: pageData.logo_url, title: 'Profile Photo' }] : []),
    ...posts.filter(p => p.image_url).map(p => ({ id: p.id, url: p.image_url, title: p.content || 'Photo Post' }))
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h2>Page Not Found</h2>
        <Link href="/feed" style={{ color: '#38bdf8', marginTop: '1rem', textDecoration: 'none' }}>Back to Feed ➔</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>❮</button>
          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#fff' }}>{pageData.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none' }}>Feed 🌐</Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none' }}>Portal 💼</Link>
        </div>
      </header>

      <main style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Cover Banner */}
        <div style={{ 
          height: '190px', 
          backgroundColor: '#1e293b',
          backgroundImage: pageData.banner_url ? `url(${pageData.banner_url})` : 'linear-gradient(135deg, #0284c7 0%, #1e1b4b 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}>
          {isOwner && (
            <div style={{ position: 'absolute', bottom: '0.8rem', right: '0.8rem', zIndex: 30 }}>
              <input id="banner-input" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'banner')} style={{ display: 'none' }} />
              <button 
                type="button"
                onClick={() => document.getElementById('banner-input').click()}
                disabled={uploadingMedia}
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid #334155', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                📷 {uploadingMedia ? '...' : 'Edit Cover'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div style={{ padding: '0 1rem', marginTop: '-55px', position: 'relative', zIndex: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: '115px', 
                height: '115px', 
                borderRadius: '50%', 
                backgroundColor: '#0f172a', 
                backgroundImage: pageData.logo_url ? `url(${pageData.logo_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid #070b14', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '2.5rem', 
                fontWeight: '900', 
                color: '#38bdf8',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}>
                {!pageData.logo_url && pageData.name?.charAt(0).toUpperCase()}
              </div>

              {isOwner && (
                <>
                  <input id="avatar-input" type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'logo')} style={{ display: 'none' }} />
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-input').click()}
                    style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#e2e8f0', color: '#000', borderRadius: '50%', width: '32px', height: '32px', border: '2px solid #070b14', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}
                  >
                    📷
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: '#fff' }}>{pageData.name}</h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}>
              <strong style={{ color: '#fff' }}>{followerCount}</strong> followers • <strong style={{ color: '#fff' }}>0</strong> following
            </p>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.4rem 0 0.8rem 0', lineHeight: 1.4 }}>
              {pageData.about || pageData.headline || 'Welcome to our official page!'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', margin: '1rem 0' }}>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/monetization')}
                  style={{ flex: 1, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >

    📊 Creator dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  ✏️ Edit Page
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: isFollowing ? '#1e293b' : '#0284c7', color: '#fff', border: isFollowing ? '1px solid #334155' : 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {isFollowing ? '✓ Following' : '+ Follow Page'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', gap: '1rem', marginBottom: '1.2rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'all' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                color: activeTab === 'all' ? '#38bdf8' : '#94a3b8',
                padding: '0.6rem 0.5rem',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'photos' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                color: activeTab === 'photos' ? '#38bdf8' : '#94a3b8',
                padding: '0.6rem 0.5rem',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Photos ({allPagePhotos.length})
            </button>
          </div>

          {activeTab === 'all' && (
            <>
              {/* Details Card */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>Details & Info</span>
                  {isOwner && (
                    <button onClick={() => setShowEditModal(true)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                      ✏️ Edit Details
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div>🎓 <strong>Profession / Headline:</strong> {pageData.headline || 'Not specified'}</div>
                  <div>💼 <strong>Category:</strong> {pageData.category || 'Creator'}</div>
                  <div>📍 <strong>Location:</strong> {pageData.city || 'Sukkur'}, {pageData.country || 'Pakistan'}</div>
                  <div>🌐 <strong>Official Link:</strong> shanora.pk/page/{pageData.slug}</div>
                </div>
              </div>

              {/* What's on your mind? */}
              {isOwner && (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <form onSubmit={handleCreatePost}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e293b', backgroundImage: pageData.logo_url ? `url(${pageData.logo_url})` : 'none', backgroundSize: 'cover' }} />
                      <input
                        type="text"
                        placeholder="What's on your mind?"
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
                        style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 1.1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: (postText.trim() || postPhoto) && !posting ? 'pointer' : 'not-allowed' }}
                      >
                        {posting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Feed with Facebook-Style ••• Menu */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.8rem', color: '#fff' }}>Posts</h3>
                
                {posts.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No posts published yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {posts.map(post => {
                      const isLiked = !!likedPosts[post.id];
                      const likesCount = postLikesCount[post.id] || 0;
                      const commentsList = postComments[post.id] || [];
                      const isCommentsOpen = activeCommentPostId === post.id;

                      return (
                        <div id={`post-${post.id}`} key={post.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                          
                          {/* Post Head & ••• Button */}
                          <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', backgroundImage: pageData.logo_url ? `url(${pageData.logo_url})` : 'none', backgroundSize: 'cover' }} />
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>{pageData.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>

                            {/* Three Dots Button (...) */}
                            <button
                              type="button"
                              onClick={() => setSelectedPostMenu(post)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', padding: '0.3rem 0.6rem', cursor: 'pointer', borderRadius: '4px' }}
                            >
                              •••
                            </button>
                          </div>

                          {/* Post Content */}
                          {post.content && (
                            <p style={{ padding: '0 1rem 0.8rem 1rem', margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                              {post.content}
                            </p>
                          )}

                          {post.image_url && (
                            <img src={post.image_url} alt="Post image" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                          )}

                          {/* Counts Bar */}
                          {(likesCount > 0 || commentsList.length > 0) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                              <span>{likesCount > 0 ? `👍 ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}` : ''}</span>
                              <span>{commentsList.length > 0 ? `${commentsList.length} comments` : ''}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #1e293b', padding: '0.3rem 0' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleLike(post.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isLiked ? '#38bdf8' : '#94a3b8',
                                padding: '0.5rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              {isLiked ? '👍 Liked' : '👍 Like'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCommentsOpen ? '#38bdf8' : '#94a3b8',
                                padding: '0.5rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              💬 Comment
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSharePost(post.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedPostId === post.id ? '#4ade80' : '#94a3b8',
                                padding: '0.5rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              {copiedPostId === post.id ? '✓ Copied' : '🔁 Repost'}
                            </button>
                          </div>

                          {/* Comments Drawer */}
                          {isCommentsOpen && (
                            <div style={{ padding: '0.8rem 1rem', backgroundColor: '#070b14', borderTop: '1px solid #1e293b' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '18px', padding: '0.45rem 0.9rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                />
                                <button
                                  type="button"
                                  disabled={submittingComment || !commentInputs[post.id]?.trim()}
                                  onClick={() => handleAddComment(post.id)}
                                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '18px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Post
                                </button>
                              </div>

                              {commentsList.length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                                  No comments yet.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {commentsList.map(c => (
                                    <div key={c.id} style={{ backgroundColor: '#1e293b', padding: '0.5rem 0.8rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                                      <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
                                        {c.user_email.split('@')[0]}
                                      </div>
                                      <div style={{ color: '#f8fafc', lineHeight: 1.3 }}>{c.comment_text}</div>
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
              </div>
            </>
          )}

          {activeTab === 'photos' && (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: '0 0 1rem 0' }}>
                Photos ({allPagePhotos.length})
              </h3>

              {allPagePhotos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.85rem' }}>
                  No photos uploaded on this page yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                  {allPagePhotos.map((photo, index) => (
                    <div 
                      key={`${photo.id}_${index}`} 
                      style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    >
                      <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.3rem', backgroundColor: 'rgba(0,0,0,0.6)', fontSize: '0.68rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {photo.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Facebook-Style Bottom Sheet Menu for (...) Button */}
      {selectedPostMenu && (
        <div 
          onClick={() => setSelectedPostMenu(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', border: '1px solid #1e293b', padding: '1rem', width: '100%', maxWidth: '680px', margin: '0 auto' }}
          >
            {/* Grab handle bar */}
            <div style={{ width: '40px', height: '4px', backgroundColor: '#334155', borderRadius: '2px', margin: '0 auto 1.2rem auto' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              
              {/* Share */}
              <button 
                onClick={() => handleSharePost(selectedPostMenu.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
              >
                <span>↗️</span> Share
              </button>

              {/* Copy link */}
              <button 
                onClick={() => handleSharePost(selectedPostMenu.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
              >
                <span>🔗</span> Copy link
              </button>

              {/* Owner-Only: Edit Post */}
              {isOwner && (
                <button 
                  onClick={() => {
                    setEditingPost(selectedPostMenu);
                    setEditPostContent(selectedPostMenu.content || '');
                    setSelectedPostMenu(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
                >
                  <span>✏️</span> Edit Post
                </button>
              )}

              {/* Owner-Only: Delete Post */}
              {isOwner && (
                <button 
                  onClick={() => handleDeletePost(selectedPostMenu.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}
                >
                  <span>🗑️</span> Delete Post
                </button>
              )}

            </div>

            <button 
              onClick={() => setSelectedPostMenu(null)}
              style={{ marginTop: '0.8rem', width: '100%', padding: '0.75rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#cbd5e1', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', width: '100%', maxWidth: '440px', padding: '1.3rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>Edit Post</h3>
            
            <textarea
              rows={4}
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', resize: 'vertical', marginBottom: '1.2rem' }}
            />

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setEditingPost(null)}
                style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEditedPost}
                disabled={savingEdit}
                style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {savingEdit ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Details Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '1.4rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: '800' }}>Edit Page Details</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.3rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Page Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}>
                  <option value="Education & University">Education & University</option>
                  <option value="Creator / Influencer">Creator / Influencer</option>
                  <option value="Company / Software House">Company / Software House</option>
                  <option value="Business & Retail">Business & Retail</option>
                  <option value="Media & News">Media & News</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Headline / Profession / Education</label>
                <input type="text" placeholder="e.g. I'm I.T Teacher, Software Engineer" value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>City</label>
                  <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Country</label>
                  <input type="text" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>About / Bio</label>
                <textarea rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} style={{ width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '0.55rem 1.1rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveDetails} disabled={updatingDetails} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
                {updatingDetails ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
