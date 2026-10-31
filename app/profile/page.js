'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ProfilePortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'network');
  const [networkSubTab, setNetworkSubTab] = useState('followers');
  const [loading, setLoading] = useState(true);

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
    is_pro: false
  });

  // Profile Edit Modal States
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

  // Pro Upgrade States
  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [submittingPro, setSubmittingPro] = useState(false);
  const [latestProRequest, setLatestProRequest] = useState(null);

  // Dashboard & Metrics State
  const [myPostsCount, setMyPostsCount] = useState(0);

  const [myPages, setMyPages] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [userLastMessagesMap, setUserLastMessagesMap] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Messages States
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  // Jobs States
  const [jobsList, setJobsList] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [myApplicationsList, setMyApplicationsList] = useState([]);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [withdrawingAppId, setWithdrawingAppId] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    job_type: 'Full-time',
    salary_range: '',
    description: ''
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // Apply Modal State
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: 'Fresh Graduate',
    resume_link: '',
    cover_note: ''
  });

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

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

        // 1. Update Online Heartbeat
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .ilike('email', myEmail);

        // 2. Fetch Profile
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
          is_pro: !!profileData?.is_pro
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

        // 3. Fetch Latest Pro Request
        const { data: proReqData } = await supabase
          .from('pro_requests')
          .select('*')
          .ilike('user_email', myEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (proReqData) setLatestProRequest(proReqData);

        // 4. Fetch User Posts Count
        const { count: postsCount } = await supabase
          .from('user_posts')
          .select('id', { count: 'exact', head: true })
          .ilike('user_email', myEmail);

        if (postsCount !== null) setMyPostsCount(postsCount);

        // 5. Fetch Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .ilike('owner_email', myEmail)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // 6. Fetch Real Followers & Following
        const { data: followsData } = await supabase
          .from('user_follows')
          .select('id, follower_email, following_email, created_at');

        const curMap = {};
        if (followsData) {
          const myFollowers = followsData.filter(f => (f.following_email || '').toLowerCase() === myEmail);
          const myFollowings = followsData.filter(f => (f.follower_email || '').toLowerCase() === myEmail);

          setFollowersList(myFollowers);
          setFollowingList(myFollowings);

          myFollowings.forEach(f => {
            if (f.following_email) curMap[f.following_email.toLowerCase()] = true;
          });
          setFollowingMap(curMap);
        }

        // 7. Fetch All User Conversations & Map Last Message Time
        const { data: allUserMsgs } = await supabase
          .from('direct_messages')
          .select('sender_email, receiver_email, message, created_at')
          .or(`sender_email.ilike.${myEmail},receiver_email.ilike.${myEmail}`)
          .order('created_at', { ascending: true });

        const lastMsgs = {};
        if (allUserMsgs) {
          allUserMsgs.forEach(m => {
            const other = (m.sender_email.toLowerCase() === myEmail ? m.receiver_email : m.sender_email).toLowerCase();
            lastMsgs[other] = {
              text: m.message,
              time: new Date(m.created_at).getTime()
            };
          });
          setUserLastMessagesMap(lastMsgs);
        }

        // 8. Fetch All Users for Messenger & Discover
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .limit(100);

        if (allProfiles) {
          const filteredProfiles = allProfiles.filter(p => (p.email || '').toLowerCase() !== myEmail);
          setAllUsersList(filteredProfiles);

          const discoveredList = filteredProfiles.filter(p => !curMap[(p.email || '').toLowerCase()]);
          setDiscoverUsers(discoveredList);
        }

        // 9. Fetch Notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .ilike('recipient_email', myEmail)
          .order('created_at', { ascending: false })
          .limit(30);

        if (notifData) {
          setNotifications(notifData);
          setUnreadCount(notifData.filter(n => !n.is_read).length);
        }

        // 10. Fetch Jobs & Applications
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (allJobs) setJobsList(allJobs);

        const { data: myApps } = await supabase
          .from('job_applications')
          .select('*, jobs(*)')
          .ilike('applicant_email', myEmail)
          .order('created_at', { ascending: false });

        if (myApps) {
          setMyApplicationsList(myApps);
          const appMap = {};
          myApps.forEach(a => {
            if (a.job_id) appMap[a.job_id] = true;
          });
          setAppliedJobsMap(appMap);
        }

      } catch (err) {
        console.error('Portal init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initPortal();
  }, [router]);

  // Load Thread with Active Chat User
  useEffect(() => {
    if (!activeChatUser || !user) return;

    let sub;
    async function loadThread() {
      const myEmail = user.email.toLowerCase();
      const otherEmail = activeChatUser.email.toLowerCase();

      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_email.ilike.${myEmail},receiver_email.ilike.${otherEmail}),and(sender_email.ilike.${otherEmail},receiver_email.ilike.${myEmail})`)
        .order('created_at', { ascending: true });

      setChatMessages(data || []);
      scrollToBottom();
    }

    loadThread();

    sub = supabase
      .channel('public:direct_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const msg = payload.new;
        const myEmail = user.email.toLowerCase();
        const otherEmail = activeChatUser.email.toLowerCase();

        if (
          (msg.sender_email.toLowerCase() === myEmail && msg.receiver_email.toLowerCase() === otherEmail) ||
          (msg.sender_email.toLowerCase() === otherEmail && msg.receiver_email.toLowerCase() === myEmail)
        ) {
          setChatMessages(prev => [...prev, msg]);
          scrollToBottom();

          setUserLastMessagesMap(prev => ({
            ...prev,
            [otherEmail]: { text: msg.message, time: new Date(msg.created_at).getTime() }
          }));
        }
      })
      .subscribe();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [activeChatUser, user]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Send Direct Message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser || !user) return;

    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();
    const sentText = newMessageText.trim();

    setSendingMsg(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          sender_email: myEmail,
          receiver_email: otherEmail,
          message: sentText
        }])
        .select()
        .single();

      if (error) throw error;
      setChatMessages(prev => [...prev, data]);
      setNewMessageText('');
      scrollToBottom();

      setUserLastMessagesMap(prev => ({
        ...prev,
        [otherEmail]: { text: sentText, time: Date.now() }
      }));
    } catch (err) {
      alert('Message send failed: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  }

  function isUserOnline(lastSeen) {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff > 0 && diff < 3 * 60 * 1000;
  }

  // Handle Resume Upload
  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Resume file size 5MB se kam hona chahiye.');
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
      alert('Resume upload ho gaya hai! Save profile button dabayein.');
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingResume(false);
    }
  }

  // Handle Avatar Upload
  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Tasweer ka size 3MB se kam hona chahiye.');
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
      alert('Profile photo select ho gayi hai! Form save karein.');
    } catch (err) {
      alert('Avatar upload error: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Save Profile
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;

    setUpdatingProfile(true);
    try {
      const myEmail = user.email.toLowerCase();
      const updates = {
        email: myEmail,
        full_name: editProfileForm.full_name,
        headline: editProfileForm.headline,
        phone: editProfileForm.phone,
        city: editProfileForm.city,
        bio: editProfileForm.bio,
        skills: editProfileForm.skills,
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
      alert('Profile updated successfully! ✨');
    } catch (err) {
      alert('Profile update error: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  }

  // Pro Activation Request
  async function handleProActivation(e) {
    e.preventDefault();
    if (!trxId.trim()) {
      alert('Kripya valid Transaction ID (TID) darj karein.');
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
      alert('Aapki request submit ho gayi hai! Admin verification ke baad Blue Tick activate ho jayega. 💎');
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

        await supabase
          .from('notifications')
          .insert([{
            recipient_email: cleanTarget,
            sender_name: profile.full_name || myEmail.split('@')[0],
            action_type: 'follow',
            content: 'started following you.',
            is_read: false
          }]);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      setFollowingMap(prev => ({ ...prev, [cleanTarget]: isFollowing }));
    } finally {
      setActionLoading(prev => ({ ...prev, [cleanTarget]: false }));
    }
  }

  async function handleLogout() {
    if (!confirm('Kya aap logout karna chahte hain?')) return;
    await supabase.auth.signOut();
    router.push('/auth');
  }

  async function markNotificationsAsRead() {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    if (user?.email) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .ilike('recipient_email', user.email.toLowerCase());
    }
  }

  function openApplyModal(job) {
    if (!user) {
      router.push('/auth');
      return;
    }

    setApplyForm({
      name: profile.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      phone: profile.phone || '',
      city: profile.city || 'Pakistan',
      experience: 'Fresh Graduate',
      resume_link: profile.resume_url || '',
      cover_note: ''
    });

    setSelectedJobForApply(job);
  }

  async function handleSubmitApplication(e) {
    e.preventDefault();
    if (!selectedJobForApply || !user) return;

    if (!applyForm.phone.trim()) {
      alert('Kripya apna phone/WhatsApp number darj karein.');
      return;
    }

    setSubmittingApplication(true);
    try {
      const { data: insertedApp, error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: selectedJobForApply.id,
          applicant_email: user.email.toLowerCase(),
          applicant_name: applyForm.name,
          phone: applyForm.phone,
          city: applyForm.city,
          experience: applyForm.experience,
          resume_link: applyForm.resume_link,
          cover_note: applyForm.cover_note,
          status: 'in_review'
        }])
        .select('*, jobs(*)')
        .single();

      if (error) throw error;

      setAppliedJobsMap(prev => ({ ...prev, [selectedJobForApply.id]: true }));
      if (insertedApp) setMyApplicationsList(prev => [insertedApp, ...prev]);
      setSelectedJobForApply(null);
      alert('Application submitted successfully! 🚀');
    } catch (err) {
      alert('Application submit error: ' + err.message);
    } finally {
      setSubmittingApplication(false);
    }
  }

  // Withdraw Application Function
  async function handleWithdrawApplication(appId, jobId) {
    if (!confirm('Kya aap is application ko withdraw / cancel karna chahte hain?')) return;

    setWithdrawingAppId(appId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      setMyApplicationsList(prev => prev.filter(a => a.id !== appId));
      setAppliedJobsMap(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      alert('Application successfully withdrawn.');
    } catch (err) {
      alert('Failed to withdraw: ' + err.message);
    } finally {
      setWithdrawingAppId(null);
    }
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!user) return;
    if (!jobFormData.title || !jobFormData.company_name) {
      alert('Title and Company Name are required.');
      return;
    }

    setSubmittingJob(true);
    try {
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert([{
          employer_email: user.email.toLowerCase(),
          company_name: jobFormData.company_name,
          title: jobFormData.title,
          location: jobFormData.location || 'Pakistan',
          job_type: jobFormData.job_type,
          salary_range: jobFormData.salary_range,
          description: jobFormData.description
        }])
        .select()
        .single();

      if (error) throw error;

      setJobsList([newJob, ...jobsList]);
      setShowPostJobModal(false);
      setJobFormData({
        title: '',
        company_name: '',
        location: '',
        job_type: 'Full-time',
        salary_range: '',
        description: ''
      });
      alert('Job posted successfully! 💼');
    } catch (err) {
      alert('Failed to post job: ' + err.message);
    } finally {
      setSubmittingJob(false);
    }
  }

  // LinkedIn Style Sorting for Messaging
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
    { id: 'pro', label: 'Shanora PRO 💎', desc: 'Blue Tick & Perks', icon: '⭐', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' },
    { id: 'dashboard', label: 'Dashboard', desc: 'Analytics & Overview', icon: '📊', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
    { id: 'profile', label: 'My Profile', desc: 'View & Edit Details', icon: '👤', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
    { id: 'messages', label: 'Messages', desc: 'Direct 1-on-1 Chat', icon: '💬', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)' },
    { id: 'pages', label: `Pages (${myPages.length})`, desc: 'Manage your pages', icon: '🚩', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
    { id: 'applications', label: `Applications (${myApplicationsList.length})`, desc: 'Track applied jobs', icon: '📋', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)' },
    { id: 'resume', label: 'My Resume', desc: 'ATS Resume Builder', icon: '📝', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    { id: 'monetization', label: 'Monetization', desc: 'Earning Hub', icon: '💰', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
    { id: 'saved', label: 'Saved Posts', desc: 'Your Bookmarks', icon: '🔖', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
    { id: 'settings', label: 'Settings', desc: 'Privacy & Security', icon: '⚙️', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/feed" style={{ textDecoration: 'none', color: '#38bdf8', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
          SHANORA<span style={{ color: '#fff' }}>.PK</span>
        </Link>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          style={{
            backgroundColor: activeTab === 'messages' ? '#0284c7' : '#1e293b',
            border: '1px solid #334155',
            color: activeTab === 'messages' ? '#fff' : '#38bdf8',
            padding: '0.45rem 0.85rem',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: '700'
          }}
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem 80px 0.9rem' }}>

        {/* TAB: MENU */}
        {activeTab === 'menu' && (
          <div>
            <div 
              onClick={() => setActiveTab('profile')}
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
                  {profile.is_pro && <span title="Verified Pro" style={{ color: '#38bdf8', fontSize: '0.9rem' }}>✓</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{profile.headline || 'View your profile →'}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shortcuts & Services
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', marginBottom: '1.5rem' }}>
              {allMenuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: item.bg,
                    border: `1px solid ${item.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ color: item.id === 'pro' ? '#facc15' : '#f8fafc', fontSize: '0.82rem', fontWeight: '800', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
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
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💎</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#facc15', margin: '0 0 0.3rem 0' }}>Shanora PRO</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>Get the official Blue Tick and unlock premium privileges.</p>

              {profile.is_pro ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #22c55e', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <span style={{ backgroundColor: '#22c55e', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>✓</span>
                    <strong style={{ color: '#4ade80', fontSize: '1rem' }}>Your Shanora PRO Membership is ACTIVE!</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                    <div>🌟 <strong>Verified Badge:</strong> Blue Tick is live across your entire profile & posts.</div>
                    <div>🚀 <strong>Application Boost:</strong> Employers see your job applications on top.</div>
                    <div>📈 <strong>Feed Reach:</strong> 5x higher reach on your published articles and updates.</div>
                  </div>
                </div>
              ) : latestProRequest?.status === 'pending' ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #facc15', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <strong style={{ color: '#facc15', fontSize: '0.95rem' }}>Verification in Progress</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    Aapki payment request (TID: <strong style={{ color: '#fff' }}>{latestProRequest.transaction_id}</strong>) review ke liye submit ho chuki hai. Admin verification ke baad aapka Blue Tick live ho jayega.
                  </p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>Exclusive PRO Perks:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
                    <div>🔹 <strong>Verified Blue Tick:</strong> Stand out across all feeds & comments.</div>
                    <div>🔹 <strong>Priority Job Application:</strong> Featured at the top for hiring managers.</div>
                    <div>🔹 <strong>Direct Messenger:</strong> Reach verified creators & companies.</div>
                    <div>🔹 <strong>Profile Boost:</strong> Enhanced organic reach on all posts.</div>
                  </div>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>Monthly Subscription:</span>
                      <span style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>Rs. 499 / mo</span>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                      <strong>Payment Procedure:</strong><br />
                      1. Send <strong>Rs. 499</strong> to EasyPaisa / JazzCash: <code>03033639664</code><br />
                      2. Account Title: <code>Amanullah</code><br />
                      3. Enter Transaction ID (TID) below and submit.
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
                        {submittingPro ? 'Submitting Request...' : 'Upgrade Now & Submit TID 💎'}
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
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                    Creator Analytics
                  </span>
                  <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0.45rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{profile.full_name}</span>
                    {profile.is_pro && <span title="Verified Pro" style={{ color: '#38bdf8', fontSize: '0.95rem' }}>✓</span>}
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
                    {profile.is_pro ? 'PRO MEMBER 💎' : 'STANDARD'}
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
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Following 🔗</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#22c55e', marginTop: '0.2rem' }}>{followingList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Feed Posts ✍️</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#facc15', marginTop: '0.2rem' }}>{myPostsCount}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Reach Boost ⚡</span>
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
                      {profile.is_pro && <span title="Verified Pro" style={{ color: '#38bdf8', fontSize: '1rem' }}>✓</span>}
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
                <div>📱 <strong style={{ color: '#fff' }}>WhatsApp / Phone:</strong> {profile.phone || 'Not provided'}</div>
                <div>📍 <strong style={{ color: '#fff' }}>City / Location:</strong> {profile.city || 'Pakistan'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📄 <strong style={{ color: '#fff' }}>Linked CV / Resume:</strong>
                  {profile.resume_url ? (
                    <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      View Linked CV ↗
                    </a>
                  ) : (
                    <span style={{ color: '#64748b' }}>No CV uploaded yet</span>
                  )}
                </div>
                <div>💎 <strong style={{ color: '#fff' }}>Account Status:</strong> {profile.is_pro ? <span style={{ color: '#facc15', fontWeight: '800' }}>Shanora PRO (Verified ✓)</span> : 'Standard Member'}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MESSAGES */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Messaging</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Direct 1-on-1 conversations & connections</span>
            </div>

            {activeChatUser ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '520px' }}>
                
                <div style={{ backgroundColor: '#131b2e', padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveChatUser(null)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.4rem 0 0' }}
                    >
                      ←
                    </button>
                    
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem', overflow: 'hidden' }}>
                        {activeChatUser.avatar_url ? (
                          <img src={activeChatUser.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (activeChatUser.full_name || activeChatUser.name || activeChatUser.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      {isUserOnline(activeChatUser.last_seen) && (
                        <div title="Online now" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a' }} />
                      )}
                    </div>

                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>{activeChatUser.full_name || activeChatUser.name || activeChatUser.email.split('@')[0]}</span>
                        {activeChatUser.is_pro && <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isUserOnline(activeChatUser.last_seen) ? '#4ade80' : '#64748b' }}>
                        {isUserOnline(activeChatUser.last_seen) ? 'Active now ●' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <Link href={`/view-profile?email=${encodeURIComponent(activeChatUser.email)}`} style={{ color: '#38bdf8', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '700' }}>
                    Profile ↗
                  </Link>
                </div>

                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.82rem' }}>
                      👋 Start the conversation! Send a message below.
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.sender_email.toLowerCase() === user.email.toLowerCase();
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '75%',
                            backgroundColor: isMe ? '#0284c7' : '#1e293b',
                            color: '#fff',
                            padding: '0.6rem 0.85rem',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            fontSize: '0.83rem',
                            lineHeight: '1.4'
                          }}>
                            <div>{msg.message}</div>
                            <div style={{ fontSize: '0.62rem', color: isMe ? '#bae6fd' : '#94a3b8', textAlign: 'right', marginTop: '0.2rem' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', backgroundColor: '#131b2e', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '24px', padding: '0.55rem 1rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessageText.trim()}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    ➤
                  </button>
                </form>

              </div>
            ) : (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search conversations or people by name.."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {filteredMessengerUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                      Koi user nahi mila. Naam ya email check karein.
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
                          onClick={() => setActiveChatUser(chatTarget)}
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
                              {online && (
                                <div title="Online" style={{ position: 'absolute', bottom: '1px', right: '1px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #131b2e' }} />
                              )}
                            </div>

                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                <span>{displayName}</span>
                                {chatTarget.is_pro && <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>✓</span>}
                              </div>
                              <div style={{ color: lastMsg ? '#cbd5e1' : '#64748b', fontSize: '0.74rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '0.15rem' }}>
                                {lastMsg ? lastMsg.text : (chatTarget.headline || chatTarget.city || 'Shanora Network')}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', color: online ? '#4ade80' : '#64748b', fontWeight: '700' }}>
                              {online ? 'Online ●' : 'Chat 💬'}
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

        {/* TAB 6: MY APPLICATIONS (ENHANCED LIVE TRACKING) */}
        {activeTab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Header */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>My Job Applications</h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time status updates and submission records</span>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Applied</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{myApplicationsList.length}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>In Review</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#facc15' }}>
                  {myApplicationsList.filter(a => !a.status || a.status === 'in_review').length}
                </div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Shortlisted</span>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4ade80' }}>
                  {myApplicationsList.filter(a => a.status === 'shortlisted').length}
                </div>
              </div>
            </div>

            {/* Applications List */}
            {myApplicationsList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>📋</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No job applications submitted yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>Explore open vacancies in the Jobs section and apply with 1-click.</div>
                <button
                  onClick={() => setActiveTab('jobs')}
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Browse Jobs 💼
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {myApplicationsList.map(app => {
                  const job = app.jobs || {};
                  const status = (app.status || 'in_review').toLowerCase();

                  let statusBadge = { text: 'In Review ⏳', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: 'rgba(250, 204, 21, 0.3)' };
                  if (status === 'shortlisted') {
                    statusBadge = { text: 'Shortlisted 🎉', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
                  } else if (status === 'interview') {
                    statusBadge = { text: 'Interview Call 📞', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
                  } else if (status === 'rejected') {
                    statusBadge = { text: 'Not Selected ✕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
                  }

                  return (
                    <div
                      key={app.id}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '14px',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                            {job.title || 'Job Opening'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '700', marginTop: '0.15rem' }}>
                            {job.company_name || 'Hiring Company'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            📍 {job.location || 'Pakistan'} • ⏱️ {job.job_type || 'Full-time'}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                          border: `1px solid ${statusBadge.border}`,
                          flexShrink: 0
                        }}>
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* Cover Note Snippet */}
                      {app.cover_note && (
                        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', padding: '0.65rem 0.8rem', fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                          "{app.cover_note}"
                        </div>
                      )}

                      {/* Footer Info & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.75rem', fontSize: '0.74rem' }}>
                        <span style={{ color: '#64748b' }}>
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {app.resume_link && (
                            <a
                              href={app.resume_link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}
                            >
                              View CV ↗
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleWithdrawApplication(app.id, app.job_id)}
                            disabled={withdrawingAppId === app.id}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {withdrawingAppId === app.id ? 'Canceling...' : 'Withdraw'}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB: NETWORK / FOLLOWERS */}
        {activeTab === 'network' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <button
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

            {networkSubTab === 'followers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followersList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Abhi tak aapka koi follower nahi hai.
                  </div>
                ) : (
                  followersList.map(item => {
                    const email = item.follower_email;
                    const cleanEmail = (email || '').toLowerCase();
                    const username = cleanEmail.split('@')[0];
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
                        gap: '0.8rem'
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
                            flexShrink: 0
                          }}>
                            {(cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Follows you
                            </div>
                          </div>
                        </Link>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
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
                              fontSize: '0.75rem',
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

            {networkSubTab === 'following' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followingList.length === 0 ? (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Aap kisi ko follow nahi kar rahe.
                  </div>
                ) : (
                  followingList.map(item => {
                    const email = item.following_email;
                    const cleanEmail = (email || '').toLowerCase();
                    const username = cleanEmail.split('@')[0];
                    return (
                      <div key={item.id} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem'
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
                            flexShrink: 0
                          }}>
                            {(cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              Following
                            </div>
                          </div>
                        </Link>

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
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Unfollow
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* People You May Know */}
            <div style={{ marginTop: '2.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                  People you may know
                </span>
                <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>
                  Discover
                </span>
              </div>

              {discoverUsers.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Koi naya creator daryaft nahi hua.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {discoverUsers.map(creator => {
                    const cleanEmail = (creator.email || '').toLowerCase();
                    const username = creator.name || cleanEmail.split('@')[0];
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
                        gap: '0.8rem'
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
                            flexShrink: 0
                          }}>
                            {(creator.name || cleanEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {username}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {cleanEmail}
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(cleanEmail)}
                          disabled={actionLoading[cleanEmail]}
                          style={{
                            backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                            color: isFollowing ? '#94a3b8' : '#fff',
                            border: isFollowing ? '1px solid #334155' : 'none',
                            padding: '0.45rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            flexShrink: 0
                          }}
                        >
                          {isFollowing ? 'Following' : '+ Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: PAGES */}
        {activeTab === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>Your Pages ({myPages.length})</h3>
              <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
            </div>

            {myPages.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Aapne abhi tak koi page create nahi kiya.
              </div>
            ) : (
              myPages.map(page => (
                <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem' }}>{page.name}</Link>
                  <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}>Visit</Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0 0.2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Notifications</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Earlier updates & interactions</span>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markNotificationsAsRead} 
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700', padding: '0.3rem 0.5rem', borderRadius: '6px' }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔔</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No notifications yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>When someone follows you or interacts with your posts, you'll see it here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifications.map(n => {
                  const senderEmail = n.sender_email || '';
                  const senderName = n.sender_name || (senderEmail ? senderEmail.split('@')[0] : 'Someone');
                  const targetProfileUrl = senderEmail 
                    ? `/view-profile?email=${encodeURIComponent(senderEmail)}`
                    : (n.sender_name ? `/view-profile?email=${encodeURIComponent(n.sender_name)}` : '#');

                  const createdTime = new Date(n.created_at).getTime();
                  const diffMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
                  let timeLabel = 'Just now';
                  if (diffMinutes >= 1440) {
                    timeLabel = `${Math.floor(diffMinutes / 1440)}d ago`;
                  } else if (diffMinutes >= 60) {
                    timeLabel = `${Math.floor(diffMinutes / 60)}h ago`;
                  } else if (diffMinutes > 0) {
                    timeLabel = `${diffMinutes}m ago`;
                  }

                  return (
                    <Link
                      key={n.id}
                      href={targetProfileUrl}
                      onClick={() => {
                        if (!n.is_read) {
                          supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                        }
                      }}
                      style={{
                        backgroundColor: n.is_read ? '#0f172a' : 'rgba(2, 132, 199, 0.1)',
                        border: n.is_read ? '1px solid #1e293b' : '1px solid rgba(2, 132, 199, 0.35)',
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '1.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #1e293b'
                        }}>
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: n.action_type === 'follow' ? '#0284c7' : (n.action_type === 'like' ? '#38bdf8' : (n.action_type === 'pro' ? '#facc15' : '#22c55e')),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          border: '2px solid #0f172a',
                          color: '#fff'
                        }}>
                          {n.action_type === 'follow' ? '👤' : (n.action_type === 'like' ? '👍' : (n.action_type === 'pro' ? '💎' : '💬'))}
                        </div>
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.35' }}>
                          <strong style={{ color: '#fff', fontWeight: '700' }}>{senderName}</strong> {n.content || 'interacted with you.'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: n.is_read ? '#64748b' : '#38bdf8', marginTop: '0.2rem', fontWeight: n.is_read ? '500' : '700' }}>
                          {timeLabel}
                        </div>
                      </div>

                      {!n.is_read && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          flexShrink: 0
                        }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: JOBS */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0 0.2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>Opportunities & Careers</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Explore internships and full-time roles</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPostJobModal(!showPostJobModal)}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {showPostJobModal ? '✕ Close' : '+ Post a Job'}
              </button>
            </div>

            {showPostJobModal && (
              <form onSubmit={handleCreateJob} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>Post New Opening</h4>
                
                <input
                  type="text"
                  placeholder="Job Title (e.g. Frontend Developer, Video Editor)"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input
                    type="text"
                    placeholder="Company / Page Name"
                    value={jobFormData.company_name}
                    onChange={(e) => setJobFormData({ ...jobFormData, company_name: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Remote, Karachi)"
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <select
                    value={jobFormData.job_type}
                    onChange={(e) => setJobFormData({ ...jobFormData, job_type: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Salary / Stipend (e.g. 50k - 80k PKR)"
                    value={jobFormData.salary_range}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_range: e.target.value })}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                <textarea
                  placeholder="Job brief description and requirements..."
                  rows={3}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
                />

                <button
                  type="submit"
                  disabled={submittingJob}
                  style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: submittingJob ? 'not-allowed' : 'pointer' }}
                >
                  {submittingJob ? 'Publishing...' : 'Publish Vacancy'}
                </button>
              </form>
            )}

            {jobsList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>💼</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No job openings active yet</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Be the first company or creator to post an opening!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {jobsList.map(job => {
                  const isApplied = !!appliedJobsMap[job.id];
                  const isOwner = user?.email && (job.employer_email || '').toLowerCase() === user.email.toLowerCase();

                  return (
                    <div key={job.id} style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '14px',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.7rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>{job.title}</div>
                          <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '600', marginTop: '0.15rem' }}>{job.company_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            📍 {job.location || 'Pakistan'} • ⏱️ {job.job_type || 'Full-time'}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          flexShrink: 0
                        }}>
                          {job.salary_range || 'Market Competitive'}
                        </span>
                      </div>

                      {job.description && (
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {job.description}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.7rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </span>

                        {isOwner ? (
                          <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: '700' }}>Your Listing ✓</span>
                        ) : (
                          <button
                            type="button"
                            disabled={isApplied}
                            onClick={() => openApplyModal(job)}
                            style={{
                              backgroundColor: isApplied ? '#1e293b' : '#0284c7',
                              color: isApplied ? '#94a3b8' : '#fff',
                              border: isApplied ? '1px solid #334155' : 'none',
                              padding: '0.42rem 1.1rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: isApplied ? 'default' : 'pointer'
                            }}
                          >
                            {isApplied ? 'Applied ✓' : 'Easy Apply ⚡'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OTHER SERVICE TABS */}
        {['resume', 'monetization', 'saved', 'settings'].includes(activeTab) && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1.1rem', textTransform: 'capitalize' }}>{activeTab}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>This module is ready for full functional configuration.</p>
          </div>
        )}

      </main>

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
                    placeholder="e.g. Video Editor / Developer"
                    value={editProfileForm.headline}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, headline: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Bio & About You</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of your professional background..."
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Key Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Video Editing, Next.js, SEO, Graphics"
                  value={editProfileForm.skills}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, skills: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>WhatsApp / Contact</label>
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
                    placeholder="e.g. Sukkur, Karachi"
                    value={editProfileForm.city}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, city: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '0.8rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>📄 Resume / CV</label>
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
                    placeholder="Paste Google Drive / LinkedIn CV URL"
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

      {/* POP-UP FORM MODAL (EASY APPLY WITH AUTO-FILL) */}
      {selectedJobForApply && (
        <div 
          onClick={() => setSelectedJobForApply(null)}
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
              maxWidth: '480px',
              padding: '1.4rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Apply for {selectedJobForApply.title}</h3>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{selectedJobForApply.company_name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedJobForApply(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Full Name (Auto-filled)</label>
                <input
                  type="text"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Email Address</label>
                <input
                  type="email"
                  value={applyForm.email}
                  disabled
                  style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#94a3b8', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>WhatsApp / Phone *</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Current City</label>
                  <input
                    type="text"
                    placeholder="e.g. Sukkur, Karachi"
                    value={applyForm.city}
                    onChange={(e) => setApplyForm({ ...applyForm, city: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Experience Level</label>
                <select
                  value={applyForm.experience}
                  onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Fresh Graduate">Fresh Graduate / Student</option>
                  <option value="1-2 Years">1 - 2 Years Experience</option>
                  <option value="3-5 Years">3 - 5 Years Experience</option>
                  <option value="5+ Years">Senior (5+ Years)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Resume / Portfolio Link</label>
                  {profile.resume_url && (
                    <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: '700' }}>Auto-linked from profile ✓</span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Paste Google Drive or LinkedIn CV link"
                  value={applyForm.resume_link}
                  onChange={(e) => setApplyForm({ ...applyForm, resume_link: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Short Note (Optional)</label>
                <textarea
                  placeholder="Why are you suitable for this role?"
                  rows={2}
                  value={applyForm.cover_note}
                  onChange={(e) => setApplyForm({ ...applyForm, cover_note: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedJobForApply(null)}
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApplication}
                  style={{ flex: 2, backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: submittingApplication ? 'not-allowed' : 'pointer' }}
                >
                  {submittingApplication ? 'Submitting...' : 'Submit Application 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
