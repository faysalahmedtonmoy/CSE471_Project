'use client';

import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function BackToDashboard() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const decoded = jwtDecode(token);
      const role = decoded.role;

      switch (role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'PROVIDER':
          router.push('/provider-dashboard');
          break;
        default:
          router.push('/user-dashboard');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleBackToDashboard}
      className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
    >
      <span>←</span>
      <span>Back to Dashboard</span>
    </button>
  );
}