// Script to seed sample hospital and emergency data
// Run: node app/api/services/seed.js

const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ashepashe');
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
  }
};

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

const HospitalEmergency = mongoose.models.HospitalEmergency ||
  mongoose.model("HospitalEmergency", HospitalEmergencySchema);

const sampleData = [
  // Hospitals
  {
    name: 'Bangladesh Medical College Hospital',
    type: 'Hospital',
    address: 'Dhanmondi, Dhaka',
    phone: '09611111111',
    latitude: 23.7600,
    longitude: 90.3711,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Emergency', 'ICU', 'Trauma Center'],
    rating: 4.8,
  },
  {
    name: 'National Heart Foundation',
    type: 'Hospital',
    address: 'Mirpur, Dhaka',
    phone: '09600000000',
    latitude: 23.8241,
    longitude: 90.3659,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Cardiology', 'Emergency'],
    rating: 4.9,
  },
  {
    name: 'Labaid Hospital',
    type: 'Hospital',
    address: 'Gulshan, Dhaka',
    phone: '09678888888',
    latitude: 23.7840,
    longitude: 90.4179,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Emergency', 'ICU', 'Surgery'],
    rating: 4.7,
  },
  // Ambulances
  {
    name: '999 Ambulance Service',
    type: 'Ambulance',
    address: 'Various locations, Dhaka',
    phone: '09999999999',
    latitude: 23.8103,
    longitude: 90.4125,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Emergency Transport', 'Critical Care'],
    rating: 4.6,
  },
  {
    name: 'Fast Ambulance',
    type: 'Ambulance',
    address: 'Motijheel, Dhaka',
    phone: '09888888888',
    latitude: 23.7635,
    longitude: 90.3953,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Emergency Transport'],
    rating: 4.5,
  },
  // Fire Services
  {
    name: 'Dhaka Fire Service - Main Station',
    type: 'Fire Service',
    address: 'Tempi, Dhaka',
    phone: '09911111111',
    latitude: 23.7660,
    longitude: 90.3700,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Fire Control', 'Rescue', 'Medical Aid'],
    rating: 4.4,
  },
  {
    name: 'Dhaka Fire Service - South Station',
    type: 'Fire Service',
    address: 'South Motijheel, Dhaka',
    phone: '09922222222',
    latitude: 23.7500,
    longitude: 90.3850,
    city: 'Dhaka',
    district: 'Dhaka',
    operatingHours: '24/7',
    emergencyServices: ['Fire Control', 'Rescue'],
    rating: 4.3,
  },
];

async function seedData() {
  try {
    await connectDB();

    // Clear existing data
    await HospitalEmergency.deleteMany({});

    // Insert sample data
    await HospitalEmergency.insertMany(sampleData);

    console.log('✅ Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedData();
