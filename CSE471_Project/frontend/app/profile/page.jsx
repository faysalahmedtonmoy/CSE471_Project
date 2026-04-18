'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
          <p style={styles.comingSoon}>Saved listings feature coming soon...</p>
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
};