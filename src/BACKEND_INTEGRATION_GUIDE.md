# Backend Integration Guide

This document provides a complete guide for integrating your external backend with this frontend application. All Wix dependencies have been removed, leaving only frontend code.

## ✅ What's Been Cleaned Up

- ❌ Removed `@wix/seo` imports from Astro pages
- ❌ Removed `@wix/wix-vibe-plugins` CSS imports
- ❌ Removed `@wix/astro-pages` type definitions
- ❌ Removed Wix Members authentication (MemberProvider is now a no-op)
- ✅ Kept all React components and UI logic
- ✅ Kept all styling and design
- ✅ Kept all game logic and state management

## 🔧 Integration Points

### 1. Data Management (BaseCrudService)

**Location:** `/src/integrations/cms/service.ts`

Replace the placeholder functions with your backend API calls:

```typescript
// Example implementation
export const BaseCrudService = {
  async getAll<T>(collectionId: string, refs?: any, options?: any) {
    const response = await fetch(`/api/collections/${collectionId}`, {
      params: options
    });
    return response.json();
  },
  
  async getById<T>(collectionId: string, itemId: string, refs?: any) {
    const response = await fetch(`/api/collections/${collectionId}/${itemId}`);
    return response.json();
  },
  
  async create<T>(collectionId: string, itemData: T, multiRefs?: any) {
    const response = await fetch(`/api/collections/${collectionId}`, {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    return response.json();
  },
  
  async update<T>(collectionId: string, itemData: Partial<T> & { _id: string }) {
    const response = await fetch(`/api/collections/${collectionId}/${itemData._id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    return response.json();
  },
  
  async delete(collectionId: string, itemId: string) {
    await fetch(`/api/collections/${collectionId}/${itemId}`, {
      method: 'DELETE'
    });
  },
  
  async addReferences(collectionId: string, itemId: string, refs: any) {
    // Implement reference management
  },
  
  async removeReferences(collectionId: string, itemId: string, refs: any) {
    // Implement reference removal
  }
};
```

**Collection IDs Used in App:**
- `accessories` - Escape vehicle accessories
- `armasarsenal` - Arsenal weapons
- `casesdearmas` - Weapon cases
- `conceptart` - Concept art gallery
- `fugavehicles` - Escape vehicles
- `gamemechanics` - Game mechanics
- `partidas` - Matches
- `playerinventories` - Player inventories
- `playerprofiles` - Player profiles
- `playerprogress` - Player progress
- `talentosdocrime` - Crime talents/skills

### 2. Shopping Cart (useCart)

**Location:** `/src/integrations/cms/cms-ecom/cart.ts`

Implement cart management with your backend:

```typescript
import { useState, useCallback } from 'react';

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const actions = {
    addToCart: useCallback(async ({ collectionId, itemId, quantity = 1 }) => {
      setAddingItemId(itemId);
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({ collectionId, itemId, quantity })
        });
        const updatedCart = await response.json();
        setItems(updatedCart.items);
      } finally {
        setAddingItemId(null);
      }
    }, []),
    
    removeFromCart: useCallback((item) => {
      // Call your backend to remove item
      fetch(`/api/cart/remove/${item.id}`, { method: 'DELETE' });
    }, []),
    
    updateQuantity: useCallback((item, qty) => {
      // Call your backend to update quantity
      fetch(`/api/cart/update/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: qty })
      });
    }, []),
    
    toggleCart: () => setIsOpen(!isOpen),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    clearCart: () => setItems([]),
    
    checkout: async () => {
      setIsCheckingOut(true);
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          body: JSON.stringify({ items })
        });
        // Handle checkout response
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  return {
    items,
    itemCount: items.length,
    totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    isOpen,
    addingItemId,
    isCheckingOut,
    actions
  };
};
```

### 3. Currency Management

**Location:** `/src/integrations/cms/cms-ecom/currency.ts`

Update currency settings for your region:

```typescript
export const DEFAULT_CURRENCY = 'BRL'; // Change to your currency code

export const useCurrency = () => {
  // Optionally fetch from backend
  return {
    currency: DEFAULT_CURRENCY,
  };
};
```

### 4. Checkout (buyNow)

**Location:** `/src/integrations/cms/cms-ecom/ecom-service.ts`

Implement direct checkout:

```typescript
export const buyNow = async (items: Array<{ collectionId: string; itemId: string; quantity: number }>) => {
  const response = await fetch('/api/checkout/buy-now', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
  
  if (!response.ok) {
    throw new Error('Checkout failed');
  }
  
  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl; // Redirect to payment
};
```

## 📋 Collection Schemas

### Player Profiles
```typescript
{
  _id: string;
  playerName?: string;
  level?: number;
  experiencePoints?: number;
  dirtyMoney?: number;
  cleanMoney?: number;
  lastLoginDate?: Date;
  creationDate?: Date;
}
```

### Accessories
```typescript
{
  _id: string;
  itemName?: string;
  itemDescription?: string;
  itemPrice?: number;
  itemImage?: string;
  skillType?: string;
}
```

### Arsenal Weapons
```typescript
{
  _id: string;
  weaponName?: string;
  description?: string;
  level?: number;
  dirtyMoneyPrice?: number;
  abilityBonus?: string;
  weaponImage?: string;
}
```

### Escape Vehicles
```typescript
{
  _id: string;
  name?: string;
  level?: number;
  price?: number;
  image?: string;
  abilityBonusType?: string;
  description?: string;
}
```

### Crime Talents
```typescript
{
  _id: string;
  skillName?: string;
  category?: string;
  description?: string;
  unlockLevel?: number;
  minEffectValue?: number;
  maxEffectValue?: number;
  effectUnit?: string;
  cooldownDescription?: string;
  unlockCostDirtyMoney?: number;
  isAutoUnlock?: boolean;
  isFactionLeaderOnly?: boolean;
  maxSkillLevel?: number;
}
```

## 🔌 API Endpoints Expected

Your backend should provide these endpoints:

```
GET    /api/collections/:collectionId
GET    /api/collections/:collectionId/:itemId
POST   /api/collections/:collectionId
PUT    /api/collections/:collectionId/:itemId
DELETE /api/collections/:collectionId/:itemId

POST   /api/cart/add
DELETE /api/cart/remove/:itemId
PUT    /api/cart/update/:itemId
POST   /api/checkout
POST   /api/checkout/buy-now
```

## 🚀 Getting Started

1. **Update BaseCrudService** - Replace placeholder functions with your API calls
2. **Implement Cart Logic** - Connect shopping cart to your backend
3. **Set Currency** - Update DEFAULT_CURRENCY for your region
4. **Test Collections** - Verify all collection IDs match your backend schema
5. **Deploy** - No Wix dependencies remain, ready for any backend

## 📝 Notes

- All Wix-specific code has been removed
- Frontend is now completely backend-agnostic
- Use any backend framework (Node.js, Python, Java, etc.)
- All UI components remain unchanged
- Game logic and state management are preserved
- Ready for production deployment

## ⚠️ Important

- Replace all `console.warn()` calls with actual API implementations
- Add proper error handling for all API calls
- Implement authentication/authorization as needed
- Add CORS headers if frontend and backend are on different domains
- Test thoroughly before production deployment
