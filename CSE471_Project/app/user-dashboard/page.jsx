'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (!token || userRole !== 'USER') {
      router.push('/login');
      return;
    }

    // Get user profile
    fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        router.push('/login');
      }
    })
    .catch(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      router.push('/login');
    })
    .finally(() => setLoading(false));
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

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>🏥 Find Emergency Services</h3>
            <p>Locate nearby hospitals, ambulances, and fire services instantly</p>
            <button
              onClick={() => router.push('/services')}
              style={styles.cardBtn}
            >
              Search Now
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
