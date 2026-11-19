'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const RTL_LANGUAGES = new Set(['ur', 'sd', 'ar']);

export default function ProfessionalSettingsHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('account');
  const [categoryHistory, setCategoryHistory] = useState(['account']);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [metaStats, setMetaStats] = useState({
    is_monetized: false,
    wallet_balance: 0,
    subscription_tier: 'free',
    verification_status: 'unverified'
  });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    country: 'Pakistan',
    city: '',
    target_role: '',
    expected_salary: '',
    relocate_ok: false,
    headline: '',
    bio: '',
    company_name: '',
    company_website: '',
    profile_visibility: 'public',
    messaging_permission: 'everyone',
    online_status: true,
    read_receipts: true,
    email_notifications: true,
    push_notifications: true,
    job_alerts: true,
    theme_mode: 'dark',
    app_language: 'en',
    feed_sort: 'recent',
    video_autoplay: true,
    high_contrast: true,
    open_to_work: true,
    remote_work: true
  });

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const showCardMessage = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4200);
  }, []);

  const applyDocumentPreferences = useCallback((themeMode, langCode, highContrast) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', themeMode || 'dark');
    document.documentElement.setAttribute('lang', langCode || 'en');
    document.documentElement.setAttribute('dir', RTL_LANGUAGES.has(langCode) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
  }, []);

  useEffect(() => {
    let active = true;
    async function initSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/auth');
        return;
      }
      if (!active) return;
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', session.user.email)
        .maybeSingle();

      if (profile && active) {
        const nextForm = {
          full_name: profile.full_name || profile.name || '',
          username: profile.username || session.user.email.split('@')[0],
          phone: profile.phone || '',
          country: profile.country || 'Pakistan',
          city: profile.city || '',
          target_role: profile.target_role || '',
          expected_salary: profile.expected_salary || '',
          relocate_ok: Boolean(profile.relocate_ok),
          headline: profile.headline || '',
          bio: profile.bio || '',
          company_name: profile.company_name || '',
          company_website: profile.company_website || '',
          profile_visibility: profile.profile_visibility || 'public',
          messaging_permission: profile.messaging_permission || 'everyone',
          online_status: profile.online_status ?? true,
          read_receipts: profile.read_receipts ?? true,
          email_notifications: profile.email_notifications ?? true,
          push_notifications: profile.push_notifications ?? true,
          job_alerts: profile.job_alerts ?? true,
          theme_mode: profile.theme_mode || 'dark',
          app_language: profile.app_language || 'en',
          feed_sort: profile.feed_sort || 'recent',
          video_autoplay: profile.video_autoplay ?? true,
          high_contrast: true,
          open_to_work: profile.open_to_work ?? true,
          remote_work: profile.remote_work ?? true
        };

        setFormData(nextForm);
        setMetaStats({
          is_monetized: Boolean(profile.is_monetized),
          wallet_balance: Number(profile.wallet_balance || 0),
          subscription_tier: profile.subscription_tier || profile.plan || 'free',
          verification_status:
            profile.is_verified || profile.verified
              ? 'verified'
              : profile.verification_status || 'unverified'
        });
        applyDocumentPreferences(nextForm.theme_mode, nextForm.app_language, nextForm.high_contrast);
      }
      if (active) setLoading(false);
    }
    initSettings();
    return () => {
      active = false;
    };
  }, [router, applyDocumentPreferences]);

  function handleCategoryChange(nextCat) {
    if (nextCat === activeCategory) return;
    setCategoryHistory((prev) => [...prev, nextCat]);
    setActiveCategory(nextCat);
    if (typeof window !== 'undefined') {
      window.history.pushState({ settingsCat: nextCat }, '');
    }
  }

  const handleBackAction = useCallback(() => {
    if (categoryHistory.length > 1) {
      const updated = categoryHistory.slice(0, -1);
      const prevCat = updated[updated.length - 1];
      setCategoryHistory(updated);
      setActiveCategory(prevCat);
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin)
    ) {
      router.back();
    } else {
      router.push('/profile?tab=menu');
    }
  }, [categoryHistory, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      if (categoryHistory.length > 1) {
        const updated = categoryHistory.slice(0, -1);
        setCategoryHistory(updated);
        setActiveCategory(updated[updated.length - 1]);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [categoryHistory]);

  async function persistProfileFields(partialFields, label) {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        ...partialFields,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .ilike('email', user.email);

      if (error) throw error;
      showCardMessage(`${label} saved successfully! ✓`, 'success');
    } catch (err) {
      showCardMessage('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(sectionName) {
    const payload = {
      full_name: formData.full_name,
      name: formData.full_name,
      username: formData.username,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      target_role: formData.target_role,
      expected_salary: formData.expected_salary,
      relocate_ok: formData.relocate_ok,
      headline: formData.headline,
      bio: formData.bio,
      company_name: formData.company_name,
      company_website: formData.company_website,
      profile_visibility: formData.profile_visibility,
      messaging_permission: formData.messaging_permission,
      online_status: formData.online_status,
      read_receipts: formData.read_receipts,
      email_notifications: formData.email_notifications,
      push_notifications: formData.push_notifications,
      job_alerts: formData.job_alerts,
      theme_mode: formData.theme_mode,
      app_language: formData.app_language,
      feed_sort: formData.feed_sort,
      video_autoplay: formData.video_autoplay,
      open_to_work: formData.open_to_work,
      remote_work: formData.remote_work
    };

    applyDocumentPreferences(formData.theme_mode, formData.app_language, formData.high_contrast);
    await persistProfileFields(payload, sectionName);
  }

  async function handleRequestVerification() {
    if (!user) return;
    if (!formData.company_name.trim()) {
      showCardMessage('Please enter your Company Name first.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: formData.company_name.trim(),
          company_website: formData.company_website.trim() || null,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .ilike('email', user.email);

      if (error) throw error;
      setMetaStats((prev) => ({ ...prev, verification_status: 'pending' }));
      showCardMessage('Company verification request submitted for review!', 'success');
    } catch (err) {
      showCardMessage('Verification request failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showCardMessage('Password must be at least 6 characters.', 'error');
      return;
    }
    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showCardMessage('Password updated securely via Supabase Auth!', 'success');
      setNewPassword('');
    } catch (err) {
      showCardMessage('Password update failed: ' + err.message, 'error');
    } finally {
      setPasswordUpdating(false);
    }
  }

  async function handleSignOutAllDevices() {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      router.replace('/auth');
    } catch (err) {
      showCardMessage('Session sign-out failed: ' + err.message, 'error');
    }
  }

  async function handleExportArchive() {
    if (!user) return;
    setExportingData(true);
    try {
      const [{ data: prof }, { data: apps }] = await Promise.all([
        supabase.from('profiles').select('*').ilike('email', user.email).maybeSingle(),
        supabase.from('job_applications').select('*').ilike('applicant_email', user.email)
      ]);

      const archive = {
        exported_at: new Date().toISOString(),
        account_email: user.email,
        profile: prof || {},
        job_applications: apps || []
      };

      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shanora-data-archive-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showCardMessage('Data archive downloaded (.json)!', 'success');
    } catch (err) {
      showCardMessage('Export failed: ' + err.message, 'error');
    } finally {
      setExportingData(false);
    }
  }

  async function handleSupportSubmit() {
    if (!supportSubject.trim() || !supportMsg.trim()) {
      showCardMessage('Please enter both subject and message.', 'error');
      return;
    }
    setSubmittingSupport(true);
    const ticketId = '#SH-' + Math.floor(Math.random() * 90000 + 10000);
    try {
      await supabase.from('notifications').insert([
        {
          recipient_email: user.email.toLowerCase(),
          sender_name: 'SHANORA Support',
          sender_email: user.email.toLowerCase(),
          action_type: 'support_ticket',
          content: `Ticket ${ticketId} received: ${supportSubject.trim()} — ${supportMsg.trim()}`,
          is_read: false
        }
      ]);
      showCardMessage(`Support ticket ${ticketId} submitted!`, 'success');
      setSupportSubject('');
      setSupportMsg('');
    } catch (err) {
      showCardMessage('Ticket error: ' + err.message, 'error');
    } finally {
      setSubmittingSupport(false);
    }
  }

  async function handleRequestAccountDeletion() {
    if (!user) return;
    if (!confirm('Request account deactivation/deletion for your SHANORA account?')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'deletion_requested', updated_at: new Date().toISOString() })
        .ilike('email', user.email);

      if (error) throw error;
      showCardMessage('Account deletion request recorded. Support will confirm via email.', 'success');
    } catch (err) {
      showCardMessage('Request failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading SHANORA Settings Hub...
      </div>
    );
  }

  const sections = [
    { id: 'account', label: '1. Account Settings', icon: '⚙️' },
    { id: 'personal', label: '2. Personal Information', icon: '👤' },
    { id: 'profile', label: '3. Profile Customization', icon: '🎨' },
    { id: 'privacy', label: '4. Privacy & Visibility', icon: '🔒' },
    { id: 'security', label: '5. Account Security & 2FA', icon: '🛡️' },
    { id: 'notifications', label: '6. Notification Preferences', icon: '🔔' },
    { id: 'appearance', label: '7. Appearance & Theme', icon: '🌙' },
    { id: 'language', label: '8. Language & Region', icon: '🌍' },
    { id: 'feed', label: '9. Feed Preferences', icon: '📰' },
    { id: 'messaging', label: '10. Messaging Controls', icon: '💬' },
    { id: 'accessibility', label: '11. Accessibility', icon: '♿' },
    { id: 'data', label: '12. Data & Export Archive', icon: '📁' },
    { id: 'ads', label: '13. Ads & Monetization', icon: '💰' },
    { id: 'jobs', label: '14. Jobs & Career Hub', icon: '💼' },
    { id: 'support', label: '15. Help & Support Center', icon: '❓' },
    { id: 'management', label: '16. Account Management', icon: '⚠️' }
  ];

  const cardStyle = {
    backgroundColor: '#131b2e',
    padding: '0.8rem 0.95rem',
    borderRadius: '10px',
    border: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.7rem',
    color: '#fff',
    fontSize: '0.82rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const primaryBtnStyle = {
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
    width: '100%'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: '4rem', overflowX: 'hidden' }}>
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            type="button"
            onClick={handleBackAction}
            style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ←
          </button>
          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
            SHANORA <span style={{ color: '#38bdf8' }}>Settings Hub</span>
          </span>
        </div>
      </header>

      <div style={{ maxWidth: '840px', margin: '1.2rem auto', padding: '0 0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
        {notification.show && (
          <div style={{
            backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
            color: notification.type === 'error' ? '#ef4444' : '#4ade80',
            padding: '0.9rem 1.2rem',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <span>{notification.type === 'error' ? '⚠️ ' : '✅ '} {notification.message}</span>
            <button type="button" onClick={() => setNotification({ show: false, message: '', type: 'success' })} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Settings Category
          </label>
          <select
            value={activeCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                {sec.icon} {sec.label}
              </option>
            ))}
          </select>
        </div>

        <main style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', minHeight: '480px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {/* 1. Account Settings */}
          {activeCategory === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>1. Account Settings</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, backgroundColor: '#131b2e', color: '#64748b' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Username (@handle)</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Phone Number</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+92 300 0000000" style={inputStyle} />
              </div>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Show Online Activity Status</span>
                <input type="checkbox" checked={formData.online_status} onChange={(e) => setFormData({ ...formData, online_status: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Account Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Account Settings'}
              </button>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeCategory === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>2. Personal Information</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Full Name</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Country" style={inputStyle} />
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <input type="text" value={formData.target_role} onChange={(e) => setFormData({ ...formData, target_role: e.target.value })} placeholder="Target Role" style={inputStyle} />
                <input type="text" value={formData.expected_salary} onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })} placeholder="Expected Salary" style={inputStyle} />
              </div>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Open to Relocation</span>
                <input type="checkbox" checked={formData.relocate_ok} onChange={(e) => setFormData({ ...formData, relocate_ok: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Personal Information')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Personal Info'}
              </button>
            </div>
          )}

          {/* 3. Profile Customization + Company Verification */}
          {activeCategory === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>3. Profile Customization</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Professional Headline</label>
                <input type="text" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>About Me (Bio)</label>
                <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Company Name" style={inputStyle} />
                <input type="url" value={formData.company_website} onChange={(e) => setFormData({ ...formData, company_website: e.target.value })} placeholder="Company Website" style={inputStyle} />
              </div>
              <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff' }}>Company Verification Status</div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'capitalize' }}>{metaStats.verification_status}</div>
                </div>
                <button type="button" onClick={handleRequestVerification} disabled={saving || metaStats.verification_status === 'verified'} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.8rem', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}>
                  {metaStats.verification_status === 'verified' ? '✓ Verified' : 'Request Verification'}
                </button>
              </div>
              <button type="button" onClick={() => handleSave('Profile Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Profile Customization'}
              </button>
            </div>
          )}

          {/* 4. Privacy & Visibility */}
          {activeCategory === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>4. Privacy & Visibility</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Profile Visibility</label>
                <select value={formData.profile_visibility} onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })} style={inputStyle}>
                  <option value="public">Public (Everyone)</option>
                  <option value="connections">Connections Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Send Read Receipts</span>
                <input type="checkbox" checked={formData.read_receipts} onChange={(e) => setFormData({ ...formData, read_receipts: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Privacy Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          )}

          {/* 5. Account Security & Sessions */}
          {activeCategory === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>5. Account Security & 2FA</h2>
              <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>Change Password</h3>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={inputStyle} />
                <button type="submit" disabled={passwordUpdating} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {passwordUpdating ? 'Updating...' : 'Update Password Securely'}
                </button>
              </form>
              <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>Active Sessions</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Sign out from all other devices immediately</div>
                </div>
                <button type="button" onClick={handleSignOutAllDevices} style={{ backgroundColor: '#1e293b', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '0.45rem 0.8rem', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}>
                  Sign Out All Devices
                </button>
              </div>
            </div>
          )}

          {/* 6. Notification Preferences */}
          {activeCategory === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>6. Notification Preferences</h2>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Email Notifications</span>
                <input type="checkbox" checked={formData.email_notifications} onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Push Notifications</span>
                <input type="checkbox" checked={formData.push_notifications} onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Job & Hiring Alerts</span>
                <input type="checkbox" checked={formData.job_alerts} onChange={(e) => setFormData({ ...formData, job_alerts: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Notification Preferences')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* 7. Appearance & Theme */}
          {activeCategory === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>7. Appearance & Theme</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Theme Mode</label>
                <select value={formData.theme_mode} onChange={(e) => setFormData({ ...formData, theme_mode: e.target.value })} style={inputStyle}>
                  <option value="dark">Dark Theme (SHANORA Standard)</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>
              <button type="button" onClick={() => handleSave('Appearance Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Appearance'}
              </button>
            </div>
          )}

          {/* 8. Language & Region */}
          {activeCategory === 'language' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>8. Language & Region</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Select Application Language</label>
                <select value={formData.app_language} onChange={(e) => setFormData({ ...formData, app_language: e.target.value })} style={inputStyle}>
                  <option value="en">English (US/UK)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="sd">Sindhi (سنڌي)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
              </div>
              <button type="button" onClick={() => handleSave('Language Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Language Preference'}
              </button>
            </div>
          )}

          {/* 9. Feed Preferences */}
          {activeCategory === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>9. Feed Preferences</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Feed Sort Order</label>
                <select value={formData.feed_sort} onChange={(e) => setFormData({ ...formData, feed_sort: e.target.value })} style={inputStyle}>
                  <option value="recent">Most Recent</option>
                  <option value="trending">Top Trending</option>
                </select>
              </div>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Autoplay Videos in Feed</span>
                <input type="checkbox" checked={formData.video_autoplay} onChange={(e) => setFormData({ ...formData, video_autoplay: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Feed Preferences')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Feed Preferences'}
              </button>
            </div>
          )}

          {/* 10. Messaging Controls */}
          {activeCategory === 'messaging' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>10. Messaging Controls</h2>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Who can message you?</label>
                <select value={formData.messaging_permission} onChange={(e) => setFormData({ ...formData, messaging_permission: e.target.value })} style={inputStyle}>
                  <option value="everyone">Everyone</option>
                  <option value="connections">Connections Only</option>
                </select>
              </div>
              <button type="button" onClick={() => handleSave('Messaging Settings')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Messaging Controls'}
              </button>
            </div>
          )}

          {/* 11. Accessibility */}
          {activeCategory === 'accessibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>11. Accessibility</h2>
              <label style={cardStyle}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>High Contrast Dark Mode</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Keep crisp borders and text contrast across pages</div>
                </div>
                <input type="checkbox" checked={formData.high_contrast} onChange={(e) => { const v = e.target.checked; setFormData({ ...formData, high_contrast: v }); applyDocumentPreferences(formData.theme_mode, formData.app_language, v); }} style={{ width: '18px', height: '18px' }} />
              </label>
            </div>
          )}

          {/* 12. Data & Export Archive */}
          {activeCategory === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>12. Data & Export Archive</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                Download your SHANORA profile and job applications as a JSON archive file.
              </p>
              <button type="button" onClick={handleExportArchive} disabled={exportingData} style={{ ...primaryBtnStyle, width: 'fit-content', padding: '0.75rem 1.2rem' }}>
                {exportingData ? 'Preparing Archive...' : '📥 Download Data Archive (.json)'}
              </button>
            </div>
          )}

          {/* 13. Ads & Monetization */}
          {activeCategory === 'ads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>13. Ads & Monetization</h2>
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>
                    Plan: <span style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{metaStats.subscription_tier}</span> • {metaStats.is_monetized ? 'Monetized' : 'Standard'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#22c55e', marginTop: '0.2rem' }}>
                    Wallet Balance: {metaStats.wallet_balance}
                  </div>
                </div>
                <Link href="/monetization" style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: '800', textDecoration: 'none' }}>
                  Open Dashboard ↗
                </Link>
              </div>
            </div>
          )}

          {/* 14. Jobs & Career Hub */}
          {activeCategory === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>14. Jobs & Career Hub</h2>
                <Link href="/jobs" style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: '800', textDecoration: 'none' }}>Go to Jobs ↗</Link>
              </div>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Open to Work (Recruiter Discovery)</span>
                <input type="checkbox" checked={formData.open_to_work} onChange={(e) => setFormData({ ...formData, open_to_work: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Remote Job Preference</span>
                <input type="checkbox" checked={formData.remote_work} onChange={(e) => setFormData({ ...formData, remote_work: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <label style={cardStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Receive Matching Job Alerts</span>
                <input type="checkbox" checked={formData.job_alerts} onChange={(e) => setFormData({ ...formData, job_alerts: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              </label>
              <button type="button" onClick={() => handleSave('Career Preferences')} disabled={saving} style={primaryBtnStyle}>
                {saving ? 'Saving...' : 'Save Career Preferences'}
              </button>
            </div>
          )}

          {/* 15. Help & Support Center */}
          {activeCategory === 'support' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>15. Help & Support Center</h2>
              <input type="text" placeholder="Issue Subject (e.g. Job application or login bug)" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} style={inputStyle} />
              <textarea rows={3} placeholder="Describe your problem..." value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} style={inputStyle} />
              <button type="button" disabled={submittingSupport} onClick={handleSupportSubmit} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                {submittingSupport ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </div>
          )}

          {/* 16. Account Management */}
          {activeCategory === 'management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>16. Account Management</h2>
              <button type="button" onClick={async () => { if (confirm('Are you sure you want to log out?')) { await supabase.auth.signOut(); router.replace('/auth'); } }} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                Log Out of SHANORA
              </button>
              <button type="button" disabled={saving} onClick={handleRequestAccountDeletion} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                Request Account Deletion
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
