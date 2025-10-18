# Design Guidelines: Offline Store Management Application

## Design Approach: Enterprise Dashboard System

**Selected Approach:** Modern Business Intelligence Dashboard inspired by Linear's precision, Notion's information density, and Material Design's data visualization principles.

**Justification:** This is a utility-focused, data-intensive business application requiring clarity, efficiency, and professional aesthetics. The design prioritizes information hierarchy, quick scanning, and productive workflows over marketing appeal.

**Core Principles:**
- Information density balanced with breathing room
- Consistent visual language for data states (success, warning, error, neutral)
- Icon-first navigation with clear labeling
- Scannable layouts with strong visual hierarchy
- Professional, trustworthy aesthetic

---

## Color Palette

### Light Mode
**Primary Colors:**
- Primary Blue: 217 91% 60% (actions, links, active states)
- Primary Dark: 217 91% 35% (headers, emphasis)
- Background: 0 0% 98% (main canvas)
- Surface: 0 0% 100% (cards, panels)
- Border: 220 13% 91% (dividers, card borders)

**Semantic Colors:**
- Success Green: 142 71% 45% (stock available, completed)
- Warning Amber: 38 92% 50% (low stock alerts)
- Error Red: 0 84% 60% (out of stock, errors)
- Info Cyan: 199 89% 48% (informational states)

**Text Colors:**
- Primary Text: 220 13% 18%
- Secondary Text: 220 9% 46%
- Disabled Text: 220 9% 71%

### Dark Mode
**Primary Colors:**
- Primary Blue: 217 91% 70%
- Primary Dark: 217 91% 85%
- Background: 220 13% 9% (main canvas)
- Surface: 220 13% 13% (cards, panels)
- Border: 220 13% 21%

**Semantic Colors:**
- Success Green: 142 71% 55%
- Warning Amber: 38 92% 60%
- Error Red: 0 84% 70%
- Info Cyan: 199 89% 58%

**Text Colors:**
- Primary Text: 220 13% 98%
- Secondary Text: 220 9% 70%
- Disabled Text: 220 9% 46%

**Chart Colors (Both Modes):**
- Chart 1: 217 91% 60% (blue)
- Chart 2: 142 71% 50% (green)
- Chart 3: 271 81% 60% (purple)
- Chart 4: 38 92% 50% (orange)
- Chart 5: 340 82% 52% (pink)

---

## Typography

**Font Stack:**
- Primary: 'Inter', system-ui, -apple-system, sans-serif
- Monospace: 'JetBrains Mono', 'Courier New', monospace (for codes, SKU, prices)

**Type Scale:**
- Display: text-4xl font-bold (dashboard headings)
- H1: text-3xl font-semibold (page titles)
- H2: text-2xl font-semibold (section headers)
- H3: text-xl font-medium (card titles)
- H4: text-lg font-medium (subsections)
- Body Large: text-base font-normal (primary content)
- Body: text-sm font-normal (default text)
- Small: text-xs font-medium (labels, captions)
- Tiny: text-xs font-normal (metadata, timestamps)

**Monospace Usage:**
- SKU codes, barcodes: text-sm font-mono
- Prices, monetary values: text-base font-mono font-medium
- Invoice numbers: text-sm font-mono

---

## Layout System

**Spacing Primitives:**
Core spacing units: 2, 4, 6, 8, 12, 16, 24 (e.g., p-2, gap-4, space-y-6, p-8, py-12, px-16, mb-24)

**Grid Structure:**
- Dashboard: 12-column grid with 4-6 card layouts per row
- Forms: 2-column layout for efficiency (label left, input right)
- Tables: Full-width with fixed column widths for data alignment
- Sidebar: Fixed 280px width, collapsible to 72px (icon-only)

**Container Widths:**
- Max content width: max-w-screen-2xl (for large screens)
- Form containers: max-w-4xl
- Modal dialogs: max-w-2xl
- Sidebar panels: w-80 to w-96

**Responsive Breakpoints:**
- Mobile: < 768px (stacked layouts)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full multi-column grids)

---

## Component Library

### Navigation
**Top Bar:**
- Height: h-16
- Contains: Store logo/name, global search, notifications, user profile, theme toggle
- Background: Surface color with bottom border
- Fixed position with shadow on scroll

**Sidebar:**
- Collapsible navigation (expanded by default)
- Icon + label format
- Active state: Primary background with white text
- Hover state: Subtle background tint
- Sections: Dashboard, Products, Invoicing, Inventory, Customers, Sales, Reports, Staff, Settings

### Dashboard Cards
**Stat Cards (Quick Metrics):**
- Size: Consistent height (h-32 to h-36)
- Layout: Icon (top-left), Title, Large number (text-3xl font-bold), Change indicator (+/- with color)
- Background: Surface with subtle border
- Hover: Slight elevation (shadow-md)

**Chart Cards:**
- Padding: p-6
- Header: Title + Time filter dropdown
- Chart area: Responsive canvas using Chart.js or Recharts
- Min height: h-80

**List Cards (Alerts, Activities):**
- Item height: Consistent (h-16 to h-20)
- Icon badge on left (colored circle for status)
- Content: Primary text + secondary timestamp
- Action button on right

