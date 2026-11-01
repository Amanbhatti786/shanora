'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { supabase } from '../../lib/supabaseClient';



// Universal Web Audio API Synthesizer (Enhanced Loud & Crisp for Like, Relay, Comment & New Post)

function playActionSound(type = 'like') {

  if (typeof window === 'undefined') return;



  try {

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;



    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {

      ctx.resume();

    }



    const osc = ctx.createOscillator();

    const gain = ctx.createGain();



    osc.connect(gain);

    gain.connect(ctx.destination);



    const now = ctx.currentTime;



    if (type === 'like' || type === 'relay' || type === 'reaction') {

      // Crisp Facebook/LinkedIn-style Pop-Click

      osc.type = 'sine';

      osc.frequency.setValueAtTime(450, now);

      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);



      gain.gain.setValueAtTime(0.5, now);

      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);



      osc.start(now);

      osc.stop(now + 0.12);

    } else if (type === 'comment' || type === 'reply' || type === 'post') {

      // Pleasant Ascending Tone for Comments, Replies & Successful New Post Publish

      osc.type = 'triangle';

      osc.frequency.setValueAtTime(523.25, now);         // Note C5

      osc.frequency.setValueAtTime(659.25, now + 0.08);  // Note E5

      osc.frequency.setValueAtTime(783.99, now + 0.16);  // Note G5



      gain.gain.setValueAtTime(0.45, now);

      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);



      osc.start(now);

      osc.stop(now + 0.28);

    }

  } catch (err) {

    console.error('Audio play error:', err);

  }

}



// Built-in Client-side Image Compression (Reduces storage footprint & speeds up feed)

async function compressImage(file, maxWidth = 1200, quality = 0.75) {

  if (!file || !file.type.startsWith('image/')) return file;

  if (file.size <= 250 * 1024) return file;



  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);



    reader.onload = (event) => {

      const img = new Image();

      img.src = event.target.result;



      img.onload = () => {

        let width = img.width;

        let height = img.height;



        if (width > maxWidth) {

          height = Math.round((height * maxWidth) / width);

          width = maxWidth;

        }



        const canvas = document.createElement('canvas');

        canvas.width = width;

        canvas.height = height;



        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, width, height);



        canvas.toBlob(

          (blob) => {

            if (!blob) {

              resolve(file);

              return;

            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {

              type: 'image/webp',

              lastModified: Date.now(),

            });

            resolve(compressedFile);

          },

          'image/webp',

          quality

        );

      };



      img.onerror = () => resolve(file);

    };



    reader.onerror = () => resolve(file);

  });

}



