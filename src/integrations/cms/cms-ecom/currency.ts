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

// Currency functionality is provided by the Wix platform
export { useCurrency, formatPrice, DEFAULT_CURRENCY } from '@wix/sdk';
