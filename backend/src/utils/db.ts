import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_records';
  await mongoose.connect(uri, { autoIndex: true });
  console.log('Connected to MongoDB');
}
