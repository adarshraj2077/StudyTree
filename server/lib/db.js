const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studytree';
    await mongoose.connect(uri);
    console.log('[MongoDB] Connected successfully');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
  }
};

module.exports = connectDB;
