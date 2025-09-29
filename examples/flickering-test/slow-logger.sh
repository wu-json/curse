#!/bin/bash

# Slow logger - generates logs every 2 seconds
counter=0
while true; do
  echo "[$(date '+%H:%M:%S')] Slow process log entry #$counter - This logs infrequently"
  counter=$((counter + 1))
  sleep 2
done