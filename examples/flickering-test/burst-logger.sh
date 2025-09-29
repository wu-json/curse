#!/bin/bash

# Burst logger - generates bursts of logs followed by quiet periods
burst_counter=0
while true; do
  echo "[$(date '+%H:%M:%S')] === Starting burst #$burst_counter ==="

  # Generate 20 rapid log entries
  for i in {1..20}; do
    echo "[$(date '+%H:%M:%S')] Burst #$burst_counter - Entry $i of 20"
    if [ $((i % 5)) -eq 0 ]; then
      echo "[$(date '+%H:%M:%S')] Burst stderr entry $i" >&2
    fi
    sleep 0.05
  done

  echo "[$(date '+%H:%M:%S')] === Finished burst #$burst_counter ==="
  burst_counter=$((burst_counter + 1))

  # Wait 5 seconds before next burst
  sleep 5
done