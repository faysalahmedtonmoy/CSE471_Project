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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // We send the OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your AshePashe Account',
      text: `Your verification code is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    // For now, we return the data + OTP so the frontend can pass it to the next step
    // In a production app, you'd store this in Redis or a Temp collection
    res.status(200).json({ 
      message: "OTP sent to email", 
      otp, // Sending OTP in response for testing; remove in production!
      tempData: { name, email, password, location, role } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};