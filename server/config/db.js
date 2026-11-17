const mongoose = require('mongoose');

async function connectDB() {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri || uri.startsWith('PASTE_')) {
    throw new Error('MONGODB_URI is missing. Put your MongoDB Atlas connection string in server/.env');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection;
}

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };
