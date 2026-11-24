'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const DAILY_PRICE_PKR = 199;

// Future-ready payment architecture placeholder (no live gateway integrated yet)
const FUTURE_PAYMENT_PROVIDERS = [
  { id: 'stripe', label: 'Stripe (Future Ready)' },
  { id: 'paypal', label: 'PayPal (Future Ready)' },
  { id: 'safepay', label: 'Safepay (Future Ready)' }
];

const AD_CATEGORIES = [
  'General Business',
  'Technology & Software',
  'Jobs & Recruitment',
  'Education & Training',
  'E-Commerce & Retail',
  'Real Estate & Property',
  'Freelancing & Digital Services',
  'Healthcare & Wellness',
  'Finance & Consulting'
];

const AUDIENCE_INTEREST_OPTIONS = [
  'Technology',
  'Business',
  'Career',
  'Jobs & Hiring',
  'Startups',
  'Software Development',
  'Digital Marketing',
  'E-Commerce',
  'Education',
  'Freelancing'
];

const TARGET_LANGUAGES = [
  'English',
  'Urdu',
  'Sindhi',
  'Arabic',
  'All Languages'
];

const PLACEMENT_OPTIONS = [
  { id: 'feed_every_4_posts', label: 'Feed Stream (Every 4 Posts — Active)' },
  { id: 'feed_top_spotlight', label: 'Feed Spotlight Slot (Queued)' },
  { id: 'profile_sidebar', label: 'Profile Discovery Slot (Queued)' }
];

