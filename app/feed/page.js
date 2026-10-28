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

        // Fetch My Likes
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_email', session.user.email);
        if (likesData) {
          setLikedPostIds(new Set(likesData.map(l => Number(l.post_id))));
        }
      } catch (err) {
        console.error('Feed error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, [router]);

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        author_email: user.email.toLowerCase().trim(),
        author_name: profile?.full_name || user.email.split('@')[0],
        author_headline: profile?.degree ? `${profile.degree} student at ${profile.university}` : 'Professional on Shanora',
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

  async function handleLikeToggle(postId, currentLikes) {
    const isLiked = likedPostIds.has(Number(postId));
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // Optimistic UI update
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
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: '600' }}>
            Job Portal 💼
          </Link>
        </div>
      </header>

      {/* Main Feed Container */}
      <main style={{ maxWidth: '620px', margin: '1.5rem auto', padding: '0 1rem' }}>
        
        {/* Create Post Box */}
        <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
              {(profile?.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>{profile?.full_name || 'Professional'}</strong>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Share an update with your network</span>
            </div>
          </div>

          <form onSubmit={handleCreatePost}>
            <textarea
              rows={3}
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="What do you want to talk about? (e.g. project completed, hiring news, achievement)"
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

        {/* Posts Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#94a3b8' }}>
              No posts in the network yet. Be the first to share an update!
            </div>
          ) : (
            posts.map(post => {
              const isLiked = likedPostIds.has(Number(post.id));
              return (
                <div key={post.id} style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
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

                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.6rem', display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleLikeToggle(post.id, post.likes_count || 0)}
                      style={{ background: 'none', border: 'none', color: isLiked ? '#38bdf8' : '#94a3b8', fontWeight: isLiked ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                    >
                      <span>{isLiked ? '👍 Liked' : '👍 Like'}</span>
                      <span>({post.likes_count || 0})</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
      }
            
