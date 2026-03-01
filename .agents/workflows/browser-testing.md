---
description: Browser testing policy — when to run browser verification
---

# Browser Testing Policy

## Rule
Do NOT automatically run browser verification (DOM reads, screenshots, browser subagent) after implementing changes. The user will test locally and provide feedback.

## When to Use Browser Tools
Only use browser tools when the user explicitly asks, e.g.:
- "verify it"
- "show me a recording"
- "check in the browser"
- "take a screenshot"

## Default Flow
1. Implement the requested code changes
2. Notify the user that changes are ready (hot-reload should pick them up)
3. Wait for user feedback via page feedback or chat
4. Fix issues based on user's feedback

## Exception
If the user is not running a local server and asks to verify, then start the server and use browser tools.
