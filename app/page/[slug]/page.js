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

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [postPhoto, setPostPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [posting, setPosting] = useState(false);

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

        // Fetch Page
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

          // Check follow status
          if (session?.user?.email) {
            const { data: followRecord } = await supabase
              .from('page_followers')
              .select('id')
              .eq('page_id', page.id)
              .eq('follower_email', session.user.email)
              .maybeSingle();

            if (followRecord) setIsFollowing(true);
          }

          // Fetch Page Posts
          const { data: postList } = await supabase
            .from('page_posts')
            .select('*')
            .eq('page_id', page.id)
            .order('created_at', { ascending: false });

          if (postList) setPosts(postList);
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

  // Media (DP / Cover) Upload
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

  // Follow / Unfollow
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

  // Create Post
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

  // Save Page Details
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

  // Filter all uploaded photos (Posts + Logo + Banner)
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
        
        {/* Facebook Cover Banner */}
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

        {/* Facebook Avatar & Page Head */}
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

          {/* Page Name & Counts */}
          <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: '#fff' }}>{pageData.name}</h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}>
              <strong style={{ color: '#fff' }}>{followerCount}</strong> followers • <strong style={{ color: '#fff' }}>0</strong> following
            </p>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.4rem 0 0.8rem 0', lineHeight: 1.4 }}>
              {pageData.about || pageData.headline || 'Welcome to our official page!'}
            </p>
          </div>

          {/* Action Row */}
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

          {/* Navigation Tabs (All vs Photos) */}
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

          {/* VIEW 1: ALL TAB (Details + Post Box + Posts Feed) */}
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

              {/* What's on your mind? (Posts Creation - Owner Only, Photo Only) */}
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

              {/* Posts Feed */}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.8rem', color: '#fff' }}>Posts</h3>
                
                {posts.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No posts published yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {posts.map(post => (
                      <div key={post.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', backgroundImage: pageData.logo_url ? `url(${pageData.logo_url})` : 'none', backgroundSize: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>{pageData.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {post.content && (
                          <p style={{ padding: '0 1rem 0.8rem 1rem', margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                            {post.content}
                          </p>
                        )}

                        {post.image_url && (
                          <img src={post.image_url} alt="Post image" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* VIEW 2: PHOTOS TAB (Facebook-Style Photo Grid) */}
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
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                  gap: '0.6rem' 
                }}>
                  {allPagePhotos.map((photo, index) => (
                    <div 
                      key={`${photo.id}_${index}`} 
                      style={{ 
                        position: 'relative', 
                        aspectRatio: '1/1', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155'
                      }}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '0.3rem', 
                        backgroundColor: 'rgba(0,0,0,0.6)', 
                        fontSize: '0.68rem', 
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
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

      {/* Edit Details Modal */}
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
