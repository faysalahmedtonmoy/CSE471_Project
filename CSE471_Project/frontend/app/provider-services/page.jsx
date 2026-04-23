'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jwtDecode from 'jwt-decode';
import BackToDashboard from '../../components/BackToDashboard';

export default function ProviderServicesPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [updating, setUpdating] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
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
        // Filter to show only requests assigned to the current provider
        const providerRequests = (data.requests || []).filter(r => r.providerId === currentUserId);
        setRequests(providerRequests);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    const token = localStorage.getItem('token');
    setUpdating({ ...updating, [requestId]: true });

    const res = await fetch(`/api/service-requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });

    setUpdating({ ...updating, [requestId]: false });

    if (res.ok) {
      fetchRequests();
    } else {
      const data = await res.json();
      alert(data.message || 'Unable to update request');
    }
  };

  const handleChatClick = (conversationId) => {
    if (conversationId) {
      router.push(`/chat?conversation=${conversationId}`);
    }
  };

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  const handleChatClick = (conversationId) => {
    router.push(`/chat?conversation=${conversationId}`);
  };

  return (
    <div style={pageStyle}>
      <BackToDashboard />
      <h1 style={titleStyle}>📋 My Assigned Services</h1>
      {error && (
        <div style={errorStyle}>
          <p>❌ {error}</p>
          <button onClick={fetchRequests} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <p style={statNumberStyle}>{stats.total}</p>
          <p style={statLabelStyle}>Total Requests</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#3b82f6' }}>
          <p style={statNumberStyle}>{stats.pending}</p>
          <p style={statLabelStyle}>Pending</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#f59e0b' }}>
          <p style={statNumberStyle}>{stats.inProgress}</p>
          <p style={statLabelStyle}>In Progress</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#10b981' }}>
          <p style={statNumberStyle}>{stats.completed}</p>
          <p style={statLabelStyle}>Completed</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={filterStyle}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'all' ? '#2563eb' : '#e5e7eb',
            color: filterStatus === 'all' ? '#fff' : '#000',
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'pending' ? '#3b82f6' : '#e5e7eb',
            color: filterStatus === 'pending' ? '#fff' : '#000',
          }}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('in progress')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'in progress' ? '#f59e0b' : '#e5e7eb',
            color: filterStatus === 'in progress' ? '#fff' : '#000',
          }}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'completed' ? '#10b981' : '#e5e7eb',
            color: filterStatus === 'completed' ? '#fff' : '#000',
          }}
        >
          Completed
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <p>Loading your assigned services...</p>
      ) : filteredRequests.length === 0 ? (
        <p style={emptyMessageStyle}>
          {filterStatus === 'all'
            ? 'No service requests assigned to you yet.'
            : `No ${filterStatus} service requests.`}
        </p>
      ) : (
        <div style={listStyle}>
          {filteredRequests.map((request) => (
            <div key={request._id} style={cardStyle}>
              <div style={headerStyle}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{request.serviceType}</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    User ID: {request.userId}
                  </p>
                </div>
                <span style={getStatusBadgeStyle(request.status)}>
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div style={detailsStyle}>
                <p>
                  <strong>Appointment:</strong> {new Date(request.appointmentDate).toLocaleString()}
                </p>
                <p>
                  <strong>Description:</strong> {request.description || 'N/A'}
                </p>
                <p>
                  <strong>Rating:</strong> {request.rating ? `${request.rating} ⭐` : 'Not rated yet'}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div style={statusUpdateBoxStyle}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Update Status:</p>
                <div style={statusButtonsStyle}>
                  <button
                    onClick={() => updateStatus(request._id, 'in progress')}
                    disabled={
                      request.status === 'in progress' ||
                      request.status === 'completed' ||
                      request.status === 'cancelled' ||
                      updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'in progress' ? '#f59e0b' : '#fbbf24',
                      opacity:
                        request.status === 'in progress' ? 0.6 : 1,
                      cursor:
                        request.status === 'in progress' ||
                        request.status === 'completed' ||
                        request.status === 'cancelled' ||
                        updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] && request.status !== 'in progress'
                      ? 'Starting...'
                      : 'Start Service'}
                  </button>
                  <button
                    onClick={() => updateStatus(request._id, 'completed')}
                    disabled={
                      request.status !== 'in progress' || updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'completed' ? '#10b981' : '#34d399',
                      opacity: request.status === 'completed' ? 0.6 : 1,
                      cursor:
                        request.status !== 'in progress' || updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] &&
                    request.status === 'in progress'
                      ? 'Completing...'
                      : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => updateStatus(request._id, 'cancelled')}
                    disabled={
                      request.status === 'completed' ||
                      request.status === 'cancelled' ||
                      updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'cancelled' ? '#ef4444' : '#f87171',
                      opacity:
                        request.status === 'cancelled' ? 0.6 : 1,
                      cursor:
                        request.status === 'completed' ||
                        request.status === 'cancelled' ||
                        updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] && request.status !== 'cancelled'
                      ? 'Cancelling...'
                      : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleChatClick(request.conversationId)}
                    style={{
                      ...statusButtonStyle,
                      backgroundColor: '#2563eb',
                      marginLeft: 'auto',
                    }}
                  >
                    💬 Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  padding: '30px',
  maxWidth: '1000px',
  margin: '0 auto',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
};

const titleStyle = {
  fontSize: '34px',
  marginBottom: '30px',
  fontWeight: '700',
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

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '30px',
};

const statCardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  borderLeft: '4px solid #6366f1',
};

const statNumberStyle = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const statLabelStyle = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
};

const filterStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '25px',
  flexWrap: 'wrap',
};

const filterButtonStyle = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s',
};

const emptyMessageStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#666',
  fontSize: '16px',
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
  transition: 'box-shadow 0.2s',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '15px',
};

const detailsStyle = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '15px',
  fontSize: '14px',
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = {
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
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
        // Filter to show only requests assigned to the current provider
        const providerRequests = (data.requests || []).filter(r => r.providerId === currentUserId);
        setRequests(providerRequests);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    const token = localStorage.getItem('token');
    setUpdating({ ...updating, [requestId]: true });
    
    const res = await fetch(`/api/service-requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    
    setUpdating({ ...updating, [requestId]: false });
    
    if (res.ok) {
      fetchRequests();
    } else {
      const data = await res.json();
      alert(data.message || 'Unable to update request');
    }
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>📋 My Assigned Services</h1>

      {error && (
        <div style={errorStyle}>
          <p>❌ {error}</p>
          <button onClick={fetchRequests} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <p style={statNumberStyle}>{stats.total}</p>
          <p style={statLabelStyle}>Total Requests</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#3b82f6' }}>
          <p style={statNumberStyle}>{stats.pending}</p>
          <p style={statLabelStyle}>Pending</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#f59e0b' }}>
          <p style={statNumberStyle}>{stats.inProgress}</p>
          <p style={statLabelStyle}>In Progress</p>
        </div>
        <div style={{ ...statCardStyle, borderLeftColor: '#10b981' }}>
          <p style={statNumberStyle}>{stats.completed}</p>
          <p style={statLabelStyle}>Completed</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={filterStyle}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'all' ? '#2563eb' : '#e5e7eb',
            color: filterStatus === 'all' ? '#fff' : '#000',
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'pending' ? '#3b82f6' : '#e5e7eb',
            color: filterStatus === 'pending' ? '#fff' : '#000',
          }}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('in progress')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'in progress' ? '#f59e0b' : '#e5e7eb',
            color: filterStatus === 'in progress' ? '#fff' : '#000',
          }}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filterStatus === 'completed' ? '#10b981' : '#e5e7eb',
            color: filterStatus === 'completed' ? '#fff' : '#000',
          }}
        >
          Completed
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <p>Loading your assigned services...</p>
      ) : filteredRequests.length === 0 ? (
        <p style={emptyMessageStyle}>
          {filterStatus === 'all'
            ? 'No service requests assigned to you yet.'
            : `No ${filterStatus} service requests.`}
        </p>
      ) : (
        <div style={listStyle}>
          {filteredRequests.map((request) => (
            <div key={request._id} style={cardStyle}>
              <div style={headerStyle}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{request.serviceType}</h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    User ID: {request.userId}
                  </p>
                </div>
                <span style={getStatusBadgeStyle(request.status)}>
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div style={detailsStyle}>
                <p>
                  <strong>Appointment:</strong> {new Date(request.appointmentDate).toLocaleString()}
                </p>
                <p>
                  <strong>Description:</strong> {request.description || 'N/A'}
                </p>
                <p>
                  <strong>Rating:</strong> {request.rating ? `${request.rating} ⭐` : 'Not rated yet'}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div style={statusUpdateBoxStyle}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Update Status:</p>
                <div style={statusButtonsStyle}>
                  <button
                    onClick={() => updateStatus(request._id, 'in progress')}
                    disabled={
                      request.status === 'in progress' ||
                      request.status === 'completed' ||
                      request.status === 'cancelled' ||
                      updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'in progress' ? '#f59e0b' : '#fbbf24',
                      opacity:
                        request.status === 'in progress' ? 0.6 : 1,
                      cursor:
                        request.status === 'in progress' ||
                        request.status === 'completed' ||
                        request.status === 'cancelled' ||
                        updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] && request.status !== 'in progress'
                      ? 'Starting...'
                      : 'Start Service'}
                  </button>
                  <button
                    onClick={() => updateStatus(request._id, 'completed')}
                    disabled={
                      request.status !== 'in progress' || updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'completed' ? '#10b981' : '#34d399',
                      opacity: request.status === 'completed' ? 0.6 : 1,
                      cursor:
                        request.status !== 'in progress' || updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] &&
                    request.status === 'in progress'
                      ? 'Completing...'
                      : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => updateStatus(request._id, 'cancelled')}
                    disabled={
                      request.status === 'completed' ||
                      request.status === 'cancelled' ||
                      updating[request._id]
                    }
                    style={{
                      ...statusButtonStyle,
                      backgroundColor:
                        request.status === 'cancelled' ? '#ef4444' : '#f87171',
                      opacity:
                        request.status === 'cancelled' ? 0.6 : 1,
                      cursor:
                        request.status === 'completed' ||
                        request.status === 'cancelled' ||
                        updating[request._id]
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {updating[request._id] && request.status !== 'cancelled'
                      ? 'Cancelling...'
                      : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  padding: '30px',
  maxWidth: '1000px',
  margin: '0 auto',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
};

const titleStyle = {
  fontSize: '34px',
  marginBottom: '30px',
  fontWeight: '700',
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

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '30px',
};

const statCardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  borderLeft: '4px solid #6366f1',
};

const statNumberStyle = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const statLabelStyle = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
};

const filterStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '25px',
  flexWrap: 'wrap',
};

const filterButtonStyle = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s',
};

const emptyMessageStyle = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#666',
  fontSize: '16px',
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
  transition: 'box-shadow 0.2s',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '15px',
};

const detailsStyle = {
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '15px',
  fontSize: '14px',
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = {
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
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
i m p o r t   B a c k T o D a s h b o a r d   f r o m   ' . . / . . / c o m p o n e n t s / B a c k T o D a s h b o a r d ' ; 
 
 
