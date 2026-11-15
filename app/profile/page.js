'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import BottomNav from '../../components/BottomNav';
import ResumeStudio from '../../components/ResumeStudio';

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

  // Modals for Menu Features (Ads modal removed entirely)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [claimingMilestone, setClaimingMilestone] = useState(null);

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

  // Messenger Real-Time State
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
          .then(({ data }) => { if (data) setMyPages(data); });

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

  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).ilike('email', user.email.toLowerCase());
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

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

  // Updated menu items with Ads Manager linked directly to `/ads-manager`
  const allMenuItems = [
    { id: 'pro', label: 'Shanora PRO 👑', icon: '👑', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' },
    { id: 'invite_friends', label: 'Invite Friends 👥', icon: '👥', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.35)' },
    { id: 'advertiser_portal', label: 'Ads Manager 📢', icon: '📢', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', isLink: true, route: '/ads-manager' },
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
              {allMenuItems.map(item => {
                const cardContent = (
                  <div
                    key={item.id}
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
                );

                if (item.isLink) {
                  return (
                    <Link key={item.id} href={item.route} style={{ textDecoration: 'none', display: 'block' }}>
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div key={item.id} onClick={() => {
                    if (item.id === 'security') {
                      router.push('/settings/security');
                    } else if (item.id === 'invite_friends') {
                      setShowInviteModal(true);
                    } else {
                      navigateToTab(item.id);
                    }
                  }}>
                    {cardContent}
                  </div>
                );
              })}
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
                </div>
              ) : latestProRequest?.status === 'pending' ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #facc15', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <strong style={{ color: '#facc15', fontSize: '0.95rem' }}>Verification in Progress</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    Your payment request (TID: <strong style={{ color: '#fff' }}>{latestProRequest.transaction_id}</strong>) is currently being reviewed.
                  </p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Monthly Subscription:</span>
                      <span style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>Rs. 499 / mo</span>
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
              <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0.45rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{profile.full_name}</span>
                {profile.is_pro && <ProVerifiedBadge size={19} />}
              </h2>
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
                    </h3>
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
            </div>
          </div>
        )}

        {/* TAB 4: MESSENGER */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>Shanora Messenger</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* TAB 5: PAGES */}
        {activeTab === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#f97316' }}>🏢 Your Pages ({myPages.length})</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* TAB 6: ATS RESUME BUILDER */}
        {activeTab === 'resume' && (
          <ResumeStudio
            profile={profile}
            resumeData={resumeData}
            navigateToTab={navigateToTab}
          />
        )}

        {/* TAB 7: MONETIZATION */}
        {activeTab === 'monetization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#10b981' }}>💰 Creator Monetization Hub</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
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
          </div>
        )}

        {/* TAB 9: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#cbd5e1' }}>⚙️ Settings & Privacy</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* TAB 10: NETWORK */}
        {activeTab === 'network' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '0.8rem' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👥 Network & Connections</span>
              <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div 
          onClick={() => setShowInviteModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '1.2rem', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: '800', fontSize: '1rem' }}>👥 Invite Friends & Earn Rewards</div>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div 
          onClick={() => setShowEditProfileModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '1.4rem' }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Edit Professional Profile</h3>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '16px', padding: '1.6rem', maxWidth: '380px', width: '100%', textAlign: 'center' }}
          >
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>Log Out of Shanora?</h3>
            <button type="button" onClick={executeLogout}>Log Out</button>
          </div>
        </div>
      )}

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
