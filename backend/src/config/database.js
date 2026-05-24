/**
 * ============================================
 * DATABASE CONFIGURATION
 * ============================================
 * MongoDB connection setup using Mongoose
 */

const mongoose = require('mongoose');
const seedAdminUser = require('../utils/seedAdminUser');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitorbit';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(uri, options);
    
    console.log('✅ MongoDB connected successfully');
    const dbName = uri.split('/').pop().split('?')[0];
    console.log(`📊 Database: ${dbName}`);

    await seedAdminUser();
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Database disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('💥 Database error:', error.message);
});

module.exports = connectDB;
