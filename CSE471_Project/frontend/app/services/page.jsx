'use client';

import { useState, useEffect } from 'react';
import HospitalSearch from '../../components/HospitalSearch';

export default function ServicesPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <HospitalSearch />
    </div>
  );
}
