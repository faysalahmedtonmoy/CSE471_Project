import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  role: {
    type: String,
    enum: ['USER', 'PROVIDER', 'ADMIN'],
    default: 'USER'
  },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  isProviderVerified: { type: Boolean, default: false }, // Admin verification for providers
  
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
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;