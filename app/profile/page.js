'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import BottomNav from '../../components/BottomNav';

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Executive High-End Verified PRO Badge Component
function ProVerifiedBadge({ size = 18 }) {
  return (
    <span 
      title="Verified PRO Member" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: '4px',
        flexShrink: 0
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10.5" fill="url(#proBadgeGrad)" stroke="#38bdf8" strokeWidth="1.2" />
        <path d="M7.5 12.2L10.3 15L16.5 9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="proBadgeGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

function ProfilePortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'profile');
  const [networkSubTab, setNetworkSubTab] = useState('followers');
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Modals for Menu Features
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [claimingMilestone, setClaimingMilestone] = useState(null);

  // Ads Portal State (Strict Multi-Step Facebook Campaign Flow)
  const [adStep, setAdStep] = useState(1);
  const [adFormData, setAdFormData] = useState({
    selectedPageId: '',
    selectedPageSlug: '',
    headline: '',
    adText: '',
    targetUrl: '',
    targetCity: 'All Pakistan',
    targetObjective: 'traffic',
    budget: '1500',
    durationDays: '7',
    paymentMethod: 'EasyPaisa',
    trxId: ''
  });
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adSuccessMessage, setAdSuccessMessage] = useState('');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: 'Pakistan',
    bio: '',
    headline: '',
    skills: '',
    avatar_url: '',
    resume_url: '',
    is_pro: false,
    is_ambassador: false,
    referral_badge: false,
    is_monetized: false,
    wallet_balance: 0,
    open_to_work: true,
    profile_visible: true,
    last_seen_visible: true,
    email_alerts: true,
    app_language: 'English',
    message_permission: 'Anyone'
  });

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: '',
    headline: '',
    phone: '',
    city: 'Pakistan',
    bio: '',
    skills: '',
    avatar_url: '',
    resume_url: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [resumeData, setResumeData] = useState({
    summary: '',
    skills: '',
    experience: 'Senior Freelance Creator & Specialist (2024 - Present)\n- Delivered over 50+ successful client campaigns.\n- Optimized social media growth and video production pipelines.',
    education: 'Bachelor of Science in Computer Science\nUniversity of Information Technology (2020 - 2024)',
    languages: 'English (Professional), Urdu (Native)'
  });

  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [submittingPro, setSubmittingPro] = useState(false);
  const [latestProRequest, setLatestProRequest] = useState(null);

  const [myPostsCount, setMyPostsCount] = useState(0);
  const [myPages, setMyPages] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [userLastMessagesMap, setUserLastMessagesMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Messenger Real-Time State (Facebook Messenger Style)
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const pressTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [monetizationStatus, setMonetizationStatus] = useState(null);
  const [submittingMonetization, setSubmittingMonetization] = useState(false);
  const [payoutsHistory, setPayoutsHistory] = useState([]);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payment_method: 'EasyPaisa',
    account_number: '',
    account_title: ''
  });
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const [savedPostsList, setSavedPostsList] = useState([]);
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState('account');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Synchronous route redirection & Mobile Hardware Back Button Synchronization
  const navigateToTab = (newTab, chatUser = null) => {
    setActiveTab(newTab);
    setActiveChatUser(chatUser);
    if (typeof window !== 'undefined') {
      const url = newTab === 'menu' ? '/profile?tab=menu' : `/profile?tab=${newTab}${chatUser ? `&chatWith=${encodeURIComponent(chatUser.email || '')}` : ''}`;
      window.history.pushState({ tab: newTab, chatUserEmail: chatUser?.email || null }, '', url);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');

      if (tabParam === 'notifications' || tabParam === 'alerts') {
        window.location.replace('/alerts');
        return;
      }
      if (tabParam === 'jobs') {
        window.location.replace('/jobs');
        return;
      }
      if (tabParam === 'security') {
        window.location.replace('/settings/security');
        return;
      }
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Native Mobile Back Button Handler (Prevents jumping to random tabs)
  useEffect(() => {
    const handlePopState = (event) => {
      if (activeChatUser) {
        setActiveChatUser(null);
        return;
      }
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
      } else if (activeTab !== 'menu') {
        setActiveTab('menu');
      } else {
        router.push('/feed');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeChatUser, activeTab, router]);

  useEffect(() => {
    async function initPortal() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);
        const myEmail = (currentUser.email || '').trim().toLowerCase();

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', myEmail)
          .maybeSingle();

        const defaultProfile = {
          full_name: profileData?.full_name || profileData?.name || currentUser.user_metadata?.full_name || myEmail.split('@')[0],
          email: currentUser.email,
          phone: profileData?.phone || '',
          city: profileData?.city || 'Pakistan',
          headline: profileData?.headline || 'Professional Member on Shanora',
          bio: profileData?.bio || 'Passionate creator & professional on Shanora.pk',
          skills: profileData?.skills || '',
          avatar_url: profileData?.avatar_url || '',
          resume_url: profileData?.resume_url || profileData?.resume_link || '',
          is_pro: !!profileData?.is_pro,
          is_ambassador: !!profileData?.is_ambassador,
          referral_badge: !!profileData?.referral_badge,
          is_monetized: !!profileData?.is_monetized,
          wallet_balance: Number(profileData?.wallet_balance || 0),
          open_to_work: profileData?.open_to_work !== false,
          profile_visible: profileData?.profile_visible !== false,
          last_seen_visible: profileData?.last_seen_visible !== false,
          email_alerts: profileData?.email_alerts !== false,
          app_language: profileData?.app_language || 'English',
          message_permission: profileData?.message_permission || 'Anyone'
        };

        setProfile(defaultProfile);
        setEditProfileForm({
          full_name: defaultProfile.full_name,
          headline: defaultProfile.headline,
          phone: defaultProfile.phone,
          city: defaultProfile.city,
          bio: defaultProfile.bio,
          skills: defaultProfile.skills,
          avatar_url: defaultProfile.avatar_url,
          resume_url: defaultProfile.resume_url
        });

        const { data: followsData } = await supabase
          .from('user_follows')
          .select('id, follower_email, following_email, created_at');

        const curMap = {};
        if (followsData) {
          const myFollowersRaw = followsData.filter(f => (f.following_email || '').toLowerCase() === myEmail);
          const myFollowingsRaw = followsData.filter(f => (f.follower_email || '').toLowerCase() === myEmail);

          const allNetworkEmails = Array.from(new Set([
            ...myFollowersRaw.map(f => (f.follower_email || '').toLowerCase()),
            ...myFollowingsRaw.map(f => (f.following_email || '').toLowerCase())
          ])).filter(Boolean);

          let profilesMap = {};
          if (allNetworkEmails.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('email, name, full_name, username, avatar_url, last_seen, is_pro')
              .in('email', allNetworkEmails);

            (profilesData || []).forEach(p => {
              if (p.email) {
                profilesMap[p.email.toLowerCase()] = {
                  displayName: p.name || p.full_name || p.username || p.email.split('@')[0],
                  avatarUrl: p.avatar_url,
                  username: p.username || p.email.split('@')[0],
                  last_seen: p.last_seen,
                  is_pro: !!p.is_pro
                };
              }
            });
          }

          const myFollowers = myFollowersRaw.map(f => {
            const email = (f.follower_email || '').toLowerCase();
            const prof = profilesMap[email] || {};
            return {
              ...f,
              user_email: email,
              email: email,
              displayName: prof.displayName || email.split('@')[0],
              avatarUrl: prof.avatarUrl || null,
              username: prof.username || email.split('@')[0],
              last_seen: prof.last_seen,
              is_pro: prof.is_pro
            };
          });

          const myFollowings = myFollowingsRaw.map(f => {
            const email = (f.following_email || '').toLowerCase();
            const prof = profilesMap[email] || {};
            return {
              ...f,
              user_email: email,
              email: email,
              displayName: prof.displayName || email.split('@')[0],
              avatarUrl: prof.avatarUrl || null,
              username: prof.username || email.split('@')[0],
              last_seen: prof.last_seen,
              is_pro: prof.is_pro
            };
          });

          setFollowersList(myFollowers);
          setFollowingList(myFollowings);

          myFollowings.forEach(f => {
            if (f.following_email) curMap[f.following_email.toLowerCase()] = true;
          });
          setFollowingMap(curMap);
        }

        supabase.from('user_posts')
          .select('id', { count: 'exact', head: true })
          .ilike('user_email', myEmail)
          .then(({ count }) => { if (count !== null) setMyPostsCount(count); });

        supabase.from('pro_requests')
          .select('*')
          .ilike('user_email', myEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => { if (data) setLatestProRequest(data); });

        supabase.from('pages')
          .select('*')
          .ilike('owner_email', myEmail)
          .order('created_at', { ascending: false })
          .then(({ data }) => { 
            if (data) {
              setMyPages(data);
              if (data.length > 0) {
                setAdFormData(prev => ({
                  ...prev,
                  selectedPageId: data[0].id,
                  selectedPageSlug: data[0].slug
                }));
              }
            }
          });

        supabase.from('user_referrals')
          .select('id', { count: 'exact', head: true })
          .ilike('referrer_email', myEmail)
          .then(({ count }) => {
            if (count !== null) setReferralCount(count);
          });

        supabase.from('profiles').update({ last_seen: new Date().toISOString() }).ilike('email', myEmail);
      } catch (err) {
        console.error('Portal init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initPortal();
  }, [router]);

  // AUTO-DETECT DIRECT CHAT TARGET FROM URL
  useEffect(() => {
    const chatTargetEmail = searchParams?.get('chatWith') || searchParams?.get('chat');
    if (chatTargetEmail && user?.email) {
      const cleanTarget = decodeURIComponent(chatTargetEmail).trim().toLowerCase();
      supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanTarget)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setActiveChatUser(data);
          } else {
            setActiveChatUser({
              email: cleanTarget,
              full_name: cleanTarget.split('@')[0],
              name: cleanTarget.split('@')[0],
              avatar_url: null,
              last_seen: null,
              is_pro: false
            });
          }
          setActiveTab('messages');
        });
    }
  }, [searchParams, user]);

  // Periodic heartbeat every 60s
  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).ilike('email', user.email.toLowerCase());
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Load Messenger Contacts
  useEffect(() => {
    if (!user?.email) return;
    const myEmail = user.email.toLowerCase();

    if (activeTab === 'messages') {
      supabase.from('profiles').select('email, full_name, name, headline, avatar_url, last_seen, is_pro').limit(100).then(({ data: profiles }) => {
        if (profiles) {
          const filtered = profiles.filter(p => (p.email || '').toLowerCase() !== myEmail);
          setAllUsersList(filtered);
        }
      });

      supabase.from('direct_messages')
        .select('sender_email, receiver_email, message, created_at')
        .or(`sender_email.ilike.${myEmail},receiver_email.ilike.${myEmail}`)
        .order('created_at', { ascending: true })
        .then(({ data: msgs }) => {
          if (msgs) {
            const lastMsgs = {};
            msgs.forEach(m => {
              const other = (m.sender_email.toLowerCase() === myEmail ? m.receiver_email : m.sender_email).toLowerCase();
              lastMsgs[other] = { text: m.message, time: new Date(m.created_at).getTime() };
            });
            setUserLastMessagesMap(lastMsgs);
          }
        });
    }

    if (activeTab === 'monetization') {
      supabase.from('monetization_requests').select('*').ilike('user_email', myEmail).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
        if (data) setMonetizationStatus(data.status);
      });
      supabase.from('payout_requests').select('*').ilike('user_email', myEmail).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setPayoutsHistory(data);
      });
    }

    if (activeTab === 'saved' && savedPostsList.length === 0) {
      supabase.from('saved_posts').select('*, user_posts(*)').ilike('user_email', myEmail).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setSavedPostsList(data);
      });
    }

    if (activeTab === 'network' && discoverUsers.length === 0) {
      supabase.from('profiles').select('*').limit(30).then(({ data }) => {
        if (data) {
          const filtered = data.filter(p => (p.email || '').toLowerCase() !== myEmail && !followingMap[(p.email || '').toLowerCase()]);
          setDiscoverUsers(filtered);
        }
      });
    }
  }, [activeTab, user, followingMap, savedPostsList.length, discoverUsers.length]);

  // Private 1-on-1 Chat Thread & Realtime listener (Facebook Messenger Style)
  useEffect(() => {
    if (!activeChatUser || !user) return;

    let channel;
    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();

    async function loadThread() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_email.ilike.${myEmail},receiver_email.ilike.${otherEmail}),and(sender_email.ilike.${otherEmail},receiver_email.ilike.${myEmail})`)
        .order('created_at', { ascending: true });

      setChatMessages(data || []);
      scrollToBottom();
    }

    loadThread();

    const channelId = `chat_${[myEmail, otherEmail].sort().join('_')}`;
    channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, payload => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new;
          const msgSender = (msg.sender_email || '').toLowerCase();
          const msgReceiver = (msg.receiver_email || '').toLowerCase();

          if (
            (msgSender === myEmail && msgReceiver === otherEmail) ||
            (msgSender === otherEmail && msgReceiver === myEmail)
          ) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToBottom();

            setUserLastMessagesMap(prev => ({
              ...prev,
              [otherEmail]: { text: msg.message, time: new Date(msg.created_at).getTime() }
            }));
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new;
          setChatMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old;
          setChatMessages(prev => prev.filter(m => m.id !== deleted.id));
        }
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeChatUser, user]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Handle Attachment Selection
  function handleSelectAttachment(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be under 20MB.');
      return;
    }

    setSelectedAttachment(file);
    setAttachmentType(type);

    if (type === 'image') {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview(file.name);
    }
  }

  // Mobile Long-Press for Reactions (FB Floating Bar)
  function handleTouchStart(messageId) {
    pressTimerRef.current = setTimeout(() => {
      setActiveReactionMsgId(prev => (prev === messageId ? null : messageId));
    }, 450);
  }

  function handleTouchEnd() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  // Handle Send Message (with Text, Photo, Document, or Thumbs Up)
  async function handleSendMessage(e, defaultText = null) {
    if (e && e.preventDefault) e.preventDefault();
    const sentText = defaultText !== null ? defaultText : newMessageText.trim();
    if ((!sentText && !selectedAttachment) || !activeChatUser || !user || sendingMsg) return;

    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();

    setSendingMsg(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (selectedAttachment) {
        const fileExt = selectedAttachment.name.split('.').pop();
        const filePath = `chat/${user.id}-${Date.now()}.${fileExt}`;

        let { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedAttachment);

        if (uploadError) {
          const { error: fallbackError } = await supabase.storage
            .from('public')
            .upload(filePath, selectedAttachment);
          if (fallbackError) throw uploadError;
          const { data: pubData } = supabase.storage.from('public').getPublicUrl(filePath);
          attachmentUrl = pubData.publicUrl;
        } else {
          const { data: pubData } = supabase.storage.from('documents').getPublicUrl(filePath);
          attachmentUrl = pubData.publicUrl;
        }

        attachmentName = selectedAttachment.name;
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          sender_email: myEmail,
          receiver_email: otherEmail,
          message: sentText || (attachmentType === 'image' ? '📷 Photo' : `📎 ${attachmentName}`),
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
          is_edited: false,
          is_deleted: false,
          reactions: {}
        }])
        .select()
        .single();

      if (error) throw error;
      setChatMessages(prev => [...prev, data]);
      setNewMessageText('');
      setSelectedAttachment(null);
      setAttachmentPreview(null);
      setAttachmentType(null);
      scrollToBottom();

      setUserLastMessagesMap(prev => ({
        ...prev,
        [otherEmail]: { text: sentText || (attachmentType === 'image' ? '📷 Photo' : '📎 Document'), time: Date.now() }
      }));
    } catch (err) {
      alert('Message send failed: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  }

  // Handle Save Edited Message
  async function handleSaveEditedMessage(msgId) {
    if (!editText.trim()) return;
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({
          message: editText.trim(),
          is_edited: true
        })
        .eq('id', msgId);

      if (error) throw error;

      setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: editText.trim(), is_edited: true } : m));
      setEditingMessageId(null);
      setEditText('');
    } catch (err) {
      alert('Edit failed: ' + err.message);
    }
  }

  // Handle Delete Message for Everyone
  async function handleDeleteMessage(msgId) {
    if (!confirm('Delete this message for everyone?')) return;
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({
          message: '🚫 This message was deleted',
          attachment_url: null,
          is_deleted: true
        })
        .eq('id', msgId);

      if (error) throw error;

      setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: '🚫 This message was deleted', attachment_url: null, is_deleted: true } : m));
      setActiveMenuMessageId(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Handle Emoji Reaction (Facebook Style: ❤️ 👍 😂 😮 😢 🔥)
  async function handleReactToMessage(msgId, emoji) {
    if (!user) return;
    const myEmail = user.email.toLowerCase();
    const targetMsg = chatMessages.find(m => m.id === msgId);
    if (!targetMsg) return;

    const currentReactions = targetMsg.reactions || {};
    const userList = currentReactions[emoji] || [];

    let updatedList;
    if (userList.includes(myEmail)) {
      updatedList = userList.filter(e => e !== myEmail);
    } else {
      updatedList = [...userList, myEmail];
    }

    const nextReactions = { ...currentReactions, [emoji]: updatedList };

    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: nextReactions } : m));
    setActiveMenuMessageId(null);
    setActiveReactionMsgId(null);

    try {
      await supabase
        .from('direct_messages')
        .update({ reactions: nextReactions })
        .eq('id', msgId);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  }

  function isUserOnline(lastSeen) {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff >= 0 && diff < 3 * 60 * 1000;
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Resume file size must be less than 5MB.');
      return;
    }

    setUploadingResume(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `resumes/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        const { error: fallbackError } = await supabase.storage
          .from('public')
          .upload(filePath, file, { upsert: true });
        if (fallbackError) throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const resumeUrl = publicUrlData.publicUrl;
      setEditProfileForm(prev => ({ ...prev, resume_url: resumeUrl }));
      alert('Resume successfully uploaded! Click Save Profile to apply changes.');
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Profile picture size must be less than 3MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        const { error: fallbackError } = await supabase.storage
          .from('public')
          .upload(filePath, file, { upsert: true });
        if (fallbackError) throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;
      setEditProfileForm(prev => ({ ...prev, avatar_url: avatarUrl }));
      alert('Profile photo selected! Please save profile to update.');
    } catch (err) {
      alert('Avatar upload error: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;

    setUpdatingProfile(true);
    try {
      const myEmail = user.email.toLowerCase();
      const updates = {
        email: myEmail,
        full_name: sanitizeInput(editProfileForm.full_name?.trim()),
        headline: sanitizeInput(editProfileForm.headline?.trim()),
        phone: sanitizeInput(editProfileForm.phone?.trim()),
        city: sanitizeInput(editProfileForm.city?.trim()),
        bio: sanitizeInput(editProfileForm.bio?.trim()),
        skills: sanitizeInput(editProfileForm.skills?.trim()),
        avatar_url: editProfileForm.avatar_url,
        resume_url: editProfileForm.resume_url,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'email' });

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      setShowEditProfileModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Profile update error: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleProActivation(e) {
    e.preventDefault();
    if (!trxId.trim()) {
      alert('Please enter a valid Transaction ID (TID).');
      return;
    }

    setSubmittingPro(true);
    try {
      const { data: newReq, error } = await supabase
        .from('pro_requests')
        .insert([{
          user_email: user.email.toLowerCase(),
          transaction_id: trxId.trim(),
          payment_method: paymentMethod,
          amount: 499,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setLatestProRequest(newReq);
      setTrxId('');
      alert('Your request has been submitted! Blue Tick will activate upon administrative verification.');
    } catch (err) {
      alert('Pro request error: ' + err.message);
    } finally {
      setSubmittingPro(false);
    }
  }

  async function handleToggleFollow(targetEmail) {
    if (!user || !targetEmail) return;

    const myEmail = (user.email || '').trim().toLowerCase();
    const cleanTarget = targetEmail.trim().toLowerCase();
    const isFollowing = !!followingMap[cleanTarget];

    setActionLoading(prev => ({ ...prev, [cleanTarget]: true }));
    setFollowingMap(prev => ({ ...prev, [cleanTarget]: !isFollowing }));

    if (isFollowing) {
      setFollowingList(prev => prev.filter(item => (item.following_email || '').toLowerCase() !== cleanTarget));
    } else {
      setFollowingList(prev => [...prev, { id: Date.now(), following_email: cleanTarget, follower_email: myEmail, created_at: new Date().toISOString() }]);
      setDiscoverUsers(prev => prev.filter(item => (item.email || '').toLowerCase() !== cleanTarget));
    }

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .ilike('follower_email', myEmail)
          .ilike('following_email', cleanTarget);
      } else {
        await supabase
          .from('user_follows')
          .insert([{ follower_email: myEmail, following_email: cleanTarget }]);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      setFollowingMap(prev => ({ ...prev, [cleanTarget]: isFollowing }));
    } finally {
      setActionLoading(prev => ({ ...prev, [cleanTarget]: false }));
    }
  }

  async function executeLogout() {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    router.push('/auth');
  }

  async function handleApplyMonetization() {
    if (followersList.length < 5000 || myPostsCount < 30) {
      alert('Monetization criteria not met (5,000 Followers & 30 Posts required).');
      return;
    }

    setSubmittingMonetization(true);
    try {
      const { error } = await supabase
        .from('monetization_requests')
        .insert([{
          user_email: user.email.toLowerCase(),
          followers_count: followersList.length,
          posts_count: myPostsCount,
          status: 'pending'
        }]);

      if (error) throw error;
      setMonetizationStatus('pending');
      alert('Monetization application submitted! Revenue sharing will activate upon admin review.');
    } catch (err) {
      alert('Monetization apply error: ' + err.message);
    } finally {
      setSubmittingMonetization(false);
    }
  }

  async function handleRequestPayout(e) {
    e.preventDefault();
    const withdrawAmount = Number(payoutForm.amount);

    if (!withdrawAmount || withdrawAmount < 1000) {
      alert('Minimum withdrawal amount is Rs. 1,000.');
      return;
    }

    if (withdrawAmount > profile.wallet_balance) {
      alert('Insufficient wallet balance in your account.');
      return;
    }

    setSubmittingPayout(true);
    try {
      const { data, error } = await supabase.rpc('request_wallet_payout', {
        p_user_email: user.email.toLowerCase(),
        p_amount: withdrawAmount,
        p_payment_method: payoutForm.payment_method,
        p_account_number: payoutForm.account_number,
        p_account_title: payoutForm.account_title
      });

      if (error) throw error;

      if (!data?.success) {
        alert(data?.message || 'Payout request failed.');
        return;
      }

      setProfile(prev => ({ ...prev, wallet_balance: data.new_balance }));

      const newLog = {
        id: data.payout_id,
        amount: withdrawAmount,
        type: 'withdrawal',
        payment_method: payoutForm.payment_method,
        account_number: payoutForm.account_number,
        account_title: payoutForm.account_title,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setPayoutsHistory(prev => [newLog, ...prev]);

      setPayoutForm({ amount: '', payment_method: 'EasyPaisa', account_number: '', account_title: '' });
      alert('Withdrawal request submitted successfully! Funds will be dispatched within 24 hours.');
    } catch (err) {
      alert('Payout processing error: ' + err.message);
    } finally {
      setSubmittingPayout(false);
    }
  }

  async function handleRemoveSavedPost(savedId) {
    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', savedId);

      if (error) throw error;
      setSavedPostsList(prev => prev.filter(p => p.id !== savedId));
    } catch (err) {
      alert('Error removing saved post: ' + err.message);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must contain at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      alert('Password updated successfully!');
    } catch (err) {
      alert('Password update error: ' + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleToggleSetting(key, currentValue) {
    const nextVal = !currentValue;
    setProfile(prev => ({ ...prev, [key]: nextVal }));

    try {
      await supabase
        .from('profiles')
        .update({ [key]: nextVal })
        .ilike('email', user.email.toLowerCase());
    } catch (err) {
      console.error('Settings update error:', err);
    }
  }

  async function handleSelectSetting(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }));
    try {
      await supabase
        .from('profiles')
        .update({ [key]: value })
        .ilike('email', user.email.toLowerCase());
    } catch (err) {
      console.error('Settings update error:', err);
    }
  }

  // Handle Milestone Claiming
  async function handleClaimMilestone(milestone) {
    if (!user) return;
    setClaimingMilestone(milestone.minFriends);

    try {
      let updatePayload = {};
      if (milestone.minFriends === 5) {
        updatePayload = { referral_badge: true };
      } else if (milestone.minFriends === 10 || milestone.minFriends === 25) {
        updatePayload = { is_pro: true };
      } else if (milestone.minFriends === 50 || milestone.minFriends === 100) {
        updatePayload = { is_pro: true, is_ambassador: true };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .ilike('email', user.email.toLowerCase());

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updatePayload }));
      alert(`🎉 Congratulations! You have successfully claimed: ${milestone.reward}`);
    } catch (err) {
      alert('Milestone claim failed: ' + err.message);
    } finally {
      setClaimingMilestone(null);
    }
  }

  // Handle Create Advertisement
  async function handleCreateAd(e) {
    e.preventDefault();
    if (!adFormData.selectedPageId) {
      alert('Please select an active Page to run this campaign.');
      setAdStep(1);
      return;
    }
    if (!adFormData.headline.trim() || !adFormData.adText.trim()) {
      alert('Please provide campaign headline and caption text.');
      setAdStep(2);
      return;
    }
    if (!adFormData.trxId.trim()) {
      alert('Please enter your Transaction ID (TID) to proceed.');
      return;
    }

    setAdSubmitting(true);
    try {
      const selectedPage = myPages.find(p => p.id === adFormData.selectedPageId);
      const { error } = await supabase.from('advertisements').insert([{
        advertiser_email: (user?.email || '').toLowerCase(),
        page_id: adFormData.selectedPageId,
        business_name: sanitizeInput(selectedPage?.name || profile.full_name),
        headline: sanitizeInput(adFormData.headline),
        ad_text: sanitizeInput(adFormData.adText),
        target_url: adFormData.targetUrl,
        target_city: adFormData.targetCity,
        target_objective: adFormData.targetObjective,
        budget: Number(adFormData.budget),
        duration_days: Number(adFormData.durationDays),
        payment_method: adFormData.paymentMethod,
        transaction_id: adFormData.trxId.trim(),
        status: 'pending_approval'
      }]);

      if (error) {
        console.warn('Ad table notice:', error.message);
      }

      setAdSuccessMessage('Campaign submitted successfully! It is now under Admin Approval.');
      setAdStep(6);
    } catch (err) {
      alert('Submission error: ' + err.message);
    } finally {
      setAdSubmitting(false);
    }
  }

  // Messenger User Sorting & Filtering
  const sortedMessengerUsers = [...allUsersList].sort((a, b) => {
    const timeA = userLastMessagesMap[(a.email || '').toLowerCase()]?.time || 0;
    const timeB = userLastMessagesMap[(b.email || '').toLowerCase()]?.time || 0;
    return timeB - timeA;
  });

  const filteredMessengerUsers = sortedMessengerUsers.filter(u => {
    const q = messageSearchQuery.toLowerCase();
    const name = (u.full_name || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const completionFields = [
    Boolean(profile.full_name),
    Boolean(profile.phone),
    Boolean(profile.city),
    Boolean(profile.bio),
    Boolean(profile.resume_url),
    Boolean(profile.skills)
  ];
  const profileCompletionPercent = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  const allMenuItems = [
    { id: 'pro', label: 'Shanora PRO 👑', icon: '👑', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' },
    { id: 'invite_friends', label: 'Invite Friends 👥', icon: '👥', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.35)' },
    { id: 'advertiser_portal', label: 'Ads Manager 📢', icon: '📢', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
    { id: 'profile', label: 'My Profile', icon: '👤', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
    { id: 'messages', label: 'Messages', icon: '💬', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)' },
    { id: 'pages', label: `Pages (${myPages.length})`, icon: '🏢', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
    { id: 'resume', label: 'My Resume 📄', icon: '📄', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    { id: 'monetization', label: 'Monetization 💰', icon: '💰', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
    { id: 'saved', label: `Saved Posts (${savedPostsList.length})`, icon: '🔖', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
    { id: 'settings', label: 'Settings ⚙️', icon: '⚙️', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)' },
    { id: 'security', label: 'Account Security 🔒', icon: '🔒', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' }
  ];

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://shanora-pk.vercel.app'}/auth?ref=${encodeURIComponent(user?.email?.split('@')[0] || 'member')}`;

  function handleCopyInviteLink() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handleShare(platform) {
    const text = encodeURIComponent(`Join SHANORA.PK — Connect with verified professionals, creators, and discover high-impact career opportunities in Pakistan!\n\nSign up using my official invite: `);
    const link = encodeURIComponent(referralLink);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}${link}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
    } else if (platform === 'messenger') {
      window.open(`fb-messenger://share/?link=${link}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('Join me on SHANORA.PK')}&body=${text}${link}`, '_blank');
    } else if (platform === 'sms') {
      window.open(`sms:?body=${text}${link}`, '_blank');
    } else if (platform === 'native') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({
          title: 'SHANORA.PK',
          text: 'Connect with me on SHANORA — Build Your Professional Future!',
          url: referralLink
        }).catch(() => {});
      } else {
        handleCopyInviteLink();
      }
    }
  }

  const referralMilestones = [
    { minFriends: 5, goal: '5 Genuine Friends', reward: 'Referral Badge 🎖️', color: '#0284c7' },
    { minFriends: 10, goal: '10 Genuine Friends', reward: '1 Month SHANORA PRO 👑', color: '#eab308' },
    { minFriends: 25, goal: '25 Genuine Friends', reward: '3 Months SHANORA PRO 🚀', color: '#a855f7' },
    { minFriends: 50, goal: '50 Genuine Friends', reward: 'Special Ambassador Badge 💎', color: '#ec4899' },
    { minFriends: 100, goal: '100 Genuine Friends', reward: 'Official SHANORA Ambassador Status 🌟', color: '#22c55e' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading ...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => {
              if (activeChatUser) {
                setActiveChatUser(null);
              } else if (activeTab !== 'menu') {
                navigateToTab('menu');
              } else {
                router.push('/feed');
              }
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#070b14',
              border: '1px solid #1e293b',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: activeTab !== 'menu' || activeChatUser ? '1.1rem' : '1rem',
              fontWeight: 'bold',
              padding: 0
            }}
          >
            {activeTab !== 'menu' || activeChatUser ? '←' : '✕'}
          </button>

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
              <span style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '900', lineHeight: 1 }}>S</span>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              SHANORA<span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#38bdf8', verticalAlign: 'super', marginLeft: '2px', letterSpacing: '0.5px' }}>.PK</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem 90px 0.9rem' }}>
        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <div>
            <div 
              onClick={() => navigateToTab('profile')}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '1.2rem',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                fontWeight: 'bold',
                color: '#fff',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile.full_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{profile.full_name}</span>
                  {profile.is_pro && <ProVerifiedBadge size={17} />}
                  {profile.is_ambassador && <span title="Official Ambassador" style={{ color: '#facc15', fontSize: '0.9rem' }}>🌟</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{profile.headline || 'View your profile'}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shortcuts & Services
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
              gap: '0.55rem', 
              marginBottom: '1.2rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {allMenuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'security') {
                      router.push('/settings/security');
                    } else if (item.id === 'invite_friends') {
                      setShowInviteModal(true);
                    } else if (item.id === 'advertiser_portal') {
                      setShowAdsModal(true);
                    } else {
                      navigateToTab(item.id);
                    }
                  }}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    minWidth: 0,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: item.bg,
                    border: `1px solid ${item.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      color: item.id === 'pro' || item.id === 'resume' ? '#facc15' : item.id === 'invite_friends' ? '#4ade80' : item.id === 'advertiser_portal' ? '#60a5fa' : '#f8fafc', 
                      fontSize: '0.8rem', 
                      fontWeight: '800', 
                      whiteSpace: 'nowrap', 
                      textOverflow: 'ellipsis', 
                      overflow: 'hidden' 
                    }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* TAB 1: SHANORA PRO */}
        {activeTab === 'pro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#facc15' }}>👑 Shanora PRO</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#facc15', margin: '0 0 0.3rem 0' }}>Shanora PRO</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Unlock the prestigious verified badge and premium career features.</p>

              {profile.is_pro ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #22c55e', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <span style={{ backgroundColor: '#22c55e', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>✓</span>
                    <strong style={{ color: '#4ade80', fontSize: '1rem' }}>Your Shanora PRO Membership is ACTIVE!</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    <div>✓ <strong>Executive Verified Badge:</strong> Cyan-Blue starburst badge is active across your profile and posts.</div>
                    <div>✓ <strong>ATS Resume Builder:</strong> Unlimited professional CV generation & PDF download unlocked.</div>
                    <div>✓ <strong>Application Boost:</strong> Featured placement on employer applicant portals.</div>
                    <div>✓ <strong>Feed Reach:</strong> 5x higher reach on your published articles and updates.</div>
                  </div>
                </div>
              ) : latestProRequest?.status === 'pending' ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #facc15', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <strong style={{ color: '#facc15', fontSize: '0.95rem' }}>Verification in Progress</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    Your payment request (TID: <strong style={{ color: '#fff' }}>{latestProRequest.transaction_id}</strong>) is currently being reviewed. The verified badge will be enabled immediately after review.
                  </p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>Exclusive PRO Perks:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
                    <div>✓ <strong>Official Verified Badge:</strong> Stand out with a glowing cyan-blue executive badge.</div>
                    <div>✓ <strong>ATS Resume Builder:</strong> Build & Export ATS-Friendly CV in 1-Click.</div>
                    <div>✓ <strong>Priority Job Application:</strong> Featured at the top for hiring managers.</div>
                    <div>✓ <strong>Direct Messenger:</strong> Connect with verified creators and businesses.</div>
                    <div>✓ <strong>Profile Boost:</strong> Enhanced organic reach on all publications.</div>
                  </div>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Monthly Subscription:</span>
                      <span style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>Rs. 499 / mo</span>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                      <strong>Payment Procedure:</strong><br />
                      1. Transfer <strong>Rs. 499</strong> via EasyPaisa / JazzCash to: <code>03033639664</code><br />
                      2. Account Title: <code>Amanullah</code><br />
                      3. Enter Transaction ID (TID) below and click submit.
                    </div>

                    <form onSubmit={handleProActivation} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                        >
                          <option value="EasyPaisa">EasyPaisa</option>
                          <option value="JazzCash">JazzCash</option>
                          <option value="Raast">Raast / Bank</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Enter Transaction ID (TID)"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingPro}
                        style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', cursor: submittingPro ? 'not-allowed' : 'pointer' }}
                      >
                        {submittingPro ? 'Submitting Request...' : 'Upgrade Now & Submit TID 👑'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>📊 Creator Dashboard</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                    Creator Analytics
                  </span>
                  <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0.45rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{profile.full_name}</span>
                    {profile.is_pro && <ProVerifiedBadge size={19} />}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                    Track your audience engagement, profile performance, and network growth.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '8px',
                    backgroundColor: profile.is_pro ? 'rgba(250, 204, 21, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: profile.is_pro ? '#facc15' : '#94a3b8',
                    border: profile.is_pro ? '1px solid rgba(250, 204, 21, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)'
                  }}>
                    {profile.is_pro ? 'PRO MEMBER 👑' : 'STANDARD'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.9rem', marginTop: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Profile Strength</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: profileCompletionPercent === 100 ? '#4ade80' : '#38bdf8' }}>
                    {profileCompletionPercent}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${profileCompletionPercent}%`, height: '100%', backgroundColor: profileCompletionPercent === 100 ? '#22c55e' : '#0284c7', transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Followers 👥</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8', marginTop: '0.2rem' }}>{followersList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Following 🤝</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#22c55e', marginTop: '0.2rem' }}>{followingList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Feed Posts 📝</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#facc15', marginTop: '0.2rem' }}>{myPostsCount}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Reach Boost 🚀</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: profile.is_pro ? '#a855f7' : '#94a3b8', marginTop: '0.2rem' }}>
                  {profile.is_pro ? '5x' : '1x'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👤 My Profile</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1.8rem',
                    color: '#fff',
                    border: '2px solid #38bdf8',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (profile.full_name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{profile.full_name}</span>
                      {profile.is_pro && <ProVerifiedBadge size={20} />}
                      {profile.is_ambassador && <span title="Shanora Ambassador" style={{ color: '#facc15', fontSize: '1rem' }}>🌟</span>}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '600', marginTop: '0.15rem' }}>
                      {profile.headline || 'Member on Shanora.pk'}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{profile.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit Profile
                </button>
              </div>

              {profile.bio && (
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '10px', padding: '0.8rem', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '1rem' }}>
                  {profile.bio}
                </div>
              )}

              {profile.skills && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Skills & Expertise
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {profile.skills.split(',').map((s, idx) => (
                      <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                <div>📞 <strong style={{ color: '#fff' }}>WhatsApp / Phone:</strong> {profile.phone || 'Not provided'}</div>
                <div>📍 <strong style={{ color: '#fff' }}>City / Location:</strong> {profile.city || 'Pakistan'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📄 <strong style={{ color: '#fff' }}>Linked CV / Resume:</strong>
                  {profile.resume_url ? (
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      View Linked CV 🔗
                    </a>
                  ) : (
                    <span style={{ color: '#64748b' }}>No CV attached yet</span>
                  )}
                </div>
                <div>👑 <strong style={{ color: '#fff' }}>Account Status:</strong> {profile.is_pro ? <span style={{ color: '#facc15', fontWeight: '800' }}>Shanora PRO (Verified ✓)</span> : 'Standard Member'}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MESSENGER (FACEBOOK MESSENGER STYLE WITH FLOATING REACTIONS, EDIT, DELETE & ATTACHMENTS) */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>Shanora Messenger</span>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (activeChatUser) {
                    setActiveChatUser(null);
                  } else {
                    navigateToTab('menu');
                  }
                }} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            {activeChatUser ? (
              /* ACTIVE 1-ON-1 CHAT ROOM */
              <div style={{ backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '72vh', minHeight: '520px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                
                {/* Chat Header */}
                <div style={{ backgroundColor: '#0f172a', padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveChatUser(null)}
                      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '50%', color: '#0084ff', fontSize: '1rem', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ←
                    </button>
                    
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0084ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', overflow: 'hidden' }}>
                        {activeChatUser.avatar_url || activeChatUser.avatarUrl ? (
                          <img src={activeChatUser.avatar_url || activeChatUser.avatarUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (activeChatUser.full_name || activeChatUser.name || activeChatUser.displayName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      {isUserOnline(activeChatUser.last_seen) ? (
                        <div title="Active Now" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a', boxShadow: '0 0 6px #22c55e' }} />
                      ) : (
                        <div title="Offline" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b', border: '2px solid #0f172a' }} />
                      )}
                    </div>

                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>{activeChatUser.full_name || activeChatUser.name || activeChatUser.displayName || activeChatUser.email?.split('@')[0]}</span>
                        {activeChatUser.is_pro && <ProVerifiedBadge size={16} />}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isUserOnline(activeChatUser.last_seen) ? '#4ade80' : '#64748b', fontWeight: '600' }}>
                        {isUserOnline(activeChatUser.last_seen) ? 'Active now' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <Link href={`/view-profile?email=${encodeURIComponent(activeChatUser.email || activeChatUser.user_email || '')}`} style={{ color: '#0084ff', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '700', backgroundColor: 'rgba(0, 132, 255, 0.12)', border: '1px solid rgba(0, 132, 255, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
                    Profile ↗
                  </Link>
                </div>

                {/* Message Bubble Feed */}
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.82rem' }}>
                      Say hello to {activeChatUser.full_name || 'them'}! Start your direct 1-on-1 private conversation. 👋
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = (msg.sender_email || '').toLowerCase() === (user?.email || '').toLowerCase();
                      const isEditing = editingMessageId === msg.id;
                      const hasReactions = msg.reactions && Object.keys(msg.reactions).some(k => (msg.reactions[k] || []).length > 0);
                      const isMenuOpen = activeMenuMessageId === msg.id;
                      const isReactionOpen = activeReactionMsgId === msg.id;

                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                          
                          {/* FACEBOOK FLOATING EMOJI BAR (Press & Hold or Click trigger) */}
                          {isReactionOpen && !msg.is_deleted && (
                            <div 
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                [isMe ? 'right' : 'left']: '6px',
                                marginBottom: '6px',
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '30px',
                                padding: '4px 10px',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                                zIndex: 60
                              }}
                            >
                              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReactToMessage(msg.id, emoji);
                                  }}
                                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', maxWidth: '82%', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                            {/* Message Bubble */}
                            <div 
                              onTouchStart={() => handleTouchStart(msg.id)}
                              onTouchEnd={handleTouchEnd}
                              onTouchCancel={handleTouchEnd}
                              onDoubleClick={() => setActiveReactionMsgId(prev => (prev === msg.id ? null : msg.id))}
                              style={{
                                backgroundColor: msg.is_deleted ? 'rgba(30, 41, 59, 0.5)' : isMe ? '#0084ff' : '#1e293b',
                                color: msg.is_deleted ? '#94a3b8' : '#fff',
                                fontStyle: msg.is_deleted ? 'italic' : 'normal',
                                padding: '0.7rem 1rem',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                fontSize: '0.85rem',
                                lineHeight: '1.45',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                border: msg.is_deleted ? '1px dashed #475569' : 'none',
                                userSelect: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              {/* Inline Editing Form */}
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '0.4rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                    autoFocus
                                  />
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setEditingMessageId(null)} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="button" onClick={() => handleSaveEditedMessage(msg.id)} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Attached Image */}
                                  {msg.attachment_url && msg.attachment_type === 'image' && (
                                    <div 
                                      onClick={() => setPreviewModalImg(msg.attachment_url)} 
                                      style={{ marginBottom: '0.4rem', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                                    >
                                      <img src={msg.attachment_url} alt="Attached" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                  )}

                                  {/* Attached Document */}
                                  {msg.attachment_url && msg.attachment_type === 'document' && (
                                    <a 
                                      href={msg.attachment_url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      download 
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.75rem', borderRadius: '8px', textDecoration: 'none', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 'bold', marginBottom: '0.4rem' }}
                                    >
                                      <span>📄</span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachment_name || 'Download Document'}</span>
                                      <span>⬇️</span>
                                    </a>
                                  )}

                                  {/* Text Message */}
                                  <div>{msg.message}</div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.3rem' }}>
                                    {msg.is_edited && !msg.is_deleted && (
                                      <span style={{ fontSize: '0.6rem', color: isMe ? '#e0f2fe' : '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                                    )}
                                    <span style={{ fontSize: '0.62rem', color: isMe ? '#e0f2fe' : '#94a3b8' }}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Message Context Options Trigger */}
                            {!msg.is_deleted && (
                              <button
                                type="button"
                                onClick={() => setActiveMenuMessageId(isMenuOpen ? null : msg.id)}
                                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                                title="React or Options"
                              >
                                •••
                              </button>
                            )}
                          </div>

                          {/* Action Popover Menu (Edit, Delete, React) */}
                          {isMenuOpen && (
                            <div style={{
                              position: 'absolute',
                              top: '-38px',
                              [isMe ? 'right' : 'left']: '10px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '24px',
                              padding: '0.25rem 0.6rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                              zIndex: 55
                            }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReactionMsgId(msg.id);
                                  setActiveMenuMessageId(null);
                                }}
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                              >
                                React 😄
                              </button>

                              {isMe && !msg.is_deleted && (
                                <>
                                  <span style={{ color: '#334155', fontSize: '0.8rem' }}>|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessageId(msg.id);
                                      setEditText(msg.message);
                                      setActiveMenuMessageId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                                    title="Edit"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                                    title="Delete for Everyone"
                                  >
                                    🗑️ Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Display Reactions pill on Bubble Corner */}
                          {hasReactions && !msg.is_deleted && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '-6px',
                              [isMe ? 'marginRight' : 'marginLeft']: '8px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '12px',
                              padding: '1px 6px',
                              fontSize: '0.68rem',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              zIndex: 1
                            }}>
                              {Object.entries(msg.reactions).map(([emoji, users]) => {
                                if (!users || users.length === 0) return null;
                                return (
                                  <span key={emoji} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <span>{emoji}</span>
                                    {users.length > 1 && <span style={{ color: '#94a3b8', fontSize: '0.6rem' }}>{users.length}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachment Selection Preview Bar */}
                {selectedAttachment && (
                  <div style={{ backgroundColor: '#131e33', padding: '0.5rem 0.9rem', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {attachmentType === 'image' ? (
                        <img src={attachmentPreview} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.3rem' }}>📄</span>
                      )}
                      <span style={{ fontSize: '0.76rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedAttachment.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAttachment(null);
                        setAttachmentPreview(null);
                        setAttachmentType(null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', padding: '0 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Chat Input Bar (Facebook Messenger Style) */}
                <form onSubmit={handleSendMessage} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  
                  {/* Hidden Inputs */}
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleSelectAttachment(e, 'image')} style={{ display: 'none' }} />
                  <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.zip,.txt" onChange={(e) => handleSelectAttachment(e, 'document')} style={{ display: 'none' }} />

                  {/* Photo File Input */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0 2px' }}
                    title="Send Photo"
                  >
                    🖼️
                  </button>

                  {/* Document File Input */}
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0 2px' }}
                    title="Send Document"
                  >
                    📎
                  </button>

                  <input
                    type="text"
                    placeholder={selectedAttachment ? 'Add a caption...' : 'Type a message...'}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.84rem', outline: 'none' }}
                  />

                  {/* Send Arrow or Quick Facebook Thumb 👍 */}
                  {newMessageText.trim() || selectedAttachment ? (
                    <button
                      type="submit"
                      disabled={sendingMsg}
                      style={{
                        backgroundColor: '#0084ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {sendingMsg ? '⏳' : '➤'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(null, '👍')}
                      style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                      title="Send Thumbs Up"
                    >
                      👍
                    </button>
                  )}
                </form>
              </div>
            ) : (
              /* CONVERSATION LIST & SEARCH */
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search conversations by name..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredMessengerUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                      No active conversations found. Tap "Message" on any user profile to chat!
                    </div>
                  ) : (
                    filteredMessengerUsers.map(chatTarget => {
                      const targetEmail = (chatTarget.email || '').toLowerCase();
                      const online = isUserOnline(chatTarget.last_seen);
                      const displayName = chatTarget.full_name || chatTarget.name || targetEmail.split('@')[0];
                      const lastMsg = userLastMessagesMap[targetEmail];

                      return (
                        <div
                          key={chatTarget.id || targetEmail}
                          onClick={() => {
                            setActiveChatUser(chatTarget);
                            if (typeof window !== 'undefined') {
                              window.history.pushState({ tab: 'messages', chatUserEmail: targetEmail }, '', `/profile?tab=messages&chatWith=${encodeURIComponent(targetEmail)}`);
                            }
                          }}
                          style={{
                            backgroundColor: '#131b2e',
                            border: '1px solid #1e293b',
                            borderRadius: '12px',
                            padding: '0.75rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', overflow: 'hidden' }}>
                                {chatTarget.avatar_url ? (
                                  <img src={chatTarget.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  displayName.charAt(0).toUpperCase()
                                )}
                              </div>
                              {online ? (
                                <div title="Online" style={{ position: 'absolute', bottom: '1px', right: '1px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #131b2e', boxShadow: '0 0 5px #22c55e' }} />
                              ) : (
                                <div title="Offline" style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b', border: '2px solid #131b2e' }} />
                              )}
                            </div>

                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                <span>{displayName}</span>
                                {chatTarget.is_pro && <ProVerifiedBadge size={16} />}
                              </div>
                              <div style={{ color: lastMsg ? '#cbd5e1' : '#64748b', fontSize: '0.74rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '0.15rem' }}>
                                {lastMsg ? lastMsg.text : (chatTarget.headline || 'Tap to start conversation')}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', color: online ? '#4ade80' : '#64748b', fontWeight: '700' }}>
                              {online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PAGES */}
        {activeTab === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#f97316' }}>🏢 Your Pages ({myPages.length})</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
              <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
            </div>

            {myPages.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                You have not created any organization or public pages yet.
              </div>
            ) : (
              myPages.map(page => (
                <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem' }}>{page.name}</Link>
                  <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}>View Page</Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: ATS RESUME BUILDER (SHANORA PRO) */}
        {activeTab === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#facc15' }}>📄 ATS Resume Studio</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            {!profile.is_pro ? (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: '16px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '3.2rem', marginBottom: '0.6rem' }}>📄</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#facc15', fontSize: '1.3rem', fontWeight: '800' }}>
                  Shanora PRO Exclusive Feature
                </h3>
                <p style={{ margin: '0 auto 1.5rem auto', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '440px' }}>
                  ATS-Friendly Resume Builder and Instant Official PDF Export are exclusive privileges for <strong>Shanora PRO</strong> members.
                </p>
                <button
                  type="button"
                  onClick={() => navigateToTab('pro')}
                  style={{
                    backgroundColor: '#eab308',
                    color: '#000',
                    border: 'none',
                    padding: '0.8rem 1.8rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(234, 179, 8, 0.35)'
                  }}
                >
                  Unlock with Shanora PRO 👑 (Rs. 499)
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '14px',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.8rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>ATS Resume Studio</span>
                      <ProVerifiedBadge size={18} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Standard Executive Layout with Direct PDF Printing
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        padding: '0.55rem 1.2rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <span>🖨️</span>
                      <span>Download Official PDF</span>
                    </button>
                  </div>
                </div>

                <div
                  id="printable-ats-cv"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '3rem 2.8rem',
                    borderRadius: '12px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.45)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ borderBottom: '2.5px solid #0f172a', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h1 style={{
                          margin: '0 0 0.3rem 0',
                          fontSize: '2rem',
                          fontWeight: '900',
                          color: '#0f172a',
                          letterSpacing: '-0.5px',
                          textTransform: 'uppercase'
                        }}>
                          {profile.full_name || 'Your Full Name'}
                        </h1>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0284c7' }}>
                          {profile.headline || 'Senior Professional & Specialist'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
                        <div>{profile.email}</div>
                        <div>{profile.phone || '+92 300 0000000'}</div>
                        <div>{profile.city || 'Pakistan'}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.4rem' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.3rem',
                      marginBottom: '0.6rem'
                    }}>
                      Executive Summary
                    </div>
                    <textarea
                      rows={3}
                      value={resumeData.summary !== undefined && resumeData.summary !== '' ? resumeData.summary : (profile.bio || '')}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief overview of your professional achievements and qualifications..."
                      style={{
                        width: '100%',
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        fontSize: '0.85rem',
                        color: '#334155',
                        lineHeight: '1.5',
                        outline: 'none',
                        resize: 'vertical',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.4rem' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.3rem',
                      marginBottom: '0.6rem'
                    }}>
                      Key Competencies & Core Skills
                    </div>
                    <input
                      type="text"
                      value={resumeData.skills !== undefined && resumeData.skills !== '' ? resumeData.skills : (profile.skills || 'Next.js, React, Tailwind CSS, Supabase, Executive Strategy')}
                      onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="Enter skills separated by commas..."
                      style={{
                        width: '100%',
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        fontSize: '0.85rem',
                        color: '#1e293b',
                        fontWeight: '600',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.4rem' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#0f172a',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.3rem',
                      marginBottom: '0.6rem'
                    }}>
                      Work History & Professional Experience
                    </div>
                    <textarea
                      rows={6}
                      value={resumeData.experience}
                      onChange={(e) => setResumeData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="Senior Specialist | Tech Solutions (2024 - Present)..."
                      style={{
                        width: '100%',
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        fontSize: '0.85rem',
                        color: '#334155',
                        lineHeight: '1.6',
                        outline: 'none',
                        resize: 'vertical',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

            {/* TAB 6: ATS RESUME BUILDER (SHANORA PRO & FREE TEMPLATES) */}
activeTab === 'resume' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem 0' }}>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>ATS Resume Studio 📄</h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Choose from free templates or preview our elite PRO executive designs.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}
      >
        🖨️ Download Official PDF
      </button>
    </div>

    {/* 12+ Templates Grid (Free vs Pro Preview Only) */}
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.2rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '0.8rem' }}>
        Select or Preview Templates (12 Professional Layouts)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
        {[
          // Free Templates (Fully Editable)
          { id: 'executive-classic', name: '1. Executive Classic', type: 'Free', desc: 'Clean single-column standard ATS format.', badge: 'FREE 🔓', color: '#0f172a' },
          { id: 'modern-executive', name: '2. Modern Executive', type: 'Free', desc: 'Contemporary layout with accent highlights.', badge: 'FREE 🔓', color: '#0284c7' },
          { id: 'corporate-standard', name: '3. Corporate Standard', type: 'Free', desc: 'Traditional office and admin layout.', badge: 'FREE 🔓', color: '#334155' },
          { id: 'minimal-clean', name: '4. Minimal Clean', type: 'Free', desc: 'Distraction-free simple layout.', badge: 'FREE 🔓', color: '#64748b' },

          // Pro Templates (Elite Design Preview Only - Locked for Non-Pro)
          { id: 'international-pro', name: '5. International Elite', type: 'Pro', desc: 'Global multinational executive layout.', badge: 'PRO 🔒', color: '#7c3aed' },
          { id: 'tech-specialist', name: '6. Tech Stack Master', type: 'Pro', desc: 'Optimized for software engineers & IT.', badge: 'PRO 🔒', color: '#059669' },
          { id: 'creative-director', name: '7. Creative Director', type: 'Pro', desc: 'Stunning grid style for top creators.', badge: 'PRO 🔒', color: '#db2777' },
          { id: 'executive-board', name: '8. Boardroom Director', type: 'Pro', desc: 'High-end corporate leadership style.', badge: 'PRO 🔒', color: '#d97706' },
          { id: 'startup-founder', name: '9. Startup Venture Lead', type: 'Pro', desc: 'Dynamic metrics & venture format.', badge: 'PRO 🔒', color: '#2563eb' },
          { id: 'academic-scholar', name: '10. Academic Scholar', type: 'Pro', desc: 'Structured research & publications layout.', badge: 'PRO 🔒', color: '#4f46e5' },
          { id: 'global-enterprise', name: '11. Global Enterprise', type: 'Pro', desc: 'The ultimate multinational format.', badge: 'PRO 🔒', color: '#dc2626' },
          { id: 'ultimate-titan', name: '12. Titan Executive Pro', type: 'Pro', desc: 'Elite styling for top-tier professionals.', badge: 'PRO 🌟', color: '#0891b2' }
        ].map((tmpl) => {
          const isPro = tmpl.type === 'Pro';
          const isLocked = isPro && !profile.is_pro;

          return (
            <div
              key={tmpl.id}
              onClick={() => {
                if (isLocked) {
                  alert('🔒 This is an exclusive SHANORA PRO template. Upgrade to PRO to unlock and use this elite design!');
                  navigateTab('pro'); // Redirects to Pro upgrade section
                } else {
                  setSelectedTemplate(tmpl.id);
                }
              }}
              style={{
                backgroundColor: '#070b14',
                border: isLocked ? '1px dashed #7c3aed' : '1px solid #334155',
                borderRadius: '12px',
                padding: '0.85rem',
                cursor: 'pointer',
                position: 'relative',
                opacity: isLocked ? 0.85 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.6rem',
                fontWeight: '800',
                backgroundColor: isPro ? '#7c3aed' : '#0284c7',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {tmpl.badge}
              </div>

              <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: tmpl.color, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                📄
              </div>

              <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff', margin: '0 0 0.2rem 0' }}>
                {tmpl.name}
              </h4>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.3' }}>
                {tmpl.desc}
              </p>

              {isLocked && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#c084fc', fontWeight: 'bold' }}>
                  🔒 Preview Only — Upgrade to Edit
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Live CV Preview Box */}
    <div style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
            {profile.full_name || 'Amanullah Mahtam'}
          </h1>
          <p style={{ fontSize: '1rem', fontWeight: '700', color: '#0284c7', margin: 0 }}>
            {profile.headline || 'Office Assistant & IT Technical Support Professional'}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
          <p style={{ margin: 0 }}>{profile.email || 'amanullahmahtam7@gmail.com'}</p>
          <p style={{ margin: 0 }}>{profile.phone || '+92 303 3639664'}</p>
          <p style={{ margin: 0 }}>{profile.country || 'Saddar, Karachi, Sindh'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.4rem' }}>
          Professional Experience
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0.3rem 0', fontWeight: 'bold' }}>
          Office Assistant & IT Technical Support — Shah Latif Model Secondary School Thikratho (2019 – Present)
        </p>
        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
          Managing administrative records, hardware/software troubleshooting, MS Office, basic networking setup, and digital productivity tools.
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginBottom: '0.4rem' }}>
          Education & Credentials
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0 }}>
          <b>Bachelor of Science (B.Sc.)</b> — Shah Abdul Latif University, Khairpur | <b>Diploma in IT (DIT)</b> | Google AI Certified
        </p>
      </div>
    </div>

  </div>
)}
              

        {/* TAB 7: MONETIZATION */}
        {activeTab === 'monetization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#10b981' }}>💰 Creator Monetization Hub</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase' }}>Available Balance</span>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '0.1rem' }}>
                  Rs. {profile.wallet_balance.toLocaleString()}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Instant payout via EasyPaisa / JazzCash / Bank</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  backgroundColor: profile.is_monetized ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: profile.is_monetized ? '#4ade80' : '#facc15',
                  border: profile.is_monetized ? '1px solid #22c55e' : '1px solid #eab308'
                }}>
                  {profile.is_monetized ? 'Monetized ✓' : 'Under Review / Locked'}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.8rem' }}>
                Monetization Eligibility Tracker (Auto-Calculated)
              </div>

              <div style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Followers Required: <strong>5,000</strong></span>
                  <span style={{ color: followersList.length >= 5000 ? '#4ade80' : '#38bdf8', fontWeight: 'bold' }}>
                    {followersList.length} / 5,000 {followersList.length >= 5000 ? '✓' : ''}
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((followersList.length / 5000) * 100))}%`, height: '100%', backgroundColor: followersList.length >= 5000 ? '#22c55e' : '#0284c7' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Monthly Published Posts: <strong>30</strong></span>
                  <span style={{ color: myPostsCount >= 30 ? '#4ade80' : '#38bdf8', fontWeight: 'bold' }}>
                    {myPostsCount} / 30 {myPostsCount >= 30 ? '✓' : ''}
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((myPostsCount / 30) * 100))}%`, height: '100%', backgroundColor: myPostsCount >= 30 ? '#22c55e' : '#0284c7' }} />
                </div>
              </div>

              {profile.is_monetized ? (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>
                  🎉 Congratulations! Your account is monetized. Creator bonuses will automatically credit to your wallet.
                </div>
              ) : monetizationStatus === 'pending' ? (
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', color: '#facc15', fontWeight: 'bold' }}>
                  ⏳ Application Submitted! Administrative verification is underway.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={submittingMonetization || followersList.length < 5000 || myPostsCount < 30}
                  onClick={handleApplyMonetization}
                  style={{
                    width: '100%',
                    backgroundColor: (followersList.length >= 5000 && myPostsCount >= 30) ? '#10b981' : '#1e293b',
                    color: (followersList.length >= 5000 && myPostsCount >= 30) ? '#000' : '#64748b',
                    border: 'none',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: (followersList.length >= 5000 && myPostsCount >= 30) ? 'pointer' : 'not-allowed'
                  }}
                >
                  {submittingMonetization ? 'Submitting Application...' : (followersList.length >= 5000 && myPostsCount >= 30) ? 'Apply for Monetization 💰' : 'Criteria Incomplete (Continue Posting & Growing Network)'}
                </button>
              )}
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>
                Withdraw Earnings (EasyPaisa / JazzCash / Bank)
              </div>
              <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                The minimum withdrawal threshold is Rs. 1,000. Funds will be directly dispatched to your specified account.
              </p>

              <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.6rem' }}>
                  <select
                    value={payoutForm.payment_method}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Bank">Raast / Bank</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Amount (PKR) min 1,000"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input
                    type="text"
                    placeholder="Account Number (e.g. 0300...)"
                    value={payoutForm.account_number}
                    onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Account Title Name"
                    value={payoutForm.account_title}
                    onChange={(e) => setPayoutForm({ ...payoutForm, account_title: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPayout || profile.wallet_balance < 1000}
                  style={{
                    backgroundColor: profile.wallet_balance >= 1000 ? '#10b981' : '#1e293b',
                    color: profile.wallet_balance >= 1000 ? '#000' : '#64748b',
                    border: 'none',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: profile.wallet_balance >= 1000 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {submittingPayout ? 'Processing...' : 'Request Payout 💸'}
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>
                Earnings & Bonus History
              </div>

              {payoutsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                  No payout or bonus records available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {payoutsHistory.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff' }}>
                          {item.type === 'bonus' ? '🎁 Creator Bonus Awarded' : `💸 Payout via ${item.payment_method}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {new Date(item.created_at).toLocaleDateString()} {item.account_number ? `• ${item.account_number}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: item.type === 'bonus' ? '#4ade80' : '#38bdf8' }}>
                          {item.type === 'bonus' ? '+' : '-'}Rs. {item.amount}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: item.status === 'approved' || item.status === 'paid' ? '#4ade80' : '#facc15' }}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: SAVED POSTS */}
        {activeTab === 'saved' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#c084fc' }}>🔖 Saved Posts & Bookmarks</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            {savedPostsList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔖</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No saved posts yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>Bookmark useful posts or job listings from your feed to review them here.</div>
                <Link href="/feed" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '700' }}>
                  Explore Feed
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {savedPostsList.map(item => {
                  const post = item.user_posts || {};
                  return (
                    <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>
                            {post.user_email || 'Author'}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Saved on {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSavedPost(item.id)}
                          style={{ backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Remove ✕
                        </button>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                        {post.content || 'Content not available or post has been removed.'}
                      </div>

                      {post.image_url && (
                        <img src={post.image_url} alt="Saved visual" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: SETTINGS (VERTICAL ACCORDION STYLE) */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#cbd5e1' }}>⚙️ Settings & Privacy</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Account Security Hub Link */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => router.push('/settings/security')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#131b2e' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔒</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Account Security Hub</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Change password, active devices & single session</div>
                    </div>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.95rem' }}>→</span>
                </div>
              </div>

              {/* Quick Password Change Accordion */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'account' ? null : 'account')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'account' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔑</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Quick Password Change</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'account' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'account' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Registered Email</span>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '0.1rem' }}>{profile.email}</div>
                    </div>

                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid #1e293b', paddingTop: '0.8rem' }}>
                      <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Update Password</label>
                      <input
                        type="password"
                        placeholder="Enter new strong password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                      />
                      <button
                        type="submit"
                        disabled={updatingPassword}
                        style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {updatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem', width: '100%', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.4rem' }}
                    >
                      Log Out of Current Session 🚪
                    </button>
                  </div>
                )}
              </div>

              {/* Privacy & Visibility */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'privacy' ? null : 'privacy')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'privacy' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Privacy & Visibility</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'privacy' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'privacy' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Profile Visibility</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Allow others to discover your profile</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('profile_visible', profile.profile_visible)}
                        style={{ backgroundColor: profile.profile_visible ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                      >
                        {profile.profile_visible ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.8rem' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Active Status (Last Seen)</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Display green online dot</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('last_seen_visible', profile.last_seen_visible)}
                        style={{ backgroundColor: profile.last_seen_visible ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                      >
                        {profile.last_seen_visible ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'notifications' ? null : 'notifications')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'notifications' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔔</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Notification Alerts</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'notifications' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'notifications' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Email Alerts</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Receive application alerts & notifications</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('email_alerts', profile.email_alerts)}
                        style={{ backgroundColor: profile.email_alerts ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                      >
                        {profile.email_alerts ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Language & Region */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'language' ? null : 'language')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'language' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Language & Region</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'language' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'language' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <select
                      value={profile.app_language}
                      onChange={(e) => handleSelectSetting('app_language', e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    >
                      <option value="English">English (Default)</option>
                      <option value="Urdu">Urdu (اردو)</option>
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Timezone: Asia/Karachi (PKT - UTC+5)</span>
                  </div>
                )}
              </div>

              {/* Career & Job Status */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'professional' ? null : 'professional')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'professional' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💼</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Career Preferences</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'professional' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'professional' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>"Open to Work" Badge</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Signal recruiters that you are available</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('open_to_work', profile.open_to_work)}
                        style={{ backgroundColor: profile.open_to_work ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                      >
                        {profile.open_to_work ? 'ACTIVE' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Help & Support */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <div
                  onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'support' ? null : 'support')}
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'support' ? '#131b2e' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Help & Support</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'support' ? '▲' : '▼'}</span>
                </div>

                {settingsActiveSubTab === 'support' && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Official Email: <strong>support@shanora.pk</strong></div>
                    <a
                      href="https://wa.me/923033639664"
                      target="_blank"
                      rel="noreferrer"
                      style={{ backgroundColor: '#22c55e', color: '#000', padding: '0.5rem', textAlign: 'center', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: NETWORK / FOLLOWERS (WITH FOLLOW + MESSAGE ACTION BUTTONS & EXECUTIVE PRO BADGE) */}
        {activeTab === 'network' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '0.8rem' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👥 Network & Connections</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <button
                type="button"
                onClick={() => setNetworkSubTab('followers')}
                style={{
                  flex: 1,
                  backgroundColor: networkSubTab === 'followers' ? '#0284c7' : 'transparent',
                  color: networkSubTab === 'followers' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Followers ({followersList.length})
              </button>

              <button
                type="button"
                onClick={() => setNetworkSubTab('following')}
                style={{
                  flex: 1,
                  backgroundColor: networkSubTab === 'following' ? '#0284c7' : 'transparent',
                  color: networkSubTab === 'following' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Following ({followingList.length})
              </button>
            </div>

            {/* SubTab: Followers */}
            {networkSubTab === 'followers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followersList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No followers found on your profile yet.
                  </div>
                ) : (
                  followersList.map(item => {
                    const cleanEmail = (item.user_email || item.follower_email || '').toLowerCase();
                    const displayName = item.displayName || cleanEmail.split('@')[0];
                    const isFollowingBack = !!followingMap[cleanEmail];

                    return (
                      <div key={item.id} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              <span>{displayName}</span>
                              {item.is_pro && <ProVerifiedBadge size={16} />}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Follows you
                            </div>
                          </div>
                        </Link>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatUser({
                                email: cleanEmail,
                                full_name: displayName,
                                avatar_url: item.avatarUrl,
                                last_seen: item.last_seen,
                                is_pro: item.is_pro
                              });
                              setActiveTab('messages');
                            }}
                            style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #0284c7',
                              color: '#38bdf8',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>💬</span>
                            <span>Message</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFollow(cleanEmail)}
                            disabled={actionLoading[cleanEmail]}
                            style={{
                              backgroundColor: isFollowingBack ? '#1e293b' : '#0284c7',
                              color: isFollowingBack ? '#94a3b8' : '#fff',
                              border: isFollowingBack ? '1px solid #334155' : 'none',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isFollowingBack ? 'Following' : 'Follow Back'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SubTab: Following */}
            {networkSubTab === 'following' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followingList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    You are not following any users yet.
                  </div>
                ) : (
                  followingList.map(item => {
                    const cleanEmail = (item.user_email || item.following_email || '').toLowerCase();
                    const displayName = item.displayName || cleanEmail.split('@')[0];

                    return (
                      <div key={item.id} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#38bdf8',
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              <span>{displayName}</span>
                              {item.is_pro && <ProVerifiedBadge size={16} />}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Following
                            </div>
                          </div>
                        </Link>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatUser({
                                email: cleanEmail,
                                full_name: displayName,
                                avatar_url: item.avatarUrl,
                                last_seen: item.last_seen,
                                is_pro: item.is_pro
                              });
                              setActiveTab('messages');
                            }}
                            style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #0284c7',
                              color: '#38bdf8',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>💬</span>
                            <span>Message</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFollow(cleanEmail)}
                            disabled={actionLoading[cleanEmail]}
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Unfollow
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Discover People Section with Message + Follow */}
            <div style={{ marginTop: '2.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                  People You May Know
                </span>
                <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>
                  Discover
                </span>
              </div>

              {discoverUsers.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  No new creators found for recommendation.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {discoverUsers.map(creator => {
                    const cleanEmail = (creator.email || '').toLowerCase();
                    const username = creator.name || creator.full_name || cleanEmail.split('@')[0];
                    const isFollowing = !!followingMap[cleanEmail];

                    return (
                      <div key={creator.id || cleanEmail} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}>
                        <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            backgroundColor: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {creator.avatar_url ? (
                              <img src={creator.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              <span>{username}</span>
                              {creator.is_pro && <ProVerifiedBadge size={16} />}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {creator.headline || cleanEmail}
                            </div>
                          </div>
                        </Link>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatUser({
                                email: cleanEmail,
                                full_name: username,
                                avatar_url: creator.avatar_url,
                                last_seen: creator.last_seen,
                                is_pro: creator.is_pro
                              });
                              setActiveTab('messages');
                            }}
                            style={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #0284c7',
                              color: '#38bdf8',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>💬</span>
                            <span>Message</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFollow(cleanEmail)}
                            disabled={actionLoading[cleanEmail]}
                            style={{
                              backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                              color: isFollowing ? '#94a3b8' : '#fff',
                              border: isFollowing ? '1px solid #334155' : 'none',
                              padding: '0.45rem 0.95rem',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            {isFollowing ? 'Following' : '+ Follow'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Full-view Modal for Chat Images */}
      {previewModalImg && (
        <div 
          onClick={() => setPreviewModalImg(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <img src={previewModalImg} alt="Enlarged" style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}

      {/* 1. INVITE FRIENDS & REFERRAL REWARDS MODAL */}
      {showInviteModal && (
        <div 
          onClick={() => setShowInviteModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '1.2rem 1.2rem 3.5rem 1.2rem', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👥</span> Invite Friends & Earn Rewards
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
            </div>

            {/* Unique Referral Link Card */}
            <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '12px', marginTop: '0.9rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>Your Unique Referral Link:</div>
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  style={{ flex: 1, minWidth: 0, backgroundColor: '#0b1322', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.65rem', color: '#38bdf8', fontSize: '0.76rem', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  style={{ backgroundColor: copiedLink ? '#22c55e' : '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
                >
                  {copiedLink ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Social Share Grid */}
            <div style={{ marginTop: '0.9rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem' }}>Share Directly Via:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.45rem' }}>
                <button type="button" onClick={() => handleShare('whatsapp')} style={{ backgroundColor: '#15803d', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🟢 WhatsApp
                </button>
                <button type="button" onClick={() => handleShare('facebook')} style={{ backgroundColor: '#1d4ed8', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🔵 Facebook
                </button>
                <button type="button" onClick={() => handleShare('messenger')} style={{ backgroundColor: '#0369a1', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  💬 Messenger
                </button>
                <button type="button" onClick={() => handleShare('email')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ✉️ Email
                </button>
                <button type="button" onClick={() => handleShare('sms')} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📱 SMS
                </button>
                <button type="button" onClick={() => handleShare('native')} style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📲 Share
                </button>
              </div>
            </div>

            {/* LIVE REFERRAL STATS & PROGRESS TRACKER */}
            <div style={{ backgroundColor: '#131e33', border: '1px solid #0284c7', borderRadius: '12px', padding: '0.85rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Total Genuine Invites:</span>
                <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#38bdf8' }}>{referralCount} Friends Joined 👥</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#070b14', borderRadius: '4px', overflow: 'hidden', margin: '0.55rem 0 0.35rem 0' }}>
                <div style={{
                  width: `${Math.min(100, Math.round((referralCount / 100) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7 0%, #22c55e 100%)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span>Milestone Progress</span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{referralCount >= 100 ? '🌟 Max Ambassador Reached!' : `${Math.max(0, 10 - referralCount)} more for 1 Month PRO`}</span>
              </div>
            </div>

            {/* DYNAMIC REWARD MILESTONES WITH CRITERIA CLAIM BUTTON */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8', marginBottom: '0.65rem' }}>
                🏆 Referral Achievements & Rewards
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {referralMilestones.map((tier) => {
                  const isCompleted = referralCount >= tier.minFriends;
                  const isClaiming = claimingMilestone === tier.minFriends;

                  return (
                    <div 
                      key={tier.minFriends} 
                      style={{ 
                        backgroundColor: '#1e293b', 
                        padding: '0.7rem 0.85rem', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        borderLeft: `4px solid ${tier.color}`,
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tier.goal}</div>
                        <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: '700', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tier.reward}</div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isCompleted ? (
                          <button
                            type="button"
                            disabled={isClaiming}
                            onClick={() => handleClaimMilestone(tier)}
                            style={{
                              backgroundColor: '#22c55e',
                              color: '#000',
                              border: 'none',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: '900',
                              cursor: 'pointer',
                              boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)'
                            }}
                          >
                            {isClaiming ? 'Applying...' : 'Claim Reward 🎁'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 'bold' }}>
                            {referralCount} / {tier.minFriends} 🎯
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: '70px', width: '100%', flexShrink: 0 }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FACEBOOK-STYLE STRICT ADS MANAGER */}
      {showAdsModal && (
        <div 
          onClick={() => setShowAdsModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '560px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.3rem', color: '#fff', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📢</span> Ads Manager 
              </div>
              <button type="button" onClick={() => setShowAdsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', margin: '0.9rem 0', textAlign: 'center', fontSize: '0.6rem', fontWeight: '800' }}>
              {[
                { s: 1, label: 'Page' },
                { s: 2, label: 'Create Ad' },
                { s: 3, label: 'Audience' },
                { s: 4, label: 'Budget' },
                { s: 5, label: 'Payment' },
                { s: 6, label: 'Approval' }
              ].map(st => (
                <div
                  key={st.s}
                  style={{
                    padding: '0.45rem 0.15rem',
                    borderRadius: '6px',
                    backgroundColor: adStep === st.s ? '#0284c7' : '#1e293b',
                    color: adStep === st.s ? '#fff' : '#94a3b8',
                    border: adStep === st.s ? '1px solid #38bdf8' : '1px solid #334155'
                  }}
                >
                  {st.label}
                </div>
              ))}
            </div>

            {/* STEP 1 */}
            {adStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 1: Select Brand / Organization Page</div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.45' }}>
                  Just like Facebook Ads, all advertisements must run on behalf of a public or business Page on SHANORA.
                </p>

                {myPages.length === 0 ? (
                  <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏢</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>No Organization Page Found</div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 0.9rem 0' }}>You need an active Page to run and publish sponsored campaigns.</p>
                    <Link
                      href="/create-page"
                      style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#fff', padding: '0.55rem 1.2rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '800' }}
                    >
                      + Create Your Page First
                    </Link>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>Choose Page to Promote:</label>
                    <select
                      value={adFormData.selectedPageId}
                      onChange={(e) => {
                        const sel = myPages.find(p => p.id === e.target.value);
                        setAdFormData({
                          ...adFormData,
                          selectedPageId: e.target.value,
                          selectedPageSlug: sel?.slug || ''
                        });
                      }}
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    >
                      {myPages.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (@{p.slug})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!adFormData.selectedPageId || myPages.length === 0}
                  onClick={() => setAdStep(2)}
                  style={{
                    backgroundColor: adFormData.selectedPageId ? '#0284c7' : '#1e293b',
                    color: adFormData.selectedPageId ? '#fff' : '#64748b',
                    border: 'none',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: adFormData.selectedPageId ? 'pointer' : 'not-allowed',
                    marginTop: '0.4rem'
                  }}
                >
                  Continue to Ad Creative →
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {adStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 2: Design Campaign Ad</div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Ad Headline *</label>
                  <input
                    type="text"
                    placeholder="Catchy headline (min 6 characters)"
                    value={adFormData.headline}
                    onChange={(e) => setAdFormData({ ...adFormData, headline: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Ad Primary Copy / Caption *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your promotion, career opening, or product..."
                    value={adFormData.adText}
                    onChange={(e) => setAdFormData({ ...adFormData, adText: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Destination CTA URL *</label>
                  <input
                    type="url"
                    placeholder="https://example.com or WhatsApp link"
                    value={adFormData.targetUrl}
                    onChange={(e) => setAdFormData({ ...adFormData, targetUrl: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button type="button" onClick={() => setAdStep(1)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
                  <button
                    type="button"
                    disabled={!adFormData.headline.trim() || !adFormData.adText.trim() || !adFormData.targetUrl.trim()}
                    onClick={() => setAdStep(3)}
                    style={{
                      flex: 2,
                      backgroundColor: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? '#0284c7' : '#1e293b',
                      color: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? '#fff' : '#64748b',
                      border: 'none',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      cursor: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Set Audience Target →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {adStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 3: Audience & Targeting</div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Target Location / City</label>
                  <select
                    value={adFormData.targetCity}
                    onChange={(e) => setAdFormData({ ...adFormData, targetCity: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="All Pakistan">All Pakistan (National Reach)</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad / Rawalpindi">Islamabad / Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Campaign Objective</label>
                  <select
                    value={adFormData.targetObjective}
                    onChange={(e) => setAdFormData({ ...adFormData, targetObjective: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="traffic">Drive Website Traffic / External Clicks</option>
                    <option value="followers">Grow Page Followers & Reach</option>
                    <option value="messages">Get Inquiries & Direct Messages</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button type="button" onClick={() => setAdStep(2)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
                  <button type="button" onClick={() => setAdStep(4)} style={{ flex: 2, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    Select Budget →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {adStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 4: Campaign Budget & Estimated Views</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {[
                    { b: '1500', reach: '5,000+ Views', name: 'Starter' },
                    { b: '3500', reach: '15,000+ Views', name: 'Growth' },
                    { b: '7000', reach: '40,000+ Views', name: 'Pro Scaler' }
                  ].map(pkg => (
                    <div
                      key={pkg.b}
                      onClick={() => setAdFormData({ ...adFormData, budget: pkg.b })}
                      style={{
                        backgroundColor: adFormData.budget === pkg.b ? '#13233e' : '#1e293b',
                        border: adFormData.budget === pkg.b ? '1px solid #0284c7' : '1px solid #334155',
                        borderRadius: '10px',
                        padding: '0.75rem 0.4rem',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pkg.name}</div>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#facc15', margin: '0.2rem 0' }}>Rs. {pkg.b}</div>
                      <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 'bold' }}>{pkg.reach}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button type="button" onClick={() => setAdStep(3)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
                  <button type="button" onClick={() => setAdStep(5)} style={{ flex: 2, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {adStep === 5 && (
              <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 5: Billing & TID Submission</div>

                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: '1.45' }}>
                  Pay <strong>Rs. {adFormData.budget}</strong> to verify this campaign:<br />
                  EasyPaisa / JazzCash: <code>03033639664</code> (Title: <strong>Amanullah</strong>)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                  <select
                    value={adFormData.paymentMethod}
                    onChange={(e) => setAdFormData({ ...adFormData, paymentMethod: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter Transaction ID (TID)"
                    value={adFormData.trxId}
                    onChange={(e) => setAdFormData({ ...adFormData, trxId: e.target.value })}
                    required
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button type="button" onClick={() => setAdStep(4)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
                  <button 
                    type="submit" 
                    disabled={adSubmitting || !adFormData.trxId.trim()} 
                    style={{ 
                      flex: 2, 
                      backgroundColor: adFormData.trxId.trim() ? '#22c55e' : '#1e293b', 
                      color: adFormData.trxId.trim() ? '#000' : '#64748b', 
                      border: 'none', 
                      padding: '0.6rem', 
                      borderRadius: '8px', 
                      fontWeight: '900', 
                      fontSize: '0.82rem', 
                      cursor: adFormData.trxId.trim() ? 'pointer' : 'not-allowed' 
                    }}
                  >
                    {adSubmitting ? 'Submitting...' : 'Submit for Admin Review 🚀'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 6 */}
            {adStep === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem' }}>⏳</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#facc15' }}>
                  Campaign Under Admin Approval
                </div>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: '1.45', margin: 0 }}>
                  {adSuccessMessage || 'Your ad has been queued. Once our safety and payment verification is finished, it will automatically start circulating across the feed.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Status</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#facc15', marginTop: '0.2rem' }}>In Review</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Budget</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.2rem' }}>Rs. {adFormData.budget}</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Page</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#4ade80', marginTop: '0.2rem' }}>Active</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdsModal(false)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.6rem' }}
                >
                  Close Ads Manager
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div 
          onClick={() => setShowEditProfileModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.4rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Edit Professional Profile</h3>
              <button 
                type="button" 
                onClick={() => setShowEditProfileModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Profile Picture (Avatar)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} style={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                  {uploadingAvatar && <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Uploading...</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Full Name *</label>
                  <input
                    type="text"
                    value={editProfileForm.full_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, full_name: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Designation / Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Software Engineer"
                    value={editProfileForm.headline}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, headline: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Bio & Summary</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of your professional expertise..."
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Key Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Python, Product Strategy, Cloud Architecture"
                  value={editProfileForm.skills}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, skills: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi, Lahore, Islamabad"
                    value={editProfileForm.city}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, city: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '0.8rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>📎 Attached Resume / CV</label>
                  {editProfileForm.resume_url && (
                    <a href={editProfileForm.resume_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold', textDecoration: 'none' }}>
                      Current File ↗
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploadingResume} style={{ fontSize: '0.74rem', color: '#cbd5e1' }} />
                    {uploadingResume && <span style={{ fontSize: '0.7rem', color: '#facc15' }}>Uploading...</span>}
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter public resume URL"
                    value={editProfileForm.resume_url}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, resume_url: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem 0.65rem', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile || uploadingResume || uploadingAvatar}
                  style={{ flex: 2, backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: updatingProfile ? 'not-allowed' : 'pointer' }}
                >
                  {updatingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '16px',
              padding: '1.6rem',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.4rem'
              }}
            >
              🚪
            </div>

            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
              Log Out of Shanora?
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.45' }}>
              Are you sure you want to end your active session? You will need to sign in again to access your account.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  padding: '0.65rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeLogout}
                style={{
                  background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.65)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  padding: '0.65rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Bottom Navigation Component */}
      <BottomNav />
    </div>
  );
}

export default function ProfilePortal() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    }>
      <ProfilePortalContent />
    </Suspense>
  );
}
