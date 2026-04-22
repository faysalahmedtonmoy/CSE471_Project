"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    fetchInstitutes();
  }, [filters]);

  const fetchInstitutes = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);
      if (filters.location) params.append("location", filters.location);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/institutes?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setInstitutes(data.institutes || data);
    } catch (error) {
      console.error("Error fetching institutes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to submit a review");
      return;
    }

    try {
      const res = await fetch(`/api/institutes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...review,
          instituteId: selectedInstitute._id,
        }),
      });
      if (res.ok) {
        alert("Review submitted!");
        setShowReviewModal(false);
        fetchInstitutes();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const openReviewModal = (institute) => {
    setSelectedInstitute(institute);
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Educational Institutes</h1>
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
              placeholder="Search institutes..."
              className="p-2 border rounded-lg"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="p-2 border rounded-lg"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="university">University</option>
              <option value="training-center">Training Center</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              className="p-2 border rounded-lg"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>

        {/* Institute Listings */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : institutes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No institutes found</div>
        ) : (
          <div className="grid gap-4">
            {institutes.map((institute) => (
              <InstituteCard 
                key={institute._id} 
                institute={institute} 
                onRate={openReviewModal} 
              />
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                Rate {selectedInstitute?.name}
              </h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Rating</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={review.rating}
                    onChange={(e) =>
                      setReview({ ...review, rating: parseInt(e.target.value) })
                    }
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {"⭐".repeat(r)} ({r} stars)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Comment</label>
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    rows="3"
                    value={review.comment}
                    onChange={(e) =>
                      setReview({ ...review, comment: e.target.value })
                    }
                    placeholder="Share your experience..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Institute Card Component with Save functionality
function InstituteCard({ institute, onRate }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to save institutes");
      return;
    }

    try {
      const res = await fetch("/api/saved-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: institute._id,
          listingType: "institutes",
        }),
      });
      const data = await res.json();
      setIsSaved(data.saved);
      alert(data.saved ? "Institute saved!" : "Removed from saved");
    } catch (error) {
      console.error("Error saving institute:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {institute.name}
            </h2>
            <span
              className={`px-2 py-1 rounded text-xs ${
                institute.isVerified
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {institute.isVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <p className="text-gray-600">{institute.type}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>📍 {institute.location}</span>
            {institute.rating && (
              <span>⭐ {institute.rating.toFixed(1)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            className={`px-3 py-1 rounded-lg text-sm ${
              isSaved
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isSaved ? "✓ Saved" : "♡ Save"}
          </button>
          {institute.phone && (
            <a
              href={`tel:${institute.phone}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              📞 Call
            </a>
          )}
          <button
            onClick={() => onRate(institute)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ⭐ Rate
          </button>
        </div>
      </div>
      {institute.description && (
        <p className="mt-3 text-gray-600">{institute.description}</p>
      )}
      {institute.programs && institute.programs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {institute.programs.map((program, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
            >
              {program}
            </span>
          ))}
        </div>
      )}
      {/* Reviews Section */}
      {institute.reviews && institute.reviews.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <h4 className="font-medium text-gray-700 mb-2">Recent Reviews</h4>
          <div className="space-y-2">
            {institute.reviews.slice(0, 3).map((rev, idx) => (
              <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">{"⭐".repeat(rev.rating)}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}