You are GPT-5.2. You are a senior front-end engineer building a production-grade UI in React + TypeScript using Vite.

GOAL
Build the code behind the attached designs:

1. “Personnel Profile” screen (top KPI tiles + activity feed + right panels + status banner)
2. “Badge Denial Breakdown” screen (donut chart + reason lists + recent denied table)

You MUST implement this without any external libraries (no chart libs, no UI libs, no date libs, no classnames libs). The code must work in a closed/offline environment.

HARD CONSTRAINTS

- Vite + React + TypeScript only.
- No external NPM packages except what Vite/React template includes.
- No network calls.
- No images fetched from the internet.
- All data is mocked locally and generated via deterministic functions.
- Provide complete runnable code: file structure + contents.
- No “pseudo-code”. This must compile.

PRIMARY UX TARGETS

- Modern, clean, “tactical/ops dashboard” feel.
- Dense but readable; use spacing, hierarchy, and restrained color.
- Must be responsive: desktop first, but should scale down to mobile gracefully.
- Accessibility: keyboard navigation, proper aria labels, focus states, sufficient contrast.
- Keep the UI “on-brand”: uniform styling, consistent spacing scale, consistent typography, consistent component patterns across both screens.

CLEAN ARCHITECTURE REQUIREMENTS (VERY IMPORTANT)

- Keep the codebase as clean and maintainable as possible.
- Break components down when it improves readability and reuse (but avoid over-engineering).
- Prefer small, focused components with clear props and strong types.
- Create shared primitives (Card/Panel, SectionHeader, StatRow, Pill/Badge, IconButton, Divider, etc.) and reuse them everywhere.
- Centralize styling decisions in a single token file (CSS variables) and keep components “thin”.
- Centralize formatting utilities (dates, numbers, percents) and reuse them everywhere.
- Avoid duplicated logic: build shared selectors/derivers for filtering, grouping, sorting.

DELIVERABLES

1. A Vite project UI implementation with:
   - App shell and routing-like screen switching (no router library): implement your own simple view state.
   - Two screens: Profile and Denial Breakdown
   - Shared components (KpiTile, Tabs, Table, Panel, BadgePill, StatusBanner, DonutChart, etc.)
   - Local mock data generator with multiple people.
2. Fake data MUST include (per person):
   - name (string)
   - anomalyScore (0–100 int)
   - isolationForestScore (float, e.g. 0–10 or 0–1; you pick but be consistent)
   - shannonEntropy (float)
   - approvedCount (int)
   - deniedCount (int)
   - scannerLocations list with counts (array of { locationId, displayName, count })
   - denialPercent (float 0–100)
   - uniqueDeviceRatio (float 0–1)
   - afterHoursRate (float 0–100 or ratio; consistent)
   - weekendRate (float 0–100 or ratio; consistent)
   - lastBadgeTimestamp (ISO string)
   - activeWindowLabel (e.g. “Last 30d”)
   - totalEvents (approved+denied)
   - denialReasons breakdown (array of { reason, count })
   - recentEvents list (array of event rows; see DATA MODEL section)
   - topFlags summary (e.g. After-Hours, New Location, Rapid Repeat, etc.)
3. Provide at least 8–15 fake people and allow switching between them (dropdown or list).

SCREENS (MATCH THE DESIGN INTENT)
A) PROFILE SCREEN
Header:

- Large name at top-left
- Top-right metadata row: “Last Badge: … | Active Window: Last 30d | Total Events: …”
  KPI tiles row (5 tiles like the screenshot):
- Anomaly Score (big number)
- Isolation Forest (score + percentile text)
- Shannon Entropy (value + label like “Unusually High”)
- Denied Rate (percent + compare to avg)
- After-Hours Rate (like “7/3” in the mock; you may present as “X scanners / Y dates” or similar)

Below KPI row:

- Tabs: All / Approved / Denied / After-Hours / Flagged
- A scrollable event feed grouped by date (like Jan 15, 2023; Jan 14, 2023)
- Each event row shows:
  time, scanner name, outcome pill (Approved/Denied), optional flag pills (After-Hours, New Location, Rapid Repeat)
- Right column:
  Panel 1: “Where Badged” list with top locations and counts
  Panel 2: “Badge Outcomes” summary (approved vs denied) + a small “Recent Denied Events” list

Bottom:

- Big status banner (“STATUS: DELINQUENT”) with short reasons (training overdue, high denied rate, rapid attempts, after-hours surge). Banner color should reflect severity.

B) DENIAL BREAKDOWN SCREEN
Header:

- “Badge Denial Breakdown”
- Top-right: “Last Badge: … | Total Denied Attempts: …”
  Body layout:
- Left: Donut chart showing denied attempts breakdown by reason. Center label shows total denied.
- Middle: Detailed Denial Reasons list with counts + percent
- “Top Flags” list (After-Hours etc.) with counts
- Right: Smaller mirrored panel (like the screenshot) for Denial Reasons + Top Flags (useful for compact view)
  Bottom:
- “Most Recent Denied Events” table with columns:
  Timestamp | Scanner | Denial Reason | Flags | (optional) an icon column (X)
- Table rows come from the same events list filtered to denied outcomes.

FUNCTIONAL REQUIREMENTS

- Data-driven rendering everywhere (no hardcoded rows).
- Tabs filter the event feed in Profile:
  - All: all events
  - Approved: outcome===approved
  - Denied: outcome===denied
  - After-Hours: hasFlag('After-Hours')
  - Flagged: has any flags