const COUNTRY_CITIES_MAP = {
  'Pakistan': ['All Pakistan (Nationwide)', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'],
  'United Arab Emirates (UAE)': ['All UAE (Nationwide)', 'Dubai', 'Abu Dhabi', 'Sharjah'],
  'Saudi Arabia': ['All Saudi Arabia (Nationwide)', 'Riyadh', 'Jeddah', 'Mecca'],
  'United States': ['All USA (Nationwide)', 'New York', 'Los Angeles', 'Chicago'],
  'United Kingdom': ['All UK (Nationwide)', 'London', 'Manchester'],
  'Canada': ['All Canada (Nationwide)', 'Toronto', 'Vancouver']
};

function calculateCtr(impressions, clicks) {
  const imp = Number(impressions || 0);
  const clk = Number(clicks || 0);
  if (!imp || imp <= 0) return '0.00%';
  return `${((clk / imp) * 100).toFixed(2)}%`;
}

export default function AdsManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Advertiser & Admin datasets
  const [myAds, setMyAds] = useState([]);
  const [allAdsForAdmin, setAllAdsForAdmin] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Post-submit payment step state (shown AFTER campaign submission)
  const [submittedCampaignForPayment, setSubmittedCampaignForPayment] = useState(null);
  const [selectedFutureProvider, setSelectedFutureProvider] = useState('stripe');
  const [paymentStepMessage, setPaymentStepMessage] = useState('');

  // Campaign Info Form State
  const [campaignName, setCampaignName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('Brand Awareness');
  const [adCategory, setAdCategory] = useState('General Business');
  const [adDescription, setAdDescription] = useState('');
  const [campaignType, setCampaignType] = useState('Single Image Advertisement');
  const [placements, setPlacements] = useState(['feed_every_4_posts']);

  // Ad Creative State (Image Only)
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
  const [selectedInterests, setSelectedInterests] = useState(['Technology', 'Business', 'Career']);

  // Schedule & Budget
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [durationDays, setDurationDays] = useState(3);

  const totalBudget = useMemo(() => {
    const days = Math.max(1, Number(durationDays || 1));
    return days * DAILY_PRICE_PKR;
  }, [durationDays]);

  const endDate = useMemo(() => {
    if (!startDate) return '';
    const start = new Date(`${startDate}T00:00:00`);
    start.setDate(start.getDate() + Math.max(1, Number(durationDays || 1)));
    return start.toISOString().split('T')[0];
  }, [startDate, durationDays]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAdsData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);
      if (!user) return;

      let adminFlag = false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (
        profile?.is_admin === true ||
        ['admin', 'super_admin'].includes(String(profile?.role || '').toLowerCase())
      ) {
        adminFlag = true;
      }
      setIsAdmin(adminFlag);

      const { data: userCampaigns } = await supabase
        .from('advertisements')
        .select('*')
        .or(`advertiser_user_id.eq.${user.id},advertiser_email.ilike.${user.email}`)
        .order('created_at', { ascending: false });

      if (userCampaigns) {
        setMyAds(userCampaigns);
      }

      if (adminFlag) {
        const { data: adminCampaigns } = await supabase
          .from('advertisements')
          .select('*')
          .order('created_at', { ascending: false });
        if (adminCampaigns) {
          setAllAdsForAdmin(adminCampaigns);
        }
      }
    } catch (err) {
      console.error('Error loading ads data:', err);
    }
  }, []);

  useEffect(() => {
    loadAdsData();
  }, [loadAdsData]);

  const handleCountryChange = (e) => {
    const sel = e.target.value;
    setTargetCountry(sel);
    const cities = COUNTRY_CITIES_MAP[sel] || ['All Regions'];
    setTargetCity(cities[0]);
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.length > 1 ? prev.filter((item) => item !== interest) : prev;
      }
      return [...prev, interest];
    });
  };

  const togglePlacement = (placementId) => {
    setPlacements((prev) => {
      if (prev.includes(placementId)) {
        return prev.length > 1 ? prev.filter((item) => item !== placementId) : prev;
      }
      return [...prev, placementId];
    });
  };

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB.', 'error');
      return;
    }

    setUploadingImg(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userIdPrefix = session?.user?.id || 'guest';
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `ads/${userIdPrefix}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setMediaUrl(pubData.publicUrl);
      showToast('Ad banner uploaded successfully!');
    } catch (err) {
      showToast(`Image upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingImg(false);
    }
  }

  // Step 1: Submit campaign (never auto-active; unlocks payment option after submission)
  const handleSubmitCampaign = async (e) => {
    e.preventDefault();
    if (loading || uploadingImg) return;

    if (!campaignName.trim() || !adTitle.trim() || !mediaUrl.trim()) {
      showToast('Please fill Campaign Name, Ad Headline, and upload an image.', 'error');
      return;
    }

    setLoading(true);
    setPaymentStepMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showToast('Please sign in to create a campaign.', 'error');
        router.push('/auth');
        return;
      }

      const payload = {
        advertiser_user_id: session.user.id,
        advertiser_email: session.user.email.toLowerCase(),
        campaign_name: campaignName.trim(),
        advertiser_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
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
        min_age: Number(minAge) || 18,
        max_age: Math.max(Number(minAge) || 18, Number(maxAge) || 65),
        target_gender: targetGender,
        target_language: targetLanguage,
        audience_interests: selectedInterests.join(', '),
        placements: placements.length > 0 ? placements : ['feed_every_4_posts'],
        start_date: startDate,
        start_time: startTime,
        duration_days: Math.max(1, Number(durationDays) || 1),
        end_date: endDate,
        budget: Number(totalBudget),
        daily_budget: Number(DAILY_PRICE_PKR),
        payment_status: 'pending_payment',
        payment_provider: selectedFutureProvider,
        is_admin_approved: false,
        status: 'pending' // Never auto-active
      };

      const { data: insertedRows, error } = await supabase
        .from('advertisements')
        .insert([payload])
        .select('*');

      if (error) throw error;

      const createdCampaign = insertedRows?.[0] || {
        ...payload,
        id: `draft-${Date.now()}`
      };

      setSubmittedCampaignForPayment(createdCampaign);
      setCampaignName('');
      setCompanyName('');
      setAdTitle('');
      setAdDescription('');
      setMediaUrl('');
      setDestinationUrl('');

      showToast('Campaign submitted! Complete the payment step below; admin approval is required before launch.');
      await loadAdsData();
    } catch (err) {
      showToast(`Error submitting campaign: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Post-submit payment preparation handler (no live payment gateway integrated yet)
  const handleQueuePaymentForSubmittedCampaign = async () => {
    if (!submittedCampaignForPayment?.id) return;
    setLoading(true);
    try {
      const refCode = `SHN-PAY-${Date.now().toString().slice(-6)}`;
      if (!String(submittedCampaignForPayment.id).startsWith('draft-')) {
        await supabase
          .from('advertisements')
          .update({
            payment_provider: selectedFutureProvider,
            payment_status: 'awaiting_gateway_setup',
            payment_reference: refCode
          })
          .eq('id', submittedCampaignForPayment.id);
      }

      setPaymentStepMessage(
        `Payment checkout is queued for "${submittedCampaignForPayment.campaign_name}" via ${selectedFutureProvider.toUpperCase()} (Ref: ${refCode}). Live gateway integration will be connected later, and an admin must approve before the ad runs on Feed.`
      );
      await loadAdsData();
    } catch (err) {
      showToast(`Could not update payment status: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Admin moderation controls: approve/activate, pause, reject, delete
  const handleAdminModeration = async (adId, actionType) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      if (actionType === 'delete') {
        const { error } = await supabase.from('advertisements').delete().eq('id', adId);
        if (error) throw error;
        showToast('Campaign deleted.');
      } else {
        const updates =
          actionType === 'activate'
            ? { status: 'active', is_admin_approved: true }
            : actionType === 'pause'
            ? { status: 'paused', is_admin_approved: false }
            : { status: 'rejected', is_admin_approved: false };

        const { error } = await supabase.from('advertisements').update(updates).eq('id', adId);
        if (error) throw error;
        showToast(`Campaign updated: ${actionType.toUpperCase()}.`);
      }
      await loadAdsData();
    } catch (err) {
      showToast(`Admin action failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const summaryMetrics = useMemo(() => {
    const totalImpressions = myAds.reduce((sum, ad) => sum + Number(ad.impressions || 0), 0);
    const totalClicks = myAds.reduce((sum, ad) => sum + Number(ad.clicks || 0), 0);
    const totalReach = myAds.reduce((sum, ad) => sum + Number(ad.reach || 0), 0);
    const totalSpend = myAds.reduce((sum, ad) => sum + Number(ad.budget || 0), 0);
    return {
      totalCampaigns: myAds.length,
      totalImpressions,
      totalClicks,
      totalReach,
      totalSpend,
      avgCtr: calculateCtr(totalImpressions, totalClicks)
    };
  }, [myAds]);

  const filteredCampaigns = useMemo(() => {
    return myAds.filter((ad) => {
      const matchesStatus =
        statusFilter === 'all' || String(ad.status || '').toLowerCase() === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        String(ad.campaign_name || '').toLowerCase().includes(q) ||
        String(ad.title || '').toLowerCase().includes(q) ||
        String(ad.target_country || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [myAds, statusFilter, searchQuery]);

  const currentCitiesList = COUNTRY_CITIES_MAP[targetCountry] || ['All Regions'];

  const labelStyle = {
    display: 'block',
    fontSize: '0.72rem',
    color: '#94a3b8',
    marginBottom: '0.28rem',
    fontWeight: '700'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '0.6rem',
    color: '#fff',
    fontSize: '0.82rem',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(2, 132, 199, 0.96)',
            color: '#fff',
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            fontSize: '0.85rem',
            fontWeight: '700'
          }}
        >
          {toast.message}
        </div>
      )}

      <header
        style={{
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '0.85rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => router.push('/profile?tab=menu')}
            style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ←
          </button>
          <Link href="/feed" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.55rem', backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.3rem 0.65rem' }}>
            <span style={{ fontWeight: '900', color: '#fff', fontSize: '1rem' }}>
              SHANORA<span style={{ color: '#38bdf8', fontSize: '0.6rem', verticalAlign: 'super' }}>.ONLINE</span>
            </span>
          </Link>
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#38bdf8' }}>
          SHANORA Ads Manager
        </div>
      </header>

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '1.2rem 0.9rem' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.45rem',
            marginBottom: '1.2rem',
            backgroundColor: '#0f172a',
            padding: '0.35rem',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            flexWrap: 'wrap'
          }}
        >
          {[
            { id: 'dashboard', label: 'Dashboard & Analytics' },
            { id: 'campaigns', label: `My Campaigns (${myAds.length})` },
            { id: 'create', label: '+ Create Campaign' },
            ...(isAdmin ? [{ id: 'admin', label: `Admin Controls (${allAdsForAdmin.length})` }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 150px',
                backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. ADVERTISER DASHBOARD & ANALYTICS */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Impressions</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.2rem' }}>{summaryMetrics.totalImpressions}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Clicks</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4ade80', marginTop: '0.2rem' }}>{summaryMetrics.totalClicks}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>CTR</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#facc15', marginTop: '0.2rem' }}>{summaryMetrics.avgCtr}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Reach / Planned Spend</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem' }}>
                  {summaryMetrics.totalReach} • Rs. {summaryMetrics.totalSpend}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>Feed Delivery & Approval Workflow</strong>
              Approved active ads appear on the <strong>Feed page after every 4 posts</strong>. Campaigns never launch automatically and require administrator approval.
            </div>
          </div>
        )}

        {/* 2. MY CAMPAIGNS WITH FILTERING, STATUS & ANALYTICS */}
        {activeTab === 'campaigns' && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search campaign or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: '1 1 200px', backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.82rem' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.82rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {!currentUser ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sign in to view your campaigns.</div>
            ) : filteredCampaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No matching campaigns found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredCampaigns.map((ad) => (
                  <div
                    key={ad.id}
                    style={{
                      backgroundColor: '#131b2e',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '0.95rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>{ad.campaign_name || ad.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {ad.target_city}, {ad.target_country} • Rs. {ad.budget} ({ad.duration_days || 1}d) • Payment: {ad.payment_status || 'pending_payment'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '0.28rem 0.65rem',
                          borderRadius: '999px',
                          backgroundColor: ad.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: ad.status === 'active' ? '#4ade80' : '#facc15'
                        }}
                      >
                        {String(ad.status || 'pending').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#cbd5e1', backgroundColor: '#070b14', padding: '0.55rem 0.75rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                      <span>Impressions: <strong>{ad.impressions || 0}</strong></span>
                      <span>Clicks: <strong>{ad.clicks || 0}</strong></span>
                      <span>CTR: <strong>{calculateCtr(ad.impressions, ad.clicks)}</strong></span>
                      <span>Reach: <strong>{ad.reach || 0}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. CREATE CAMPAIGN + POST-SUBMIT PAYMENT OPTION */}
        {activeTab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.35rem' }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '800' }}>Create Advertising Campaign</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Rate: <strong style={{ color: '#4ade80' }}>PKR {DAILY_PRICE_PKR} / day</strong>. Payment option appears <strong>after</strong> you submit your campaign.
              </p>

              <form onSubmit={handleSubmitCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {/* Campaign Information */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Campaign Name *</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g. Shanora Launch Campaign"
                      required
                      style={{ ...inputStyle, backgroundColor: '#131b2e' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company / Brand Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Shanora"
                      style={{ ...inputStyle, backgroundColor: '#131b2e' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Campaign Objective</label>
                    <select value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} style={{ ...inputStyle, backgroundColor: '#131b2e' }}>
                      <option value="Brand Awareness">Brand Awareness</option>
                      <option value="Website Traffic">Website Traffic</option>
                      <option value="Product Promotion">Product Promotion</option>
                      <option value="Service Promotion">Service Promotion</option>
                      <option value="Job Promotion">Job Promotion</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Business / Ad Category (Select)</label>
                    <select value={adCategory} onChange={(e) => setAdCategory(e.target.value)} style={{ ...inputStyle, backgroundColor: '#131b2e' }}>
                      {AD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Creative Type</label>
                    <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} style={{ ...inputStyle, backgroundColor: '#131b2e' }}>
                      <option value="Single Image Advertisement">Single Image Advertisement</option>
                      <option value="Banner Advertisement">Banner Advertisement</option>
                    </select>
                  </div>
                </div>

                {/* Creative Upload */}
                <div style={{ backgroundColor: '#131b2e', padding: '0.95rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#38bdf8' }}>Ad Creative & Banner</div>
                  <div>
                    <label style={labelStyle}>Advertisement Headline *</label>
                    <input
                      type="text"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder="e.g. Grow Your Career with SHANORA"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ad Description / Promotional Text</label>
                    <textarea
                      rows={2}
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      placeholder="Write short details about your offer..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Upload Ad Image / Banner (Max 5MB) *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImg}
                      style={{ ...inputStyle, padding: '0.45rem', color: '#94a3b8' }}
                    />
                    {mediaUrl && (
                      <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.3rem' }}>Banner uploaded successfully!</div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                    <div>
                      <label style={labelStyle}>Call-to-Action Button</label>
                      <select value={ctaType} onChange={(e) => setCtaType(e.target.value)} style={inputStyle}>
                        <option value="Learn More">Learn More</option>
                        <option value="Apply Now">Apply Now</option>
                        <option value="Sign Up">Sign Up</option>
                        <option value="Shop Now">Shop Now</option>
                        <option value="Contact Us">Contact Us</option>
                        <option value="Visit Website">Visit Website</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Destination Website URL</label>
                      <input
                        type="url"
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                        placeholder="https://example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Targeting & Placements */}
                <div style={{ backgroundColor: '#131b2e', padding: '0.95rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#facc15' }}>Audience & Placements</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
                    <div>
                      <label style={labelStyle}>Target Country</label>
                      <select value={targetCountry} onChange={handleCountryChange} style={inputStyle}>
                        {Object.keys(COUNTRY_CITIES_MAP).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Target City / Region</label>
                      <select value={targetCity} onChange={(e) => setTargetCity(e.target.value)} style={inputStyle}>
                        {currentCitiesList.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Target Gender</label>
                      <select value={targetGender} onChange={(e) => setTargetGender(e.target.value)} style={inputStyle}>
                        <option value="All">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                    <div>
                      <label style={labelStyle}>Minimum Age (Years)</label>
                      <input type="number" min="13" max="80" value={minAge} onChange={(e) => setMinAge(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Maximum Age (Years)</label>
                      <input type="number" min="13" max="80" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Audience Language</label>
                      <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} style={inputStyle}>
                        {TARGET_LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Target Audience Interests (Click to Select — users with these interests see your ad)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
                      {AUDIENCE_INTEREST_OPTIONS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            style={{
                              padding: '0.36rem 0.72rem',
                              borderRadius: '999px',
                              border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                              color: isSelected ? '#38bdf8' : '#cbd5e1',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? `✓ ${interest}` : `+ ${interest}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Ad Placements</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {PLACEMENT_OPTIONS.map((p) => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                          <input
                            type="checkbox"
                            checked={placements.includes(p.id)}
                            onChange={() => togglePlacement(p.id)}
                          />
                          <span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Budget & Schedule */}
                <div style={{ backgroundColor: '#131b2e', padding: '0.95rem', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#4ade80' }}>Schedule & Budget (PKR {DAILY_PRICE_PKR} / Day)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                    <div>
                      <label style={labelStyle}>Campaign Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Start Time</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Campaign Duration (Days)</label>
                      <input type="number" min="1" max="90" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#070b14', padding: '0.65rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <span>Calculated End Date: <strong>{endDate}</strong></span>
                    <strong style={{ color: '#4ade80' }}>Total Budget: Rs. {totalBudget} ({Math.max(1, Number(durationDays || 1))} Days × Rs. {DAILY_PRICE_PKR})</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingImg}
                  style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.78rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {loading ? 'Submitting Campaign...' : 'Submit Campaign & Continue to Payment Step'}
                </button>
              </form>
            </div>

            {/* Payment Option Shown ONLY AFTER Campaign Submission */}
            {submittedCampaignForPayment && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #eab308', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#facc15' }}>
                  Step 2: Campaign Payment (After Submission)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Campaign: <strong>{submittedCampaignForPayment.campaign_name}</strong> • Amount: <strong>Rs. {submittedCampaignForPayment.budget}</strong> • Status: <strong>PENDING ADMIN APPROVAL</strong>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Payment gateway integration is deferred for a later stage. Choose a planned international provider below to prepare your checkout record; your campaign will only go live after admin approval.
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={selectedFutureProvider}
                    onChange={(e) => setSelectedFutureProvider(e.target.value)}
                    style={{ backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.82rem' }}
                  >
                    {FUTURE_PAYMENT_PROVIDERS.map((prov) => (
                      <option key={prov.id} value={prov.id}>{prov.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleQueuePaymentForSubmittedCampaign}
                    style={{ backgroundColor: '#eab308', color: '#070b14', border: 'none', padding: '0.62rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Prepare Payment Step (Gateway Later)
                  </button>
                </div>

                {paymentStepMessage && (
                  <div style={{ backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#7dd3fc' }}>
                    {paymentStepMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. ADMIN ADS MANAGEMENT DASHBOARD */}
        {activeTab === 'admin' && isAdmin && (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#38bdf8' }}>
              Admin Ads Moderation & Activation
            </h3>
            {allAdsForAdmin.map((ad) => (
              <div
                key={ad.id}
                style={{
                  backgroundColor: '#131b2e',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.6rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#fff' }}>{ad.campaign_name || ad.title}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {ad.advertiser_email} • Status: <strong>{ad.status}</strong> • Budget: Rs. {ad.budget}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleAdminModeration(ad.id, 'activate')}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Approve & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminModeration(ad.id, 'pause')}
                    style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminModeration(ad.id, 'reject')}
                    style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminModeration(ad.id, 'delete')}
                    style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
