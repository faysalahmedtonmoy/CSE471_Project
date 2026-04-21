import mongoose from "mongoose";

const ServiceRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, required: true },
    description: { type: String, default: '' },
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'in progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    rating: { type: Number, min: 0, max: 5, default: null },
    review: { type: String, default: '' },
  },
  { timestamps: true }
);

const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', ServiceRequestSchema);
export default ServiceRequest;