'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    serviceType: '',
    customServiceType: '',
    skills: '',
    workType: 'shop',
    shopAddress: '',
    phone: '',
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  // Check auth
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const getMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser");
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const loc = `${data.address.city || data.address.town || data.address.village || ''}, ${data.address.country}`;
        setFormData({ ...formData, location: loc.replace(/^, /, '') });
      } catch (err) { 
        alert("Error fetching city from GPS. Please enter manually."); 
      }
      setLoadingLocation(false);
    }, (error) => {
      setLoadingLocation(false);
      alert("Please allow location access to use this feature.");
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    
    const submitData = {
      ...formData,
      serviceType: formData.serviceType === 'Other' ? formData.customServiceType : formData.serviceType
    };

    try {
      const res = await fetch('/api/auth/upgrade-provider', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Update the token to the fresh one containing the PROVIDER role
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', 'PROVIDER');
        
        alert("Success! You are now registered as a Service Provider.");
        // Use window.location to force a hard refresh into the dashboard
        window.location.href = '/user-dashboard';
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (error) {
      alert("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Become a Service Provider</h2>
          <p style={styles.subtitle}>Complete your profile to start receiving service requests from users in your area.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Primary Location (City, Country)</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input 
                type="text" 
                placeholder="e.g. Dhaka, Bangladesh" 
                required 
                style={{ ...styles.input, marginBottom: 0 }}
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
              />
              <button type="button" onClick={getMyLocation} style={styles.locBtn} disabled={loadingLocation}>
                {loadingLocation ? '⌛' : '📍'}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Service Type</label>
            <select 
              style={styles.input}
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
              required
            >
              <option value="">Select your main profession...</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="HVAC Technician">HVAC Technician</option>
              <option value="Auto Mechanic">Auto Mechanic</option>
              <option value="General Technician">General Technician</option>
              <option value="Manual Labor Worker">Manual Labor Worker</option>
              <option value="Other">Other (Specify below)</option>
            </select>
          </div>

          {formData.serviceType === 'Other' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Specify Profession</label>
              <input 
                type="text" 
                placeholder="What exactly do you do?" 
                style={styles.input}
                value={formData.customServiceType}
                onChange={(e) => setFormData({...formData, customServiceType: e.target.value})}
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Professional Skills (comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Wiring, Pipe Fitting, Appliance Repair" 
              style={styles.input}
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Work Type</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input 
                  type="radio" 
                  value="mobile" 
                  checked={formData.workType === 'mobile'}
                  onChange={(e) => setFormData({...formData, workType: e.target.value})}
                /> 🚗 Mobile Worker (I travel to customers)
              </label>
              <label style={styles.radioLabel}>
                <input 
                  type="radio" 
                  value="shop" 
                  checked={formData.workType === 'shop'}
                  onChange={(e) => setFormData({...formData, workType: e.target.value})}
                /> 🏢 Shop/Facility (Customers come to me)
              </label>
              <label style={styles.radioLabel}>
                <input 
                  type="radio" 
                  value="both" 
                  checked={formData.workType === 'both'}
                  onChange={(e) => setFormData({...formData, workType: e.target.value})}
                /> 🔄 Both (Mobile & Fixed)
              </label>
            </div>
          </div>

          {(formData.workType === 'shop' || formData.workType === 'both') && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Shop/Facility Address</label>
              <input 
                type="text" 
                placeholder="Full address of your shop" 
                style={styles.input}
                value={formData.shopAddress}
                onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Phone Number</label>
            <input 
              type="tel" 
              placeholder="Your business phone number" 
              style={styles.input}
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          <div style={styles.actions}>
            <button 
              type="button" 
              onClick={() => router.push('/user-dashboard')} 
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Upgrading...' : 'Upgrade Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  title: {
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#334155',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '15px',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  locBtn: {
    padding: '0 15px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '20px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#475569',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
    padding: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',
  }
};
