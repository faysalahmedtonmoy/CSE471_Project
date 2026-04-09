require('dotenv').config(); // This line is CRITICAL
const express = require('express');
const connectDB = require('./lib/mongodb');

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));