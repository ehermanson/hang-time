# Gallery Feature PRD

## Overview

Allow users to create layouts with frames of different sizes/dimensions. Keep it simple—no drag/drop canvas interaction.

## Goals

- Support individual frame dimensions in a single layout
- Reuse existing spacing/distribution system
- Simple sidebar-based frame management
- Avoid UX complexity that killed the previous attempt

## Non-Goals

- Canvas drag/drop repositioning
- Collision detection / snap guides
- Free-form arbitrary positioning
- Multi-select / group operations

---

## Current State

Today, all frames share a single `frameWidth` / `frameHeight`. Layout is calculated assuming uniform sizes.

**Existing layout modes:**
- `grid` - NxM arrangement
- `row` - single horizontal row

---

## Proposed Design

### New Layout Mode: `gallery`

A new layout type alongside `grid` and `row`. Gallery mode:
- Treats frames as an **ordered list** with individual dimensions
- Arranges frames in a **single row** (horizontal) or **single column** (vertical)
- Uses existing spacing/distribution settings

### State Changes

```typescript
// New type - dimensions only, hanging is global
interface GalleryFrame {
  id: string
  width: number
  height: number
}

// Add to CalculatorState
galleryFrames: GalleryFrame[]
galleryDirection: 'horizontal' | 'vertical'
```

When `layoutType === 'gallery'`:
- Ignore `frameWidth`, `frameHeight`, `rows`, `cols`
- Use `galleryFrames` array for dimensions
- Use existing `hangingType`, `hangingOffset`, `hookInset` (shared across all frames)
- Use `galleryDirection` for arrangement direction
- Reuse existing: `hSpacing`, `vSpacing`, `hDistribution`, `vDistribution`, anchor settings

### Layout Algorithm

**Horizontal gallery (row of variable-sized frames):**
1. Frames arranged left-to-right in array order
2. Vertical alignment within row: align tops, centers, or bottoms (`galleryVAlign`)
3. Horizontal spacing: fixed gap OR distribution modes
4. Horizontal positioning: use existing `hAnchorType` / `hDistribution`

**Vertical gallery (column of variable-sized frames):**
1. Frames arranged top-to-bottom in array order
2. Horizontal alignment within column: align lefts, centers, or rights (`galleryHAlign`)
3. Vertical spacing: fixed gap OR distribution modes
4. Vertical positioning: use existing anchor settings

**Anchor reference:**
Anchoring (floor/ceiling/center/furniture) applies to the **bounding box** of the entire gallery, not individual frames. Calculate total bounds first, position the group, then place frames within.

### Sidebar UI

**Frame List Component:**
```
┌─────────────────────────────────┐
│ Gallery Frames                  │
├─────────────────────────────────┤
│ ☰ Frame 1    8" × 10"    [×]   │
│ ☰ Frame 2    5" × 7"     [×]   │
│ ☰ Frame 3    11" × 14"   [×]   │
├─────────────────────────────────┤
│         [+ Add Frame]           │
└─────────────────────────────────┘
```

- Drag handle (☰) for reordering within sidebar
- Click frame row to expand/edit dimensions
- Delete button per frame
- "Add Frame" creates new frame with default or last-used dimensions

**Expanded Frame Editor:**
```
┌─────────────────────────────────┐
│ ▼ Frame 1                       │
│   Width:  [8    ] in            │
│   Height: [10   ] in            │
│   Templates: [4×6][5×7][8×10]...│
└─────────────────────────────────┘
```

Note: Hanging type/offset configured globally (outside frame list), shared by all frames. Per-frame hanging is a future option.

**Direction Toggle:**
- Horizontal (row) / Vertical (column)

**Alignment Setting:**
- For horizontal: align tops / centers / bottoms
- For vertical: align lefts / centers / rights

### Preview Rendering

No changes to rendering logic—`FramePosition[]` output is already flexible. Calculation layer produces positions, preview draws them.

### URL Persistence

Gallery frames as JSON-encoded query param:
```
?galleryFrames=[{"id":"1","width":8,"height":10,...},...]
```

Consider: compress with base64 if URL gets too long, or limit frame count.

---

## Scope Options

### Option A: Minimal (Recommended First)

- Gallery mode = horizontal row only
- Fixed spacing only (no distribution modes)
- Align centers vertically
- Max 8 frames
- Basic sidebar list with reorder

### Option B: Standard

- Horizontal + vertical directions
- All existing distribution modes
- Configurable alignment
- No hard frame limit

### Option C: Full (Future)

- Grid-like arrangements (wrap to multiple rows)
- Row-aware spacing (different spacing per row)
- Template layouts (salon wall, etc.)

---

## Implementation Phases

### Phase 1: Foundation
- Add `GalleryFrame` type
- Add gallery state fields to `CalculatorState`
- URL persistence for gallery frames
- Basic CRUD operations in `useCalculator`

### Phase 2: Calculation
- New `calculateGalleryPositions()` function
- Handle horizontal arrangement with fixed spacing
- Vertical center alignment

### Phase 3: Sidebar UI
- Frame list component
- Expand/collapse frame editor
- Drag-to-reorder (sidebar only, using existing dnd-kit)
- Add/remove frames

### Phase 4: Polish
- Direction toggle (horizontal/vertical)
- Alignment options
- Distribution mode support

---

## Decisions

1. **Frame limit** — Yes, cap at 8 frames for URL size / performance

2. **Default dimensions** — New frames inherit last frame's dimensions

3. **Hanging type** — Single type for all gallery frames (uses existing global settings). Per-frame hanging is future scope.

4. **Mode switching** — Gallery mode starts fresh. No auto-conversion from grid/row.

5. **Furniture interaction** — Same as current logic, no special handling for gallery

6. **Vertical positioning** — Use existing anchor system (floor/ceiling/center/furniture). Anchor reference is the **bounding box** of the entire gallery group. E.g., "57in from floor" means the bottom edge of the lowest frame is 57" up.

## Open Questions

None — ready to implement.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| URL too long with many frames | Limit frame count; compress encoding |
| Complex sidebar UX | Start with Option A (minimal) |
| Calculation edge cases | Extensive unit tests for layout math |
| Feature creep | Strict scope—no drag/drop, no free-form |

---

## Success Criteria

- User can create a layout with 3+ frames of different sizes
- Frames display correctly with proper spacing
- Measurements work for each frame
- URL sharing works
- No performance issues up to 8 frames
