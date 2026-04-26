'use client';

import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';

// Using a module-level variable helps avoid recreating the client on strict mode re-renders
let chatClientInstance: StreamChat | null = null;

export default function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('User not authenticated');
          return;
        }

        // 1. Fetch the Stream token from our backend
        const response = await fetch('/api/chat-token', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch chat token (${response.status}): ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        const { token: streamToken, userId, name } = data;

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) throw new Error("Stream API key is missing");

        // 2. Initialize Stream Client
        if (!chatClientInstance) {
          chatClientInstance = StreamChat.getInstance(apiKey);
        }

        // 3. Connect User
        if (chatClientInstance.userID !== userId) {
          // If already connected as someone else, disconnect first
          if (chatClientInstance.userID) {
             await chatClientInstance.disconnectUser();
          }
          await chatClientInstance.connectUser(
            {
              id: userId,
              name: name,
            },
            streamToken
          );
        }

        if (isMounted) {
          setClient(chatClientInstance);
        }
      } catch (err: any) {
        console.error('Error initializing Stream Chat:', err);
        if (isMounted) setError(err.message);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      // We do NOT disconnect the user here because it causes issues with React Strict Mode re-renders.
      // Stream handles connection pooling automatically.
    };
  }, []);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-md">Chat Error: {error}</div>;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-gray-500 font-medium">Connecting to chat server...</div>
      </div>
    );
  }

  return (
    <Chat client={client} theme="str-chat__theme-light">
      {children}
    </Chat>
  );
}
