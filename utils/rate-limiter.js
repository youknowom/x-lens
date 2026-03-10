/**
 * Context Lens - Rate Limiter
 * Ensures API calls stay within specified limits.
 */

export class RateLimiter {
    constructor(maxCalls, timeWindow) {
        this.maxCalls = maxCalls;
        this.timeWindow = timeWindow; // ms
        this.calls = [];
    }

    /**
     * Check if a call is allowed.
     * @returns {boolean}
     */
    canCall() {
        const now = Date.now();
        // Remove expired call records
        this.calls = this.calls.filter(timestamp => now - timestamp < this.timeWindow);

        if (this.calls.length < this.maxCalls) {
            this.calls.push(now);
            return true;
        }
        return false;
    }

    /**
     * Get remaining calls in current window.
     */
    getRemaining() {
        const now = Date.now();
        this.calls = this.calls.filter(timestamp => now - timestamp < this.timeWindow);
        return this.maxCalls - this.calls.length;
    }

    /**
     * Wait for the next available slot.
     */
    async waitForSlot() {
        while (!this.canCall()) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}
