'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Creator / Influencer');
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Pakistan');

  // Media files
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
      } else {
        setUser(session.user);
      }
    }
    checkAuth();
  }, [router]);

  function handleNameChange(e) {
    const val = e.target.value;
    setName(val);
    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    setSlug(autoSlug);
  }

  function handleLogoSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function handleBannerSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  }

  async function uploadImage(file, path) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}_${Date.now()}.${fileExt}`;
    const filePath = `pages/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('page-media').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !slug) {
      setErrorMsg('Page name and URL slug are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let finalLogoUrl = null;
      let finalBannerUrl = null;

      if (logoFile) {
        finalLogoUrl = await uploadImage(logoFile, `logo_${slug}`);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadImage(bannerFile, `banner_${slug}`);
      }

      const { error } = await supabase
        .from('pages')
        .insert([
          {
            name,
            slug,
            category,
            headline,
            about,
            city,
            country,
            logo_url: finalLogoUrl,
            banner_url: finalBannerUrl,
            owner_email: user.email,
            followers_count: 0,
            monetization_status: 'not_applied'
          }
        ]);

      if (error) throw error;

      router.push(`/page/${slug}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create page.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <Link href="/monetization" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155' }}>
          Monetization Hub ➔
        </Link>
      </header>

      <main style={{ maxWidth: '650px', margin: '2rem auto', padding: '0 1rem 3rem 1rem' }}>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.8rem' }}>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
            Create an Organization or Creator Page
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Launch your company, personal creator channel, or brand. Add images now, or update them anytime directly from your page.
          </p>

          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Optional Banner Upload */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Cover Banner (Optional)
              </label>
              <div style={{ 
                height: '110px', 
                borderRadius: '10px', 
                border: '2px dashed #334155', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#1e293b'
              }}>
                <label style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', color: '#38bdf8', cursor: 'pointer', border: '1px solid #334155' }}>
                  {bannerPreview ? 'Change Banner' : '📷 Upload Cover Banner'}
                  <input type="file" accept="image/*" onChange={handleBannerSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Optional Logo / Avatar Upload */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Profile Photo / Logo (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '65px', 
                  height: '65px', 
                  borderRadius: '50%', 
                  backgroundColor: '#1e293b', 
                  border: '2px dashed #334155', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundImage: logoPreview ? `url(${logoPreview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontSize: '1.2rem',
                  color: '#38bdf8'
                }}>
                  {!logoPreview && (name ? name.charAt(0).toUpperCase() : '👤')}
                </div>
                <label style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '0.45rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Choose Photo
                  <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Page Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Page / Organization Name *
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Amanullah Tech, Shanora Studio"
                value={name}
                onChange={handleNameChange}
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
              />
            </div>

            {/* URL Slug */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Page URL Slug *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0 0.7rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>shanora.pk/page/</span>
                <input 
                  type="text" 
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{ width: '100%', padding: '0.7rem 0.3rem', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#38bdf8', fontWeight: '700', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
              >
                <option value="Education & University">Education & University</option>
                <option value="Creator / Influencer">Creator / Influencer</option>
                <option value="Company / Software House">Company / Software House</option>
                <option value="Business & Retail">Business & Retail</option>
                <option value="Media & News">Media & News</option>
              </select>
            </div>

            {/* Headline */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                Headline / Tagline
              </label>
              <input 
                type="text" 
                placeholder="e.g. Official updates, tutorials and announcements"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
              />
            </div>

            {/* City & Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                  City
                </label>
                <input 
                  type="text" 
                  placeholder="Sukkur, Karachi..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                  Country
                </label>
                <input 
                  type="text" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* About */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                About / Description
              </label>
              <textarea 
                rows={3}
                placeholder="Describe your vision, offerings, and background..."
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Creating Official Page...' : 'Create Official Page 🚀'}
            </button>

          </form>

        </div>
      </main>

    </div>
  );
            }
