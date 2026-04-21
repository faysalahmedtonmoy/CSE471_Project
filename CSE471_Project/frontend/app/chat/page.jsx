'use client';

import { useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ChatBox from '../../components/ChatBox';

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showChatBox, setShowChatBox] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.userId);
      fetchConversations();
    } catch (error) {
      console.error('Token decode error:', error);
      router.push('/login');
      return;
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/message', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatBox(true);
  };

  const handleCloseChat = () => {
    setShowChatBox(false);
    setSelectedConversation(null);
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p.userId._id !== userId);
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="flex h-screen bg-gray-50">
        {/* Conversations Sidebar */}
        <div className="w-1/3 bg-white border-r">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start chatting from service listings!</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <div
                    key={conversation._id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {otherParticipant?.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherParticipant?.userId?.name || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-1">
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </p>
                            )}
                            {conversation.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}

                        {conversation.serviceContext && (
                          <p className="text-xs text-blue-600 mt-1">
                            💼 {conversation.serviceContext.serviceTitle}
                          </p>
                        )}

                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            otherParticipant?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-500">
                            {otherParticipant?.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center">
          {selectedConversation ? (
            <div className="w-full h-full">
              {showChatBox && (
                <ChatBox
                  conversationId={selectedConversation._id}
                  receiverId={getOtherParticipant(selectedConversation)?.userId?._id}
                  receiverName={getOtherParticipant(selectedConversation)?.userId?.name}
                  serviceContext={selectedConversation.serviceContext}
                  onClose={handleCloseChat}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
