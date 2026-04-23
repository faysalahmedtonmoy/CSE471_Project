'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setPermission(perm);
        });
      }
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection for notifications
    const socketConnection = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketConnection.on('new_message', (message) => {
      // Show browser notification
      showBrowserNotification('New Message', `You have a new message from ${message.sender.name}`);

      // Add to notifications list
      const newNotification = {
        id: Date.now(),
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${message.sender.name}`,
        timestamp: new Date(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const showBrowserNotification = (title, body) => {
    if (permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Don't render anything, this is just for notifications
  return null;
}