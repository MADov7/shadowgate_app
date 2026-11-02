// Cross-cutting user actions with consistent feedback (toasts). Use these instead of calling stores directly
// so every "Add to request" button behaves the same everywhere on the site.
import type { PackageId, ServiceId } from '../data/types';
import { getPackage } from '../data/packages';
import { getService } from '../data/services';
import { translate, useLangStore } from '../i18n';
import { useBasket, type AddResult, type BasketSnapshot } from './basket';
import { useUI } from './ui';

function serviceName(id: ServiceId): string {
  return getService(id).name[useLangStore.getState().lang];
}
function packageName(id: PackageId): string {
  return getPackage(id).name[useLangStore.getState().lang];
}
function snapshot(): BasketSnapshot {
  const s = useBasket.getState();
  return { serviceIds: [...s.serviceIds], packageId: s.packageId };
}

export function addServiceToRequest(id: ServiceId): AddResult {
  const basket = useBasket.getState();
  const result = basket.add(id);
  const ui = useUI.getState();
  if (result === 'added') {
    ui.toast({
      tone: 'success',
      message: translate('common.toastAdded', { name: serviceName(id) }),
      action: { label: translate('common.undo'), run: () => useBasket.getState().remove(id) },
    });
  } else if (result === 'duplicate') {
    ui.toast({ tone: 'info', message: translate('common.toastDuplicate', { name: serviceName(id) }) });
  } else {
    const pkg = basket.packageId ? packageName(basket.packageId) : '';
    ui.toast({ tone: 'info', message: translate('common.toastIncluded', { name: serviceName(id), pkg }) });
  }
  return result;
}

export function removeServiceFromRequest(id: ServiceId): void {
  const before = snapshot();
  useBasket.getState().remove(id);
  useUI.getState().toast({
    tone: 'info',
    message: translate('common.toastRemoved', { name: serviceName(id) }),
    action: { label: translate('common.undo'), run: () => useBasket.getState().restore(before) },
  });
}

export function selectPackage(id: PackageId | null): void {
  const state = useBasket.getState();
  if (state.packageId === id) return;
  const before = snapshot();
  const merged = state.setPackage(id);
  const ui = useUI.getState();
  const undo = { label: translate('common.undo'), run: () => useBasket.getState().restore(before) };
  if (id === null) {
    ui.toast({ tone: 'info', message: translate('common.toastPackageCleared'), action: undo });
  } else if (merged.length > 0) {
    ui.toast({
      tone: 'success',
      message: translate('common.toastPackageMerged', { count: merged.length, pkg: packageName(id) }),
      action: undo,
    });
  } else {
    ui.toast({ tone: 'success', message: translate('common.toastPackageSet', { pkg: packageName(id) }), action: undo });
  }
}

/** Primary action for a service: personal "book" services open the (demo) booking dialog; others are added. */
export function runPrimaryAction(id: ServiceId): void {
  if (getService(id).primaryAction === 'book') useUI.getState().openBooking(id);
  else addServiceToRequest(id);
}
