import mongoose from 'mongoose';
import { config } from './environment';

/**
 * MongoDB database connection configuration
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(config.MONGODB_URI, {
      // No deprecated options needed in latest mongoose versions
    });

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};
