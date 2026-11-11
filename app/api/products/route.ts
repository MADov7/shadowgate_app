import { getProducts } from '@/lib/catalog';
import { errorResponse, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

// GET /api/products — every product (service) from the Supabase products table, in display order. Public.
export async function GET() {
  try {
    return json({ products: await getProducts() });
  } catch (error) {
    return errorResponse(error);
  }
}
