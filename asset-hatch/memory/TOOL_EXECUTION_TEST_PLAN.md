# Tool Execution Testing & Verification Plan

**Created:** 2025-12-26
**Purpose:** Verify AI agent actually calls tools and updates UI state
**Status:** Ready for Testing

---

## The Goal

Transform the chatbot from **passive conversation** to **active asset planning agent** that:
1. ✅ Listens to user describe their game
2. 🔧 **ACTIVELY calls updateQuality** to fill quality parameters
3. 🔧 **ACTIVELY calls updatePlan** to build asset lists
4. 🔧 **ACTIVELY calls finalizePlan** when user approves

---

## Current Architecture

### Tool Flow (What SHOULD Happen)

```
┌─────────────────────────────────────────────────────────────┐
│ USER: "I want a pixel art platformer"                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ ChatInterface.tsx: sendMessage({ text: input })            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ API /api/chat: receives message, sends to gemini-3-pro     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ AI REASONING: "User wants pixel art... I should set that"  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ AI TOOL CALL: updateQuality(art_style="Pixel Art")         │
│ AI TOOL CALL: updateQuality(game_genre="Platformer")       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ API route executes tools, returns:                         │
│ { success: true, qualityKey: "art_style", value: "..." }   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend onToolCall fires                                  │
│ Console: "🔧 TOOL CALLED: updateQuality ..."               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ onQualityUpdate("art_style", "Pixel Art") called           │
│ Console: "📝 Planning page received quality update..."     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ setQualities({ ...prev, art_style: "Pixel Art" })          │
│ Console: "📊 Updated qualities: { art_style: '...' }"      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ QualitiesBar receives updated qualities prop               │
│ Dropdown for "Art Style" displays "Pixel Art" ✅            │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Scenarios

### Test 1: Quality Parameter Updates ✅ CRITICAL

**Test Goal:** Verify AI calls updateQuality and UI updates

**Steps:**
1. Start dev server: `bun dev` (in PowerShell)
2. Open browser DevTools Console (F12)
3. Navigate to a project's planning page
4. Type: **"I want a pixel art platformer"**
5. Watch console for logs

**Expected Console Output:**
```
🔧 TOOL CALLED: updateQuality { qualityKey: 'art_style', value: 'Pixel Art' }
✅ Updating quality: art_style → Pixel Art
📝 Planning page received quality update: art_style = Pixel Art
📊 Updated qualities: { art_style: 'Pixel Art' }

