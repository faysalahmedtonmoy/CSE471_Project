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
  const [showPostModal, setShowPostModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "", company: "", location: "", jobType: "full-time", salary: "", description: ""
  });

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

  const handlePostJob = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to post a job");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newJob),
      });

      if (res.ok) {
        alert("Job posted successfully!");
        setShowPostModal(false);
        setNewJob({ title: "", company: "", location: "", jobType: "full-time", salary: "", description: "" });
        fetchJobs(); // Refresh the list
      } else {
        const data = await res.json();
        alert(data.message || "Failed to post job");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Job Market</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPostModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow font-semibold"
            >
              + Post a Job
            </button>
            <Link
              href="/user-dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
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
              <option value="educational-institute">Educational Institute</option>
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

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Post a New Job</h2>
              <button 
                onClick={() => setShowPostModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="postJobForm" onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. Senior Plumber" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / Individual *</label>
                    <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} placeholder="Your Name or Company" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} placeholder="e.g. Dhaka" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                    <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={newJob.jobType} onChange={(e) => setNewJob({...newJob, jobType: e.target.value})}>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                      <option value="educational-institute">Educational Institute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary / Pay</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} placeholder="e.g. 15,000 BDT/month" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                  <textarea required rows={4} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} placeholder="Describe the job responsibilities and requirements..."></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 mt-auto">
              <button 
                type="button" 
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="postJobForm"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
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