import mongoose from "mongoose";

const InstituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    instituteType: {
      type: String,
      enum: ["School", "College", "University", "Training Center"],
      default: "School",
    },
    location: { type: String, required: true },
    courses: { type: [String], default: [] },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },
    website: { type: String, default: null },
  },
  { timestamps: true }
);

const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema);
export default Institute;
