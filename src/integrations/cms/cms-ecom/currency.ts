/**
 * Currency Management
 * 
 * Provides currency formatting and site currency settings.
 * 
 * Usage:
 * import { useCurrency, formatPrice, DEFAULT_CURRENCY } from '@/integrations';
 * 
 * const { currency } = useCurrency();
 * const formatted = formatPrice(29.99, currency ?? DEFAULT_CURRENCY);
 */

export const DEFAULT_CURRENCY = 'USD';

export const useCurrency = () => {
  return {
    currency: DEFAULT_CURRENCY,
  };
};

export const formatPrice = (amount: number, currencyCode: string = DEFAULT_CURRENCY): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};
