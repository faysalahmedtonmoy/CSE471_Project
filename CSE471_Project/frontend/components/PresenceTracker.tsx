'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function PresenceTracker() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        try {
          const email = user.primaryEmailAddress?.emailAddress;
          const name = user.fullName || user.username || email?.split('@')[0];

          // 1. Sync Clerk data to MongoDB 'User' model
          const response = await fetch('/api/auth/sync-clerk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkUserId: user.id,
              email: email,
              name: name,
              imageUrl: user.imageUrl,
            }),
          });

          const data = await response.json();
          
          if (response.ok && data.token) {
             // Only store the Clerk JWT if the user doesn't already have an active manual session
             const existingToken = localStorage.getItem('token');
             if (!existingToken) {
               localStorage.setItem('token', data.token);
               localStorage.setItem('userRole', data.user.role);
               localStorage.setItem('userName', data.user.name);
             }
          }

          // 2. Track Presence (Online)
          // Emitting to your existing socket or updating online status
          console.log(`Presence: User ${name} is ONLINE`);
          
          // If you have a socket connection, you would emit it here:
          // socket.emit('user_online', { userId: user.id });

        } catch (error) {
          console.error('Error syncing user with database:', error);
        }
      };

      syncUser();

      // Cleanup on unmount (Offline)
      return () => {
        console.log(`Presence: User is OFFLINE`);
        // socket.emit('user_offline', { userId: user.id });
      };
    }
  }, [isLoaded, isSignedIn, user]);

  return null; // This is a headless component, it renders nothing
}
