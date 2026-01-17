# Gallery Mode - Development Paused

## Status
**Paused** - January 2026

## What It Is
Gallery mode was intended to allow free-form placement of multiple frames with different sizes, enabling users to create gallery wall layouts by dragging and dropping frames on a wall preview.

## What Was Built
- Free-form frame positioning with drag-and-drop (using dnd-kit)
- Snapping system with:
  - Edge alignment (left, right, top, bottom)
  - Center alignment (horizontal and vertical)
  - Gap-based snapping (place frames with consistent spacing)
  - Furniture snapping (align to sofa/table edges)
  - Wall edge and center snapping
- Figma-style alignment guides (magenta lines showing alignments during drag)
- Multi-select with Shift+click
- Group dragging of selected frames
- Collision detection to prevent frame overlap
- Configurable snap gap spacing
- Auto-relayout when gap setting changes

## Why It's Being Paused

### UX Complexity
- The interaction model isn't intuitive enough yet
- Snapping behavior can feel unpredictable - frames sometimes land in unexpected positions
- The relationship between "snap gap" setting and actual frame positioning isn't clear to users
- No clear visual feedback for what snap targets are available before dropping

### Technical Issues
- Collision resolution when dropping near multiple frames can produce unexpected results
- The snapping algorithm prioritizes by distance, but sometimes a farther snap point would be more intuitive
- Group drag doesn't account for collisions of non-primary frames
- Performance concerns with many frames due to O(n^2) collision checks

### Missing UX Design
- No defined behavior for: What happens when wall is too small for all frames?
- No undo/redo for positioning
- No keyboard controls for fine-tuning position
- No alignment distribution tools (e.g., "space evenly")
- No templates or suggested layouts
- Unclear how measurements should work for free-form layouts (currently shows hook position for each frame, but no relationship measurements between frames)

## Files Involved
- `src/components/Preview/Preview.tsx` - Main drag-drop implementation, snapping logic, alignment guides
- `src/hooks/useCalculator.ts` - Gallery state management, frame CRUD, group operations
- `src/components/Sidebar/GalleryFramesList.tsx` - Frame list UI, settings
- `src/components/Sidebar/LayoutTypeSelector.tsx` - Layout type tabs (includes Gallery option)
- `src/types/index.ts` - GalleryFrame type, LayoutType union

## To Resume Development

### Recommended Next Steps
1. **Define UX first** - Create wireframes/prototypes for:
   - How snapping should feel (sticky? magnetic? preview-based?)
   - What visual feedback users need while dragging
   - How to handle edge cases (overlaps, out-of-bounds, too many frames)

2. **Consider alternative approaches**:
   - Template-based layouts instead of free-form
   - Constraint-based system ("Frame A is 2 inches right of Frame B")
   - Grid-based with snap-to-grid positioning

3. **Technical improvements needed**:
   - Better snap point prioritization (context-aware, not just distance)
   - Preview of snap result before dropping
   - Undo/redo stack
   - Keyboard nudging (arrow keys for fine control)

### Quick Win Alternative
Instead of full free-form, consider a "Row with different sizes" mode:
- Frames arranged in a horizontal row
- Each frame can have different dimensions
- Automatic centering and spacing
- Much simpler to implement and use

## How to Re-enable
The Gallery tab is currently visible in the Layout Type selector. To hide it while keeping the code:

```tsx
// In LayoutTypeSelector.tsx, change:
<TabsTrigger value="gallery" className="flex-1">Gallery</TabsTrigger>

// To:
{/* Gallery mode paused - see docs/GALLERY_MODE_PAUSED.md */}
{/* <TabsTrigger value="gallery" className="flex-1">Gallery</TabsTrigger> */}
```

## Related URLs
- dnd-kit documentation: https://dndkit.com/
- Figma's approach to smart guides: (reference for UX inspiration)
