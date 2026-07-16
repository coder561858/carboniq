const mongoose = require('mongoose');
require('dotenv').config();

// Global cache to prevent connection exhaustion in Vercel Serverless environment
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset cached promise/connection if readyState is 0 (disconnected) or 3 (disconnecting) across cold starts
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    cached.conn = null;
    cached.promise = null;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION)) {
    const msg = 'MONGODB_URI environment variable is missing inside Vercel Project Settings! Please add it and redeploy.';
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/carboniq';

  if (!cached.promise) {
    cached.promise = mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).then((mongoose) => {
      console.log('✅ MongoDB Connected successfully');
      return mongoose;
    }).catch(error => {
      cached.promise = null;
      console.error('❌ MongoDB Connection Error:', error.message);
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
