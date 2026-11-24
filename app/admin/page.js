'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const MODERATION_CENTER_VIEWS = [
  { id: 'all_posts', label: 'All Posts' },
  { id: 'pending_verification', label: 'Pending Verification' },
  { id: 'verified_posts', label: 'Verified Posts' },
  { id: 'reported_posts', label: 'Reported Posts' },
  { id: 'hidden_posts', label: 'Hidden Posts' },
  { id: 'deleted_posts', label: 'Deleted Posts' },
  { id: 'all_comments', label: 'All Comments' },
  { id: 'reported_comments', label: 'Reported Comments' },
  { id: 'suspended_accounts', label: 'Suspended Accounts' },
  { id: 'banned_accounts', label: 'Banned Accounts' }
];

const CONFIGURED_ADMIN_EMAIL = String(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

export default function MasterAdminPanelPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionToken, setSessionToken] = useState('');

  // Direct Admin Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [section, setSection] = useState('moderation_center');
  const [centerView, setCenterView] = useState('all_posts');
  const [searchTerm, setSearchTerm] = useState('');

  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  const [actionReason, setActionReason] = useState('Reviewed by SHANORA Moderation Team');
  const [suspendDays, setSuspendDays] = useState(7);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState(null);

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);

  const showBanner = useCallback((text, type = 'success') => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 4500);
  }, []);

  const loadAllModerationData = useCallback(async () => {
    try {
      const [postsRes, accountsRes, commentsRes, reportsRes, logsRes] = await Promise.all([
        supabase.from('user_posts').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('post_comments').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('content_reports').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      setPosts(Array.isArray(postsRes?.data) ? postsRes.data : []);
      setAccounts(Array.isArray(accountsRes?.data) ? accountsRes.data : []);
      setComments(Array.isArray(commentsRes?.data) ? commentsRes.data : []);
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
        setSessionToken('');
        setAuthChecking(false);
        return;
      }

      setIsSignedIn(true);
      setSessionToken(session.access_token || '');

      const userEmailLower = String(user.email || '').toLowerCase();
      const matchesEnvAdmin = Boolean(CONFIGURED_ADMIN_EMAIL && userEmailLower === CONFIGURED_ADMIN_EMAIL);

      let rpcAdmin = false;
      try {
        const { data: adminCheck } = await supabase.rpc('is_shanora_admin');
        rpcAdmin = Boolean(adminCheck);
      } catch {
        rpcAdmin = false;
      }

      let profileAdmin = false;
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .maybeSingle();
        profileAdmin =
          Boolean(prof?.is_admin) ||
          ['admin', 'super_admin'].includes(String(prof?.role || '').toLowerCase());
      } catch {
        profileAdmin = false;
      }

      const authorized = rpcAdmin || profileAdmin || matchesEnvAdmin;
      setIsAdmin(authorized);
      setAuthChecking(false);

      if (authorized) {
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

  const runModerationAction = async ({
    targetType,
    targetId,
    action,
    targetEmail = '',
    targetUserId = null
  }) => {
    if (!String(actionReason || '').trim()) {
      showBanner('Please enter a moderation reason before taking action.', 'error');
      return;
    }

    if (action === 'permanent_delete' && confirmPermanentDeleteId !== targetId) {
      setConfirmPermanentDeleteId(targetId);
      showBanner('Click "Confirm Permanent Delete" again to permanently remove this record.', 'error');
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
          targetUserId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Moderation request failed');
      }

      setConfirmPermanentDeleteId(null);
      showBanner(data.message || 'Moderation action completed.');
      await loadAllModerationData();
    } catch (err) {
      showBanner(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const reportedPostIds = useMemo(() => {
    return new Set(
      reports.filter((r) => r.target_type === 'post').map((r) => String(r.target_id))
    );
  }, [reports]);

  const reportedCommentIds = useMemo(() => {
    return new Set(
      reports.filter((r) => r.target_type === 'comment').map((r) => String(r.target_id))
    );
  }, [reports]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesSearch =
        !q ||
        String(p.content || '').toLowerCase().includes(q) ||
        String(p.user_email || '').toLowerCase().includes(q) ||
        String(p.user_name || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (centerView === 'pending_verification') return !p.is_verified && !p.is_deleted;
      if (centerView === 'verified_posts') return Boolean(p.is_verified) && !p.is_deleted;
      if (centerView === 'reported_posts') return reportedPostIds.has(String(p.id));
      if (centerView === 'hidden_posts') return Boolean(p.is_hidden) && !p.is_deleted;
      if (centerView === 'deleted_posts') return Boolean(p.is_deleted);
      return true;
    });
  }, [posts, centerView, searchTerm, reportedPostIds]);

  const filteredComments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return comments.filter((c) => {
      const matchesSearch =
        !q ||
        String(c.comment_text || c.content || '').toLowerCase().includes(q) ||
        String(c.user_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (centerView === 'reported_comments') return reportedCommentIds.has(String(c.id));
      return true;
    });
  }, [comments, centerView, searchTerm, reportedCommentIds]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      const matchesSearch =
        !q ||
        String(acc.email || '').toLowerCase().includes(q) ||
        String(acc.name || acc.username || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (section === 'moderation_center' && centerView === 'suspended_accounts') {
        return String(acc.account_status || '').toLowerCase() === 'suspended';
      }
      if (section === 'moderation_center' && centerView === 'banned_accounts') {
        return String(acc.account_status || '').toLowerCase() === 'banned';
      }
      return true;
    });
  }, [accounts, section, centerView, searchTerm]);

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
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sign in with your authorized administrator account.</div>
          {loginError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.18)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.55rem 0.7rem', borderRadius: '8px', fontSize: '0.78rem' }}>
              {loginError}
            </div>
          )}
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
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Admin Access Required</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          Only authorized SHANORA administrators can access the Master Admin Panel.
        </p>
        <Link href="/feed" style={{ backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: '700' }}>
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontWeight: '900', fontSize: '1rem', color: '#38bdf8' }}>
          SHANORA Master Admin Panel
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/feed" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.8rem', padding: '0.4rem 0.7rem', border: '1px solid #334155', borderRadius: '8px' }}>
            Feed
          </Link>
          <Link href="/ads-manager" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.8rem', padding: '0.4rem 0.7rem', border: '1px solid #334155', borderRadius: '8px' }}>
            Ads Manager
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '1.2rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {banner && (
          <div style={{ backgroundColor: banner.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', border: `1px solid ${banner.type === 'error' ? '#ef4444' : '#22c55e'}`, color: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700' }}>
            {banner.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', backgroundColor: '#0f172a', padding: '0.45rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          {[
            { id: 'moderation_center', label: 'Content Moderation Center' },
            { id: 'accounts', label: `Accounts (${accounts.length})` },
            { id: 'audit_logs', label: `Audit Logs (${auditLogs.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              style={{
                flex: '1 1 160px',
                backgroundColor: section === tab.id ? '#0284c7' : 'transparent',
                color: section === tab.id ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 0.8rem',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Moderation Reason (Logged in Audit Trail)</label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Reason for moderation action"
              style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Temporary Suspension Days</label>
            <input
              type="number"
              min="1"
              max="365"
              value={suspendDays}
              onChange={(e) => setSuspendDays(e.target.value)}
              style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Search Records</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, email, post, comment..."
              style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {section === 'moderation_center' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {MODERATION_CENTER_VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setCenterView(v.id)}
                  style={{
                    backgroundColor: centerView === v.id ? '#38bdf8' : '#0f172a',
                    color: centerView === v.id ? '#070b14' : '#cbd5e1',
                    border: '1px solid #334155',
                    borderRadius: '999px',
                    padding: '0.38rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {(centerView === 'all_comments' || centerView === 'reported_comments') && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Comment Moderation</div>
                {filteredComments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>{c.user_name || c.user_email}</div>
                      <div style={{ fontSize: '0.84rem', color: '#fff', marginTop: '0.2rem' }}>{c.comment_text || c.content}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Hidden: {String(Boolean(c.is_hidden))} • Deleted: {String(Boolean(c.is_deleted))}
                      </div>
          </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                ))}
              </div>
            )}

            {(centerView === 'suspended_accounts' || centerView === 'banned_accounts') && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Filtered Accounts</div>
                {filteredAccounts.map((acc) => (
                  <div key={acc.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>{acc.name || acc.email}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Status: {acc.account_status} • Reason: {acc.moderation_reason || 'None'}</div>
                    </div>
                    <button type="button" disabled={busy} onClick={() => runModerationAction({ targetType: 'account', targetId: acc.id, action: 'reactivate', targetEmail: acc.email })} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.7rem', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer' }}>
                      Reactivate
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!['all_comments', 'reported_comments', 'suspended_accounts', 'banned_accounts'].includes(centerView) && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Posts Moderation ({filteredPosts.length})</div>
                {filteredPosts.map((post) => (
                  <div key={post.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.86rem' }}>{post.user_name || post.user_email}</span>
                        {post.is_verified && (
                          <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                            ✓ Verified Post
                          </span>
                        )}
                        {post.is_hidden && (
                          <span style={{ backgroundColor: 'rgba(217,119,6,0.25)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                            HIDDEN
                          </span>
                        )}
                        {post.is_deleted && (
                          <span style={{ backgroundColor: 'rgba(220,38,38,0.25)', color: '#f87171', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                            DELETED
                          </span>
                        )}
                      </div>
                      <button type="button" onClick={() => setSelectedPostDetail(post)} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                        Details
                      </button>
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
                        Send Warning
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runModerationAction({ targetType: 'post', targetId: post.id, action: 'permanent_delete', targetEmail: post.user_email })}
                        style={{ backgroundColor: confirmPermanentDeleteId === post.id ? '#991b1b' : '#1e293b', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {confirmPermanentDeleteId === post.id ? 'Confirm Permanent Delete' : 'Permanent Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'accounts' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Registered Accounts</div>
            {filteredAccounts.map((acc) => (
              <div key={acc.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem' }}>
                    {acc.name || acc.email} {acc.is_verified ? '• ✓ Verified Account' : ''}
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
            ))}
          </div>
        )}

        {section === 'audit_logs' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Admin Action Audit Trail</div>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.7rem', fontSize: '0.76rem', color: '#cbd5e1' }}>
                <strong>{log.action}</strong> on <code>{log.target_type}:{log.target_id}</code> • Reason: <em>{log.reason}</em> • {new Date(log.created_at).toLocaleString()}
              </div>
            ))}
          </div>
        )}

        {selectedPostDetail && (
          <div onClick={() => setSelectedPostDetail(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '1.2rem', maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem' }}>Complete Post Details</strong>
                <button type="button" onClick={() => setSelectedPostDetail(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {selectedPostDetail.id}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Author: {selectedPostDetail.user_name} ({selectedPostDetail.user_email})</div>
              <div style={{ fontSize: '0.84rem', color: '#fff', backgroundColor: '#131b2e', padding: '0.75rem', borderRadius: '8px' }}>
                {selectedPostDetail.content || '(No text content)'}
              </div>
              {selectedPostDetail.image_url && (
                <img src={selectedPostDetail.image_url} alt="Post attachment" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
            }
