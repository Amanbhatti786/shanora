'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AdsManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [myAds, setMyAds] = useState([]);
  const [toast, setToast] = useState(null);

  // Form State
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaType, setCtaType] = useState('Learn More');
  const [destinationUrl, setDestinationUrl] = useState('');
  
  // Targeting & Budget
  const [targetCountry, setTargetCountry] = useState('Pakistan');
  const [targetCity, setTargetCity] = useState('All Pakistan (Nationwide)');
  const [dailyBudget, setDailyBudget] = useState(500);
  const [durationDays, setDurationDays] = useState(3);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [transactionId, setTransactionId] = useState('');

  const totalBudget = dailyBudget * durationDays;
  const LEMON_SQUEEZY_CHECKOUT_URL = 'https://shanora-online.lemonsqueezy.com/checkout/buy/387d8c1b-ede1-46e0-96e4-d30fb0c49dde';

  // Comprehensive International Countries & Cities Mapping
  const countryCitiesMap = {
    'Pakistan': [
      'All Pakistan (Nationwide)',
      'Karachi',
      'Lahore',
      'Islamabad',
      'Rawalpindi',
      'Faisalabad',
      'Multan',
      'Peshawar',
      'Quetta',
      'Sukkur',
      'Hyderabad',
      'Sialkot',
      'Gujranwala',
      'Bahawalpur'
    ],
    'United Arab Emirates (UAE)': [
      'All UAE (Nationwide)',
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Ras Al Khaimah',
      'Fujairah',
      'Al Ain'
    ],
    'Saudi Arabia': [
      'All Saudi Arabia (Nationwide)',
      'Riyadh',
      'Jeddah',
      'Mecca',
      'Medina',
      'Dammam',
      'Khobar',
      'Tabuk'
    ],
    'United States': [
      'All USA (Nationwide)',
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Miami',
      'San Francisco',
      'Dallas',
      'Washington D.C.',
      'Boston'
    ],
    'United Kingdom': [
      'All UK (Nationwide)',
      'London',
      'Manchester',
      'Birmingham',
      'Glasgow',
      'Liverpool',
      'Edinburgh',
      'Leeds'
    ],
    'Canada': [
      'All Canada (Nationwide)',
      'Toronto',
      'Vancouver',
      'Montreal',
      'Calgary',
      'Ottawa',
      'Edmonton'
    ],
    'Australia': [
      'All Australia (Nationwide)',
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Perth',
      'Adelaide'
    ],
    'Qatar': [
      'All Qatar (Nationwide)',
      'Doha',
      'Al Rayyan',
      'Al Wakrah',
      'Umm Salal'
    ],
    'Oman': [
      'All Oman (Nationwide)',
      'Muscat',
      'Salalah',
      'Sohar',
      'Nizwa'
    ],
    'Bahrain': [
      'All Bahrain (Nationwide)',
      'Manama',
      'Riffa',
      'Muharraq',
      'Hamad Town'
    ]
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setTargetCountry(selectedCountry);
    const availableCities = countryCitiesMap[selectedCountry] || ['All Regions'];
    setTargetCity(availableCities[0]);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchUserAds();
  }, []);

  async function fetchUserAds() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .ilike('advertiser_email', session.user.email)
        .order('created_at', { ascending: false });

      if (data) setMyAds(data);
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB.', 'error');
      return;
    }

    setUploadingImg(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `ads/${Date.now()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setMediaUrl(pubData.publicUrl);
      showToast('Ad banner uploaded successfully! ✓');
    } catch (err) {
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploadingImg(false);
    }
  }

  const handlePublishAd = async (e) => {
    e.preventDefault();
    if (!adTitle.trim() || !mediaUrl.trim()) {
      showToast('Please provide an ad headline and upload an image.', 'error');
      return;
    }
    if (!transactionId.trim()) {
      showToast('Please enter your Payment Transaction ID (TID) or Order ID.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showToast('Please sign in to publish an ad.', 'error');
        router.push('/auth');
        return;
      }

      const { error } = await supabase.from('advertisements').insert([{
        advertiser_email: session.user.email.toLowerCase(),
        title: adTitle.trim(),
        headline: adTitle.trim(),
        description: adDescription.trim(),
        ad_text: adDescription.trim(),
        media_url: mediaUrl.trim(),
        cta_type: ctaType,
        destination_url: destinationUrl.trim(),
        target_country: targetCountry,
        target_city: targetCity,
        budget: Number(totalBudget),
        daily_budget: Number(dailyBudget),
        duration_days: Number(durationDays),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        status: 'pending'
      }]);

      if (error) throw error;

      showToast('🎉 Congratulations! Your ad campaign has been submitted successfully.');
      setAdTitle('');
      setAdDescription('');
      setMediaUrl('');
      setDestinationUrl('');
      setTransactionId('');
      setActiveTab('campaigns');
      fetchUserAds();
    } catch (err) {
      showToast('Error publishing ad: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentCitiesList = countryCitiesMap[targetCountry] || ['All Regions'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
          backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(34, 197, 94, 0.95)',
          color: '#fff', padding: '0.9rem 1.2rem', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontSize: '0.88rem', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '0.6rem'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '🎉'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => router.push('/profile?tab=menu')}
            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            ←
          </button>
          <Link href="/feed" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem', backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.28rem 0.65rem 0.28rem 0.35rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>S</div>
            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ fontSize: '0.55rem', color: '#38bdf8', verticalAlign: 'super' }}>.ONLINE</span></span>
          </Link>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8' }}>📢 Professional Ads Manager</div>
      </header>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.2rem 0.9rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            style={{ flex: 1, backgroundColor: activeTab === 'campaigns' ? '#0284c7' : 'transparent', color: activeTab === 'campaigns' ? '#fff' : '#94a3b8', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            My Campaigns 📊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{ flex: 1, backgroundColor: activeTab === 'create' ? '#0284c7' : 'transparent', color: activeTab === 'create' ? '#fff' : '#94a3b8', border: 'none', padding: '0.55rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            + Create Pro Ad 🚀
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Your Ad Campaigns</h3>
            {myAds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>No campaigns found. Create one now!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myAds.map(ad => (
                  <div key={ad.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: '#fff' }}>{ad.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>Target: {ad.target_city}, {ad.target_country} | Budget: Rs. {ad.budget}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '0.3rem 0.7rem', borderRadius: '6px', backgroundColor: ad.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: ad.status === 'approved' ? '#4ade80' : '#facc15' }}>
                      {ad.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Create Professional Ad Campaign</h3>
            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.76rem', color: '#94a3b8' }}>Target global countries and major business hubs with precise budget pacing.</p>

            <form onSubmit={handlePublishAd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Ad Headline / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Shanora Web Development Agency"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Ad Description / Caption *</label>
                <textarea
                  rows={3}
                  placeholder="Write promotional description..."
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Upload Ad Banner Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImg}
                  style={{ fontSize: '0.78rem', color: '#94a3b8', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem', boxSizing: 'border-box' }}
                />
                {mediaUrl && <span style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '0.4rem', display: 'block' }}>Image uploaded successfully! ✓</span>}
              </div>

              {/* GLOBAL CASCADING GEOGRAPHIC TARGETING */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#eab308' }}>🌍 Global Geographic Targeting</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Select Country</label>
                    <select 
                      value={targetCountry} 
                      onChange={handleCountryChange} 
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    >
                      {Object.keys(countryCitiesMap).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Select City / Region</label>
                    <select 
                      value={targetCity} 
                      onChange={(e) => setTargetCity(e.target.value)} 
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    >
                      {currentCitiesList.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BUDGET & DURATION */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#4ade80' }}>💰 Budget & Duration Settings</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Daily Budget (Rs.)</label>
                    <input 
                      type="number" 
                      min="200" 
                      value={dailyBudget} 
                      onChange={(e) => setDailyBudget(Number(e.target.value))} 
                      placeholder="e.g. 500" 
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Duration (Days)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={durationDays} 
                      onChange={(e) => setDurationDays(Number(e.target.value))} 
                      placeholder="e.g. 3" 
                      style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070b14', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Total Campaign Cost:</span>
                  <strong style={{ color: '#4ade80', fontSize: '0.95rem' }}>Rs. {totalBudget}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <select value={ctaType} onChange={(e) => setCtaType(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                  <option value="Learn More">Learn More</option>
                  <option value="Sign Up">Sign Up</option>
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Apply Now">Apply Now</option>
                </select>
                <input type="url" placeholder="Destination URL (https://...)" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* PAYMENT SECTION WITH CARD ICONS */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>💳 Payment Verification & International Cards</span>
                  <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem', backgroundColor: '#070b14', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #334155', color: '#94a3b8' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>💳 Visa</span>
                    <span>•</span>
                    <span style={{ color: '#f97316', fontWeight: 'bold' }}>MasterCard</span>
                    <span>•</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Amex</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  Send Rs. {totalBudget} via JazzCash / Easypaisa to Founder <strong style={{ color: '#38bdf8' }}>Amanullah</strong> at <strong style={{ color: '#4ade80' }}>03033639664</strong>.<br />
                  For International / Card payments, use Lemon Squeezy below.
                </p>

                <a 
                  href={LEMON_SQUEEZY_CHECKOUT_URL} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ backgroundColor: '#0284c7', color: '#fff', textAlign: 'center', textDecoration: 'none', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>Pay Securely with Card (Visa / Master) ↗</span>
                </a>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.3rem' }}>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                    <option value="EasyPaisa">EasyPaisa (Amanullah)</option>
                    <option value="JazzCash">JazzCash (Amanullah)</option>
                    <option value="LemonSqueezy">Lemon Squeezy (Card)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter TID / Order ID *"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploadingImg}
                style={{ backgroundColor: '#eab308', color: '#000', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {loading ? 'Submitting Campaign...' : 'Publish Pro Ad Campaign 🚀'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
