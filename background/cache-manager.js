/**
 * Context Lens - Cache Manager
 * Multi-layer caching system for analysis results.
 */

import { storage } from '../utils/storage.js';
import { logger } from '../utils/logger.js';

const CACHE_PREFIX = 'analysis_';
const DEFAULT_TTL = 86400000; // 24 hours

export class CacheManager {
    constructor(ttl = DEFAULT_TTL) {
        this.ttl = ttl;
        this.memoryCache = new Map();
    }

    /**
     * Resolve cache key.
     * @param {string} postId
     */
    getCacheKey(postId) {
        return `${CACHE_PREFIX}${postId}`;
    }

    /**
     * Get result from cache (Memory or Chrome storage).
     */
    async get(postId) {
        // 1. Memory Cache
        if (this.memoryCache.has(postId)) {
            const { result, cachedAt } = this.memoryCache.get(postId);
            if (Date.now() - cachedAt < this.ttl) {
                logger.debug(`Cache hit (memory): ${postId}`);
                return result;
            }
            this.memoryCache.delete(postId); // Cleanup expired
        }

        // 2. Storage Cache
        const key = this.getCacheKey(postId);
        const data = await storage.get(key);
        const entry = data?.[key];

        if (entry) {
            const { result, cachedAt } = entry;
            if (Date.now() - cachedAt < this.ttl) {
                logger.debug(`Cache hit (storage): ${postId}`);
                // Populate memory cache for next time
                this.memoryCache.set(postId, { result, cachedAt });
                return result;
            }
            // Cleanup expired
            await storage.remove(key);
        }

        return null;
    }

    /**
     * Add result to cache.
     */
    async set(postId, result) {
        const cachedAt = Date.now();
        const key = this.getCacheKey(postId);

        // Update memory
        this.memoryCache.set(postId, { result, cachedAt });

        // Update persistent storage
        await storage.set({
            [key]: { result, cachedAt }
        });

        // Prune logic (Optional but recommended for performance)
        this.pruneIfNeeded();

        logger.debug(`Cached result for post: ${postId}`);
    }

    /**
     * Prune old cache entries if total storage grows too large.
     */
    async pruneIfNeeded() {
        // Basic LRU or batch cleanup could go here.
        // Chrome storage has a limit (quotaBytes is 5MB for sync, more for local).
        // Local storage is usually ~5-10MB, but let's keep it tidy.
        // This is a stub for future refinement.
    }

    /**
     * Clear all analysis cache.
     */
    async clearAll() {
        this.memoryCache.clear();
        const all = await storage.get(null);
        const cacheKeys = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            await storage.remove(cacheKeys);
        }
    }
}
