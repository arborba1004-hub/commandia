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

// This is a placeholder file that re-exports the actual currency implementation from the Wix platform
export { useCurrency, formatPrice, DEFAULT_CURRENCY } from '@wix/codegen-framework-packages';
