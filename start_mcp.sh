#!/usr/bin/env bash
# === AlsaniaMCP Safe-Start Wrapper ===

set -e
cd "$(dirname "$0")"

CONFIG_PATH="$PWD/config/a2a.json"
LOG_FILE="$PWD/mcp.log"

# Create default config if missing
if [ ! -f "$CONFIG_PATH" ]; then
  echo "⚠️  No a2a.json found — generating default..."
  mkdir -p "$(dirname "$CONFIG_PATH")"
  cat > "$CONFIG_PATH" <<EOF
{
  "mcpnyx-u": {
    "enabled": true,
    "peers": ["http://127.0.0.1:3057/mcp"],
    "timeout": 90000,
    "autoRetry": true,
    "strict": false
  }
}
EOF
fi

# Environment for MCP runtime
export PORT=8050
export TRANSPORT=http
export A2A_CONFIG_PATH="$CONFIG_PATH"
export A2A_STRICT=false

echo "🚀 Launching AlsaniaMCP on port 8050..."
echo "🔗 Using config: $CONFIG_PATH"
echo "🗒️  Logs: $LOG_FILE"
echo "------------------------------------"

# Run MCP and auto-restart on crash
while true; do
  npx -y @alsania-io/mcp@latest start -c ~/.mcp/config.json -v 2>&1 | tee -a "$LOG_FILE"
  echo "💥 MCP crashed or exited. Restarting in 3 s..."
  sleep 3
done
