---
title: "Part 15: The Mobile Pivot - Chat-First UX and Technical Debt"
series: "Building Asset Hatch with AI Agents"
part: 15
date: 2026-01-02
tags: [Mobile UX, Redesign, Technical Debt, React, TypeScript, Collaboration]
reading_time: "10 min"
status: published
---

# Part 15: The Mobile Pivot - Chat-First UX and Technical Debt

**The Date:** January 2, 2026
**The Problem:** The mobile experience was "awful."
**The Solution:** A complete architectural pivot for small screens.

## The split-screen trap

When we first built Asset Hatch, we were obsessed with the "50/50 split." It worked beautifully on my 32-inch monitor: chat on the left, live preview on the right. It felt futuristic.

Then I opened it on my phone.

It wasn't futuristic. It was a claustrophobic nightmare. The chat bubbles were three words wide. The asset preview was scaled down so much that "Warrior" looked like a green smudge. If the AI triggered a tool call to update the plan, the scroll position would jump, hiding the input box behind the keyboard.

We were trying to force a desktop paradigm into a vertical world.

## The Decision: Chat-First Navigation

We sat down and made a hard call: **The persistent split-screen is dead on mobile.**

Instead, we adopted what we're calling the **"Chat-First Overlay"** pattern. On a phone, the user is there to talk to the AI. That conversation deserves the full width of the screen.

### 1. The Slide-out Overlays
We moved the "Plan" and "Style" previews into dedicated, full-screen sliding panels. They stay tucked away behind prominent toolbar buttons until you need them. When you tap "Plan," it doesn't just scroll; it slides in a glassmorphism overlay that feels like a native mobile app.

### 2. The Context Switch Loop
But then we hit a "loop." If you're looking at the Style preview and you want to change it (e.g., "Make it more pixelated"), you have to:
1. Close the preview.
2. Type in the chat.
3. Open the preview again to see if it changed.
4. Repeat.

This was friction. So we introduced the **`CompactChatInput`**. Now, every preview panel has a streamlined AI input box at the bottom. You can talk to the AI *while* looking at the content it's generating.

## The Technical Debt Purge

While we were under the hood, we realized the codebase was starting to show some "AI fatigue." There were `any` types creeping into our generation context, and `<img>` tags were triggering Next.js lint warnings everywhere.

We spent three hours on a "comprehensive cleanup."

**The "Any" Hunt:**
We found a particularly nasty bit of logic in `GenerationLayoutContext.tsx` where we were bypassing TypeScript to handle asset states. We replaced it with strict `ActionMode` and `AssetApprovalStatus` enums. No more "trust me, it's a string" coding.

**Next.js Image Migration:**
We migrated every single asset preview to the official `<Image />` component. This sounds easy until you realize we're dealing with dynamic data URLs from Flux.2. We had to implement a custom `unoptimized` strategy to handle the real-time generated blobs without breaking the build.

## Finalizing the Identity

To top it off, we finally standardized the "Asset Hatch" branding. No more placeholder text. We created a proper SVG logo system with the Aurora theme baked in, ensuring that whether you're on a desktop or a phone, the app feels premium.

## Lessons from the Pivot

1. **Don't scale, pivot.** Trying to scale a desktop UI for mobile is a recipe for frustration. Change the navigation paradigm entirely.
2. **Contextual AI is better AI.** Don't make the user leave the content to talk about the content.
3. **Lint is your friend, but AI forgets it.** AI agents are fast, but they love a cheeky `any` type to save time. You have to be the one to enforce the standards.

---

**Next:** [Part 16: Reflections - What I Actually Learned](16-reflections-lessons-learned.md)

**Previous:** [← Part 14: The Privacy Pivot - BYOK and Browser Storage](14-the-privacy-pivot-byok-and-browser-storage.md)
