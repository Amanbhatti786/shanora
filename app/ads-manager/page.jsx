'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdsManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(false);
  const [myAds, setMyAds] = useState([]);

  // Ad Creation Form State
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaType, setCtaType] = useState('Learn More');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [dailyBudget, setDailyBudget] = useState('500');

  useEffect(() => {
    fetchUserAds();
  }, []);

  async function fetchUserAds() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .ilike('advertiser_email', session.user.email)
        .order('created_at', { ascending: false });

      if (data) setMyAds(data);
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  }

  const handlePublishAd = async (e) => {
    e.preventDefault();
    if (!adTitle.trim() || !mediaUrl.trim()) {
      alert('Please fill in the required ad title and image URL.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('Please sign in to publish an ad.');
        router.push('/auth');
        return;
      }

      const { error } = await supabase.from('advertisements').insert([{
        advertiser_email: session.user.email.toLowerCase(),
        title: adTitle.trim(),
        description: adDescription.trim(),
        media_url: mediaUrl.trim(),
        cta_type: ctaType,
        destination_url: destinationUrl.trim(),
        budget: Number(dailyBudget),
        status: 'pending'
      }]);

      if (error) throw error;

      alert('Ad campaign submitted successfully! It is now pending admin approval.');
      setAdTitle('');
      setAdDescription('');
      setMediaUrl('');
      setDestinationUrl('');
      setActiveTab('campaigns');
      fetchUserAds();
    } catch (err) {
      alert('Error publishing ad: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => router.push('/profile?tab=menu')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#070b14',
              border: '1px solid #1e293b',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              padding: 0
            }}
          >
            ←
          </button>

          <Link href="/feed" style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#0b1322',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '0.28rem 0.65rem 0.28rem 0.35rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            flexShrink: 0
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.45)',
              flexShrink: 0
            }}>
              <span style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: '900', lineHeight: 1 }}>S</span>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              SHANORA<span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#38bdf8', verticalAlign: 'super', marginLeft: '2px', letterSpacing: '0.5px' }}>.PK</span>
            </span>
          </Link>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>📢</span> Ads Manager
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1.2rem 0.9rem 90px 0.9rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'campaigns' ? '#0284c7' : 'transparent',
              color: activeTab === 'campaigns' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            My Campaigns 📊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'create' ? '#0284c7' : 'transparent',
              color: activeTab === 'create' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            + Create Ad 🚀
          </button>
        </div>

        {/* TAB 1: CAMPAIGNS LIST */}
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Active & Pending Ad Campaigns</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>Promote your business or posts across SHANORA feed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  + Create Ad
                </button>
              </div>

              {myAds.length === 0 ? (
                <div style={{ backgroundColor: '#131b2e', border: '1px dashed #334155', borderRadius: '12px', padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📢</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No campaigns running yet</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '1rem' }}>Launch your first image ad with custom WhatsApp or Signup buttons.</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Launch Ad Campaign
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myAds.map(ad => (
                    <div key={ad.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.9rem', color: '#fff' }}>{ad.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>CTA: {ad.cta_type} | Budget: Rs. {ad.budget}</p>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: '6px', backgroundColor: ad.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: ad.status === 'approved' ? '#4ade80' : '#facc15' }}>
                        {ad.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE AD FORM */}
        {activeTab === 'create' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Create Sponsored Ad</h3>
            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.76rem', color: '#94a3b8' }}>Image-only advertising with custom action buttons for high conversion.</p>

            <form onSubmit={handlePublishAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Ad Headline / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Hire Professional Web Developers Today"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Ad Description / Caption *</label>
                <textarea
                  rows={3}
                  placeholder="Write a catchy promotional description for your audience..."
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Ad Image URL *</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (Image only, no video)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Action Button (CTA)</label>
                  <select
                    value={ctaType}
                    onChange={(e) => setCtaType(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="Learn More">Learn More</option>
                    <option value="Sign Up">Sign Up</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Direct Message">Direct Message (SHANORA)</option>
                    <option value="Apply Now">Apply Now</option>
                    <option value="Visit Website">Visit Website</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Daily Budget (PKR)</label>
                  <input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Destination URL / Link</label>
                <input
                  type="url"
                  placeholder="https://shanora.online/..."
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
              >
                {loading ? 'Publishing Campaign...' : 'Publish Ad Campaign 🚀'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
