'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OTPForm() {
  const [inputOtp, setInputOtp] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get data passed from the Register page
  const signupData = JSON.parse(sessionStorage.getItem('tempSignupData'));
  const serverOtp = sessionStorage.getItem('serverOtp');

  const handleVerify = async (e) => {
  e.preventDefault();

  // 1. Get the OTP the server sent (stored in SessionStorage during Register)
  const savedOtp = sessionStorage.getItem('serverOtp');
  const userData = JSON.parse(sessionStorage.getItem('tempSignupData'));

  if (inputOtp === savedOtp) {
    // 2. OTP matches! Now save to Database
    const res = await fetch('/api/auth/complete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (res.ok) {
      alert("Registration Successful! Redirecting to Login...");
      sessionStorage.clear(); // Clean up
      window.location.href = "/"; // Return to Login Page
    } else {
      alert("Database error. Please try again.");
    }
  } else {
    alert("Invalid OTP code.");
  }
};

  return (
    <div style={s.container}>
      <form onSubmit={handleVerify} style={s.card}>
        <h2>Enter OTP</h2>
        <p>Check your email for the 6-digit code</p>
        <input 
          type="text" maxLength="6" style={s.input} 
          onChange={(e) => setInputOtp(e.target.value)} 
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

const s = { /* reuse your previous styles here */ };