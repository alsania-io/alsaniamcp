#!/bin/bash
mkdir -p backups
zip -r backups/mcp-$(date +%F-%H%M).zip alsaniamcp-merged
echo "💾 Backup created at backups/"
