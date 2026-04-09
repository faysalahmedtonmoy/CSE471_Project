'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  // Added 'role' with a default value of 'USER'
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    location: '', 
    role: 'USER' 
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

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={{ color: '#2563eb', textAlign: 'center' }}>Join AshePashe</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" required style={s.input}
            onChange={(e) => setFormData({...formData, name: e.target.value})} />
          
          <input type="email" placeholder="Email Address" required style={s.input}
            onChange={(e) => setFormData({...formData, email: e.target.value})} />

          {/* --- ROLE SELECTION --- */}
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
            <button type="button" onClick={getMyLocation} style={s.locBtn}>
              {loadingLocation ? '...' : '📍'}
            </button>
          </div>

          <input type="password" placeholder="Password" required style={s.input}
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
          
          <button type="submit" style={s.btn}>Create Account</button>
        </form>
        <button onClick={() => router.push('/')} style={s.backBtn}>← Back to Login</button>
      </div>
    </div>
  );
}

const s = {
  container: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card: { background: 'white', padding: '30px', borderRadius: '10px', width: '380px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  label: { fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box', background: '#fff' },
  locBtn: { background: '#e5e7eb', border: '1px solid #ddd', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' },
  btn: { width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  backBtn: { width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }
};