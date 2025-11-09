# TradeaseAI Design Guidelines

## Design Approach
**System-Based Design** using Material Design principles adapted for construction industry professionals. Inspired by Linear's clean minimalism and Notion's information hierarchy, optimized for data-dense professional workflows.

## Typography System

**Font Stack:** Inter (primary) via Google Fonts CDN
- **Display (Hero/Headers):** 2xl to 4xl, font-semibold (600)
- **Page Titles:** xl to 2xl, font-semibold (600)
- **Section Headers:** lg to xl, font-medium (500)
- **Body Text:** base (16px), font-normal (400)
- **Supporting Text:** sm, font-normal (400)
- **Labels/Captions:** xs to sm, font-medium (500)

## Spacing System
**Tailwind Units:** Use 4, 6, 8, 12, 16, 24 as core spacing primitives
- Component padding: p-6, p-8
- Section spacing: mb-8, mb-12, mb-16
- Form field gaps: space-y-6
- Card spacing: p-6 or p-8
- Grid gaps: gap-6, gap-8

## Layout Architecture

### Admin Dashboard
**Two-Column Layout:**
- Sidebar: Fixed width (w-64), full height, contains navigation
- Main Content: flex-1, max-w-7xl centered with px-8 py-6
- Header Bar: Sticky top-0, h-16, contains user menu and breadcrumbs

### Public Form Pages
**Single-Column Centered:**
- Container: max-w-3xl, mx-auto, px-6, py-12
- Client branding (logo + company name) at top
- Form sections with clear visual separation using spacing

### Report View
**Document-Style Layout:**
- Container: max-w-4xl, mx-auto, px-8, py-8
- Report metadata grid at top (2-column on desktop)
- Full-width content sections below
- Image gallery: grid grid-cols-2 lg:grid-cols-3 gap-4

## Component Library

### Navigation (Admin Sidebar)
- Logo area: h-16, px-6, border-b
- Nav items: px-6, py-3, rounded-lg (within px-4 container), font-medium
- Icon + text layout with gap-3
- Active state: filled background, medium weight text

### Cards
- Border: border, rounded-lg
- Shadow: shadow-sm default, shadow-md on hover
- Padding: p-6 for content cards, p-4 for compact items
- Header within card: mb-4, font-semibold, text-lg

### Forms
**Field Structure:**
- Label: mb-2, text-sm, font-medium
- Input: h-10 or h-12, px-4, rounded-lg, border, w-full
- Textarea: p-4, rounded-lg, border, min-h-32
- Error text: text-sm, mt-1
- Helper text: text-sm, mt-1

**Form Layout:**
- Single column: space-y-6
- Two-column on desktop: grid grid-cols-2 gap-6
- Submit section: mt-8, pt-6, border-t

### Tables (Reports List)
- Container: border, rounded-lg, overflow-hidden
- Header: font-medium, text-sm, uppercase, tracking-wide, px-6, py-3
- Rows: px-6, py-4, border-t, hover:background
- Responsive: Convert to stacked cards on mobile (hidden lg:table-cell pattern)

### Buttons
**Sizes:**
- Primary: h-10, px-6, rounded-lg, font-medium
- Large: h-12, px-8, rounded-lg, font-medium
- Small: h-8, px-4, rounded-md, text-sm

**Variants:**
- Primary: filled with brand color variable
- Secondary: border, transparent background
- Ghost: transparent, no border, hover background

### Image Upload Zone
- Dropzone: border-2, border-dashed, rounded-lg, p-12, text-center
- Drop state: visual feedback with background shift
- Preview grid: grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5, gap-4
- Image previews: aspect-square, rounded-lg, overflow-hidden, relative

### Modals/Dialogs
- Overlay: fixed inset-0, backdrop blur
- Container: max-w-2xl, mx-auto, mt-20, rounded-xl, shadow-2xl
- Header: px-6, py-4, border-b
- Content: px-6, py-4
- Footer: px-6, py-4, border-t, flex justify-end gap-3

### Status Badges
- Size: inline-flex, px-3, py-1, rounded-full, text-xs, font-medium
- Success, Warning, Error states with appropriate visual weight

## Page-Specific Layouts

### Admin Login
- Centered card: max-w-md, mx-auto, mt-32
- Logo centered above card
- Form: space-y-6
- Single prominent submit button

### Client Management
- Header: flex justify-between items-center, mb-8
  - Title on left
  - "Add Client" button on right
- Client grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Each client card shows: logo (if present), company name, form slug, active status, action buttons

### Client Form (Add/Edit)
- Breadcrumb navigation at top
- Form sections clearly separated with spacing
- Logo upload: preview + upload button, max-w-xs
- Form slug: auto-generated preview shown
- Brand color picker: visual color selector
- Email list: dynamic add/remove inputs
- Action buttons: flex gap-3, "Cancel" + "Save" aligned right

### Public Report Submission Form
- Client branding header: logo (h-16) + company name (text-2xl, font-semibold), mb-12
- Form progress: Consider step indicator if multi-page
- Image upload section: prominent, visual
- Submit button: w-full or centered, large size
- Success state: centered message with checkmark icon, text-center

### Reports Dashboard
- Filters bar: flex flex-wrap gap-4, mb-6 (client selector, date range, status filter)
- Reports table with columns: Date, Client, Project, Status, Actions
- Action buttons: icon buttons for "View" and "Download PDF"
- Pagination at bottom: centered

### Report Detail View
- Header section: Project name (text-3xl), date, client logo
- Metadata grid: grid grid-cols-2 md:grid-cols-4, gap-4, mb-8
- AI Analysis sections: structured with clear headings (text-xl, mb-4)
- Image gallery: Full-width with lightbox capability
- Download PDF button: sticky at bottom or fixed in header

## Icons
**Library:** Lucide React (already in dependencies)
- Navigation icons: 20x20 (w-5 h-5)
- Action buttons: 16x16 (w-4 h-4)
- Large feature icons: 24x24 (w-6 h-6)

## Images
**Logo:** Client logos displayed in admin dashboard cards (h-12), in public form header (h-16), and in generated PDFs
**Site Photos:** Construction site images in report submissions - displayed in grid galleries and embedded in PDF reports

## Responsive Strategy
- Mobile-first approach
- Sidebar: off-canvas drawer on mobile (< lg)
- Tables: stack as cards on mobile
- Forms: single column on mobile, 2-column on md+
- Image grids: 2 cols on mobile, 3-4 cols on desktop

## Accessibility
- All form inputs have associated labels
- Focus states: ring-2 ring-offset-2 on interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML structure
- Keyboard navigation support for all interactive elements