#!/bin/bash
# Setup WSL for Asset-Hatch MCP servers
set -e

echo "=== Setting up WSL for Asset-Hatch MCP servers ==="

# Navigate to project
cd /mnt/c/Users/Zenchant/Asset-Hatch

# Install Python 3.14 and uv if needed
echo "=== Ensuring Python 3.14 and uv are available ==="
uv python install 3.14 2>/dev/null || true
export UV_SYSTEM=1

# Setup mcp_agent_mail
echo "=== Setting up mcp_agent_mail ==="
cd mcp_agent_mail
uv sync 2>/dev/null || true

# Setup beads-mcp
echo "=== Setting up beads-mcp ==="
cd ../integrations/beads-mcp-repo/integrations/beads-mcp
uv sync 2>/dev/null || true

echo ""
echo "=== WSL Setup Complete ==="
echo ""
echo "To start MCP servers, run in WSL:"
echo "  1. Agent Mail (port 8765):"
echo "     cd /mnt/c/Users/Zenchant/Asset-Hatch/mcp_agent_mail"
echo "     uv run python -m mcp_agent_mail.cli run-server --port 8765"
echo ""
echo "  2. Beads MCP:"
echo "     cd /mnt/c/Users/Zenchant/Asset-Hatch/integrations/beads-mcp-repo/integrations/beads-mcp"
echo "     uv run python -m beads_mcp"
echo ""
