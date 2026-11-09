// Classwork demonstration helper: edits one product directly in MongoDB Atlas (as if done in the Atlas UI) so you
// can see the storefront change after a refresh, then restores it.
//   npm run demo:atlas-edit -- set      → renames "consultation" and changes its price to 59
//   npm run demo:atlas-edit -- restore  → puts the original values back (same as npm run seed)
import mongoose from 'mongoose';
import { connectDB } from '../lib/db';
import { Product } from '../models/Product';
import { SEED_SERVICES } from './seed/catalog-data';

const mode = process.argv[2] ?? 'set';
const original = SEED_SERVICES.find((s) => s.id === 'consultation')!;

try {
  await connectDB();
  if (mode === 'set') {
    await Product.updateOne(
      { slug: 'consultation' },
      { $set: { name: 'Cybersecurity Consultation (edited in Atlas)', 'content.name.en': 'Cybersecurity Consultation (edited in Atlas)', price: 59 } },
    );
    console.log('Atlas edit applied: consultation → "(edited in Atlas)", price 59');
  } else {
    const price = original.pricing.kind === 'illustrative' ? original.pricing.amount : 0;
    await Product.updateOne({ slug: 'consultation' }, { $set: { name: original.name.en, 'content.name.en': original.name.en, price } });
    console.log(`Restored: consultation → "${original.name.en}", price ${price}`);
  }
} finally {
  await mongoose.disconnect();
}
