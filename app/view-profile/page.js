'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aeyvwtphbmsbvxzmsftv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXZ3dHBoYm1zYnZ4em1zZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NTg1MDcsImV4cCI6MjA1ODUzNDUwN30.ZqG9sE2r9n5W1o7V2_Q5UeXy7_9vYy_example'
);

function ProfileCard() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!emailParam) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailParam.trim().toLowerCase())
          .maybeSingle();

        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [emailParam]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div>;
  }

  if (!profile) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h2>Profile Not Found</h2>
        <Link href="/" style={{ color: '#38bdf8', marginTop: '1rem' }}>Back to Home</Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem', maxWidth: '700px', margin: '0 auto', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Home</Link>
      
      <div style={{ backgroundColor: '#131b2e', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #1e293b' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{profile.full_name}</h1>
        <p style={{ color: '#38bdf8', margin: '0 0 1rem 0' }}>{profile.degree} • {profile.university}</p>
        <p style={{ color: '#94a3b8' }}>{profile.bio}</p>
        
        {profile.phone && (
          <a 
            href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`} 
            style={{ display: 'inline-block', marginTop: '1rem', backgroundColor: '#22c55e', color: '#000', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}
          >
            Chat on WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileCard />
    </Suspense>
  );
}
