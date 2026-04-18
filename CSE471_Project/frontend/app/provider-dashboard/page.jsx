'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skills, setSkills] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (!token || userRole !== 'PROVIDER') {
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
        setSkills(data.user.skills?.join(', ') || '');
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

  const handleUpdateSkills = async () => {
    if (!skills.trim()) {
      alert('Please enter at least one skill');
      return;
    }

    setUpdating(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skills: skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setEditingSkills(false);
        alert('Skills updated successfully! Your provider verification status has been reset and requires admin approval.');
      } else {
        alert(data.message || 'Failed to update skills');
      }
    } catch (error) {
      alert('Error updating skills');
    } finally {
      setUpdating(false);
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
        <h1 style={styles.navTitle}>🏥 AshePashe - Provider</h1>
        <div style={styles.navRight}>
          <span style={styles.welcome}>Welcome, {user.name}!</span>
          <button onClick={() => router.push('/profile')} style={styles.profileBtn}>
            👤 Profile
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2 style={styles.pageTitle}>Provider Dashboard</h2>

        <div style={styles.infoCard}>
          <h3>🏢 Your Service Information</h3>
          <p><strong>Provider Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Location:</strong> {user.location || 'Not set'}</p>
          <p><strong>Email Verification:</strong> {user.isVerified ? '✅ Verified' : '⏳ Pending Verification'}</p>
          <p><strong>Provider Verification:</strong> {user.isProviderVerified ? '✅ Verified Provider' : '⏳ Pending Admin Verification'}</p>
          
          <div style={styles.skillsSection}>
            <h4>🛠️ Your Skills</h4>
            {editingSkills ? (
              <div>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Enter skills separated by commas (e.g., Electrical, Plumbing, Carpentry)"
                  style={styles.skillsInput}
                  rows={3}
                />
                <div style={styles.skillButtons}>
                  <button 
                    onClick={handleUpdateSkills} 
                    disabled={updating}
                    style={styles.saveBtn}
                  >
                    {updating ? 'Updating...' : 'Save Skills'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingSkills(false);
                      setSkills(user.skills?.join(', ') || '');
                    }} 
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Skills:</strong> {user.skills?.length > 0 ? user.skills.join(', ') : 'No skills set'}</p>
                <button 
                  onClick={() => setEditingSkills(true)} 
                  style={styles.editBtn}
                >
                  Edit Skills
                </button>
                <p style={styles.note}>
                  <em>Note: Updating skills will reset your provider verification status and require admin approval.</em>
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>📊 Service Overview</h3>
            <p>View and manage your service listings, ratings, and performance metrics</p>
            <button
              onClick={() => alert('Feature coming soon!')}
              style={styles.cardBtn}
            >
              View Services
            </button>
          </div>

          <div style={styles.card}>
            <h3>🆕 Add New Service</h3>
            <p>Register new hospital, ambulance, or emergency service</p>
            <button
              onClick={() => alert('Feature coming soon!')}
              style={styles.cardBtn}
            >
              Add Service
            </button>
          </div>

          <div style={styles.card}>
            <h3>📞 Incoming Requests</h3>
            <p>Manage emergency requests and respond to user inquiries</p>
            <button
              onClick={() => router.push('/chat')}
              style={styles.cardBtn}
            >
              View Requests
            </button>
          </div>

          <div style={styles.card}>
            <h3>⭐ Reviews & Ratings</h3>
            <p>Monitor customer feedback and service reviews</p>
            <button
              onClick={() => alert('Feature coming soon!')}
              style={styles.cardBtn}
            >
              View Reviews
            </button>
          </div>

          <div style={styles.card}>
            <h3>📈 Analytics</h3>
            <p>Track service availability, response times, and user engagement</p>
            <button
              onClick={() => alert('Feature coming soon!')}
              style={styles.cardBtn}
            >
              View Analytics
            </button>
          </div>

          <div style={styles.card}>
            <h3>⚙️ Settings</h3>
            <p>Manage account preferences and service configurations</p>
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
    backgroundColor: '#27ae60',
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
    backgroundColor: '#2980b9',
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
    color: '#27ae60',
    marginBottom: '30px',
    borderBottom: '3px solid #27ae60',
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
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  skillsSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  skillsInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    marginBottom: '10px',
    resize: 'vertical',
  },
  skillButtons: {
    display: 'flex',
    gap: '10px',
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editBtn: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  note: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#e74c3c',
  },
};
