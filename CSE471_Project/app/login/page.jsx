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
      } else {
        // Store token and redirect based on role
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('userName', data.user.name);
        }

        // Redirect to appropriate dashboard based on role
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (data.user.role === 'PROVIDER') {
          router.push('/provider-dashboard');
        } else {
          router.push('/user-dashboard');
        }
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
          Don't have an account? <a href="/register" style={s.link}>Register here</a>
        </p>
      </div>
    </div>
  );
}

const s = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#2563eb',
    fontSize: '2rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#555',
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
    marginBottom: '1rem',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
};