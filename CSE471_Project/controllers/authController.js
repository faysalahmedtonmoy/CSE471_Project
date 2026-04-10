<<<<<<< HEAD
const mongoose = require('mongoose');
const UserModule = require('../models/User');
const User = UserModule.default || UserModule;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Helper function to connect to DB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Error:", error);
    throw error;
  }
};

// Setup Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// REGISTER (Sends OTP)
exports.register = async (req, res) => {
  try {
    await connectDB();
    const { name, email, password, location, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
=======
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// 1. Setup Email Transporter (Use Gmail or Mailtrap)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your App Password
  }
});

// STEP 1: REGISTER (Sends OTP)
exports.register = async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User exists" });
>>>>>>> origin/asha-module1

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

<<<<<<< HEAD
    // Send OTP via email
=======
    // We send the OTP via email
>>>>>>> origin/asha-module1
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your AshePashe Account',
      text: `Your verification code is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

<<<<<<< HEAD
    // Return OTP and temp data (in production, store in Redis/session)
    res.status(200).json({
      message: "OTP sent to email",
      otp, // Remove in production!
      tempData: { name, email, password, location, role }
=======
    // For now, we return the data + OTP so the frontend can pass it to the next step
    // In a production app, you'd store this in Redis or a Temp collection
    res.status(200).json({ 
      message: "OTP sent to email", 
      otp, // Sending OTP in response for testing; remove in production!
      tempData: { name, email, password, location, role } 
>>>>>>> origin/asha-module1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

<<<<<<< HEAD
// COMPLETE REGISTRATION (After OTP verification)
exports.completeRegistration = async (req, res) => {
  try {
    await connectDB();
    const { name, email, password, location, role } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      role: role || 'USER'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "User created successfully!",
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    await connectDB();
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check role match
    if (user.role !== role) {
      return res.status(400).json({ message: "Role mismatch. Please select correct role." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// VERIFY CODE (for 2FA if needed)
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // For now, just return success (implement proper verification logic)
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: "Code verified", token });
=======
// STEP 2: VERIFY & CREATE USER
exports.completeRegistration = async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name, email, location, role,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "Account verified and created!" });
>>>>>>> origin/asha-module1
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};