/**
 * eCommerce Service
 * 
 * Provides direct checkout functionality for catalog items.
 * 
 * Usage:
 * import { buyNow } from '@/integrations';
 * 
 * await buyNow([
 *   { collectionId: 'products', itemId: 'item-1', quantity: 2 }
 * ]);
 */

// eCommerce functionality is provided by the Wix platform
export { buyNow } from '@wix/sdk';
