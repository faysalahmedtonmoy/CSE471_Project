'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyForm() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleVerify = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } else {
      alert(data.message);
    }
  };

  return (
    <div style={s.container}>
      <form onSubmit={handleVerify} style={s.card}>
        <h2 style={{ color: '#2563eb' }}>Verify Identity</h2>
        <p>Enter the code sent to {email}</p>
        <input 
          type="text" placeholder="000000" maxLength="6" 
          style={s.input} onChange={(e) => setCode(e.target.value)} 
        />
        <button type="submit" style={s.btn}>Verify</button>
      </form>
    </div>
  );
}

// Next.js requires Suspense for useSearchParams
export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}

const s = {
  container: { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card: { background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center', width: '300px' },
  input: { width: '100%', padding: '10px', marginBottom: '15px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '5px' },
  btn: { width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};