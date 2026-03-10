/**
 * Context Lens - Background Service Worker
 * Coordinates between content scripts, storage, and external analysis APIs.
 */

import { logger } from '../utils/logger.js';
import { storage } from '../utils/storage.js';
import { AnalysisEngine } from '../analysis/analysis-engine.js';
import { CacheManager } from './cache-manager.js';

const cache = new CacheManager();
let engine = null;

// Initialization
chrome.runtime.onInstalled.addListener(async (details) => {
    logger.info(`Context Lens v${chrome.runtime.getManifest().version} installed.`, details);

    // Set default settings on installation
    const defaults = {
        features: {
            aiProbability: true,
            sentiment: true,
            toxicity: true,
            summarization: true
        },
        display: {
            autoExpand: false,
            showConfidence: true,
            theme: 'auto'
        },
        advanced: {
            analysisMode: 'api', // 'api' or 'local'
            apiKey: null,
            cacheEnabled: true,
            cacheTTL: 86400000 // 24 hours
        }
    };

    const existing = await storage.get('features');
    if (!existing || Object.keys(existing).length === 0) {
        await storage.set(defaults);
        logger.debug('Default settings initialized');
    }

    // Initialize engine
    const settings = await storage.get(null);
    engine = new AnalysisEngine({
        mode: settings.advanced?.analysisMode,
        apiKey: settings.advanced?.apiKey
    });
});

// Message Listener for Content Scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;

    logger.debug(`Background message received: ${type}`, { payload, sender });

    switch (type) {
        case 'ANALYZE_POST':
            handlePostAnalysis(payload).then(sendResponse);
            return true; // Use async sendResponse

        case 'GET_SETTINGS':
            storage.get(null).then(sendResponse);
            return true;

        case 'SAVE_SETTINGS':
            // Update engine configuration on settings change
            engine = new AnalysisEngine({
                mode: payload.advanced?.analysisMode,
                apiKey: payload.advanced?.apiKey
            });
            storage.set(payload).then(() => {
                sendResponse({ success: true });
            });
            return true;

        case 'CLEAR_CACHE':
            cache.clearAll().then(() => {
                sendResponse({ success: true });
            });
            return true;

        default:
            logger.warn(`Unknown message type: ${type}`);
            sendResponse({ error: 'UNKNOWN_MESSAGE_TYPE' });
            break;
    }
});

/**
 * Handle analysis for a single post.
 * Coordinates between cache and analysis engine.
 */
async function handlePostAnalysis(postData) {
    const { postId, text } = postData;
    logger.info(`Processing analysis for: ${postId}`);

    try {
        // 1. Initialize Engine if needed (e.g. after service worker wake-up)
        if (!engine) {
            const settings = await storage.get(null);
            engine = new AnalysisEngine({
                mode: settings.advanced?.analysisMode,
                apiKey: settings.advanced?.apiKey
            });
        }

        // 2. Check Cache
        const settings = await storage.get(['advanced']);
        if (settings.advanced?.cacheEnabled) {
            const cachedResult = await cache.get(postId);
            if (cachedResult) {
                return { success: true, result: cachedResult };
            }
        }

        // 3. Perform Analysis via Engine
        const result = await engine.analyze(text, postId);

        const finalPayload = {
            post_id: postId,
            timestamp: new Date().toISOString(),
            analysis: result,
            metadata: {
                processing_time_ms: 150, // Simplified tracking
                model_version: "1.0.0",
                mode: engine.mode
            }
        };

        // 4. Cache Result
        if (settings.advanced?.cacheEnabled) {
            await cache.set(postId, finalPayload);
        }

        return { success: true, result: finalPayload };
    } catch (error) {
        logger.error(`Analysis failed for post ${postId}`, { error });
        return { success: false, error: error.message };
    }
}
