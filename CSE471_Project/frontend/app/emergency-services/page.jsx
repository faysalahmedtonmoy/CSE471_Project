'use client';

import { useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import HospitalSearch from '../../components/HospitalSearch';
import BackToDashboard from '../../components/BackToDashboard';

export default function EmergencyServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.userId);
    } catch (error) {
      console.error('Token decode error:', error);
      router.push('/login');
      return;
    }

    fetchEmergencyServices();
  }, []);

  const fetchEmergencyServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency-services', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.emergencyServices || []);
      setFilteredServices(data.emergencyServices || []);
    } catch (error) {
      console.error('Error fetching emergency services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (type) => {
    setSelectedType(type);
    if (type === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(s => s.type === type));
    }
  };

  if (loading) return <div className="p-4">Loading emergency services...</div>;

  return (
    <div>
      <Navbar />
      <BackToDashboard />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Emergency Services</h1>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleFilter('all')}
            className={`px-4 py-2 rounded ${selectedType === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            All Services
          </button>
          <button
            onClick={() => handleFilter('ambulance')}
            className={`px-4 py-2 rounded ${selectedType === 'ambulance' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Ambulance
          </button>
          <button
            onClick={() => handleFilter('hospital')}
            className={`px-4 py-2 rounded ${selectedType === 'hospital' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Hospital
          </button>
          <button
            onClick={() => handleFilter('fire-rescue')}
            className={`px-4 py-2 rounded ${selectedType === 'fire-rescue' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Fire & Rescue
          </button>
        </div>

        {filteredServices.length === 0 ? (
          <p className="text-gray-600">No emergency services found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                    service.type === 'ambulance' ? 'bg-yellow-200' :
                    service.type === 'hospital' ? 'bg-blue-200' :
                    'bg-red-200'
                  }`}>
                    {service.type === 'ambulance' ? '🚑' :
                     service.type === 'hospital' ? '🏥' :
                     '🚒'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{service.type.replace('-', ' ')}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{service.location}</p>
                
                {service.address && <p className="text-sm text-gray-600 mb-2">📍 {service.address}</p>}
                
                <p className="text-lg font-bold text-red-600 mb-3">📞 {service.phone}</p>

                {service.availability && (
                  <p className="text-sm bg-green-100 text-green-800 p-2 rounded mb-3">
                    ✓ {service.availability}
                  </p>
                )}

                <button
                  onClick={() => {
                    if (service.phone) {
                      window.location.href = `tel:${service.phone}`;
                    }
                  }}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                >
                  Call Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}