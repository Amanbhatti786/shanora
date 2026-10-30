'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminProRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [adminUser, setAdminUser] = useState(null);

  // Aapka apna email address jo admin access rakhta ho
  const ADMIN_EMAILS = ['amanullahmahtam@gmail.com']; // Yahan apna login email daal sakte hain

  useEffect(() => {
    async function loadRequests() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }

        setAdminUser(session.user);

        // Fetch all pro requests ordered by newest first
        const { data, error } = await supabase
          .from('pro_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching admin pro requests:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [router]);

  // Handle Approve Request
  async function handleApprove(reqItem) {
    if (!confirm(`Kya aap ${reqItem.user_email} ko Shanora PRO aur Blue Tick dena chahte hain?`)) return;

    setActionLoading(prev => ({ ...prev, [reqItem.id]: true }));
    try {
      // 1. Update pro_requests status to 'approved'
      const { error: reqError } = await supabase
        .from('pro_requests')
        .update({ status: 'approved' })
        .eq('id', reqItem.id);

      if (reqError) throw reqError;

      // 2. Grant Blue Tick & PRO status in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_pro: true, 
          pro_plan: 'PRO_MONTHLY' 
        })
        .ilike('email', reqItem.user_email.toLowerCase());

      if (profileError) throw profileError;

      // 3. Send Notification to User
      await supabase
        .from('notifications')
        .insert([{
          recipient_email: reqItem.user_email.toLowerCase(),
          sender_name: 'Shanora Team',
          action_type: 'pro',
          content: 'Mubarak ho! Aapka Shanora PRO aur Blue Tick activate kar diya gaya hai. 💎✨',
          is_read: false
        }]);

      // Update state locally
      setRequests(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: 'approved' } : r));
      alert('Request successfully APPROVED! Blue tick live ho gaya hai. 💎');
    } catch (err) {
      alert('Approval error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqItem.id]: false }));
    }
  }

  // Handle Reject Request
  async function handleReject(reqItem) {
    if (!confirm(`Kya aap ${reqItem.user_email} ki request reject karna chahte hain?`)) return;

    setActionLoading(prev => ({ ...prev, [reqItem.id]: true }));
    try {
      const { error } = await supabase
        .from('pro_requests')
        .update({ status: 'rejected' })
        .eq('id', reqItem.id);

      if (error) throw error;

      setRequests(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: 'rejected' } : r));
      alert('Request REJECTED.');
    } catch (err) {
      alert('Rejection error: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqItem.id]: false }));
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💎</span> Shanora PRO Requests Manager
            </h1>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              EasyPaisa aur JazzCash payments verify karein aur Blue Tick grant karein.
            </p>
          </div>
          <Link href="/profile?tab=menu" style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Back to App
          </Link>
        </div>

        {/* Requests Counter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending Approvals</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#facc15' }}>
              {requests.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Approved</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Revenue</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#38bdf8' }}>
              Rs. {requests.filter(r => r.status === 'approved').length * 499}
            </div>
          </div>
        </div>

        {/* Requests Table / List */}
        {requests.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Abhi tak kisi user ne PRO request submit nahi ki.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {requests.map(reqItem => (
              <div 
                key={reqItem.id}
                style={{
                  backgroundColor: '#0f172a',
                  border: reqItem.status === 'pending' ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid #1e293b',
                  borderRadius: '14px',
                  padding: '1.1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{reqItem.user_email}</strong>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 'bold',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: reqItem.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : (reqItem.status === 'pending' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                      color: reqItem.status === 'approved' ? '#4ade80' : (reqItem.status === 'pending' ? '#facc15' : '#ef4444'),
                      textTransform: 'uppercase'
                    }}>
                      {reqItem.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span>💳 Method: <strong style={{ color: '#cbd5e1' }}>{reqItem.payment_method}</strong></span>
                    <span>💰 Amount: <strong style={{ color: '#4ade80' }}>Rs. {reqItem.amount}</strong></span>
                    <span>🔑 TID: <code style={{ backgroundColor: '#1e293b', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#38bdf8' }}>{reqItem.transaction_id}</code></span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Requested: {new Date(reqItem.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {reqItem.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(reqItem)}
                        disabled={actionLoading[reqItem.id]}
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#000',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {actionLoading[reqItem.id] ? 'Processing...' : 'Approve & Give Blue Tick ✓'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(reqItem)}
                        disabled={actionLoading[reqItem.id]}
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Reject ✕
                      </button>
                    </>
                  ) : reqItem.status === 'approved' ? (
                    <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>
                      Active Member 💎✓
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
