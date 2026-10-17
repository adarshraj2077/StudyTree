const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studytree';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Timeout fast if local mongod is not active
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully to:', uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@'));
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB] Local/remote connection skipped (${err.message}). Activating resilient local JSON persistence.`);
  }
};

const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = { connectDB, isDBConnected };
