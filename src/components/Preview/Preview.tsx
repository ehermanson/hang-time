import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core'
import { Minus, Plus, Maximize2, HelpCircle } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { GalleryFrame } from '@/types'
import { formatMeasurement, formatShort, toDisplayUnit } from '@/utils/calculations'
import { Button } from '@/components/ui/button'

interface PreviewProps {
  calculator: UseCalculatorReturn
}

interface DraggableFrameProps {
  frame: GalleryFrame
  scale: number
  padding: number
  pan: { x: number; y: number }
  isSelected: boolean
  isPrimary: boolean
  onSelect: (id: number, shiftKey: boolean) => void
  fmtShort: (val: number) => string
  previewPosition?: { x: number; y: number } | null
}

function DraggableFrame({
  frame,
  scale,
  padding,
  pan,
  isSelected,
  isPrimary,
  onSelect,
  fmtShort,
  previewPosition,
}: DraggableFrameProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: frame.id,
  })

  // When dragging, use the snapped preview position instead of raw transform
  const displayX = isDragging && previewPosition
    ? previewPosition.x
    : frame.x
  const displayY = isDragging && previewPosition
    ? previewPosition.y
    : frame.y

  const style: React.CSSProperties = {
    position: 'absolute',
    left: padding + pan.x + displayX * scale,
    top: padding + pan.y + displayY * scale,
    width: frame.width * scale,
    height: frame.height * scale,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 100 : isPrimary ? 10 : isSelected ? 5 : 1,
    // Add slight transition for snap effect (but not when first picking up)
    transition: isDragging ? 'left 0.05s ease-out, top 0.05s ease-out' : 'none',
  }

  const handleClick = (e: React.MouseEvent) => {
    onSelect(frame.id, e.shiftKey)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className="select-none"
    >
      {/* Shadow */}
      <div
        className="absolute bg-black/10"
        style={{
          left: 3,
          top: 3,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Frame body */}
      <div
        className={`absolute inset-0 border-2 ${isPrimary
          ? 'border-indigo-600 bg-indigo-50'
          : isSelected
            ? 'border-indigo-400 bg-indigo-50/70'
            : 'border-gray-800 bg-gray-50'
          } ${isDragging ? 'shadow-lg ring-2 ring-indigo-300' : ''}`}
      >
        {/* Inner mat */}
        <div
          className="absolute border border-gray-300"
          style={{
            left: '10%',
            top: '10%',
            width: '80%',
            height: '80%',
          }}
        />
        {/* Hook indicator */}
        <div
          className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          style={{
            left: '50%',
            top: frame.hangingOffset * scale,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Frame label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-gray-600 truncate px-1">
            {frame.name}
          </span>
        </div>
      </div>
      {/* Dimension labels */}
      <div
        className="absolute text-[10px] text-indigo-600 font-medium"
        style={{ top: -14, left: '50%', transform: 'translateX(-50%)' }}
      >
        {fmtShort(frame.width)}
      </div>
      <div
        className="absolute text-[10px] text-indigo-600 font-medium"
        style={{
          left: -6,
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          transformOrigin: 'center',
        }}
      >
        {fmtShort(frame.height)}
      </div>
    </div>
  )
}

export function Preview({ calculator }: PreviewProps) {
  const {
    state,
    layoutPositions,
    updateGalleryFramePosition,
    moveGalleryFrames,
    toggleFrameSelection,
  } = calculator

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 })

  // Zoom and pan state
  const [zoom, setZoom] = useState(1) // 1 = fit to view
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Track reference hook (shows wall measurements) and compare hook (shows distance from reference)
  const [referenceHook, setReferenceHook] = useState<{ frameId: number; hookIndex: number } | null>(null)
  const [compareHook, setCompareHook] = useState<{ frameId: number; hookIndex: number } | null>(null)

  const fmt = (val: number) => formatMeasurement(toDisplayUnit(val, state.unit), state.unit)
  const fmtShort = useCallback(
    (val: number) => formatShort(toDisplayUnit(val, state.unit), state.unit),
    [state.unit]
  )

  // Calculate dimensions - wall fits to available space (accounting for sidebar)
  const padding = 60
  const SIDEBAR_WIDTH = 360 // sidebar width + margin

  // Base scale: fits wall to available space
  const baseScale = useMemo(() => {
    // Account for sidebar overlap on the left
    const availableWidth = containerSize.width - SIDEBAR_WIDTH - padding * 2
    const availableHeight = containerSize.height - padding * 2

    // Fit wall to available space (scale to fit both dimensions)
    const scaleX = availableWidth / state.wallWidth
    const scaleY = availableHeight / state.wallHeight
    return Math.min(scaleX, scaleY, (containerSize.width - padding * 2) / state.wallWidth)
  }, [containerSize.width, containerSize.height, state.wallWidth, state.wallHeight])

  // Effective scale = base scale * zoom
  const scale = baseScale * zoom

  // Canvas fills the container, wall is positioned with pan offset
  const canvasWidth = containerSize.width
  const canvasHeight = containerSize.height

  // Handle canvas click to select hooks for measurement display
  // Regular click = set reference hook, Shift+click = set compare hook
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.layoutType === 'gallery') return // Gallery mode uses DOM elements

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const clickX = (e.clientX - rect.left) * dpr
    const clickY = (e.clientY - rect.top) * dpr

    const hookRadius = 12 // Slightly larger than visual for easier clicking
    const isShiftClick = e.shiftKey

    // Account for pan offset when calculating hook positions
    const offsetX = padding + pan.x
    const offsetY = padding + pan.y

    // Check if click is on any hook
    for (const frame of layoutPositions) {
      const hookX1 = offsetX + frame.hookX * scale
      const hookY = offsetY + frame.hookY * scale

      // Check first hook
      const dist1 = Math.hypot((clickX / dpr) - hookX1, (clickY / dpr) - hookY)
      if (dist1 <= hookRadius) {
        const hookData = { frameId: frame.id, hookIndex: 0 }
        if (isShiftClick && referenceHook) {
          // Shift+click: set as compare hook (if we have a reference)
          setCompareHook(hookData)
        } else {
          // Regular click: set as reference, clear compare
          setReferenceHook(hookData)
          setCompareHook(null)
        }
        return
      }

      // Check second hook if dual
      if (frame.hookX2 !== undefined) {
        const hookX2 = offsetX + frame.hookX2 * scale
        const dist2 = Math.hypot((clickX / dpr) - hookX2, (clickY / dpr) - hookY)
        if (dist2 <= hookRadius) {
          const hookData = { frameId: frame.id, hookIndex: 1 }
          if (isShiftClick && referenceHook) {
            setCompareHook(hookData)
          } else {
            setReferenceHook(hookData)
            setCompareHook(null)
          }
          return
        }
      }
    }

    // Click elsewhere clears selection (back to first hook default)
    setReferenceHook(null)
    setCompareHook(null)
  }, [state.layoutType, layoutPositions, scale, referenceHook, pan])

  // Track container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Alignment guide structure for Figma-style guides
  interface AlignmentGuide {
    type: 'top' | 'bottom' | 'centerY' | 'left' | 'right' | 'centerX'
    position: number // Y for horizontal lines, X for vertical lines
    start: number    // Start of the line (X for horizontal, Y for vertical)
    end: number      // End of the line
  }

  // Track alignment guides for visual feedback
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])

  // Check if two rectangles overlap
  const rectsOverlap = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
    gap: number
  ): boolean => {
    // Add gap to create a buffer zone
    return !(ax + aw + gap <= bx || bx + bw + gap <= ax ||
      ay + ah + gap <= by || by + bh + gap <= ay)
  }

  // Check if a position overlaps with any other frame
  const hasCollision = useCallback((
    frame: GalleryFrame,
    x: number,
    y: number,
    gap: number
  ): boolean => {
    for (const other of state.galleryFrames) {
      if (other.id === frame.id) continue
      if (rectsOverlap(x, y, frame.width, frame.height, other.x, other.y, other.width, other.height, gap)) {
        return true
      }
    }
    return false
  }, [state.galleryFrames])

  // Find the nearest valid position that doesn't overlap
  const resolveCollision = useCallback((
    frame: GalleryFrame,
    desiredX: number,
    desiredY: number
  ): { x: number; y: number; snapLinesX: number[]; snapLinesY: number[] } => {
    const gap = state.gallerySpacing

    // Clamp to wall bounds first
    let x = Math.max(0, Math.min(state.wallWidth - frame.width, desiredX))
    let y = Math.max(0, Math.min(state.wallHeight - frame.height, desiredY))

    // If no collision, check for optional alignment snaps
    if (!hasCollision(frame, x, y, gap)) {
      // Still apply alignment snaps (to wall center, other frame edges, etc.)
      const snapThreshold = 15
      const snapLinesX: number[] = []
      const snapLinesY: number[] = []

      // Wall center snap
      const wallCenterX = state.wallWidth / 2
      if (Math.abs(x + frame.width / 2 - wallCenterX) < snapThreshold) {
        x = wallCenterX - frame.width / 2
        snapLinesX.push(wallCenterX)
      }

      // Wall edge snaps
      if (Math.abs(x) < snapThreshold) {
        x = 0
        snapLinesX.push(0)
      } else if (Math.abs(x + frame.width - state.wallWidth) < snapThreshold) {
        x = state.wallWidth - frame.width
        snapLinesX.push(state.wallWidth)
      }

      if (Math.abs(y) < snapThreshold) {
        y = 0
        snapLinesY.push(0)
      } else if (Math.abs(y + frame.height - state.wallHeight) < snapThreshold) {
        y = state.wallHeight - frame.height
        snapLinesY.push(state.wallHeight)
      }

      // Check alignment with other frames (only if not causing collision)
      for (const other of state.galleryFrames) {
        if (other.id === frame.id) continue

        // Align left edges
        if (Math.abs(x - other.x) < snapThreshold) {
          const testX = other.x
          if (!hasCollision(frame, testX, y, gap)) {
            x = testX
            snapLinesX.push(other.x)
          }
        }
        // Align right edges
        if (Math.abs(x + frame.width - (other.x + other.width)) < snapThreshold) {
          const testX = other.x + other.width - frame.width
          if (!hasCollision(frame, testX, y, gap)) {
            x = testX
            snapLinesX.push(other.x + other.width)
          }
        }
        // Align top edges
        if (Math.abs(y - other.y) < snapThreshold) {
          const testY = other.y
          if (!hasCollision(frame, x, testY, gap)) {
            y = testY
            snapLinesY.push(other.y)
          }
        }
        // Align bottom edges
        if (Math.abs(y + frame.height - (other.y + other.height)) < snapThreshold) {
          const testY = other.y + other.height - frame.height
          if (!hasCollision(frame, x, testY, gap)) {
            y = testY
            snapLinesY.push(other.y + other.height)
          }
        }
      }

      return { x, y, snapLinesX, snapLinesY }
    }

    // There's a collision - find the nearest valid position
    interface ValidPosition {
      x: number
      y: number
      distance: number
      snapLineX?: number
      snapLineY?: number
    }

    const validPositions: ValidPosition[] = []

    // For each other frame, calculate valid positions adjacent to it
    for (const other of state.galleryFrames) {
      if (other.id === frame.id) continue

      // Position to the right of other frame
      const rightX = other.x + other.width + gap
      if (rightX + frame.width <= state.wallWidth) {
        // Try aligning tops
        const testY1 = other.y
        if (!hasCollision(frame, rightX, testY1, gap) && testY1 >= 0 && testY1 + frame.height <= state.wallHeight) {
          const dist = Math.hypot(rightX - desiredX, testY1 - desiredY)
          validPositions.push({ x: rightX, y: testY1, distance: dist, snapLineX: other.x + other.width, snapLineY: other.y })
        }
        // Try aligning bottoms
        const testY2 = other.y + other.height - frame.height
        if (!hasCollision(frame, rightX, testY2, gap) && testY2 >= 0 && testY2 + frame.height <= state.wallHeight) {
          const dist = Math.hypot(rightX - desiredX, testY2 - desiredY)
          validPositions.push({ x: rightX, y: testY2, distance: dist, snapLineX: other.x + other.width, snapLineY: other.y + other.height })
        }
        // Try keeping desired Y
        if (!hasCollision(frame, rightX, y, gap)) {
          const dist = Math.hypot(rightX - desiredX, 0)
          validPositions.push({ x: rightX, y, distance: dist, snapLineX: other.x + other.width })
        }
      }

      // Position to the left of other frame
      const leftX = other.x - frame.width - gap
      if (leftX >= 0) {
        const testY1 = other.y
        if (!hasCollision(frame, leftX, testY1, gap) && testY1 >= 0 && testY1 + frame.height <= state.wallHeight) {
          const dist = Math.hypot(leftX - desiredX, testY1 - desiredY)
          validPositions.push({ x: leftX, y: testY1, distance: dist, snapLineX: other.x, snapLineY: other.y })
        }
        const testY2 = other.y + other.height - frame.height
        if (!hasCollision(frame, leftX, testY2, gap) && testY2 >= 0 && testY2 + frame.height <= state.wallHeight) {
          const dist = Math.hypot(leftX - desiredX, testY2 - desiredY)
          validPositions.push({ x: leftX, y: testY2, distance: dist, snapLineX: other.x, snapLineY: other.y + other.height })
        }
        if (!hasCollision(frame, leftX, y, gap)) {
          const dist = Math.hypot(leftX - desiredX, 0)
          validPositions.push({ x: leftX, y, distance: dist, snapLineX: other.x })
        }
      }

      // Position below other frame
      const belowY = other.y + other.height + gap
      if (belowY + frame.height <= state.wallHeight) {
        const testX1 = other.x
        if (!hasCollision(frame, testX1, belowY, gap) && testX1 >= 0 && testX1 + frame.width <= state.wallWidth) {
          const dist = Math.hypot(testX1 - desiredX, belowY - desiredY)
          validPositions.push({ x: testX1, y: belowY, distance: dist, snapLineX: other.x, snapLineY: other.y + other.height })
        }
        const testX2 = other.x + other.width - frame.width
        if (!hasCollision(frame, testX2, belowY, gap) && testX2 >= 0 && testX2 + frame.width <= state.wallWidth) {
          const dist = Math.hypot(testX2 - desiredX, belowY - desiredY)
          validPositions.push({ x: testX2, y: belowY, distance: dist, snapLineX: other.x + other.width, snapLineY: other.y + other.height })
        }
        if (!hasCollision(frame, x, belowY, gap)) {
          const dist = Math.hypot(0, belowY - desiredY)
          validPositions.push({ x, y: belowY, distance: dist, snapLineY: other.y + other.height })
        }
      }

      // Position above other frame
      const aboveY = other.y - frame.height - gap
      if (aboveY >= 0) {
        const testX1 = other.x
        if (!hasCollision(frame, testX1, aboveY, gap) && testX1 >= 0 && testX1 + frame.width <= state.wallWidth) {
          const dist = Math.hypot(testX1 - desiredX, aboveY - desiredY)
          validPositions.push({ x: testX1, y: aboveY, distance: dist, snapLineX: other.x, snapLineY: other.y })
        }
        const testX2 = other.x + other.width - frame.width
        if (!hasCollision(frame, testX2, aboveY, gap) && testX2 >= 0 && testX2 + frame.width <= state.wallWidth) {
          const dist = Math.hypot(testX2 - desiredX, aboveY - desiredY)
          validPositions.push({ x: testX2, y: aboveY, distance: dist, snapLineX: other.x + other.width, snapLineY: other.y })
        }
        if (!hasCollision(frame, x, aboveY, gap)) {
          const dist = Math.hypot(0, aboveY - desiredY)
          validPositions.push({ x, y: aboveY, distance: dist, snapLineY: other.y })
        }
      }
    }

    // Also try wall edges as escape positions
    const wallPositions = [
      { x: 0, y: desiredY },
      { x: state.wallWidth - frame.width, y: desiredY },
      { x: desiredX, y: 0 },
      { x: desiredX, y: state.wallHeight - frame.height },
      { x: 0, y: 0 },
      { x: state.wallWidth - frame.width, y: 0 },
      { x: 0, y: state.wallHeight - frame.height },
      { x: state.wallWidth - frame.width, y: state.wallHeight - frame.height },
    ]

    for (const pos of wallPositions) {
      const clampedX = Math.max(0, Math.min(state.wallWidth - frame.width, pos.x))
      const clampedY = Math.max(0, Math.min(state.wallHeight - frame.height, pos.y))
      if (!hasCollision(frame, clampedX, clampedY, gap)) {
        const dist = Math.hypot(clampedX - desiredX, clampedY - desiredY)
        validPositions.push({ x: clampedX, y: clampedY, distance: dist })
      }
    }

    // Find the closest valid position
    if (validPositions.length > 0) {
      validPositions.sort((a, b) => a.distance - b.distance)
      const best = validPositions[0]
      const snapLinesX = best.snapLineX !== undefined ? [best.snapLineX] : []
      const snapLinesY = best.snapLineY !== undefined ? [best.snapLineY] : []
      return { x: best.x, y: best.y, snapLinesX, snapLinesY }
    }

    // Fallback: return original position (shouldn't happen in practice)
    return { x: frame.x, y: frame.y, snapLinesX: [], snapLinesY: [] }
  }, [state.galleryFrames, state.gallerySpacing, state.wallWidth, state.wallHeight, hasCollision])

  // Unified function to calculate snapped position and alignment guides
  const calculateSnappedPosition = useCallback((
    frame: GalleryFrame,
    desiredX: number,
    desiredY: number
  ): { x: number; y: number; guides: AlignmentGuide[] } => {
    const gap = state.gallerySpacing
    const snapThreshold = 20 // Increased for better detection
    const guides: AlignmentGuide[] = []

    // Start with clamped position
    let x = Math.max(0, Math.min(state.wallWidth - frame.width, desiredX))
    let y = Math.max(0, Math.min(state.wallHeight - frame.height, desiredY))

    // Track snap targets with their distances
    interface SnapTarget {
      value: number       // The x or y value to snap to
      distance: number    // How far from the current position
      guideType: AlignmentGuide['type']
      guidePosition: number
    }

    const xSnaps: SnapTarget[] = []
    const ySnaps: SnapTarget[] = []

    // Calculate frame edges at current position
    const frameLeft = x
    const frameRight = x + frame.width
    const frameTop = y
    const frameBottom = y + frame.height
    const frameCenterX = x + frame.width / 2
    const frameCenterY = y + frame.height / 2

    // === WALL SNAPS ===
    // Snap left edge to wall left
    if (Math.abs(frameLeft) < snapThreshold) {
      xSnaps.push({ value: 0, distance: Math.abs(frameLeft), guideType: 'left', guidePosition: 0 })
    }
    // Snap right edge to wall right
    if (Math.abs(frameRight - state.wallWidth) < snapThreshold) {
      xSnaps.push({ value: state.wallWidth - frame.width, distance: Math.abs(frameRight - state.wallWidth), guideType: 'right', guidePosition: state.wallWidth })
    }
    // Snap center to wall center X
    const wallCenterX = state.wallWidth / 2
    if (Math.abs(frameCenterX - wallCenterX) < snapThreshold) {
      xSnaps.push({ value: wallCenterX - frame.width / 2, distance: Math.abs(frameCenterX - wallCenterX), guideType: 'centerX', guidePosition: wallCenterX })
    }
    // Snap top edge to wall top
    if (Math.abs(frameTop) < snapThreshold) {
      ySnaps.push({ value: 0, distance: Math.abs(frameTop), guideType: 'top', guidePosition: 0 })
    }
    // Snap bottom edge to wall bottom
    if (Math.abs(frameBottom - state.wallHeight) < snapThreshold) {
      ySnaps.push({ value: state.wallHeight - frame.height, distance: Math.abs(frameBottom - state.wallHeight), guideType: 'bottom', guidePosition: state.wallHeight })
    }

    // === FURNITURE SNAPS ===
    if (state.furnitureWidth > 0 && state.furnitureHeight > 0) {
      const furnitureCenterX = state.wallWidth / 2 + state.furnitureX
      const furnitureLeft = furnitureCenterX - state.furnitureWidth / 2
      const furnitureRight = furnitureCenterX + state.furnitureWidth / 2
      const furnitureTop = state.wallHeight - state.furnitureHeight

      // Snap frame center to furniture center
      const toFurnitureCenterDist = Math.abs(frameCenterX - furnitureCenterX)
      if (toFurnitureCenterDist < snapThreshold) {
        xSnaps.push({ value: furnitureCenterX - frame.width / 2, distance: toFurnitureCenterDist, guideType: 'centerX', guidePosition: furnitureCenterX })
      }
      // Snap frame left to furniture left
      const toFurnitureLeftDist = Math.abs(frameLeft - furnitureLeft)
      if (toFurnitureLeftDist < snapThreshold) {
        xSnaps.push({ value: furnitureLeft, distance: toFurnitureLeftDist, guideType: 'left', guidePosition: furnitureLeft })
      }
      // Snap frame right to furniture right
      const toFurnitureRightDist = Math.abs(frameRight - furnitureRight)
      if (toFurnitureRightDist < snapThreshold) {
        xSnaps.push({ value: furnitureRight - frame.width, distance: toFurnitureRightDist, guideType: 'right', guidePosition: furnitureRight })
      }
      // Snap frame bottom to furniture top (with gap)
      const aboveFurniture = furnitureTop - gap
      const toAboveFurnitureDist = Math.abs(frameBottom - aboveFurniture)
      if (toAboveFurnitureDist < snapThreshold) {
        ySnaps.push({ value: furnitureTop - gap - frame.height, distance: toAboveFurnitureDist, guideType: 'bottom', guidePosition: aboveFurniture })
      }
    }

    // === OTHER FRAME SNAPS ===
    for (const other of state.galleryFrames) {
      if (other.id === frame.id) continue

      const otherLeft = other.x
      const otherRight = other.x + other.width
      const otherTop = other.y
      const otherBottom = other.y + other.height
      const otherCenterX = other.x + other.width / 2
      const otherCenterY = other.y + other.height / 2

      // === X-AXIS ALIGNMENT SNAPS ===
      // Align left edges (frame.left = other.left)
      const leftToLeftDist = Math.abs(frameLeft - otherLeft)
      if (leftToLeftDist < snapThreshold) {
        xSnaps.push({ value: otherLeft, distance: leftToLeftDist, guideType: 'left', guidePosition: otherLeft })
      }
      // Align right edges (frame.right = other.right)
      const rightToRightDist = Math.abs(frameRight - otherRight)
      if (rightToRightDist < snapThreshold) {
        xSnaps.push({ value: otherRight - frame.width, distance: rightToRightDist, guideType: 'right', guidePosition: otherRight })
      }
      // Align centers X
      const centerXDist = Math.abs(frameCenterX - otherCenterX)
      if (centerXDist < snapThreshold) {
        xSnaps.push({ value: otherCenterX - frame.width / 2, distance: centerXDist, guideType: 'centerX', guidePosition: otherCenterX })
      }
      // Align frame left to other center X
      const leftToCenterXDist = Math.abs(frameLeft - otherCenterX)
      if (leftToCenterXDist < snapThreshold) {
        xSnaps.push({ value: otherCenterX, distance: leftToCenterXDist, guideType: 'left', guidePosition: otherCenterX })
      }
      // Align frame right to other center X
      const rightToCenterXDist = Math.abs(frameRight - otherCenterX)
      if (rightToCenterXDist < snapThreshold) {
        xSnaps.push({ value: otherCenterX - frame.width, distance: rightToCenterXDist, guideType: 'right', guidePosition: otherCenterX })
      }

      // === X-AXIS GAP SNAPS ===
      // Snap frame to the RIGHT of other (frame.left = other.right + gap)
      const snapToRightOfOther = otherRight + gap
      const toRightDist = Math.abs(frameLeft - snapToRightOfOther)
      if (toRightDist < snapThreshold) {
        xSnaps.push({ value: snapToRightOfOther, distance: toRightDist, guideType: 'left', guidePosition: snapToRightOfOther })
      }
      // Snap frame to the LEFT of other (frame.right = other.left - gap, so frame.left = other.left - gap - width)
      const snapToLeftOfOther = otherLeft - gap
      const toLeftDist = Math.abs(frameRight - snapToLeftOfOther)
      if (toLeftDist < snapThreshold) {
        xSnaps.push({ value: otherLeft - gap - frame.width, distance: toLeftDist, guideType: 'right', guidePosition: snapToLeftOfOther })
      }

      // === Y-AXIS ALIGNMENT SNAPS ===
      // Align top edges
      const topToTopDist = Math.abs(frameTop - otherTop)
      if (topToTopDist < snapThreshold) {
        ySnaps.push({ value: otherTop, distance: topToTopDist, guideType: 'top', guidePosition: otherTop })
      }
      // Align bottom edges
      const bottomToBottomDist = Math.abs(frameBottom - otherBottom)
      if (bottomToBottomDist < snapThreshold) {
        ySnaps.push({ value: otherBottom - frame.height, distance: bottomToBottomDist, guideType: 'bottom', guidePosition: otherBottom })
      }
      // Align centers Y
      const centerYDist = Math.abs(frameCenterY - otherCenterY)
      if (centerYDist < snapThreshold) {
        ySnaps.push({ value: otherCenterY - frame.height / 2, distance: centerYDist, guideType: 'centerY', guidePosition: otherCenterY })
      }
      // Align frame top to other center Y
      const topToCenterYDist = Math.abs(frameTop - otherCenterY)
      if (topToCenterYDist < snapThreshold) {
        ySnaps.push({ value: otherCenterY, distance: topToCenterYDist, guideType: 'top', guidePosition: otherCenterY })
      }
      // Align frame bottom to other center Y
      const bottomToCenterYDist = Math.abs(frameBottom - otherCenterY)
      if (bottomToCenterYDist < snapThreshold) {
        ySnaps.push({ value: otherCenterY - frame.height, distance: bottomToCenterYDist, guideType: 'bottom', guidePosition: otherCenterY })
      }

      // === Y-AXIS GAP SNAPS ===
      // Snap frame BELOW other (frame.top = other.bottom + gap)
      const snapBelowOther = otherBottom + gap
      const belowDist = Math.abs(frameTop - snapBelowOther)
      if (belowDist < snapThreshold) {
        ySnaps.push({ value: snapBelowOther, distance: belowDist, guideType: 'top', guidePosition: snapBelowOther })
      }
      // Snap frame ABOVE other (frame.bottom = other.top - gap, so frame.top = other.top - gap - height)
      const snapAboveOther = otherTop - gap
      const aboveDist = Math.abs(frameBottom - snapAboveOther)
      if (aboveDist < snapThreshold) {
        ySnaps.push({ value: otherTop - gap - frame.height, distance: aboveDist, guideType: 'bottom', guidePosition: snapAboveOther })
      }
    }

    // === APPLY SNAPS ===
    // Try X snaps from closest to farthest, apply first one that doesn't cause collision
    if (xSnaps.length > 0) {
      xSnaps.sort((a, b) => a.distance - b.distance)
      for (const snap of xSnaps) {
        const testX = Math.max(0, Math.min(state.wallWidth - frame.width, snap.value))
        if (!hasCollision(frame, testX, y, gap)) {
          x = testX
          break
        }
      }
    }

    // Try Y snaps from closest to farthest, apply first one that doesn't cause collision
    if (ySnaps.length > 0) {
      ySnaps.sort((a, b) => a.distance - b.distance)
      for (const snap of ySnaps) {
        const testY = Math.max(0, Math.min(state.wallHeight - frame.height, snap.value))
        if (!hasCollision(frame, x, testY, gap)) {
          y = testY
          break
        }
      }
    }

    // If there's still a collision, resolve it
    if (hasCollision(frame, x, y, gap)) {
      const resolved = resolveCollision(frame, x, y)
      x = resolved.x
      y = resolved.y
    }

    // Build alignment guides for the final snapped position
    const finalLeft = x
    const finalRight = x + frame.width
    const finalTop = y
    const finalBottom = y + frame.height
    const finalCenterX = x + frame.width / 2
    const finalCenterY = y + frame.height / 2

    // Check what alignments exist at the snapped position
    for (const other of state.galleryFrames) {
      if (other.id === frame.id) continue

      const otherLeft = other.x
      const otherRight = other.x + other.width
      const otherTop = other.y
      const otherBottom = other.y + other.height
      const otherCenterX = other.x + other.width / 2
      const otherCenterY = other.y + other.height / 2

      const tolerance = 1 // 1 pixel tolerance for alignment detection

      // Horizontal guides (Y alignments)
      if (Math.abs(finalTop - otherTop) < tolerance) {
        const minX = Math.min(finalLeft, otherLeft)
        const maxX = Math.max(finalRight, otherRight)
        guides.push({ type: 'top', position: otherTop, start: minX, end: maxX })
      }
      if (Math.abs(finalBottom - otherBottom) < tolerance) {
        const minX = Math.min(finalLeft, otherLeft)
        const maxX = Math.max(finalRight, otherRight)
        guides.push({ type: 'bottom', position: otherBottom, start: minX, end: maxX })
      }
      if (Math.abs(finalCenterY - otherCenterY) < tolerance) {
        const minX = Math.min(finalLeft, otherLeft)
        const maxX = Math.max(finalRight, otherRight)
        guides.push({ type: 'centerY', position: otherCenterY, start: minX, end: maxX })
      }

      // Vertical guides (X alignments)
      if (Math.abs(finalLeft - otherLeft) < tolerance) {
        const minY = Math.min(finalTop, otherTop)
        const maxY = Math.max(finalBottom, otherBottom)
        guides.push({ type: 'left', position: otherLeft, start: minY, end: maxY })
      }
      if (Math.abs(finalRight - otherRight) < tolerance) {
        const minY = Math.min(finalTop, otherTop)
        const maxY = Math.max(finalBottom, otherBottom)
        guides.push({ type: 'right', position: otherRight, start: minY, end: maxY })
      }
      if (Math.abs(finalCenterX - otherCenterX) < tolerance) {
        const minY = Math.min(finalTop, otherTop)
        const maxY = Math.max(finalBottom, otherBottom)
        guides.push({ type: 'centerX', position: otherCenterX, start: minY, end: maxY })
      }

      // Gap-based adjacency guides
      if (Math.abs(finalLeft - (otherRight + gap)) < tolerance) {
        // Frame is snapped to the right of other with gap
        const minY = Math.min(finalTop, otherTop)
        const maxY = Math.max(finalBottom, otherBottom)
        guides.push({ type: 'left', position: finalLeft, start: minY, end: maxY })
      }
      if (Math.abs(finalRight + gap - otherLeft) < tolerance) {
        // Frame is snapped to the left of other with gap
        const minY = Math.min(finalTop, otherTop)
        const maxY = Math.max(finalBottom, otherBottom)
        guides.push({ type: 'right', position: finalRight, start: minY, end: maxY })
      }
      if (Math.abs(finalTop - (otherBottom + gap)) < tolerance) {
        // Frame is snapped below other with gap
        const minX = Math.min(finalLeft, otherLeft)
        const maxX = Math.max(finalRight, otherRight)
        guides.push({ type: 'top', position: finalTop, start: minX, end: maxX })
      }
      if (Math.abs(finalBottom + gap - otherTop) < tolerance) {
        // Frame is snapped above other with gap
        const minX = Math.min(finalLeft, otherLeft)
        const maxX = Math.max(finalRight, otherRight)
        guides.push({ type: 'bottom', position: finalBottom, start: minX, end: maxX })
      }
    }

    // Wall edge guides
    if (Math.abs(finalLeft) < 1) {
      guides.push({ type: 'left', position: 0, start: finalTop, end: finalBottom })
    }
    if (Math.abs(finalRight - state.wallWidth) < 1) {
      guides.push({ type: 'right', position: state.wallWidth, start: finalTop, end: finalBottom })
    }
    if (Math.abs(finalTop) < 1) {
      guides.push({ type: 'top', position: 0, start: finalLeft, end: finalRight })
    }
    if (Math.abs(finalBottom - state.wallHeight) < 1) {
      guides.push({ type: 'bottom', position: state.wallHeight, start: finalLeft, end: finalRight })
    }
    // Wall center guide
    const wallCenterXFinal = state.wallWidth / 2
    if (Math.abs(finalCenterX - wallCenterXFinal) < 1) {
      guides.push({ type: 'centerX', position: wallCenterXFinal, start: 0, end: state.wallHeight })
    }

    return { x, y, guides }
  }, [state.galleryFrames, state.gallerySpacing, state.wallWidth, state.wallHeight, hasCollision, resolveCollision])

  // Track drag preview positions for all frames being dragged (for group drag)
  const [dragPreviews, setDragPreviews] = useState<Map<number, { x: number; y: number }>>(new Map())

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event
    const frameId = active.id as number
    const frame = state.galleryFrames.find((f) => f.id === frameId)
    if (!frame) return

    const desiredX = frame.x + delta.x / scale
    const desiredY = frame.y + delta.y / scale

    const { x, y, guides } = calculateSnappedPosition(frame, desiredX, desiredY)

    // Calculate the actual delta after snapping
    const actualDeltaX = x - frame.x
    const actualDeltaY = y - frame.y

    // Build preview positions for all dragged frames
    const previews = new Map<number, { x: number; y: number }>()
    previews.set(frameId, { x, y })

    // If this frame is part of a multi-selection, calculate preview positions for other selected frames
    if (state.selectedFrames.includes(frameId)) {
      for (const otherId of state.selectedFrames) {
        if (otherId === frameId) continue
        const otherFrame = state.galleryFrames.find(f => f.id === otherId)
        if (otherFrame) {
          previews.set(otherId, {
            x: Math.max(0, Math.min(state.wallWidth - otherFrame.width, otherFrame.x + actualDeltaX)),
            y: Math.max(0, Math.min(state.wallHeight - otherFrame.height, otherFrame.y + actualDeltaY)),
          })
        }
      }
    }

    setDragPreviews(previews)
    setAlignmentGuides(guides)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const frameId = active.id as number
    const frame = state.galleryFrames.find((f) => f.id === frameId)
    if (!frame) return

    const desiredX = frame.x + delta.x / scale
    const desiredY = frame.y + delta.y / scale

    const { x, y } = calculateSnappedPosition(frame, desiredX, desiredY)

    // Calculate the actual delta after snapping
    const actualDeltaX = x - frame.x
    const actualDeltaY = y - frame.y

    // Check if this frame is part of a multi-selection
    const otherSelectedFrames = state.selectedFrames.filter(id => id !== frameId)

    if (otherSelectedFrames.length > 0 && state.selectedFrames.includes(frameId)) {
      // Move the dragged frame first
      updateGalleryFramePosition(frameId, x, y)
      // Move other selected frames by the same delta
      moveGalleryFrames(otherSelectedFrames, actualDeltaX, actualDeltaY)
    } else {
      // Single frame drag
      updateGalleryFramePosition(frameId, x, y)
    }

    setDragPreviews(new Map())
    setAlignmentGuides([])
  }

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Calculate initial pan position - wall near top, centered horizontally
  const getCenteredPan = useCallback(() => {
    const wallWidth = state.wallWidth * baseScale
    const availableWidth = containerSize.width - SIDEBAR_WIDTH
    const centerX = SIDEBAR_WIDTH + (availableWidth - wallWidth) / 2 - padding
    // Position wall near top with minimal offset (just enough for ruler/ceiling label)
    const topY = 0
    return { x: Math.max(0, centerX), y: topY }
  }, [state.wallWidth, baseScale, containerSize])

  // Fit to view function - centers wall in available space
  const fitToView = useCallback(() => {
    setZoom(1)
    setPan(getCenteredPan())
  }, [getCenteredPan])

  // Set initial pan position when container size stabilizes
  const [hasInitialized, setHasInitialized] = useState(false)
  useEffect(() => {
    if (!hasInitialized && containerSize.width > 100 && containerSize.height > 100) {
      setPan(getCenteredPan())
      setHasInitialized(true)
    }
  }, [hasInitialized, containerSize, getCenteredPan])

  // Wheel zoom handler - zoom centered on cursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Cursor position in container
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Zoom factor (faster zoom with Ctrl/Cmd key)
    const zoomSpeed = e.ctrlKey || e.metaKey ? 1.15 : 1.1
    const delta = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed
    const newZoom = Math.max(0.1, Math.min(10, zoom * delta))

    // Adjust pan to zoom centered on cursor
    const scaleChange = newZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * scaleChange
    const newPanY = mouseY - (mouseY - pan.y) * scaleChange

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }, [zoom, pan])

  // Attach wheel listener with passive: false
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Left-click or middle-click to pan
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Also handle mouse leave to stop panning
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Draw background on canvas (wall, rulers, furniture - but NOT frames for gallery mode)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasWidth * 2 // Retina
    canvas.height = canvasHeight * 2
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(2, 2) // Retina scaling

    // Clear
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Apply pan offset to wall position
    const offsetX = padding + pan.x
    const offsetY = padding + pan.y

    // Draw wall background
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 2
    ctx.fillRect(offsetX, offsetY, state.wallWidth * scale, state.wallHeight * scale)
    ctx.strokeRect(offsetX, offsetY, state.wallWidth * scale, state.wallHeight * scale)

    // Draw ruler marks on top
    ctx.fillStyle = '#666'
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'

    const tickInterval = state.unit === 'in' ? 12 : 30
    for (let i = 0; i <= state.wallWidth; i += tickInterval) {
      const x = offsetX + i * scale
      ctx.beginPath()
      ctx.moveTo(x, offsetY - 10)
      ctx.lineTo(x, offsetY)
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillText(fmtShort(i), x, offsetY - 14)
    }

    // Left ruler
    ctx.textAlign = 'right'
    for (let i = 0; i <= state.wallHeight; i += tickInterval) {
      const y = offsetY + (state.wallHeight - i) * scale
      ctx.beginPath()
      ctx.moveTo(offsetX - 10, y)
      ctx.lineTo(offsetX, y)
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillText(fmtShort(i), offsetX - 14, y + 4)
    }

    // Draw floor
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(offsetX, offsetY + state.wallHeight * scale, state.wallWidth * scale, 8)
    ctx.fillStyle = '#666'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FLOOR', offsetX + (state.wallWidth * scale) / 2, offsetY + state.wallHeight * scale + 20)

    // Draw ceiling indicator
    ctx.fillStyle = '#666'
    ctx.fillText('CEILING', offsetX + (state.wallWidth * scale) / 2, offsetY - 30)

    // Draw anchor reference line (for non-gallery modes)
    if (state.layoutType !== 'gallery') {
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#4f46e5'
      ctx.lineWidth = 1

      if (state.anchorType === 'center') {
        const centerY = offsetY + (state.wallHeight / 2) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, centerY)
        ctx.lineTo(offsetX + state.wallWidth * scale, centerY)
        ctx.stroke()
      } else if (state.anchorType === 'ceiling') {
        const lineY = offsetY + state.anchorValue * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      } else if (state.anchorType === 'furniture') {
        const furnitureTop = state.wallHeight - state.furnitureHeight
        const lineY = offsetY + (furnitureTop - state.anchorValue) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      } else {
        const lineY = offsetY + (state.wallHeight - state.anchorValue) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    // Draw furniture
    if (state.anchorType === 'furniture' || state.layoutType === 'gallery') {
      const furnitureCenterX = state.wallWidth / 2 + state.furnitureX
      const furnitureLeft = furnitureCenterX - state.furnitureWidth / 2
      const furnitureTop = state.wallHeight - state.furnitureHeight

      const fx = offsetX + furnitureLeft * scale
      const fy = offsetY + furnitureTop * scale
      const fw = state.furnitureWidth * scale
      const fh = state.furnitureHeight * scale

      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(fx + 2, fy + 2, fw, fh)
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(fx, fy, fw, fh)
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 2
      ctx.strokeRect(fx, fy, fw, fh)
      ctx.fillStyle = '#6b7280'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('FURNITURE', fx + fw / 2, fy + fh / 2 + 4)
      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillText(fmtShort(state.furnitureWidth), fx + fw / 2, fy - 6)
    }

    // Draw alignment guides (Figma-style)
    if (state.layoutType === 'gallery' && alignmentGuides.length > 0) {
      // Magenta color like Figma
      ctx.strokeStyle = '#ff00ff'
      ctx.fillStyle = '#ff00ff'
      ctx.lineWidth = 1
      ctx.setLineDash([])

      for (const guide of alignmentGuides) {
        if (['top', 'bottom', 'centerY'].includes(guide.type)) {
          // Horizontal line
          const py = offsetY + guide.position * scale
          const startX = offsetX + guide.start * scale
          const endX = offsetX + guide.end * scale

          ctx.beginPath()
          ctx.moveTo(startX, py)
          ctx.lineTo(endX, py)
          ctx.stroke()

          // Draw small diamonds at the endpoints
          const diamondSize = 3
          ctx.beginPath()
          ctx.moveTo(startX, py - diamondSize)
          ctx.lineTo(startX + diamondSize, py)
          ctx.lineTo(startX, py + diamondSize)
          ctx.lineTo(startX - diamondSize, py)
          ctx.closePath()
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(endX, py - diamondSize)
          ctx.lineTo(endX + diamondSize, py)
          ctx.lineTo(endX, py + diamondSize)
          ctx.lineTo(endX - diamondSize, py)
          ctx.closePath()
          ctx.fill()
        } else {
          // Vertical line
          const px = offsetX + guide.position * scale
          const startY = offsetY + guide.start * scale
          const endY = offsetY + guide.end * scale

          ctx.beginPath()
          ctx.moveTo(px, startY)
          ctx.lineTo(px, endY)
          ctx.stroke()

          // Draw small diamonds at the endpoints
          const diamondSize = 3
          ctx.beginPath()
          ctx.moveTo(px - diamondSize, startY)
          ctx.lineTo(px, startY - diamondSize)
          ctx.lineTo(px + diamondSize, startY)
          ctx.lineTo(px, startY + diamondSize)
          ctx.closePath()
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(px - diamondSize, endY)
          ctx.lineTo(px, endY - diamondSize)
          ctx.lineTo(px + diamondSize, endY)
          ctx.lineTo(px, endY + diamondSize)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    // Draw frames on canvas for NON-gallery modes only
    if (state.layoutType !== 'gallery') {
      layoutPositions.forEach((frame) => {
        const fx = offsetX + frame.x * scale
        const fy = offsetY + frame.y * scale
        const fw = frame.width * scale
        const fh = frame.height * scale

        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(fx + 3, fy + 3, fw, fh)
        ctx.fillStyle = '#f8f8f8'
        ctx.fillRect(fx, fy, fw, fh)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(fx, fy, fw, fh)

        const matInset = Math.min(fw, fh) * 0.1
        ctx.strokeStyle = '#ddd'
        ctx.lineWidth = 1
        ctx.strokeRect(fx + matInset, fy + matInset, fw - matInset * 2, fh - matInset * 2)

        // Draw hook(s) - use actual positions from frame
        const hookY = fy + frame.hangingOffset * scale
        const hookX1 = offsetX + frame.hookX * scale

        // Draw first (or only) hook
        ctx.beginPath()
        ctx.arc(hookX1, hookY, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#ef4444'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw second hook if dual hanging
        if (frame.hookX2 !== undefined) {
          const hookX2 = offsetX + frame.hookX2 * scale
          ctx.beginPath()
          ctx.arc(hookX2, hookY, 6, 0, Math.PI * 2)
          ctx.fillStyle = '#ef4444'
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.fillStyle = '#666'
        ctx.font = 'bold 11px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(frame.name, fx + fw / 2, fy + fh / 2 + 4)

        ctx.font = '10px -apple-system, sans-serif'
        ctx.fillStyle = '#4f46e5'
        ctx.fillText(fmtShort(frame.width), fx + fw / 2, fy - 6)

        ctx.save()
        ctx.translate(fx - 6, fy + fh / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(fmtShort(frame.height), 0, 0)
        ctx.restore()
      })

      // Helper to draw full measurements for a specific hook
      const drawFullMeasurements = (f: typeof layoutPositions[0], hookIndex: number) => {
        const hookX = offsetX + (hookIndex === 1 && f.hookX2 ? f.hookX2 : f.hookX) * scale
        const hookY = offsetY + f.hookY * scale
        const fromLeft = hookIndex === 1 && f.hookX2 ? f.hookX2 : f.fromLeft

        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])

        // Line from wall left to hook
        ctx.beginPath()
        ctx.moveTo(offsetX, hookY)
        ctx.lineTo(hookX, hookY)
        ctx.stroke()

        // Vertical line from hook to floor
        ctx.beginPath()
        ctx.moveTo(hookX, hookY)
        ctx.lineTo(hookX, offsetY + state.wallHeight * scale)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.font = 'bold 10px -apple-system, sans-serif'
        ctx.textAlign = 'center'

        // "From left" label with background
        const fromLeftText = fmt(fromLeft)
        const fromLeftX = offsetX + (fromLeft * scale) / 2
        const fromLeftWidth = ctx.measureText(fromLeftText).width
        ctx.fillStyle = '#fff'
        ctx.fillRect(fromLeftX - fromLeftWidth / 2 - 2, hookY - 14, fromLeftWidth + 4, 12)
        ctx.fillStyle = '#22c55e'
        ctx.fillText(fromLeftText, fromLeftX, hookY - 5)

        // "From floor" label (rotated)
        ctx.save()
        ctx.font = 'bold 10px -apple-system, sans-serif'
        const fromFloorText = fmt(f.fromFloor)
        const fromFloorY = offsetY + state.wallHeight * scale - (f.fromFloor * scale) / 2
        ctx.translate(hookX + 10, fromFloorY)
        ctx.rotate(-Math.PI / 2)
        const floorTextWidth = ctx.measureText(fromFloorText).width
        ctx.fillStyle = '#fff'
        ctx.fillRect(-floorTextWidth / 2 - 2, -9, floorTextWidth + 4, 12)
        ctx.fillStyle = '#22c55e'
        ctx.fillText(fromFloorText, 0, 0)
        ctx.restore()
      }

      // Always show hook gap for dual hooks (for all frames)
      layoutPositions.forEach((f) => {
        if (f.hookX2 !== undefined && f.hookGap !== undefined) {
          const hookX = offsetX + f.hookX * scale
          const hookX2 = offsetX + f.hookX2 * scale
          const hookY = offsetY + f.hookY * scale

          ctx.strokeStyle = '#f59e0b' // Amber for gap
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(hookX, hookY)
          ctx.lineTo(hookX2, hookY)
          ctx.stroke()
          ctx.setLineDash([])

          // Hook gap measurement label
          const gapText = fmt(f.hookGap)
          const textX = (hookX + hookX2) / 2
          ctx.font = 'bold 10px -apple-system, sans-serif'
          const textWidth = ctx.measureText(gapText).width
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.roundRect(textX - textWidth / 2 - 4, hookY - 7, textWidth + 8, 14, 3)
          ctx.fill()
          ctx.fillStyle = '#f59e0b'
          ctx.textAlign = 'center'
          ctx.fillText(gapText, textX, hookY + 4)
        }
      })

      // Draw full measurements for reference hook (first by default)
      if (referenceHook) {
        const frame = layoutPositions.find(f => f.id === referenceHook.frameId)
        if (frame) {
          drawFullMeasurements(frame, referenceHook.hookIndex)

          // Show contextual tooltip if no compare hook selected yet
          if (!compareHook) {
            const hookX = offsetX + (referenceHook.hookIndex === 1 && frame.hookX2 ? frame.hookX2 : frame.hookX) * scale
            const hookY = offsetY + frame.hookY * scale

            const tooltipText = 'Shift+click another hook to compare'
            ctx.font = '11px -apple-system, sans-serif'
            const textWidth = ctx.measureText(tooltipText).width

            // Position tooltip above the hook
            const tooltipX = hookX
            const tooltipY = hookY - 25

            // Draw tooltip background
            ctx.fillStyle = '#1f2937'
            ctx.beginPath()
            ctx.roundRect(tooltipX - textWidth / 2 - 8, tooltipY - 12, textWidth + 16, 22, 4)
            ctx.fill()

            // Draw arrow pointing down
            ctx.beginPath()
            ctx.moveTo(tooltipX - 6, tooltipY + 10)
            ctx.lineTo(tooltipX + 6, tooltipY + 10)
            ctx.lineTo(tooltipX, tooltipY + 16)
            ctx.closePath()
            ctx.fill()

            // Draw text
            ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'
            ctx.fillText(tooltipText, tooltipX, tooltipY + 2)
          }
        }
      } else if (layoutPositions.length > 0) {
        // Default: show first hook measurements
        drawFullMeasurements(layoutPositions[0], 0)
      }

      // Draw comparison measurements between reference and compare hooks
      if (referenceHook && compareHook) {
        const refFrame = layoutPositions.find(f => f.id === referenceHook.frameId)
        const cmpFrame = layoutPositions.find(f => f.id === compareHook.frameId)

        if (refFrame && cmpFrame) {
          // Get hook positions
          const refX = referenceHook.hookIndex === 1 && refFrame.hookX2 ? refFrame.hookX2 : refFrame.hookX
          const refY = refFrame.hookY
          const cmpX = compareHook.hookIndex === 1 && cmpFrame.hookX2 ? cmpFrame.hookX2 : cmpFrame.hookX
          const cmpY = cmpFrame.hookY

          // Screen positions
          const refScreenX = offsetX + refX * scale
          const refScreenY = offsetY + refY * scale
          const cmpScreenX = offsetX + cmpX * scale
          const cmpScreenY = offsetY + cmpY * scale

          // Calculate deltas
          const deltaX = cmpX - refX
          const deltaY = cmpY - refY

          // Draw connecting line (cyan/teal for comparison)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.beginPath()
          ctx.moveTo(refScreenX, refScreenY)
          ctx.lineTo(cmpScreenX, cmpScreenY)
          ctx.stroke()
          ctx.setLineDash([])

          // Draw reference hook highlight (ring)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(refScreenX, refScreenY, 10, 0, Math.PI * 2)
          ctx.stroke()

          // Draw compare hook highlight (filled ring)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(cmpScreenX, cmpScreenY, 10, 0, Math.PI * 2)
          ctx.stroke()

          // Format distance labels
          const hText = Math.abs(deltaX) > 0.1 ? `${fmt(Math.abs(deltaX))} horizontal` : ''
          const vText = Math.abs(deltaY) > 0.1 ? `${fmt(Math.abs(deltaY))} vertical` : ''

          // Draw label at midpoint
          const midX = (refScreenX + cmpScreenX) / 2
          const midY = (refScreenY + cmpScreenY) / 2

          ctx.font = 'bold 11px -apple-system, sans-serif'
          ctx.textAlign = 'center'

          // Build label text
          const labels = [hText, vText].filter(Boolean)
          const labelText = labels.join(', ')

          if (labelText) {
            const textWidth = ctx.measureText(labelText).width

            // Draw background pill
            ctx.fillStyle = '#06b6d4'
            ctx.beginPath()
            ctx.roundRect(midX - textWidth / 2 - 8, midY - 10, textWidth + 16, 20, 4)
            ctx.fill()

            // Draw text
            ctx.fillStyle = '#fff'
            ctx.fillText(labelText, midX, midY + 4)
          }
        }
      }
    }

  }, [
    layoutPositions,
    state,
    scale,
    canvasWidth,
    canvasHeight,
    fmtShort,
    fmt,
    alignmentGuides,
    referenceHook,
    compareHook,
    pan,
    zoom,
  ])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div
        className="relative"
        style={{ height: canvasHeight, width: canvasWidth }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onClick={handleCanvasClick}
        />

        {/* Gallery mode: render frames as DOM elements with dnd-kit */}
        {state.layoutType === 'gallery' && (
          <DndContext
            sensors={sensors}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            {state.galleryFrames.map((frame) => (
              <DraggableFrame
                key={frame.id}
                frame={frame}
                scale={scale}
                padding={padding}
                pan={pan}
                isSelected={state.selectedFrames.includes(frame.id)}
                isPrimary={state.selectedFrame === frame.id}
                onSelect={toggleFrameSelection}
                fmtShort={fmtShort}
                previewPosition={dragPreviews.get(frame.id) || null}
              />
            ))}
          </DndContext>
        )}
      </div>

      {/* Help button - top right (only for non-gallery modes) */}
      {state.layoutType !== 'gallery' && (
        <div className="absolute top-4 right-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-white/10"
              >
                <HelpCircle className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-white/70">Hook position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-green-500 shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-white/70">Distance from wall/floor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-cyan-500 shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-white/70">Hook comparison</span>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    Click a hook to see measurements.<br />
                    Shift+click another to compare.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Zoom controls - bottom right */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl px-2 py-1.5 shadow-lg border border-gray-200/50 dark:border-white/10">
        <button
          onClick={() => setZoom(z => Math.max(0.1, z * 0.8))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom out"
        >
          <Minus className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>

        <span className="text-xs font-medium text-gray-600 dark:text-white/70 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(z => Math.min(10, z * 1.25))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom in"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

        <button
          onClick={fitToView}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Fit to view"
        >
          <Maximize2 className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>
      </div>
    </div>
  )
}
