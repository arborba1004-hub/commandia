/**
 * Cart Management Hook
 * 
 * Provides shopping cart functionality for eCommerce collections.
 * 
 * Usage:
 * import { useCart } from '@/integrations';
 * 
 * const { items, itemCount, totalPrice, isOpen, actions } = useCart();
 * actions.addToCart({ collectionId: 'products', itemId: 'item-1', quantity: 1 });
 * actions.removeFromCart(item);
 * actions.updateQuantity(item, 5);
 * actions.toggleCart();
 * actions.checkout();
 */

// Cart functionality is provided by the Wix platform
export { useCart, useCartStore } from '@wix/sdk';
