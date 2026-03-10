# 🛠️ Context Lens - Development & Debugging

## Repository Workflow

1. **Local Setup**: 
   - Ensure you are using Chrome 120+.
   - Load the `unpacked` extension from this root folder.
   - Use `npm install` for lints and tests (optional, most logic is vanilla).

2. **Analysis Updates**:
   - To add a new analysis module (e.g., Fact-Check), create a new file in `analysis/` and register it in `analysis-engine.js`.

3. **DOM Changes (X.com Resilience)**:
   - X.com uses dynamic React selectors. If detection stops working, update `content/post-detector.js` constants:
     - `TWEET_SELECTOR`: Root article tag.
     - `TEXT_SELECTOR`: Post content container.

---

## 🐞 Debugging Guide

### Inspecting the Service Worker
1. Go to `chrome://extensions/`.
2. Click **"service worker"** link on the Context Lens card.
3. Observe `logger.js` outputs in the console.

### Inspecting Content Scripts
1. Open X.com.
2. Open DevTools (F12).
3. Filter console for `[ContextLens]`.
4. Elements injected can be checked for `.context-lens-panel` in the DOM tree.

---

## 📈 Performance Monitoring
- **Chrome Performance Tab**: Use to record scrolls and check for `long tasks` caused by `MutationObserver`.
- **Memory Profiler**: Ensure `processedPosts` WeakSet and `CacheManager` memory map remain stable.
- **Network Tab**: Verify `api.anthropic.com` calls are rate-limited and cached.

---

## ✅ Quality Standards
- **ESLint**: Run for consistency.
- **Prettier**: Use for formatting.
- **JSDoc**: Document all business logic functions.
- **CSP Compliance**: Never use `eval()` or `new Function()`.
- **Vanilla Only**: No external libraries (except for possible ML models in `models/`).
