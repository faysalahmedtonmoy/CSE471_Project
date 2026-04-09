const mongoose = require('mongoose'); // <--- ADD THIS LINE

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
  verificationCode: { type: String, default: null } 
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);