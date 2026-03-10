# 🔌 Context Lens Internal API Specification

## 1. Messaging Protocol (runtime.sendMessage)

The Content Script and Background Worker communicate via structured messages.

### Analyze Post
**From**: Content Script
**To**: Background Worker
```json
{
  "type": "ANALYZE_POST",
  "payload": {
    "postId": "123456789",
    "text": "Post content text..."
  }
}
```
**Response**:
```json
{
  "success": true,
  "result": {
    "analysis": { "ai_probability": { "score": 0.8 }, ... },
    "metadata": { "mode": "api", ... }
  }
}
```

### Get Settings
**From**: Popup or Content Script
**To**: Background Worker
```json
{ "type": "GET_SETTINGS" }
```
**Response**: Full settings object.

### Save Settings
**From**: Popup
**To**: Background Worker
```json
{
  "type": "SAVE_SETTINGS",
  "payload": { ...new settings... }
}
```

---

## 2. Storage Schema (chrome.storage.local)

### Settings Key
Key: `features`, `display`, `advanced`
- **Purpose**: Tracks user preferences and configuration.

### Cache Keys
Pattern: `analysis_[postId]`
- **Value**:
```json
{
  "result": { ...analysis result... },
  "cachedAt": 1710112345678
}
```

---

## 3. Analysis Module Interface (JavaScript)

Every analyzer module must implement:
```javascript
export class BaseAnalyzer {
  /**
   * @param {string} text - The input post text.
   * @returns {Object} result - Standardized analysis snippet.
   */
  async analyze(text) { ... }
}
```
Standardized Analysis Snippet:
```json
{
  "score": 0.0 - 1.0,
  "label": "level name",
  "indicators": ["tag1", "tag2"]
}
```
