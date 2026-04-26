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
  const [searchQuery, setSearchQuery] = useState('');

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
      userId: other.userId?._id ? other.userId._id.toString() : other.userId?.toString(),
      name: other.userId?.name
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-500 font-medium">Loading messages...</div>
          </div>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = getOtherParticipant(conv);
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-[380px] bg-white border border-gray-200 rounded-l-2xl shadow-sm flex flex-col z-10 flex-shrink-0">
          <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
            {/* Back Button */}
            <button 
              onClick={() => router.push('/user-dashboard')}
              className="self-start text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-1 transition-colors"
            >
              ← Back to Dashboard
            </button>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
              <div className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full text-sm font-bold">
                {conversations.length}
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 h-full custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-lg font-medium text-gray-600">No conversations</p>
                <p className="text-sm mt-2">Start chatting from service listings!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <div
                    key={conversation._id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedConversation?._id === conversation._id 
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          selectedConversation?._id === conversation._id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          otherParticipant?.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[15px] font-semibold text-gray-900 truncate">
                            {otherParticipant?.name || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {conversation.lastMessage && (
                              <p className={`text-xs ${conversation.unreadCount > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                {formatTime(conversation.lastMessage.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1 truncate mr-2">
                            {conversation.lastMessage ? (
                              <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                {conversation.lastMessage.senderId === userId ? 'You: ' : ''}
                                {conversation.lastMessage.content || 'Sent an attachment'}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No messages yet</p>
                            )}
                          </div>
                          
                          {conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        {conversation.serviceContext && (
                          <div className="mt-1.5 flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              💼 {conversation.serviceContext.serviceTitle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex bg-white border-y border-r border-gray-200 rounded-r-2xl overflow-hidden relative shadow-sm">
          {selectedConversation ? (
            <div className="w-full h-full animate-in fade-in duration-200">
              {showChatBox && (
                <ChatBox
                  conversationId={selectedConversation._id}
                  receiverId={getOtherParticipant(selectedConversation)?.userId}
                  receiverName={getOtherParticipant(selectedConversation)?.name || 'User'}
                  serviceContext={selectedConversation.serviceContext}
                  onClose={handleCloseChat}
                  isFullScreen={true}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Messages</h2>
              <p className="text-gray-500 max-w-md text-center">Select a conversation from the sidebar to view your messages or start a new chat with a service provider.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
