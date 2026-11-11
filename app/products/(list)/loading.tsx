import ShopSkeleton from '@/components/shop/ShopSkeleton';

// Shown while this page's server data (products from Supabase) loads. Product detail pages have no loading boundary
// on purpose, so an unknown product returns a real HTTP 404.
export default function Loading() {
  return <ShopSkeleton />;
}
