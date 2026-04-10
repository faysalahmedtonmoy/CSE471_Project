'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
<<<<<<< HEAD
=======
  // Added 'role' with a default value of 'USER'
>>>>>>> origin/asha-module1
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    location: '', 
<<<<<<< HEAD
    role: 'USER',
    // Provider fields
    skills: '',
    workType: 'shop',
    shopAddress: '',
    phone: '',
    serviceType: ''
=======
    role: 'USER' 
>>>>>>> origin/asha-module1
  });
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const router = useRouter();

  const getMyLocation = () => {
    if (!navigator.geolocation) return alert("Not supported");
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const loc = `${data.address.city || data.address.town}, ${data.address.country}`;
        setFormData({ ...formData, location: loc });
      } catch (err) { alert("Error fetching city"); }
      setLoadingLocation(false);
    });
  };

  const handleSubmit = async (e) => {
<<<<<<< HEAD
    e.preventDefault();
    
    // Process skills into array and handle custom service type
    const submitData = {
      ...formData,
      skills: formData.role === 'PROVIDER' ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
      serviceType: formData.serviceType === 'Other' ? formData.customServiceType : formData.serviceType
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    const data = await res.json();
    if (res.ok) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tempSignupData', JSON.stringify(submitData));
        sessionStorage.setItem('serverOtp', data.otp);
      }
      router.push('/verify-registration');
    } else {
      alert(data.message);
    }
  };
=======
  e.preventDefault();
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (res.ok) {
    // Save data temporarily to session
    sessionStorage.setItem('tempSignupData', JSON.stringify(formData));
    sessionStorage.setItem('serverOtp', data.otp);
    router.push('/verify-registration');
  } else {
    alert(data.message);
  }
};
>>>>>>> origin/asha-module1

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={{ color: '#2563eb', textAlign: 'center' }}>Join AshePashe</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" required style={s.input}
            onChange={(e) => setFormData({...formData, name: e.target.value})} />
          
          <input type="email" placeholder="Email Address" required style={s.input}
            onChange={(e) => setFormData({...formData, email: e.target.value})} />

<<<<<<< HEAD
=======
          {/* --- ROLE SELECTION --- */}
>>>>>>> origin/asha-module1
          <label style={s.label}>I want to join as a:</label>
          <select 
            style={s.input} 
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="USER">General User (Looking for services)</option>
            <option value="PROVIDER">Service Provider (Offering services)</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input type="text" placeholder="Location" required style={{ ...s.input, marginBottom: 0 }}
              value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
<<<<<<< HEAD
            <button type="button" onClick={getMyLocation} style={s.locBtn}>📍</button>
          </div>

          {/* PROVIDER-SPECIFIC FIELDS */}
          {formData.role === 'PROVIDER' && (
            <div style={s.providerSection}>
              <h3 style={{ borderBottom: '2px solid #2563eb', paddingBottom: '10px' }}>Provider Information</h3>
              
              <label style={s.label}>Service Type:</label>
              <select 
                style={s.input}
                value={formData.serviceType}
                onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                required
              >
                <option value="">Select Service Type</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="HVAC Technician">HVAC Technician</option>
                <option value="Auto Mechanic">Auto Mechanic</option>
                <option value="General Technician">General Technician</option>
                <option value="Manual Labor Worker">Manual Labor Worker</option>
                <option value="Other">Other (Specify below)</option>
              </select>

              {formData.serviceType === 'Other' && (
                <input 
                  type="text" 
                  placeholder="Please specify your profession/service type" 
                  style={s.input}
                  value={formData.customServiceType || ''}
                  onChange={(e) => setFormData({...formData, customServiceType: e.target.value})}
                  required
                />
              )}

              <label style={s.label}>Professional Skills (comma-separated):</label>
              <input 
                type="text" 
                placeholder="e.g., Emergency Care, First Aid, Surgery" 
                style={s.input}
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
              />

              <label style={s.label}>Work Type:</label>
              <div style={s.radioGroup}>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    value="mobile" 
                    checked={formData.workType === 'mobile'}
                    onChange={(e) => setFormData({...formData, workType: e.target.value})}
                  /> 🚗 Mobile Worker (Travels to locations)
                </label>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    value="shop" 
                    checked={formData.workType === 'shop'}
                    onChange={(e) => setFormData({...formData, workType: e.target.value})}
                  /> 🏢 Shop/Facility (Fixed location)
                </label>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    value="both" 
                    checked={formData.workType === 'both'}
                    onChange={(e) => setFormData({...formData, workType: e.target.value})}
                  /> 🔄 Both (Mobile & Fixed)
                </label>
              </div>

              {(formData.workType === 'shop' || formData.workType === 'both') && (
                <input 
                  type="text" 
                  placeholder="Shop/Facility Address" 
                  style={s.input}
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({...formData, shopAddress: e.target.value})}
                />
              )}

              <input 
                type="tel" 
                placeholder="Contact Phone Number" 
                style={s.input}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          )}

          <input type="password" placeholder="Password" required style={s.input}
            onChange={(e) => setFormData({...formData, password: e.target.value})} />

          <button type="submit" style={s.btn}>Create Account</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <a href="/login" style={s.link}>Login here</a>
        </p>
=======
            <button type="button" onClick={getMyLocation} style={s.locBtn}>
              {loadingLocation ? '...' : '📍'}
            </button>
          </div>

          <input type="password" placeholder="Password" required style={s.input}
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
          
          <button type="submit" style={s.btn}>Create Account</button>
        </form>
        <button onClick={() => router.push('/')} style={s.backBtn}>← Back to Login</button>
>>>>>>> origin/asha-module1
      </div>
    </div>
  );
}

const s = {
<<<<<<< HEAD
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#555',
  },
  locBtn: {
    padding: '0.75rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  btn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  providerSection: {
    backgroundColor: '#f0f7ff',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '15px',
    border: '1px solid #2563eb',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
=======
  container: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card: { background: 'white', padding: '30px', borderRadius: '10px', width: '380px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  label: { fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box', background: '#fff' },
  locBtn: { background: '#e5e7eb', border: '1px solid #ddd', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' },
  btn: { width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  backBtn: { width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }
>>>>>>> origin/asha-module1
};