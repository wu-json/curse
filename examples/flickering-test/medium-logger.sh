#!/bin/bash

# Medium logger - generates logs every 500ms
counter=0
while true; do
  echo "[$(date '+%H:%M:%S')] Medium process log entry #$counter - Moderate logging rate"
  if [ $((counter % 3)) -eq 0 ]; then
    echo "[$(date '+%H:%M:%S')] Medium stderr message #$counter" >&2
  fi
  counter=$((counter + 1))
  sleep 0.5
done