🔧 TOOL CALLED: updateQuality { qualityKey: 'game_genre', value: 'Platformer' }
✅ Updating quality: game_genre → Platformer
📝 Planning page received quality update: game_genre = Platformer
📊 Updated qualities: { art_style: 'Pixel Art', game_genre: 'Platformer' }
```

**Expected UI Changes:**
- [ ] "Art Style" dropdown shows "Pixel Art"
- [ ] "Game Genre" dropdown shows "Platformer"

**If NO console logs appear:**
- 🚨 **AI is NOT calling tools** - System prompt might not be effective
- Fix: Improve system prompt or test with different model

**If console logs appear but dropdowns don't update:**
- 🚨 **State update broken** - Callback chain has issue
- Fix: Check QualitiesBar props and state handling

---

### Test 2: Plan Generation ✅ CRITICAL

**Test Goal:** Verify AI calls updatePlan and preview pane updates

**Steps:**
1. Continue from Test 1 (after qualities are set)
2. Type: **"Create a list of assets I'll need"**
3. Watch console

**Expected Console Output:**
```
🔧 TOOL CALLED: updatePlan { planMarkdown: '# Asset Plan for...' }
✅ Updating plan, length: 1234 chars
📋 Planning page received plan update, length: 1234
```

**Expected UI Changes:**
- [ ] Right panel (PlanPreview) shows markdown content
- [ ] Should see headings like "Characters", "Environments", etc.
- [ ] "Approve Plan" button becomes clickable

**If NO updatePlan logs:**
- 🚨 **AI generated text response instead of using tool**
- Fix: Strengthen system prompt to REQUIRE tool usage

---

### Test 3: Plan Finalization ✅ CRITICAL

**Test Goal:** Verify finalizePlan saves to DB and navigates

**Steps:**
1. Continue from Test 2 (after plan is visible)
2. Type: **"This plan looks good, let's finalize it"**
3. Watch console and page navigation

**Expected Console Output:**
```
🔧 TOOL CALLED: finalizePlan {}
✅ Finalizing plan
(Then DB save logs and navigation)
```

**Expected Behavior:**
- [ ] Console shows finalizePlan tool called
- [ ] Page navigates to `/project/[id]/style`
- [ ] Plan saved to IndexedDB as entities.json
- [ ] Qualities saved to project record

---

## Debug Scenarios

### Scenario A: AI Responds with Text Only (No Tools)

**Symptom:** AI says "I'll set that to pixel art" but NO 🔧 log appears

**Diagnosis:** AI is not actually calling tools, just talking about it

**Solutions:**

1. **Test with explicit command:**
   ```
   User: "Execute updateQuality with art_style=Pixel Art"
   ```
   If this works → System prompt needs improvement
   If this DOESN'T work → Tool definitions might be broken

2. **Check tool definitions in API route:**
   - Tools have clear descriptions?
   - Parameters have .describe() annotations?
   - execute functions return properly?

3. **Try different model:**
   ```typescript
   model: openrouter('anthropic/claude-3.5-sonnet')
   // Instead of gemini-3-pro-preview
   ```
   Some models are better at tool calling

---

### Scenario B: Tools Called But UI Doesn't Update

**Symptom:** 🔧 logs appear but dropdowns stay empty

**Diagnosis:** Frontend state management issue

**Check:**
1. Does `📝 Planning page received...` log appear?
   - NO → onToolCall callback not wired up
   - YES → Check if setQualities actually updates state

2. Does QualitiesBar receive updated props?
   ```typescript
   // Add to QualitiesBar.tsx
   useEffect(() => {
     console.log('📊 QualitiesBar received qualities:', qualities);
   }, [qualities]);
   ```

3. Does Select component display value correctly?
   - Check if value prop matches option values

---

### Scenario C: Intermittent Tool Calls

**Symptom:** Sometimes tools are called, sometimes not

**Diagnosis:** AI behavior is probabilistic

**Solutions:**
1. Make system prompt MORE directive
2. Use examples in system prompt showing tool usage
3. Consider temperature=0 for more deterministic behavior
4. Use tool_choice parameter to force tool usage (if supported)

---

## System Prompt Analysis

Current system prompt strategy:
```
YOU ARE: Game Design Agent
BEHAVIOR: BE AGENTIC, BE ITERATIVE, BE TRANSPARENT
WORKFLOW: Understand → IMMEDIATELY call updateQuality → Draft with updatePlan
```

**Strengths:**
- ✅ Clear workflow
- ✅ Explicit instructions to call tools immediately
- ✅ Examples provided

**Potential Improvements:**

1. **Add explicit tool usage examples:**
   ```
   EXAMPLE CONVERSATION:
   User: "I want a pixel art platformer"
   You: [Call updateQuality(art_style="Pixel Art")]
        [Call updateQuality(game_genre="Platformer")]
        "I've set your art style to Pixel Art and genre to Platformer..."
   ```

2. **Make tool calling mandatory:**
   ```
   CRITICAL RULE: You MUST use updateQuality tool to set parameters.
   NEVER just mention a value - always call the tool.
   WRONG: "I recommend pixel art"
   RIGHT: [Call updateQuality] "I've set your style to pixel art"
   ```

3. **Add quality validation:**
   ```
   BEFORE CALLING updatePlan:
   - Ensure all 7 qualities are set using updateQuality
   - art_style, base_resolution, perspective, game_genre, theme, mood, color_palette
   ```

---

## Success Criteria

Planning Phase P1 is **TRULY COMPLETE** when:

- [ ] **Test 1 passes:** User says "pixel art platformer" → Dropdowns update automatically
- [ ] **Test 2 passes:** User asks for plan → Markdown appears in preview pane
- [ ] **Test 3 passes:** User approves → DB saves, navigation works
- [ ] **Consistency:** Tools called reliably (>90% of the time)
- [ ] **User Experience:** Clear feedback when tools execute

---

## Next Steps After Testing

### If Tests Pass ✅
1. Add visual feedback (toast notifications, animations)
2. Remove debug console.logs
3. Commit to main branch
4. Move to Style Anchor phase (Slice 5)

### If Tests Fail ❌
1. Identify which scenario matches failure mode
2. Apply diagnostic steps from Debug Scenarios
3. Iterate on system prompt or architecture
4. Re-test until success criteria met

---

## Tool Execution Enhancement Ideas

### Immediate Improvements
1. **Visual feedback when tools execute:**
   ```typescript
   onToolCall: ({ toolCall }) => {
     toast.success(`Updated ${toolCall.args.qualityKey}`);
     // Show animated checkmark on dropdown
   }
   ```

2. **Show AI thinking about tool calls:**
   ```typescript
   // Display in chat when tool is called
   if (part.type === 'tool-call') {
     return <ToolCallIndicator name={part.toolName} />;
   }
   ```

3. **Add undo functionality:**
   ```typescript
   const [qualityHistory, setQualityHistory] = useState([]);
   // Allow user to revert AI changes
   ```

### Future Enhancements
4. **Tool approval mode:**
   ```typescript
   // Ask user before executing tools
   onToolCall: async ({ toolCall }) => {
     const approved = await confirmDialog(`Update ${key}?`);
     if (approved) execute();
   }
   ```

5. **Batch tool execution feedback:**
   ```typescript
   // Show summary: "AI updated 3 qualities: Art Style, Genre, Theme"
   ```

---

## Understanding the Project Goal

**Asset Hatch Purpose:**
Generate complete game asset packs using AI, guided by natural conversation.

**User Journey:**
```
1. Planning (P1) ← WE ARE HERE
   - Chat about game concept
   - AI suggests/sets quality parameters
   - AI drafts asset list
   - User approves plan

2. Style Anchor (P2)
   - Upload reference images
   - AI extracts style
   - Generate style anchor image
   - User approves style

3. Generation (P3)
   - AI generates each asset
   - Uses style anchor as reference
   - Shows preview gallery
   - User reviews/regenerates

4. Export (P4)
   - Organize by category
   - Generate sprite sheets
   - Export as ZIP
   - User downloads
```

**Why Tool Execution Matters:**
Without working tools, Planning Phase P1 is just a chatbot.
WITH working tools, it becomes an AGENT that builds your asset plan FOR you.

This is the difference between:
- ❌ "Talk to AI about what you want"
- ✅ "AI actively builds your asset specification"

---

**Testing Status:** Ready to verify tool execution with Test 1-3
**Blocker:** Need to confirm tools are actually being called by AI
**Next Action:** Run Test 1 and check browser console for 🔧 logs
