# AskRosie Feature Spec: Community Feeling Prompt

## Agent Role

You are implementing a new feature for AskRosie, Crystal Bridges' app that lets visitors photograph an artwork and ask questions about it via chat (voice or text). This spec describes a **community-strengthening feature** to add on top of the existing photo-and-chat flow. Do not modify or remove the existing chat functionality — this feature is additive.

## Feature Overview

When a user photographs an artwork, two new elements should appear alongside the existing chat interface:

1. **A one-word feeling prompt**, shown immediately after the photo is taken.
2. **Animated word bubbles/clouds** showing how other visitors have described the same artwork, shown once the artwork has been identified.

Together, these turn a solitary Q&A interaction into a lightweight, ambient sense of shared experience — visitors see that others stood in the same spot and felt something too, without slowing down or cluttering the core chat experience.

---

## Part 1: "How does this artwork make you feel?" Prompt

### Placement & Timing
- Trigger immediately after the photo is captured/uploaded, before or in parallel with artwork identification.
- Position as a **small, non-blocking UI element** — top of screen or a corner (e.g., top-right chip/card), NOT a modal or full-screen interrupt.
- Must not block or delay the user from starting to type/speak in the main chat.

### Interaction
- Prompt text: **"How does this artwork make you feel? (one word)"**
- Input: a compact single-word text field or short set of tappable suggested-word chips (e.g., "peaceful," "curious," "unsettled," "joyful") plus a free-text option.
- Entirely **optional** — clearly skippable, no forced interaction, no repeated nagging if dismissed.
- On submit: brief, light confirmation (e.g., a subtle animation of the word "joining" the cloud — see Part 2) rather than a jarring success message.
- If the user dismisses or ignores it, it should quietly disappear after a short timeout or once the user starts actively chatting.

### Data Handling
- Store the submitted word associated with the artwork's identifier (not tied to personally identifying user info beyond whatever anonymous/session ID the app already uses).
- Words should be moderated/filtered before being surfaced publicly (basic profanity/abuse filtering at minimum).
- Consider light normalization (lowercase, trim whitespace, dedupe near-identical spellings) so the word cloud stays clean.

---

## Part 2: Community Word Cloud / Bubbles

### Trigger
- Appears once the artwork has been successfully identified (i.e., after the backend/vision model confirms which piece is being viewed).
- Should feel like a natural continuation of the "how does this make you feel" moment, not a separate disconnected feature.

### Visual Behavior
- Several word bubbles/clouds animate onto the screen with a heading such as **"Other people describe this work as…"**
- Words should be pulled from prior visitor submissions (Part 1 data) for that specific artwork.
- Animate in with a soft, floating/drifting motion (bubbles or clouds) — staggered entrance rather than all at once, to feel organic rather than like a data dump.
- Bubble size can optionally scale with frequency (more common words appear larger), similar to a classic word cloud, but keep it visually light — this is meant to feel warm and human, not like an analytics dashboard.
- Should not obstruct the chat interface; place it in a dedicated zone (e.g., a strip below the image, or a collapsible panel) that the user can minimize.

### Fallback Behavior
- If this is the first time the artwork has been scanned (no prior community words exist yet), show an inviting empty state instead of an empty cloud, e.g., "Be the first to share how this makes you feel," which loops back to Part 1's prompt.
- Set a minimum sample size threshold (e.g., don't show a cloud until at least 3–5 words are collected) to avoid a sparse, awkward-looking cloud for lightly-viewed works.

### Data Handling
- Query the most frequent/recent words submitted for the given artwork ID.
- Cap the number of bubbles shown at once (e.g., 6–10) to keep it visually clean; consider showing a "see more" or refreshing the set periodically.

---

## Design Principles to Preserve

- **Non-intrusive:** Neither element should slow down or compete with the primary chat experience — they are enhancements, not gates.
- **Optional participation:** No forced input; skipping should have zero friction.
- **Warm, human tone:** Visual and copy choices should feel inviting and communal, not clinical or gamified.
- **Anonymous by default:** No attribution of individual words to identifiable users in the UI.
- **Consistent with existing AskRosie visual language:** Match existing typography, color palette, and animation style already used in the chat interface.

## Suggested Implementation Order

1. Build the one-word capture UI and backend storage tied to artwork ID.
2. Add basic content moderation/filtering on submitted words.
3. Build the word-cloud/bubble retrieval endpoint (frequency-sorted, capped, filtered).
4. Build the animated bubble UI component with staggered entrance and empty/fallback states.
5. Wire the "submit word → cloud updates" flow so a user's own word can visibly (anonymously) join the cloud shortly after submission, reinforcing the sense of community contribution.
6. QA: test with zero prior data, sparse data, and high-volume data per artwork.
