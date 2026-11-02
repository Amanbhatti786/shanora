'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function FeedContent() {
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Comments state per post
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [openCommentBox, setOpenCommentBox] = useState({});

  useEffect(() => {
    fetchUserAndPosts();
  }, []);

  const fetchUserAndPosts = async () => {
    try {
      setLoading(true);

      // Current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch posts (Shanora posts / user_posts)
      let { data: postsData, error: postsError } = await supabase
        .from('user_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        const res = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        postsData = res.data;
      }
      setPosts(postsData || []);

      // Fetch existing comments from post_comments
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsData) {
        const grouped = {};
        commentsData.forEach((c) => {
          if (!grouped[c.post_id]) grouped[c.post_id] = [];
          grouped[c.post_id].push({
            id: c.id,
            post_id: c.post_id,
            content: c.content || c.comment_text,
            author_name: c.author_name || c.user_name || (c.user_email ? c.user_email.split('@')[0] : 'Member'),
            email: c.email || c.user_email || c.author_email,
            created_at: c.created_at
          });
        });
        setCommentsMap(grouped);
      }
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Like / Unlike Handler
  const handleLike = async (postId) => {
    if (!currentUser) {
      alert('Please login to like posts');
      return;
    }

    try {
      const userEmail = currentUser.email.toLowerCase();
      const { error } = await supabase.from('post_likes').insert([
        {
          post_id: postId,
          user_email: userEmail,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          await supabase
            .from('post_likes')
            .delete()
            .match({ post_id: postId, user_email: userEmail });
        } else {
          console.error('Like error:', error.message);
        }
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
        )
      );
    } catch (err) {
      console.error('Like exception:', err);
    }
  };

  // Comment Text Input Change
  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  // Comment Submit Handler
  const handleCommentSubmit = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    if (!currentUser) {
      alert('Please log in to leave a comment.');
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    try {
      const userEmail = currentUser.email.toLowerCase();
      const authorName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        userEmail.split('@')[0] ||
        'Member';

      const payload = {
        post_id: postId,
        content: text,
        comment_text: text,
        user_email: userEmail,
        author_email: userEmail,
        email: userEmail,
        user_name: authorName,
        author_name: authorName,
      };

      const { data, error } = await supabase
        .from('post_comments')
        .insert([payload])
        .select()
        .single();

      if (error) {
        alert('Comment failed: ' + error.message);
        return;
      }

      if (data) {
        const formattedComment = {
          id: data.id,
          post_id: postId,
          content: text,
          author_name: authorName,
          email: userEmail,
          created_at: data.created_at || new Date().toISOString()
        };

        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), formattedComment],
        }));
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert('Comment failed: ' + err.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    setOpenCommentBox((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading feed...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4 min-h-screen">
      {posts.map((post) => {
        const postComments = commentsMap[post.id] || [];
        const isCommenting = submittingComment[post.id] || false;
        const isOpen = openCommentBox[post.id] ?? true;

        return (
          <div
            key={post.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-slate-100"
          >
            {/* Author info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 overflow-hidden">
                {post.author_photo || post.avatar_url ? (
                  <img
                    src={post.author_photo || post.avatar_url}
                    alt={post.author_name || post.user_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (post.author_name || post.user_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm leading-tight">
                  {post.author_name || post.user_name || 'Shanora Member'}
                </h4>
                <p className="text-xs text-slate-400">
                  {post.author_headline || post.author_email || post.user_email}
                </p>
              </div>
            </div>

            {/* Post content */}
            <p className="text-sm whitespace-pre-line text-slate-200 mb-3">
              {post.content}
            </p>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post attachment"
                className="rounded-lg w-full max-h-96 object-cover mb-3"
              />
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1.5 hover:text-sky-400 transition"
              >
                <span>👍</span>
                <span>{post.likes_count || 0} Likes</span>
              </button>

              <button
                onClick={() => toggleComments(post.id)}
                className="hover:text-sky-400 transition"
              >
                💬 {postComments.length} Comments
              </button>
            </div>

            {/* Comments Section */}
            {isOpen && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                {/* Input box */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommentSubmit(post.id);
                    }}
                    disabled={isCommenting}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={isCommenting}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    {isCommenting ? 'Posting...' : 'Post'}
                  </button>
                </div>

                {/* Comment list */}
                {postComments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {postComments.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-800/60 rounded-lg p-2.5 text-xs space-y-1"
                      >
                        <span className="font-semibold text-slate-300">
                          {c.author_name || c.email}
                        </span>
                        <p className="text-slate-200">{c.content}</p>
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
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
          Loading feed...
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
