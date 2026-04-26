import mongoose from 'mongoose';

/**
 * Shared MongoDB connector for Next.js API routes.
 * Uses a module-level cache so the connection is reused across
 * hot reloads in dev and across invocations in production.
 */
const connectDB = async (): Promise<void> => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB Connected (frontend lib)');
  } catch (error) {
    console.error('❌ DB Connection Error:', error);
    throw error;
  }
};

export default connectDB;
