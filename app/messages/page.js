'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import BottomNav from '../../components/BottomNav';

function ProVerifiedBadge({ size = 16 }) {
  return (
    <span title="Verified PRO Member" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', marginLeft: '4px', flexShrink: 0 }}>
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

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastMessagesMap, setLastMessagesMap] = useState({});

  // Attachment states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    async function initMessenger() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        const currentUser = session.user;
        setUser(currentUser);
        const myEmail = currentUser.email.toLowerCase();

        // Fetch all profiles except current user
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, full_name, name, headline, avatar_url, last_seen, is_pro')
          .limit(100);

        if (profiles) {
          setAllUsers(profiles.filter(p => (p.email || '').toLowerCase() !== myEmail));
        }

        // Fetch direct messages for last message previews
        const { data: msgs } = await supabase
          .from('direct_messages')
          .select('sender_email, receiver_email, message, attachment_url, attachment_type, created_at')
          .or(`sender_email.ilike.${myEmail},receiver_email.ilike.${myEmail}`)
          .order('created_at', { ascending: true });

        if (msgs) {
          const map = {};
          msgs.forEach(m => {
            const other = (m.sender_email.toLowerCase() === myEmail ? m.receiver_email : m.sender_email).toLowerCase();
            const previewText = m.message || (m.attachment_type === 'image' ? '📷 Photo' : '📎 Attachment');
            map[other] = { text: previewText, time: new Date(m.created_at).getTime() };
          });
          setLastMessagesMap(map);
        }
      } catch (err) {
        console.error('Messenger init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initMessenger();
  }, [router]);

  // Real-time chat sync for active conversation
  useEffect(() => {
    if (!activeChatUser || !user) return;
    let channel;
    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();

    async function fetchThread() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_email.ilike.${myEmail},receiver_email.ilike.${otherEmail}),and(sender_email.ilike.${otherEmail},receiver_email.ilike.${myEmail})`)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      scrollToBottom();
    }

    fetchThread();

    const channelId = `chat_${[myEmail, otherEmail].sort().join('_')}`;
    channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const msg = payload.new;
        const sEmail = (msg.sender_email || '').toLowerCase();
        const rEmail = (msg.receiver_email || '').toLowerCase();

        if (
          (sEmail === myEmail && rEmail === otherEmail) ||
          (sEmail === otherEmail && rEmail === myEmail)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          const previewText = msg.message || (msg.attachment_type === 'image' ? '📷 Photo' : '📎 Attachment');
          setLastMessagesMap(prev => ({
            ...prev,
            [otherEmail]: { text: previewText, time: new Date(msg.created_at).getTime() }
          }));
        }
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChatUser, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function handleSend(e) {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeChatUser || !user || sending) return;

    const myEmail = user.email.toLowerCase();
    const otherEmail = activeChatUser.email.toLowerCase();
    const text = newMessage.trim();

    setSending(true);
    setUploadingFile(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `chat-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars') // Using avatars bucket (publicly accessible)
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrlData.publicUrl;
        attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'document';
      }

      const insertPayload = {
        sender_email: myEmail,
        receiver_email: otherEmail,
        message: text,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      };

      const { data, error } = await supabase
        .from('direct_messages')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      clearAttachment();
      scrollToBottom();

      const previewText = text || (attachmentType === 'image' ? '📷 Photo' : '📎 Document');
      setLastMessagesMap(prev => ({
        ...prev,
        [otherEmail]: { text: previewText, time: Date.now() }
      }));
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  }

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 3 * 60 * 1000;
  };

  const filteredUsers = allUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    const name = (u.full_name || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  }).sort((a, b) => {
    const timeA = lastMessagesMap[(a.email || '').toLowerCase()]?.time || 0;
    const timeB = lastMessagesMap[(b.email || '').toLowerCase()]?.time || 0;
    return timeB - timeA;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '1rem', fontWeight: 'bold' }}>
        Loading Messenger...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => {
              if (activeChatUser) setActiveChatUser(null);
              else router.push('/profile?tab=menu');
            }}
            style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#070b14', border: '1px solid #1e293b', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}
          >
            {activeChatUser ? '←' : '✕'}
          </button>
          
          <Link href="/feed" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.65rem', backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.28rem 0.65rem 0.28rem 0.35rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' }}>S</div>
            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ffffff' }}>SHANORA<span style={{ fontSize: '0.55rem', color: '#38bdf8', verticalAlign: 'super' }}>.PK</span></span>
          </Link>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          💬 Messenger Hub
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0.9rem' }}>
        
        {activeChatUser ? (
          /* ACTIVE CHAT INTERFACE */
          <div style={{ backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '78vh', minHeight: '540px', boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}>
            
            {/* Chat Header */}
            <div style={{ backgroundColor: '#0f172a', padding: '0.85rem 1.1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', overflow: 'hidden', border: '2px solid #38bdf8' }}>
                    {activeChatUser.avatar_url ? (
                      <img src={activeChatUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (activeChatUser.full_name || activeChatUser.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  {isUserOnline(activeChatUser.last_seen) && (
                    <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a', boxShadow: '0 0 6px #22c55e' }} />
                  )}
                </div>

                <div>
                  <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>{activeChatUser.full_name || activeChatUser.name || activeChatUser.email?.split('@')[0]}</span>
                    {activeChatUser.is_pro && <ProVerifiedBadge size={16} />}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isUserOnline(activeChatUser.last_seen) ? '#4ade80' : '#94a3b8', fontWeight: '600' }}>
                    {isUserOnline(activeChatUser.last_seen) ? 'Active now' : 'Offline'}
                  </div>
                </div>
              </div>

              <Link href={`/view-profile?email=${encodeURIComponent(activeChatUser.email)}`} style={{ color: '#38bdf8', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '700', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.8rem', borderRadius: '20px' }}>
                View Profile ↗
              </Link>
            </div>

            {/* Chat Messages Body */}
            <div style={{ flex: 1, padding: '1.2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.9rem', background: 'radial-gradient(circle at center, #0b1322 0%, #070b14 100%)' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.85rem', padding: '2rem' }}>
                  👋 Say hello to <strong style={{ color: '#fff' }}>{activeChatUser.full_name || 'your connection'}</strong>! Start your professional conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = (msg.sender_email || '').toLowerCase() === (user?.email || '').toLowerCase();
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        backgroundColor: isMe ? '#0284c7' : '#1e293b',
                        color: '#fff',
                        padding: msg.attachment_url ? '0.5rem' : '0.75rem 1.05rem',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: '0.88rem',
                        lineHeight: '1.45',
                        maxWidth: '78%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        border: isMe ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #334155'
                      }}>
                        {/* Render Attachment if exists */}
                        {msg.attachment_url && (
                          <div style={{ marginBottom: msg.message ? '0.5rem' : '0' }}>
                            {msg.attachment_type === 'image' ? (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.attachment_url} alt="Attachment" style={{ maxWidth: '240px', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover', display: 'block' }} />
                              </a>
                            ) : (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.8rem', borderRadius: '10px', color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                <span>📄 View Attached Document ↗</span>
                              </a>
                            )}
                          </div>
                        )}
                        {msg.message && <div style={{ padding: msg.attachment_url ? '0 0.4rem 0.4rem 0.4rem' : '0' }}>{msg.message}</div>}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.25rem', padding: '0 0.2rem' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview Box */}
            {selectedFile && (
              <div style={{ backgroundColor: '#131e33', padding: '0.6rem 1rem', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.4rem' }}>📄</span>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '250px' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Ready to send</div>
                  </div>
                </div>
                <button type="button" onClick={clearAttachment} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} style={{ padding: '0.8rem 1rem', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo or document"
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}
              >
                📎
              </button>

              <input
                type="text"
                placeholder={uploadingFile ? "Uploading file..." : "Write a professional message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={uploadingFile}
                style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.7rem 1.1rem', color: '#fff', fontSize: '0.86rem', outline: 'none' }}
              />

              <button
                type="submit"
                disabled={sending || uploadingFile || (!newMessage.trim() && !selectedFile)}
                style={{
                  backgroundColor: (newMessage.trim() || selectedFile) ? '#0284c7' : '#1e293b',
                  color: (newMessage.trim() || selectedFile) ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (newMessage.trim() || selectedFile) ? 'pointer' : 'not-allowed',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                {uploadingFile ? '⌛' : '➤'}
              </button>
            </form>

          </div>
        ) : (
          /* CONVERSATIONS LIST INTERFACE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search professional conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '0.75rem 1.1rem 0.75rem 2.6rem', color: '#fff', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1rem' }}>🔍</span>
            </div>

            {/* Users List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                  No professional contacts found. Connect with members in your network!
                </div>
              ) : (
                filteredUsers.map(chatTarget => {
                  const targetEmail = (chatTarget.email || '').toLowerCase();
                  const online = isUserOnline(chatTarget.last_seen);
                  const displayName = chatTarget.full_name || chatTarget.name || targetEmail.split('@')[0];
                  const lastMsg = lastMessagesMap[targetEmail];

                  return (
                    <div
                      key={targetEmail}
                      onClick={() => setActiveChatUser(chatTarget)}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '16px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', overflow: 'hidden', flex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.2rem', overflow: 'hidden' }}>
                            {chatTarget.avatar_url ? (
                              <img src={chatTarget.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          {online && (
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a', boxShadow: '0 0 6px #22c55e' }} />
                          )}
                        </div>

                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            <span>{displayName}</span>
                            {chatTarget.is_pro && <ProVerifiedBadge size={16} />}
                          </div>
                          <div style={{ color: lastMsg ? '#cbd5e1' : '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '0.2rem', fontWeight: lastMsg ? '500' : 'normal' }}>
                            {lastMsg ? lastMsg.text : (chatTarget.headline || 'Start a conversation')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: online ? '#4ade80' : '#64748b', fontWeight: '700', background: online ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '12px', border: online ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(100, 116, 139, 0.2)' }}>
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
