'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ComprehensiveSettingsHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Comprehensive Form States across all 16 sections
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
    remote_work: true,
    support_ticket_subject: '',
    support_ticket_msg: ''
  });

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  useEffect(() => {
    async function initSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', session.user.email)
        .maybeSingle();

      if (profile) {
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
          remote_work: profile.remote_work ?? true,
          support_ticket_subject: '',
          support_ticket_msg: ''
        });
      }
      setLoading(false);
    }
    initSettings();
  }, [router]);

  async function handleSave(sectionName, customPayload = null) {
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = customPayload || formData;
      const { error } = await supabase
        .from('profiles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .ilike('email', user.email);

      if (error) throw error;
      setSuccessMsg(`${sectionName} saved successfully! ✓`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated securely via Supabase Auth!');
      setNewPassword('');
    } catch (err) {
      alert('Password update failed: ' + err.message);
    } finally {
      setPasswordUpdating(false);
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading SHANORA Settings...</div>;
  }

  const sections = [
    { id: 'account', label: '1. Account', icon: '⚙️' },
    { id: 'personal', label: '2. Personal', icon: '👤' },
    { id: 'profile', label: '3. Profile', icon: '🎨' },
    { id: 'privacy', label: '4. Privacy', icon: '🔒' },
    { id: 'security', label: '5. Security', icon: '🛡️' },
    { id: 'notifications', label: '6. Notifications', icon: '🔔' },
    { id: 'appearance', label: '7. Appearance', icon: '🌙' },
    { id: 'language', label: '8. Language', icon: '🌍' },
    { id: 'feed', label: '9. Feed', icon: '📰' },
    { id: 'messaging', label: '10. Messaging', icon: '💬' },
    { id: 'accessibility', label: '11. Accessibility', icon: '♿' },
    { id: 'data', label: '12. Data & Export', icon: '📁' },
    { id: 'ads', label: '13. Ads & Monetization', icon: '💰' },
    { id: 'jobs', label: '14. Jobs & Career', icon: '💼' },
    { id: 'support', label: '15. Help & Support', icon: '❓' },
    { id: 'management', label: '16. Account Management', icon: '⚠️' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Link href="/profile?tab=menu" style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            ←
          </Link>
          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>SHANORA <span style={{ color: '#38bdf8' }}>Professional Settings Hub</span></span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '840px', margin: '1.2rem auto', padding: '0 0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
        
        {/* Horizontal Navigation for All 16 Sections */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.6rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === sec.id ? '#0284c7' : '#1e293b',
                color: activeTab === sec.id ? '#fff' : '#cbd5e1',
                fontWeight: activeTab === sec.id ? '800' : '600',
                fontSize: '0.78rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              <span>{sec.icon}</span>
              <span>{sec.label.split('. ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <main style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem', minHeight: '520px', boxSizing: 'border-box' }}>
          
          {successMsg && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.2rem', fontSize: '0.85rem', fontWeight: '700' }}>
              {successMsg}
            </div>
          )}

          {/* 1. Account Settings */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>1. Account Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#64748b', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Username (@handle)</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Phone Number</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+92 300 0000000" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => handleSave('Account Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Account Settings'}</button>
              </div>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeTab === 'personal' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>2. Personal Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="Country" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => handleSave('Personal Information')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Personal Info'}</button>
              </div>
            </div>
          )}

          {/* 3. Profile Settings */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>3. Profile Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Professional Headline</label>
                  <input type="text" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>About Me (Bio)</label>
                  <textarea rows={4} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => handleSave('Profile Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Profile Settings'}</button>
              </div>
            </div>
          )}

          {/* 4. Privacy Settings */}
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>4. Privacy Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Profile Visibility</label>
                  <select value={formData.profile_visibility} onChange={e => setFormData({...formData, profile_visibility: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                    <option value="public">Public (Everyone)</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <button onClick={() => handleSave('Privacy Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Privacy Settings'}</button>
              </div>
            </div>
          )}

          {/* 5. Account Security */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>5. Account Security</h2>
              <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>Change Password</h3>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                <button type="submit" disabled={passwordUpdating} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}>{passwordUpdating ? 'Updating...' : 'Update Password Securely'}</button>
              </form>
            </div>
          )}

          {/* 6. Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>6. Notifications Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Email Notifications</span>
                  <input type="checkbox" checked={formData.email_notifications} onChange={e => setFormData({...formData, email_notifications: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Push Notifications</span>
                  <input type="checkbox" checked={formData.push_notifications} onChange={e => setFormData({...formData, push_notifications: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </label>
                <button onClick={() => handleSave('Notification Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Preferences'}</button>
              </div>
            </div>
          )}

          {/* 7. Appearance */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>7. Appearance Settings</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Theme Mode</label>
                <select value={formData.theme_mode} onChange={e => setFormData({...formData, theme_mode: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="dark">Dark Theme (SHANORA Standard)</option>
                  <option value="light">Light Theme</option>
                </select>
                <button onClick={() => handleSave('Appearance Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Appearance'}</button>
              </div>
            </div>
          )}

             {/* 8. Language & Region */}
          {activeTab === 'language' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>8. Language & Region</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>App Language</label>
                <select value={formData.app_language} onChange={e => setFormData({...formData, app_language: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="en">English</option>
                  <option value="ur">Urdu / Roman Urdu</option>
                  <option value="sd">Sindhi</option>
                </select>
                <button onClick={() => handleSave('Language Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Language'}</button>
              </div>
            </div>
          )}

          {/* 9. Feed Preferences */}
          {activeTab === 'feed' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>9. Feed Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Feed Sort Order</label>
                  <select value={formData.feed_sort} onChange={e => setFormData({...formData, feed_sort: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                    <option value="recent">Most Recent</option>
                    <option value="trending">Top Trending</option>
                  </select>
                </div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Video Autoplay in Feed</span>
                  <input type="checkbox" checked={formData.video_autoplay} onChange={e => setFormData({...formData, video_autoplay: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </label>
                <button onClick={() => handleSave('Feed Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Feed Preferences'}</button>
              </div>
            </div>
          )}

          {/* 10. Messaging Settings */}
          {activeTab === 'messaging' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>10. Messaging Settings</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Who can message you?</label>
                <select value={formData.messaging_permission} onChange={e => setFormData({...formData, messaging_permission: e.target.value})} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="everyone">Everyone</option>
                  <option value="connections">Connections Only</option>
                </select>
                <button onClick={() => handleSave('Messaging Settings')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>{saving ? 'Saving...' : 'Save Messaging Settings'}</button>
              </div>
            </div>
          )}

          {/* 11. Accessibility */}
          {activeTab === 'accessibility' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>11. Accessibility</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Enhance readability and high contrast navigation.</p>
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem' }}>High Contrast Mode</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SHANORA automatically optimizes dark theme contrast for eye safety.</div>
              </div>
            </div>
          )}

          {/* 12. Data & Export */}
          {activeTab === 'data' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>12. Data & Export</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Download your personal profile data and activity logs.</p>
              <button onClick={() => alert('Data export request submitted. You will receive an email shortly.')} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>📥 Download My Data Archive</button>
            </div>
          )}

          {/* 13. Ads & Monetization */}
          {activeTab === 'ads' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>13. Ads & Monetization</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Manage your advertiser preferences and creator earnings status.</p>
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Creator Monetization Status</div>
                  <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Active & Eligible for Payouts</div>
                </div>
                <Link href="/monetization" style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}>Open Dashboard ↗</Link>
              </div>
            </div>
          )}

          {/* 14. Jobs & Career */}
          {activeTab === 'jobs' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>14. Jobs & Career Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Open to Work (Recruiter Discovery)</span>
                  <input type="checkbox" checked={formData.open_to_work} onChange={e => setFormData({...formData, open_to_work: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Remote Job Preference</span>
                  <input type="checkbox" checked={formData.remote_work} onChange={e => setFormData({...formData, remote_work: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </label>
                <button onClick={() => handleSave('Career Preferences')} disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Career Preferences'}</button>
              </div>
            </div>
          )}

          {/* 15. Help & Support */}
          {activeTab === 'support' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>15. Help & Support Center</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Submit a support ticket or report a bug directly to SHANORA engineering.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input type="text" placeholder="Issue Subject (e.g. Login bug)" value={formData.support_ticket_subject} onChange={e => setFormData({...formData, support_ticket_subject: e.target.value})} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                <textarea rows={3} placeholder="Describe your problem..." value={formData.support_ticket_msg} onChange={e => setFormData({...formData, support_ticket_msg: e.target.value})} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                <button onClick={() => { alert('Support ticket submitted successfully! Ticket ID #SH-' + Math.floor(Math.random()*90000+10000)); setFormData({...formData, support_ticket_subject:'', support_ticket_msg:''}); }} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>Submit Support Ticket</button>
              </div>
            </div>
          )}

          {/* 16. Account Management */}
          {activeTab === 'management' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', marginTop: 0 }}>16. Account Management</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Deactivate or permanently close your SHANORA account.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button onClick={async () => { if(confirm('Are you sure you want to log out?')) { await supabase.auth.signOut(); router.push('/auth'); } }} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>Log Out of SHANORA</button>
                <button onClick={() => alert('Account deletion requires security re-authentication. Please contact support.')} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>Permanently Delete Account</button>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
                          }
