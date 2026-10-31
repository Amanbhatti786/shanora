'use client';
import { Suspense, useState, useEffect } from 'react';
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
    headline: '',
    bio: '',
    skills: '',
    avatar_url: '',
    cv_file_url: '',
    resume_url: '',
    is_available_for_hire: true,
    is_pro: false
  });

  // Profile Edit Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: '',
    phone: '',
    city: 'Pakistan',
    headline: '',
    bio: '',
    skills: '',
    avatar_url: '',
    cv_file_url: '',
    resume_url: '',
    is_available_for_hire: true
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
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
  const [followingMap, setFollowingMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Jobs States
  const [jobsList, setJobsList] = useState([]);
  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [myApplicationsList, setMyApplicationsList] = useState([]);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
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

        // 1. Fetch Profile
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
          headline: profileData?.headline || 'Professional & Creator on Shanora.pk',
          bio: profileData?.bio || 'Passionate creator & professional on Shanora.pk',
          skills: profileData?.skills || '',
          avatar_url: profileData?.avatar_url || '',
          cv_file_url: profileData?.cv_file_url || '',
          resume_url: profileData?.resume_url || profileData?.resume_link || '',
          is_available_for_hire: profileData?.is_available_for_hire ?? true,
          is_pro: !!profileData?.is_pro
        };

        setProfile(defaultProfile);
        setEditProfileForm({
          full_name: defaultProfile.full_name,
          phone: defaultProfile.phone,
          city: defaultProfile.city,
          headline: defaultProfile.headline,
          bio: defaultProfile.bio,
          skills: defaultProfile.skills,
          avatar_url: defaultProfile.avatar_url,
          cv_file_url: defaultProfile.cv_file_url,
          resume_url: defaultProfile.resume_url,
          is_available_for_hire: defaultProfile.is_available_for_hire
        });

        // 2. Fetch Latest Pro Request
        const { data: proReqData } = await supabase
          .from('pro_requests')
          .select('*')
          .ilike('user_email', myEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (proReqData) setLatestProRequest(proReqData);

        // 3. Fetch User Posts Count
        const { count: postsCount } = await supabase
          .from('user_posts')
          .select('id', { count: 'exact', head: true })
          .ilike('user_email', myEmail);

        if (postsCount !== null) setMyPostsCount(postsCount);

        // 4. Fetch Pages
        const { data: pagesData } = await supabase
          .from('pages')
          .select('*')
          .ilike('owner_email', myEmail)
          .order('created_at', { ascending: false });

        if (pagesData) setMyPages(pagesData);

        // 5. Fetch Followers & Following
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

        // 6. Fetch Discover Users
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .limit(50);

        let discoveredList = [];
        if (allProfiles && allProfiles.length > 0) {
          discoveredList = allProfiles
            .filter(p => {
              const pEmail = (p.email || '').toLowerCase();
              return pEmail && pEmail !== myEmail && !curMap[pEmail];
            })
            .map(p => ({
              id: p.id || p.email,
              name: p.full_name || p.name || (p.email ? p.email.split('@')[0] : 'User'),
              email: p.email,
              avatar_url: p.avatar_url || null
            }));
        }

        if (discoveredList.length === 0) {
          const { data: postUsers } = await supabase
            .from('user_posts')
            .select('user_email, user_name')
            .limit(30);

          if (postUsers) {
            const uniqueUsers = {};
            postUsers.forEach(u => {
              const uEmail = (u.user_email || '').toLowerCase();
              if (uEmail && uEmail !== myEmail && !curMap[uEmail] && !uniqueUsers[uEmail]) {
                uniqueUsers[uEmail] = {
                  id: uEmail,
                  name: u.user_name || uEmail.split('@')[0],
                  email: uEmail,
                  avatar_url: null
                };
              }
            });
            discoveredList = Object.values(uniqueUsers);
          }
        }

        setDiscoverUsers(discoveredList);

        // 7. Fetch Notifications
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

        // 8. Fetch Jobs & User Applications
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

  // Upload Avatar File Handler (Base64
