import mongoose from "mongoose";

const InstituteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['school', 'college', 'university', 'training-center'], required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    programs: [{ type: String }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Institute = mongoose.models.Institute || mongoose.model('Institute', InstituteSchema);
export default Institute;