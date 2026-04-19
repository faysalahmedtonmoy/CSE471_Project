'use client';

import { useState, useEffect } from 'react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [jobFilters, setJobFilters] = useState({ keyword: '', location: '', employmentType: '' });
  const [instituteFilters, setInstituteFilters] = useState({ keyword: '', location: '', type: '' });
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '', employmentType: 'Full-Time', description: '', salaryRange: '', contactEmail: '', contactPhone: '' });
  const [instituteForm, setInstituteForm] = useState({ name: '', instituteType: 'School', location: '', courses: '', contactEmail: '', contactPhone: '', website: '' });
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchInstitutes();
  }, []);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const params = new URLSearchParams();
    Object.entries(jobFilters).forEach(([key, value]) => value && params.set(key, value));
    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoadingJobs(false);
  };

  const fetchInstitutes = async () => {
    setLoadingInstitutes(true);
    const params = new URLSearchParams();
    Object.entries(instituteFilters).forEach(([key, value]) => value && params.set(key, value));
    const res = await fetch(`/api/institutes?${params.toString()}`);
    const data = await res.json();
    setInstitutes(data.institutes || []);
    setLoadingInstitutes(false);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobForm),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Job posted successfully');
      setJobForm({ title: '', company: '', location: '', employmentType: 'Full-Time', description: '', salaryRange: '', contactEmail: '', contactPhone: '' });
      fetchJobs();
    } else {
      alert(data.message || 'Unable to post job');
    }
  };

  const handleInstituteSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/institutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...instituteForm, courses: instituteForm.courses.split(',').map((item) => item.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Institute added successfully');
      setInstituteForm({ name: '', instituteType: 'School', location: '', courses: '', contactEmail: '', contactPhone: '', website: '' });
      fetchInstitutes();
    } else {
      alert(data.message || 'Unable to add institute');
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>💼 Jobs & Education</h1>
      <div style={gridStyle}>
        <section style={sectionStyle}>
          <h2>Job Market</h2>
          <form onSubmit={(e) => { e.preventDefault(); fetchJobs(); }} style={formStyle}>
            <input style={inputStyle} placeholder="Keyword" value={jobFilters.keyword} onChange={(e) => setJobFilters({ ...jobFilters, keyword: e.target.value })} />
            <input style={inputStyle} placeholder="Location" value={jobFilters.location} onChange={(e) => setJobFilters({ ...jobFilters, location: e.target.value })} />
            <select style={inputStyle} value={jobFilters.employmentType} onChange={(e) => setJobFilters({ ...jobFilters, employmentType: e.target.value })}>
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <button type="button" style={buttonStyle} onClick={fetchJobs}>Search Jobs</button>
          </form>

          <div style={listStyle}>
            {loadingJobs ? <p>Loading jobs...</p> : jobs.length === 0 ? <p>No jobs found.</p> : jobs.map((job) => (
              <div key={job._id} style={cardStyle}>
                <h3>{job.title}</h3>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Type:</strong> {job.employmentType}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p>{job.description}</p>
                {job.salaryRange && <p><strong>Salary:</strong> {job.salaryRange}</p>}
                {job.contactEmail && <p><strong>Email:</strong> {job.contactEmail}</p>}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '20px' }}>Post a Job</h3>
          <form onSubmit={handleJobSubmit} style={formStyle}>
            <input style={inputStyle} placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
            <input style={inputStyle} placeholder="Company" value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} required />
            <input style={inputStyle} placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required />
            <select style={inputStyle} value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <textarea style={textareaStyle} placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required />
            <input style={inputStyle} placeholder="Salary Range" value={jobForm.salaryRange} onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} />
            <input style={inputStyle} type="email" placeholder="Contact Email" value={jobForm.contactEmail} onChange={(e) => setJobForm({ ...jobForm, contactEmail: e.target.value })} />
            <input style={inputStyle} placeholder="Contact Phone" value={jobForm.contactPhone} onChange={(e) => setJobForm({ ...jobForm, contactPhone: e.target.value })} />
            <button style={buttonStyle}>Post Job</button>
          </form>
        </section>

        <section style={sectionStyle}>
          <h2>Educational Institutes</h2>
          <form onSubmit={(e) => { e.preventDefault(); fetchInstitutes(); }} style={formStyle}>
            <input style={inputStyle} placeholder="Keyword" value={instituteFilters.keyword} onChange={(e) => setInstituteFilters({ ...instituteFilters, keyword: e.target.value })} />
            <input style={inputStyle} placeholder="Location" value={instituteFilters.location} onChange={(e) => setInstituteFilters({ ...instituteFilters, location: e.target.value })} />
            <select style={inputStyle} value={instituteFilters.type} onChange={(e) => setInstituteFilters({ ...instituteFilters, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="School">School</option>
              <option value="College">College</option>
              <option value="University">University</option>
              <option value="Training Center">Training Center</option>
            </select>
            <button type="button" style={buttonStyle} onClick={fetchInstitutes}>Search Institutes</button>
          </form>

          <div style={listStyle}>
            {loadingInstitutes ? <p>Loading institutes...</p> : institutes.length === 0 ? <p>No institutes found.</p> : institutes.map((institute) => (
              <div key={institute._id} style={cardStyle}>
                <h3>{institute.name}</h3>
                <p><strong>Type:</strong> {institute.instituteType}</p>
                <p><strong>Location:</strong> {institute.location}</p>
                {institute.courses?.length > 0 && <p><strong>Courses:</strong> {institute.courses.join(', ')}</p>}
                {institute.contactEmail && <p><strong>Email:</strong> {institute.contactEmail}</p>}
                {institute.contactPhone && <p><strong>Phone:</strong> {institute.contactPhone}</p>}
                {institute.website && <p><strong>Website:</strong> {institute.website}</p>}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '20px' }}>Add an Institute</h3>
          <form onSubmit={handleInstituteSubmit} style={formStyle}>
            <input style={inputStyle} placeholder="Institute name" value={instituteForm.name} onChange={(e) => setInstituteForm({ ...instituteForm, name: e.target.value })} required />
            <select style={inputStyle} value={instituteForm.instituteType} onChange={(e) => setInstituteForm({ ...instituteForm, instituteType: e.target.value })}>
              <option value="School">School</option>
              <option value="College">College</option>
              <option value="University">University</option>
              <option value="Training Center">Training Center</option>
            </select>
            <input style={inputStyle} placeholder="Location" value={instituteForm.location} onChange={(e) => setInstituteForm({ ...instituteForm, location: e.target.value })} required />
            <input style={inputStyle} placeholder="Courses (comma separated)" value={instituteForm.courses} onChange={(e) => setInstituteForm({ ...instituteForm, courses: e.target.value })} />
            <input style={inputStyle} type="email" placeholder="Contact Email" value={instituteForm.contactEmail} onChange={(e) => setInstituteForm({ ...instituteForm, contactEmail: e.target.value })} />
            <input style={inputStyle} placeholder="Contact Phone" value={instituteForm.contactPhone} onChange={(e) => setInstituteForm({ ...instituteForm, contactPhone: e.target.value })} />
            <input style={inputStyle} placeholder="Website" value={instituteForm.website} onChange={(e) => setInstituteForm({ ...instituteForm, website: e.target.value })} />
            <button style={buttonStyle}>Add Institute</button>
          </form>
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: '30px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const titleStyle = {
  fontSize: '34px',
  marginBottom: '20px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
};

const sectionStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

const formStyle = {
  display: 'grid',
  gap: '15px',
  marginBottom: '20px',
};

const inputStyle = {
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
};

const buttonStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
};

const listStyle = {
  display: 'grid',
  gap: '15px',
};

const cardStyle = {
  backgroundColor: '#f7fafc',
  borderRadius: '10px',
  padding: '16px',
  boxShadow: '0 1px 5px rgba(0,0,0,0.08)',
};
