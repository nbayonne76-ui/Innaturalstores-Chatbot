#!/bin/bash
# Test your Anthropic API key

# Replace YOUR_KEY_HERE with your actual API key
API_KEY="YOUR_KEY_HERE"

curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 50,
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }'
