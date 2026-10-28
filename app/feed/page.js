'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Comments & Connections State
  const [comments, setComments] = useState({});
  const [openCommentBox, setOpenCommentBox] = useState({});
  const [newComment, setNewComment] = useState({});
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [connectedEmails, setConnectedEmails] = useState(new Set());

  useEffect(() => {
    async function loadFeed() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();
        if (prof) setProfile(prof);

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (postsData) setPosts(postsData);

        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_email', session.user.email);
        if (likesData) {
          setLikedPostIds(new Set(likesData.map(l => Number(l.post_id))));
        }

        const { data: commentsData } = await supabase
          .from('post_comments')
          .select('*')
          .order('created_at', { ascending: true });
        if (commentsData) {
          const map = {};
          commentsData.forEach(c => {
            if (!map[c.post_id]) map[c.post_id] = [];
            map[c.post_id].push(c);
          });
          setComments(map);
        }

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('full_name, email, degree, university, photo_url')
          .neq('email', session.user.email)
          .limit(5);
        if (allProfiles) setSuggestedMembers(allProfiles);

        const { data: myConn } = await supabase
          .from('connections')
          .select('receiver_email')
          .eq('sender_email', session.user.email);
        if (myConn) {
          setConnectedEmails(new Set(myConn.map(c => c.receiver_email)));
        }

      } catch (err) {
        console.error('Feed error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [router]);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setPostImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postContent.trim() && !postImageFile) return;
    setSubmitting(true);

    try {
      let uploadedUrl = null;

      if (postImageFile) {
        const ext = postImageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, postImageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        uploadedUrl = publicUrl;
      }

      const payload = {
        author_email: user.email.toLowerCase().trim(),
        author_name: profile?.full_name || user.email.split('@')[0],
        author_headline: profile?.degree ? `${profile.degree} at ${profile.university}` : 'Shanora Member',
        author_photo: profile?.photo_url || '',
        content: postContent.trim(),
        image_url: uploadedUrl
      };

      const { data, error } = await supabase.from('posts').insert([payload]).select().single();
      if (error) throw error;

      setPosts([data, ...posts]);
      setPostContent('');
      setPostImageFile(null);
      setImagePreview(null);
    } catch (err) {
      alert('Could not publish: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeToggle(postId, currentLikes) {
    const isLiked = likedPostIds.has(Number(postId));
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: newCount } : p));
    const nextLikes = new Set(likedPostIds);
    if (isLiked) nextLikes.delete(Number(postId));
    else nextLikes.add(Number(postId));
    setLikedPostIds(nextLikes);

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_email: user.email });
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_email: user.email });
      }
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
    } catch (err) {
      console.error('Like error:', err);
    }
  }

  async function handleAddComment(postId) {
    const text = newComment[postId]?.trim();
    if (!text) return;

    try {
      const payload = {
        post_id: postId,
        author_email: user.email,
        author_name: profile?.full_name || user.email.split('@')[0],
        comment_text: text
      };

      const { data, error } = await supabase.from('post_comments').insert([payload]).select().single();
      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Failed to comment: ' + err.message);
    }
  }

  async function handleToggleConnect(targetEmail) {
    const isConnected = connectedEmails.has(targetEmail);
    try {
      if (isConnected) {
        await supabase.from('connections').delete().match({ sender_email: user.email, receiver_email: targetEmail });
        const updated = new Set(connectedEmails);
        updated.delete(targetEmail);
        setConnectedEmails(updated);
      } else {
        await supabase.from('connections').insert({ sender_email: user.email, receiver_email: targetEmail, status: 'connected' });
        setConnectedEmails(new Set([...connectedEmails, targetEmail]));
      }
    } catch (err) {
      console.error('Connect error:', err);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Feed...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/messages" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}>
            Messages 💬
          </Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}>
            Portal 💼
          </Link>
        </div>
      </header>

      {/* Grid Layout */}
      <div style={{ maxWidth: '950px', margin: '1.2rem auto', padding: '0 0.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
        
        {/* POSTS STREAM */}
        <main style={{ gridColumn: 'span 2' }}>
          
          {/* Create Post Box */}
          <div style={{ backgroundColor: '#0f172a', padding: '1.1rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                {(profile?.full_name || user.email)[0].toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', display: 'block' }}>{profile?.full_name || 'Professional'}</strong>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Share an achievement, certificate or update</span>
              </div>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                rows={3}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="What did you achieve or build today?..."
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.85rem' }}
              />

              {imagePreview && (
                <div style={{ position: 'relative', marginTop: '0.6rem' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #334155' }} />
                  <button type="button" onClick={() => { setPostImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.7rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  📷 Add Media / Cert
                  <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                </label>

                <button
                  type="submit"
                  disabled={submitting || (!postContent.trim() && !postImageFile)}
                  style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 1.1rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: submitting || (!postContent.trim() && !postImageFile) ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
                >
                  {submitting ? 'Posting...' : 'Post 🚀'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => {
              const isLiked = likedPostIds.has(Number(post.id));
              const postComments = comments[post.id] || [];
              const isCommentOpen = openCommentBox[post.id];

              return (
                <div key={post.id} style={{ backgroundColor: '#0f172a', padding: '1.15rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  
                  {/* Author Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                        {(post.author_name || post.author_email)[0].toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/view-profile?email=${encodeURIComponent(post.author_email)}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: 'bold', fontSize: '0.88rem' }}>
                          {post.author_name || 'Member'}
                        </Link>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{post.author_headline}</span>
                      </div>
                    </div>

                    <Link href={`/messages?chatWith=${encodeURIComponent(post.author_email)}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', textDecoration: 'none', border: '1px solid #334155' }}>
                      Message 💬
                    </Link>
                  </div>

                  {/* Text Content */}
                  <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>

                  {/* Image Attachment */}
                  {post.image_url && (
                    <div style={{ marginBottom: '0.8rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                      <img src={post.image_url} alt="Attachment" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}

                  {/* Like & Comment Buttons */}
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.55rem', display: 'flex', gap: '1.2rem' }}>
                    <button
                      type="button"
                      onClick={() => handleLikeToggle(post.id, post.likes_count || 0)}
                      style={{ background: 'none', border: 'none', color: isLiked ? '#38bdf8' : '#94a3b8', fontWeight: isLiked ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <span>{isLiked ? '👍 Liked' : '👍 Like'}</span>
                      <span>({post.likes_count || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <span>💬 Comment</span>
                      <span>({postComments.length})</span>
                    </button>
                  </div>

                  {/* Comment Section */}
                  {isCommentOpen && (
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.7rem', borderTop: '1px dashed #1e293b' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.7rem' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ''}
                          onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '20px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.78rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.85rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Reply
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {postComments.map(c => (
                          <div key={c.id} style={{ backgroundColor: '#131b2e', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                            <strong style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block' }}>{c.author_name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{c.comment_text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </main>

        {/* SIDEBAR: PEOPLE YOU MAY KNOW */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '1.1rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.92rem', color: '#fff' }}>People You May Know 👥</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {suggestedMembers.map(m => {
                const isConn = connectedEmails.has(m.email);
                return (
                  <div key={m.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Link href={`/view-profile?email=${encodeURIComponent(m.email)}`} style={{ textDecoration: 'none', fontSize: '0.82rem', color: '#fff', fontWeight: 'bold', display: 'block' }}>
                        {m.full_name || 'Member'}
                      </Link>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.degree || 'Student'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleConnect(m.email)}
                      style={{
                        backgroundColor: isConn ? '#1e293b' : '#0284c7',
                        color: isConn ? '#94a3b8' : '#fff',
                        border: 'none',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '16px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {isConn ? 'Connected ✓' : '+ Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

      </div>

    </div>
  )
