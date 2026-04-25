import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  location: { type: String, default: '' },
  role: {
    type: String,
    enum: ['USER', 'PROVIDER', 'ADMIN'],
    default: 'USER'
  },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  isProviderVerified: { type: Boolean, default: false }, // Admin verification for providers
  clerkUserId: { type: String, default: null }, // Track Clerk ID
  
  // Provider-specific fields
  skills: { type: [String], default: [] },
  workType: { 
    type: String, 
    enum: ['mobile', 'shop', 'both'],
    default: 'shop'
  },
  shopAddress: { type: String, default: null },
  phone: { type: String, default: null },
  serviceType: { 
    type: String,
    default: null
  },
  ratings: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  
  // Saved listings for profile management
  savedListings: {
    toLet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    institutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Institute' }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;