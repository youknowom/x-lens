/**
 * Context Lens - Main Content Script
 * entry point for initializing the extension functionality on X.com.
 */

import { logger } from '../utils/logger.js';
import { PostDetector } from './post-detector.js';
import { UIRenderer } from './ui-renderer.js';

class ContextLens {
    constructor() {
        this.detector = new PostDetector();
        this.renderer = new UIRenderer();
        this.settings = null;
        this.initialized = false;
    }

    /**
     * Initialize the extension on the page.
     */
    async init() {
        if (this.initialized) return;

        logger.info('Initializing Context Lens for X...');

        try {
            // 1. Fetch settings from background
            this.settings = await this.getSettings();

            // 2. Start Post Detection
            this.detector.start((postData) => this.handleNewPost(postData));

            this.initialized = true;
            logger.info('Context Lens initialized successfully.');
        } catch (error) {
            logger.error('Failed to initialize Context Lens', { error });
        }
    }

    /**
     * Handle each detected post.
     */
    async handleNewPost(postData) {
        const { element, postId, text } = postData;

        // Check if analysis is disabled for this feature
        if (!this.settings?.features?.aiProbability &&
            !this.settings?.features?.sentiment &&
            !this.settings?.features?.toxicity) {
            return;
        }

        // 1. Inject the UI (Initial loading state)
        const panel = this.renderer.inject(element, postId, (id, p) => this.retryAnalysis(id, p, text));
        if (!panel) return;

        // 2. Request Analysis from Background
        this.requestAnalysis(postId, text, panel);
    }

    /**
     * Send analysis request to background.
     */
    async requestAnalysis(postId, text, panel) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ANALYZE_POST',
                payload: { postId, text }
            });

            if (response?.success) {
                this.renderer.update(panel, response.result);
            } else {
                this.renderer.setError(panel, response?.error || 'Analysis failed');
            }
        } catch (error) {
            logger.error(`Analysis request failed for ${postId}`, { error });
            this.renderer.setError(panel, 'Network error');
        }
    }

    /**
     * Retry analysis for a specific post.
     */
    async retryAnalysis(postId, panel, text) {
        logger.info(`Retrying analysis for post: ${postId}`);

        // Reset state to loading
        panel.dataset.state = 'loading';
        panel.querySelector('.cl-skeleton').style.display = 'block';
        panel.querySelector('.cl-error').style.display = 'none';

        await this.requestAnalysis(postId, text, panel);
    }

    /**
     * Helper: Get settings from background.
     */
    async getSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
                resolve(response || {});
            });
        });
    }
}

// Instantiate and Initialize
const instance = new ContextLens();

// Initialize on document idle or immediately if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    instance.init();
} else {
    document.addEventListener('DOMContentLoaded', () => instance.init());
}
