'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // Default to USER
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }), // Send role to backend
    });

    const data = await res.json();

    if (res.ok) {
      if (data.requiresCode) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    } else {
      alert(data.message || 'Login failed');
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h1 style={s.title}>AshePashe</h1>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" required style={s.input}
            onChange={(e) => setEmail(e.target.value)} />
          
          <input type="password" placeholder="Password" required style={s.input}
            onChange={(e) => setPassword(e.target.value)} />

          <label style={s.label}>Login as:</label>
          <select style={s.input} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">User</option>
            <option value="PROVIDER">Provider</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button type="submit" style={s.btn}>Sign In</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          New here? <a href="/register" style={{ color: '#2563eb' }}>Register</a>
        </p>
      </div>
    </div>
  );
}

const s = {
  container: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card: { background: 'white', padding: '30px', borderRadius: '10px', width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  title: { color: '#2563eb', textAlign: 'center', marginBottom: '20px' },
  label: { fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};