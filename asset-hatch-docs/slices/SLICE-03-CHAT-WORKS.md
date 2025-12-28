# Slice 03: Send Chat Message, Get Response

## User Story
**As a user, I can type a message in the planning chat and see the AI agent respond.**

## What This Slice Delivers
- CopilotKit provider setup
- Chat interface component
- API route for CopilotKit
- Message display (user + assistant)
- Streaming responses

## Acceptance Criteria
- [ ] Chat input visible on planning page
- [ ] Type message, press Enter or click Send
- [ ] See my message appear in chat
- [ ] See agent response stream in (thinking indicator, then text)
- [ ] Can send multiple messages in conversation

## Files Created/Modified
```
app/
├── layout.tsx                      # MODIFY: Add CopilotKit provider
├── api/
│   └── copilotkit/
│       └── route.ts                # NEW: CopilotKit API handler
└── project/[id]/planning/
    └── page.tsx                    # MODIFY: Add chat interface

components/
└── planning/
    └── ChatInterface.tsx           # NEW: Chat UI component
```

## CopilotKit Setup

The agent doesn't have tools yet - that's Slice 04-06. This slice just gets conversation working.

## Prompt for AI Agent

```
Add CopilotKit chat to the planning page.

COPILOTKIT PROVIDER (app/layout.tsx):
- Import CopilotKit from @copilotkit/react-core
- Wrap the app in CopilotKit provider
- Set runtimeUrl to "/api/copilotkit"

API ROUTE (app/api/copilotkit/route.ts):
- Create POST handler for CopilotKit
- Use OpenRouter with model "google/gemini-3-pro-preview"
- Get API key from process.env.OPENROUTER_API_KEY
- Set up basic CopilotKit runtime
- NO TOOLS YET - just basic chat

Here's the structure:
```typescript
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";

export async function POST(req: Request) {
  const runtime = new CopilotRuntime();
  
  // Use OpenRouter endpoint
  const adapter = new OpenAIAdapter({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "google/gemini-3-pro-preview",
  });

  return runtime.streamHttpServerResponse(req, adapter);
}
```

CHAT INTERFACE (components/planning/ChatInterface.tsx):
- Use useCopilotChat hook from @copilotkit/react-core
- Display messages in scrollable container
- User messages aligned right, blue background
- Assistant messages aligned left, gray background
- Input field at bottom with Send button
- Show loading indicator while assistant is responding
- Auto-scroll to bottom on new message
- Use shadcn components (Card, Input, Button)

PLANNING PAGE (app/project/[id]/planning/page.tsx):
- Remove placeholder text
- Add ChatInterface component
- Make it take most of the page height

SYSTEM PROMPT:
Add a basic system prompt for the agent:
"You are a helpful game asset planning assistant. Help the user plan what assets they need for their game. Ask clarifying questions about their game type, art style, and what characters, environments, and items they'll need."

VERIFY:
1. Go to a project's planning page
2. Type "I want to make a farming game"
3. Press Enter
4. See your message appear
5. See agent start responding (streaming)
6. Agent asks follow-up questions about the game
```

## How to Verify

1. Navigate to project planning page
2. See chat input at bottom
3. Type "Hello, I want to make a platformer game"
4. Press Enter
5. Message appears in chat
6. Loading indicator shows
7. Agent response streams in
8. Response is relevant (asks about art style, characters, etc.)

## What NOT to Build Yet
- No tools (updateQuality, addEntityToPlan) - Slice 04-05
- No qualities dropdown - Slice 04
- No plan preview - Slice 05
- No conversation persistence - Slice 16

## Troubleshooting

If agent doesn't respond:
1. Check OPENROUTER_API_KEY is set in .env.local
2. Check console for API errors
3. Verify CopilotKit provider wraps the app

## Notes
- CopilotKit provider and API route configured
- Chat interface with streaming responses working
- System prompt for game asset planning assistant set


---

## Completion
- [x] Slice complete
- [ ] Committed to git
- Date: Dec 24, 2025
