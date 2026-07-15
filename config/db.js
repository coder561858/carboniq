const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carboniq';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Do not exit process, just log error so the app can still serve frontend
  }
};

module.exports = connectDB;
