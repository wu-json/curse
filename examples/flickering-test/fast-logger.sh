#!/bin/bash

# Fast logger - generates logs every 100ms to create rapid updates
counter=0
while true; do
  echo "[$(date '+%H:%M:%S')] Fast process log entry #$counter - This is generating logs very frequently"
  echo "[$(date '+%H:%M:%S')] Fast stderr message #$counter" >&2
  counter=$((counter + 1))
  sleep 0.1
done