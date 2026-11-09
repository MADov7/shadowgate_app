// Store product = one Shadow Gate cybersecurity service.
// SKILL.md fields: name, description, price, image, category, createdAt — plus what the bilingual storefront needs
// (stable slug, Arabic + English content, pricing kind, icon, featured flag, display order).
//
// PRICING: `price` is a number in USD.
//   - pricing.kind = 'illustrative' → price is the illustrative classwork price (e.g. 39), shown as such.
//   - pricing.kind = 'quote'        → the price depends on scope. `price` is stored as 0 ONLY because the field is
//     numeric; the UI never shows it — it shows "Request a quote" — and orders record these lines as pending quote.
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const { Schema, model, models } = mongoose;

const L10n = { en: { type: String, default: '' }, ar: { type: String, default: '' } };
const L10nList = { en: { type: [String], default: [] }, ar: { type: [String], default: [] } };

const ProductSchema = new Schema(
  {
    // ----- SKILL.md fields -----
    name: { type: String, required: true, trim: true }, // English name (Arabic in content.name.ar)
    description: { type: String, required: true }, // English summary (Arabic in content.summary.ar)
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    category: { type: String, required: true, index: true },
    // ----- storefront fields -----
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    audience: { type: String, required: true, enum: ['business', 'personal'], index: true },
    icon: { type: String, required: true },
    primaryAction: { type: String, required: true, enum: ['add', 'quote', 'book'] },
    layer: { type: String, enum: ['website', 'email', 'cloud', 'accounts', 'ongoing'] },
    featured: { type: Boolean, default: false, index: true },
    requiresAuthorization: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    pricing: {
      kind: { type: String, required: true, enum: ['quote', 'illustrative'] },
      currency: { type: String, default: 'USD' },
      per: L10n,
    },
    content: {
      name: L10n,
      benefit: L10n,
      audienceText: L10n,
      summary: L10n,
      scope: L10nList,
      exclusions: L10nList,
      deliverables: L10nList,
      duration: L10n,
      keywords: L10nList,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type ProductFields = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductFields> =
  (models.Product as Model<ProductFields>) ?? model<ProductFields>('Product', ProductSchema);
