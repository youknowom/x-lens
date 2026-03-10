/**
 * Context Lens - UI Renderer
 * Responsible for creating and injecting the analysis panel into X.com posts.
 */

import { logger } from '../utils/logger.js';

export class UIRenderer {
    constructor() {
        this.template = `
      <div class="context-lens-panel" data-state="loading">
        <div class="cl-header">
          <div class="cl-icon">🔍</div>
          <div class="cl-title">Context Lens</div>
          <div class="cl-status">...</div>
          <div class="cl-toggle">▼</div>
        </div>
        
        <div class="cl-body">
          <div class="cl-skeleton">
            <div class="cl-skeleton-line"></div>
            <div class="cl-skeleton-line short"></div>
          </div>
          
          <div class="cl-content">
            <div class="cl-metric-group">
              <div class="cl-metric" id="ai-prob">
                <span class="cl-label">AI Probability:</span>
                <span class="cl-value">--%</span>
                <span class="cl-dots">●●●●●</span>
              </div>
              <div class="cl-metric" id="sentiment">
                <span class="cl-label">Sentiment:</span>
                <span class="cl-value">--</span>
              </div>
              <div class="cl-metric" id="toxicity">
                <span class="cl-label">Toxicity:</span>
                <span class="cl-value">--</span>
              </div>
            </div>
            
            <div class="cl-summary-box">
              <div class="cl-label">Summary:</div>
              <div class="cl-summary-text">...</div>
            </div>
          </div>
        </div>
        
        <div class="cl-error" style="display: none;">
          <span class="cl-error-msg">Analysis unavailable</span>
          <button class="cl-retry-btn">Retry</button>
        </div>
      </div>
    `;
    }

    /**
     * Inject the lens panel into a tweet element.
     * @param {HTMLElement} tweetElement - The tweet element from post-detector.
     * @param {string} postId - Unique ID of the post.
     * @param {Function} onRetry - Optional callback for the retry button.
     */
    inject(tweetElement, postId, onRetry) {
        // 1. Check if tweet element already has a lens
        if (tweetElement.querySelector('.context-lens-panel')) return null;

        // 2. Determine insertion point (usually below the tweet text)
        const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
        if (!textElement) return null;

        // 3. Create the container
        const container = document.createElement('div');
        container.className = 'context-lens-wrapper';
        container.innerHTML = this.template;
        container.dataset.postId = postId;

        // 4. Insert into DOM
        textElement.parentNode.insertBefore(container, textElement.nextSibling);

        const panel = container.querySelector('.context-lens-panel');
        const toggle = panel.querySelector('.cl-toggle');
        const header = panel.querySelector('.cl-header');

        // 5. Expand/Collapse Handling
        header.addEventListener('click', () => {
            const isCollapsed = panel.classList.toggle('collapsed');
            toggle.innerText = isCollapsed ? '▲' : '▼';
        });

        // 6. Retry Handling
        const retryBtn = panel.querySelector('.cl-retry-btn');
        retryBtn.addEventListener('click', () => {
            if (onRetry) onRetry(postId, panel);
        });

        return panel;
    }

    /**
     * Update the panel with analysis results.
     */
    update(panel, result) {
        if (!panel || !result) return;

        const { analysis } = result;
        panel.dataset.state = 'success';

        // Update AI Probability
        const aiProb = panel.querySelector('#ai-prob .cl-value');
        const aiDots = panel.querySelector('#ai-prob .cl-dots');
        const score = Math.round(analysis.ai_probability.score * 100);
        aiProb.innerText = `${score}%`;

        // Simple dot system logic
        const dotCount = Math.round((score / 100) * 5);
        let dots = '';
        for (let i = 0; i < 5; i++) {
            dots += (i < dotCount) ? '●' : '○';
        }
        aiDots.innerText = dots;

        // Apply color coding based on threshold
        if (score < 40) aiProb.classList.add('cl-green');
        else if (score < 70) aiProb.classList.add('cl-yellow');
        else aiProb.classList.add('cl-red');

        // Update Sentiment
        const sentiment = panel.querySelector('#sentiment .cl-value');
        sentiment.innerText = analysis.sentiment.primary.toUpperCase();

        // Update Toxicity
        const toxicity = panel.querySelector('#toxicity .cl-value');
        toxicity.innerText = analysis.toxicity.level.toUpperCase();
        if (analysis.toxicity.level !== 'none' && analysis.toxicity.level !== 'low') {
            toxicity.classList.add('cl-red');
        }

        // Update Summary
        const summary = panel.querySelector('.cl-summary-text');
        summary.innerText = analysis.summary;

        // Hide loading skeleton and show content
        panel.querySelector('.cl-skeleton').style.display = 'none';
        panel.querySelector('.cl-content').style.display = 'block';
    }

    /**
     * Set the panel to an error state.
     */
    setError(panel, message = 'Analysis unavailable') {
        if (!panel) return;
        panel.dataset.state = 'error';
        panel.querySelector('.cl-skeleton').style.display = 'none';
        panel.querySelector('.cl-content').style.display = 'none';
        panel.querySelector('.cl-error').style.display = 'flex';
        panel.querySelector('.cl-error-msg').innerText = message;
    }
}
