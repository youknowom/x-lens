/**
 * Context Lens - Analysis Engine
 * Coordination hub for multiple analysis modules.
 */

import { APIManager } from '../background/api-manager.js';
import { logger } from '../utils/logger.js';

export class AnalysisEngine {
    constructor(options = {}) {
        this.mode = options.mode || 'api'; // 'api' or 'local'
        this.apiKey = options.apiKey || null;
        this.apiManager = new APIManager(this.apiKey);
    }

    /**
     * Main entry point for post analysis.
     */
    async analyze(content, postId) {
        if (this.mode === 'api' && this.apiKey) {
            try {
                return await this.apiManager.analyze(content);
            } catch (error) {
                logger.warn('API analysis failed, falling back to local mode.', { error, postId });
                return await this.performLocalAnalysis(content);
            }
        } else {
            return await this.performLocalAnalysis(content);
        }
    }

    /**
     * Local heuristic analysis fallback.
     */
    async performLocalAnalysis(text) {
        // 1. Initial heuristics
        const aiProb = this.detectAIProbabilityHeuristic(text);
        const sentiment = this.detectSentimentHeuristic(text);
        const toxicity = this.detectToxicityHeuristic(text);
        const summary = this.generateSummaryHeuristic(text);

        return {
            ai_probability: aiProb,
            sentiment: sentiment,
            toxicity: toxicity,
            summary: summary,
            tone: "neutral",
            insights: {
                topic: "general",
                claim_type: "observation",
                requires_fact_check: false
            }
        };
    }

    /**
     * AI Probability: Detecting common AI patterns (simplified)
     */
    detectAIProbabilityHeuristic(text) {
        const indicators = [];
        let score = 0.2;

        // Check for repetitive structure
        if (text.split('. ').length > 3 && text.length > 200) {
            indicators.push("structured_text");
            score += 0.15;
        }

        // Check for "As an AI model" or similar common phrases
        const aiPhrases = ["in conclusion", "furthermore", "it is important to note", "delve into"];
        aiPhrases.forEach(p => {
            if (text.toLowerCase().includes(p)) {
                indicators.push("formal_transition");
                score += 0.1;
            }
        });

        return {
            score: Math.min(score, 0.95),
            confidence: 0.5,
            indicators
        };
    }

    /**
     * Sentiment: Simple keyword matching
     */
    detectSentimentHeuristic(text) {
        const positive = ["good", "great", "excellent", "awesome", "happy", "love", "agree"];
        const negative = ["bad", "terrible", "awful", "hate", "wrong", "disagree", "broken"];

        let posCount = 0;
        let negCount = 0;

        positive.forEach(w => { if (text.toLowerCase().includes(w)) posCount++; });
        negative.forEach(w => { if (text.toLowerCase().includes(w)) negCount++; });

        let primary = "neutral";
        if (posCount > negCount) primary = "positive";
        else if (negCount > posCount) primary = "negative";

        return {
            primary,
            score: 0.6,
            emotions: primary === "neutral" ? ["analytical"] : [primary]
        };
    }

    /**
     * Toxicity: Check for offensive content (simplified)
     */
    detectToxicityHeuristic(text) {
        const forbidden = ["offensive_word_stub", "toxicity_placeholder"]; // Placeholders
        let level = "none";
        let score = 0.05;

        forbidden.forEach(w => {
            if (text.toLowerCase().includes(w)) {
                level = "high";
                score = 0.85;
            }
        });

        return { level, score, categories: [] };
    }

    /**
     * Summary: Extract first sentence or truncate
     */
    generateSummaryHeuristic(text) {
        const sentences = text.trim().split(/[.!?]\s/);
        if (sentences.length > 0) {
            return sentences[0] + (sentences.length > 1 ? "..." : "");
        }
        return "No summary available.";
    }
}
