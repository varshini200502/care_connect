import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Download,
  Video,
  User,
  Stethoscope,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatApi, prescriptionsApi, getWsBaseUrl } from '../services/api';
import { Conversation, Message } from '../types';
import { Link } from 'react-router-dom';

export const ChatPage: React.FC = () => {
  const { user, token, isDoctor } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load conversations on mount
  const loadConversations = async () => {
    try {
      setLoadingConv(true);
      const data = await chatApi.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // When selected conversation changes, load messages & establish WebSocket room
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const loadMessages = async () => {
      try {
        const msgs = await chatApi.getMessages(selectedConversation.id);
        setMessages(msgs);
        chatApi.markRead(selectedConversation.id);
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    };
    loadMessages();

    // Connect WebSocket
    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/chat/${selectedConversation.id}?token=${encodeURIComponent(token)}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_MESSAGE') {
          setMessages((prev) => [...prev, payload.message]);
        } else if (payload.type === 'USER_TYPING') {
          if (payload.user_id !== user?.id) {
            setOtherUserTyping(payload.is_typing ? payload.user_name : null);
          }
        }
      } catch (err) {
        console.error('Error handling chat WS message:', err);
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [selectedConversation?.id, token]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversation) return;

    const text = inputText;
    setInputText('');

    try {
      await chatApi.sendMessage(selectedConversation.id, {
        message_text: text,
        message_type: 'TEXT',
      });
      // WS will deliver the message
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedConversation) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const uploadRes = await chatApi.uploadAttachment(file);
      await chatApi.sendMessage(selectedConversation.id, {
        message_text: `Shared file: ${uploadRes.attachment_name}`,
        message_type: uploadRes.message_type,
        attachment_url: uploadRes.attachment_url,
        attachment_name: uploadRes.attachment_name,
      });
    } catch (e) {
      console.error('Failed to upload attachment:', e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING', is_typing: true }));
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'TYPING', is_typing: false }));
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8 flex">
      <div className="max-w-7xl w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row overflow-hidden h-[750px]">
        {/* Left Panel: Conversation List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" /> Consultations & Queries
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Direct real-time communication with your pediatrician
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p>No active conversations yet.</p>
                <p className="text-[11px]">Chats are automatically opened upon booking an appointment.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-100/70 ${
                    selectedConversation?.id === conv.id ? 'bg-primary-50/70 border-l-4 border-primary-600' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-100 to-mint-100 text-primary-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {conv.child_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {conv.child_name}
                      </h4>
                      {conv.last_message && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {isDoctor ? `Parent: ${conv.parent_name}` : conv.doctor_name}
                    </p>
                    {conv.last_message && (
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {conv.last_message.message_type === 'PRESCRIPTION'
                          ? '📋 Digital Prescription'
                          : conv.last_message.message_text}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Thread */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Room Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  {selectedConversation.child_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedConversation.child_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isDoctor
                      ? `Parent: ${selectedConversation.parent_name}`
                      : `${selectedConversation.doctor_name} (Specialist)`}
                  </p>
                </div>
              </div>

              {/* Video Call Shortcut */}
              <Link
                to={`/consultation/${selectedConversation.appointment_id}`}
                className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded-xl shadow-md shadow-mint-600/20 flex items-center gap-1.5 transition-transform hover:scale-105"
              >
                <Video className="w-3.5 h-3.5" /> Join Video Room
              </Link>
            </div>

            {/* Message History Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Send a message or query regarding prescribed medicines or child symptoms.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  const isRx = msg.message_type === 'PRESCRIPTION';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {isMine ? 'You' : msg.sender_role === 'DOCTOR' ? 'Dr. Sharma' : 'Parent'}
                      </span>

                      {/* Prescription Card Bubble */}
                      {isRx ? (
                        <div className="max-w-md w-full p-4 rounded-3xl bg-gradient-to-br from-mint-50 to-primary-50 border border-mint-200 shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-mint-700 font-bold text-xs uppercase tracking-wider">
                            <FileText className="w-4 h-4" /> Official Digital Prescription
                          </div>
                          <p className="text-xs text-slate-800 font-medium whitespace-pre-line">
                            {msg.message_text}
                          </p>
                          {msg.attachment_url && (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-mint-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-mint-700 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Signed Prescription PDF
                            </a>
                          )}
                        </div>
                      ) : msg.message_type === 'IMAGE' && msg.attachment_url ? (
                        <div className="max-w-xs rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white p-1">
                          <img
                            src={msg.attachment_url}
                            alt="Attachment"
                            className="rounded-xl w-full max-h-60 object-cover"
                          />
                          <p className="text-xs p-2 text-slate-700">{msg.message_text}</p>
                        </div>
                      ) : (
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.message_text}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          msg.is_read ? (
                            <CheckCheck className="w-3 h-3 text-primary-500" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="text-xs text-slate-400 italic flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-primary-400" />
                  {otherUserTyping} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box & Attachment */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Upload Photo or Medical Document"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder={uploading ? 'Uploading attachment...' : 'Type message or query regarding medicines...'}
                value={inputText}
                disabled={uploading}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-600/20 disabled:opacity-40 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            Select a consultation conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
};
