// Order data as sent to the browser (no user id, no internal fields). Shared by lib/orders.ts (server), the
// My Orders pages and the request form's confirmation.
export interface PublicOrderItem {
  slug: string;
  name: { en: string; ar: string };
  quantity: number;
  /** Unit price at order time (server-derived). 0 for quote-based items. */
  price: number;
  pricingKind: 'quote' | 'illustrative';
}

export interface PublicOrder {
  id: string;
  status: 'pending' | 'paid';
  /** Sum of illustrative-priced lines only (quote-based lines are priced later). */
  total: number;
  hasQuoteItems: boolean;
  packageSlug: string | null;
  requestType: 'business' | 'personal';
  organisation: string;
  message: string;
  createdAt: string | null;
  items: PublicOrderItem[];
  /** Day 5: 'stripe' when the order was saved after a successful Stripe Checkout payment (test mode). */
  paymentMethod: 'stripe' | null;
  /** When the payment was confirmed (ISO), or null. */
  paidAt: string | null;
}
