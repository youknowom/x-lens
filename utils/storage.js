/**
 * Context Lens - Storage Wrapper
 * Handles interactions with Chrome's storage API.
 */

import { logger } from './logger.js';

export const storage = {
    /**
     * Get values from storage.
     * @param {string|string[]|Object} keys
     * @param {string} area - 'local' (default) or 'sync'
     */
    get: async (keys, area = 'local') => {
        try {
            return await chrome.storage[area].get(keys);
        } catch (error) {
            logger.error('Storage GET failed', { error, keys, area });
            return null;
        }
    },

    /**
     * Set values in storage.
     * @param {Object} items
     * @param {string} area - 'local' (default) or 'sync'
     */
    set: async (items, area = 'local') => {
        try {
            await chrome.storage[area].set(items);
            return true;
        } catch (error) {
            logger.error('Storage SET failed', { error, items, area });
            return false;
        }
    },

    /**
     * Remove values from storage.
     * @param {string|string[]} keys
     * @param {string} area - 'local' (default) or 'sync'
     */
    remove: async (keys, area = 'local') => {
        try {
            await chrome.storage[area].remove(keys);
            return true;
        } catch (error) {
            logger.error('Storage REMOVE failed', { error, keys, area });
            return false;
        }
    },

    /**
     * Clear all storage for the specified area.
     * @param {string} area - 'local' (default) or 'sync'
     */
    clear: async (area = 'local') => {
        try {
            await chrome.storage[area].clear();
            return true;
        } catch (error) {
            logger.error('Storage CLEAR failed', { error, area });
            return false;
        }
    },
};
