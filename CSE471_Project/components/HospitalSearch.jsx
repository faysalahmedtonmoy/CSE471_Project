'use client';

import { useState, useEffect } from 'react';
// import styles from '@/styles/HospitalSearch.module.css'; // Removed unused import

export default function HospitalSearch() {
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        searchServices(latitude, longitude);
      },
      (err) => {
        setError('Unable to access your location. Please enable GPS.');
        console.error('Geolocation error:', err);
        setLoading(false);
      }
    );
  };

  const searchServices = async (lat, lng) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        type: selectedType === 'All' ? '' : selectedType,
        radius: radius.toString(),
      });

      const res = await fetch(`/api/services?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to search services');
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to search services. Please try again.');
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (location) {
      searchServices(location.latitude, location.longitude);
    }
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const handleRadiusChange = (e) => {
    setRadius(e.target.value);
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🔧 Service Provider Search</h1>

      <div style={searchContainerStyle}>
        <div style={controlsStyle}>
          <div style={controlGroupStyle}>
            <label style={labelStyle}>Service Type:</label>
            <select style={selectStyle} value={selectedType} onChange={handleTypeChange}>
              <option value="All">All Services</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Painter">Painter</option>
            </select>
          </div>

          <div style={controlGroupStyle}>
            <label style={labelStyle}>Search Radius: {radius} km</label>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={handleRadiusChange}
              style={rangeStyle}
            />
          </div>

          <button style={buttonStyle} onClick={getCurrentLocation}>
            📍 Get Current Location
          </button>

          <button style={searchButtonStyle} onClick={handleSearch} disabled={!location || loading}>
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>

        {location && (
          <div style={locationInfoStyle}>
            <p>📌 Current Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}
      </div>

      <div style={resultsContainerStyle}>
        {loading && <p style={loadingStyle}>⏳ Searching for nearby services...</p>}

        {!loading && results.length === 0 && location && (
          <p style={noResultsStyle}>No services found in the selected area. Try increasing the radius.</p>
        )}

        {results.map((service, index) => (
          <div key={service._id || index} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>
                🔧 {service.name}
                {service.isProviderVerified ? ' ✅' : ' ⏳'}
              </h3>
              <span style={{
                ...verificationBadgeStyle,
                backgroundColor: service.isProviderVerified ? '#10b981' : '#f59e0b'
              }}>
                {service.isProviderVerified ? 'Verified Provider' : 'Pending Verification'}
              </span>
            </div>

            <div style={cardContentStyle}>
              <p><strong>Service Type:</strong> {service.type}</p>
              {service.skills && service.skills.length > 0 && (
                <p><strong>🛠️ Skills:</strong> {service.skills.join(', ')}</p>
              )}
              {service.workType && <p><strong>Work Type:</strong> {service.workType}</p>}
              {service.address && <p><strong>📍 Address:</strong> {service.address}</p>}
              {service.phone && <p><strong>📞 Phone:</strong> <a href={`tel:${service.phone}`} style={phoneLinkStyle}>{service.phone}</a></p>}
              {service.ratings && <p><strong>⭐ Rating:</strong> {service.ratings}/5 ({service.reviewCount} reviews)</p>}
            </div>

            <div style={cardActionsStyle}>
              <button style={callButtonStyle} onClick={() => {
                if (service.phone) {
                  window.location.href = `tel:${service.phone}`;
                }
              }}>
                📞 Call
              </button>
              <button style={messageButtonStyle} onClick={() => {
                // Navigate to chat with this provider
                window.location.href = `/chat?provider=${service._id}`;
              }}>
                💬 Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
};

const titleStyle = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '30px',
  textAlign: 'center',
  color: '#333',
};

const searchContainerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '30px',
};

const controlsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
};

const controlGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#555',
};

const selectStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  cursor: 'pointer',
  backgroundColor: 'white',
};

const rangeStyle = {
  width: '100%',
  cursor: 'pointer',
};

const buttonStyle = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};

const searchButtonStyle = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#10b981',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};

const locationInfoStyle = {
  padding: '12px 15px',
  backgroundColor: '#e3f2fd',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1565c0',
  marginTop: '15px',
};

const errorStyle = {
  padding: '12px 15px',
  backgroundColor: '#ffebee',
  borderRadius: '8px',
  color: '#c62828',
  fontSize: '14px',
  marginTop: '15px',
};

const resultsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '20px',
};

const loadingStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  fontSize: '16px',
  color: '#666',
  padding: '40px 20px',
};

const noResultsStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  fontSize: '16px',
  color: '#999',
  padding: '40px 20px',
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #eee',
};

const cardTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
  flex: 1,
};

const distanceBadgeStyle = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '13px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
  marginLeft: '10px',
};

const verificationBadgeStyle = {
  backgroundColor: '#10b981',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
  marginLeft: '10px',
};

const cardContentStyle = {
  fontSize: '14px',
  color: '#555',
  marginBottom: '15px',
  lineHeight: '1.6',
};

const phoneLinkStyle = {
  color: '#3b82f6',
  textDecoration: 'none',
};

const cardActionsStyle = {
  display: 'flex',
  gap: '10px',
};

const callButtonStyle = {
  flex: 1,
  padding: '10px 15px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#ef4444',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};

const directionsButtonStyle = {
  flex: 1,
  padding: '10px 15px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#8b5cf6',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};

const messageButtonStyle = {
  flex: 1,
  padding: '10px 15px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#f59e0b',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};
