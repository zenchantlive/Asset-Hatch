---
title: "Part 11: The Safety Net, Security, and Singular Cats"
series: "Building Asset Hatch with AI Agents"
part: 11
date: 2025-12-30
updated: 2025-12-30
tags: [Security, Zod, Prompt Engineering, Pluralize, Open Source]
reading_time: "6 min"
status: published
---

# Part 11: The Safety Net, Security, and Singular Cats

December 30th. The penultimate day of the year. While most people were thinking about champagne and resolutions, I was thinking about how to stop my AI from being "too helpful" and how to make it see.

Welcome to Part 11. It’s about the checks, the balances, and why singularization is harder than it looks.

## Style Anchors: Teaching the AI to See

The biggest challenge today was "Style Consistency." You can't just tell an AI "make it look like my other assets" and expect it to work. You have to feed it the actual DNA of your style.

We collaborated on the **Style Anchor system** (ADR-008). 
- We use **GPT-4o vision** to analyze user-uploaded reference images.
- It extracts specific keywords for lighting, colors, and brushwork.
- We even built a canvas-based color palette extractor.

Now, instead of a vague description, every prompt is injected with a "Style Anchor" payload that forces visual consistency. 

## The Safety Net: One Cat, Please

Then there was the "Singularization Crisis." 

Our AI has a tendency toward maximalism. You ask it for a "cat sprite," and it thinks, "You know what would be better? A cat, in a hat, on a mat, with a bat, in a 13-stage isometric animation sequence."

No. I just want the cat.

We implemented **The Safety Net** (ADR-014). We pulled in the `pluralize` library and wired it into the `prompt-builder.ts`. Now, the system looks at the AI's flowery descriptions and ruthlessly singularizes the subject.

**AI:** "A group of cheerful farmers tending to their crops in a sunny field."
**The Safety Net:** "A cheerful farmer."

It's the digital equivalent of a "Shut up and sit down" for AI creativity.

## Hardening the Hatch

With the open-source release looming, we spent the afternoon in a "Security Hardening" rabbit hole. 

- **Zod Guardians**: Every API route now has a Zod schema at the gate. If the data isn't shaped exactly like we expect, it doesn't get in.
- **OAuth Safety**: We audited the GitHub account linking logic to prevent race conditions.
- **Phase Consistency**: You can't skip from Planning to Export. The system now enforces the workflow phases strictly.

## Conclusion

Today was about control. Control over the style, control over the AI's plural-brain, and control over the security layer. We paved the way for the biggest UX overhaul of the project.

**Next:** [Part 12: The Third Dimension - Directions v3](12-the-third-dimension-directions-v3.md)
**Previous:** [← Part 10: The Foundation - Models and Money](10-the-foundation-models-and-money.md)
