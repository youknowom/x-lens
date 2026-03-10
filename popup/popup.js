/**
 * Context Lens - Popup Script
 * Logic for managing extension settings and UI interactions.
 */

import { storage } from '../utils/storage.js';
import { logger } from '../utils/logger.js';

document.addEventListener('DOMContentLoaded', async () => {
    logger.info('Popup initialized');

    // 1. Load current settings
    const settings = await storage.get(null);
    if (settings) {
        populateUI(settings);
    }

    // 2. Setup Event Listeners
    setupListeners();
});

/**
 * Populate switches and inputs with current values.
 */
function populateUI(settings) {
    const { features, display, advanced } = settings;

    // Feature Toggles
    if (features) {
        document.getElementById('aiProbability').checked = !!features.aiProbability;
        document.getElementById('sentiment').checked = !!features.sentiment;
        document.getElementById('toxicity').checked = !!features.toxicity;
        document.getElementById('summarization').checked = !!features.summarization;
    }

    // Display Options
    if (display) {
        document.getElementById('autoExpand').checked = !!display.autoExpand;
        document.getElementById('theme').value = display.theme || 'auto';
    }

    // Advanced Options
    if (advanced) {
        document.getElementById('analysisMode').value = advanced.analysisMode || 'api';
        document.getElementById('apiKey').value = advanced.apiKey || '';
    }
}

/**
 * Setup UI event listeners for interactive buttons and toggles.
 */
function setupListeners() {
    // Save Settings Button
    document.getElementById('saveSettings').addEventListener('click', async () => {
        const settings = {
            features: {
                aiProbability: document.getElementById('aiProbability').checked,
                sentiment: document.getElementById('sentiment').checked,
                toxicity: document.getElementById('toxicity').checked,
                summarization: document.getElementById('summarization').checked
            },
            display: {
                autoExpand: document.getElementById('autoExpand').checked,
                theme: document.getElementById('theme').value
            },
            advanced: {
                analysisMode: document.getElementById('analysisMode').value,
                apiKey: document.getElementById('apiKey').value,
                cacheEnabled: true, // Internal default
                cacheTTL: 86400000 // Internal default (24h)
            }
        };

        // Save to storage
        const success = await storage.set(settings);
        if (success) {
            const btn = document.getElementById('saveSettings');
            const originalText = btn.innerText;
            btn.innerText = '✅ Saved!';
            btn.style.backgroundColor = '#00ba7c';
            btn.style.color = 'white';

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 2000);

            // Notify background worker of changes
            chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', payload: settings });
        }
    });

    // Clear Cache Button
    document.getElementById('clearCache').addEventListener('click', async () => {
        const btn = document.getElementById('clearCache');
        btn.innerText = 'Clearing...';

        // Notify background to clear cache
        chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (response) => {
            if (response?.success) {
                btn.innerText = 'Cache Cleared! (0 posts)';
                btn.disabled = true;
            }
        });
    });

    // Toggle API Key visibility based on analysis mode
    document.getElementById('analysisMode').addEventListener('change', (e) => {
        const group = document.getElementById('apiKeyGroup');
        group.style.opacity = e.target.value === 'api' ? '1' : '0.5';
        group.style.pointerEvents = e.target.value === 'api' ? 'auto' : 'none';
    });
}
