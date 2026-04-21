import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'temporary'], required: true },
    salary: { type: String, default: '' },
    experience: { type: String, default: '' },
    skills: [{ type: String }],
    applications: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
      }
    ],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
export default Job;