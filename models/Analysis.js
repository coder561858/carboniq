const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  hostname: {
    type: String,
    required: true,
    index: true // For faster leaderboard queries
  },
  pageTitle: String,
  
  // Size metrics
  totalSize: Number, // in bytes
  totalSizeMB: Number,
  totalRequests: Number,
  
  // Carbon metrics
  co2Grams: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'B', 'C', 'D', 'E', 'F']
  },
  
  // Hosting info
  isGreenHosted: Boolean,
  
  // Resource breakdown (nested JSON)
  resources: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Server Geo info
  serverGeo: {
    country: String,
    region: String,
    timezone: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
