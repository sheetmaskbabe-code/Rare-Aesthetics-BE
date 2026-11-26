import mongoose from 'mongoose';

let connPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connPromise) {
    return connPromise;
  }

  let uri = (process.env.MONGODB_URI || '').trim();
  if (uri.startsWith('MONGODB_URI=')) {
    uri = uri.replace(/^MONGODB_URI=\s*/, '').trim();
  }
  if (!uri) {
    uri = 'mongodb://127.0.0.1:27017/rare_aesthetics';
  }

  connPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });

      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`[MongoDB] Connection error: ${err.message}`);
      console.warn(
        '[MongoDB] Notice: Make sure your local MongoDB service is running, or set MONGODB_URI in backend/.env to your MongoDB Atlas connection string.'
      );
      return null;
    } finally {
      connPromise = null;
    }
  })();

  return connPromise;
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Runtime error:', err.message);
});
