import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const watchlistSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  stockSymbol: {
    type: String,
    required: true,
    uppercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate stocks per session
watchlistSchema.index({ sessionId: 1, stockSymbol: 1 }, { unique: true });

export const Watchlist = mongoose.model('Watchlist', watchlistSchema);

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}
