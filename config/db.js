const mongoose = require('mongoose');
require('dotenv').config();

// Global cache to prevent connection exhaustion in Vercel Serverless environment
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION)) {
    console.warn('⚠️ MONGODB_URI not set on Vercel. Database operations will be skipped.');
    return null;
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/carboniq';

  if (!cached.promise) {
    cached.promise = mongoose.connect(targetUri, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ MongoDB Connected successfully');
      return mongoose;
    }).catch(error => {
      cached.promise = null;
      console.error('❌ MongoDB Connection Error:', error.message);
      return null;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
