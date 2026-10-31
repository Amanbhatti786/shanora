'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function RootHomePage() {
  const router = useRouter();

  useEffect(() => {
    async function evaluateSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.replace('/feed');
        } else {
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Session evaluation error:', error);
        router.replace('/auth');
      }
    }

    evaluateSession();
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#38bdf8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.95rem',
        fontWeight: '600',
        letterSpacing: '0.5px'
      }}
    >
      Redirecting to Shanora Feed...
    </div>
  );
}
