import { getProduct } from '@/lib/catalog';
import { errorResponse, json } from '@/lib/http';

// GET /api/products/:slug — one product, or 404.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getProduct(slug);
    return product ? json({ product }) : json({ error: 'Product not found.' }, 404);
  } catch (error) {
    return errorResponse(error);
  }
}
