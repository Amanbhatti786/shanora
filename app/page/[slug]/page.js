'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function PublicPageView() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [pageData, setPageData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    async function fetchPageDetails() {
      if (!slug) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // Fetch Page Data by slug
        const { data: page, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !page) {
          setPageData(null);
        } else {
          setPageData(page);
          setFollowerCount(page.followers_count || 0);

          // Check if current logged-in user already follows this page
          if (session?.user?.email) {
            const { data: followRecord } = await supabase
              .from('page_followers')
              .select('id')
              .eq('page_id', page.id)
              .eq('follower_email', session.user.email)
              .maybeSingle();

            if (followRecord) {
              setIsFollowing(true);
            }
          }
        }
      } catch (err) {
        console.error('Error loading page:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPageDetails();
  }, [slug]);

  async function handleToggleFollow() {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!pageData || actionLoading) return;

    setActionLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('page_followers')
          .delete()
          .eq('page_id', pageData.id)
          .eq('follower_email', currentUser.email);

        const newCount = Math.max(0, followerCount - 1);
        await supabase
          .from('pages')
          .update({ followers_count: newCount })
          .eq('id', pageData.id);

        setIsFollowing(false);
        setFollowerCount(newCount);
      } else {
        // Follow
        await supabase
          .from('page_followers')
          .insert([
            { page_id: pageData.id, follower_email: currentUser.email }
          ]);

        const newCount = followerCount + 1;
        await supabase
          .from('pages')
          .update({ followers_count: newCount })
          .eq('id', pageData.id);

        setIsFollowing(true);
        setFollowerCount(newCount);
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'system-ui' }}>
        Loading Official Page...
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'system-ui' }}>
        <h2>Page Not Found</h2>
        <p style={{ color: '#94a3b8' }}>The requested organization or creator page does not exist.</p>
        <Link href="/feed" style={{ color: '#38bdf8', marginTop: '1rem', textDecoration: 'none' }}>
          Back to Feed ➔
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: '900', fontSize: '1.2rem' }}>
          SHANORA<span style={{ color: '#38bdf8' }}>.PK</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/feed" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Feed 🌐
          </Link>
          <Link href="/profile" style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #334155' }}>
            Portal 💼
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Facebook-style Cover Banner */}
        <div style={{ 
          height: '180px', 
          background: 'linear-gradient(135deg, #0284c7 0%, #1e1b4b 100%)', 
          borderBottomLeftRadius: '16px', 
          borderBottomRightRadius: '16px',
          position: 'relative'
        }}>
          {pageData.monetization_status === 'approved' && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#22c55e', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              ✓ Verified Partner
            </div>
          )}
        </div>

        {/* Profile Card Overlay */}
        <div style={{ padding: '0 1.5rem', marginTop: '-50px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Avatar & Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                backgroundColor: '#1e293b', 
                border: '4px solid #070b14', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '2.5rem', 
                fontWeight: '900', 
                color: '#38bdf8',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                {pageData.name?.charAt(0).toUpperCase()}
              </div>

              {/* Follow / Edit Button */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={actionLoading}
                  style={{
                    backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                    color: '#fff',
                    border: isFollowing ? '1px solid #334155' : 'none',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {isFollowing ? '✓ Following' : '+ Follow Page'}
                </button>
              </div>
            </div>

            {/* Page Info */}
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0 0.2rem 0', color: '#fff' }}>
                {pageData.name}
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                {pageData.headline || pageData.category || 'Creator & Organization'}[span_7](start_span)[span_7](end_span)
              </p>

              {/* Followers & Category Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <div>
                  <strong style={{ color: '#38bdf8' }}>{followerCount}</strong> followers
                </div>
                <div>•</div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #334155', fontSize: '0.75rem' }}>
                  {pageData.category || 'Organization'}[span_8](start_span)[span_8](end_span)
                </div>
                {pageData.city && (
                  <>
                    <div>•</div>
                    <div style={{ color: '#94a3b8' }}>📍 {pageData.city}, {pageData.country || 'Pakistan'}</div>[span_9](start_span)[span_9](end_span)
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Facebook-style Navigation Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #1e293b', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
            {['about', 'posts', 'community'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  backgroundColor: activeTab === tab ? '#1e293b' : 'transparent',
                  color: activeTab === tab ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginTop: '1.2rem' }}>
            
            {activeTab === 'about' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.4rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.6rem 0' }}>About This Page</h3>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  {pageData.about || pageData.description || 'No detailed description provided yet.'}
                </p>

                <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <div>🌐 <strong>Official URL:</strong> shanora.pk/page/{pageData.slug}</div>[span_10](start_span)[span_10](end_span)
                  <div>💼 <strong>Industry:</strong> {pageData.category || 'General'}</div>[span_11](start_span)[span_11](end_span)
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No announcements or updates published by this page yet.
              </div>
            )}

            {activeTab === 'community' && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.4rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.6rem 0' }}>Community Reach</h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                  Currently followed by {followerCount} community members and professionals.
                </p>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
             }
                  
