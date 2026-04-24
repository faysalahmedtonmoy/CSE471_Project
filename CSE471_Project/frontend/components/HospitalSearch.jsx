'use client';

import { useState, useEffect } from 'react';
// import styles from '@/styles/HospitalSearch.module.css'; // Removed unused import

export default function HospitalSearch() {
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [skill, setSkill] = useState('');
  const [bookingProvider, setBookingProvider] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');

  useEffect(() => {
    // No longer need to get current location automatically
  }, []);

  const searchServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (skill) params.append('skill', skill);
      if (selectedType !== 'All') params.append('serviceType', selectedType);
      if (location) params.append('location', location);

      const res = await fetch(`/api/providers?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to search providers');
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to search providers. Please try again.');
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!skill && !selectedType && !location) {
      setError('Please enter at least one search criteria (skill, service type, or location)');
      return;
    }
    searchServices();
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  const startBooking = (provider) => {
    setBookingProvider(provider);
    setAppointmentDate('');
    setAppointmentTime('');
    setBookingDescription('');
  };

  const submitBooking = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return alert('Please log in to book a service.');
    }
    if (!bookingProvider || !appointmentDate || !appointmentTime) {
      return alert('Please select date and time for your appointment.');
    }

    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: bookingProvider._id,
          serviceType: bookingProvider.type || bookingProvider.serviceType || 'Service',
          appointmentDate: appointmentDateTime.toISOString(),
          description: bookingDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return alert(data.message || 'Unable to book service.');
      }
      alert('Booking created successfully. Check Service Status Tracking for updates.');
      
      // Notify the provider via socket
      import('socket.io-client').then(({ io }) => {
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
          auth: { token }
        });
        socket.emit('notify_new_service_request', { providerId: bookingProvider._id });
        setTimeout(() => socket.disconnect(), 1000);
      });

      setBookingProvider(null);
      setAppointmentDate('');
      setAppointmentTime('');
      setBookingDescription('');
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Service Provider Search</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Find verified professionals quickly and easily.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Service Type</label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={handleTypeChange}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
              >
                <option value="All">All Services</option>
                <option value="Mechanic">🚗 Mechanic</option>
                <option value="Painter">🎨 Painter</option>
                <option value="Electrician">⚡ Electrician</option>
                <option value="Plumber">💧 Plumber</option>
                <option value="Carpenter">🔨 Carpenter</option>
                <option value="Cleaner">🧹 Cleaner</option>
                <option value="Gardener">🌿 Gardener</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Skill (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input
                type="text"
                placeholder="e.g., car repair, painting"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <label className="text-sm font-semibold text-gray-700 block md:hidden">Location</label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </span>
                <input
                  type="text"
                  placeholder="City or Area"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <button 
                onClick={handleSearch} 
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:bg-green-400 flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            <svg className="animate-spin w-12 h-12 text-green-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-xl font-medium text-gray-600">Searching for providers...</p>
          </div>
        )}

        {!loading && results.length === 0 && (skill || selectedType !== 'All' || location) && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <p className="text-xl font-medium text-gray-600">No providers found</p>
            <p className="text-gray-400 mt-1">Try adjusting your search criteria</p>
          </div>
        )}

        {results.map((service, index) => (
          <div key={service._id || index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl shadow-sm">
                  {service.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{service.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-100">
                      {service.serviceType || 'General'}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${service.isProviderVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {service.isProviderVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>
              {service.ratings > 0 && (
                <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  <span className="font-bold text-sm">{service.ratings.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px', flex:1}}>
              {service.skills && service.skills.length > 0 && (
                <div style={{display:'flex', alignItems:'flex-start', gap:'12px', color:'#4b5563', fontSize:'14px'}}>
                  <svg width="20" height="20" style={{flexShrink:0, color:'#9ca3af', marginTop:'2px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <div>
                    <span style={{display:'block', fontWeight:600, color:'#1f2937'}}>Skills</span>
                    <span style={{color:'#6b7280'}}>{service.skills.join(', ')}</span>
                  </div>
                </div>
              )}
              
              {service.shopAddress && (
                <div style={{display:'flex', alignItems:'flex-start', gap:'12px', color:'#4b5563', fontSize:'14px'}}>
                  <svg width="20" height="20" style={{flexShrink:0, color:'#9ca3af', marginTop:'2px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <div>
                    <span style={{display:'block', fontWeight:600, color:'#1f2937'}}>Address</span>
                    <span style={{color:'#6b7280'}}>{service.shopAddress}</span>
                  </div>
                </div>
              )}

              {service.workType && (
                <div style={{display:'flex', alignItems:'flex-start', gap:'12px', color:'#4b5563', fontSize:'14px'}}>
                  <svg width="20" height="20" style={{flexShrink:0, color:'#9ca3af', marginTop:'2px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                  <div>
                    <span style={{display:'block', fontWeight:600, color:'#1f2937'}}>Work Type</span>
                    <span style={{color:'#6b7280'}}>{service.workType}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'auto'}}>
              <button 
                onClick={() => service.phone ? window.location.href = `tel:${service.phone}` : alert('Phone number not available')}
                style={{gridColumn:'span 1', padding:'10px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'14px', fontWeight:500, color:'#374151'}}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                Call
              </button>
              <button 
                onClick={() => window.location.href = `/chat?provider=${service._id}`}
                style={{gridColumn:'span 1', padding:'10px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'14px', fontWeight:500, color:'#15803d'}}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                Chat
              </button>
              <button 
                onClick={() => startBooking(service)}
                style={{gridColumn:'span 2', padding:'12px', marginTop:'4px', background:'#16a34a', border:'none', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontSize:'14px', fontWeight:600, color:'white'}}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-green-600 px-6 py-6 text-white relative">
              <button 
                onClick={() => setBookingProvider(null)}
                className="absolute top-6 right-6 text-green-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h2 className="text-2xl font-bold">Book Appointment</h2>
              <p className="text-green-100 mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                {bookingProvider.name}
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">Date</label>
                  <input 
                    type="date" 
                    value={appointmentDate} 
                    onChange={(e) => setAppointmentDate(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">Time</label>
                  <input 
                    type="time" 
                    value={appointmentTime} 
                    onChange={(e) => setAppointmentTime(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 block">Describe your request</label>
                <textarea 
                  value={bookingDescription} 
                  onChange={(e) => setBookingDescription(e.target.value)} 
                  placeholder="Tell us what you need help with..."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none" 
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setBookingProvider(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitBooking}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
