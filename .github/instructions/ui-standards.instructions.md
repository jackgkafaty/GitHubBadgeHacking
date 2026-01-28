# UI Standards & Component Guidelines

This document defines the standardized UI patterns for all pages and components in this application. Always follow these guidelines to ensure visual consistency across the app.

## Core Design Principles

- **Consistency first**: All similar elements must look and behave identically
- **Mobile-first responsive**: Design for mobile, enhance for larger screens
- **No text overflow**: All text must be properly truncated or wrapped
- **Uniform spacing**: Use consistent padding and margins throughout

## Form Components

### Input Component (`@/components/ui/Input`)

Standard text input styling:

```tsx
// Default styles (from Input.tsx):
- Padding: px-4 py-3
- Border radius: rounded-xl
- Width: w-full (always full width in forms)
- Focus: focus:ring-2 focus:ring-[#FF385C]
```

### Select Component (`@/components/ui/Select`)

**MUST match Input styling exactly:**

```tsx
// Required styles:
- Padding: px-4 py-3 (same as Input)
- Border radius: rounded-xl (same as Input)
- Width: w-full (always full width in form grids)
- Focus: focus:ring-2 focus:ring-[#FF385C] focus:border-transparent
- Text truncation: Add truncate class to prevent overflow
- Dropdown: max-h-60 overflow-y-auto for scrollable options
```

**Usage:**

```tsx
<Select
  value={value}
  onChange={setValue}
  options={options}
  aria-label="Select description"
/>
```

### Button Component (`@/components/ui/Button`)

- Primary action: Default variant
- Secondary action: `variant="outline"`
- Compact forms: `size="sm"`

## Page Layouts

### Container Structure

The dashboard layout handles the max-width container automatically:

```tsx
// Dashboard layout provides:
<main>
  <div className="max-w-screen-2xl mx-auto p-4 sm:p-6">{children}</div>
</main>
```

Individual pages should NOT add their own `p-4 sm:p-6` wrapper - the layout handles this.

### Responsive Column Visibility

Hide less important columns on smaller screens:

```tsx
// Hide on mobile, show on larger screens
<div className="hidden lg:block">...</div>  // Shows at 1024px+
<div className="hidden xl:block">...</div>  // Shows at 1280px+
```

### Form Filter Grids

Use responsive grid layouts that adapt to screen size:

```tsx
// 6-column responsive grid for filter forms
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
      Label
    </label>
    <Select ... />
  </div>
  {/* More columns */}
</div>
```

### Form Labels

- Font size: `text-xs` for compact forms, `text-sm` for standard forms
- Font weight: `font-medium`
- Color: `text-gray-700 dark:text-gray-300`
- Margin: `mb-1.5` below label
- Always use `truncate` to prevent overflow

## Text Overflow Prevention

### Required Classes

| Element Type   | Classes Required             |
| -------------- | ---------------------------- |
| Titles/Headers | `truncate`                   |
| Descriptions   | `truncate` or `line-clamp-2` |
| Table cells    | `truncate max-w-[width]`     |
| Form labels    | `truncate`                   |
| Select options | `truncate block`             |
| Long text      | `break-words` or `break-all` |

### Responsive Max Width for Text

```tsx
// Adaptive truncation
<span className="truncate max-w-50 sm:max-w-75 md:max-w-100 lg:max-w-125 xl:max-w-none">
  {text}
</span>
```

## Tables

### Standard Table Structure

```tsx
<Card>
  <div className="overflow-x-auto">
    <table className="w-full min-w-160">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="w-40 px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
            Column
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* rows */}
      </tbody>
    </table>
  </div>
</Card>
```

### Flex-based Table (for complex rows)

```tsx
<Card>
  <div className="overflow-x-auto">
    <div className="min-w-200">
      {/* Header Row */}
      <div className="flex items-center gap-6 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-32">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Column
          </span>
        </div>
        <div className="w-28 shrink-0">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Fixed Width
          </span>
        </div>
      </div>
      {/* Data Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <div className="flex items-center gap-6 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex-1 min-w-32">
            <p className="text-sm text-gray-900 dark:text-white truncate">
              Data
            </p>
          </div>
          <div className="w-28 shrink-0">
            <p className="text-sm text-gray-600 dark:text-gray-300">Value</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</Card>
```

### Table Header Style

- Font: `text-sm font-semibold` (not xs, not uppercase)
- Color: `text-gray-700 dark:text-gray-300`
- Padding: `px-4 py-4` for tables, `px-5 py-4` for flex-based
- No background color on header row
- Border: `border-b border-gray-200 dark:border-gray-700`

### Table Row Style

- Padding: `px-4 py-3` for tables, `px-5 py-4` for flex-based
- Hover: `hover:bg-gray-50 dark:hover:bg-gray-800/50`
- Dividers: `divide-gray-100 dark:divide-gray-800`

### Fixed Column Widths

Use Tailwind's spacing scale for consistent widths:

- Narrow columns: `w-20` (80px)
- Medium columns: `w-30` (120px), `w-40` (160px)
- Wide columns: No width constraint (flex to fill)

## Action Buttons

### Button Rows

```tsx
// Actions split left/right
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div className="flex flex-wrap items-center gap-2">
    <Button onClick={primaryAction} size="sm">
      Primary
    </Button>
    <Button variant="outline" onClick={secondaryAction} size="sm">
      Secondary
    </Button>
  </div>
  <div className="flex flex-wrap items-center gap-2">
    {/* Right-aligned actions */}
  </div>
</div>
```

## Status Indicators

### Live/Active Indicator

```tsx
<button
  onClick={toggle}
  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
    active
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
  }`}
>
  {active && (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
    </span>
  )}
  {active ? "Active" : "Inactive"}
</button>
```

## Cards

### Standard Card Layout

```tsx
<Card className="mb-6 p-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
        Title
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        Description
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0">{/* Actions */}</div>
  </div>
</Card>
```

## Responsive Breakpoints

Always use mobile-first responsive design:

```
Default    → Mobile phones
sm: 640px  → Small tablets, large phones
md: 768px  → Tablets
lg: 1024px → Laptops, small desktops
xl: 1280px → Desktops
2xl: 1536px → Large screens
```

## Color Conventions

### Brand Colors

- Primary: `[#FF385C]` (Airbnb-style red)
- Focus ring: `ring-[#FF385C]`

### Status Colors

- Success: `green-*` variants
- Warning: `yellow-*` / `amber-*` variants
- Error/Danger: `red-*` variants
- Info: `blue-*` / `cyan-*` variants

### Dark Mode

- Background: `dark:bg-gray-800`, `dark:bg-gray-900`
- Text: `dark:text-white`, `dark:text-gray-300`, `dark:text-gray-400`
- Borders: `dark:border-gray-700`

## Checklist for New Pages

When creating or modifying pages, verify:

- [ ] All Select components use the standard styling (matches Input)
- [ ] All form grids use responsive column layouts
- [ ] All text has overflow protection (truncate/line-clamp)
- [ ] Container has proper max-width and padding
- [ ] Tables have min-width and overflow-x-auto
- [ ] Buttons use consistent sizing within context
- [ ] Dark mode classes are present on all elements
- [ ] Mobile layout tested and functional
