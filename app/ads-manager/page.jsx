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

  // Campaign Info Form State
  const [campaignName, setCampaignName] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('Brand Awareness');
  const [adCategory, setAdCategory] = useState('General Business');
  const [adDescription, setAdDescription] = useState('');
  const [campaignType, setCampaignType] = useState('Single Image Advertisement');

  // Ad Creative State (NO VIDEO)
  const [adTitle, setAdTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaType, setCtaType] = useState('Learn More');
  const [destinationUrl, setDestinationUrl] = useState('');
  
  // Target Audience State
  const [targetCountry, setTargetCountry] = useState('Pakistan');
  const [targetCity, setTargetCity] = useState('All Pakistan (Nationwide)');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [targetGender, setTargetGender] = useState('All');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [audienceInterests, setAudienceInterests] = useState('Technology, Business, Career');

  // Schedule & Pricing (199 PKR per day)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [durationDays, setDurationDays] = useState(3);
  
  const DAILY_PRICE_PKR = 199;
  const totalBudget = durationDays * DAILY_PRICE_PKR;
  const LEMON_SQUEEZY_CHECKOUT_URL = 'https://shanora-online.lemonsqueezy.com/checkout/buy/387d8c1b-ede1-46e0-96e4-d30fb0c49dde';

  // Calculate End Date automatically
  const calculateEndDate = () => {
    if (!startDate) return '';
    const start = new Date(startDate);
    start.setDate(start.getDate() + Number(durationDays));
    return start.toISOString().split('T')[0];
  };
  const endDate = calculateEndDate();

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [transactionId, setTransactionId] = useState('');

  const countryCitiesMap = {
    'Pakistan': ['All Pakistan (Nationwide)', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
    'United Arab Emirates (UAE)': ['All UAE (Nationwide)', 'Dubai', 'Abu Dhabi', 'Sharjah'],
    'Saudi Arabia': ['All Saudi Arabia (Nationwide)', 'Riyadh', 'Jeddah', 'Mecca'],
    'United States': ['All USA (Nationwide)', 'New York', 'Los Angeles', 'Chicago'],
    'United Kingdom': ['All UK (Nationwide)', 'London', 'Manchester'],
    'Canada': ['All Canada (Nationwide)', 'Toronto', 'Vancouver']
  };

  const handleCountryChange = (e) => {
    const sel = e.target.value;
    setTargetCountry(sel);
    const cities = countryCitiesMap[sel] || ['All Regions'];
    setTargetCity(cities[0]);
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
    if (!adTitle.trim() || !mediaUrl.trim() || !campaignName.trim()) {
      showToast('Please provide Campaign Name, Ad Headline, and upload an image.', 'error');
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
        campaign_name: campaignName.trim(),
        advertiser_name: advertiserName.trim() || session.user.email.split('@')[0],
        company_name: companyName.trim(),
        campaign_objective: campaignObjective,
        ad_category: adCategory,
        campaign_type: campaignType,
        title: adTitle.trim(),
        headline: adTitle.trim(),
        description: adDescription.trim(),
        ad_text: adDescription.trim(),
        media_url: mediaUrl.trim(),
        cta_type: ctaType,
        destination_url: destinationUrl.trim(),
        target_country: targetCountry,
        target_city: targetCity,
        min_age: Number(minAge),
        max_age: Number(maxAge),
        target_gender: targetGender,
        target_language: targetLanguage,
        audience_interests: audienceInterests,
        start_date: startDate,
        start_time: startTime,
        duration_days: Number(durationDays),
        end_date: endDate,
        budget: Number(totalBudget),
        daily_budget: Number(DAILY_PRICE_PKR),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        status: 'pending' // Pending Admin Review after payment
      }]);

      if (error) throw error;

      showToast('🎉 Congratulations! Your campaign has been submitted for review.');
      setCampaignName('');
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
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8' }}>📢 Professional Ads Campaign Hub</div>
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
            + Create Campaign 🚀
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.4rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Your Ad Campaigns</h3>
            {myAds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>No campaigns found. Create your first campaign now!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myAds.map(ad => (
                  <div key={ad.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: '#fff' }}>{ad.campaign_name || ad.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>Objective: {ad.campaign_objective || 'General'} | Target: {ad.target_city}, {ad.target_country} | Budget: Rs. {ad.budget} ({ad.duration_days} Days)</p>
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
            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.76rem', color: '#94a3b8' }}>Fixed Daily Pricing: <strong style={{ color: '#4ade80' }}>PKR 199 / day</strong>. Image-based ad creatives only.</p>

            <form onSubmit={handlePublishAd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* SECTION 1: CAMPAIGN INFO */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>📌 1. Campaign Information</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Campaign Name *</label>
                    <input type="text" placeholder="e.g. Summer Promo 2026" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Company / Brand Name</label>
                    <input type="text" placeholder="e.g. Shanora Tech" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Campaign Objective</label>
                    <select value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="Brand Awareness">Brand Awareness</option>
                      <option value="Website Traffic">Website Traffic</option>
                      <option value="Product Promotion">Product Promotion</option>
                      <option value="Service Promotion">Service Promotion</option>
                      <option value="Lead Generation">Lead Generation</option>
                      <option value="Job Promotion">Job Promotion</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Campaign Type</label>
                    <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="Single Image Advertisement">Single Image Advertisement</option>
                      <option value="Carousel Image Advertisement">Carousel Image Advertisement</option>
                      <option value="Sponsored Job Advertisement">Sponsored Job Advertisement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AD CREATIVE (NO VIDEO) */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#facc15' }}>🎨 2. Ad Creative (Image Only)</span>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Advertisement Headline *</label>
                  <input type="text" placeholder="e.g. Build Your Professional Future Today" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Primary Advertising Text / Description *</label>
                  <textarea rows={3} placeholder="Write promotional description..." value={adDescription} onChange={(e) => setAdDescription(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#38bdf8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Upload Advertisement Image *</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImg} style={{ fontSize: '0.78rem', color: '#94a3b8', width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem', boxSizing: 'border-box' }} />
                  {mediaUrl && <span style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '0.4rem', display: 'block' }}>Image uploaded successfully! ✓</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select value={ctaType} onChange={(e) => setCtaType(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                    <option value="Learn More">Learn More</option>
                    <option value="Apply Now">Apply Now</option>
                    <option value="Sign Up">Sign Up</option>
                    <option value="Shop Now">Shop Now</option>
                    <option value="Contact Us">Contact Us</option>
                    <option value="Visit Website">Visit Website</option>
                  </select>
                       <input type="url" placeholder="Destination URL (https://...)" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
                  {/* SECTION 3: TARGET AUDIENCE */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#eab308' }}>🌍 3. Target Audience</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Target Country</label>
                    <select value={targetCountry} onChange={handleCountryChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      {Object.keys(countryCitiesMap).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Target City / Region</label>
                    <select value={targetCity} onChange={(e) => setTargetCity(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      {currentCitiesList.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Min Age</label>
                    <input type="number" min="13" max="80" value={minAge} onChange={(e) => setMinAge(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Max Age</label>
                    <input type="number" min="13" max="80" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Gender</label>
                    <select value={targetGender} onChange={(e) => setTargetGender(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }}>
                      <option value="All">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: SCHEDULE & PRICING (199 PKR / DAY) */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#4ade80' }}>📅 4. Campaign Schedule & Pricing (PKR 199/Day)</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 'bold' }}>Duration (Days)</label>
                    <input type="number" min="1" max="90" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070b14', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Calculated End Date: <strong style={{ color: '#fff' }}>{endDate}</strong></span>
                  <strong style={{ color: '#4ade80', fontSize: '0.95rem' }}>Total: Rs. {totalBudget} ({durationDays} Days × Rs. 199)</strong>
                </div>
              </div>

              {/* SECTION 5: PAYMENT INTEGRATION */}
              <div style={{ backgroundColor: '#131b2e', padding: '1rem', borderRadius: '10px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>💳 5. Secure Payment Integration</span>
                
                <div style={{ backgroundColor: '#070b14', padding: '0.8rem', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>📋 Payment Instructions:</strong>
                  <div>1️⃣ Pay Rs. {totalBudget} via Card (Lemon Squeezy) or Local Transfer (Easypaisa/JazzCash 03033639664 - Amanullah).</div>
                  <div>2️⃣ Copy your Order ID / TID and paste it below to submit your campaign for instant admin review.</div>
                </div>

                <a href={LEMON_SQUEEZY_CHECKOUT_URL} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0284c7', color: '#fff', textAlign: 'center', textDecoration: 'none', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', display: 'block' }}>
                  Pay Securely via Card (Lemon Squeezy) ↗
                </a>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }}>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="LemonSqueezy">Lemon Squeezy (Card)</option>
                  </select>
                  <input type="text" placeholder="Enter TID / Order ID *" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }} required />
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
