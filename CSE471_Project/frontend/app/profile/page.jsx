'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackToDashboard from '../../components/BackToDashboard';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: ''
  });
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
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
        setFormData({
          name: data.user.name,
          email: data.user.email,
          location: data.user.location
        });
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error updating profile');
    }
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
          <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
        </div>
      </nav>
      <BackToDashboard />

      <div style={styles.content}>
        <h2 style={styles.title}>👤 Profile Management</h2>

        <div style={styles.profileCard}>
          <div style={styles.header}>
            <h3>My Profile</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} style={styles.editBtn}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleUpdate} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Location:</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role:</label>
                <span style={styles.roleBadge}>{user.role}</span>
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.saveBtn}>💾 Save Changes</button>
                <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.profileInfo}>
              <div style={styles.infoRow}>
                <strong>Name:</strong> {user.name}
              </div>
              <div style={styles.infoRow}>
                <strong>Email:</strong> {user.email}
              </div>
              <div style={styles.infoRow}>
                <strong>Location:</strong> {user.location}
              </div>
              <div style={styles.infoRow}>
                <strong>Role:</strong> <span style={styles.roleBadge}>{user.role}</span>
              </div>
              <div style={styles.infoRow}>
                <strong>Member since:</strong> {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        <div style={styles.savedListings}>
          <h3>📋 Saved Listings</h3>
          <SavedListings />
        </div>
      </div>
    </div>
  );
}

// Saved Listings Component
function SavedListings() {
  const [savedListings, setSavedListings] = useState({ toLet: [], jobs: [], institutes: [], services: [] });
  const [activeTab, setActiveTab] = useState('toLet');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/saved-listings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setSavedListings(data.savedListings || { toLet: [], jobs: [], institutes: [], services: [] });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (listingId, type) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`/api/saved-listings?listingId=${listingId}&type=${type}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSavedListings(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item && item._id !== listingId)
      }));
    } catch (error) {
      console.error('Error removing listing:', error);
    }
  };

  const tabs = [
    { key: 'toLet', label: '🏠 To-Let', count: savedListings.toLet?.length || 0 },
    { key: 'jobs', label: '💼 Jobs', count: savedListings.jobs?.length || 0 },
    { key: 'institutes', label: '🏫 Institutes', count: savedListings.institutes?.length || 0 },
    { key: 'services', label: '🔧 Services', count: savedListings.services?.length || 0 },
  ];

  const currentItems = savedListings[activeTab]?.filter(Boolean) || [];

  if (loading) return <p>Loading saved listings...</p>;

  return (
    <div>
      <div style={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.activeTab : {})
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {currentItems.length === 0 ? (
        <p style={styles.comingSoon}>No saved {activeTab} yet</p>
      ) : (
        <div style={styles.listingsGrid}>
          {currentItems.map(item => (
            <div key={item._id} style={styles.listingCard}>
              <div style={styles.listingHeader}>
                <h4 style={styles.listingTitle}>
                  {item.title || item.name || 'Untitled'}
                </h4>
                <button
                  onClick={() => handleRemove(item._id, activeTab)}
                  style={styles.removeBtn}
                >
                  ✕
                </button>
              </div>
              <p style={styles.listingInfo}>
                {item.location || item.address || ''}
              </p>
              {item.price && (
                <p style={styles.listingPrice}>💰 {item.price}</p>
              )}
              {item.jobType && (
                <p style={styles.listingInfo}>💼 {item.jobType}</p>
              )}
              {item.type && activeTab === 'institutes' && (
                <p style={styles.listingInfo}>🏫 {item.type}</p>
              )}
              {item.serviceType && (
                <p style={styles.listingInfo}>🔧 {item.serviceType}</p>
              )}
            </div>
          ))}
        </div>
      )}
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
  },
  backBtn: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  editBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoRow: {
    padding: '0.75rem 0',
    borderBottom: '1px solid #eee',
  },
  savedListings: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  comingSoon: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '1rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  activeTab: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  listingsGrid: {
    display: 'grid',
    gap: '1rem',
  },
  listingCard: {
    padding: '1rem',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  listingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTitle: {
    margin: 0,
    fontSize: '1rem',
    color: '#333',
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  listingInfo: {
    margin: '0.25rem 0',
    fontSize: '0.875rem',
    color: '#666',
  },
  listingPrice: {
    margin: '0.25rem 0',
    fontSize: '0.875rem',
    color: '#10b981',
    fontWeight: 'bold',
  },
};