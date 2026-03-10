/**
 * Context Lens - Post Detector
 * Monitors the DOM for X.com tweets and handles infinite scroll detection.
 */

import { logger } from '../utils/logger.js';

export class PostDetector {
    constructor(options = {}) {
        this.options = {
            debounceTime: 400,
            tweetSelector: 'article[data-testid="tweet"]',
            ...options
        };

        this.processedPosts = new WeakSet();
        this.observer = null;
        this.onPostDetected = null; // Callback for when a new post is found
        this.pendingMutations = false;
    }

    /**
     * Start monitoring the DOM.
     * @param {Function} callback - Function called with each detected tweet element.
     */
    start(callback) {
        if (this.observer) return;

        this.onPostDetected = callback;

        // Initial scan of the page
        this.scan();

        // Setup MutationObserver
        this.observer = new MutationObserver((mutations) => {
            if (!this.pendingMutations) {
                this.pendingMutations = true;
                // Debounce the scan to handle rapid DOM changes
                setTimeout(() => {
                    this.scan();
                    this.pendingMutations = false;
                }, this.options.debounceTime);
            }
        });

        // Observe body for changes
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        logger.info('PostDetector started monitoring DOM');
    }

    /**
     * Stop monitoring (Cleanup).
     */
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    /**
     * Scan for new tweets that haven't been processed yet.
     */
    scan() {
        const tweets = document.querySelectorAll(this.options.tweetSelector);

        tweets.forEach((tweet) => {
            if (this.shouldProcess(tweet)) {
                this.processPost(tweet);
            }
        });
    }

    /**
     * Determine if a tweet should be processed.
     * @param {HTMLElement} tweet
     */
    shouldProcess(tweet) {
        // 1. Check WeakSet for performance
        if (this.processedPosts.has(tweet)) return false;

        // 2. Check if it's a real tweet and has text/identity
        const hasText = tweet.querySelector('[data-testid="tweetText"]');
        if (!hasText) return false;

        // 3. Avoid already-injected lens (idempotency)
        if (tweet.querySelector('.context-lens-panel')) return false;

        return true;
    }

    /**
     * Extract data and notify listeners.
     */
    processPost(tweet) {
        this.processedPosts.add(tweet);

        try {
            const textElement = tweet.querySelector('[data-testid="tweetText"]');
            const text = textElement?.innerText || '';
            const userElement = tweet.querySelector('[data-testid="User-Name"]');
            const username = userElement?.innerText || 'Unknown';

            // Find post ID from the URL (usually in one of the links)
            const postLink = tweet.querySelector('a[href*="/status/"]');
            const postIdMatch = postLink?.href?.match(/\/status\/(\d+)/);
            const postId = postIdMatch ? postIdMatch[1] : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            if (this.onPostDetected) {
                this.onPostDetected({
                    element: tweet,
                    postId,
                    text,
                    username,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('Failed to extract tweet data', { error, tweet });
        }
    }
}
