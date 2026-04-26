import mongoose from 'mongoose';

/**
 * Shared User model for Next.js API routes.
 * Mirrors backend/models/User.js exactly.
 * Uses mongoose.models cache to avoid re-compiling on hot reloads.
 */
const UserSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true },
    email:              { type: String, required: true, unique: true },
    password:           { type: String, default: null },
    location:           { type: String, default: '' },
    role:               { type: String, enum: ['USER', 'PROVIDER', 'ADMIN'], default: 'USER' },
    isVerified:         { type: Boolean, default: false },
    verificationCode:   { type: String, default: null },
    otpExpiresAt:       { type: Date, default: null },
    isProviderVerified: { type: Boolean, default: false },
    clerkUserId:        { type: String, default: null },
    skills:             { type: [String], default: [] },
    workType:           { type: String, enum: ['mobile', 'shop', 'both'], default: 'shop' },
    shopAddress:        { type: String, default: null },
    phone:              { type: String, default: null },
    serviceType:        { type: String, default: null },
    ratings:            { type: Number, default: 0 },
    reviewCount:        { type: Number, default: 0 },
    savedListings: {
      toLet:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
      jobs:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
      institutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Institute' }],
      services:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
