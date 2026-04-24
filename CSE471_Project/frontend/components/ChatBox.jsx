'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value?._id) return value._id.toString();
  if (value?.toString) return value.toString();
  return null;
};

export default function ChatBox({ conversationId, receiverId, receiverName, serviceContext, onClose, isFullScreen = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    const socketConnection = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketConnection.on('connect', () => {
      setIsConnected(true);
      socketConnection.emit('join_conversations');
    });

    socketConnection.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new messages
    socketConnection.on('new_message', (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for typing indicators
    socketConnection.on('user_typing', (data) => {
      if (data.conversationId === conversationId && data.userId !== jwtDecode(token).userId) {
        setOtherUserTyping(data.isTyping);
      }
    });

    // Listen for presence updates
    socketConnection.on('presence_update', (data) => {
      if (data.userId === receiverId) {
        setOtherUserOnline(data.isOnline);
      }
    });

    // Listen for read receipts
    socketConnection.on('messages_read', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.map(msg =>
          data.messageIds.includes(msg._id)
            ? { ...msg, status: 'read', readAt: new Date() }
            : msg
        ));
      }
    });

    setSocket(socketConnection);

    // Load conversation messages
    loadMessages();

    return () => {
      socketConnection.disconnect();
    };
  }, [conversationId, receiverId]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/message/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    const token = localStorage.getItem('token');
    const decoded = jwtDecode(token);

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          content: newMessage,
          messageType: attachments.length > 0 ? 'file' : 'text',
          attachments,
          serviceContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setAttachments([]);

        // Emit via socket
        if (socket) {
          socket.emit('send_message', {
            conversationId,
            receiverId,
            content: newMessage,
            messageType: attachments.length > 0 ? 'file' : 'text',
            attachments
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing_start', { conversationId });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId });
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const uploadedAttachments = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          uploadedAttachments.push({
            filename: data.filename,
            url: data.url,
            fileType: data.mimetype,
            size: data.size
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setAttachments(prev => [...prev, ...uploadedAttachments]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={isFullScreen ? "w-full h-full flex items-center justify-center bg-gray-50" : "fixed bottom-4 right-4 w-96 h-[32rem] bg-white border rounded-2xl shadow-2xl flex items-center justify-center z-50"}>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-gray-500 font-medium">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullScreen 
      ? "w-full h-full flex flex-col bg-gray-50 overflow-hidden" 
      : "fixed bottom-4 right-4 w-96 h-[32rem] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
    }>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${isFullScreen ? 'bg-white border-b' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'} shadow-sm z-10`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isFullScreen ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'}`}>
              {receiverName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isFullScreen ? 'border-white' : 'border-blue-600'} ${otherUserOnline ? 'bg-green-400' : 'bg-gray-300'}`}></div>
          </div>
          <div>
            <h3 className={`font-bold ${isFullScreen ? 'text-gray-800' : 'text-white'}`}>{receiverName || 'Chat'}</h3>
            <p className={`text-xs ${isFullScreen ? 'text-gray-500' : 'text-blue-100'}`}>
              {otherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
          {!isFullScreen && (
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Service Context */}
      {serviceContext && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">💼</div>
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Service Inquiry</p>
            <p className="text-sm font-medium text-amber-900">{serviceContext.serviceTitle}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {messages.map((message, index) => {
            const currentUserId = jwtDecode(localStorage.getItem('token')).userId;
            const messageSenderId = normalizeId(message.senderId);
            const isMine = messageSenderId === currentUserId;
            
            // Determine if we should show the tail (if previous message is not from same user)
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showTail = !prevMessage || normalizeId(prevMessage.senderId) !== messageSenderId;

            return (
              <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-4' : 'mt-1'}`}>
                <div className={`relative max-w-[75%] px-4 py-2 shadow-sm ${
                  isMine
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-2xl'
                } ${showTail ? (isMine ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}`}>
              
              {/* Message Tail */}
              {showTail && (
                <div className={`absolute top-0 w-4 h-4 ${isMine ? '-right-2 text-blue-600' : '-left-2 text-white'}`}>
                  <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                    {isMine 
                      ? <path d="M5.188 1H0v11.156L7.969 1.203C8.618.396 8.044 0 6.993 0H5.188z" />
                      : <path d="M2.812 1H8v11.156L.031 1.203C-.618.396-.044 0 1.007 0h1.805z" />
                    }
                  </svg>
                </div>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {message.attachments.map((attachment, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden bg-black/5">
                      {attachment.fileType.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-3 p-3 text-sm ${isMine ? 'text-white hover:bg-white/10' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
                        >
                          <div className={`p-2 rounded-full ${isMine ? 'bg-white/20' : 'bg-blue-100'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate font-medium">{attachment.filename}</span>
                            <span className="text-xs opacity-70">{formatFileSize(attachment.size)}</span>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>

              {/* Message Status */}
              <div className={`flex items-center justify-end mt-1 space-x-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                <span className="text-[10px] uppercase font-medium">{formatTime(message.createdAt)}</span>
                {isMine && (
                  <div className="flex items-center">
                    {message.status === 'sent' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    {message.status === 'delivered' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" /></svg>}
                    {message.status === 'read' && <svg className="w-3 h-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" /></svg>}
                  </div>
                )}
              </div>
            </div>
          </div>
            );
        })}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center bg-white px-2 py-1 rounded border text-xs">
                <span className="mr-2">📎 {attachment.filename}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-[#f0f2f5] border-t border-gray-200">
        <div className="flex items-end gap-2 bg-white p-2 rounded-2xl border border-gray-300 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
            title="Attach files"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 max-h-32 bg-transparent resize-none overflow-y-auto px-2 py-2 focus:outline-none text-[15px] placeholder-gray-400 text-gray-800"
            rows="1"
            style={{ minHeight: '40px' }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className={`p-2 rounded-full flex-shrink-0 transition-colors ${
              (newMessage.trim() || attachments.length > 0)
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}