'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function FeedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [likedPosts, setLikedPosts] = useState({});
  const [postLikesCount, setPostLikesCount] = useState({});
  const [relayedPosts, setRelayedPosts] = useState({});
  const [postRelaysCount, setPostRelaysCount] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // 1. Fetch direct page posts with author page details
        const { data: directPosts } = await supabase
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
          .limit(30);

        // 2. Fetch relayed posts
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
          .limit(30);

        // Normalize direct posts
        const formattedDirect = (directPosts || []).map(p => ({
          feedItemId: `post-${p.id}`,
          postId: p.id,
          content: p.content,
          imageUrl: p.image_url,
          createdAt: p.created_at,
          sortTime: new Date(p.created_at).getTime(),
          isRelay: false,
          relayedBy: null,
          page: p.pages
        }));

        // Normalize relayed items
        const formattedRelays = (relays || [])
          .filter(r => r.page_posts && r.page_posts.pages)
          .map(r => ({
            feedItemId: `relay-${r.id}`,
            postId: r.page_posts.id,
            content: r.page_posts.content,
            imageUrl: r.page_posts.image_url,
            createdAt: r.page_posts.created_at,
            sortTime: new Date(r.created_at).getTime(), // sort by when it was relayed
            isRelay: true,
            relayedBy: r.user_email?.split('@')[0] || 'A creator',
            page: r.page_posts.pages
          }));

        // Combine & sort descending by date
        const merged = [...formattedDirect, ...formattedRelays].sort((a, b) => b.sortTime - a.sortTime);
        setFeedItems(merged);

        // Extract all post IDs for Likes, Relays & Comments count
        const postIds = Array.from(new Set(merged.map(m => m.postId)));

        if (postIds.length > 0) {
          // Fetch likes
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

          // Fetch relays
          const { data: allRelays } = await supabase
            .from('page_post_relays')
            .select('*')
            .in('post_id', postIds);

          if (allRelays) {
            const rCounts = {};
            const userRelayed = {};
            allRelays.forEach(r => {
              rCounts[r.post_id] = (rCounts[r.post_id] || 0) + 1;
              if (session?.user?.email && r.user_email === session.user.email) {
                userRelayed[r.post_id] = true;
              }
            });
            setPostRelaysCount(rCounts);
            setRelayedPosts(userRelayed);
          }

          // Fetch comments
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
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
  }, []);

  // Like Toggle
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
      console.error(err);
    }
  }

  // Relay Toggle from Feed
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
        await supabase
          .from('page_post_relays')
          .delete()
          .eq('post_id', postId)
          .eq('user_email', currentUser.email);
      } else {
        await supabase
          .from('page_post_relays')
          .insert([{ post_id: postId, user_email: currentUser.email }]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Comment Add
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Bar */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#38bdf8' }}>SHANORA<span style={{ color: '#fff' }}>.PK</span></h1>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>+ Create Page</Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none' }}>Portal 💼</Link>
        </div>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.8rem 3rem 0.8rem' }}>
        
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
                  
                  {/* Relayed By Badge */}
                  {item.isRelay && (
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: '#1e293b', fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #334155' }}>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🔄</span> 
                      <span><strong>{item.relayedBy}</strong> Relayed</span>
                    </div>
                  )}

                  {/* Author Header */}
                  <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <Link href={`/page/${item.page?.slug || ''}`}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1e293b', backgroundImage: item.page?.logo_url ? `url(${item.page.logo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#38bdf8' }}>
                        {!item.page?.logo_url && (item.page?.name?.charAt(0) || 'P')}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/page/${item.page?.slug || ''}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {item.page?.name || 'Shanora Creator'}
                          {item.page?.monetization_status === 'approved' && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>✓</span>}
                        </div>
                      </Link>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Caption */}
                  {item.content && (
                    <p style={{ padding: '0 1rem 0.8rem 1rem', margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                      {item.content}
                    </p>
                  )}

                  {/* Media */}
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="Feed Post" style={{ width: '100%', maxHeight: '440px', objectFit: 'cover' }} />
                  )}

                  {/* Counts Bar */}
                  {(likesCount > 0 || commentsList.length > 0 || relaysCount > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                      <span>{likesCount > 0 ? `👍 ${likesCount}` : ''}</span>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        {commentsList.length > 0 && <span>{commentsList.length} comments</span>}
                        {relaysCount > 0 && <span>{relaysCount} relays</span>}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #1e293b', padding: '0.3rem 0' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.postId)}
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
                              <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '0.75rem' }}>{c.user_email?.split('@')[0]}</div>
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

    </div>
  );
          }
        
