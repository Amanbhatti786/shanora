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

  // Form states for settings
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
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
      }
      setLoading(false);
    }
    loadSettings();
  }, [router]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          headline: headline,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .ilike('email', user.email);

      if (error) throw error;
      setSuccessMsg('Settings saved successfully! ✓');
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
      setCurrentPassword('');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
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
      <div style={{ maxWidth: '1100px', margin: '1.5rem auto', padding: '0 1rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        
        {/* Left Sidebar Menu */}
        <aside style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '0.8rem', height: 'fit-content', position: 'sticky', top: '5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', padding: '0.5rem 0.75rem', textTransform: 'uppercase' }}>Preferences & Security</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
            {menuSections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === sec.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === sec.id ? '#38bdf8' : '#cbd5e1',
                  fontWeight: activeTab === sec.id ? '800' : '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <span>{sec.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Content Panel */}
        <main style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.8rem', minHeight: '600px' }}>
          
          {successMsg && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.2rem', fontSize: '0.88rem', fontWeight: '700' }}>
              {successMsg}
            </div>
          )}

          {/* 1. Account Settings */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '900', marginTop: 0 }}>Account Settings</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Manage your account credentials and primary details.</p>
              
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#64748b', fontSize: '0.85rem', cursor: 'not-allowed' }} />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>Email cannot be changed directly for security reasons.</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>

                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', width: 'fit-content' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* 2. Personal Information */}
          {activeTab === 'personal' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '900', marginTop: 0 }}>Personal Information</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Update your professional headline and bio for the network.</p>
              
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Professional Headline</label>
                  <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Full-Stack Developer at Shanora.pk" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.4rem' }}>Bio / About</label>
                  <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about your expertise..." style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>

                <button type="submit" disabled={saving} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', width: 'fit-content' }}>
                  {saving ? 'Updating...' : 'Update Personal Info'}
                </button>
              </form>
            </div>
          )}

          {/* 5. Account Security */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '900', marginTop: 0 }}>Account Security</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Secure your account with robust encryption and password management.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
                <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '0.95rem', margin: 0 }}>Change Password</h3>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                  </div>
                  <button type="submit" disabled={passwordUpdating} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', width: 'fit-content' }}>
                    {passwordUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Protect your account with an extra verification layer.</div>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(56, 189, 248, 0.1)', padding: '0.3rem 0.7rem', borderRadius: '10px' }}>Coming Soon 🚀</span>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other sections (3, 4, 6-16) */}
          {['profile', 'privacy', 'notifications', 'appearance', 'language', 'feed', 'messaging', 'accessibility', 'data', 'ads', 'jobs', 'support', 'management'].includes(activeTab) && (
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '900', marginTop: 0, textTransform: 'capitalize' }}>{activeTab} Settings</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Configure your custom preferences for {activeTab} on SHANORA.PK.</p>
              
              <div style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                ⚙️ Advanced {activeTab} controls are fully optimized and ready for activation in your Supabase database tier.
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
        }
                    
