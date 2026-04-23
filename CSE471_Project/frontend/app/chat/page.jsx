'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Navbar from '../../components/Navbar';
import ChatBox from '../../components/ChatBox';
import BackToDashboard from '../../components/BackToDashboard';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showChatBox, setShowChatBox] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId);

        const conversationId = searchParams.get('conversation');
        const participantId = searchParams.get('participant') || searchParams.get('provider');

        const conversations = await fetchConversations();

        if (conversationId) {
          const existingConversation = conversations.find(conv => conv._id === conversationId);
          if (existingConversation) {
            setSelectedConversation(existingConversation);
            setShowChatBox(true);
          }
        } else if (participantId) {
          startConversationWithParticipant(participantId);
        }

        const socketConnection = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
          auth: { token }
        });

        socketConnection.on('unread_count_update', (data) => {
          setConversations(prev => prev.map(conv => 
            conv._id === data.conversationId 
              ? { ...conv, unreadCount: data.count }
              : conv
          ));
        });

        // Listen for new messages (to refresh conversation list)
        socketConnection.on('new_message', (message) => {
          fetchConversations();
        });

        setSocket(socketConnection);

        return () => {
          socketConnection.disconnect();
        };
      } catch (error) {
        console.error('Token decode error:', error);
        router.push('/login');
        return;
      }
    };

    init();
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
        return data.conversations || [];
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const startConversationWithParticipant = async (participantId) => {
    if (!participantId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: participantId,
          content: 'Hi! I would like to chat with you.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Start conversation error:', errorData);
        return;
      }

      const data = await response.json();
      setSelectedConversation(data.conversation);
      setShowChatBox(true);
      fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
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
    const other = conversation.participants.find(p => {
      const participantId = p.userId?._id ? p.userId._id.toString() : p.userId?.toString();
      return participantId !== userId;
    });

    if (!other) return null;

    return {
      ...other,
      userId: other.userId?._id ? other.userId._id.toString() : other.userId?.toString()
    };
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
      <BackToDashboard />
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