export default function FeedPage() {

  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);

  const [userProfile, setUserProfile] = useState(null);

  const [feedItems, setFeedItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);

  const [hasMore, setHasMore] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const POSTS_PER_PAGE = 10;

  const [showSplash, setShowSplash] = useState(false);



  useEffect(() => {

    const hasSeenSplash = sessionStorage.getItem('shanora_splash_shown');

    if (!hasSeenSplash) {

      setShowSplash(true);

      sessionStorage.setItem('shanora_splash_shown', 'true');

      const timer = setTimeout(() => {

        setShowSplash(false);

      }, 1200);

      return () => clearTimeout(timer);

    }

  }, []);



  // Follow State

  const [followingMap, setFollowingMap] = useState({});

  const [followingLoading, setFollowingLoading] = useState({});



  // Three-Dots Actions State

  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const [savedPosts, setSavedPosts] = useState({});



  // Search Engine State

  const [searchQuery, setSearchQuery] = useState('');

  const [searchResults, setSearchResults] = useState([]);

  const [searchFilter, setSearchFilter] = useState('all');

  const [isSearching, setIsSearching] = useState(false);

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);



  // New Personal Post state

  const [postText, setPostText] = useState('');

  const [postPhoto, setPostPhoto] = useState(null);

  const [photoPreview, setPhotoPreview] = useState('');

  const [posting, setPosting] = useState(false);

  const [compressing, setCompressing] = useState(false);



  // Fullscreen Photo Viewer (Lightbox Modal)

  const [previewImage, setPreviewImage] = useState(null);



  // Post Interaction states

  const [likedPosts, setLikedPosts] = useState({});

  const [postLikesCount, setPostLikesCount] = useState({});

  const [relayedPosts, setRelayedPosts] = useState({});

  const [postRelaysCount, setPostRelaysCount] = useState({});

  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [postComments, setPostComments] = useState({});

  const [commentInputs, setCommentInputs] = useState({});

  const [submittingComment, setSubmittingComment] = useState(false);



  // LinkedIn-style Nested Comment & Reactions State

  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  const [replyInputs, setReplyInputs] = useState({});

  const [commentReactions, setCommentReactions] = useState({}); // { [commentId]: { likes: 0, dislikes: 0, myReaction: 'like'|'dislike'|null } }



  // Infinite Scroll Observer Ref

  const observerRef = useRef(null);



  // Helper to load all interactions (likes, relays, comments, comment reactions)

  const loadInteractions = async (items, userEmail) => {

    if (!items || items.length === 0) return;



    const personalPostIds = items.filter(m => m.postType === 'personal').map(m => m.postId);

    const pagePostIds = items.filter(m => m.postType === 'page').map(m => m.postId);



    const countsLikes = {};

    const likedMap = {};

    const countsRelays = {};

    const relayedMap = {};

    const commentsMap = {};

    const allCommentIds = [];



    const cleanUserEmail = userEmail ? userEmail.toLowerCase() : null;



    // 1. Personal Posts interactions

    if (personalPostIds.length > 0) {

      const { data: pLikes } = await supabase

        .from('post_likes')

        .select('*')

        .in('post_id', personalPostIds);



      (pLikes || []).forEach(l => {

        const key = `user-${l.post_id}`;

        countsLikes[key] = (countsLikes[key] || 0) + 1;

        if (cleanUserEmail && l.user_email?.toLowerCase() === cleanUserEmail) {

          likedMap[key] = true;

        }

      });



      const { data: pRelays } = await supabase

        .from('post_relays')

        .select('*')

        .in('post_id', personalPostIds);



      (pRelays || []).forEach(r => {

        const key = `user-${r.post_id}`;

        countsRelays[key] = (countsRelays[key] || 0) + 1;

        if (cleanUserEmail && r.user_email?.toLowerCase() === cleanUserEmail) {

          relayedMap[key] = true;

        }

      });



      const { data: pComments } = await supabase

        .from('post_comments')

        .select('*')

        .in('post_id', personalPostIds)

        .order('created_at', { ascending: true });



      (pComments || []).forEach(c => {

        const key = `user-${c.post_id}`;

        if (!commentsMap[key]) commentsMap[key] = [];

        allCommentIds.push(c.id);

        commentsMap[key].push({

          id: c.id,

          parent_id: c.parent_id || null,

          user_email: c.user_email || c.author_email,

          user_name: c.user_name || c.author_name,

          comment_text: c.content || c.comment_text,

          created_at: c.created_at

        });

      });

    }



    // 2. Page Posts interactions

    if (pagePostIds.length > 0) {

      const { data: pgLikes } = await supabase

        .from('page_post_likes')

        .select('*')

        .in('post_id', pagePostIds);



      (pgLikes || []).forEach(l => {

        const key = `page-${l.post_id}`;

        countsLikes[key] = (countsLikes[key] || 0) + 1;

        if (cleanUserEmail && l.user_email?.toLowerCase() === cleanUserEmail) {

          likedMap[key] = true;

        }

      });



      const { data: pgRelays } = await supabase

        .from('page_post_relays')

        .select('*')

        .in('post_id', pagePostIds);



      (pgRelays || []).forEach(r => {

        const key = `page-${r.post_id}`;

        countsRelays[key] = (countsRelays[key] || 0) + 1;

        if (cleanUserEmail && r.user_email?.toLowerCase() === cleanUserEmail) {

          relayedMap[key] = true;

        }

      });



      const { data: pgComments } = await supabase

        .from('page_post_comments')

        .select('*')

        .in('post_id', pagePostIds)

        .order('created_at', { ascending: true });



      (pgComments || []).forEach(c => {

        const key = `page-${c.post_id}`;

        if (!commentsMap[key]) commentsMap[key] = [];

        allCommentIds.push(c.id);

        commentsMap[key].push({

          id: c.id,

          parent_id: c.parent_id || null,

          user_email: c.user_email || c.author_email,

          user_name: c.user_name || c.author_name || c.user_email?.split('@')[0],

          comment_text: c.comment_text || c.content,

          created_at: c.created_at

        });

      });

    }



    setPostLikesCount(prev => ({ ...prev, ...countsLikes }));

    setLikedPosts(prev => ({ ...prev, ...likedMap }));

    setPostRelaysCount(prev => ({ ...prev, ...countsRelays }));

    setRelayedPosts(prev => ({ ...prev, ...relayedMap }));

    setPostComments(prev => ({ ...prev, ...commentsMap }));



    // 3. Load Comment Reactions (Likes / Dislikes)

    if (allCommentIds.length > 0) {

      try {

        const { data: reactionsData } = await supabase

          .from('comment_reactions')

          .select('*')

          .in('comment_id', allCommentIds);



        if (reactionsData) {

          const rMap = {};

          reactionsData.forEach(r => {

            if (!rMap[r.comment_id]) {

              rMap[r.comment_id] = { likes: 0, dislikes: 0, myReaction: null };

            }

            if (r.reaction_type === 'like') rMap[r.comment_id].likes += 1;

            if (r.reaction_type === 'dislike') rMap[r.comment_id].dislikes += 1;



            if (cleanUserEmail && r.user_email?.toLowerCase() === cleanUserEmail) {

              rMap[r.comment_id].myReaction = r.reaction_type;

            }

          });

          setCommentReactions(prev => ({ ...prev, ...rMap }));

        }

      } catch (err) {

        // Safe failover if comment_reactions table is being set up

        console.warn('Reactions fetch notice:', err);

      }

    }

  };



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



          const { data: followsData } = await supabase

            .from('user_follows')

            .select('following_email')

            .eq('follower_email', user.email);



          if (followsData) {

            const map = {};

            followsData.forEach(f => {

              if (f.following_email) map[f.following_email.toLowerCase()] = true;

            });

            setFollowingMap(map);

          }

        }



        // 1. Fetch Personal Posts (Paginated)

        const from = 0;

        const to = POSTS_PER_PAGE - 1;



        const { data: personalPosts } = await supabase

          .from('user_posts')

          .select('*')

          .order('created_at', { ascending: false })

          .range(from, to);



        if (personalPosts && personalPosts.length < POSTS_PER_PAGE) {

          setHasMore(false);

        }



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

              owner_email,

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

                owner_email,

                monetization_status

              )

            )

          `)

          .order('created_at', { ascending: false })

          .limit(25);



        // Format Personal Posts

        const formattedPersonal = (personalPosts || []).map(p => {

          const rawEmail = p.user_email || '';

          const uname = rawEmail.split('@')[0] || p.user_name || 'user';

          return {

            feedItemId: `user-${p.id}`,

            postId: p.id,

            authorEmail: rawEmail.toLowerCase(),

            postType: 'personal',

            authorName: p.user_name || uname,

            authorAvatar: p.avatar_url,

            authorLink: `/view-profile?email=${encodeURIComponent(rawEmail.toLowerCase())}`,

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

        const formattedPages = (pagePosts || []).map(p => {

          const ownerEmail = (p.pages?.owner_email || '').toLowerCase();

          return {

            feedItemId: `page-${p.id}`,

            postId: p.id,

            authorEmail: ownerEmail,

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

          };

        });



        // Format Relays

        const formattedRelays = (relays || [])

          .filter(r => r.page_posts && r.page_posts.pages)

          .map(r => {

            const ownerEmail = (r.page_posts.pages?.owner_email || '').toLowerCase();

            return {

              feedItemId: `page-${r.page_posts.id}`,

              postId: r.page_posts.id,

              authorEmail: ownerEmail,

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

              relayedByLink: `/view-profile?email=${encodeURIComponent(r.user_email || '')}`

            };

          });



        const merged = [...formattedPersonal, ...formattedPages, ...formattedRelays]

          .sort((a, b) => b.sortTime - a.sortTime);



        setFeedItems(merged);



        // Load interactions

        await loadInteractions(merged, user?.email);



      } catch (err) {

        console.error('Error fetching feed:', err);

      } finally {

        setLoading(false);

      }

    }



    loadData();

  }, []);



  // Infinite Scroll Fetch Trigger

  const loadMorePosts = useCallback(async () => {

    if (loadingMore || !hasMore) return;

    setLoadingMore(true);



    try {

      const nextPage = page + 1;

      const from = nextPage * POSTS_PER_PAGE;

      const to = from + POSTS_PER_PAGE - 1;



      const { data, error } = await supabase

        .from('user_posts')

        .select('*')

        .order('created_at', { ascending: false })

        .range(from, to);



      if (error) throw error;



      if (data) {

        if (data.length < POSTS_PER_PAGE) setHasMore(false);



        const formattedMore = data.map(p => {

          const rawEmail = p.user_email || '';

          const uname = rawEmail.split('@')[0] || p.user_name || 'user';

          return {

            feedItemId: `user-${p.id}`,

            postId: p.id,

            authorEmail: rawEmail.toLowerCase(),

            postType: 'personal',

            authorName: p.user_name || uname,

            authorAvatar: p.avatar_url,

            authorLink: `/view-profile?email=${encodeURIComponent(rawEmail.toLowerCase())}`,

            isVerified: false,

            content: p.content,

            imageUrl: p.image_url,

            createdAt: p.created_at,

            sortTime: new Date(p.created_at).getTime(),

            isRelay: false,

            relayedBy: null

          };

        });



        setFeedItems(prev => [...prev, ...formattedMore]);

        setPage(nextPage);

        await loadInteractions(formattedMore, currentUser?.email);

      }

    } catch (err) {

      console.error('Error loading more posts:', err);

    } finally {

      setLoadingMore(false);

    }

  }, [loadingMore, hasMore, page, currentUser]);



  // Infinite Scroll Sentinel Ref

  const lastPostElementRef = useCallback(

    (node) => {

      if (loadingMore) return;

      if (observerRef.current) observerRef.current.disconnect();



      observerRef.current = new IntersectionObserver((entries) => {

        if (entries[0].isIntersecting && hasMore) {

          loadMorePosts();

        }

      }, { threshold: 0.5 });



      if (node) observerRef.current.observe(node);

    },

    [loadingMore, hasMore, loadMorePosts]

  );



  // Close Three-Dots Menu on document click

  useEffect(() => {

    function handleClickOutside() {

      setOpenMenuPostId(null);

    }

    window.addEventListener('click', handleClickOutside);

    return () => window.removeEventListener('click', handleClickOutside);

  }, []);



  // Follow / Unfollow logic

  async function handleToggleFollow(targetEmail, e) {

    e.stopPropagation();

    if (!currentUser) {

      router.push('/auth');

      return;

    }

    if (!targetEmail) return;



    const cleanTarget = targetEmail.toLowerCase();

    const cleanCurrent = currentUser.email.toLowerCase();



    if (cleanTarget === cleanCurrent) return;



    const isFollowing = !!followingMap[cleanTarget];

    setFollowingLoading(prev => ({ ...prev, [cleanTarget]: true }));

    setFollowingMap(prev => ({ ...prev, [cleanTarget]: !isFollowing }));



    try {

      if (isFollowing) {

        await supabase

          .from('user_follows')

          .delete()

          .eq('follower_email', cleanCurrent)

          .eq('following_email', cleanTarget);

      } else {

        await supabase

          .from('user_follows')

          .insert([{ follower_email: cleanCurrent, following_email: cleanTarget }]);



        await supabase

          .from('notifications')

          .insert([{

            recipient_email: cleanTarget,

            sender_name: userProfile?.name || cleanCurrent.split('@')[0],

            action_type: 'follow',

            content: 'started following you.',

            is_read: false

          }]);

      }

    } catch (err) {

      console.error('Follow error:', err);

      setFollowingMap(prev => ({ ...prev, [cleanTarget]: isFollowing }));

    } finally {

      setFollowingLoading(prev => ({ ...prev, [cleanTarget]: false }));

    }

  }



  // Copy Post Link

  function handleCopyPostLink(item, e) {

    e.stopPropagation();

    const url = `${window.location.origin}/feed#${item.feedItemId}`;

    navigator.clipboard.writeText(url);

    alert('Link copied to clipboard! 📋');

    setOpenMenuPostId(null);

  }



  // Toggle Save Post

  function handleToggleSavePost(feedItemId, e) {

    e.stopPropagation();

    setSavedPosts(prev => ({

      ...prev,

      [feedItemId]: !prev[feedItemId]

    }));

    alert(savedPosts[feedItemId] ? 'Post removed from saved!' : 'Post saved successfully! 🔖');

    setOpenMenuPostId(null);

  }



  // Delete Post

  async function handleDeletePost(postId, postType, e) {

    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this post?')) return;



    try {

      const tableName = postType === 'page' ? 'page_posts' : 'user_posts';



      const { error } = await supabase

        .from(tableName)

        .delete()

        .eq('id', postId);



      if (error) throw error;



      setFeedItems(prev => prev.filter(item => !(item.postId === postId && item.postType === postType)));

      setOpenMenuPostId(null);

    } catch (err) {

      alert('Delete failed: ' + err.message);

    }

  }



  // Live Multi-Search

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

        const { data: pagesData } = await supabase

          .from('pages')

          .select('id, name, slug, logo_url, category, monetization_status')

          .ilike('name', `%${q}%`)

          .limit(10);



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

            link: `/view-profile?email=${encodeURIComponent(u.email || '')}`,

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



  // Image Selection with Automatic Compression

  async function handleImageSelect(e) {

    const file = e.target.files[0];

    if (!file) return;



    setCompressing(true);

    try {

      const optimizedFile = await compressImage(file, 1200, 0.75);

      setPostPhoto(optimizedFile);

      setPhotoPreview(URL.createObjectURL(optimizedFile));

    } catch (err) {

      console.error('Compression error:', err);

      setPostPhoto(file);

      setPhotoPreview(URL.createObjectURL(file));

    } finally {

      setCompressing(false);

    }

  }



  // Submit Personal Post (With Instant Post Success Chime Sound)

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

      const senderEmail = currentUser.email.toLowerCase();



      const { data: newPost, error } = await supabase

        .from('user_posts')

        .insert([{

          user_email: senderEmail,

          user_name: senderName,

          avatar_url: senderAvatar,

          content: postText,

          image_url: finalImageUrl

        }])

        .select()

        .single();



      if (error) throw error;



      // 🔊 Instant Chime Sound

      playActionSound('post');



      const formattedNew = {

        feedItemId: `user-${newPost.id}`,

        postId: newPost.id,

        authorEmail: senderEmail,

        postType: 'personal',

        authorName: senderName,

        authorAvatar: senderAvatar,

        authorLink: `/view-profile?email=${encodeURIComponent(senderEmail)}`,

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



  // Toggle Post Like with Persistence & Sound

  async function handleToggleLike(item) {

    if (!currentUser) {

      router.push('/auth');

      return;

    }



    playActionSound('like');



    const key = item.feedItemId;

    const userEmail = currentUser.email.toLowerCase();

    const isLiked = !!likedPosts[key];

    const currentCount = postLikesCount[key] || 0;

    const nextLikedState = !isLiked;

    const nextCount = nextLikedState ? currentCount + 1 : Math.max(0, currentCount - 1);



    setLikedPosts(prev => ({ ...prev, [key]: nextLikedState }));

    setPostLikesCount(prev => ({ ...prev, [key]: nextCount }));



    const tableName = item.postType === 'page' ? 'page_post_likes' : 'post_likes';



    try {

      if (nextLikedState) {

        await supabase

          .from(tableName)

          .insert([{ post_id: item.postId, user_email: userEmail }]);

      } else {

        await supabase

          .from(tableName)

          .delete()

          .eq('post_id', item.postId)

          .ilike('user_email', userEmail);

      }

    } catch (err) {

      console.error('Like sync error:', err);

      setLikedPosts(prev => ({ ...prev, [key]: isLiked }));

      setPostLikesCount(prev => ({ ...prev, [key]: currentCount }));

    }

  }



  // Toggle Post Relay with Persistence & Sound

  async function handleToggleRelay(item) {

    if (!currentUser) {

      router.push('/auth');

      return;

    }



    playActionSound('relay');



    const key = item.feedItemId;

    const userEmail = currentUser.email.toLowerCase();

    const isRelayed = !!relayedPosts[key];

    const currentCount = postRelaysCount[key] || 0;

    const nextRelayedState = !isRelayed;

    const nextCount = nextRelayedState ? currentCount + 1 : Math.max(0, currentCount - 1);



    setRelayedPosts(prev => ({ ...prev, [key]: nextRelayedState }));

    setPostRelaysCount(prev => ({ ...prev, [key]: nextCount }));



    const tableName = item.postType === 'page' ? 'page_post_relays' : 'post_relays';



    try {

      if (nextRelayedState) {

        await supabase

          .from(tableName)

          .insert([{ post_id: item.postId, user_email: userEmail }]);

      } else {

        await supabase

          .from(tableName)

          .delete()

          .eq('post_id', item.postId)

          .ilike('user_email', userEmail);

      }

    } catch (err) {

      console.error('Relay error:', err);

      setRelayedPosts(prev => ({ ...prev, [key]: isRelayed }));

      setPostRelaysCount(prev => ({ ...prev, [key]: currentCount }));

    }

  }



  // Add Top-level Comment with Sound

  async function handleAddComment(item) {

    if (!currentUser) {

      router.push('/auth');

      return;

    }



    const key = item.feedItemId;

    const text = commentInputs[key]?.trim();

    if (!text || submittingComment) return;



    playActionSound('comment');

    setSubmittingComment(true);



    const userEmail = currentUser.email.toLowerCase();

    const userName = userProfile?.name || currentUser.user_metadata?.full_name || userEmail.split('@')[0];



    const isPagePost = item.postType === 'page';

    const targetTable = isPagePost ? 'page_post_comments' : 'post_comments';



    const payload = isPagePost

      ? {

          post_id: item.postId,

          user_email: userEmail,

          comment_text: text,

          parent_id: null

        }

      : {

          post_id: item.postId,

          user_email: userEmail,

          author_email: userEmail,

          user_name: userName,

          author_name: userName,

          content: text,

          comment_text: text,

          parent_id: null

        };



    try {

      const { data: newComment, error } = await supabase

        .from(targetTable)

        .insert([payload])

        .select()

        .single();



      if (error) throw error;



      const formatted = {

        id: newComment.id,

        parent_id: null,

        user_email: userEmail,

        user_name: userName,

        comment_text: text,

        created_at: newComment.created_at || new Date().toISOString()

      };



      setPostComments(prev => ({

        ...prev,

        [key]: [...(prev[key] || []), formatted]

      }));



      setCommentInputs(prev => ({ ...prev, [key]: '' }));



      if (item.authorEmail && item.authorEmail !== userEmail) {

        await supabase.from('notifications').insert([{

          recipient_email: item.authorEmail,

          sender_name: userName,

          sender_email: userEmail,

          action_type: 'comment',

          post_id: item.postId,

          content: 'commented on your post.',

          is_read: false

        }]);

      }

    } catch (err) {

      console.error('Comment error:', err);

      alert('Comment failed: ' + err.message);

    } finally {

      setSubmittingComment(false);

    }

  }



  // Submit LinkedIn-Style Nested Reply

  async function handleAddReply(item, parentComment) {

    if (!currentUser) {

      router.push('/auth');

      return;

    }



    const replyText = replyInputs[parentComment.id]?.trim();

    if (!replyText || submittingComment) return;



    playActionSound('reply');

    setSubmittingComment(true);



    const userEmail = currentUser.email.toLowerCase();

    const userName = userProfile?.name || currentUser.user_metadata?.full_name || userEmail.split('@')[0];

    const isPagePost = item.postType === 'page';

    const targetTable = isPagePost ? 'page_post_comments' : 'post_comments';



    const payload = isPagePost

      ? {

          post_id: item.postId,

          user_email: userEmail,

          comment_text: replyText,

          parent_id: parentComment.id

        }

      : {

          post_id: item.postId,

          user_email: userEmail,

          author_email: userEmail,

          user_name: userName,

          author_name: userName,

          content: replyText,

          comment_text: replyText,

          parent_id: parentComment.id

        };



    try {

      const { data: newReply, error } = await supabase

        .from(targetTable)

        .insert([payload])

        .select()

        .single();



      if (error) throw error;



      const formatted = {

        id: newReply.id,

        parent_id: parentComment.id,

        user_email: userEmail,

        user_name: userName,

        comment_text: replyText,

        created_at: newReply.created_at || new Date().toISOString()

      };



      setPostComments(prev => ({

        ...prev,

        [item.feedItemId]: [...(prev[item.feedItemId] || []), formatted]

      }));



      setReplyInputs(prev => ({ ...prev, [parentComment.id]: '' }));

      setReplyingToCommentId(null);

    } catch (err) {

      console.error('Reply error:', err);

      alert('Reply failed: ' + err.message);

    } finally {

      setSubmittingComment(false);

    }

  }



  // Toggle Comment Reaction (Like / Dislike)

  async function handleCommentReaction(commentId, type) {

    if (!currentUser) {

      router.push('/auth');

      return;

    }



    playActionSound('reaction');



    const userEmail = currentUser.email.toLowerCase();

    const current = commentReactions[commentId] || { likes: 0, dislikes: 0, myReaction: null };

    const prevReaction = current.myReaction;



    let nextReaction = type;

    let nextLikes = current.likes;

    let nextDislikes = current.dislikes;



    // Toggle off if clicking the active one

    if (prevReaction === type) {

      nextReaction = null;

      if (type === 'like') nextLikes = Math.max(0, nextLikes - 1);

      if (type === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);

    } else {

      if (type === 'like') {

        nextLikes += 1;

        if (prevReaction === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);

      } else if (type === 'dislike') {

        nextDislikes += 1;

        if (prevReaction === 'like') nextLikes = Math.max(0, nextLikes - 1);

      }

    }



    // Optimistic UI

    setCommentReactions(prev => ({

      ...prev,

      [commentId]: { likes: nextLikes, dislikes: nextDislikes, myReaction: nextReaction }

    }));



    try {

      if (nextReaction === null) {

        await supabase

          .from('comment_reactions')

          .delete()

          .eq('comment_id', commentId)

          .ilike('user_email', userEmail);

      } else {

        await supabase

          .from('comment_reactions')

          .upsert([{

            comment_id: commentId,

            user_email: userEmail,

            reaction_type: nextReaction

          }], { onConflict: 'comment_id,user_email' });

      }

    } catch (err) {

      console.error('Reaction sync error:', err);

      setCommentReactions(prev => ({ ...prev, [commentId]: current }));

    }

  }



  const currentUserName = userProfile?.name || currentUser?.email?.split('@')[0] || 'You';

  const cleanCurrentUserEmail = (currentUser?.email || '').toLowerCase();



  const filteredResults = searchResults.filter(item => {

    if (searchFilter === 'pages') return item.type === 'page';

    if (searchFilter === 'profiles') return item.type === 'profile';

    return true;

  });



  if (showSplash) {

    return (

      <div

        style={{

          position: 'fixed',

          inset: 0,

          backgroundColor: '#070b14',

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'center',

          justifyContent: 'space-between',

          padding: '60px 20px 40px 20px',

          zIndex: 999999,

          fontFamily: 'system-ui, -apple-system, sans-serif'

        }}

      >

        <div style={{ height: '40px' }}></div>



        {/* Center Official S-Logo */}

        <div

          style={{

            display: 'flex',

            flexDirection: 'column',

            alignItems: 'center',

            gap: '16px'

          }}

        >

          <div

            style={{

              width: '64px',

              height: '64px',

              borderRadius: '16px',

              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              boxShadow: '0 10px 25px rgba(2, 132, 199, 0.45)'

            }}

          >

            <span

              style={{

                color: '#ffffff',

                fontSize: '2.2rem',

                fontWeight: '900',

                lineHeight: 1

              }}

            >

              S

            </span>

          </div>



          {/* Dots Loader */}

          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>

            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>

            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', opacity: 0.6 }}></span>

            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7', opacity: 0.3 }}></span>

          </div>

        </div>



        {/* Bottom Branding */}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>

          <span style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>

            from

          </span>

          <span style={{ color: '#38bdf8', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.1em' }}>

            SHANORA

          </span>

        </div>

      </div>

    );

  }



  return (

    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      

      {/* Top Header */}

      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.65rem 1rem', position: 'sticky', top: 0, zIndex: 100 }}>

        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'space-between' }}>

          <Link href="/feed" style={{

            textDecoration: 'none',

            display: 'inline-flex',

            alignItems: 'center',

            gap: '0.65rem',

            backgroundColor: '#0b1322',

            border: '1px solid #1e293b',

            borderRadius: '10px',

            padding: '0.28rem 0.65rem 0.28rem 0.35rem',

            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',

            flexShrink: 0

          }}>

            {/* Official "S" Badge */}

            <div style={{

              width: '28px',

              height: '28px',

              borderRadius: '7px',

              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',

              border: '1px solid rgba(255, 255, 255, 0.2)',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              boxShadow: '0 0 10px rgba(2, 132, 199, 0.45)',

              flexShrink: 0

            }}>

              <span style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '900', lineHeight: 1 }}>

                S

              </span>

            </div>



            {/* Brand Wordmark */}

            <span style={{

              fontSize: '1.05rem',

              fontWeight: '900',

              color: '#ffffff',

              letterSpacing: '-0.3px',

              whiteSpace: 'nowrap'

            }}>

              SHANORA<span style={{

                fontSize: '0.55rem',

                fontWeight: '800',

                color: '#38bdf8',

                verticalAlign: 'super',

                marginLeft: '2px',

                letterSpacing: '0.5px'

              }}>.PK</span>

            </span>

          </Link>



          {/* Search Box */}

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



            {/* Dropdown */}

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

                          borderBottom: '1px solid #1e293b'

                        }}

                      >

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

          </div>



        </div>

      </header>



      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.8rem 3rem 0.8rem' }}>

        

        {/* Post Creation Box */}

        {currentUser && (

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem' }}>

            <form onSubmit={handleCreatePersonalPost}>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>

                <Link href={`/view-profile?email=${encodeURIComponent(currentUser.email || '')}`} style={{ textDecoration: 'none' }}>

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



              {compressing && (

                <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: '600' }}>

                  ⚡ Optimizing image size...

                </div>

              )}



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

                    onChange={handleImageSelect}

                    style={{ display: 'none' }}

                  />

                </label>



                <button

                  type="submit"

                  disabled={posting || compressing || (!postText.trim() && !postPhoto)}

                  style={{ 

                    backgroundColor: '#0284c7', 

                    color: '#fff', 

                    border: 'none', 

                    padding: '0.45rem 1.2rem', 

                    borderRadius: '6px', 

                    fontSize: '0.82rem', 

                    fontWeight: '700', 

                    cursor: (postText.trim() || postPhoto) && !posting && !compressing ? 'pointer' : 'not-allowed',

                    opacity: (postText.trim() || postPhoto) && !posting && !compressing ? 1 : 0.6

                  }}

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

              const isLiked = !!likedPosts[item.feedItemId];

              const likesCount = postLikesCount[item.feedItemId] || 0;

              const isRelayed = !!relayedPosts[item.feedItemId];

              const relaysCount = postRelaysCount[item.feedItemId] || 0;

              const commentsList = postComments[item.feedItemId] || [];

              const isCommentsOpen = activeCommentPostId === item.feedItemId;



              const authorEmailClean = (item.authorEmail || '').toLowerCase();

              const isOwnPost = cleanCurrentUserEmail && authorEmailClean === cleanCurrentUserEmail;

              const isFollowingAuthor = authorEmailClean ? !!followingMap[authorEmailClean] : false;

              const isMenuOpen = openMenuPostId === item.feedItemId;



              // Filter main parent comments and nested replies

              const parentComments = commentsList.filter(c => !c.parent_id);



              return (

                <div key={item.feedItemId} id={item.feedItemId} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'visible', position: 'relative' }}>

                  

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



                  {/* Header: Author + Follow Button + Three-Dots */}

                  <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>

                    

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flex: 1, overflow: 'hidden' }}>

                      <Link href={item.authorLink || `/view-profile?email=${encodeURIComponent(item.authorEmail || '')}`} style={{ textDecoration: 'none' }}>

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

                          border: '1px solid #334155', 

                          flexShrink: 0 

                        }}>

                          {!item.authorAvatar && item.authorName.charAt(0).toUpperCase()}

                        </div>

                      </Link>



                      <div style={{ overflow: 'hidden' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

                          <Link href={item.authorLink || `/view-profile?email=${encodeURIComponent(item.authorEmail || '')}`} style={{ textDecoration: 'none' }}>

                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff', cursor: 'pointer' }}>

                              {item.authorName}

                            </span>

                          </Link>

                          {item.isVerified && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>✓</span>}



                          {/* + Follow / Following Button */}

                          {!isOwnPost && (

                            <button

                              type="button"

                              onClick={(e) => handleToggleFollow(authorEmailClean, e)}

                              disabled={followingLoading[authorEmailClean]}

                              style={{

                                background: isFollowingAuthor ? 'transparent' : 'rgba(2, 132, 199, 0.2)',

                                color: isFollowingAuthor ? '#94a3b8' : '#38bdf8',

                                border: isFollowingAuthor ? '1px solid #334155' : '1px solid #0284c7',

                                padding: '0.18rem 0.55rem',

                                borderRadius: '12px',

                                fontSize: '0.72rem',

                                fontWeight: '700',

                                cursor: 'pointer',

                                display: 'inline-flex',

                                alignItems: 'center',

                                gap: '0.2rem'

                              }}

                            >

                              {isFollowingAuthor ? '✓ Following' : '+ Follow'}

                            </button>

                          )}

                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>

                          {new Date(item.createdAt).toLocaleDateString()}

                        </div>

                      </div>

                    </div>



                    {/* Three-Dots Menu */}

                    <div style={{ position: 'relative' }}>

                      <button

                        type="button"

                        onClick={(e) => {

                          e.stopPropagation();

                          setOpenMenuPostId(isMenuOpen ? null : item.feedItemId);

                        }}

                        style={{

                          background: 'none',

                          border: 'none',

                          color: '#94a3b8',

                          fontSize: '1.25rem',

                          cursor: 'pointer',

                          padding: '0.2rem 0.5rem',

                          borderRadius: '6px'

                        }}

                      >

                        •••

                      </button>



                      {isMenuOpen && (

                        <div

                          onClick={(e) => e.stopPropagation()}

                          style={{

                            position: 'absolute',

                            top: '30px',

                            right: 0,

                            backgroundColor: '#0f172a',

                            border: '1px solid #334155',

                            borderRadius: '10px',

                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',

                            width: '150px',

                            zIndex: 200,

                            overflow: 'hidden',

                            display: 'flex',

                            flexDirection: 'column'

                          }}

                        >

                          <button

                            type="button"

                            onClick={(e) => handleCopyPostLink(item, e)}

                            style={{

                              background: 'none',

                              border: 'none',

                              color: '#f8fafc',

                              padding: '0.6rem 0.9rem',

                              textAlign: 'left',

                              fontSize: '0.8rem',

                              cursor: 'pointer',

                              display: 'flex',

                              alignItems: 'center',

                              gap: '0.5rem',

                              borderBottom: '1px solid #1e293b'

                            }}

                          >

                            <span>🔗</span> Copy Link

                          </button>



                          <button

                            type="button"

                            onClick={(e) => handleToggleSavePost(item.feedItemId, e)}

                            style={{

                              background: 'none',

                              border: 'none',

                              color: savedPosts[item.feedItemId] ? '#38bdf8' : '#f8fafc',

                              padding: '0.6rem 0.9rem',

                              textAlign: 'left',

                              fontSize: '0.8rem',

                              cursor: 'pointer',

                              display: 'flex',

                              alignItems: 'center',

                              gap: '0.5rem',

                              borderBottom: isOwnPost ? '1px solid #1e293b' : 'none'

                            }}

                          >

                            <span>🔖</span> {savedPosts[item.feedItemId] ? 'Saved' : 'Save Post'}

                          </button>



                          {isOwnPost && (

                            <button

                              type="button"

                              onClick={(e) => handleDeletePost(item.postId, item.postType, e)}

                              style={{

                                background: 'none',

                                border: 'none',

                                color: '#ef4444',

                                padding: '0.6rem 0.9rem',

                                textAlign: 'left',

                                fontSize: '0.8rem',

                                cursor: 'pointer',

                                display: 'flex',

                                alignItems: 'center',

                                gap: '0.5rem'

                              }}

                            >

                              <span>🗑️</span> Delete Post

                            </button>

                          )}

                        </div>

                      )}

                    </div>



                  </div>



                  {/* Content */}

                  {item.content && (

                    <div style={{ padding: '0 1rem 0.8rem 1rem', margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.45, userSelect: 'text' }}>

                      {item.content}

                    </div>

                  )}



                  {/* Image */}

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

                      onClick={() => handleToggleLike(item)}

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

                      onClick={() => handleToggleRelay(item)}

                      style={{ background: 'none', border: 'none', color: isRelayed ? '#4ade80' : '#94a3b8', padding: '0.55rem', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}

                    >

                      {isRelayed ? '🔄 Relayed' : '🔄 Relay'}

                    </button>

                  </div>



                  {/* Comments Drawer (LinkedIn Style Threading) */}

                  {isCommentsOpen && (

                    <div style={{ padding: '0.8rem 1rem', backgroundColor: '#070b14', borderTop: '1px solid #1e293b' }}>

                      

                      {/* Top-level Comment Input */}

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>

                        <input

                          type="text"

                          placeholder="Write a comment..."

                          value={commentInputs[item.feedItemId] || ''}

                          onChange={(e) => setCommentInputs({ ...commentInputs, [item.feedItemId]: e.target.value })}

                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item)}

                          style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '18px', padding: '0.45rem 0.9rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}

                        />

                        <button

                          type="button"

                          disabled={submittingComment || !commentInputs[item.feedItemId]?.trim()}

                          onClick={() => handleAddComment(item)}

                          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '18px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}

                        >

                          Post

                        </button>

                      </div>



                      {/* Comments & Replies Stream */}

                      {parentComments.length === 0 ? (

                        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.4rem' }}>

                          No comments yet. Be the first to share your thoughts!

                        </div>

                      ) : (

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

                          {parentComments.map(c => {

                            const nestedReplies = commentsList.filter(r => r.parent_id === c.id);

                            const isReplying = replyingToCommentId === c.id;

                            const rx = commentReactions[c.id] || { likes: 0, dislikes: 0, myReaction: null };



                            return (

                              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

                                

                                {/* Main Comment Card */}

                                <div style={{ backgroundColor: '#1e293b', padding: '0.65rem 0.9rem', borderRadius: '12px', fontSize: '0.82rem' }}>

                                  

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>

                                    <Link href={`/view-profile?email=${encodeURIComponent(c.user_email || '')}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700', fontSize: '0.76rem' }}>

                                      {c.user_name || c.user_email?.split('@')[0]}

                                    </Link>

                                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>

                                      {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}

                                    </span>

                                  </div>



                                  <div style={{ color: '#f8fafc', margin: '0.3rem 0', lineHeight: 1.4, wordBreak: 'break-word' }}>

                                    {c.comment_text}

                                  </div>



                                  {/* LinkedIn Style Interaction Bar: Like | Dislike | Reply */}

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.35rem', marginTop: '0.4rem' }}>

                                    

                                    {/* Like Button */}

                                    <button

                                      type="button"

                                      onClick={() => handleCommentReaction(c.id, 'like')}

                                      style={{

                                        background: 'none',

                                        border: 'none',

                                        color: rx.myReaction === 'like' ? '#38bdf8' : '#94a3b8',

                                        fontSize: '0.72rem',

                                        fontWeight: '700',

                                        cursor: 'pointer',

                                        display: 'inline-flex',

                                        alignItems: 'center',

                                        gap: '0.25rem',

                                        padding: 0

                                      }}

                                    >

                                      <span>👍</span> {rx.likes > 0 ? rx.likes : 'Like'}

                                    </button>



                                    {/* Dislike Button */}

                                    <button

                                      type="button"

                                      onClick={() => handleCommentReaction(c.id, 'dislike')}

                                      style={{

                                        background: 'none',

                                        border: 'none',

                                        color: rx.myReaction === 'dislike' ? '#ef4444' : '#94a3b8',

                                        fontSize: '0.72rem',

                                        fontWeight: '700',

                                        cursor: 'pointer',

                                        display: 'inline-flex',

                                        alignItems: 'center',

                                        gap: '0.25rem',

                                        padding: 0

                                      }}

                                    >

                                      <span>👎</span> {rx.dislikes > 0 ? rx.dislikes : 'Dislike'}

                                    </button>



                                    {/* Reply Toggle */}

                                    <button

                                      type="button"

                                      onClick={() => setReplyingToCommentId(isReplying ? null : c.id)}

                                      style={{

                                        background: 'none',

                                        border: 'none',

                                        color: isReplying ? '#38bdf8' : '#94a3b8',

                                        fontSize: '0.72rem',

                                        fontWeight: '700',

                                        cursor: 'pointer',

                                        display: 'inline-flex',

                                        alignItems: 'center',

                                        gap: '0.25rem',

                                        padding: 0

                                      }}

                                    >

                                      <span>↩</span> Reply

                                    </button>



                                  </div>

                                </div>



                                {/* Inline Reply Input (Shown when "Reply" is clicked) */}

                                {isReplying && (

                                  <div style={{ marginLeft: '1.6rem', display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>

                                    <input

                                      type="text"

                                      placeholder={`Reply to ${c.user_name || 'creator'}...`}

                                      value={replyInputs[c.id] || ''}

                                      onChange={(e) => setReplyInputs({ ...replyInputs, [c.id]: e.target.value })}

                                      onKeyDown={(e) => e.key === 'Enter' && handleAddReply(item, c)}

                                      style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '0.35rem 0.8rem', color: '#fff', fontSize: '0.78rem', outline: 'none' }}

                                    />

                                    <button

                                      type="button"

                                      disabled={submittingComment || !replyInputs[c.id]?.trim()}

                                      onClick={() => handleAddReply(item, c)}

                                      style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}

                                    >

                                      Reply

                                    </button>

                                  </div>

                                )}



                                {/* Indented Nested Replies List */}

                                {nestedReplies.length > 0 && (

                                  <div style={{ marginLeft: '1.6rem', borderLeft: '2px solid #334155', paddingLeft: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.2rem' }}>

                                    {nestedReplies.map(r => {

                                      const replyRx = commentReactions[r.id] || { likes: 0, dislikes: 0, myReaction: null };



                                      return (

                                        <div key={r.id} style={{ backgroundColor: '#131e32', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem' }}>

                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                            <Link href={`/view-profile?email=${encodeURIComponent(r.user_email || '')}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700', fontSize: '0.74rem' }}>

                                              {r.user_name || r.user_email?.split('@')[0]}

                                            </Link>

                                            <span style={{ fontSize: '0.62rem', color: '#64748b' }}>

                                              {r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}

                                            </span>

                                          </div>



                                          <div style={{ color: '#cbd5e1', marginTop: '0.2rem', lineHeight: 1.35, wordBreak: 'break-word' }}>

                                            {r.comment_text}

                                          </div>



                                          {/* Nested Reply Reaction Bar */}

                                          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.3rem', fontSize: '0.68rem' }}>

                                            <button

                                              type="button"

                                              onClick={() => handleCommentReaction(r.id, 'like')}

                                              style={{ background: 'none', border: 'none', color: replyRx.myReaction === 'like' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: 0, fontWeight: '700' }}

                                            >

                                              👍 {replyRx.likes > 0 ? replyRx.likes : 'Like'}

                                            </button>



                                            <button

                                              type="button"

                                              onClick={() => handleCommentReaction(r.id, 'dislike')}

                                              style={{ background: 'none', border: 'none', color: replyRx.myReaction === 'dislike' ? '#ef4444' : '#94a3b8', cursor: 'pointer', padding: 0, fontWeight: '700' }}

                                            >

                                              👎 {replyRx.dislikes > 0 ? replyRx.dislikes : 'Dislike'}

                                            </button>

                                          </div>

                                        </div>

                                      );

                                    })}

                                  </div>

                                )}



                              </div>

                            );

                          })}

                        </div>

                      )}



                    </div>

                  )}



                </div>

              );

            })}

          </div>

        )}



        {/* Infinite Scroll Sentinel */}

        <div ref={lastPostElementRef} style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>

          {loadingMore && (

            <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '700' }}>

              Loading more updates...

            </div>

          )}

          {!hasMore && feedItems.length > 0 && (

            <div style={{ color: '#64748b', fontSize: '0.78rem' }}>

              You have viewed all updates 🎉

            </div>

          )}

        </div>



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
