import {
  CalendarSync,
  Crosshair,
  DatabaseBackup,
  EyeOff,
  Globe,
  KeyRound,
  MailCheck,
  MessagesSquare,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  Users,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { ServiceIconName } from '../../data/types';

const ICONS: Record<ServiceIconName, ComponentType<LucideProps>> = {
  Globe,
  Crosshair,
  MailCheck,
  Users,
  ShoppingCart,
  DatabaseBackup,
  MessagesSquare,
  CalendarSync,
  KeyRound,
  Smartphone,
  EyeOff,
  ShieldAlert,
};

export function ServiceIcon({ name, ...props }: { name: ServiceIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" strokeWidth={1.6} {...props} />;
}
