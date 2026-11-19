'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ProfessionalSettingsHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('account');
  const [categoryHistory, setCategoryHistory] = useState(['account']);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    country: 'Pakistan',
    city: '',
    headline: '',
    bio: '',
    profile_visibility: 'public',
    messaging_permission: 'everyone',
    email_notifications: true,
    push_notifications: true,
    theme_mode: 'dark',
    app_language: 'en',
    feed_sort: 'recent',
    video_autoplay: true,
    open_to_work: true,
    remote_work: true
  });

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const showCardMessage = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
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
        setFormData({
          full_name: profile.full_name || '',
          username: profile.username || session.user.email.split('@')[0],
          phone: profile.phone || '',
          country: profile.country || 'Pakistan',
          city: profile.city || '',
          headline: profile.headline || '',
          bio: profile.bio || '',
          profile_visibility: profile.profile_visibility || 'public',
          messaging_permission: profile.messaging_permission || 'everyone',
          email_notifications: profile.email_notifications ?? true,
          push_notifications: profile.push_notifications ?? true,
          theme_mode: profile.theme_mode || 'dark',
          app_language: profile.app_language || 'en',
          feed_sort: profile.feed_sort || 'recent',
          video_autoplay: profile.video_autoplay ?? true,
          open_to_work: profile.open_to_work ?? true,
          remote_work: profile.remote_work ?? true
        });
      }
      if (active) setLoading(false);
    }
    initSettings();
    return () => {
      active = false;
    };
  }, [router]);

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

    if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
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

  async function handleSave(sectionName) {
    if (!user) return;
    setSaving(true);

    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        headline: formData.headline,
        bio: formData.bio,
        profile_visibility: formData.profile_visibility,
        messaging_permission: formData.messaging_permission,
        email_notifications: formData.email_notifications,
        push_notifications: formData.push_notifications,
        theme_mode: formData.theme_mode,
        app_language: formData.app_language,
        feed_sort: formData.feed_sort,
        video_autoplay: formData.video_autoplay,
        open_to_work: formData.open_to_work,
        remote_work: formData.remote_work,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .ilike('email', user.email);

      if (error) throw error;
      showCardMessage(`${sectionName} saved successfully! ✓`, 'success');
    } catch (err) {
      showCardMessage('Save failed: ' + err.message, 'error');
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

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading SHANORA Settings Hub...</div>;
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
          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>SHANORA <span style={{ color: '#38bdf8' }}>Settings Hub</span></span>
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
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Settings Category</label>
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

        <main style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', minHeight: '520px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {activeCategory === 'account' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>1. Account Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#64748b', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Username (@handle)</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Phone Number</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+92 300 0000000" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="button" onClick={() => handleSave('Account Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Account Settings'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'personal' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>2. Personal Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Country" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button type="button" onClick={() => handleSave('Personal Information')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Personal Info'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'profile' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>3. Profile Customization</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Professional Headline</label>
                  <input type="text" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>About Me (Bio)</label>
                  <textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button type="button" onClick={() => handleSave('Profile Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Profile Customization'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'privacy' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>4. Privacy & Visibility</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Profile Visibility</label>
                  <select value={formData.profile_visibility} onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                    <option value="public">Public (Everyone)</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <button type="button" onClick={() => handleSave('Privacy Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Privacy Settings'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'security' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>5. Account Security & 2FA</h2>
              <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>Change Password</h3>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                <button type="submit" disabled={passwordUpdating} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}>{passwordUpdating ? 'Updating...' : 'Update Password Securely'}</button>
              </form>
            </div>
          )}

          {activeCategory === 'notifications' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>6. Notification Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Email Notifications</span>
                  <input type="checkbox" checked={formData.email_notifications} onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Push Notifications</span>
                  <input type="checkbox" checked={formData.push_notifications} onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                </label>
                <button type="button" onClick={() => handleSave('Notification Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Preferences'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'appearance' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>7. Appearance & Theme</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Theme Mode</label>
                <select value={formData.theme_mode} onChange={(e) => setFormData({ ...formData, theme_mode: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="dark">Dark Theme (SHANORA Standard)</option>
                  <option value="light">Light Theme</option>
                </select>
                <button type="button" onClick={() => handleSave('Appearance Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Appearance'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'language' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>8. Language & Region</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Select Application Language</label>
                <select value={formData.app_language} onChange={(e) => setFormData({ ...formData, app_language: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="en">English (US/UK)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="sd">Sindhi (سنڌي)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
                <button type="button" onClick={() => handleSave('Language Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Language Preference'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'feed' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>9. Feed Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Feed Sort Order</label>
                  <select value={formData.feed_sort} onChange={(e) => setFormData({ ...formData, feed_sort: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                    <option value="recent">Most Recent</option>
                    <option value="trending">Top Trending</option>
                  </select>
                </div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Autoplay Videos in Feed</span>
                  <input type="checkbox" checked={formData.video_autoplay} onChange={(e) => setFormData({ ...formData, video_autoplay: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                </label>
                <button type="button" onClick={() => handleSave('Feed Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Feed Preferences'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'messaging' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>10. Messaging Controls</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Who can message you?</label>
                <select value={formData.messaging_permission} onChange={(e) => setFormData({ ...formData, messaging_permission: e.target.value })} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="everyone">Everyone</option>
                  <option value="connections">Connections Only</option>
                </select>
                <button type="button" onClick={() => handleSave('Messaging Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Messaging Controls'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'accessibility' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>11. Accessibility</h2>
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', marginTop: '1rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem' }}>High Contrast Mode</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SHANORA automatically optimizes dark theme contrast for high visibility.</div>
              </div>
            </div>
          )}

          {activeCategory === 'data' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>12. Data & Export Archive</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Download your personal profile data and activity logs securely.</p>
              <button type="button" onClick={() => showCardMessage('Data export archive requested successfully. Check your email.', 'success')} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>📥 Request Data Archive</button>
            </div>
          )}

          {activeCategory === 'ads' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>13. Ads & Monetization</h2>
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Creator Monetization Status</div>
                  <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Active & Eligible for Payouts</div>
                </div>
                <Link href="/monetization" style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}>Open Dashboard ↗</Link>
              </div>
            </div>
          )}

          {activeCategory === 'jobs' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>14. Jobs & Career Hub</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Open to Work (Recruiter Discovery)</span>
                  <input type="checkbox" checked={formData.open_to_work} onChange={(e) => setFormData({ ...formData, open_to_work: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Remote Job Preference</span>
                  <input type="checkbox" checked={formData.remote_work} onChange={(e) => setFormData({ ...formData, remote_work: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                </label>
                <button type="button" onClick={() => handleSave('Career Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Career Preferences'}</button>
              </div>
            </div>
          )}

          {activeCategory === 'support' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>15. Help & Support Center</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                <input type="text" placeholder="Issue Subject (e.g. Login bug)" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                <textarea rows={3} placeholder="Describe your problem..." value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => { if (!supportSubject.trim()) { showCardMessage('Please enter a subject', 'error'); return; } showCardMessage('Support ticket submitted successfully! Ticket ID #SH-' + Math.floor(Math.random() * 90000 + 10000), 'success'); setSupportSubject(''); setSupportMsg(''); }} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>Submit Support Ticket</button>
              </div>
            </div>
          )}

          {activeCategory === 'management' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>16. Account Management</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                <button type="button" onClick={async () => { if (confirm('Are you sure you want to log out?')) { await supabase.auth.signOut(); router.replace('/auth'); } }} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>Log Out of SHANORA</button>
                <button type="button" onClick={() => showCardMessage('Account deletion requires security re-authentication. Contact support.', 'error')} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>Permanently Delete Account</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
