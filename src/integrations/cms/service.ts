/**
 * BaseCrudService - CMS Data Management
 * 
 * This service provides CRUD operations for CMS collections.
 * It's provided by the Wix platform integration.
 * 
 * Usage:
 * import { BaseCrudService } from '@/integrations';
 * 
 * const items = await BaseCrudService.getAll('collection-id');
 * const item = await BaseCrudService.getById('collection-id', 'item-id');
 * await BaseCrudService.create('collection-id', { ...data });
 * await BaseCrudService.update('collection-id', { _id: 'item-id', ...updates });
 * await BaseCrudService.delete('collection-id', 'item-id');
 */

// BaseCrudService is provided by the Wix platform
// Import it directly from the Wix SDK when available
export { BaseCrudService } from '@wix/sdk';
