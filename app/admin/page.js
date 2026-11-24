'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const AUTHORIZED_ADMIN_EMAIL = 'amanullahmahtam7@gmail.com';

const PRIMARY_SECTIONS = [
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'ads', label: 'Ads Manager' },
  { id: 'jobs', label: 'Jobs Manager' },
  { id: 'pro', label: 'Pro Membership' },
  { id: 'resumes', label: 'Resumes / CV' },
  { id: 'monetization', label: 'Monetization' },
  { id: 'reports', label: 'User Reports' },
  { id: 'audit_logs', label: 'Audit Logs' }
];

const SUB_FILTERS = {
  posts: [
    { id: 'all', label: 'All Posts' },
    { id: 'pending', label: 'Pending Verification' },
    { id: 'verified', label: 'Verified Posts' },
    { id: 'reported', label: 'Reported Posts' },
    { id: 'hidden', label: 'Hidden Posts' },
    { id: 'deleted', label: 'Deleted Posts' }
  ],
  comments: [
    { id: 'all', label: 'All Comments' },
    { id: 'reported', label: 'Reported Comments' },
    { id: 'hidden', label: 'Hidden Comments' }
  ],
  accounts: [
    { id: 'all', label: 'All Accounts' },
    { id: 'verified', label: 'Verified' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'banned', label: 'Banned' }
  ],
  ads: [
    { id: 'all', label: 'All Ads' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved / Live' },
    { id: 'paused', label: 'Paused / Rejected' }
  ],
  jobs: [
    { id: 'all', label: 'All Jobs' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved / Live' },
    { id: 'closed', label: 'Closed / Hidden' }
  ],
  pro: [
    { id: 'all', label: 'All Members' },
    { id: 'active_pro', label: 'Active Pro' },
    { id: 'free', label: 'Free Members' }
  ],
  resumes: [
    { id: 'all', label: 'All Resumes' },
    { id: 'verified', label: 'Verified CVs' },
    { id: 'hidden', label: 'Hidden CVs' }
  ],
  monetization: [
    { id: 'all', label: 'All Pages' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'restricted', label: 'Suspended / Rejected' }
  ],
  reports: [
    { id: 'all', label: 'All Reports' },
    { id: 'open', label: 'Open' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'dismissed', label: 'Dismissed' }
  ],
  audit_logs: []
};

export default function MasterAdminPanelPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  // Login State
  const [loginEmail, setLoginEmail] = useState(AUTHORIZED_ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigation & Search
  const [activeSection, setActiveSection] = useState('posts');
  const [subFilter, setSubFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Collections
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [ads, setAds] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pagesList, setPagesList] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Controls
  const [detailModal, setDetailModal] = useState(null);
  const [actionReason, setActionReason] = useState('Reviewed by SHANORA Admin');
  const [suspendDays, setSuspendDays] = useState(7);
  const [proDays, setProDays] = useState(30);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState(null);

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);

  const showBanner = useCallback((text, type = 'success') => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 4500);
  }, []);

  const handleSelectSection = (secId) => {
    setActiveSection(secId);
    setSubFilter('all');
    setSearchTerm('');
    setConfirmPermanentDeleteId(null);
  };

  const loadAllModerationData = useCallback(async () => {
    try {
      const safeQuery = (promise) =>
        Promise.resolve(promise).catch(() => ({ data: [] }));

      const [
        postsRes,
        commentsRes,
        accountsRes,
        adsRes,
        jobsRes,
        pagesRes,
        reportsRes,
        logsRes
      ] = await Promise.all([
        safeQuery(supabase.from('user_posts').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('post_comments').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('advertisements').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('pages').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('content_reports').select('*').order('created_at', { ascending: false }).limit(250)),
        safeQuery(supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(150))
      ]);

      setPosts(Array.isArray(postsRes?.data) ? postsRes.data : []);
      setComments(Array.isArray(commentsRes?.data) ? commentsRes.data : []);
      setAccounts(Array.isArray(accountsRes?.data) ? accountsRes.data : []);
      setAds(Array.isArray(adsRes?.data) ? adsRes.data : []);
      setJobs(Array.isArray(jobsRes?.data) ? jobsRes.data : []);
      setPagesList(Array.isArray(pagesRes?.data) ? pagesRes.data : []);
      setReports(Array.isArray(reportsRes?.data) ? reportsRes.data : []);
      setAuditLogs(Array.isArray(logsRes?.data) ? logsRes.data : []);
    } catch (err) {
      showBanner(`Error loading admin data: ${err.message}`, 'error');
    }
  }, [showBanner]);

  const checkAdminSession = useCallback(async () => {
    setAuthChecking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;
      const user = session?.user || null;

      if (!user) {
        setIsSignedIn(false);
        setIsAdmin(false);
        setCurrentEmail('');
        setSessionToken('');
        setAuthChecking(false);
        return;
      }

      const emailLower = String(user.email || '').trim().toLowerCase();
      setIsSignedIn(true);
      setCurrentEmail(emailLower);
      setSessionToken(session.access_token || '');

      const isAuthorizedEmail = emailLower === AUTHORIZED_ADMIN_EMAIL;
      setIsAdmin(isAuthorizedEmail);
      setAuthChecking(false);

      if (isAuthorizedEmail) {
        await loadAllModerationData();
      }
    } catch {
      setIsSignedIn(false);
      setIsAdmin(false);
      setAuthChecking(false);
    }
  }, [loadAllModerationData]);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const handleGoogleAdminLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (err) {
      setLoginError(err.message || 'Google sign in failed.');
      setLoginLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });
      if (error) throw error;
      await checkAdminSession();
    } catch (err) {
      setLoginError(err.message || 'Sign in failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setIsAdmin(false);
    setCurrentEmail('');
  };

  const runModerationAction = async ({
    targetType,
    targetId,
    action,
    targetEmail = '',
    targetUserId = null,
    extraData = null
  }) => {
    if (!String(actionReason || '').trim()) {
      showBanner('Please enter a moderation reason before taking action.', 'error');
      return;
    }

    if (action === 'permanent_delete' && confirmPermanentDeleteId !== targetId) {
      setConfirmPermanentDeleteId(targetId);
      showBanner('Click "Confirm Delete" again to permanently remove this record.', 'error');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({
          targetType,
          targetId,
          action,
          reason: actionReason.trim(),
          suspendDays: Number(suspendDays || 7),
          targetEmail,
          targetUserId,
          extraData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Moderation request failed');
      }

      setConfirmPermanentDeleteId(null);
      showBanner(data.message || 'Action completed successfully.');
      await loadAllModerationData();
    } catch (err) {
      showBanner(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, nextStatus) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ status: nextStatus })
        .eq('id', reportId);
      if (error) throw error;
      showBanner(`Report marked as ${nextStatus}.`);
      await loadAllModerationData();
    } catch (err) {
      showBanner(err.message || 'Failed to update report.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reportedPostIds = useMemo(
    () => new Set(reports.filter((r) => r.target_type === 'post').map((r) => String(r.target_id))),
    [reports]
  );

  const reportedCommentIds = useMemo(
    () => new Set(reports.filter((r) => r.target_type === 'comment').map((r) => String(r.target_id))),
    [reports]
  );

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesSearch =
        !q ||
        String(p.content || '').toLowerCase().includes(q) ||
        String(p.user_email || '').toLowerCase().includes(q) ||
        String(p.user_name || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (subFilter === 'pending') return !p.is_verified && !p.is_deleted;
      if (subFilter === 'verified') return Boolean(p.is_verified) && !p.is_deleted;
      if (subFilter === 'reported') return reportedPostIds.has(String(p.id));
      if (subFilter === 'hidden') return Boolean(p.is_hidden) && !p.is_deleted;
      if (subFilter === 'deleted') return Boolean(p.is_deleted);
      return true;
    });
  }, [posts, subFilter, searchTerm, reportedPostIds]);

  const filteredComments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return comments.filter((c) => {
      const matchesSearch =
        !q ||
        String(c.comment_text || c.content || '').toLowerCase().includes(q) ||
        String(c.user_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (subFilter === 'reported') return reportedCommentIds.has(String(c.id));
      if (subFilter === 'hidden') return Boolean(c.is_hidden);
      return true;
    });
  }, [comments, subFilter, searchTerm, reportedCommentIds]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      const matchesSearch =
        !q ||
        String(acc.email || '').toLowerCase().includes(q) ||
        String(acc.name || acc.username || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const status = String(acc.account_status || 'active').toLowerCase();
      if (subFilter === 'verified') return Boolean(acc.is_verified);
      if (subFilter === 'suspended') return status === 'suspended';
      if (subFilter === 'banned') return status === 'banned';
      return true;
    });
  }, [accounts, subFilter, searchTerm]);

  const filteredAds = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ads.filter((ad) => {
      const title = String(ad.title || ad.headline || '').toLowerCase();
      const desc = String(ad.description || ad.ad_text || '').toLowerCase();
      const owner = String(ad.user_email || ad.advertiser_email || ad.target_city || '').toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q) || owner.includes(q);
      if (!matchesSearch) return false;

      const status = String(ad.status || 'pending').toLowerCase();
      if (subFilter === 'pending') return status === 'pending';
      if (subFilter === 'approved') return status === 'approved' || status === 'active';
      if (subFilter === 'paused') return status === 'paused' || status === 'rejected';
      return true;
    });
  }, [ads, subFilter, searchTerm]);

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        String(job.title || '').toLowerCase().includes(q) ||
        String(job.company_name || '').toLowerCase().includes(q) ||
        String(job.location || '').toLowerCase().includes(q) ||
        String(job.posted_by_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const status = String(job.status || 'pending').toLowerCase();
      if (subFilter === 'pending') return status === 'pending';
      if (subFilter === 'approved') return status === 'approved' && !job.is_hidden;
      if (subFilter === 'closed') return status === 'closed' || status === 'rejected' || Boolean(job.is_hidden);
      return true;
    });
  }, [jobs, subFilter, searchTerm]);

  const filteredProMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      const matchesSearch =
        !q ||
        String(acc.email || '').toLowerCase().includes(q) ||
        String(acc.name || acc.username || '').toLowerCase().includes(q) ||
        String(acc.pro_plan || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (subFilter === 'active_pro') return Boolean(acc.is_pro);
      if (subFilter === 'free') return !acc.is_pro;
      return true;
    });
  }, [accounts, subFilter, searchTerm]);

  const filteredResumes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      const hasResumeData = Boolean(acc.resume_url || acc.resume_headline || acc.resume_verified || acc.resume_hidden);
      if (!hasResumeData) return false;

      const matchesSearch =
        !q ||
        String(acc.email || '').toLowerCase().includes(q) ||
        String(acc.name || acc.username || '').toLowerCase().includes(q) ||
        String(acc.resume_headline || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (subFilter === 'verified') return Boolean(acc.resume_verified);
      if (subFilter === 'hidden') return Boolean(acc.resume_hidden);
      return true;
    });
  }, [accounts, subFilter, searchTerm]);

  const filteredMonetizationPages = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return pagesList.filter((pg) => {
      const matchesSearch =
        !q ||
        String(pg.name || '').toLowerCase().includes(q) ||
        String(pg.slug || '').toLowerCase().includes(q) ||
        String(pg.owner_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const mStatus = String(pg.monetization_status || 'pending').toLowerCase();
      if (subFilter === 'pending') return mStatus === 'pending';
      if (subFilter === 'approved') return mStatus === 'approved';
      if (subFilter === 'restricted') return mStatus === 'suspended' || mStatus === 'rejected';
      return true;
    });
  }, [pagesList, subFilter, searchTerm]);

  const filteredReports = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return reports.filter((r) => {
      const matchesSearch =
        !q ||
        String(r.target_type || '').toLowerCase().includes(q) ||
        String(r.target_id || '').toLowerCase().includes(q) ||
        String(r.reason || '').toLowerCase().includes(q) ||
        String(r.reporter_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (subFilter === 'all') return true;
      return String(r.status || 'open').toLowerCase() === subFilter;
    });
  }, [reports, subFilter, searchTerm]);

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Verifying administrator access...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem' }}>
        <form onSubmit={handleAdminLogin} style={{ width: '100%', maxWidth: '380px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontWeight: '900', fontSize: '1.05rem', color: '#38bdf8' }}>SHANORA Admin Sign In</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sign in with {AUTHORIZED_ADMIN_EMAIL} to open the Master Admin Panel.</div>
          {loginError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.18)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.55rem 0.7rem', borderRadius: '8px', fontSize: '0.78rem' }}>
              {loginError}
            </div>
          )}
          <button
            type="button"
            disabled={loginLoading}
            onClick={handleGoogleAdminLogin}
            style={{ width: '100%', backgroundColor: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '0.65rem', fontWeight: '800', fontSize: '0.86rem', cursor: 'pointer' }}
          >
            Continue with Google ({AUTHORIZED_ADMIN_EMAIL})
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>OR SIGN IN WITH PASSWORD</div>
          <input
            type="email"
            placeholder="Admin Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#fff', fontSize: '0.84rem', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.75rem', color: '#fff', fontSize: '0.84rem', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={loginLoading}
            style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem', fontWeight: '800', fontSize: '0.86rem', cursor: 'pointer' }}
          >
            {loginLoading ? 'Signing In...' : 'Sign In to Admin'}
          </button>
          <Link href="/feed" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', textDecoration: 'none' }}>
            Return to Feed
          </Link>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Admin Access Required</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
          Signed in as <strong>{currentEmail || 'another user'}</strong>. Only <strong>{AUTHORIZED_ADMIN_EMAIL}</strong> can access this panel.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleSwitchAccount}
            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Switch to {AUTHORIZED_ADMIN_EMAIL}
          </button>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#cbd5e1', textDecoration: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: '700' }}>
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const getCountForSection = (id) => {
    if (id === 'posts') return posts.length;
    if (id === 'comments') return comments.length;
    if (id === 'accounts') return accounts.length;
    if (id === 'ads') return ads.length;
    if (id === 'jobs') return jobs.length;
    if (id === 'pro') return accounts.filter((a) => Boolean(a.is_pro)).length;
    if (id === 'resumes') return accounts.filter((a) => Boolean(a.resume_url || a.resume_headline || a.resume_verified || a.resume_hidden)).length;
    if (id === 'monetization') return pagesList.length;
    if (id === 'reports') return reports.length;
    if (id === 'audit_logs') return auditLogs.length;
    return 0;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '1rem', color: '#38bdf8' }}>SHANORA Master Admin Panel</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{currentEmail}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadAllModerationData}
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
          >
            Refresh
          </button>
          <Link href="/feed" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.78rem', padding: '0.4rem 0.7rem', border: '1px solid #334155', borderRadius: '8px' }}>
            Feed
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '1rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {banner && (
          <div style={{ backgroundColor: banner.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', border: `1px solid ${banner.type === 'error' ? '#ef4444' : '#22c55e'}`, color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700' }}>
            {banner.text}
          </div>
        )}

        {/* Modular Section Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '0.55rem' }}>
          {PRIMARY_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSelectSection(sec.id)}
              style={{
                backgroundColor: activeSection === sec.id ? '#0284c7' : '#0f172a',
                border: `1px solid ${activeSection === sec.id ? '#38bdf8' : '#1e293b'}`,
                borderRadius: '12px',
                padding: '0.7rem 0.8rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: activeSection === sec.id ? '#e0f2fe' : '#94a3b8', fontWeight: '700' }}>
                {sec.label}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', marginTop: '0.18rem' }}>
                {getCountForSection(sec.id)}
              </div>
            </button>
          ))}
        </div>
{/* Action Reason, Duration & Search */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.7rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              Admin Action Reason (Logged Automatically)
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason for action..."
              style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>

          {activeSection === 'accounts' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Temporary Suspension Days
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
                style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {activeSection === 'pro' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Pro Membership Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="3650"
                value={proDays}
                onChange={(e) => setProDays(e.target.value)}
                style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {activeSection !== 'audit_logs' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Search in {PRIMARY_SECTIONS.find((s) => s.id === activeSection)?.label}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search keyword, name, email..."
                style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* Sub-filters */}
        {(SUB_FILTERS[activeSection] || []).length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {SUB_FILTERS[activeSection].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSubFilter(f.id)}
                style={{
                  backgroundColor: subFilter === f.id ? '#38bdf8' : '#0f172a',
                  color: subFilter === f.id ? '#070b14' : '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '999px',
                  padding: '0.38rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ==================== 1. POSTS ==================== */}
        {activeSection === 'posts' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Posts Moderation ({filteredPosts.length})</div>
            {filteredPosts.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No posts found.</div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.86rem' }}>{post.user_name || post.user_email}</span>
                      {post.is_verified && <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>✓ Verified</span>}
                      {post.is_hidden && <span style={{ backgroundColor: 'rgba(217,119,6,0.25)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>HIDDEN</span>}
                      {post.is_deleted && <span style={{ backgroundColor: 'rgba(220,38,38,0.25)', color: '#f87171', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>DELETED</span>}
                    </div>
                    <button type="button" onClick={() => setDetailModal({ title: 'Post Details', item: post })} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Details</button>
                  </div>

                  <div style={{ fontSize: '0.83rem', color: '#cbd5e1' }}>{post.content || '(Media / Attachment Post)'}</div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: post.is_verified ? 'unverify' : 'verify', targetEmail: post.user_email })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {post.is_verified ? 'Remove Verification' : 'Verify Post'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: post.is_hidden ? 'unhide' : 'hide', targetEmail: post.user_email })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {post.is_hidden ? 'Unhide' : 'Hide'}
                    </button>
                    {post.is_deleted ? (
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: 'restore', targetEmail: post.user_email })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                        Restore Post
                      </button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: 'soft_delete', targetEmail: post.user_email })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                        Soft Delete
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: 'warn', targetEmail: post.user_email })} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Warn Owner
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: 'permanent_delete', targetEmail: post.user_email })}
                      style={{ backgroundColor: confirmPermanentDeleteId === post.id ? '#991b1b' : '#1e293b', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {confirmPermanentDeleteId === post.id ? 'Confirm Delete' : 'Permanent Delete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 2. COMMENTS ==================== */}
        {activeSection === 'comments' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Comments Moderation ({filteredComments.length})</div>
            {filteredComments.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No comments found.</div>
            ) : (
              filteredComments.map((c) => (
                <div key={c.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>{c.user_name || c.user_email}</div>
                    <div style={{ fontSize: '0.84rem', color: '#fff', marginTop: '0.2rem' }}>{c.comment_text || c.content}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Hidden: {String(Boolean(c.is_hidden))} • Deleted: {String(Boolean(c.is_deleted))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'comment', targetId: c.id, action: c.is_hidden ? 'unhide_comment' : 'hide_comment', targetEmail: c.user_email })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {c.is_hidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'comment', targetId: c.id, action: 'delete_comment', targetEmail: c.user_email })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Delete
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'comment', targetId: c.id, action: 'warn_commenter', targetEmail: c.user_email })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Warn User
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
)}

        {/* ==================== 3. ACCOUNTS ==================== */}
        {activeSection === 'accounts' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Accounts Management ({filteredAccounts.length})</div>
            {filteredAccounts.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No accounts found.</div>
            ) : (
              filteredAccounts.map((acc) => (
                <div key={acc.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>
                      {acc.name || acc.email} {acc.is_verified ? '• ✓ Verified' : ''}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {acc.email} • Status: <strong>{acc.account_status || 'active'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: acc.is_verified ? 'unverify_account' : 'verify_account', targetEmail: acc.email })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {acc.is_verified ? 'Remove Verification' : 'Verify Account'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: 'warn_account', targetEmail: acc.email })} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Send Warning
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: 'suspend', targetEmail: acc.email })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Suspend ({suspendDays}d)
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: 'ban', targetEmail: acc.email })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Ban Permanently
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: 'reactivate', targetEmail: acc.email })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      Reactivate
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`Confirm account deletion mark for ${acc.email || acc.id}?`)) return;
                        runModerationAction({ targetType: 'account', targetId: acc.id, action: 'delete_account', targetEmail: acc.email });
                      }}
                      style={{ backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 4. ADS MANAGER ==================== */}
        {activeSection === 'ads' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Ads Management ({filteredAds.length})</div>
              <Link href="/ads-manager" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.38rem 0.75rem', borderRadius: '8px', fontSize: '0.74rem', fontWeight: '700' }}>
                + Create Ad
              </Link>
            </div>
            {filteredAds.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No advertisements found.</div>
            ) : (
              filteredAds.map((ad) => {
                const status = String(ad.status || 'pending').toLowerCase();
                return (
                  <div key={ad.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#fff' }}>{ad.title || ad.headline || 'Untitled Ad'}</span>
                        <span style={{ backgroundColor: status === 'approved' || status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)', color: status === 'approved' || status === 'active' ? '#4ade80' : '#facc15', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                      <button type="button" onClick={() => setDetailModal({ title: 'Advertisement Details', item: ad })} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Details</button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{ad.description || ad.ad_text || ''}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      City: {ad.target_city || 'All Pakistan'} • Window: {ad.start_date || 'Immediate'} to {ad.end_date || 'No End Date'} • Impressions: {ad.impressions || 0} • Clicks: {ad.clicks || 0}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'ad', targetId: ad.id, action: 'approve_ad' })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Approve & Go Live</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'ad', targetId: ad.id, action: 'pause_ad' })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Pause Ad</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'ad', targetId: ad.id, action: 'reject_ad' })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Reject Ad</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'ad', targetId: ad.id, action: 'extend_ad_7d', extraData: { currentEndDate: ad.end_date } })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Extend +7 Days</button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runModerationAction({ targetType: 'ad', targetId: ad.id, action: 'permanent_delete' })}
                        style={{ backgroundColor: confirmPermanentDeleteId === ad.id ? '#991b1b' : '#1e293b', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {confirmPermanentDeleteId === ad.id ? 'Confirm Delete' : 'Delete Ad'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
{/* ==================== 5. JOBS MANAGER ==================== */}
        {activeSection === 'jobs' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Jobs Management ({filteredJobs.length})</div>
            {filteredJobs.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No job listings found.</div>
            ) : (
              filteredJobs.map((job) => {
                const status = String(job.status || 'pending').toLowerCase();
                return (
                  <div key={job.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#fff' }}>{job.title}</span>
                        {job.is_verified && <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>✓ Verified Job</span>}
                        <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>{status.toUpperCase()}</span>
                      </div>
                      <button type="button" onClick={() => setDetailModal({ title: 'Job Details', item: job })} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Details</button>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      Company: {job.company_name || 'N/A'} • Location: {job.location || 'Pakistan'} • Type: {job.job_type || 'Full-time'}
                    </div>
                    {job.description && <div style={{ fontSize: '0.81rem', color: '#cbd5e1' }}>{job.description}</div>}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'job', targetId: job.id, action: 'approve_job' })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Approve Job</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'job', targetId: job.id, action: job.is_verified ? 'unverify_job' : 'verify_job' })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>{job.is_verified ? 'Remove Verified' : 'Verify Job'}</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'job', targetId: job.id, action: 'close_job' })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Close Job</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'job', targetId: job.id, action: job.is_hidden ? 'unhide_job' : 'hide_job' })} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>{job.is_hidden ? 'Unhide' : 'Hide'}</button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runModerationAction({ targetType: 'job', targetId: job.id, action: 'permanent_delete' })}
                        style={{ backgroundColor: confirmPermanentDeleteId === job.id ? '#991b1b' : '#1e293b', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {confirmPermanentDeleteId === job.id ? 'Confirm Delete' : 'Delete Job'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ==================== 6. PRO MEMBERSHIP ==================== */}
        {activeSection === 'pro' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Pro Membership Management ({filteredProMembers.length})</div>
            {filteredProMembers.map((acc) => (
              <div key={acc.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>
                    {acc.name || acc.email} {acc.is_pro ? '• ⭐ PRO MEMBER' : '• Free'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {acc.email} • Plan: <strong>{acc.pro_plan || 'free'}</strong>
                    {acc.pro_expires_at ? ` • Expires: ${new Date(acc.pro_expires_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runModerationAction({ targetType: 'pro', targetId: acc.id, action: 'grant_pro', targetEmail: acc.email, extraData: { proDays: Number(proDays || 30), plan: 'pro_admin_grant' } })}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Grant Pro ({proDays}d)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runModerationAction({ targetType: 'pro', targetId: acc.id, action: 'revoke_pro', targetEmail: acc.email })}
                    style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Revoke Pro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== 7. RESUMES / CV ==================== */}
        {activeSection === 'resumes' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Resumes / CV Moderation ({filteredResumes.length})</div>
            {filteredResumes.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No resume records found yet.</div>
            ) : (
              filteredResumes.map((acc) => (
                <div key={acc.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>
                        {acc.name || acc.email} {acc.resume_verified ? '• ✓ Verified CV' : ''} {acc.resume_hidden ? '• HIDDEN' : ''}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {acc.email} • Headline: {acc.resume_headline || 'Not specified'}
                      </div>
                    </div>
                    {acc.resume_url && (
                      <a href={acc.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.32rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                        Open CV
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'resume', targetId: acc.id, action: acc.resume_verified ? 'unverify_resume' : 'verify_resume', targetEmail: acc.email })} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {acc.resume_verified ? 'Unverify CV' : 'Verify CV'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'resume', targetId: acc.id, action: acc.resume_hidden ? 'unhide_resume' : 'hide_resume', targetEmail: acc.email })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                      {acc.resume_hidden ? 'Unhide CV' : 'Hide CV'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 8. MONETIZATION ==================== */}
        {activeSection === 'monetization' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Page Monetization Approvals ({filteredMonetizationPages.length})</div>
            {filteredMonetizationPages.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No pages found for monetization review.</div>
            ) : (
              filteredMonetizationPages.map((pg) => {
                const mStatus = String(pg.monetization_status || 'pending').toLowerCase();
                return (
                  <div key={pg.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>
                          {pg.name || pg.slug || pg.id} • <span style={{ color: mStatus === 'approved' ? '#4ade80' : '#facc15' }}>{mStatus.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Owner: {pg.owner_email || 'N/A'}</div>
                      </div>
                      <button type="button" onClick={() => setDetailModal({ title: 'Page Monetization Details', item: pg })} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Details</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'monetization', targetId: pg.id, action: 'approve_monetization', targetEmail: pg.owner_email })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Approve Monetization</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'monetization', targetId: pg.id, action: 'reject_monetization', targetEmail: pg.owner_email })} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Reject</button>
                      <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'monetization', targetId: pg.id, action: 'suspend_monetization', targetEmail: pg.owner_email })} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Suspend</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ==================== 9. USER REPORTS ==================== */}
        {activeSection === 'reports' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Submitted Content Reports ({filteredReports.length})</div>
            {filteredReports.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No reports found.</div>
            ) : (
              filteredReports.map((rep) => (
                <div key={rep.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#38bdf8' }}>
                      {String(rep.target_type || '').toUpperCase()} • ID: {rep.target_id} • Status: {String(rep.status || 'open').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '0.2rem' }}>Reason: {rep.reason}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Reporter: {rep.reporter_email || 'Anonymous'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button type="button" disabled={busy} onClick={() => handleUpdateReportStatus(rep.id, 'resolved')} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Resolve</button>
                    <button type="button" disabled={busy} onClick={() => handleUpdateReportStatus(rep.id, 'dismissed')} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>Dismiss</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 10. AUDIT LOGS ==================== */}
        {activeSection === 'audit_logs' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Admin Action Audit Trail ({auditLogs.length})</div>
            {auditLogs.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No audit logs recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.7rem', fontSize: '0.76rem', color: '#cbd5e1' }}>
                  <strong>{log.action}</strong> on <code>{log.target_type}:{log.target_id}</code> • Reason: <em>{log.reason}</em> • {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                </div>
              ))
            )}
          </div>
        )}

        {/* UNIVERSAL DETAILS MODAL */}
        {detailModal && (
          <div onClick={() => setDetailModal(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '1.2rem', maxWidth: '540px', width: '100%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{detailModal.title}</strong>
                <button type="button" onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
              </div>
              <pre style={{ margin: 0, backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '8px', fontSize: '0.74rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(detailModal.item, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
                      }
