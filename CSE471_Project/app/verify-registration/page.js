'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OTPForm() {
  const [inputOtp, setInputOtp] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data passed from the Register page - only access sessionStorage on client side
  const [signupData, setSignupData] = useState({});
  const [serverOtp, setServerOtp] = useState('');

  // Use useEffect to safely access sessionStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = JSON.parse(sessionStorage.getItem('tempSignupData') || '{}');
      const otp = sessionStorage.getItem('serverOtp') || '';
      setSignupData(data);
      setServerOtp(otp);
    }
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (inputOtp === serverOtp) {
      // OTP matches! Verify the email in database
      const res = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email }),
      });

      const data = await res.json();
      if (res.ok) {
        // Save token and redirect
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('userName', data.user.name);
          sessionStorage.clear(); // Clean up
        }
        
        // Redirect based on role
        if (data.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else if (data.user.role === 'PROVIDER') {
          window.location.href = '/provider-dashboard';
        } else {
          window.location.href = '/user-dashboard';
        }
      } else {
        alert(data.message || "Verification failed. Please try again.");
      }
    } else {
      alert("Invalid OTP code.");
    }
  };

  return (
    <div style={s.container}>
      <h2>Verify Your Email</h2>
      <p>Enter the 6-digit code sent to your email</p>
      <form onSubmit={handleVerify} style={s.card}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={inputOtp}
          onChange={(e) => setInputOtp(e.target.value)}
          style={s.input}
          maxLength="6"
          required
        />
        <button type="submit" style={s.btn}>Verify & Register</button>
      </form>
    </div>
  );
}

export default function VerifyRegPage() {
  return (
    <Suspense>
      <OTPForm />
    </Suspense>
  );
}

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    textAlign: 'center',
    letterSpacing: '2px',
  },
  btn: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};