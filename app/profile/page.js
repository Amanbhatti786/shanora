}}>
{profile.avatar_url ? (
<img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : (
(profile.full_name || 'U').charAt(0).toUpperCase()
)}


<h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
{profile.full_name}
{profile.is_pro && }
{profile.is_ambassador && <span title="Shanora Ambassador" style={{ color: '#facc15', fontSize: '1rem' }}>🌟}

<div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: '600', marginTop: '0.15rem' }}>
{profile.headline || 'Member on Shanora.pk'}

<span style={{ fontSize: '0.74rem', color: '#64748b' }}>{profile.email}

            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>

          {profile.bio && (
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '10px', padding: '0.8rem', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '1rem' }}>
              {profile.bio}
            </div>
          )}

          {profile.skills && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Skills & Expertise
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {profile.skills.split(',').map((s, idx) => (
                  <span key={idx} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
            <div>📞 <strong style={{ color: '#fff' }}>WhatsApp / Phone:</strong> {profile.phone || 'Not provided'}</div>
            <div>📍 <strong style={{ color: '#fff' }}>City / Location:</strong> {profile.city || 'Pakistan'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📄 <strong style={{ color: '#fff' }}>Linked CV / Resume:</strong>
              {profile.resume_url ? (
                <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  View Linked CV 🔗
                </a>
              ) : (
                <span style={{ color: '#64748b' }}>No CV attached yet</span>
              )}
            </div>
            <div>👑 <strong style={{ color: '#fff' }}>Account Status:</strong> {profile.is_pro ? <span style={{ color: '#facc15', fontWeight: '800' }}>Shanora PRO (Verified ✓)</span> : 'Standard Member'}</div>
          </div>
        </div>
      </div>
    )}

    {/* TAB 4: MESSENGER (WITH FACEBOOK STYLE LONG-PRESS REACTIONS, EDIT, DELETE & ATTACHMENTS) */}
    {activeTab === 'messages' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>Shanora Messenger</span>
          </div>
          <button 
            type="button" 
            onClick={() => {
              if (activeChatUser) {
                setActiveChatUser(null);
              } else {
                navigateToTab('menu');
              }
            }} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        </div>

        {activeChatUser ? (
          /* ACTIVE 1-ON-1 CHAT ROOM */
          <div style={{ backgroundColor: '#0b1322', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '72vh', minHeight: '520px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            
            {/* Chat Header */}
            <div style={{ backgroundColor: '#0f172a', padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveChatUser(null)}
                  style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '50%', color: '#0084ff', fontSize: '1rem', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ←
                </button>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0084ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', overflow: 'hidden' }}>
                    {activeChatUser.avatar_url || activeChatUser.avatarUrl ? (
                      <img src={activeChatUser.avatar_url || activeChatUser.avatarUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (activeChatUser.full_name || activeChatUser.name || activeChatUser.displayName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  {isUserOnline(activeChatUser.last_seen) ? (
                    <div title="Active Now" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a', boxShadow: '0 0 6px #22c55e' }} />
                  ) : (
                    <div title="Offline" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b', border: '2px solid #0f172a' }} />
                  )}
                </div>

                <div>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>{activeChatUser.full_name || activeChatUser.name || activeChatUser.displayName || activeChatUser.email?.split('@')[0]}</span>
                    {activeChatUser.is_pro && <ProVerifiedBadge size={16} />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isUserOnline(activeChatUser.last_seen) ? '#4ade80' : '#64748b', fontWeight: '600' }}>
                    {isUserOnline(activeChatUser.last_seen) ? 'Active now' : 'Offline'}
                  </div>
                </div>
              </div>

              <Link href={`/view-profile?email=${encodeURIComponent(activeChatUser.email || activeChatUser.user_email || '')}`} style={{ color: '#0084ff', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '700', backgroundColor: 'rgba(0, 132, 255, 0.12)', border: '1px solid rgba(0, 132, 255, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
                Profile ↗
              </Link>
            </div>

            {/* Message Bubble Feed */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.82rem' }}>
                  Say hello to {activeChatUser.full_name || 'them'}! Start your direct 1-on-1 private conversation. 👋
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = (msg.sender_email || '').toLowerCase() === (user?.email || '').toLowerCase();
                  const isEditing = editingMessageId === msg.id;
                  const hasReactions = msg.reactions && Object.keys(msg.reactions).some(k => (msg.reactions[k] || []).length > 0);
                  const isMenuOpen = activeMenuMessageId === msg.id;
                  const isReactionOpen = activeReactionMsgId === msg.id;

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                      
                      {/* FACEBOOK FLOATING EMOJI BAR (Press & Hold or Click trigger) */}
                      {isReactionOpen && !msg.is_deleted && (
                        <div 
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            [isMe ? 'right' : 'left']: '6px',
                            marginBottom: '6px',
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '30px',
                            padding: '4px 10px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                            zIndex: 60
                          }}
                        >
                          {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactToMessage(msg.id, emoji);
                              }}
                              style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', maxWidth: '82%', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        {/* Message Bubble */}
                        <div 
                          onTouchStart={() => handleTouchStart(msg.id)}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchEnd}
                          onDoubleClick={() => setActiveReactionMsgId(prev => (prev === msg.id ? null : msg.id))}
                          style={{
                            backgroundColor: msg.is_deleted ? 'rgba(30, 41, 59, 0.5)' : isMe ? '#0084ff' : '#1e293b',
                            color: msg.is_deleted ? '#94a3b8' : '#fff',
                            fontStyle: msg.is_deleted ? 'italic' : 'normal',
                            padding: '0.7rem 1rem',
                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            fontSize: '0.85rem',
                            lineHeight: '1.45',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                            border: msg.is_deleted ? '1px dashed #475569' : 'none',
                            userSelect: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {/* Inline Editing Form */}
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '0.4rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingMessageId(null)} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="button" onClick={() => handleSaveEditedMessage(msg.id)} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Attached Image */}
                              {msg.attachment_url && msg.attachment_type === 'image' && (
                                <div 
                                  onClick={() => setPreviewModalImg(msg.attachment_url)} 
                                  style={{ marginBottom: '0.4rem', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                                >
                                  <img src={msg.attachment_url} alt="Attached" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                                </div>
                              )}

                              {/* Attached Document */}
                              {msg.attachment_url && msg.attachment_type === 'document' && (
                                <a 
                                  href={msg.attachment_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  download 
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.75rem', borderRadius: '8px', textDecoration: 'none', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 'bold', marginBottom: '0.4rem' }}
                                >
                                  <span>📄</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachment_name || 'Download Document'}</span>
                                  <span>⬇️</span>
                                </a>
                              )}

                              {/* Text Message */}
                              <div>{msg.message}</div>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.3rem' }}>
                                {msg.is_edited && !msg.is_deleted && (
                                  <span style={{ fontSize: '0.6rem', color: isMe ? '#e0f2fe' : '#94a3b8', fontStyle: 'italic' }}>(edited)</span>
                                )}
                                <span style={{ fontSize: '0.62rem', color: isMe ? '#e0f2fe' : '#94a3b8' }}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Message Context Options Trigger */}
                        {!msg.is_deleted && (
                          <button
                            type="button"
                            onClick={() => setActiveMenuMessageId(isMenuOpen ? null : msg.id)}
                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                            title="React or Options"
                          >
                            •••
                          </button>
                        )}
                      </div>

                      {/* Action Popover Menu (Edit, Delete, React) */}
                      {isMenuOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '-38px',
                          [isMe ? 'right' : 'left']: '10px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '24px',
                          padding: '0.25rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                          zIndex: 55
                        }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReactionMsgId(msg.id);
                              setActiveMenuMessageId(null);
                            }}
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                          >
                            React 😄
                          </button>

                          {isMe && !msg.is_deleted && (
                            <>
                              <span style={{ color: '#334155', fontSize: '0.8rem' }}>|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditText(msg.message);
                                  setActiveMenuMessageId(null);
                                }}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                                title="Edit"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}
                                title="Delete for Everyone"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Display Reactions pill on Bubble Corner */}
                      {hasReactions && !msg.is_deleted && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginTop: '-6px',
                          [isMe ? 'marginRight' : 'marginLeft']: '8px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          zIndex: 1
                        }}>
                          {Object.entries(msg.reactions).map(([emoji, users]) => {
                            if (!users || users.length === 0) return null;
                            return (
                              <span key={emoji} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <span>{emoji}</span>
                                {users.length > 1 && <span style={{ color: '#94a3b8', fontSize: '0.6rem' }}>{users.length}</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment Selection Preview Bar */}
            {selectedAttachment && (
              <div style={{ backgroundColor: '#131e33', padding: '0.5rem 0.9rem', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  {attachmentType === 'image' ? (
                    <img src={attachmentPreview} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.3rem' }}>📄</span>
                  )}
                  <span style={{ fontSize: '0.76rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedAttachment.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAttachment(null);
                    setAttachmentPreview(null);
                    setAttachmentType(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', padding: '0 4px' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Chat Input Bar (Facebook Messenger Style) */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Hidden Inputs */}
              <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleSelectAttachment(e, 'image')} style={{ display: 'none' }} />
              <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.zip,.txt" onChange={(e) => handleSelectAttachment(e, 'document')} style={{ display: 'none' }} />

              {/* Photo File Input */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0 2px' }}
                title="Send Photo"
              >
                🖼️
              </button>

              {/* Document File Input */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', padding: '0 2px' }}
                title="Send Document"
              >
                📎
              </button>

              <input
                type="text"
                placeholder={selectedAttachment ? 'Add a caption...' : 'Type a message...'}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.84rem', outline: 'none' }}
              />

              {/* Send Arrow or Quick Facebook Thumb 👍 */}
              {newMessageText.trim() || selectedAttachment ? (
                <button
                  type="submit"
                  disabled={sendingMsg}
                  style={{
                    backgroundColor: '#0084ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {sendingMsg ? '⏳' : '➤'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage(null, '👍')}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                  title="Send Thumbs Up"
                >
                  👍
                </button>
              )}
            </form>
          </div>
        ) : (
          /* CONVERSATION LIST & SEARCH */
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search conversations by name..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredMessengerUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                  No active conversations found. Tap "Message" on any user profile to chat!
                </div>
              ) : (
                filteredMessengerUsers.map(chatTarget => {
                  const targetEmail = (chatTarget.email || '').toLowerCase();
                  const online = isUserOnline(chatTarget.last_seen);
                  const displayName = chatTarget.full_name || chatTarget.name || targetEmail.split('@')[0];
                  const lastMsg = userLastMessagesMap[targetEmail];

                  return (
                    <div
                      key={chatTarget.id || targetEmail}
                      onClick={() => openChatWithUser(chatTarget)}
                      style={{
                        backgroundColor: '#131b2e',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', overflow: 'hidden' }}>
                            {chatTarget.avatar_url ? (
                              <img src={chatTarget.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          {online ? (
                            <div title="Online" style={{ position: 'absolute', bottom: '1px', right: '1px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #131b2e', boxShadow: '0 0 5px #22c55e' }} />
                          ) : (
                            <div title="Offline" style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b', border: '2px solid #131b2e' }} />
                          )}
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            <span>{displayName}</span>
                            {chatTarget.is_pro && <ProVerifiedBadge size={16} />}
                          </div>
                          <div style={{ color: lastMsg ? '#cbd5e1' : '#64748b', fontSize: '0.74rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '0.15rem' }}>
                            {lastMsg ? lastMsg.text : (chatTarget.headline || 'Tap to start conversation')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: online ? '#4ade80' : '#64748b', fontWeight: '700' }}>
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
      </div>
    )}

    {/* TAB 5: PAGES */}
    {activeTab === 'pages' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#f97316' }}>🏢 Your Pages ({myPages.length})</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
          <Link href="/create-page" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 'bold' }}>+ New Page</Link>
        </div>

        {myPages.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            You have not created any organization or public pages yet.
          </div>
        ) : (
          myPages.map(page => (
            <div key={page.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href={`/page/${page.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem' }}>{page.name}</Link>
              <Link href={`/page/${page.slug}`} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.76rem', textDecoration: 'none', fontWeight: 'bold' }}>View Page</Link>
            </div>
          ))
        )}
      </div>
    )}

    {/* TAB 6: ATS RESUME BUILDER (SHANORA PRO) */}
    {activeTab === 'resume' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#facc15' }}>📄 ATS Resume Studio</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        {!profile.is_pro ? (
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '16px',
              padding: '3rem 1.5rem',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3.2rem', marginBottom: '0.6rem' }}>📄</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#facc15', fontSize: '1.3rem', fontWeight: '800' }}>
              Shanora PRO Exclusive Feature
            </h3>
            <p style={{ margin: '0 auto 1.5rem auto', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '440px' }}>
              ATS-Friendly Resume Builder and Instant Official PDF Export are exclusive privileges for <strong>Shanora PRO</strong> members.
            </p>
            <button
              type="button"
              onClick={() => navigateToTab('pro')}
              style={{
                backgroundColor: '#eab308',
                color: '#000',
                border: 'none',
                padding: '0.8rem 1.8rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(234, 179, 8, 0.35)'
              }}
            >
              Unlock with Shanora PRO 👑 (Rs. 499)
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '1rem 1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.8rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>ATS Resume Studio</span>
                  <ProVerifiedBadge size={18} />
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Standard Executive Layout with Direct PDF Printing
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1.2rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  <span>🖨️</span>
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>

            <div
              id="printable-ats-cv"
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '3rem 2.8rem',
                borderRadius: '12px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.45)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ borderBottom: '2.5px solid #0f172a', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{
                      margin: '0 0 0.3rem 0',
                      fontSize: '2rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      letterSpacing: '-0.5px',
                      textTransform: 'uppercase'
                    }}>
                      {profile.full_name || 'Your Full Name'}
                    </h1>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0284c7' }}>
                      {profile.headline || 'Senior Professional & Specialist'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
                    <div>{profile.email}</div>
                    <div>{profile.phone || '+92 300 0000000'}</div>
                    <div>{profile.city || 'Pakistan'}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  marginBottom: '0.6rem'
                }}>
                  Executive Summary
                </div>
                <textarea
                  rows={3}
                  value={resumeData.summary !== undefined && resumeData.summary !== '' ? resumeData.summary : (profile.bio || '')}
                  onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief overview of your professional achievements and qualifications..."
                  style={{
                    width: '100%',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    color: '#334155',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  marginBottom: '0.6rem'
                }}>
                  Key Competencies & Core Skills
                </div>
                <input
                  type="text"
                  value={resumeData.skills !== undefined && resumeData.skills !== '' ? resumeData.skills : (profile.skills || 'Next.js, React, Tailwind CSS, Supabase, Executive Strategy')}
                  onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Enter skills separated by commas..."
                  style={{
                    width: '100%',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    color: '#1e293b',
                    fontWeight: '600',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  marginBottom: '0.6rem'
                }}>
                  Work History & Professional Experience
                </div>
                <textarea
                  rows={6}
                  value={resumeData.experience}
                  onChange={(e) => setResumeData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Senior Specialist | Tech Solutions (2024 - Present)..."
                  style={{
                    width: '100%',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    color: '#334155',
                    lineHeight: '1.6',
                    outline: 'none',
                    resize: 'vertical',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.3rem',
                  marginBottom: '0.6rem'
                }}>
                  Education & Certifications
                </div>
                <textarea
                  rows={3}
                  value={resumeData.education}
                  onChange={(e) => setResumeData(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="Bachelor of Science in Information Technology (2020 - 2024)..."
                  style={{
                    width: '100%',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    color: '#334155',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center' }}>
              ℹ️ <em>Click directly on any text block to edit. Print borders and input outlines are automatically hidden upon PDF download.</em>
            </div>
          </div>
        )}
      </div>
    )}

    {/* TAB 7: MONETIZATION */}
    {activeTab === 'monetization' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#10b981' }}>💰 Creator Monetization Hub</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '1.2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase' }}>Available Balance</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '0.1rem' }}>
              Rs. {profile.wallet_balance.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Instant payout via EasyPaisa / JazzCash / Bank</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: profile.is_monetized ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              color: profile.is_monetized ? '#4ade80' : '#facc15',
              border: profile.is_monetized ? '1px solid #22c55e' : '1px solid #eab308'
            }}>
              {profile.is_monetized ? 'Monetized ✓' : 'Under Review / Locked'}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.8rem' }}>
            Monetization Eligibility Tracker (Auto-Calculated)
          </div>

          <div style={{ marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#cbd5e1' }}>Followers Required: <strong>5,000</strong></span>
              <span style={{ color: followersList.length >= 5000 ? '#4ade80' : '#38bdf8', fontWeight: 'bold' }}>
                {followersList.length} / 5,000 {followersList.length >= 5000 ? '✓' : ''}
              </span>
            </div>
            <div style={{ width: '100%', height: '7px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((followersList.length / 5000) * 100))}%`, height: '100%', backgroundColor: followersList.length >= 5000 ? '#22c55e' : '#0284c7' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#cbd5e1' }}>Monthly Published Posts: <strong>30</strong></span>
              <span style={{ color: myPostsCount >= 30 ? '#4ade80' : '#38bdf8', fontWeight: 'bold' }}>
                {myPostsCount} / 30 {myPostsCount >= 30 ? '✓' : ''}
              </span>
            </div>
            <div style={{ width: '100%', height: '7px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((myPostsCount / 30) * 100))}%`, height: '100%', backgroundColor: myPostsCount >= 30 ? '#22c55e' : '#0284c7' }} />
            </div>
          </div>

          {profile.is_monetized ? (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>
              🎉 Congratulations! Your account is monetized. Creator bonuses will automatically credit to your wallet.
            </div>
          ) : monetizationStatus === 'pending' ? (
            <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', color: '#facc15', fontWeight: 'bold' }}>
              ⏳ Application Submitted! Administrative verification is underway.
            </div>
          ) : (
            <button
              type="button"
              disabled={submittingMonetization || followersList.length < 5000 || myPostsCount < 30}
              onClick={handleApplyMonetization}
              style={{
                width: '100%',
                backgroundColor: (followersList.length >= 5000 && myPostsCount >= 30) ? '#10b981' : '#1e293b',
                color: (followersList.length >= 5000 && myPostsCount >= 30) ? '#000' : '#64748b',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: (followersList.length >= 5000 && myPostsCount >= 30) ? 'pointer' : 'not-allowed'
              }}
            >
              {submittingMonetization ? 'Submitting Application...' : (followersList.length >= 5000 && myPostsCount >= 30) ? 'Apply for Monetization 💰' : 'Criteria Incomplete (Continue Posting & Growing Network)'}
            </button>
          )}
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>
            Withdraw Earnings (EasyPaisa / JazzCash / Bank)
          </div>
          <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.74rem', color: '#94a3b8' }}>
            The minimum withdrawal threshold is Rs. 1,000. Funds will be directly dispatched to your specified account.
          </p>

          <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.6rem' }}>
              <select
                value={payoutForm.payment_method}
                onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
              >
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank">Raast / Bank</option>
              </select>

              <input
                type="number"
                placeholder="Amount (PKR) min 1,000"
                value={payoutForm.amount}
                onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <input
                type="text"
                placeholder="Account Number (e.g. 0300...)"
                value={payoutForm.account_number}
                onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                required
              />
              <input
                type="text"
                placeholder="Account Title Name"
                value={payoutForm.account_title}
                onChange={(e) => setPayoutForm({ ...payoutForm, account_title: e.target.value })}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingPayout || profile.wallet_balance < 1000}
              style={{
                backgroundColor: profile.wallet_balance >= 1000 ? '#10b981' : '#1e293b',
                color: profile.wallet_balance >= 1000 ? '#000' : '#64748b',
                border: 'none',
                padding: '0.6rem',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: profile.wallet_balance >= 1000 ? 'pointer' : 'not-allowed'
              }}
            >
              {submittingPayout ? 'Processing...' : 'Request Payout 💸'}
            </button>
          </form>
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.6rem' }}>
            Earnings & Bonus History
          </div>

          {payoutsHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
              No payout or bonus records available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {payoutsHistory.map(item => (
                <div key={item.id} style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff' }}>
                      {item.type === 'bonus' ? '🎁 Creator Bonus Awarded' : `💸 Payout via ${item.payment_method}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {new Date(item.created_at).toLocaleDateString()} {item.account_number ? `• ${item.account_number}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: item.type === 'bonus' ? '#4ade80' : '#38bdf8' }}>
                      {item.type === 'bonus' ? '+' : '-'}Rs. {item.amount}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: item.status === 'approved' || item.status === 'paid' ? '#4ade80' : '#facc15' }}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* TAB 8: SAVED POSTS */}
    {activeTab === 'saved' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#c084fc' }}>🔖 Saved Posts & Bookmarks</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        {savedPostsList.length === 0 ? (
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🔖</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.2rem' }}>No saved posts yet</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>Bookmark useful posts or job listings from your feed to review them here.</div>
            <Link href="/feed" style={{ backgroundColor: '#0284c7', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '700' }}>
              Explore Feed
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {savedPostsList.map(item => {
              const post = item.user_posts || {};
              return (
                <div key={item.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8' }}>
                        {post.user_email || 'Author'}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Saved on {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSavedPost(item.id)}
                      style={{ backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Remove ✕
                    </button>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                    {post.content || 'Content not available or post has been removed.'}
                  </div>

                  {post.image_url && (
                    <img src={post.image_url} alt="Saved visual" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* TAB 9: SETTINGS */}
    {activeTab === 'settings' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#cbd5e1' }}>⚙️ Settings & Privacy</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Account Security Hub Link */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => router.push('/settings/security')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#131b2e' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Account Security Hub</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Change password, active devices & single session</div>
                </div>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.95rem' }}>→</span>
            </div>
          </div>

          {/* Quick Password Change Accordion */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'account' ? null : 'account')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'account' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔑</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Quick Password Change</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'account' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'account' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Registered Email</span>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '0.1rem' }}>{profile.email}</div>
                </div>

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid #1e293b', paddingTop: '0.8rem' }}>
                  <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 'bold' }}>Update Password</label>
                  <input
                    type="password"
                    placeholder="Enter new strong password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem', width: '100%', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.4rem' }}
                >
                  Log Out of Current Session 🚪
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Visibility */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'privacy' ? null : 'privacy')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'privacy' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Privacy & Visibility</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'privacy' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'privacy' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Profile Visibility</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Allow others to discover your profile</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('profile_visible', profile.profile_visible)}
                    style={{ backgroundColor: profile.profile_visible ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {profile.profile_visible ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '0.8rem' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Active Status (Last Seen)</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Display green online dot</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('last_seen_visible', profile.last_seen_visible)}
                    style={{ backgroundColor: profile.last_seen_visible ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {profile.last_seen_visible ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'notifications' ? null : 'notifications')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'notifications' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔔</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Notification Alerts</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'notifications' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'notifications' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>Email Alerts</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Receive application alerts & notifications</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('email_alerts', profile.email_alerts)}
                    style={{ backgroundColor: profile.email_alerts ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {profile.email_alerts ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language & Region */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'language' ? null : 'language')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'language' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Language & Region</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'language' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'language' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <select
                  value={profile.app_language}
                  onChange={(e) => handleSelectSetting('app_language', e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                >
                  <option value="English">English (Default)</option>
                  <option value="Urdu">Urdu (اردو)</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Timezone: Asia/Karachi (PKT - UTC+5)</span>
              </div>
            )}
          </div>

          {/* Career & Job Status */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'professional' ? null : 'professional')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'professional' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💼</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Career Preferences</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'professional' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'professional' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 'bold' }}>"Open to Work" Badge</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Signal recruiters that you are available</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('open_to_work', profile.open_to_work)}
                    style={{ backgroundColor: profile.open_to_work ? '#22c55e' : '#334155', color: '#000', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                  >
                    {profile.open_to_work ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setSettingsActiveSubTab(settingsActiveSubTab === 'support' ? null : 'support')}
              style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: settingsActiveSubTab === 'support' ? '#131b2e' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Help & Support</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{settingsActiveSubTab === 'support' ? '▲' : '▼'}</span>
            </div>

            {settingsActiveSubTab === 'support' && (
              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Official Email: <strong>support@shanora.pk</strong></div>
                <a
                  href="[https://wa.me/923033639664](https://wa.me/923033639664)"
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: '#22c55e', color: '#000', padding: '0.5rem', textAlign: 'center', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* TAB 10: NETWORK / FOLLOWERS */}
    {activeTab === 'network' && (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '0.8rem' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#38bdf8' }}>👥 Network & Connections</span>
          <button type="button" onClick={() => navigateToTab('menu')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', backgroundColor: '#0f172a', padding: '0.35rem', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <button
            type="button"
            onClick={() => setNetworkSubTab('followers')}
            style={{
              flex: 1,
              backgroundColor: networkSubTab === 'followers' ? '#0284c7' : 'transparent',
              color: networkSubTab === 'followers' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Followers ({followersList.length})
          </button>

          <button
            type="button"
            onClick={() => setNetworkSubTab('following')}
            style={{
              flex: 1,
              backgroundColor: networkSubTab === 'following' ? '#0284c7' : 'transparent',
              color: networkSubTab === 'following' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Following ({followingList.length})
          </button>
        </div>

        {/* SubTab: Followers */}
        {networkSubTab === 'followers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {followersList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No followers found on your profile yet.
              </div>
            ) : (
              followersList.map(item => {
                const cleanEmail = (item.user_email || item.follower_email || '').toLowerCase();
                const displayName = item.displayName || cleanEmail.split('@')[0];
                const isFollowingBack = !!followingMap[cleanEmail];

                return (
                  <div key={item.id} style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}>
                    <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          <span>{displayName}</span>
                          {item.is_pro && <ProVerifiedBadge size={16} />}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          Follows you
                        </div>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          openChatWithUser({
                            email: cleanEmail,
                            full_name: displayName,
                            avatar_url: item.avatarUrl,
                            last_seen: item.last_seen,
                            is_pro: item.is_pro
                          });
                        }}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #0284c7',
                          color: '#38bdf8',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>💬</span>
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(cleanEmail)}
                        disabled={actionLoading[cleanEmail]}
                        style={{
                          backgroundColor: isFollowingBack ? '#1e293b' : '#0284c7',
                          color: isFollowingBack ? '#94a3b8' : '#fff',
                          border: isFollowingBack ? '1px solid #334155' : 'none',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isFollowingBack ? 'Following' : 'Follow Back'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SubTab: Following */}
        {networkSubTab === 'following' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {followingList.length === 0 ? (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                You are not following any users yet.
              </div>
            ) : (
              followingList.map(item => {
                const cleanEmail = (item.user_email || item.following_email || '').toLowerCase();
                const displayName = item.displayName || cleanEmail.split('@')[0];

                return (
                  <div key={item.id} style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}>
                    <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#38bdf8',
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          <span>{displayName}</span>
                          {item.is_pro && <ProVerifiedBadge size={16} />}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          Following
                        </div>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          openChatWithUser({
                            email: cleanEmail,
                            full_name: displayName,
                            avatar_url: item.avatarUrl,
                            last_seen: item.last_seen,
                            is_pro: item.is_pro
                          });
                        }}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #0284c7',
                          color: '#38bdf8',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>💬</span>
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(cleanEmail)}
                        disabled={actionLoading[cleanEmail]}
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Discover People Section with Message + Follow */}
        <div style={{ marginTop: '2.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
              People You May Know
            </span>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>
              Discover
            </span>
          </div>

          {discoverUsers.length === 0 ? (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
              No new creators found for recommendation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {discoverUsers.map(creator => {
                const cleanEmail = (creator.email || '').toLowerCase();
                const username = creator.name || creator.full_name || cleanEmail.split('@')[0];
                const isFollowing = !!followingMap[cleanEmail];

                return (
                  <div key={creator.id || cleanEmail} style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.75rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}>
                    <Link href={`/view-profile?email=${encodeURIComponent(cleanEmail)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', overflow: 'hidden', flex: 1 }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          <span>{username}</span>
                          {creator.is_pro && <ProVerifiedBadge size={16} />}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.73rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {creator.headline || cleanEmail}
                        </div>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          openChatWithUser({
                            email: cleanEmail,
                            full_name: username,
                            avatar_url: creator.avatar_url,
                            last_seen: creator.last_seen,
                            is_pro: creator.is_pro
                          });
                        }}
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #0284c7',
                          color: '#38bdf8',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>💬</span>
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(cleanEmail)}
                        disabled={actionLoading[cleanEmail]}
                        style={{
                          backgroundColor: isFollowing ? '#1e293b' : '#0284c7',
                          color: isFollowing ? '#94a3b8' : '#fff',
                          border: isFollowing ? '1px solid #334155' : 'none',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}
  </main>

  {/* Full-view Modal for Chat Images */}
  {previewModalImg && (
    <div 
      onClick={() => setPreviewModalImg(null)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <img src={previewModalImg} alt="Enlarged" style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '8px' }} />
    </div>
  )}

  {/* 1. INVITE FRIENDS & REFERRAL REWARDS MODAL */}
  {showInviteModal && (
    <div 
      onClick={() => setShowInviteModal(false)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '1.2rem 1.2rem 3.5rem 1.2rem', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👥</span> Invite Friends & Earn Rewards
          </div>
          <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '12px', marginTop: '0.9rem', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>Your Unique Referral Link:</div>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={referralLink}
              style={{ flex: 1, minWidth: 0, backgroundColor: '#0b1322', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.65rem', color: '#38bdf8', fontSize: '0.76rem', outline: 'none' }}
            />
            <button
              type="button"
              onClick={handleCopyInviteLink}
              style={{ backgroundColor: copiedLink ? '#22c55e' : '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 0.9rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
            >
              {copiedLink ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.5rem' }}>Share Directly Via:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.45rem' }}>
            <button type="button" onClick={() => handleShare('whatsapp')} style={{ backgroundColor: '#15803d', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              🟢 WhatsApp
            </button>
            <button type="button" onClick={() => handleShare('facebook')} style={{ backgroundColor: '#1d4ed8', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              🔵 Facebook
            </button>
            <button type="button" onClick={() => handleShare('messenger')} style={{ backgroundColor: '#0369a1', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              💬 Messenger
            </button>
            <button type="button" onClick={() => handleShare('email')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ✉️ Email
            </button>
            <button type="button" onClick={() => handleShare('sms')} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📱 SMS
            </button>
            <button type="button" onClick={() => handleShare('native')} style={{ backgroundColor: '#0284c7', border: 'none', borderRadius: '8px', padding: '0.55rem 0.2rem', color: '#fff', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📲 Share
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#131e33', border: '1px solid #0284c7', borderRadius: '12px', padding: '0.85rem', marginTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Total Genuine Invites:</span>
            <span style={{ fontSize: '0.92rem', fontWeight: '900', color: '#38bdf8' }}>{referralCount} Friends Joined 👥</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#070b14', borderRadius: '4px', overflow: 'hidden', margin: '0.55rem 0 0.35rem 0' }}>
            <div style={{
              width: `${Math.min(100, Math.round((referralCount / 100) * 100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7 0%, #22c55e 100%)',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
            <span>Milestone Progress</span>
            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{referralCount >= 100 ? '🌟 Max Ambassador Reached!' : `${Math.max(0, 10 - referralCount)} more for 1 Month PRO`}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8', marginBottom: '0.65rem' }}>
            🏆 Referral Achievements & Rewards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {referralMilestones.map((tier) => {
              const isCompleted = referralCount >= tier.minFriends;
              const isClaiming = claimingMilestone === tier.minFriends;

              return (
                <div 
                  key={tier.minFriends} 
                  style={{ 
                    backgroundColor: '#1e293b', 
                    padding: '0.7rem 0.85rem', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderLeft: `4px solid ${tier.color}`,
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tier.goal}</div>
                    <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: '700', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tier.reward}</div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {isCompleted ? (
                      <button
                        type="button"
                        disabled={isClaiming}
                        onClick={() => handleClaimMilestone(tier)}
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#000',
                          border: 'none',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: '900',
                          cursor: 'pointer',
                          boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)'
                        }}
                      >
                        {isClaiming ? 'Applying...' : 'Claim Reward 🎁'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        {referralCount} / {tier.minFriends} 🎯
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: '70px', width: '100%', flexShrink: 0 }}></div>
        </div>
      </div>
    </div>
  )}

  {/* 2. FACEBOOK-STYLE STRICT ADS MANAGER */}
  {showAdsModal && (
    <div 
      onClick={() => setShowAdsModal(false)}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '560px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.3rem', color: '#fff', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📢</span> Ads Manager (Facebook-Style Portal)
          </div>
          <button type="button" onClick={() => setShowAdsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', margin: '0.9rem 0', textAlign: 'center', fontSize: '0.6rem', fontWeight: '800' }}>
          {[
            { s: 1, label: 'Page' },
            { s: 2, label: 'Create Ad' },
            { s: 3, label: 'Audience' },
            { s: 4, label: 'Budget' },
            { s: 5, label: 'Payment' },
            { s: 6, label: 'Approval' }
          ].map(st => (
            <div
              key={st.s}
              style={{
                padding: '0.45rem 0.15rem',
                borderRadius: '6px',
                backgroundColor: adStep === st.s ? '#0284c7' : '#1e293b',
                color: adStep === st.s ? '#fff' : '#94a3b8',
                border: adStep === st.s ? '1px solid #38bdf8' : '1px solid #334155'
              }}
            >
              {st.label}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {adStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 1: Select Brand / Organization Page</div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.45' }}>
              Just like Facebook Ads, all advertisements must run on behalf of a public or business Page on SHANORA.
            </p>

            {myPages.length === 0 ? (
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏢</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>No Organization Page Found</div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 0.9rem 0' }}>You need an active Page to run and publish sponsored campaigns.</p>
                <Link
                  href="/create-page"
                  style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#fff', padding: '0.55rem 1.2rem', borderRadius: '8px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '800' }}
                >
                  + Create Your Page First
                </Link>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>Choose Page to Promote:</label>
                <select
                  value={adFormData.selectedPageId}
                  onChange={(e) => {
                    const sel = myPages.find(p => p.id === e.target.value);
                    setAdFormData({
                      ...adFormData,
                      selectedPageId: e.target.value,
                      selectedPageSlug: sel?.slug || ''
                    });
                  }}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                >
                  {myPages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (@{p.slug})</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={!adFormData.selectedPageId || myPages.length === 0}
              onClick={() => setAdStep(2)}
              style={{
                backgroundColor: adFormData.selectedPageId ? '#0284c7' : '#1e293b',
                color: adFormData.selectedPageId ? '#fff' : '#64748b',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: adFormData.selectedPageId ? 'pointer' : 'not-allowed',
                marginTop: '0.4rem'
              }}
            >
              Continue to Ad Creative →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {adStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 2: Design Campaign Ad</div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Ad Headline *</label>
              <input
                type="text"
                placeholder="Catchy headline (min 6 characters)"
                value={adFormData.headline}
                onChange={(e) => setAdFormData({ ...adFormData, headline: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Ad Primary Copy / Caption *</label>
              <textarea
                rows={3}
                placeholder="Describe your promotion, career opening, or product..."
                value={adFormData.adText}
                onChange={(e) => setAdFormData({ ...adFormData, adText: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Destination CTA URL *</label>
              <input
                type="url"
                placeholder="[https://example.com](https://example.com) or WhatsApp link"
                value={adFormData.targetUrl}
                onChange={(e) => setAdFormData({ ...adFormData, targetUrl: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button type="button" onClick={() => setAdStep(1)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
              <button
                type="button"
                disabled={!adFormData.headline.trim() || !adFormData.adText.trim() || !adFormData.targetUrl.trim()}
                onClick={() => setAdStep(3)}
                style={{
                  flex: 2,
                  backgroundColor: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? '#0284c7' : '#1e293b',
                  color: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? '#fff' : '#64748b',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: (adFormData.headline.trim() && adFormData.adText.trim() && adFormData.targetUrl.trim()) ? 'pointer' : 'not-allowed'
                }}
              >
                Set Audience Target →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {adStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 3: Audience & Targeting</div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Target Location / City</label>
              <select
                value={adFormData.targetCity}
                onChange={(e) => setAdFormData({ ...adFormData, targetCity: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="All Pakistan">All Pakistan (National Reach)</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad / Rawalpindi">Islamabad / Rawalpindi</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Multan">Multan</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.25rem', fontWeight: 'bold' }}>Campaign Objective</label>
              <select
                value={adFormData.targetObjective}
                onChange={(e) => setAdFormData({ ...adFormData, targetObjective: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="traffic">Drive Website Traffic / External Clicks</option>
                <option value="followers">Grow Page Followers & Reach</option>
                <option value="messages">Get Inquiries & Direct Messages</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button type="button" onClick={() => setAdStep(2)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
              <button type="button" onClick={() => setAdStep(4)} style={{ flex: 2, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                Select Budget →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {adStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 4: Campaign Budget & Estimated Views</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
              {[
                { b: '1500', reach: '5,000+ Views', name: 'Starter' },
                { b: '3500', reach: '15,000+ Views', name: 'Growth' },
                { b: '7000', reach: '40,000+ Views', name: 'Pro Scaler' }
              ].map(pkg => (
                <div
                  key={pkg.b}
                  onClick={() => setAdFormData({ ...adFormData, budget: pkg.b })}
                  style={{
                    backgroundColor: adFormData.budget === pkg.b ? '#13233e' : '#1e293b',
                    border: adFormData.budget === pkg.b ? '1px solid #0284c7' : '1px solid #334155',
                    borderRadius: '10px',
                    padding: '0.75rem 0.4rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pkg.name}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#facc15', margin: '0.2rem 0' }}>Rs. {pkg.b}</div>
                  <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 'bold' }}>{pkg.reach}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button type="button" onClick={() => setAdStep(3)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
              <button type="button" onClick={() => setAdStep(5)} style={{ flex: 2, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                Proceed to Payment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {adStep === 5 && (
          <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>Step 5: Billing & TID Submission</div>

            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: '1.45' }}>
              Pay <strong>Rs. {adFormData.budget}</strong> to verify this campaign:<br />
              EasyPaisa / JazzCash: <code>03033639664</code> (Title: <strong>Amanullah</strong>)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
              <select
                value={adFormData.paymentMethod}
                onChange={(e) => setAdFormData({ ...adFormData, paymentMethod: e.target.value })}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
              >
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank">Bank Transfer</option>
              </select>
              <input
                type="text"
                placeholder="Enter Transaction ID (TID)"
                value={adFormData.trxId}
                onChange={(e) => setAdFormData({ ...adFormData, trxId: e.target.value })}
                required
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button type="button" onClick={() => setAdStep(4)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
              <button 
                type="submit" 
                disabled={adSubmitting || !adFormData.trxId.trim()} 
                style={{ 
                  flex: 2, 
                  backgroundColor: adFormData.trxId.trim() ? '#22c55e' : '#1e293b', 
                  color: adFormData.trxId.trim() ? '#000' : '#64748b', 
                  border: 'none', 
                  padding: '0.6rem', 
                  borderRadius: '8px', 
                  fontWeight: '900', 
                  fontSize: '0.82rem', 
                  cursor: adFormData.trxId.trim() ? 'pointer' : 'not-allowed' 
                }}
              >
                {adSubmitting ? 'Submitting...' : 'Submit for Admin Review 🚀'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 6 */}
        {adStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem' }}>⏳</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#facc15' }}>
              Campaign Under Admin Approval
            </div>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: '1.45', margin: 0 }}>
              {adSuccessMessage || 'Your ad has been queued. Once our safety and payment verification is finished, it will automatically start circulating across the feed.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.6rem' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Status</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#facc15', marginTop: '0.2rem' }}>In Review</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Budget</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.2rem' }}>Rs. {adFormData.budget}</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Page</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#4ade80', marginTop: '0.2rem' }}>Active</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdsModal(false)}
              style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.6rem' }}
            >
              Close Ads Manager
            </button>
          </div>
        )}
      </div>
    </div>
  )}

  {/* EDIT PROFILE MODAL */}
  {showEditProfileModal && (
    <div 
      onClick={() => setShowEditProfileModal(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          padding: '1.4rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.8rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '800' }}>Edit Professional Profile</h3>
          <button 
            type="button" 
            onClick={() => setShowEditProfileModal(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Profile Picture (Avatar)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} style={{ fontSize: '0.78rem', color: '#94a3b8' }} />
              {uploadingAvatar && <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Uploading...</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Full Name *</label>
              <input
                type="text"
                value={editProfileForm.full_name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, full_name: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Designation / Headline</label>
              <input
                type="text"
                placeholder="e.g. Lead Software Engineer"
                value={editProfileForm.headline}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, headline: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Bio & Summary</label>
            <textarea
              rows={2}
              placeholder="Brief summary of your professional expertise..."
              value={editProfileForm.bio}
              onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
              style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Key Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Next.js, Python, Product Strategy, Cloud Architecture"
              value={editProfileForm.skills}
              onChange={(e) => setEditProfileForm({ ...editProfileForm, skills: e.target.value })}
              style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>Phone / WhatsApp</label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={editProfileForm.phone}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', fontWeight: '600' }}>City / Location</label>
              <input
                type="text"
                placeholder="e.g. Karachi, Lahore, Islamabad"
                value={editProfileForm.city}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, city: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '0.8rem', borderRadius: '10px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '700' }}>📎 Attached Resume / CV</label>
              {editProfileForm.resume_url && (
                <a href={editProfileForm.resume_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold', textDecoration: 'none' }}>
                  Current File ↗
                </a>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={uploadingResume} style={{ fontSize: '0.74rem', color: '#cbd5e1' }} />
                {uploadingResume && <span style={{ fontSize: '0.7rem', color: '#facc15' }}>Uploading...</span>}
              </div>
              <input
                type="url"
                placeholder="Or enter public resume URL"
                value={editProfileForm.resume_url}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, resume_url: e.target.value })}
                style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem 0.65rem', color: '#fff', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setShowEditProfileModal(false)}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingProfile || uploadingResume || uploadingAvatar}
              style={{ flex: 2, backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: updatingProfile ? 'not-allowed' : 'pointer' }}
            >
              {updatingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* LOGOUT MODAL */}
  {showLogoutModal && (
    <div
      onClick={() => setShowLogoutModal(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '1.6rem',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '1.4rem'
          }}
        >
          🚪
        </div>

        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
          Log Out of Shanora?
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.45' }}>
          Are you sure you want to end your active session? You will need to sign in again to access your account.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowLogoutModal(false)}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              padding: '0.65rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={executeLogout}
            style={{
              background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.65)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '0.65rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Shared Bottom Navigation Component */}
  <BottomNav />
</div>
);
}

export default function ProfilePortal() {
return (
<Suspense fallback={
<div style={{ minHeight: '100vh', backgroundColor: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
Loading...

}>


);
}
