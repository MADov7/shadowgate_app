'use client';

// Client entry points for the store pages. The server page loads the data (products from Supabase, the signed-in
// user from the verified cookie, their orders) and passes it in; the interactive UI (shared basket, filters, toasts,
// bilingual text from the visitor's saved language) then runs in the browser, exactly like the home experience.
// ShopSkeleton shows meanwhile.
import dynamic from 'next/dynamic';
import type { ComponentProps, ComponentType } from 'react';
import type { Service } from '@/src/data/types';
import type { SessionUser } from '@/src/state/session';
import ShopSkeleton from './ShopSkeleton';
import { useRegisterCatalog } from './useRegisterCatalog';
import { useHydrateSession } from './useHydrateSession';
import type ProductsViewT from './views/ProductsView';
import type ProductDetailsViewT from './views/ProductDetailsView';
import type CartViewT from './views/CartView';
import type SignupViewT from './views/SignupView';
import type LoginViewT from './views/LoginView';
import type OrdersViewT from './views/OrdersView';
import type OrderDetailsViewT from './views/OrderDetailsView';
import type CheckoutSuccessViewT from './views/CheckoutSuccessView';
import type CheckoutCancelViewT from './views/CheckoutCancelView';

const loading = () => <ShopSkeleton />;

const ProductsView = dynamic(() => import('./views/ProductsView'), { ssr: false, loading });
const ProductDetailsView = dynamic(() => import('./views/ProductDetailsView'), { ssr: false, loading });
const CartView = dynamic(() => import('./views/CartView'), { ssr: false, loading });
const SignupView = dynamic(() => import('./views/SignupView'), { ssr: false, loading });
const LoginView = dynamic(() => import('./views/LoginView'), { ssr: false, loading });
const OrdersView = dynamic(() => import('./views/OrdersView'), { ssr: false, loading });
const OrderDetailsView = dynamic(() => import('./views/OrderDetailsView'), { ssr: false, loading });
const CheckoutSuccessView = dynamic(() => import('./views/CheckoutSuccessView'), { ssr: false, loading });
const CheckoutCancelView = dynamic(() => import('./views/CheckoutCancelView'), { ssr: false, loading });

/** Wraps a client-only view: registers the database products and the session before it loads. */
function entry<P extends { products: Service[] }>(View: ComponentType<P>) {
  return function Entry(props: P & { sessionUser?: SessionUser | null }) {
    const { sessionUser, ...rest } = props;
    useRegisterCatalog(props.products);
    useHydrateSession(sessionUser);
    return <View {...(rest as unknown as P)} />;
  };
}

export const ProductsEntry = entry(ProductsView as ComponentType<ComponentProps<typeof ProductsViewT>>);
export const ProductDetailsEntry = entry(ProductDetailsView as ComponentType<ComponentProps<typeof ProductDetailsViewT>>);
export const CartEntry = entry(CartView as ComponentType<ComponentProps<typeof CartViewT>>);
export const SignupEntry = entry(SignupView as ComponentType<ComponentProps<typeof SignupViewT>>);
export const LoginEntry = entry(LoginView as ComponentType<ComponentProps<typeof LoginViewT>>);
export const OrdersEntry = entry(OrdersView as ComponentType<ComponentProps<typeof OrdersViewT>>);
export const OrderDetailsEntry = entry(OrderDetailsView as ComponentType<ComponentProps<typeof OrderDetailsViewT>>);
export const CheckoutSuccessEntry = entry(CheckoutSuccessView as ComponentType<ComponentProps<typeof CheckoutSuccessViewT>>);
export const CheckoutCancelEntry = entry(CheckoutCancelView as ComponentType<ComponentProps<typeof CheckoutCancelViewT>>);
