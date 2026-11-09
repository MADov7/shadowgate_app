// Order (a submitted service request). SKILL.md fields: user (ref User), items (product, quantity, price), total,
// status (pending / paid), createdAt.
// - `user` always comes from the verified login token on the server — never from the browser.
// - Every item's `price` and the `total` are computed on the server from the Product documents.
//   Quote-based items have price 0 and pricingKind 'quote' (priced later after a scoping call), so `total`
//   only sums illustrative-priced items and `hasQuoteItems` tells the UI to show "Request a quote".
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const { Schema, model, models } = mongoose;

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    price: { type: Number, required: true, min: 0 }, // unit price at order time (server-derived)
    pricingKind: { type: String, required: true, enum: ['quote', 'illustrative'] },
    // Snapshot for display, so past orders still read correctly if the product changes later.
    slug: { type: String, required: true },
    name: { en: { type: String, required: true }, ar: { type: String, default: '' } },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: { validator: (v: unknown[]) => Array.isArray(v) && v.length > 0, message: 'An order needs at least one item.' },
    },
    total: { type: Number, required: true, min: 0 },
    hasQuoteItems: { type: Boolean, default: false },
    status: { type: String, required: true, enum: ['pending', 'paid'], default: 'pending' },
    packageSlug: { type: String, default: null },
    requestType: { type: String, enum: ['business', 'personal'], default: 'business' },
    organisation: { type: String, default: '', maxlength: 120 },
    phone: { type: String, default: '', maxlength: 40 },
    message: { type: String, default: '', maxlength: 2000 },
    // Ownership / written-authorization confirmation (required when the order includes penetration testing).
    authorizationConfirmed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type OrderFields = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderFields> = (models.Order as Model<OrderFields>) ?? model<OrderFields>('Order', OrderSchema);
