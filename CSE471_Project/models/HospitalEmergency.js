import mongoose from "mongoose";

const HospitalEmergencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Hospital", "Ambulance", "Fire Service"],
      required: true,
    },
    address: String,
    phone: String,
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    city: String,
    district: String,
    operatingHours: String,
    emergencyServices: [String], // e.g., ["ICU", "Emergency", "Burn Unit"]
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

HospitalEmergencySchema.index({ latitude: "2dsphere", longitude: "2dsphere" });

export default mongoose.models.HospitalEmergency ||
  mongoose.model("HospitalEmergency", HospitalEmergencySchema);