- Sorting: newest first
- Grouping by day: “Jan 15, 2023” sections
- Clicking a denied event can highlight it (pure UI state)
- Switch screens via top-level nav buttons: “Profile” and “Denial Breakdown”
- Switch person: dropdown
- Everything must be type-safe.

NO LIBRARIES NOTE (IMPORTANT)

- Donut chart MUST be implemented using SVG arcs that you compute yourself.
- Date formatting: implement a small utility (formatDate, formatTime).
- Percentile text: compute percentile rank from distribution of scores in your mocked dataset.
- No CSS frameworks: create your own CSS modules or plain CSS files.

TECHNICAL QUALITY BAR

- Clean architecture, small components, reusable styles.
- No “any” types.
- No runtime errors if a person has zero denied events.
- Handle empty states gracefully (e.g. no denied events => donut shows “No denies”).
- Keep CSS readable and consistent: use CSS variables, spacing scale, and focus states.
- Must compile with `npm run dev`.

DATA MODEL (YOU DEFINE BUT MUST SUPPORT ALL FIELDS)
Define strong TS types like:

- PersonProfile (core stats + lists)
- BadgeEvent (id, personId, timestamp, scannerId, scannerName, outcome, denialReason?, flags[], deviceId)
- DenialReason enum/string union
- FlagType enum/string union
- LocationStat
  You choose exact shapes but ensure it maps cleanly to UI.

MOCK DATA GENERATION
Create a deterministic generator:

- Use a seeded pseudo-random generator you implement (e.g. mulberry32) so the fake dataset is stable.
- Generate events across last 30 days.
- Ensure some people have:
  - high after-hours rate
  - high weekend rate
  - high entropy
  - higher denied rates
  - “new location” flag occurrences
- Ensure denial reasons include at least:
  - Expired Badge
  - Time Restricted
  - Invalid Entry Code
  - No Access
- Flags include at least:
  - After-Hours
  - New Location
  - Rapid Repeat
  - Training Overdue (can be a derived status rather than per-event)
    Compute derived metrics from the events:
- approvedCount, deniedCount
- denialPercent = denied / total \* 100
- uniqueDeviceRatio = unique devices / total events
- afterHoursRate = after-hours events / total \* 100
- weekendRate = weekend events / total \* 100
- scannerLocations counts from events
- topFlags counts from events
- shannonEntropy:
  - Compute entropy over scanner distribution for that person’s events.
  - Normalize/label it (e.g. low/medium/high).
- isolationForestScore:
  - Fake but plausible: derive from a weighted combo of denial rate, entropy, after-hours, new location, rapid repeat, uniqueDeviceRatio. Then scale.
- anomalyScore:
  - Convert isoForestScore into 0–100 (or compute separately), with a percentile label.

UNIFORM “ON-BRAND” STYLING SYSTEM (REQUIRED)
Create a brand system and enforce it everywhere:

- tokens.css: define all colors, spacing, radii, shadows, borders, typography sizes, z-index scale.
- Use semantic tokens (e.g. --bg, --panel, --text, --muted, --accent, --danger, --warn, --success).
- Use a consistent spacing scale (e.g. 4/8/12/16/24/32).
- Use a consistent radius (e.g. 10–14px) and shadow system.
- Every “panel/card” uses the same base component and CSS class.
- Every list uses the same row height + divider style.
- Every label/value row uses the same component.
- Every badge pill uses the same base component + variants.
- Keep typography consistent: system font stack only; define sizes with tokens.

UI STYLING GUIDELINES

- Use a dark header band and light content panels like the screenshot.
- Use “card” panels with subtle shadows and borders.
- KPI tiles should be high contrast with bold numbers.
- Use badge pills with colors:
  - Approved green
  - Denied red
  - After-Hours blue/gray
  - Flags orange/yellow
- Keep typography: system font stack only.
- Provide hover and active states.
- Provide mobile layout:
  - KPI tiles wrap
  - Right column stacks below feed
  - Denial Breakdown layout stacks: chart -> lists -> table

PROJECT STRUCTURE (REQUIRED)
Use something like:
src/
main.tsx
App.tsx
styles/
tokens.css
app.css
data/
seed.ts
mock.ts
metrics.ts
types.ts
utils/
format.ts
date.ts
math.ts
components/
layout/
AppShell.tsx
TopBar.tsx
ScreenHeader.tsx
ui/
Panel.tsx
KpiTile.tsx
Tabs.tsx
BadgePill.tsx
StatusBanner.tsx
DonutChart.tsx
Table.tsx
PersonSelect.tsx
IconButton.tsx
Divider.tsx
EmptyState.tsx
screens/
ProfileScreen.tsx
DenialBreakdownScreen.tsx
Explain how to run.

OUTPUT FORMAT (CRITICAL)

- Start with a short “How to run” section (commands only).
- Then provide each file path and its full contents in code blocks.
- Do NOT omit any file needed to run.
- Ensure imports are correct and compile.

EXTRA QUALITY CHECKS (MANDATORY)
After writing code, do a final pass validating:

- TypeScript types compile
- No unused imports
- No missing exports
- No runtime exceptions
- All components render with empty/edge datasets
- Tabs and filters work correctly
- The donut chart math is correct (no NaN when total=0)
- Render performance: useMemo for derived filtered/grouped lists; avoid recomputing heavy metrics on every render
- Consistent “on-brand” styling: no random one-off CSS; prefer tokens and shared classes
- Accessibility: keyboard focus visible, buttons have aria-labels where needed, tables have headers, color not the only indicator
