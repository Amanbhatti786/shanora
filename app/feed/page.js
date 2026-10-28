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
  const [comments, setComments] = useState({});
  const [openCommentBox, setOpenCommentBox] = useState({});
  const [newComment, setNewComment] = useState({});
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [connectedEmails, setConnectedEmails] = useState(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        const { data: prof } = await supabase.from('profiles').select('*').eq('email', session.user.email).maybeSingle();
        if (prof) setProfile(prof);

        const { data: pData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (pData) setPosts(pData);

        const { data: lData } = await supabase.from('post_likes').select('post_id').eq('user_email', session.user.email);
        if (lData) setLikedPostIds(new Set(lData.map(l => Number(l.post_id))));

        const { data: cData } = await supabase.from('post_comments').select('*').order('created_at', { ascending: true });
        if (cData) {
          const map = {};
          cData.forEach(c => {
            if (!map[c.post_id]) map[c.post_id] = [];
            map[c.post_id].push(c);
          });
          setComments(map);
        }

        const { data: allP } = await supabase.from('profiles').select('full_name, email, degree, university').neq('email', session.user.email).limit(5);
        if (allP) setSuggestedMembers(allP);

        const { data: myConn } = await supabase.from('connections').select('receiver_email').eq('sender_email', session.user.email);
        if (myConn) setConnectedEmails(new Set(myConn.map(c => c.receiver_email)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postContent.trim() && !postImageFile) return;
    setSubmitting(true);

    try {
      let uploadedUrl = null;
      if (postImageFile) {
        const ext = postImageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('post-images').upload(fileName, postImageFile, { upsert: true });
        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('post-images').getPublicUrl(fileName);
          uploadedUrl = pUrl?.publicUrl;
        }
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
      alert('Post failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeToggle(postId, currentLikes) {
    const isLiked = likedPostIds.has(Number(postId));
    const nextCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: nextCount } : p));
    const nextSet = new Set(likedPostIds);
    if (isLiked) {
      nextSet.delete(Number(postId));
      await supabase.from('post_likes').delete().match({ post_id: postId, user_email: user.email });
    } else {
      nextSet.add(Number(postId));
      await supabase.from('post_likes').insert({ post_id: postId, user_email: user.email });
    }
    setLikedPostIds(nextSet);
    await supabase.from('posts').update({ likes_count: nextCount }).eq('id', postId);
  }

  async function handleAddComment(postId) {
    const txt = newComment[postId]?.trim();
    if (!txt) return;
    try {
      const payload = {
        post_id: postId,
        author_email: user.email,
        author_name: profile?.full_name || user.email.split('@')[0],
        comment_text: txt
      };
      const { data, error } = await supabase.from('post_comments').insert([payload]).select().single();
      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleConnect(targetEmail) {
    const isConn = connectedEmails.has(targetEmail);
    if (isConn) {
      await supabase.from('connections').delete().match({ sender_email: user.email, receiver_email: targetEmail });
      const next = new Set(connectedEmails);
      next.delete(targetEmail);
      setConnectedEmails(next);
    } else {
      await supabase.from('connections').insert({ sender_email: user.email, receiver_email: targetEmail, status: 'connected' });
      setConnectedEmails(new Set([...connectedEmails, targetEmail]));
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading Feed...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Navbar */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', position: 'sticky', top: 0, zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/messages" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}>
            Messages 💬
          </Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}>
            Portal 💼
          </Link>
        </div>
      </header>

      {/* Main Layout Container */}
      <div style={{ maxWidth: '900px', margin: '1rem auto', padding: '0 0.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* Center Feed Column */}
        <main style={{ gridColumn: 'span 2' }}>
          
          {/* Create Post Card */}
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '1rem' }}>
            <form onSubmit={handleCreatePost}>
              <textarea
                rows={3}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="What did you achieve or build today?..."
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontSize: '0.85rem' }}
              />
              {imagePreview && (
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" onClick={() => { setPostImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                <label style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  📷 Add Media
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setPostImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} style={{ display: 'none' }} />
                </label>
                <button type="submit" disabled={submitting || (!postContent.trim() && !postImageFile)} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 1.1rem', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {submitting ? 'Posting...' : 'Post 🚀'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {posts.map(p => {
              const isLiked = likedPostIds.has(Number(p.id));
              const postComms = comments[p.id] || [];
              const isOpen = openCommentBox[p.id];

              return (
                <div key={p.id} style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div>
                      <Link href={`/view-profile?email=${encodeURIComponent(p.author_email)}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: 'bold', fontSize: '0.88rem' }}>
                        {p.author_name}
                      </Link>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{p.author_headline}</span>
                    </div>
                    <Link href={`/messages?chatWith=${encodeURIComponent(p.author_email)}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', textDecoration: 'none', border: '1px solid #334155' }}>
                      Message 💬
                    </Link>
                  </div>
                  <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{p.content}</p>
                  {p.image_url && <img src={p.image_url} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.6rem' }} />}
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                    <button type="button" onClick={() => handleLikeToggle(p.id, p.likes_count || 0)} style={{ background: 'none', border: 'none', color: isLiked ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: isLiked ? 'bold' : 'normal' }}>
                      👍 Like ({p.likes_count || 0})
                    </button>
                    <button type="button" onClick={() => setOpenCommentBox(prev => ({ ...prev, [p.id]: !prev[p.id] }))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      💬 Comment ({postComms.length})
                    </button>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed #1e293b' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment[p.id] || ''}
                          onChange={e => setNewComment({ ...newComment, [p.id]: e.target.value })}
                          style={{ flex: 1, padding: '0.4rem 0.7rem', borderRadius: '16px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.75rem' }}
                        />
                        <button type="button" onClick={() => handleAddComment(p.id)} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '16px', border: 'none', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          Reply
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {postComms.map(c => (
                          <div key={c.id} style={{ backgroundColor: '#131b2e', padding: '0.45rem 0.7rem', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block' }}>{c.author_name}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{c.comment_text}</span>
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

        {/* Sidebar */}
        <aside>
          <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#fff' }}>People You May Know 👥</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {suggestedMembers.map(m => {
                const isConn = connectedEmails.has(m.email);
                return (
                  <div key={m.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Link href={`/view-profile?email=${encodeURIComponent(m.email)}`} style={{ textDecoration: 'none', fontSize: '0.8rem', color: '#fff', fontWeight: 'bold', display: 'block' }}>
                        {m.full_name || 'Member'}
                      </Link>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{m.degree || 'Student'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleConnect(m.email)}
                      style={{ backgroundColor: isConn ? '#1e293b' : '#0284c7', color: isConn ? '#94a3b8' : '#fff', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '14px', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {isConn ? 'Connected' : '+ Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

