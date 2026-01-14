# Agent Instructions

This project uses:
- **bd** (beads) for issue tracking
- **MCP Agent Mail** for multi-agent coordination

## Onboarding

```bash
bd onboard            # Get started with Beads
```

For Agent Mail, use `macro_start_session` at the start of each session.

---

## Beads Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

---

## Agent Mail Coordination

**Project Key:** `/mnt/c/Users/Zenchant/Asset-Hatch`
**Web UI:** `http://127.0.0.1:8765/mail`

### Session Startup

```python
# Bootstrap your session (registers identity, checks inbox)
macro_start_session(
  human_key="/mnt/c/Users/Zenchant/Asset-Hatch",
  program="claude-code",
  model="opus-4.5",
  task_description="What you're working on"
)
```

### Integrated Workflow (Beads + Agent Mail)

```
1. Pick work:       bd ready → choose bd-123
2. Reserve files:   file_reservation_paths(..., reason="bd-123")
3. Announce:        send_message(..., thread_id="bd-123", subject="[bd-123] Starting...")
4. Work:            Edit code, reply in thread with progress
5. Complete:        bd close bd-123
                    release_file_reservations(...)
                    send_message(..., subject="[bd-123] Completed")
```

### File Reservations

Before editing files, reserve them to signal intent to other agents:

```python
file_reservation_paths(
  project_key="/mnt/c/Users/Zenchant/Asset-Hatch",
  agent_name="YourAgentName",
  paths=["src/components/**/*.tsx"],
  ttl_seconds=3600,
  exclusive=true,
  reason="bd-123"
)
```

### Check Your Inbox

```python
fetch_inbox(
  project_key="/mnt/c/Users/Zenchant/Asset-Hatch",
  agent_name="YourAgentName",
  include_bodies=true
)
```

### Send Messages

```python
send_message(
  project_key="/mnt/c/Users/Zenchant/Asset-Hatch",
  sender_name="YourAgentName",
  to=["OtherAgent"],
  subject="[bd-123] Progress update",
  body_md="Completed the refactor. Ready for review.",
  thread_id="bd-123"
)
```

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Release file reservations** - Let other agents know you're done
   ```python
   release_file_reservations(
     project_key="/mnt/c/Users/Zenchant/Asset-Hatch",
     agent_name="YourAgentName"
   )
   ```
2. **File issues for remaining work** - Create issues for anything that needs follow-up
3. **Run quality gates** (if code changed) - Tests, linters, builds
4. **Update issue status** - Close finished work, update in-progress items
5. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
6. **Notify completion** - Send a handoff message if relevant
7. **Verify** - All changes committed AND pushed

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
- Always release file reservations when done

