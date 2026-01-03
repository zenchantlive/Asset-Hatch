---
title: "Part 14: The Privacy Pivot - IndexedDB and BYOK"
series: "Building Asset Hatch with AI Agents"
part: 14
date: 2026-01-01
updated: 2026-01-01
tags: [Privacy, IndexedDB, Dexie, BYOK, Open Source, Security]
reading_time: "10 min"
status: published
---

# Part 14: The Privacy Pivot - IndexedDB and BYOK

If Part 13 was about the *where* (Postgres), Part 14 is about the *who*. Specifically: **Who owns the data?**

As we prepared to open-source Asset Hatch, we hit a philosophical wall. Do I really want to store 5,000 AI-generated images of "Cute Slime with a Top Hat" on my server? Do users want me to have their API keys?

The answer was a resounding **"No."**

## The "Image Bloat" Problem

Storing images as Blobs in a database is fine for a prototype. But for a production app, it’s a recipe for a massive cloud bill and a slow user experience. 

We made a radical decision: **Remove image storage from the server.**

Now, when an image is generated:
1. The server passes the raw image data back to the client.
2. The client saves it directly to **IndexedDB** (via Dexie).
3. The server only stores the *metadata* (prompt, timestamp, status).

Your images never live on my server. They live in your browser. It’s faster, it’s private, and it’s basically free for me (the host).

## BYOK: Bring Your Own Key

We also implemented a **Settings Page** for "Bring Your Own Key" (BYOK) support. 

Instead of routing everything through a central (and expensive) API proxy, users can now input their own **OpenRouter** or **Gemini** keys. 
- Keys are stored in the user's browser (local storage/indexedDB).
- They are only sent to the server for the duration of the request.
- They are NEVER persisted in our database.

## The "Browser Storage Warning"

This shift created a new UX challenge. If a user clears their browser cache, they lose their images. 

We added a subtle **Browser Storage Warning** in the header. It’s not an "Error"—it’s a reminder: "Hey, your assets are safe on your machine, but if you want to keep them forever, make sure you Export them!"

## Why This Matters for Open Source

By moving the "Heavy Lifting" (image storage) and the "Secret Keeping" (API keys) to the client, we’ve made Asset Hatch remarkably easy to deploy. You don't need a massive S3 bucket or a complex encryption service. You just need a standard web server.

We’ve turned a centralized "Service" into a decentralized "Tool."

## Conclusion

We’re lean, we’re private, and we’re ready. The infrastructure is solid. The privacy is baked in.

Now, it’s time to look back at the last 8 days and see what we actually built.

**Next:** [Part 15: The Mobile Pivot - Chat-First UX and Technical Debt](15-the-mobile-pivot-ux-redesign.md)
**Previous:** [← Part 13: The Great Migration - Neon and Prisma](13-the-great-migration-neon-and-prisma.md)
