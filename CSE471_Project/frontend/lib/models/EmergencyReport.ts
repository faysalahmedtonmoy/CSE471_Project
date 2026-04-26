import mongoose from 'mongoose';

const EmergencyReportSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    clerkUserId: {
      type: String,
      required: true,
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    imageUrl: { 
      type: String, 
      default: null 
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

const EmergencyReport = mongoose.models.EmergencyReport || mongoose.model('EmergencyReport', EmergencyReportSchema);
export default EmergencyReport;
