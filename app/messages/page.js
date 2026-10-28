'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

function ChatBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directChatWith = searchParams ? searchParams.get('chatWith') : null;

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(directChatWith || '');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        if (!isMounted) return;
        setUser(session.user);

        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_email.eq.${session.user.email},receiver_email.eq.${session.user.email}`)
          .order('created_at', { ascending: true });

        const partners = new Set();
        if (data) {
          data.forEach(m => {
            if (m.sender_email !== session.user.email) partners.add(m.sender_email);
            if (m.receiver_email !== session.user.email) partners.add(m.receiver_email);
          });
        }

        if (directChatWith) partners.add(directChatWith);
        const pList = Array.from(partners);
        if (isMounted) {
          setConversations(pList);
          if (directChatWith) {
            setActivePartner(directChatWith);
          } else if (pList.length > 0) {
            setActivePartner(pList[0]);
          }
        }
      } catch (err) {
        console.error('Chat load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();
    return () => { isMounted = false; };
  }, [router, directChatWith]);

  useEffect(() => {
    if (!user || !activePartner) return;
    let isMounted = true;

    async function loadConversationMessages() {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activePartner}),and(sender_email.eq.${activePartner},receiver_email.eq.${user.email})`)
          .order('created_at', { ascending: true });

        if (data && isMounted) setMessages(data);
      } catch (err) {
        console.error('Messages fetch error:', err);
      }
    }

    loadConversationMessages();

    const channel = supabase
      .channel(`chat-${activePartner}`)
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
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, activePartner]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMsg.trim() || !activePartner || !user) return;

    const text = inputMsg.trim();
    setInputMsg('');

    try {
      const payload = {
        sender_email: user.email.toLowerCase().trim(),
        receiver_email: activePartner.toLowerCase().trim(),
        message_text: text
      };

      const { data, error } = await supabase.from('messages').insert([payload]).select().single();
      if (error) throw error;
      if (data) setMessages(prev => [...prev, data]);
    } catch (err) {
      alert('Could not send message: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        Loading chats...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, maxWidth: '950px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid #1e293b', borderRadius: '12px', margin: '0.8rem 0.5rem', backgroundColor: '#0f172a' }}>
        
        {/* Left: Chat List */}
        <aside style={{ width: '35%', minWidth: '130px', maxWidth: '240px', borderRight: '1px solid #1e293b', backgroundColor: '#0b1120', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #1e293b', fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>
            Conversations ({conversations.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '0.8rem', fontSize: '0.72rem', color: '#64748b', textAlign: 'center' }}>
                No active chats. Start one from the Feed or Candidate Profiles!
              </div>
            ) : (
              conversations.map(p => (
                <div
                  key={p}
                  onClick={() => setActivePartner(p)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #1e293b',
                    backgroundColor: activePartner === p ? '#1e293b' : 'transparent',
                    fontSize: '0.78rem'
                  }}
                >
                  <strong style={{ display: 'block', color: activePartner === p ? '#38bdf8' : '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {p.split('@')[0]}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                    {p}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right: Message Window */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b14' }}>
          <div style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activePartner ? `Chat with: ${activePartner.split('@')[0]}` : 'Select a person to chat'}
            </span>
            {activePartner && (
              <Link href={`/view-profile?email=${encodeURIComponent(activePartner)}`} style={{ fontSize: '0.72rem', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                Profile ➔
              </Link>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '0.8rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!activePartner ? (
              <div style={{ margin: 'auto', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                Select a user on the left to start messaging.
              </div>
            ) : messages.length === 0 ? (
              <div style={{ margin: 'auto', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                Say hello! No messages yet.
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.sender_email === user?.email;
                return (
                  <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{
                      backgroundColor: isMe ? '#0284c7' : '#1e293b',
                      color: '#fff',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      {m.message_text}
                    </div>
                    <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', marginTop: '0.15rem', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} style={{ padding: '0.65rem', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a', display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              placeholder={activePartner ? "Type a message..." : "Select someone first..."}
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              disabled={!activePartner}
              style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.8rem' }}
            />
            <button
              type="submit"
              disabled={!activePartner || !inputMsg.trim()}
              style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 0.95rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: !activePartner || !inputMsg.trim() ? 'not-allowed' : 'pointer' }}
            >
              Send 🚀
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ color: '#38bdf8' }}>.PK</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/feed" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 'bold' }}>Feed 🌐</Link>
          <Link href="/profile" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.78rem' }}>Portal 💼</Link>
        </div>
      </header>

      <Suspense fallback={<div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>Loading Messages...</div>}>
        <ChatBox />
      </Suspense>
    </div>
  );
            }
            
