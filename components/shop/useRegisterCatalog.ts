import { useEffect, useState } from 'react';
import type { Service } from '@/src/data/types';
import { SERVICES, registerServices } from '@/src/data/services';

/**
 * Loads the products that the server read from MongoDB into the browser-side catalog registry.
 * The first registration happens synchronously during the first render, i.e. before the store UI modules
 * (basket, catalog, dialogs) load; later changes (e.g. after a refresh) are applied after rendering.
 */
export function useRegisterCatalog(products: Service[]): void {
  useState(() => {
    registerServices(products);
    return null;
  });
  useEffect(() => {
    if (SERVICES !== products) registerServices(products);
  }, [products]);
}
