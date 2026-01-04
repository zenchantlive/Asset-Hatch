---
title: "Part 13: The Great Migration - Neon and Prisma"
series: "Building Asset Hatch with AI Agents"
part: 13
date: 2026-01-01
updated: 2026-01-01
tags: [Database, Neon, Prisma, PostgreSQL, Migration, WSL2]
reading_time: "8 min"
status: published
---

# Part 13: The Great Migration - Neon and Prisma

January 1st, 2026. A new year, a new database. 

Yesterday, we celebrated finishing the core features. Today, we celebrated by ripping out the heart of the application and replacing it with something shinier, faster, and cloud-native.

Welcome to the **Great Database Migration**.

## Goodbye SQLite, Hello Neon

SQLite is wonderful for hacking things together, but as we started looking toward the "Open Source" and "Production" phases, we realized we needed a database that didn't live in a single `.db` file on my hard drive.

We chose **Neon Postgres**. Why?
1. **Serverless Scaling**: It scales to zero when I'm sleeping (and my wallet appreciates that).
2. **Branching**: I can branch my database like I branch my code.
3. **Prisma 7 Support**: The latest Prisma features work best with a robust Postgres backend.

## The Prisma 7 "Loop"

We didn't just switch databases; we upgraded to **Prisma 7.2.0**. And this is where the "New Year's Hangover" really hit.

In our setup, I run the dev server in **Windows PowerShell**, but the AI (Claude) operates in **WSL2**. This hybrid environment is usually fine, but Prisma 7 decided to be picky. 

The "Loop":
1. Update `schema.prisma`.
2. Run `prisma generate` in Windows.
3. Realize WSL2 can't see the generated client correctly.
4. Run `prisma generate` in WSL2.
5. Watch the dev server crash because of version mismatches.

We spent two hours chasing a `PrismaClientInitializationError` that only appeared when the sun was at a certain angle. The fix? A complete purge of `node_modules` and a strict synchronization of environments. 

> [!TIP]
> If you're building in a hybrid environment, pick ONE side for your database tools. Don't let your AI and your shell fight over who owns the generated client.

## Moving the Source of Truth

The migration wasn't just about the tech stack; it was about the *data*. We had to move our local SQLite tables into Neon's Postgres schema. 

Thanks to our **Layered Architecture** (Prisma = Server, Dexie = Client), the UI didn't even notice the change. The "Dual-Write" strategy we implemented in Part 5 paid dividends today. We swapped the Prisma adapter, updated the `DATABASE_URL`, and... it just worked.

## Conclusion

We’re now running on a production-grade backend. No more "where did my dev.db go?" scares. Just clean, serverless Postgres.

But as soon as we secured the backend, we realized we had a problem with the *images*. 

**Next:** [Part 14: The Privacy Pivot - IndexedDB and BYOK](14-the-privacy-pivot-byok-and-browser-storage.md)
**Previous:** [← Part 12: The Third Dimension - Directions v3](12-the-third-dimension-directions-v3.md)
