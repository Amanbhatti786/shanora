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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Comments State
  const [comments, setComments] = useState({}); // { [postId]: [...] }
  const [openCommentBox, setOpenCommentBox] = useState({}); // { [postId]: boolean }
  const [newComment, setNewComment] = useState({}); // { [postId]: text }

  // Network Members State
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

        // Fetch User Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();
        if (prof) setProfile(prof);

        // Fetch Posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (postsData) setPosts(postsData);

        // Fetch Likes
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_email', session.user.email);
        if (likesData) {
          setLikedPostIds(new Set(likesData.map(l => Number(l.post_id))));
        }

        // Fetch Comments
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

        // Fetch Suggested Connections
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('full_name, email, degree, university, photo_url')
          .neq('email', session.user.email)
          .limit(5);
        if (allProfiles) setSuggestedMembers(allProfiles);

        // Fetch My Connections
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

  // Create Post
  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        author_email: user.email.toLowerCase().trim(),
        author_name: profile?.full_name || user.email.split('@')[0],
        author_headline: profile?.degree ? `${profile.degree} at ${profile.university}` : 'Shanora Professional',
        author_photo: profile?.photo_url || '',
        content: postContent.trim()
      };

      const { data, error } = await supabase.from('posts').insert([payload]).select().single();
      if (error) throw error;

      setPosts([data, ...posts]);
      setPostContent('');
    } catch (err) {
      alert('Could not publish post: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Like Toggle
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

  // Add Comment
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

  // Connect Toggle
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
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.25rem', position: 'sticky', top: 0, zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}>
            Job Portal 💼
          </Link>
        </div>
      </header>

      {/* Grid Layout (Feed + Sidebar) */}
      <div style={{ maxWidth: '950px', margin: '1.5rem auto', padding: '0 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* LEFT / CENTER: POSTS STREAM */}
        <main style={{ gridColumn: 'span 2' }}>
          
          {/* Create Post Box */}
          <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                {(profile?.full_name || user.email)[0].toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>{profile?.full_name || 'Professional'}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Share an achievement, hiring notice, or project</span>
              </div>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                rows={3}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="What's happening in your career? Write a post..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                <button
                  type="submit"
                  disabled={submitting || !postContent.trim()}
                  style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: submitting || !postContent.trim() ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}
                >
                  {submitting ? 'Posting...' : 'Post 🚀'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#94a3b8' }}>
                No posts in the network yet. Be the first to share an update!
              </div>
            ) : (
              posts.map(post => {
                const isLiked = likedPostIds.has(Number(post.id));
                const postComments = comments[post.id] || [];
                const isCommentOpen = openCommentBox[post.id];

                return (
                  <div key={post.id} style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                    
                    {/* Author Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                        {(post.author_name || post.author_email)[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>{post.author_name || 'Member'}</h4>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{post.author_headline}</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>

                    {/* Like & Comment Bar */}
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.6rem', display: 'flex', gap: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(post.id, post.likes_count || 0)}
                        style={{ background: 'none', border: 'none', color: isLiked ? '#38bdf8' : '#94a3b8', fontWeight: isLiked ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                      >
                        <span>{isLiked ? '👍 Liked' : '👍 Like'}</span>
                        <span>({post.likes_count || 0})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                      >
                        <span>💬 Comment</span>
                        <span>({postComments.length})</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {isCommentOpen && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px dashed #1e293b' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment[post.id] || ''}
                            onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                            style={{ flex: 1, padding: '0.5rem 0.8rem', borderRadius: '20px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.8rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            Reply
                          </button>
                        </div>

                        {/* Comments List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {postComments.map(c => (
                            <div key={c.id} style={{ backgroundColor: '#131b2e', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'block' }}>{c.author_name}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{c.comment_text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR: DISCOVER NETWORK */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#fff' }}>People You May Know 👥</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {suggestedMembers.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No suggestions available.</span>
              ) : (
                suggestedMembers.map(m => {
                  const isConn = connectedEmails.has(m.email);
                  return (
                    <div key={m.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{m.full_name || 'Member'}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.degree || 'Student'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleConnect(m.email)}
                        style={{
                          backgroundColor: isConn ? '#1e293b' : '#0284c7',
                          color: isConn ? '#94a3b8' : '#fff',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '16px',
                          fontSize: '0.72rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {isConn ? 'Connected ✓' : '+ Connect'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

      </div>

    </div>
  );
        }
    
