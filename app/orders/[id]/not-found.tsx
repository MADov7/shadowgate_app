import Link from 'next/link';

// Shown when the order id does not exist OR belongs to another account (the lookup uses id + owner).
export default function OrderNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-sg-navy px-4">
      <div className="panel grid max-w-lg gap-3 p-8 text-center">
        <p className="eyebrow">SG//ORDERS</p>
        <h1 className="h2">Order not found · الطلب غير موجود</h1>
        <p className="text-sg-muted">
          This order does not exist or does not belong to your account.
          <br />
          هذا الطلب غير موجود أو لا يخص حسابك.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link className="btn btn--primary" href="/orders">
            My Orders · طلباتي
          </Link>
          <Link className="btn btn--secondary" href="/products">
            Products · المنتجات
          </Link>
        </div>
      </div>
    </main>
  );
}
