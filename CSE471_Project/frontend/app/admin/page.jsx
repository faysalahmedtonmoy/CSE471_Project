'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (!token || userRole !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, ...updates })
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers(); // Refresh the list
        alert('User updated successfully!');
      } else {
        alert('Error updating user');
      }
    } catch (error) {
      alert('Error updating user');
    }
  };

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

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.navTitle}>AshePashe Admin</h1>
        <div style={styles.navRight}>
          <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.title}>⚙️ Admin Control Panel</h2>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
          <div style={styles.statCard}>
            <h3>{users.filter(u => u.role === 'PROVIDER').length}</h3>
            <p>Service Providers</p>
          </div>
          <div style={styles.statCard}>
            <h3>{users.filter(u => u.role === 'USER').length}</h3>
            <p>Regular Users</p>
          </div>
        </div>

        <div style={styles.userManagement}>
          <h3>👥 User Management</h3>
          <div style={styles.userGrid}>
            {users.map(user => (
              <div key={user._id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <p>📍 {user.location}</p>
                  <div style={styles.roleContainer}>
                    <span style={{
                      ...styles.roleBadge,
                      backgroundColor: user.role === 'ADMIN' ? '#fef3c7' :
                                     user.role === 'PROVIDER' ? '#dbeafe' : '#d1fae5'
                    }}>
                      {user.role}
                    </span>
                    {user.isVerified && <span style={styles.verifiedBadge}>✓ Email Verified</span>}
                    {user.role === 'PROVIDER' && (
                      <span style={{
                        ...styles.providerVerifiedBadge,
                        backgroundColor: user.isProviderVerified ? '#10b981' : '#f59e0b'
                      }}>
                        {user.isProviderVerified ? '✓ Provider Verified' : '⏳ Pending Provider Verification'}
                      </span>
                    )}
                  </div>
                </div>

                {editingUser === user._id ? (
                  <div style={styles.editForm}>
                    <select
                      defaultValue={user.role}
                      style={styles.select}
                      onChange={(e) => handleUpdateUser(user._id, { role: e.target.value })}
                    >
                      <option value="USER">USER</option>
                      <option value="PROVIDER">PROVIDER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <div style={styles.editButtons}>
                      <button
                        onClick={() => handleUpdateUser(user._id, { isVerified: !user.isVerified })}
                        style={{
                          ...styles.verifyBtn,
                          backgroundColor: user.isVerified ? '#dc2626' : '#10b981'
                        }}
                      >
                        {user.isVerified ? 'Unverify Email' : 'Verify Email'}
                      </button>
                      {user.role === 'PROVIDER' && (
                        <button
                          onClick={() => handleUpdateUser(user._id, { isProviderVerified: !user.isProviderVerified })}
                          style={{
                            ...styles.verifyBtn,
                            backgroundColor: user.isProviderVerified ? '#dc2626' : '#10b981'
                          }}
                        >
                          {user.isProviderVerified ? 'Unverify Provider' : 'Verify Provider'}
                        </button>
                      )}
                      <button onClick={() => setEditingUser(null)} style={styles.cancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingUser(user._id)}
                    style={styles.editBtn}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            ))}
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
  backBtn: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
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
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  userManagement: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  userCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  roleContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  roleBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#333',
  },
  verifiedBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  providerVerifiedBadge: {
    padding: '0.25rem 0.75rem',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  editButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  verifyBtn: {
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  cancelBtn: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};