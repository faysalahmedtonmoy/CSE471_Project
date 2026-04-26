'use client';

import { useState, useEffect } from 'react';
import BackToDashboard from '../../components/BackToDashboard';
import MultiImageUpload from '../../components/MultiImageUpload';

export default function RealEstatePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    listingType: 'Apartment',
    price: '',
    size: '',
    bedrooms: 1,
    bathrooms: 1,
    contactPhone: '',
    contactEmail: '',
    images: [],
  });
  const [filters, setFilters] = useState({
    listingType: 'Apartment',
    location: '',
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const res = await fetch(`/api/listings?${params.toString()}`);
    const data = await res.json();
    setListings(data.listings || []);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        price: Number(formData.price),
        size: Number(formData.size),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Listing submitted successfully');
      setFormData({
        title: '',
        description: '',
        location: '',
        listingType: 'Apartment',
        price: '',
        size: '',
        bedrooms: 1,
        bathrooms: 1,
        contactPhone: '',
        contactEmail: '',
        images: [],
      });
      fetchListings();
    } else {
      alert(data.message || 'Unable to submit listing');
    }
  };

  return (
    <div style={pageStyle}>
      <BackToDashboard />
      <h1 style={titleStyle}>🏠 To-Let & Real Estate Listings</h1>
      <div style={gridStyle}>
        <section style={sectionStyle}>
          <h2>Search Listings</h2>
          <form onSubmit={handleSearch} style={formStyle}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={filters.listingType} onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}>
              <option value="">All</option>
              <option value="Apartment">Apartment</option>
              <option value="Commercial">Commercial</option>
              <option value="Shop">Shop</option>
              <option value="Office">Office</option>
            </select>

            <label style={labelStyle}>Location</label>
            <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} style={inputStyle} placeholder="City or area" />

            <label style={labelStyle}>Price Range</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} style={inputStyle} placeholder="Min price" />
              <input value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} style={inputStyle} placeholder="Max price" />
            </div>

            <label style={labelStyle}>Size Range (sq ft)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={filters.minSize} onChange={(e) => setFilters({ ...filters, minSize: e.target.value })} style={inputStyle} placeholder="Min size" />
              <input value={filters.maxSize} onChange={(e) => setFilters({ ...filters, maxSize: e.target.value })} style={inputStyle} placeholder="Max size" />
            </div>

            <button type="submit" style={buttonStyle}>Search Listings</button>
          </form>
        </section>
        <section style={sectionStyle}>
          <h2>Add a To-Let Listing</h2>
          <form onSubmit={handleCreate} style={formStyle}>
            <input style={inputStyle} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Listing title" required />
            <textarea style={textareaStyle} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" required />
            <input style={inputStyle} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location" required />
            <select style={inputStyle} value={formData.listingType} onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}>
              <option value="Apartment">Apartment</option>
              <option value="Commercial">Commercial</option>
              <option value="Shop">Shop</option>
              <option value="Office">Office</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input style={inputStyle} type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Monthly rent" required />
              <input style={inputStyle} type="number" min="0" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="Size (sq ft)" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input style={inputStyle} type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} placeholder="Bedrooms" />
              <input style={inputStyle} type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} placeholder="Bathrooms" />
            </div>
            <input style={inputStyle} value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="Contact phone" />
            <input style={inputStyle} type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="Contact email" />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Listing Images (Up to 5)</label>
              <MultiImageUpload onUpload={(urls) => setFormData((prev) => ({ ...prev, images: urls }))} maxFiles={5} />
            </div>

            <button type="submit" style={buttonStyle}>Submit Listing</button>
          </form>
        </section>
      </div>

      <section style={sectionStyle}>
        <h2>Available Listings</h2>
        {loading ? <p>Loading listings...</p> : listings.length === 0 ? <p>No listings found.</p> : (
          <div style={cardsGridStyle}>
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Listing Card Component with Save functionality
function ListingCard({ listing }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to save listings');
      return;
    }

    try {
      const res = await fetch('/api/saved-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId: listing._id,
          listingType: 'toLet'
        })
      });
      const data = await res.json();
      setIsSaved(data.saved);
      alert(data.saved ? 'Listing saved!' : 'Removed from saved');
    } catch (error) {
      console.error('Error saving listing:', error);
    }
  };

  return (
    <div style={cardStyle}>
      {/* Show the first image as cover if available */}
      {(listing.images?.length > 0 || listing.imageUrl) && (
        <div style={{ width: '100%', height: '200px', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <img src={listing.images?.[0] || listing.imageUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {listing.images?.length > 1 && (
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              +{listing.images.length - 1} More
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3>{listing.title}</h3>
        <button
          onClick={handleSave}
          style={{
            ...saveButtonStyle,
            backgroundColor: isSaved ? '#10b981' : '#f3f4f6',
            color: isSaved ? 'white' : '#666',
          }}
        >
          {isSaved ? '✓ Saved' : '♡ Save'}
        </button>
      </div>
      <p><strong>Type:</strong> {listing.listingType}</p>
      <p><strong>Location:</strong> {listing.location}</p>
      <p><strong>Price:</strong> ৳{listing.price}</p>
      <p><strong>Size:</strong> {listing.size} sq ft</p>
      <p>{listing.description}</p>
      <p><strong>Bedrooms:</strong> {listing.bedrooms}, <strong>Bathrooms:</strong> {listing.bathrooms}</p>
      {listing.contactPhone && <p><strong>Phone:</strong> {listing.contactPhone}</p>}
      {listing.contactEmail && <p><strong>Email:</strong> {listing.contactEmail}</p>}
    </div>
  );
}

const saveButtonStyle = {
  padding: '0.25rem 0.75rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const pageStyle = {
  padding: '30px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const titleStyle = {
  fontSize: '34px',
  marginBottom: '20px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginBottom: '30px',
};

const sectionStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

const formStyle = {
  display: 'grid',
  gap: '15px',
};

const labelStyle = {
  fontWeight: '600',
  marginBottom: '6px',
};

const inputStyle = {
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
};

const buttonStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
};

const cardsGridStyle = {
  display: 'grid',
  gap: '20px',
};

const cardStyle = {
  backgroundColor: '#fdfdfd',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};
