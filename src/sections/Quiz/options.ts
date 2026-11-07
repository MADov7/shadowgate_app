// Quiz option metadata shared by the questions and the results (labels, descriptions, icons).
import {
  AtSign,
  Bug,
  Building,
  CircleQuestionMark,
  Cloud,
  DatabaseZap,
  EyeOff,
  Globe,
  Laptop,
  MailCheck,
  MailWarning,
  ShoppingCart,
  Smartphone,
  UserRound,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { TKey } from '../../i18n';
import type { AnswerId, CustomerType } from '../../lib/quiz';

export type OptionId = CustomerType | AnswerId;

export const OPTION_ICON: Record<OptionId, LucideIcon> = {
  business: Building,
  individual: UserRound,
  website: Globe,
  store: ShoppingCart,
  email: MailCheck,
  cloud: Cloud,
  teamDevices: Laptop,
  personalDevices: Smartphone,
  social: AtSign,
  phishing: MailWarning,
  takeover: UserX,
  websiteAttacks: Bug,
  dataLoss: DatabaseZap,
  privacy: EyeOff,
  unsure: CircleQuestionMark,
};

/** Label key for an option (or the 'breadth' pseudo-answer used by the scoring). */
export const optLabel = (id: OptionId | 'breadth') => `quiz.opt_${id}` as TKey;
export const optDesc = (id: OptionId) => `quiz.opt_${id}_desc` as TKey;
