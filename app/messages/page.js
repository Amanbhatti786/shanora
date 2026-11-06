'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, User as UserIcon, Search, Circle } from 'lucide-react';

export default function MessagesPage() {
  const supabase = createClientComponentClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Get current authenticated user
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    }
    getUser();
  }, [supabase]);

  // 2. Track online presence via WebSockets
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('online-presence', {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = new Set();
        for (const id in state) {
          activeIds.add(id);
        }
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser, supabase]);

  // 3. Load conversations and candidate directory
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      // Fetch user's existing conversations
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`);

      // Fetch directory profiles to enable new chats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', currentUser.id)
        .limit(20);

      if (profiles) setAvailableUsers(profiles);

      if (convData && convData.length > 0 && profiles) {
        const mapped = convData.map((conv) => {
          const partnerId = conv.participant_one === currentUser.id ? conv.participant_two : conv.participant_one;
          const partnerProfile = profiles.find((p) => p.id === partnerId) || {
            id: partnerId,
            full_name: `User ${partnerId.slice(0, 5)}`,
            username: partnerId.slice(0, 6)
          };
          return {
            conversationId: conv.id,
            partner: partnerProfile
          };
        });
        setConversations(mapped);
      }
    }

    loadData();
  }, [currentUser, supabase]);

  // 4. Start or open a conversation
  const selectContact = async (contact) => {
    setSelectedUser(contact);

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_one.eq.${currentUser.id},participant_two.eq.${contact.id}),and(participant_one.eq.${contact.id},participant_two.eq.${currentUser.id})`)
      .maybeSingle();

    if (existingConv) {
      setActiveConversationId(existingConv.id);
    } else {
      // Create new conversation entry
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          participant_one: currentUser.id,
          participant_two: contact.id,
        })
        .select()
        .single();

      if (newConv) {
        setActiveConversationId(newConv.id);
        setConversations((prev) => [...prev, { conversationId: newConv.id, partner: contact }]);
      }
    }
  };

  // 5. Load messages and subscribe to realtime inserts
  useEffect(() => {
    if (!activeConversationId) return;

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    }
    fetchMessages();

    // Subscribe to new incoming messages
    const channel = supabase
      .channel(`room:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 6. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content: messageContent,
    });
  };

  // Filter contacts by search query
  const displayedContacts = availableUsers.filter((user) =>
    (user.full_name || user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      <div
        style={{
          display: 'flex',
          height: '75vh',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: '320px',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid #1e293b' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Conversations ({conversations.length})
            </h2>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search candidates or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 0.5rem 2rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.6rem', top: '0.65rem', color: '#94a3b8' }}
              />
            </div>
          </div>

          {/* Directory / Contact List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {displayedContacts.map((contact) => {
              const isOnline = onlineUsers.has(contact.id);
              const isSelected = selectedUser?.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#1e293b' : 'transparent',
                    borderBottom: '1px solid #1e293b',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserIcon size={20} color="#cbd5e1" />
                    </div>
                    {/* Real-time Green Dot */}
                    {isOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          border: '2px solid #0f172a',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0, color: '#f8fafc' }}>
                      {contact.full_name || contact.username || 'User'}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: isOnline ? '#34d399' : '#64748b' }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#0b1120',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserIcon size={18} color="#cbd5e1" />
                  </div>
                  {onlineUsers.has(selectedUser.id) && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid #0b1120',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: onlineUsers.has(selectedUser.id) ? '#34d399' : '#64748b',
                    }}
                  >
                    {onlineUsers.has(selectedUser.id) ? 'Active now' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Message Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: '#030712',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', color: '#64748b', fontSize: '0.85rem' }}>
                    No messages yet. Send a greeting to start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '65%',
                          padding: '0.6rem 0.9rem',
                          borderRadius: '12px',
                          borderBottomRightRadius: isOwnMessage ? '2px' : '12px',
                          borderBottomLeftRadius: isOwnMessage ? '12px' : '2px',
                          backgroundColor: isOwnMessage ? '#2563eb' : '#1e293b',
                          color: '#ffffff',
                          fontSize: '0.88rem',
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: 'flex',
                  padding: '0.75rem',
                  borderTop: '1px solid #1e293b',
                  backgroundColor: '#0b1120',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '20px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    opacity: newMessage.trim() ? 1 : 0.5,
                  }}
                >
                  <Send size={16} color="#fff" />
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.9rem',
              }}
            >
              Select a candidate from the left directory to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
