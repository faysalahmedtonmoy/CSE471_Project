'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (!token) {
      router.push('/login');
      return;
    }

    // Redirect to appropriate dashboard based on role
    if (userRole === 'ADMIN') {
      router.push('/admin');
    } else if (userRole === 'PROVIDER') {
      router.push('/provider-dashboard');
    } else if (userRole === 'USER') {
      router.push('/user-dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

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
        <h1 style={styles.navTitle}>AshePashe</h1>
        <div style={styles.navRight}>
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.welcome}>Welcome to your Dashboard</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>🏥 Hospital & Emergency Search</h3>
            <p>Find nearby hospitals, ambulances, and fire services</p>
            <button
              onClick={() => router.push('/services')}
              style={styles.cardBtn}
            >
              Search Services
            </button>
          </div>

          <div style={styles.card}>
            <h3>👤 Profile Management</h3>
            <p>View and update your profile information</p>
            <button
              onClick={() => router.push('/profile')}
              style={styles.cardBtn}
            >
              Manage Profile
            </button>
          </div>

          {user.role === 'PROVIDER' && (
            <div style={styles.card}>
              <h3>📋 My Services</h3>
              <p>Manage your service listings</p>
              <button
                onClick={() => router.push('/my-services')}
                style={styles.cardBtn}
              >
                View Services
              </button>
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div style={styles.card}>
              <h3>⚙️ Admin Panel</h3>
              <p>Manage users and system settings</p>
              <button
                onClick={() => router.push('/admin')}
                style={styles.cardBtn}
              >
                Admin Dashboard
              </button>
            </div>
          )}
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
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: {
    margin: 0,
    fontSize: '1.5rem',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoutBtn: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  welcome: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  cardBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};