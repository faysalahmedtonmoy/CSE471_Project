const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ashepashe';
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String,
  location: String,
  role: { type: String, enum: ['USER', 'PROVIDER', 'ADMIN'], default: 'USER' },
  isVerified: { type: Boolean, default: true },
  isProviderVerified: { type: Boolean, default: false }, // Admin verification for providers
  skills: [String],
  workType: { type: String, enum: ['mobile', 'shop', 'both'] },
  shopAddress: String,
  phone: String,
  serviceType: { type: String },
  ratings: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
});

const User = mongoose.model('User', UserSchema);

const HospitalEmergencySchema = new mongoose.Schema({
  name: String,
  type: { type: String },
  address: String,
  phone: String,
  latitude: Number,
  longitude: Number,
  rating: { type: Number, default: 4.5 },
  emergencyServices: [String],
});

const HospitalEmergency = mongoose.model('HospitalEmergency', HospitalEmergencySchema);

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    // Clear existing data
    try {
      await User.collection.drop();
      await HospitalEmergency.collection.drop();
    } catch (e) {
      // Collections might not exist, that's okay
    }
    console.log('🗑️  Cleared existing data');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        name: 'John User',
        email: 'user@example.com',
        password: hashedPassword,
        location: 'Dhaka, Bangladesh',
        role: 'USER',
        isVerified: true,
      },
      {
        name: 'Ahmed Electrician',
        email: 'hospital@example.com',
        password: hashedPassword,
        location: 'Dhaka, Bangladesh',
        role: 'PROVIDER',
        isVerified: true,
        isProviderVerified: true, // Verified provider
        skills: ['Electrical Wiring', 'Circuit Repair', 'Installation'],
        workType: 'mobile',
        phone: '01700000001',
        serviceType: 'Electrician',
        ratings: 4.8,
        reviewCount: 150,
      },
      {
        name: 'Rahman Plumbing',
        email: 'ambulance@example.com',
        password: hashedPassword,
        location: 'Dhaka, Bangladesh',
        role: 'PROVIDER',
        isVerified: true,
        isProviderVerified: false, // Unverified provider
        skills: ['Pipe Repair', 'Leak Fixing', 'Installation'],
        workType: 'mobile',
        phone: '01700000002',
        serviceType: 'Plumber',
        ratings: 4.6,
        reviewCount: 320,
      },
      {
        name: 'Carpenter Karim',
        email: 'fire@example.com',
        password: hashedPassword,
        location: 'Dhaka, Bangladesh',
        role: 'PROVIDER',
        isVerified: true,
        isProviderVerified: true, // Verified provider
        skills: ['Woodworking', 'Furniture Making', 'Repairs'],
        workType: 'shop',
        shopAddress: '456 Wood Street, Dhaka',
        phone: '01700000003',
        serviceType: 'Carpenter',
        ratings: 4.9,
        reviewCount: 200,
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        location: 'Dhaka, Bangladesh',
        role: 'ADMIN',
        isVerified: true,
      },
    ];

    await User.insertMany(users);
    console.log('✅ Users seeded');

    // Seed Hospital/Emergency Services
    const services = [
      {
        name: 'Ahmed Electrical Services',
        type: 'Electrician',
        address: '123 Power Street, Dhaka',
        phone: '01700000001',
        latitude: 23.8103,
        longitude: 90.4441,
        rating: 4.8,
        emergencyServices: ['Wiring', 'Circuit Repair', 'Installation'],
      },
      {
        name: 'Rahman Plumbing Solutions',
        type: 'Plumber',
        address: '456 Pipe Lane, Dhaka',
        phone: '01700000011',
        latitude: 23.7960,
        longitude: 90.4188,
        rating: 4.7,
        emergencyServices: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning'],
      },
      {
        name: 'Karim Carpentry Works',
        type: 'Carpenter',
        address: '789 Wood Avenue, Dhaka',
        phone: '01700000012',
        latitude: 23.8076,
        longitude: 90.3900,
        rating: 4.9,
        emergencyServices: ['Furniture Making', 'Wood Repairs', 'Custom Work'],
      },
      {
        name: 'Hassan HVAC Services',
        type: 'HVAC Technician',
        address: '100 Climate Road, Dhaka',
        phone: '01700000002',
        latitude: 23.7333,
        longitude: 90.3667,
        rating: 4.6,
        emergencyServices: ['AC Repair', 'Heating Systems', 'Ventilation'],
      },
      {
        name: 'AutoFix Mechanics',
        type: 'Auto Mechanic',
        address: '200 Engine Street, Dhaka',
        phone: '01700000021',
        latitude: 23.8200,
        longitude: 90.4300,
        rating: 4.5,
        emergencyServices: ['Engine Repair', 'Brake Service', 'Tire Change'],
      },
      {
        name: 'TechPro Solutions',
        type: 'General Technician',
        address: '456 Tech Boulevard, Dhaka',
        phone: '01700000003',
        latitude: 23.8129,
        longitude: 90.4242,
        rating: 4.9,
        emergencyServices: ['Device Repair', 'Installation', 'Maintenance'],
      },
      {
        name: 'LaborForce Workers',
        type: 'Manual Labor Worker',
        address: '789 Work Lane, Dhaka',
        phone: '01700000031',
        latitude: 23.7500,
        longitude: 90.3750,
        rating: 4.7,
        emergencyServices: ['Moving Help', 'Heavy Lifting', 'General Labor'],
      },
    ];

    await HospitalEmergency.insertMany(services);
    console.log('✅ Hospital/Emergency Services seeded');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User Account:');
    console.log('  Email: user@example.com');
    console.log('  Password: password123');
    console.log('  Role: USER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Provider Account (Electrician):');
    console.log('  Email: hospital@example.com');
    console.log('  Password: password123');
    console.log('  Role: PROVIDER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Account:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    console.log('  Role: ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
