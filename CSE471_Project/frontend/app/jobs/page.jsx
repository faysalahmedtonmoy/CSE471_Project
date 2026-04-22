"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    jobType: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.location) params.append("location", filters.location);
      if (filters.jobType) params.append("jobType", filters.jobType);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/jobs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setJobs(data.jobs || data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to apply");
      return;
    }
    // Application logic - job applications are handled via service requests or messaging
    alert("Use the chat button to contact the employer!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Job Market</h1>
          <Link
            href="/user-dashboard"
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search jobs..."
              className="p-2 border rounded-lg"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <input
              type="text"
              placeholder="Location"
              className="p-2 border rounded-lg"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
            <select
              className="p-2 border rounded-lg"
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No jobs found</div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} onApply={handleApply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Job Card Component with Save functionality
function JobCard({ job, onApply }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to save jobs');
      return;
    }

    try {
      const res = await fetch('/api/saved-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId: job._id,
          listingType: 'jobs'
        })
      });
      const data = await res.json();
      setIsSaved(data.saved);
      alert(data.saved ? 'Job saved!' : 'Removed from saved');
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
          <p className="text-gray-600">{job.company}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>📍 {job.location}</span>
            <span>💼 {job.jobType}</span>
            {job.salary && <span>💰 {job.salary}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              job.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {job.status}
          </span>
          <button
            onClick={handleSave}
            className={`px-3 py-1 rounded-lg text-sm ${
              isSaved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isSaved ? "✓ Saved" : "♡ Save"}
          </button>
          <button
            onClick={() => onApply(job._id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Contact Employer
          </button>
        </div>
      </div>
      <p className="mt-3 text-gray-600 line-clamp-2">{job.description}</p>
      {job.skills && job.skills.length > 0 && (
        <div className="mt-3 flex gap-2">
          {job.skills.map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-sm rounded">
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}