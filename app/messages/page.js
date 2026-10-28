'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

function ChatBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directChatWith = searchParams.get('chatWith');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(directChatWith || '');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_email.eq.${session.user.email},receiver_email.eq.${session.user.email}`)
        .order('created_at', { ascending: true });

      if (data) {
        const partners = new Set();
        data.forEach(m => {
          if (m.sender_email !== session.user.email) partners.add(m.sender_email);
          if (m.receiver_email !== session.user.email) partners.add(m.receiver_email);
        });

        if (directChatWith) partners.add(directChatWith);
        const pList = Array.from(partners);
        setConversations(pList);

        if (!activePartner && pList.length > 0) {
          setActivePartner(pList[0]);
        }
      }

      setLoading(false);
    }
    initChat();
  }, [router, directChatWith]);

  useEffect(() => {
    if (!user || !activePartner) return;

    async function loadConversationMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activePartner}),and(sender_email.eq.${activePartner},receiver_email.eq.${user.email})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    }
    loadConversationMessages();

    const channel = supabase
      .channel('messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newM = payload.new;
        if (
          (newM.sender_email === user.email && newM.receiver_email === activePartner) ||
          (newM.sender_email === activePartner && newM.receiver_email === user.email)
        ) {
          setMessages(prev => [...prev, newM]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activePartner]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMsg.trim() || !activePartner) return;

    const payload = {
      sender_email: user.email.toLowerCase().trim(),
      receiver_email: activePartner.toLowerCase().trim(),
      message_text: inputMsg.trim()
    };

    setInputMsg('');
    const { error } = await supabase.from('messages').insert([payload]);
    if (error) alert('Could not send: ' + error.message);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading Shanora Messages...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, maxWidth: '950px', width: '100%', margin: '0 auto', display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '250px', backgroundColor: '#0b1120', borderRight: '1px solid #1e293b', overflowY: 'auto' }}>
        <div style={{ padding: '0.85rem', borderBottom: '1px solid #1e293b', fontWeight: 'bold', fontSize: '0.88rem' }}>
          Chats ({conversations.length})
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.78rem' }}>No conversations yet.</div>
        ) : (
          conversations.map(partner => (
            <div
              key={partner}
              onClick={() => setActivePartner(partner)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #1e293b',
                backgroundColor: activePartner === partner ? '#1e293b' : 'transparent',
                fontSize: '0.8rem'
              }}
            >
              <strong style={{ display: 'block', color: activePartner === partner ? '#38bdf8' : '#fff' }}>{partner.split('@')[0]}</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{partner}</span>
            </div>
          ))
        )}
      </aside>

      {/* Main Chat Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b14' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{activePartner || 'Select a Conversation'}</span>
          {activePartner && (
            <Link href={`/view-profile?email=${encodeURIComponent(activePartner)}`} style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none' }}>
              View Profile ➔
            </Link>
          )}
        </div>

        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {messages.map(m => {
            const isMe = m.sender_email === user?.email;
            return (
              <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{
                  backgroundColor: isMe ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  lineHeight: 1.4
                }}>
                  {m.message_text}
                </div>
                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: '0.2rem', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Write a message..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            disabled={!activePartner}
            style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem' }}
          />
          <button
            type="submit"
            disabled={!activePartner || !inputMsg.trim()}
            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.82rem', cursor: !activePartner || !inputMsg.trim() ? 'not-allowed' : 'pointer' }}
          >
            Send 🚀
          </button>
        </form>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/feed" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>Feed 🌐</Link>
          <Link href="/profile" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.8rem' }}>Portal 💼</Link>
        </div>
      </header>

      <Suspense fallback={<div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading Messages...</div>}>
        <ChatBox />
      </Suspense>
    </div>
  );
}
