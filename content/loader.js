/**
 * Context Lens - Loader
 * Dynamically imports the main content module.
 */
(async () => {
    try {
        const src = chrome.runtime.getURL('content/content.js');
        await import(src);
    } catch (error) {
        console.error('[ContextLens] Failed to load content script:', error);
    }
})();
