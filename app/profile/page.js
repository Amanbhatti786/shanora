'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', degree: '', university: '', city: '', phone: '', target_role: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth');
      setUser(session.user);
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({ 
            full_name: data.full_name || '', 
            degree: data.degree || '', 
            university: data.university || '', 
            city: data.city || '', 
            phone: data.phone || '', 
            target_role: data.target_role || '' 
          });
        }
        setLoading(false);
      });
    });
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      id: user.id, 
      email: user.email,
      ...form 
    };
    const { error } = await supabase.from('profiles').upsert(payload);
    setSaving(false);
    if (error) alert('Error: ' + error.message);
    else {
      setProfile(payload);
      setIsEditing(false);
      alert('Profile updated!');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${user.id}_${Date.now()}.pdf`;
    const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true });
    if (error) { alert(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path);
    await supabase.from('profiles').upsert({ id: user.id, email: user.email, resume_url: publicUrl });
    setProfile(prev => ({ ...prev, resume_url: publicUrl }));
    setUploading(false);
    alert('CV uploaded!');
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '3rem' }}>Loading student portal...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1rem', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Profile Header Box */}
      <div style={{ background: '#131b2e', padding: '1.5rem', borderRadius: '14px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>STUDENT ACCOUNT</span>
              {profile.is_premium ? (
                <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  👑 PRO
                </span>
              ) : (
                <span style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                  Free Member
                </span>
              )}
            </div>
            <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.5rem' }}>{profile.full_name || 'Set Full Name'}</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>{user?.email} • {profile.city || 'Pakistan'}</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setIsEditing(!isEditing)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {isEditing ? 'Cancel ✕' : 'Edit Profile ✏️'}
            </button>
            {!profile.is_premium && (
              <button onClick={() => setShowUpgradeModal(true)} style={{ background: '#eab308', color: '#090d16', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Go Pro 👑
              </button>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#1e293b', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Upgrade Pro Modal */}
        {showUpgradeModal && (
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #eab308', borderRadius: '12px', padding: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ color: '#facc15', margin: 0, fontSize: '1.1rem' }}>👑 Shanora Pro Membership</h3>
              <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: '0 0 0.85rem 0', lineHeight: '1.4' }}>
              Direct Recruiter Priority, AI Resume Rewrite, tailored Cover Letters aur WhatsApp Job Alerts hasil karein.
            </p>
            <div style={{ backgroundColor: '#131b2e', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Lifetime Access</span>
                <div style={{ color: '#4ade80', fontSize: '1.15rem', fontWeight: '900' }}>PKR 999</div>
              </div>
              <a
                href="https://wa.me/923000000000?text=Hi%20Shanora%2C%20I%20want%20to%20upgrade%20my%20account%20to%20Shanora%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#22c55e', color: '#090d16', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                Pay via Easypaisa / JazzCash 📲
              </a>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
            <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} required />
            <input placeholder="WhatsApp Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input placeholder="Degree (BSCS, BBA, Inter)" value={form.degree} onChange={e => setForm({...form, degree: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input placeholder="University / Institute" value={form.university} onChange={e => setForm({...form, university: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input placeholder="City / District" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} />
            <input placeholder="Specialization (Web, AI, Banking)" value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} style={{ padding: '0.6rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }} />
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={saving} style={{ background: '#22c55e', color: '#090d16', padding: '0.7rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '0.9rem' }}>
                {saving ? 'Saving changes...' : 'Save Profile Changes 💾'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CV Box */}
      <div style={{ background: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', marginTop: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>📄 Official Resume / CV (PDF)</h3>
        {profile.resume_url ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', padding: '0.55rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
              View My CV ↗
            </a>
            <label style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              {uploading ? 'Uploading...' : 'Replace PDF'}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <label style={{ background: '#22c55e', color: '#090d16', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block', fontSize: '0.85rem' }}>
            {uploading ? 'Uploading PDF...' : 'Select & Upload PDF CV 📤'}
            <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Student Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <small style={{ color: '#94a3b8' }}>Academic Degree</small>
          <div style={{ fontWeight: 'bold', marginTop: '0.2rem' }}>{profile.degree || 'Not specified'}</div>
          <small style={{ color: '#38bdf8' }}>{profile.university || 'University not set'}</small>
        </div>
        <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <small style={{ color: '#94a3b8' }}>WhatsApp Direct</small>
          <div style={{ fontWeight: 'bold', marginTop: '0.2rem' }}>{profile.phone || 'No phone'}</div>
          <small style={{ color: '#22c55e' }}>Active for Recruiter</small>
        </div>
        <div style={{ background: '#0a0f1d', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <small style={{ color: '#94a3b8' }}>Specialization</small>
          <div style={{ fontWeight: 'bold', marginTop: '0.2rem' }}>{profile.target_role || 'General Tech'}</div>
          <small style={{ color: '#94a3b8' }}>Open for Matching</small>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
          ← Back to Verified Jobs Feed
        </Link>
      </div>

    </div>
  );
                    }
        
