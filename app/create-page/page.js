'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Software & Technology',
    headline: '',
    about: '',
    country: 'Pakistan',
    city: '',
    logo_url: ''
  });

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  function handleNameChange(e) {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData(prev => ({
      ...prev,
      name,
      slug: generatedSlug
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (!formData.name || !formData.slug) {
        throw new Error('Page Name and URL Slug are required.');
      }

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        category: formData.category,
        headline: formData.headline.trim(),
        about: formData.about.trim(),
        country: formData.country,
        city: formData.city.trim(),
        logo_url: formData.logo_url.trim() || null,
        owner_email: user.email,
        monetization_status: 'not_applied'
      };

      const { data, error } = await supabase
        .from('pages')
        .insert([payload])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This Page URL Slug is already taken. Please choose another name.');
        }
        throw error;
      }

      router.push('/monetization');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Checking session...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', textDecoration: 'none', border: '1px solid #334155' }}>
          Back to Portal 💼
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '650px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.8rem' }}>
          
          <h1 style={{ fontSize: '1.4rem', color: '#fff', margin: '0 0 0.4rem 0' }}>Create an Organization or Creator Page</h1>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Launch your company, college, educational institute, or personal creator community to build followers and unlock monetization.
          </p>

          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.2rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                Page / Organization Name *
              </label>
              <input
                type="text"
                placeholder="e.g. ShanTech Solutions or Tech Innovators Hub"
                value={formData.name}
                onChange={handleNameChange}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>
                Page URL Slug *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '0 0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>shanora.pk/page/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.2rem', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              >
                <option value="Software & Technology">Software & Technology</option>
                <option value="Education & University">Education & University</option>
                <option value="Finance & Business">Finance & Business</option>
                <option value="Media & Entertainment">Media & Entertainment</option>
                <option value="Recruitment Agency">Recruitment Agency</option>
                <option value="Community & Non-Profit">Community & Non-Profit</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Headline / Short Tagline</label>
              <input
                type="text"
                placeholder="e.g. Empowering software engineers across the globe"
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>City</label>
                <input
                  type="text"
                  placeholder="e.g. Lahore / Remote"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>About / Description</label>
              <textarea
                rows={4}
                placeholder="Provide a detailed overview of your organization or community..."
                value={formData.about}
                onChange={e => setFormData({ ...formData, about: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
            >
              {submitting ? 'Creating Page...' : 'Create Official Page 🚀'}
            </button>

          </form>

        </div>
      </main>

    </div>
  );
      }
          
