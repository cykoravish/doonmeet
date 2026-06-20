import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Cached connection to avoid multiple connections in Next.js dev (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cache.conn) return cache.conn;

  // Reuse pending connection promise
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // fail fast if not connected — don't queue commands
      maxPoolSize: 10, // max 10 concurrent connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Reset promise so next call retries
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
