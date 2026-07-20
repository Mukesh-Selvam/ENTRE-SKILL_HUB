const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Define it in your .env file before starting the server.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  console.log(`MongoDB connected -> ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

  return mongoose.connection;
}

module.exports = connectDB;
