---
title: "Part 10: The Foundation - Models and Money"
series: "Building Asset Hatch with AI Agents"
part: 10
date: 2025-12-30
updated: 2025-12-30
tags: [Infrastructure, Model Registry, Cost Tracking, Prompt Engineering, Flux.2]
reading_time: "8 min"
status: published
---

# Part 10: The Foundation - Models and Money

If the UI is the skin of Asset Hatch, and the sync logic is the nervous system, then the Model Registry is the cold, hard economic reality that keeps the lights on.

Welcome to Part 10. We're talking infrastructure, pricing, and the secret weight of words.

## The Model Registry: Why and How

As we scaled the generation phase, we hit a wall: tracking models. OpenRouter is great, but switching between "Fast Dev" and "Premium Pro" models manually was a recipe for disaster (and a very high credit card bill).

We paired to build a **centralized Model Registry**. It’s more than just a list; it’s a brain that knows:
- **Capabilities**: Can this model handle vision? Is it good at pixel art?
- **Pricing**: How many pennies per mega-pixel are we spending?
- **Route Switching**: Dynamically swapping between `flux.2-pro` for quality and `flux.2-pro` for speed during dev cycles.

It’s documented in **[ADR-018](https://github.com/zenchantlive/Asset-Hatch/blob/main/src/memory/adr/018-model-registry-and-cost-tracking.md)**, and it’s the reason why Asset Hatch can give you a cost estimate *before* you click Generate.

## The Cost Tracker (or, "The Heartbeat")

Every generation now heartbeats its actual cost back to the server via `/api/generation/sync-cost`. 

The challenge? **Syncing money.** We had to handle the split-brain between the client's immediate "Estimated" feedback and the server's authoritative "Actual" cost. We implemented a custom sync flow using Dexie and Prisma to ensure that even if you crash halfway through a batch, your project budget stays accurate.

## Prompt Engineering: The "First 5 Words" Rule

This was our biggest technical "Aha!" moment of the day.

We found that Flux.2 is incredibly sensitive to word order. After several "clean room" tests, we discovered the **High Weight Zone**. 

**The Discovery**: The first 5 words of your prompt carry roughly 50% of the visual intent. If you put "cinematic lighting" at the start, you get great light but a blurry cat. If you put "Isometric Cat Sprite" at the start, you get a cat.

We refactored `prompt-builder.ts` to follow a strict priority:
1. **Subject** (First 5 words)
2. **Pose**
3. **Style**
4. **Lighting**
5. **Perspective**

Now, the prompts are built like a surgical strike. No fluff, just results.

## Conclusion

Infrastructure isn't "sexy," but it's what makes a tool professional. By building the Registry and mastering the prompt weights, we moved from "AI Guesswork" to "Engineering Consistency."

Next, we tackle the AI's tendency to over-generate.

**Next:** [Part 11: The Safety Net, Security, and Singular Cats](11-the-safety-net-security-and-singular-cats.md)
**Previous:** [← Part 9: V2.1 - The UI Layer and The Split Brain](09-v2-1-ui-overhaul-chaos.md)

