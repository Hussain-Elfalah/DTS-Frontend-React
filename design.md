# DTS Design System

Adapted from **cms-admin** (AlGhazaliGroup) for the Defect Tracking System frontend.  
Light-only monochrome corporate admin UI.

## Character

- Minimal black / white / gray surfaces
- Black primary actions (`#0a0a0a`)
- Red for destructive / danger (`#b42318`)
- Emerald / amber for success / warning status only
- No dark mode
- No blue brand accent

## Color tokens

| Token | Hex | Usage |
|-------|-----|--------|
| `background` | `#ffffff` | Page / shell background |
| `foreground` | `#0a0a0a` | Body text |
| `card` | `#ffffff` | Cards, panels |
| `primary` | `#0a0a0a` | Primary buttons, rings, active chrome |
| `primary-foreground` | `#ffffff` | Text on primary |
| `secondary` / `muted` / `accent` | `#f5f5f5` | Soft surfaces, hover fills |
| `muted-foreground` | `#6b6b6b` | Secondary labels, captions |
| `border` / `input` | `#e5e5e5` | Borders, input outlines |
| `destructive` / `danger` | `#b42318` | Delete, errors |
| `soft` | `#a3a3a3` | Soft borders / charts |
| Chart 1–5 | `#0a0a0a`, `#6b6b6b`, `#b42318`, `#a3a3a3`, `#404040` | Recharts |

Status (non-token Tailwind): success `emerald-*`, warning `amber-*`.

## Typography

- **Sans:** Geist Sans (fallback: ui-sans-serif, system-ui)
- **Mono:** Geist Mono
- Default UI: `text-sm`
- Page titles: `text-2xl font-bold tracking-tight`
- KPI values: `text-3xl font-bold tabular-nums`
- Nav group labels: `text-[10px] font-semibold uppercase tracking-widest text-muted-foreground`
- Footer: `text-xs text-muted-foreground`

## Radius & controls

| Token | Value |
|-------|--------|
| `radius-sm` | `0.25rem` |
| `radius-md` | `0.375rem` |
| `radius-lg` | `0.5rem` |
| `radius-xl` | `0.75rem` |

- Default control height: `h-9`
- Cards: `rounded-lg border border-border bg-card shadow-sm`
- Buttons: `rounded-md text-sm font-medium`
- Inputs: `h-9 rounded-md border-input shadow-sm focus:ring-1 focus:ring-ring`

## Layout shell

- Root: `flex h-screen overflow-hidden bg-background`
- Sidebar: fixed, width **240px** (`w-60`), white `bg-sidebar`, 1px `border-border` on inner edge
- Active nav (expanded): merges into content — `bg-background rounded-s-xl border-y border-s border-border`
- Inactive nav: `text-muted-foreground hover:bg-sidebar-accent`
- Header: sticky `top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md`
- Main: `flex-1 overflow-y-auto p-4 lg:p-6`
- Page rhythm: `space-y-6`
- Footer: `border-t border-border text-xs text-muted-foreground`

## Components

### Button
- **default:** `bg-primary text-primary-foreground hover:bg-primary/90`
- **outline:** `border border-border bg-transparent hover:bg-accent`
- **secondary / ghost:** muted / transparent fills
- **destructive:** `bg-destructive text-white`
- Sizes: default `h-9 px-4`, sm `h-8 text-xs`, lg `h-10`, icon `h-9 w-9`

### Input / label
- Input: border-input, ring-ring on focus, placeholder muted-foreground
- Label: `text-sm font-medium`

### Card
- `rounded-lg border border-border bg-card shadow-sm`
- Title: `font-semibold tracking-tight`
- Description: `text-sm text-muted-foreground`

### Table
- Header: `h-10 font-medium text-muted-foreground`
- Rows: `border-b border-border hover:bg-muted/50`
- Outer wrap: `rounded-lg border border-border`

### Badge
- `rounded-md px-2.5 py-0.5 text-xs font-medium`
- default: `bg-primary/15 text-primary border-primary/20`
- success / warning: emerald / amber at 15% bg
- destructive: destructive/15 pattern

### Dialog / overlay
- Overlay: `bg-black/60 backdrop-blur-sm`
- Content: `border-border bg-card p-6 shadow-2xl rounded-lg`

## Login

- Full viewport centered, `bg-background`
- Soft radial wash `#f5f5f5` → `#ffffff`
- Card `max-w-sm shadow-lg`
- Full-width primary CTA

## Dashboard

- KPI grid: `gap-4 sm:grid-cols-2 lg:grid-cols-3`
- KPI icon tile: `rounded-lg bg-primary/10`
- Quick links: bordered rows `border border-border p-3 hover:bg-muted/50`

## Rules for DTS

1. **No dark mode** — do not add `dark:` utilities or theme toggles.
2. Prefer semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`) over raw blue/slate.
3. Status colors only for domain status/severity, not chrome.
4. Keep motion subtle; prefer presence over decoration.
