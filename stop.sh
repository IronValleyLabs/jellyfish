#!/bin/bash
echo "🛑 Stopping Jellyfish..."
pkill -f "@jellyfish/memory" 2>/dev/null
pkill -f "@jellyfish/core" 2>/dev/null
pkill -f "@jellyfish/action" 2>/dev/null
pkill -f "@jellyfish/chat" 2>/dev/null
pkill -f "@jellyfish/vision" 2>/dev/null
echo "✅ All agents stopped"
