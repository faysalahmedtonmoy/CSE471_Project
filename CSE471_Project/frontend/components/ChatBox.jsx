'use client';

import { useEffect, useState } from 'react';
import { useChatContext, Channel, Window, MessageList, MessageComposer, Thread } from 'stream-chat-react';
import StreamChatProvider from './StreamChatProvider';

function StreamChannelContent({ receiverId, receiverName, serviceContext, onClose, isFullScreen }) {
  const { client } = useChatContext();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (!client || !receiverId) return;

    const initChannel = async () => {
      try {
        // First, ensure the receiver exists in Stream
        const token = localStorage.getItem('token');
        await fetch('/api/chat/sync-receiver', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ receiverId })
        });

        // Create or join a 1-on-1 WhatsApp style channel based on members
        const newChannel = client.channel('messaging', {
          members: [client.userID, receiverId],
        });
        await newChannel.watch();
        setChannel(newChannel);
      } catch (err) {
        console.error("Failed to initialize channel:", err);
      }
    };

    initChannel();

    return () => {
      // Client handles cleanup natively
    };
  }, [client, receiverId]);

  if (!channel) {
    return (
      <div className={isFullScreen ? "w-full h-full flex items-center justify-center bg-gray-50" : "fixed bottom-4 right-4 w-96 h-[32rem] bg-white border rounded-2xl shadow-2xl flex items-center justify-center z-50"}>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-gray-500 font-medium">Starting secure chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullScreen 
      ? "w-full h-full flex flex-col bg-gray-50 overflow-hidden" 
      : "fixed bottom-4 right-4 w-96 h-[32rem] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9999]"
    }>
      <Channel channel={channel}>
        <Window>
          {/* Custom Header with close button */}
          <div className={`flex items-center justify-between p-4 ${isFullScreen ? 'bg-white border-b' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'} shadow-sm z-10`}>
             <div className="flex items-center space-x-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isFullScreen ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'}`}>
                 {receiverName?.charAt(0)?.toUpperCase() || '?'}
               </div>
               <div>
                 <h3 className={`font-bold ${isFullScreen ? 'text-gray-800' : 'text-white'}`}>{receiverName || 'Chat'}</h3>
                 <p className={`text-xs ${isFullScreen ? 'text-gray-500' : 'text-blue-100'}`}>Stream Protected</p>
               </div>
             </div>
             <div className="flex items-center space-x-3">
               {!isFullScreen && (
                 <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors">
                   ✕
                 </button>
               )}
             </div>
          </div>
          
          {serviceContext && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3">💼</div>
              <div>
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Service Inquiry</p>
                <p className="text-sm font-medium text-amber-900">{serviceContext.serviceTitle}</p>
              </div>
            </div>
          )}

          <MessageList />
          <MessageComposer focus />
        </Window>
        <Thread />
      </Channel>
      
      {/* Stream chat overrides to make it look nicer inside the Tailwind container */}
      <style>{`
        .str-chat__main-panel { padding: 0 !important; }
        .str-chat__list { background-color: #efeae2; background-image: url('https://www.transparenttextures.com/patterns/cubes.png'); }
        .str-chat__message-simple-text-inner { border-radius: 12px !important; }
        .str-chat__message--me .str-chat__message-simple-text-inner { background-color: #3b82f6 !important; color: white !important; }
        .str-chat__input-flat { padding: 10px !important; background-color: #f0f2f5 !important; border-top: 1px solid #e5e7eb !important; }
        .str-chat__input-flat-wrapper { border-radius: 20px !important; }
      `}</style>
    </div>
  );
}

export default function ChatBox(props) {
  return (
    <StreamChatProvider>
      <StreamChannelContent {...props} />
    </StreamChatProvider>
  );
}