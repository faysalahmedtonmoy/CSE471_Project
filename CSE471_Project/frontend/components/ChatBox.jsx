'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import jwtDecode from 'jwt-decode';

export default function ChatBox({ conversationId, receiverId, receiverName, serviceContext, onClose }) {
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
      const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
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
      <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border rounded-lg shadow-lg flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border rounded-lg shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <div>
            <h3 className="font-semibold text-sm">{receiverName}</h3>
            <p className="text-xs text-gray-500">
              {otherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
      </div>

      {/* Service Context */}
      {serviceContext && (
        <div className="px-4 py-2 bg-yellow-50 border-b">
          <p className="text-xs text-gray-600">
            💼 Service Inquiry: {serviceContext.serviceTitle}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message._id} className={`flex ${message.senderId._id === jwtDecode(localStorage.getItem('token')).userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg ${
              message.senderId._id === jwtDecode(localStorage.getItem('token')).userId
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="mb-1">
                      {attachment.fileType.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-w-full rounded cursor-pointer"
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-300 hover:text-blue-100 underline"
                        >
                          <span>📎</span>
                          <span className="text-sm">{attachment.filename}</span>
                          <span className="text-xs">({formatFileSize(attachment.size)})</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <p className="text-sm">{message.content}</p>

              {/* Message Status */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-75">{formatTime(message.createdAt)}</span>
                {message.senderId._id === jwtDecode(localStorage.getItem('token')).userId && (
                  <div className="flex items-center space-x-1">
                    {message.status === 'sent' && <span className="text-xs">✓</span>}
                    {message.status === 'delivered' && <span className="text-xs">✓✓</span>}
                    {message.status === 'read' && <span className="text-xs text-blue-300">✓✓</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

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
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            📎
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}