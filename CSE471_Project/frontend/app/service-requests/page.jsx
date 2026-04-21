'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jwtDecode from 'jwt-decode';

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingValues, setRatingValues] = useState({});
  const [commentValues, setCommentValues] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.userId);
      fetchRequests();
    } catch (err) {
      console.error('Failed to decode token:', err);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/service-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to load service requests');
        setRequests([]);
      } else {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (requestId, updates = {}) => {
    const token = localStorage.getItem('token');
    const body = {
      rating: Number(ratingValues[requestId] || 0),
      review: commentValues[requestId] || '',
      ...updates,
    };

    setUpdating({ ...updating, [requestId]: true });
    const res = await fetch(`/api/service-requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setUpdating({ ...updating, [requestId]: false });

    if (res.ok) {
      alert('Request updated');
      fetchRequests();
    } else {
      alert(data.message || 'Unable to update request');
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    await updateRequest(requestId, { status: newStatus });
  };

  const isProvider = (request) => request.providerId === currentUserId;

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>📝 Service Status Tracking</h1>

      {error && (
        <div style={errorStyle}>
          <p>❌ {error}</p>
          <button onClick={fetchRequests} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading your service requests...</p>
      ) : requests.length === 0 && !error ? (
        <div style={emptyStateStyle}>
          <p>No service requests found.</p>
          <p>Book a provider from the <a href="/services" style={linkStyle}>Services page</a> to get started.</p>
        </div>
      ) : (
        <div style={listStyle}>
          {requests.map((request) => (
            <div key={request._id} style={cardStyle}>
              <div style={headerStyle}>
                <h3>{request.serviceType}</h3>
                <span style={getStatusBadgeStyle(request.status)}>
                  {request.status.toUpperCase()}
                </span>
              </div>
              <p><strong>Appointment:</strong> {new Date(request.appointmentDate).toLocaleString()}</p>
              <p><strong>Description:</strong> {request.description || 'N/A'}</p>
              <p><strong>Created:</strong> {new Date(request.createdAt).toLocaleString()}</p>

              {/* Status Update Section - Only for Providers */}
              {isProvider(request) && (
                <div style={statusUpdateBoxStyle}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Update Status:</p>
                  <div style={statusButtonsStyle}>
                    <button
                      onClick={() => updateStatus(request._id, 'in progress')}
                      disabled={request.status === 'in progress' || request.status === 'completed' || request.status === 'cancelled' || updating[request._id]}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: request.status === 'in progress' ? '#f59e0b' : '#fbbf24',
                        opacity: request.status === 'in progress' ? 0.6 : 1,
                      }}
                    >
                      Start Service
                    </button>
                    <button
                      onClick={() => updateStatus(request._id, 'completed')}
                      disabled={request.status !== 'in progress' || updating[request._id]}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: request.status === 'completed' ? '#10b981' : '#34d399',
                        opacity: request.status === 'completed' ? 0.6 : 1,
                      }}
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateStatus(request._id, 'cancelled')}
                      disabled={request.status === 'completed' || request.status === 'cancelled' || updating[request._id]}
                      style={{
                        ...statusButtonStyle,
                        backgroundColor: request.status === 'cancelled' ? '#ef4444' : '#f87171',
                        opacity: request.status === 'cancelled' ? 0.6 : 1,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rating Section - Only for Users and only if completed */}
              {!isProvider(request) && request.status === 'completed' && (
                <div style={ratingBoxStyle}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Rate this service:</p>
                  <input
                    value={ratingValues[request._id] || ''}
                    onChange={(e) => setRatingValues({ ...ratingValues, [request._id]: e.target.value })}
                    type="number"
                    min="0"
                    max="5"
                    style={inputStyle}
                    placeholder="Rate 0-5"
                  />
                  <textarea
                    value={commentValues[request._id] || ''}
                    onChange={(e) => setCommentValues({ ...commentValues, [request._id]: e.target.value })}
                    placeholder="Write a review (optional)"
                    style={textareaStyle}
                  />
                  <button
                    style={buttonStyle}
                    onClick={() => updateRequest(request._id)}
                    disabled={updating[request._id]}
                  >
                    {updating[request._id] ? 'Saving...' : 'Save Rating & Review'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  padding: '30px',
  maxWidth: '900px',
  margin: '0 auto',
};

const titleStyle = {
  fontSize: '34px',
  marginBottom: '20px',
};

const errorStyle = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #fecaca',
};

const retryButtonStyle = {
  backgroundColor: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginTop: '10px',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#666',
  fontSize: '16px',
};

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const listStyle = {
  display: 'grid',
  gap: '20px',
};

const cardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px',
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = {
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  };

  const statusStyles = {
    pending: { backgroundColor: '#dbeafe', color: '#1e40af' },
    'in progress': { backgroundColor: '#fed7aa', color: '#92400e' },
    completed: { backgroundColor: '#d1fae5', color: '#065f46' },
    cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
  };

  return { ...baseStyle, ...(statusStyles[status] || statusStyles.pending) };
};

const statusUpdateBoxStyle = {
  marginTop: '15px',
  padding: '15px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
};

const statusButtonsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const statusButtonStyle = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s',
};

const ratingBoxStyle = {
  marginTop: '15px',
  padding: '15px',
  backgroundColor: '#f5f3ff',
  borderRadius: '8px',
  border: '1px solid #e9d5ff',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '14px',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
};

const buttonStyle = {
  padding: '12px 18px',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  marginTop: '5px',
};