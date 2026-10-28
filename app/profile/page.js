'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  // User Session State
  const [user, setUser] = useState(null);

  // Profile Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('50,000 - 80,000');
  const [photoUrl, setPhotoUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // 1. Check Login Session on Load
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Agar student logged in nahi hai, to direct login page par bhej do
        router.push('/auth');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Load Profile Data from Supabase
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (data) {
          setFullName(data.full_name || currentUser.user_metadata?.full_name || '');
          setPhone(data.phone || '');
          setCity(data.city || 'Lahore');
          setDegree(data.degree || '');
          setUniversity(data.university || '');
          setGraduationYear(data.graduation_year || '2026');
          setBio(data.bio || '');
          setSkills(data.skills || '');
          setExpectedSalary(data.expected_salary || '50,000 - 80,000');
          setPhotoUrl(data.photo_url || '');
          setResumeUrl(data.resume_url || '');
        } else {
          // If first time login, set name from metadata
          setFullName(currentUser.user_metadata?.full_name || '');
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  // 2. Save Profile Function
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const updates = {
        email: user.email.toLowerCase().trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        city,
        degree: degree.trim(),
        university: university.trim(),
        graduation_year: graduationYear,
        bio: bio.trim(),
        skills: skills.trim(),
        expected_salary: expectedSalary,
        photo_url: photoUrl.trim(),
        resume_url: resumeUrl.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'email' });

      if (error) throw error;
      setMsg({ text: 'Profile successfully saved & updated! 🎉', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Error updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // 3. Logout Function
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading student dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', paddingBottom: '3rem' }}>
      
      {/* Top Navbar */}
      <header style={{ 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid #1e293b', 
        padding: '0.85rem 1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link 
            href={`/view-profile?email=${encodeURIComponent(user?.email || '')}`} 
            target="_blank"
            style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', textDecoration: 'none', border: '1px solid #334155', fontWeight: 'bold' }}
          >
            Preview Public Link 🔗
          </Link>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Logout 🚪
          </button>
        </div>
      </header>

      {/* Profile Container */}
      <main style={{ maxWidth: '720px', margin: '2rem auto 0', padding: '0 1rem' }}>
        
        <div style={{ backgroundColor: '#0f172a', padding: '2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.3rem 0', color: '#fff' }}>Student Dashboard 🎓</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Logged in as: <strong style={{ color: '#38bdf8' }}>{user?.email}</strong></p>
            </div>
          </div>

          {msg.text && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              marginBottom: '1.5rem',
              backgroundColor: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${msg.type === 'error' ? '#ef4444' : '#22c55e'}`,
              color: msg.type === 'error' ? '#fca5a5' : '#86efac'
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Full Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amanullah Khan"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>WhatsApp / Phone *</label>
                <input 
                  type="text" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* University & Degree */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>University / College *</label>
                <input 
                  type="text" 
                  required 
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. FAST / NUST / UET"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Degree / Field *</label>
                <input 
                  type="text" 
                  required 
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. BS Computer Science"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* City & Year */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lahore, Karachi, Islamabad..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Graduation Year</label>
                <input 
                  type="text" 
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="2025 / 2026"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Core Skills</label>
              <input 
                type="text" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Python, Communication, Graphic Design..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {/* Bio / Summary */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 'bold' }}>Professional Summary / Bio</label>
              <textarea 
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly tell employers what makes you great..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                backgroundColor: '#0284c7', 
                color: '#fff', 
                padding: '0.9rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: '700', 
                fontSize: '1rem', 
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              {saving ? 'Saving to Database...' : 'Save Profile Changes 💾'}
            </button>

          </form>

        </div>
      </main>

    </div>
  );
                      }
                  
