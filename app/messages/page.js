'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// Executive High-End Verified PRO Badge Component
function ProVerifiedBadge({ size = 18 }) {
  return (
    <span 
      title="Verified PRO Member" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: '4px',
        flexShrink: 0
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10.5" fill="url(#proBadgeGrad)" stroke="#38bdf8" strokeWidth="1.2" />
        <path d="M7.5 12.2L10.3 15L16.5 9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="proBadgeGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function MessengerTab({ user, navigateToTab }) {
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [allUsersList, setAllUsersList] = useState([]);
  const [userLastMessagesMap, setUserLastMessagesMap] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    const myEmail = user.email.toLowerCase();

    supabase.from('profiles').select('email, full_name, name, headline, avatar_url, last_seen, is_pro').limit(100).then(({ data: profiles }) => {
      if (profiles) {
        const filtered = profiles.filter(p => (p.email || '').toLowerCase() !== myEmail);
        setAllUsersList(filtered);
      }
    });

    supabase.from('direct_messages')
      .select('sender_email, receiver_email, message, created_at')
      .or(`sender_email.ilike.${myEmail},receiver_email.ilike.${myEmail}`)
      .order('created_at', { ascending: true })
      .then(({ data: msgs }) => {
        if (msgs) {
          const lastMsgs = {};
          msgs.forEach(m => {
            const other = (m.sender_email.toLowerCase() === myEmail ? m.receiver_email : m.sender_email).toLowerCase();
            lastMsgs[other] = { text: m.message, time: new Date(m.created_at).getTime() };
          });
          setUserLastMessagesMap(lastMsgs);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!activeChatUser || !user) return;
    let channel;
    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();

    async function loadThread() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_email.ilike.${myEmail},receiver_email.ilike.${otherEmail}),and(sender_email.ilike.${otherEmail},receiver_email.ilike.${myEmail})`)
        .order('created_at', { ascending: true });

      setChatMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    loadThread();

    const channelId = `chat_${[myEmail, otherEmail].sort().join('_')}`;
    channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const msg = payload.new;
        const msgSender = (msg.sender_email || '').toLowerCase();
        const msgReceiver = (msg.receiver_email || '').toLowerCase();

        if (
          (msgSender === myEmail && msgReceiver === otherEmail) ||
          (msgSender === otherEmail && msgReceiver === myEmail)
        ) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChatUser, user]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatUser || !user || sendingMsg) return;

    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();
    setSendingMsg(true);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          sender_email: myEmail,
          receiver_email: otherEmail,
          message: newMessageText.trim()
        }])
        .select()
        .single();

      if (error) throw error;
      setChatMessages(prev => [...prev, data]);
      setNewMessageText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert('Message send failed: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  }

  const filteredUsers = allUsersList.filter(u => {
    const q = messageSearchQuery.toLowerCase();
    const name = (u.full_name || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💬</span>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>Shanora Messenger</span>
        </div>
        <button 
          type="button" 
          onClick={() => {
            if (activeChatUser) setActiveChatUser(null);
            else navigateToTab('menu');
          }} 
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
        >
          ✕
        </button>
      </div>

      {activeChatUser ? (
        <div style={{ backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '72vh', minHeight: '520px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActiveChatUser(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '50%', color: '#0084ff', fontSize: '1rem', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ←
              </button>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>{activeChatUser.full_name || activeChatUser.name || activeChatUser.email?.split('@')[0]}</span>
                {activeChatUser.is_pro && <ProVerifiedBadge size={16} />}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.82rem' }}>
                Say hello! Start your private conversation. 👋
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = (msg.sender_email || '').toLowerCase() === (user?.email || '').toLowerCase();
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ backgroundColor: isMe ? '#0084ff' : '#1e293b', color: '#fff', padding: '0.7rem 1rem', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '0.85rem', maxWidth: '75%' }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.84rem', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: '#0084ff', color: '#fff', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
          </form>
        </div>
      ) : (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.8rem' }}>No users found.</div>
            ) : (
              filteredUsers.map(chatTarget => (
                <div
                  key={chatTarget.email}
                  onClick={() => setActiveChatUser(chatTarget)}
                  style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.7rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                      {chatTarget.avatar_url ? <img src={chatTarget.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (chatTarget.full_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>{chatTarget.full_name || chatTarget.name || chatTarget.email.split('@')[0]}</span>
                        {chatTarget.is_pro && <ProVerifiedBadge size={15} />}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{userLastMessagesMap[chatTarget.email.toLowerCase()]?.text || chatTarget.headline || 'Tap to chat'}</div>
                    </div>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 'bold' }}>Chat →</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
