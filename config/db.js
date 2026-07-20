const mongoose = require('mongoose');
require('dotenv').config();

// Global cache to prevent connection exhaustion in Vercel Serverless environment
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected — reuse
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset if disconnected/disconnecting so we can reconnect
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    cached.conn = null;
    cached.promise = null;
  }

  const uri = process.env.MONGODB_URI;

  // Log the URI (masked) on Vercel to help debug missing env vars
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    if (!uri) {
      const msg = 'MONGODB_URI environment variable is MISSING in Vercel Project Settings! Add it and redeploy.';
      console.error(`❌ ${msg}`);
      throw new Error(msg);
    }
    // Log masked URI so you can confirm it's being picked up
    const masked = uri.replace(/:\/\/(.*?):(.*?)@/, '://<user>:<pass>@');
    console.log(`🔌 Connecting to MongoDB Atlas: ${masked}`);
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/ecoscan';

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(targetUri, {
        serverSelectionTimeoutMS: 10000, // 10s — enough for Vercel cold starts
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        console.log('✅ MongoDB Connected successfully');
        return m;
      })
      .catch((error) => {
        cached.promise = null; // Allow retry on next request
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('❌ Full error:', JSON.stringify({ name: error.name, code: error.code, reason: error.reason?.toString() }));
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
