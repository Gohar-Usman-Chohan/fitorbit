/**
 * ============================================
 * DATABASE CONFIGURATION
 * ============================================
 * MongoDB connection with serverless-friendly caching (Vercel).
 */

const mongoose = require('mongoose');
const seedAdminUser = require('../utils/seedAdminUser');

let seedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    });

    console.log('✅ MongoDB connected successfully');
    const dbName = uri.split('/').pop()?.split('?')[0];
    if (dbName) {
      console.log(`📊 Database: ${dbName}`);
    }

    if (!seedPromise) {
      seedPromise = seedAdminUser().catch((error) => {
        seedPromise = null;
        console.error('Admin seed failed:', error.message);
      });
    }
    await seedPromise;

    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Database disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('💥 Database error:', error.message);
});

module.exports = connectDB;
