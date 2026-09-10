import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Hash, Send,
} from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import type { ChatChannel, ChatMessage } from '../lib/types';

export function Communication() {
  const { user } = useAuthStore();
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  const { data: channels = [] } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: () => workplaceApi.getChannels(),
  });

  const activeChannel = channels.find((c: ChatChannel) => c.id === activeChannelId) || channels[0];
  const currentId = activeChannel?.id;

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', currentId],
    queryFn: () => workplaceApi.getMessages(currentId),
    enabled: !!currentId,
    refetchInterval: 3000, // live polling every 3 seconds for active chats
  });

  const sendMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: string; content: string }) =>
      workplaceApi.postMessage(
        channelId,
        content,
        user ? `${user.firstName} ${user.lastName}` : 'Jane Doe'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', currentId] });
      setMessageText('');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentId) return;
    sendMutation.mutate({ channelId: currentId, content: messageText.trim() });
  };

  return (
    <div className="page-content" style={{ paddingBottom: 0 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Team Chat & Collaboration</h1>
          <p className="page-subtitle">
            Real-time workplace channels and direct communications
          </p>
        </div>
      </div>

      <div
        className="card card-flush"
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          height: 'calc(100vh - 220px)',
          minHeight: 520,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Channels */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              CHANNELS ({channels.length})
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {channels.map((ch: ChatChannel) => {
              const isSelected = (activeChannel?.id === ch.id);
              return (
                <div
                  key={ch.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 650 : 500,
                    marginBottom: 2,
                  }}
                  onClick={() => setActiveChannelId(ch.id)}
                >
                  <Hash size={15} style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{ch.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
          {/* Header */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)' }}>
                <Hash size={18} color="var(--accent)" />
                {activeChannel?.name || 'general'}
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                {activeChannel?.topic || 'Company-wide discussions and updates'}
              </div>
            </div>
          </div>

          {/* Message Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <MessageSquare size={32} color="var(--text-tertiary)" />
                <p style={{ marginTop: 8 }}>No messages yet in this channel. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg: ChatMessage) => (
                <div key={msg.id} style={{ display: 'flex', gap: 12 }}>
                  <div
                    className="avatar avatar-sm"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', flexShrink: 0 }}
                  >
                    {msg.senderAvatar || msg.senderName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 650, fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                        {msg.senderName}
                      </span>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              className="input"
              placeholder={`Message #${activeChannel?.name || 'channel'}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!messageText.trim() || sendMutation.isPending}
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Communication;
