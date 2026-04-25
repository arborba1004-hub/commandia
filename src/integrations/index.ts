// Re-export all integrations
export { BaseCrudService } from './cms/service';
export { useCart, useCartStore } from './cms/cms-ecom/cart';
export { useCurrency, formatPrice, DEFAULT_CURRENCY } from './cms/cms-ecom/currency';
export { buyNow } from './cms/cms-ecom/ecom-service';

// Ensure there's always a default export to prevent "no default export" errors
export default {
  BaseCrudService: require('./cms/service').BaseCrudService,
  useCart: require('./cms/cms-ecom/cart').useCart,
  useCartStore: require('./cms/cms-ecom/cart').useCartStore,
  useCurrency: require('./cms/cms-ecom/currency').useCurrency,
  formatPrice: require('./cms/cms-ecom/currency').formatPrice,
  DEFAULT_CURRENCY: require('./cms/cms-ecom/currency').DEFAULT_CURRENCY,
  buyNow: require('./cms/cms-ecom/ecom-service').buyNow,
};
