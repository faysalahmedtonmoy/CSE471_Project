'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import ProviderSearch from '../../components/ProviderSearch';
import { useUser } from '@clerk/nextjs';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [socket, setSocket] = useState(null);
  const router = useRouter();
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const loadProfile = () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!currentToken) return false; // Not ready yet

      // Get user profile
      fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setLoading(false);
        } else {
          setErrorMsg(`Backend Error: ${data.message || 'User not found in DB'}`);
          setLoading(false);
        }
      })
      .catch((err) => {
        setErrorMsg(`Network Error: ${err.message}`);
        setLoading(false);
      });

      return true; // Token found and fetch started
    };

    if (token) {
      // Manual login or already synced
      loadProfile();
    } else {
      // No token found, wait for Clerk to load
      if (!clerkLoaded) return;

      if (!isSignedIn) {
        // Neither manual token nor Clerk sign-in exists
        router.push('/login');
      } else {
        // Clerk is signed in but token is missing: wait for PresenceTracker to sync it
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (loadProfile()) {
            clearInterval(interval);
          } else if (attempts > 50) { // 10 seconds timeout
            clearInterval(interval);
            setErrorMsg("Timeout waiting for Clerk to sync with backend database. Please refresh.");
            setLoading(false);
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, [clerkLoaded, isSignedIn, router]);

  useEffect(() => {
    if (loading) return; // Don't connect socket until loaded
    
    const token = localStorage.getItem('token');

    // Initialize socket connection for real-time updates
    const socketConnection = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('User connected to chat server');
      socketConnection.emit('join_conversations');
    });

    // Listen for provider responses to service requests
    socketConnection.on('new_message', (message) => {
      // Refresh the dashboard to show updated request status
      if (message.content && (message.content.includes('accepted') || message.content.includes('declined'))) {
        // Refresh user profile to get updated service requests
        fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(console.error);
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
    router.push('/login');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (errorMsg) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red', marginTop: '100px' }}>
        <h2>Authentication Sync Error</h2>
        <p>{errorMsg}</p>
        <button onClick={() => {
          if (typeof window !== 'undefined') localStorage.removeItem('token');
          router.push('/login');
        }} style={styles.cardBtn}>
          Return to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.navTitle}>🏥 AshePashe</h1>
        <div style={styles.navRight}>
          <span style={styles.welcome}>Welcome, {user.name}!</span>
          <button onClick={() => router.push('/profile')} style={styles.profileBtn}>
            👤 Profile
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>User Dashboard</h2>

        <div style={styles.infoCard}>
          <h3>📋 Your Information</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Location:</strong> {user.location || 'Not set'}</p>
          <p><strong>Account Status:</strong> {user.isVerified ? '✅ Verified' : '⏳ Pending'}</p>
        </div>

        {/* Upgrade Banner for Standard Users */}
        {user.role === 'USER' && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '20px' }}>Want to offer your services?</h3>
              <p style={{ margin: 0, color: '#3b82f6', fontSize: '15px' }}>
                Join our network of professionals and start earning by offering your skills to the community.
              </p>
            </div>
            <button 
              onClick={() => router.push('/onboarding/provider')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginLeft: '20px'
              }}
            >
              🚀 Become a Provider
            </button>
          </div>
        )}

        {/* Provider Search Section */}
        <ProviderSearch />

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>🏥 Find Emergency Services</h3>
            <p>Locate nearby hospitals, ambulances, and fire services instantly</p>
            <button
              onClick={() => router.push('/emergency-services')}
              style={styles.cardBtn}
            >
              Search Now
            </button>
          </div>

          <div style={styles.card}>
            <h3>🏠 Real Estate Listings</h3>
            <p>Browse to-let apartments and commercial spaces with price and size filters</p>
            <button
              onClick={() => router.push('/real-estate')}
              style={styles.cardBtn}
            >
              Explore Listings
            </button>
          </div>

          <div style={styles.card}>
            <h3>💼 Jobs & Education</h3>
            <p>Search local jobs and educational institutes in your community</p>
            <button
              onClick={() => router.push('/jobs')}
              style={styles.cardBtn}
            >
              Browse Now
            </button>
          </div>

          <div style={styles.card}>
            <h3>📝 Service Requests</h3>
            <p>Track appointment status, schedule visits, and rate completed work</p>
            <button
              onClick={() => router.push('/service-requests')}
              style={styles.cardBtn}
            >
              View Requests
            </button>
          </div>

          <div style={styles.card}>
            <h3>💬 Chat & Support</h3>
            <p>Connect with emergency responders and service providers</p>
            <button
              onClick={() => router.push('/chat')}
              style={styles.cardBtn}
            >
              Open Chat
            </button>
          </div>

          <div style={styles.card}>
            <h3>📱 Saved Listings</h3>
            <p>Quick access to your frequently used emergency services</p>
            <button
              onClick={() => alert('Feature coming soon!')}
              style={styles.cardBtn}
            >
              View Saved
            </button>
          </div>

          <div style={styles.card}>
            <h3>⚙️ Settings</h3>
            <p>Manage your account preferences and notification settings</p>
            <button
              onClick={() => router.push('/profile')}
              style={styles.cardBtn}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  navbar: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  navTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  welcome: {
    fontSize: '16px',
    fontWeight: '500',
  },
  profileBtn: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  logoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '32px',
    color: '#2c3e50',
    marginBottom: '30px',
    borderBottom: '3px solid #3498db',
    paddingBottom: '10px',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  cardBtn: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
};
