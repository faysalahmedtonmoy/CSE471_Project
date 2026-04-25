'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClerkCallback() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying authentication...');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    const syncWithBackend = async () => {
      try {
        setStatus('Syncing with database...');
        
        const email = user.primaryEmailAddress?.emailAddress;
        const name = user.fullName || user.username || email?.split('@')[0];

        const response = await fetch('/api/auth/social-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkUserId: user.id,
            email: email,
            name: name,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);
          }
          setStatus('Success! Redirecting...');
          window.location.href = data.user.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard';
        } else {
          setStatus(`Error: ${data.message}`);
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        setStatus('Network error. Redirecting to login...');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    syncWithBackend();
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '20px', fontSize: '18px', color: '#555' }}>{status}</p>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
