'use client';

import { useState } from 'react';
import ChatBox from './ChatBox';

export default function ChatButton({ providerId, providerName, serviceContext }) {
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const handleChatClick = async () => {
    if (showChat) {
      setShowChat(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to chat');
        return;
      }

      // Check if conversation already exists or create new one
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: providerId,
          content: `Hi! I'm interested in your ${serviceContext?.serviceTitle || 'service'}.`,
          serviceContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation._id);
        setShowChat(true);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={handleChatClick}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
      >
        <span>💬</span>
        <span>{showChat ? 'Close Chat' : 'Chat Now'}</span>
      </button>

      {showChat && conversationId && (
        <ChatBox
          conversationId={conversationId}
          receiverId={providerId}
          receiverName={providerName}
          serviceContext={serviceContext}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}