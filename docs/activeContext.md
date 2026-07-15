# Active Context

## Current Focus
Reorganized UI with top tabs to separate Food and Weight tracking into distinct views. Weight per-day bug fixed.

## Recent Changes (July 15, 2026)

### 1. Top-tab navigation (Food / Weight)
- Added `<nav class="view-tabs">` right below the header
- Two tabs: **🍽️ Food** (default) and **⚖️ Weight**
- Only one view is visible at a time (`.view[hidden]` → `display: none`)
- Selected view is reflected in URL hash (`#food` or `#weight`) so refresh preserves state
- Tabs sync with `aria-selected` for accessibility

### 2. Per-day weight (bug fix)
- Weight now follows `state.selectedDate` — the same date the header date-nav controls for food
- `handleWeightSubmit` saves weight for the currently selected date, not always for "today"
- `renderWeightCard` displays the weight for the selected date (dash if not logged)
- Weight card header shows "Weight for [Today / Yesterday / Mon, Jul 14]"
- Input pre-fills with that day's weight (empty if no data), refreshes when date changes
- Delta compares selected-date weight vs. the most recent entry **strictly before** that date
- `refreshDataForDate(dateKey)` now also calls `renderWeightCard()` so switching days updates both views

### 3. Weight view layout
- Weight view contains only the weight card + monthly graph
- Larger weight display (2.25rem) and bigger graph (240px) since it has full width now
- Full-width Log button

### 4. UX polish
- Desktop breakpoint (>= 900px): container widens to 720px for the weight view — nothing squished
- Removed the previous "left column / right column" 2-col grid experiment; simpler single-column-per-view design
- Sticky-header (scroll pill) still lives in the food view only

### Files Modified
- `calorie-tracker/index.html` — Added `<nav class="view-tabs">` and wrapped content into `.view.view-food` and `.view.view-weight` containers. Weight card + graph moved into the weight view. Weight card gained a "Weight for X" label.
- `calorie-tracker/css/styles.css` — Added `.view-tabs`, `.view-tab`, `.view[hidden]`, `.view-weight` styling. Removed the old 2-col desktop grid.
- `calorie-tracker/js/app.js`:
  - Added `state.currentView` and `switchView(name)` function with URL-hash sync
  - `renderWeightCard` now reads `state.selectedDate` and shows date-specific weight + label
  - `handleWeightSubmit` saves for `state.selectedDate` (not `getTodayKey()`)
  - `refreshDataForDate` calls `renderWeightCard()` after food refresh
  - Tab click listeners in `setupEventListeners`
  - `init()` restores view from URL hash

## Next Steps
- Consider allowing edit/delete of a logged weight from the graph (click a dot)
- Persist "last opened view" between sessions (localStorage) instead of just URL hash
- Consider a "days logged" count in the weight stats row
- Not pushed to GitHub — user will review first

## Known Limitations
- kg only (no lbs toggle)
- No goal-weight line on the graph
- Sparkline needs ≥ 2 logged days
- Weight input replaces any previous value for that day (no "history of weigh-ins per day")