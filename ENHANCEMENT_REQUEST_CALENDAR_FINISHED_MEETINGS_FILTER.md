# Enhancement Request: Filter Out Finished Meetings from Calendar Display

## Issue Description

Currently, the upcoming events card on the DashView dashboard shows all calendar events (including meetings) regardless of whether they have already finished. This creates visual clutter and reduces the usefulness of the "upcoming events" display, as users may see meetings that have already concluded.

## Current Behavior

**File**: `custom_components/dashview/www/lib/ui/UpcomingEventsManager.js`

- Fetches calendar events for the next 7 days (lines 80-84)
- Displays the next 3 events by start time (line 223)
- Shows all events regardless of current time vs. event end time
- No filtering for completed/finished events

## Requested Enhancement

**Requirement**: Filter out meetings/events that have already finished from the upcoming events display on the front page.

### Specific Changes Needed

1. **Time-based Filtering**: 
   - Events that have already ended should not appear in the upcoming events list
   - Only show events that are currently ongoing or will start in the future

2. **Smart Meeting Detection**:
   - Apply this filtering specifically to meeting-type events
   - Consider all-day events differently (they should show for the entire day)
   - Regular timed events should be filtered based on their end time

3. **Real-time Updates**:
   - The filtering should work with the existing 5-minute update interval
   - Events should disappear from the list as they finish

### Implementation Approach

**Key areas to modify in `UpcomingEventsManager.js`:**

1. **Event filtering logic** (around line 222-223):
   - Add filtering before the `.slice(0, 3)` operation
   - Filter out events where `current_time > event_end_time`

2. **Event end time extraction** (new method needed):
   - Extract end time from event data structure
   - Handle different event formats (dateTime vs date)
   - Account for all-day events

3. **Filter logic** (new method needed):
   - Check if event has ended
   - Preserve all-day events for the current day
   - Handle timezone considerations

### Technical Details

**Event Data Structure** (from API):
- Events have both `start` and `end` properties
- Format can be `{ dateTime: "..." }` or `{ date: "..." }`
- All-day events use `date` format, timed events use `dateTime`

**Current Time Utilities Available**:
- Time utilities available in `/www/lib/utils/time-utils.js`
- Existing date comparison methods in the manager

### Expected Outcome

- Users will only see truly "upcoming" events in the front page card
- Finished meetings will automatically disappear from the list
- The display will be more relevant and useful for planning ahead
- All-day events will continue to show for the entire day they occur

### Backward Compatibility

- No breaking changes to existing API
- Existing calendar popup functionality remains unchanged
- Configuration and admin panel remain the same
- Only affects the filtering logic in the main dashboard display

### Test Cases

1. **Finished timed meeting**: Should not appear in upcoming events
2. **Ongoing meeting**: Should continue to appear until it ends
3. **Future meeting**: Should appear normally
4. **All-day event**: Should appear for the entire day
5. **Multi-day event**: Should be handled appropriately for ongoing days

---

**Priority**: Medium
**Component**: Frontend - UpcomingEventsManager
**Estimated Effort**: Small - primarily involves adding event filtering logic
**Files to Modify**: `custom_components/dashview/www/lib/ui/UpcomingEventsManager.js`