### Data Tables
**Structure:**
- Sticky header row (bg-surface, shadow on scroll)
- Alternating row backgrounds (subtle)
- Row height: h-14 (comfortable scanning)
- Cell padding: px-6 py-4
- Column headers: font-medium text-sm uppercase tracking-wide
- Sortable columns: Arrow indicator
- Hover row: Background tint + left border accent
- Action column: Fixed right with icon buttons

**Table Features:**
- Pagination: Bottom-right (10/25/50/100 per page)
- Search/Filter bar: Top of table
- Bulk actions: Checkbox column + action bar

### Forms
**Input Fields:**
- Height: h-12
- Padding: px-4
- Border radius: rounded-lg
- Border: 1px solid border color
- Focus state: Primary border + ring
- Error state: Red border + error message below
- Labels: text-sm font-medium mb-2

**Layout Pattern:**
- Label above input (stacked for mobile)
- Side-by-side for desktop forms (label 30%, input 70%)
- Field spacing: space-y-6
- Section dividers: border-t with label

**Special Inputs:**
- Barcode scanner: Input with scan icon button
- Image upload: Drag-drop zone or click-to-upload with preview
- Price inputs: Monospace font with currency symbol
- Date pickers: Calendar dropdown
- Multi-select: Chip-based selection

### Buttons
**Primary Actions:**
- Background: Primary blue
- Text: White
- Padding: px-6 py-3
- Rounded: rounded-lg
- Hover: Darker blue with shadow

**Secondary Actions:**
- Border: 1px solid border color
- Text: Primary text color
- Background: Transparent
- Hover: Surface background

**Icon Buttons:**
- Size: w-10 h-10
- Padding: p-2
- Rounded: rounded-md
- Hover: Background tint

**Button Groups:**
- Segmented controls for view toggles (Table/Grid/Chart)
- Connected borders (first rounded-l, last rounded-r)

### Modals & Dialogs
**Standard Modal:**
- Max width: max-w-2xl
- Backdrop: Black with 50% opacity
- Content: Surface background, rounded-xl, shadow-2xl
- Header: pb-4 border-b
- Body: py-6 (scrollable if needed)
- Footer: pt-4 border-t with action buttons

**Slide-out Panels:**
- Width: w-96 to w-1/2
- Slide from right for details/forms
- Fixed height with overflow scroll

### Invoice Template
**Printable Layout:**
- A4 dimensions (210mm × 297mm simulation)
- Header: Store logo (left), Store details (right)
- Customer & Invoice info: 2-column grid
- Product table: Full width with columns (Item, Qty, Price, Tax, Total)
- Subtotals section: Right-aligned
- Footer: Payment details, notes, signature area
- Brand color accents (thin borders, section backgrounds)

### Charts & Visualizations
**Chart Types:**
- Line charts: Revenue trends, sales over time
- Bar charts: Category comparisons, product performance
- Pie charts: Payment method breakdown, category distribution
- Donut charts: Stock status, customer types
- Stat cards with trend lines (sparklines)

**Chart Styling:**
- Grid lines: Subtle (border color)
- Axis labels: text-xs secondary text
- Tooltips: Surface background, shadow-lg, rounded
- Legend: Horizontal bottom or vertical right
- Responsive: Maintain aspect ratio

### Status Indicators
**Badges:**
- Stock status: Small rounded-full px-2.5 py-0.5 text-xs
- Low stock: Warning amber background
- Out of stock: Error red background
- In stock: Success green background
- Expiring soon: Info cyan background

**Progress Bars:**
- Height: h-2
- Rounded: rounded-full
- Background: Border color
- Fill: Primary or semantic color based on status

---

## Animations

**Minimal, Purposeful Animations:**
- Page transitions: None (instant navigation for productivity)
- Modal entrance: Subtle fade-in (150ms)
- Dropdown menus: Slide-down (200ms)
- Loading states: Skeleton screens (no spinners)
- Data updates: Gentle highlight flash (300ms)
- Hover effects: Background color transition (150ms)

**Loading States:**
- Tables: Skeleton rows matching table structure
- Cards: Skeleton blocks matching content layout
- Buttons: Disabled state with subtle pulse

---

## Icon System

**Icon Library:** Heroicons (via CDN)
**Icon Sizes:**
- Navigation: w-6 h-6
- Card headers: w-5 h-5
- Table actions: w-4 h-4
- Status indicators: w-3 h-3

**Icon Usage:**
- Dashboard sections: Unique icon per module
- Status indicators: Colored icons (check, alert, info, error)
- Action buttons: Self-explanatory icons (edit, delete, print, export)

---

## Accessibility

**Dark Mode:**
- System toggle in top bar
- Persistent preference (localStorage)
- Consistent contrast ratios in both modes
- Form inputs maintain readability

**Keyboard Navigation:**
- Tab order follows visual hierarchy
- Focus indicators: Primary ring with offset
- Shortcut hints for power users (Ctrl+K for search, etc.)

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels for icon-only buttons
- Status announcements for dynamic updates

---

This design system creates a professional, efficient, and modern store management interface that prioritizes productivity and data clarity while maintaining visual appeal and consistency across all modules.