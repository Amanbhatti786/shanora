'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  // General Form States
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  
  // New Settings States
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [profileVis, setProfileVis] = useState('public');
  const [msgPerm, setMsgPerm] = useState('everyone');
  const [feedSort, setFeedSort] = useState('recent');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  useEffect(() => {
    async function loadSettings() {
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
        setFullName(profile.full_name || '');
        setHeadline(profile.headline || '');
        setBio(profile.bio || '');
        setLanguage(profile.language || 'en');
        setTheme(profile.theme || 'dark');
        setEmailNotif(profile.email_notifications ?? true);
        setPushNotif(profile.push_notifications ?? true);
        setProfileVis(profile.profile_visibility || 'public');
        setMsgPerm(profile.messaging_permission || 'everyone');
        setFeedSort(profile.feed_sort || 'recent');
      }
      setLoading(false);
    }
    loadSettings();
  }, [router]);

  async function handleSaveSettings(updates) {
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .ilike('email', user.email);

      if (error) throw error;
      setSuccessMsg('Settings updated successfully! ✓');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
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
      alert('Password updated successfully!');
      setNewPassword('');
    } catch (err) {
      alert('Password update failed: ' + err.message);
    } finally {
      setPasswordUpdating(false);
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading Settings...</div>;
  }

  const menuSections = [
    { id: 'account', label: '1. Account Settings', icon: '⚙️' },
    { id: 'personal', label: '2. Personal Information', icon: '👤' },
    { id: 'profile', label: '3. Profile Settings', icon: '🎨' },
    { id: 'privacy', label: '4. Privacy Settings', icon: '🔒' },
    { id: 'security', label: '5. Account Security', icon: '🛡️' },
    { id: 'notifications', label: '6. Notifications', icon: '🔔' },
    { id: 'appearance', label: '7. Appearance', icon: '🌙' },
    { id: 'language', label: '8. Language & Region', icon: '🌍' },
    { id: 'feed', label: '9. Feed Preferences', icon: '📰' },
    { id: 'messaging', label: '10. Messaging Settings', icon: '💬' },
    { id: 'accessibility', label: '11. Accessibility', icon: '♿' },
    { id: 'data', label: '12. Data & Permissions', icon: '📁' },
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
          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>SHANORA <span style={{ color: '#38bdf8' }}>Settings Hub</span></span>
        </div>
      </header>

      {/* Main Layout Container */}
      <div style={{ maxWidth: '800px', margin: '1.2rem auto', padding: '0 0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
        
        {/* Horizontal Scrollable Menu for Mobile */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '0.6rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
          {menuSections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.8rem',
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
        <main style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.2rem', minHeight: '500px', boxSizing: 'border-box' }}>
          
          {successMsg && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: '700' }}>
              {successMsg}
            </div>
          )}

          {/* 1. Account Settings */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Account Settings</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.2rem' }}>Manage your account credentials and primary details.</p>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings({ full_name: fullName }); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#64748b', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}>{saving ? 'Saving...' : 'Save Account Settings'}</button>
              </form>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeTab === 'personal' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Personal Information</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings({ headline, bio }); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Headline</label>
                  <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Bio</label>
                  <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}>{saving ? 'Saving...' : 'Save Personal Info'}</button>
              </form>
            </div>
          )}

          {/* 4. Privacy Settings */}
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Privacy Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Profile Visibility</label>
                  <select value={profileVis} onChange={e => { setProfileVis(e.target.value); handleSaveSettings({ profile_visibility: e.target.value }); }} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                    <option value="public">Public (Everyone)</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. Account Security */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Account Security</h2>
              <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>Change Password</h3>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                <button type="submit" disabled={passwordUpdating} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', width: '100%' }}>{passwordUpdating ? 'Updating...' : 'Update Password'}</button>
              </form>
            </div>
          )}

          {/* 6. Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Email Notifications</span>
                  <input type="checkbox" checked={emailNotif} onChange={e => { setEmailNotif(e.target.checked); handleSaveSettings({ email_notifications: e.target.checked }); }} style={{ width: '18px', height: '18px' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131b2e', padding: '0.8rem', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Push Notifications</span>
                  <input type="checkbox" checked={pushNotif} onChange={e => { setPushNotif(e.target.checked); handleSaveSettings({ push_notifications: e.target.checked }); }} style={{ width: '18px', height: '18px' }} />
                </label>
              </div>
            </div>
          )}

          {/* 7. Appearance */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Appearance</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Theme Preference</label>
                <select value={theme} onChange={e => { setTheme(e.target.value); handleSaveSettings({ theme: e.target.value }); }} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="dark">Dark Theme (Default)</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>
            </div>
          )}

          {/* 8. Language & Region */}
          {activeTab === 'language' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Language & Region</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Display Language</label>
                <select value={language} onChange={e => { setLanguage(e.target.value); handleSaveSettings({ language: e.target.value }); }} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="en">English</option>
                  <option value="ur">Urdu / Roman Urdu</option>
                  <option value="sd">Sindhi</option>
                </select>
              </div>
            </div>
          )}

          {/* 9. Feed Preferences */}
          {activeTab === 'feed' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Feed Preferences</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Default Post Sorting</label>
                <select value={feedSort} onChange={e => { setFeedSort(e.target.value); handleSaveSettings({ feed_sort: e.target.value }); }} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="recent">Most Recent</option>
                  <option value="trending">Top Trending</option>
                </select>
              </div>
            </div>
          )}

          {/* 10. Messaging Settings */}
          {activeTab === 'messaging' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0 }}>Messaging Settings</h2>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Who can message you?</label>
                <select value={msgPerm} onChange={e => { setMsgPerm(e.target.value); handleSaveSettings({ messaging_permission: e.target.value }); }} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}>
                  <option value="everyone">Everyone on Network</option>
                  <option value="connections">Connections Only</option>
                </select>
              </div>
            </div>
          )}

          {/* Other Sections (3, 11-16) */}
          {!['account', 'personal', 'privacy', 'security', 'notifications', 'appearance', 'language', 'feed', 'messaging'].includes(activeTab) && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '900', marginTop: 0, textTransform: 'capitalize' }}>{activeTab} Settings</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.2rem' }}>Configure advanced preferences for {activeTab}.</p>
              <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                ⚙️ All configurations for {activeTab} are linked with your secure Supabase account profile.
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
                                 }
                          
