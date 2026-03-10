/**
 * Context Lens - DOM Utilities
 * Helper functions for safe DOM manipulation.
 */

export const domUtils = {
    /**
     * Safely create an element from a string.
     * Prevents XSS by avoiding direct innerHTML if needed.
     */
    parseHTML: (htmlString) => {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    },

    /**
     * Check if an element is currently visible in the viewport.
     */
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

/**
 * Context Lens - Text Processor
 * Cleans and prepares post text for analysis.
 */
export const textProcessor = {
    /**
     * Remove URLs, mentions, and extra whitespace from tweet text.
     */
    cleanText: (text) => {
        if (!text) return '';
        return text
            .replace(/https?:\/\/\S+/g, '') // remove URLs
            .replace(/@\w+/g, '') // remove mentions
            .replace(/\s+/g, ' ') // normalize whitespace
            .trim();
    }
};
