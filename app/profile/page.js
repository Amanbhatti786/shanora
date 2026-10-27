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

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '3rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <div style={{ background: '#131b2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h2>{profile.full_name || 'Set Full Name'}</h2>
        <p style={{ color: '#94a3b8' }}>{user?.email} • {profile.city || 'Pakistan'}</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={() => setIsEditing(!isEditing)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
            {isEditing ? 'Cancel' : 'Edit Profile ✏️'}
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#1e293b', color: '#f87171', border: '1px solid #334155', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>

      {isEditing && (
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} required />
            <input placeholder="Phone / WhatsApp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            <input placeholder="Degree (BSCS, BBA)" value={form.degree} onChange={e => setForm({...form, degree: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            <input placeholder="University" value={form.university} onChange={e => setForm({...form, university: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            <input placeholder="Specialty (e.g. Web Dev)" value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} style={{ padding: '0.5rem', background: '#0a0f1d', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            <button type="submit" disabled={saving} style={{ background: '#22c55e', color: '#000', padding: '0.6rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes 💾'}
            </button>
          </form>
        )}
      </div>

      <div style={{ background: '#131b2e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1e293b', marginTop: '1rem' }}>
        <h3>Resume / CV (PDF)</h3>
        {profile.resume_url ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ background: '#0284c7', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}>View CV ↗</a>
            <label style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Replace PDF'}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <label style={{ background: '#22c55e', color: '#000', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
            {uploading ? 'Uploading...' : 'Upload PDF CV 📤'}
            <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ background: '#0a0f1d', padding: '0.8rem', borderRadius: '8px' }}>
          <small style={{ color: '#94a3b8' }}>Degree</small>
          <div>{profile.degree || 'Not specified'}</div>
        </div>
        <div style={{ background: '#0a0f1d', padding: '0.8rem', borderRadius: '8px' }}>
          <small style={{ color: '#94a3b8' }}>University</small>
          <div>{profile.university || 'Not set'}</div>
        </div>
        <div style={{ background: '#0a0f1d', padding: '0.8rem', borderRadius: '8px' }}>
          <small style={{ color: '#94a3b8' }}>WhatsApp</small>
          <div>{profile.phone || 'No phone'}</div>
        </div>
        <div style={{ background: '#0a0f1d', padding: '0.8rem', borderRadius: '8px' }}>
          <small style={{ color: '#94a3b8' }}>Specialization</small>
          <div>{profile.target_role || 'General'}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Back to Job Feed</Link>
      </div>

    </div>
  );
          }
