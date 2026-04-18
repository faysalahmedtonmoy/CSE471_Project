'use client';

import { useState } from 'react';

export default function ProviderSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchTerm && !serviceType && !location) {
      setError('Please enter at least one search criteria');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('skill', searchTerm);
      if (serviceType) params.append('serviceType', serviceType);
      if (location) params.append('location', location);

      const res = await fetch(`/api/providers?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to search providers');
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to search providers. Please try again.');
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const contactProvider = (provider) => {
    const message = `Hi ${provider.name}, I found you through AshePashe and I'm interested in your ${provider.serviceType} services.`;
    // You could integrate with chat system here
    alert(`Contacting ${provider.name}...\n\n${message}`);
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>🔍 Search Service Providers</h2>

      <div style={searchContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Skill/Profession:</label>
          <input
            type="text"
            placeholder="e.g., Electrician, Plumber, Carpenter"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Service Type:</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Types</option>
            <option value="Electrician">Electrician</option>
            <option value="Plumber">Plumber</option>
            <option value="Carpenter">Carpenter</option>
            <option value="HVAC Technician">HVAC Technician</option>
            <option value="Auto Mechanic">Auto Mechanic</option>
            <option value="General Technician">General Technician</option>
            <option value="Manual Labor Worker">Manual Labor Worker</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Location:</label>
          <input
            type="text"
            placeholder="e.g., Dhaka, Chittagong"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button onClick={handleSearch} style={searchBtnStyle} disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={resultsStyle}>
        {results.length === 0 && !loading && !error && (
          <p style={noResultsStyle}>No providers found. Try different search criteria.</p>
        )}

        {results.map((provider) => (
          <div key={provider._id} style={providerCardStyle}>
            <h3 style={providerNameStyle}>{provider.name}</h3>
            <p style={providerInfoStyle}>
              <strong>Service:</strong> {provider.serviceType || 'Not specified'}
            </p>
            <p style={providerInfoStyle}>
              <strong>Skills:</strong> {provider.skills?.join(', ') || 'Not specified'}
            </p>
            <p style={providerInfoStyle}>
              <strong>Location:</strong> {provider.location}
            </p>
            <p style={providerInfoStyle}>
              <strong>Work Type:</strong> {provider.workType === 'mobile' ? '🚗 Mobile' : provider.workType === 'shop' ? '🏢 Fixed Location' : '🔄 Both'}
            </p>
            {provider.ratings > 0 && (
              <p style={providerInfoStyle}>
                <strong>Rating:</strong> ⭐ {provider.ratings.toFixed(1)} ({provider.reviewCount} reviews)
              </p>
            )}
            <button
              onClick={() => contactProvider(provider)}
              style={contactBtnStyle}
            >
              📞 Contact Provider
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const containerStyle = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  margin: '20px 0',
};

const titleStyle = {
  color: '#2c3e50',
  marginBottom: '20px',
  textAlign: 'center',
};

const searchContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '15px',
  marginBottom: '20px',
  alignItems: 'end',
};

const inputGroupStyle = {
  flex: '1',
  minWidth: '200px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
  color: '#555',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
};

const selectStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
};

const searchBtnStyle = {
  padding: '10px 20px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
};

const errorStyle = {
  color: '#e74c3c',
  textAlign: 'center',
  marginBottom: '20px',
};

const resultsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '15px',
};

const noResultsStyle = {
  textAlign: 'center',
  color: '#7f8c8d',
  fontStyle: 'italic',
  gridColumn: '1 / -1',
};

const providerCardStyle = {
  backgroundColor: 'white',
  padding: '15px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e1e8ed',
};

const providerNameStyle = {
  margin: '0 0 10px 0',
  color: '#2c3e50',
  fontSize: '18px',
};

const providerInfoStyle = {
  margin: '5px 0',
  color: '#555',
  fontSize: '14px',
};

const contactBtnStyle = {
  marginTop: '10px',
  padding: '8px 15px',
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  width: '100%',
};