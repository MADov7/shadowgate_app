// Step 3 check: connects to MongoDB Atlas with MONGODB_URI, builds the model indexes (unique email, unique slug)
// and prints the database name, collections, indexes and document counts. Never prints the connection string.
//   npm run db:check
import mongoose from 'mongoose';
import { connectDB, MissingSecretError } from '../lib/db';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';

try {
  const conn = await connectDB();
  await Promise.all([User.syncIndexes(), Product.syncIndexes(), Order.syncIndexes()]);
  const host = conn.connection.host ?? '';
  console.log(`Connected ✓  database "${conn.connection.name}" on ${host.endsWith('.mongodb.net') ? 'MongoDB Atlas' : 'a MongoDB server'}`);
  const collections = (await conn.connection.db!.listCollections().toArray()).map((c) => c.name).sort();
  console.log('Collections:', collections.join(', ') || '(none yet)');
  for (const [name, m] of [
    ['users', User],
    ['products', Product],
    ['orders', Order],
  ] as const) {
    const indexes = (await m.collection.indexes()).map((i) => `${Object.keys(i.key).join('+')}${i.unique ? ' (unique)' : ''}`);
    console.log(`${name}: ${await m.countDocuments()} document(s) · indexes: ${indexes.join(', ')}`);
  }
} catch (error) {
  if (error instanceof MissingSecretError) {
    console.error(`STOP: ${error.key} is not set. Add it to .env.local (local) and to Netlify environment variables (production).`);
  } else {
    const e = error as Error;
    console.error(`Connection failed: ${e.name}: ${e.message.replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[hidden URI]')}`);
  }
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
