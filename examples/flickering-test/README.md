# Flickering Test Example

This directory contains a test setup to reproduce and verify the fix for the flickering issue in the LogPreview component.

## Problem Description

The flickering issue occurred when:
1. Multiple processes were generating logs at different rates
2. The LogPreview component was re-rendering due to forced updates every second
3. Each re-render would fetch fresh log data, causing visual flickering when other processes were actively logging

## Test Setup

This example includes several processes that generate logs at different rates:

- **fast-logger**: Generates logs every 100ms (very rapid)
- **medium-logger**: Generates logs every 500ms (moderate)
- **slow-logger**: Generates logs every 2 seconds (slow)
- **burst-logger**: Generates bursts of 20 rapid logs, then waits 5 seconds
- **static-process**: A simple process that logs once and then sleeps

## How to Test

1. Navigate to this directory:
   ```bash
   cd examples/flickering-test
   ```

2. Run the test with curse:
   ```bash
   ../../dist/curse
   ```

3. **To reproduce the flickering issue** (if you want to test the old behavior):
   - Comment out the `useMemo` fix in `src/ui/components/LogTailPreview.tsx`
   - Rebuild the project
   - Run the test again

4. **To verify the fix works**:
   - Use the arrow keys or j/k to navigate between processes
   - Select the `static-process` or `slow-logger`
   - Observe that the log preview doesn't flicker even though `fast-logger` and `burst-logger` are generating logs rapidly
   - Press `l` or Enter to view detailed logs for the selected process

## What to Look For

### Before the Fix (Flickering Behavior)
- Log preview would flicker/flash when viewing static or slow processes
- Text would appear to "jump" or "refresh" visually even when the selected process wasn't generating new logs
- Most noticeable when the fast-logger or burst-logger were active

### After the Fix (Stable Behavior)
- Log preview remains stable when viewing processes that aren't actively logging
- Only updates when the selected process actually generates new log entries
- No visual flickering or unnecessary re-renders

## Technical Details

The fix uses `useMemo` in the `LogTailPreview` component to cache log data based on:
- The selected process
- The total number of lines in that process's log buffer
- The component height

This ensures logs are only re-fetched when they actually change for the selected process, preventing flickering caused by updates from other processes.