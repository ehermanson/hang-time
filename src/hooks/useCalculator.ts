import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQueryState, useQueryStates, parseAsInteger, parseAsFloat, parseAsStringLiteral, parseAsJson } from 'nuqs'
import type { CalculatorState, FramePosition, GalleryFrame, Unit, LayoutType, AnchorType, HorizontalAnchorType, HangingType } from '@/types'
import { calculateLayoutPositions, toDisplayUnit, fromDisplayUnit } from '@/utils/calculations'

const UNIT_STORAGE_KEY = 'picture-hanging-unit'

// Get saved unit from localStorage or default to 'in'
function getSavedUnit(): 'in' | 'cm' {
  if (typeof window === 'undefined') return 'in'
  const saved = localStorage.getItem(UNIT_STORAGE_KEY)
  return saved === 'cm' ? 'cm' : 'in'
}

const DEFAULT_GALLERY_FRAMES: GalleryFrame[] = [
  { id: 1, name: 'Frame 1', width: 16, height: 20, hangingOffset: 3, x: 30, y: 30 },
  { id: 2, name: 'Frame 2', width: 10, height: 12, hangingOffset: 2, x: 50, y: 35 },
  { id: 3, name: 'Frame 3', width: 14, height: 18, hangingOffset: 2.5, x: 65, y: 28 },
]

// Validator for GalleryFrame array
const galleryFramesValidator = (value: unknown): GalleryFrame[] | null => {
  if (!Array.isArray(value)) return null
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null
    if (typeof item.id !== 'number') return null
    if (typeof item.name !== 'string') return null
    if (typeof item.width !== 'number') return null
    if (typeof item.height !== 'number') return null
    if (typeof item.hangingOffset !== 'number') return null
    if (typeof item.x !== 'number') return null
    if (typeof item.y !== 'number') return null
  }
  return value as GalleryFrame[]
}

// Parser definitions grouped by concern
const wallParsers = {
  u: parseAsStringLiteral(['in', 'cm'] as const).withDefault(getSavedUnit()),
  ww: parseAsFloat.withDefault(120),
  wh: parseAsFloat.withDefault(96),
}

const layoutParsers = {
  lt: parseAsStringLiteral(['grid', 'row', 'gallery'] as const).withDefault('row'),
  fc: parseAsInteger.withDefault(3), // frame count - primary input
  gr: parseAsInteger.withDefault(1),
  gc: parseAsInteger.withDefault(3),
}

const frameParsers = {
  fw: parseAsFloat.withDefault(12),
  fh: parseAsFloat.withDefault(12),
  ho: parseAsFloat.withDefault(2),
  ht: parseAsStringLiteral(['center', 'dual'] as const).withDefault('center'),
  hi: parseAsFloat.withDefault(3), // hook inset from edge for dual hanging
  hs: parseAsFloat.withDefault(3),
  vs: parseAsFloat.withDefault(3),
}

const positionParsers = {
  at: parseAsStringLiteral(['floor', 'ceiling', 'center', 'furniture'] as const).withDefault('floor'),
  av: parseAsFloat.withDefault(57),
  hat: parseAsStringLiteral(['center', 'left', 'right'] as const).withDefault('center'),
  hav: parseAsFloat.withDefault(0),
}

const furnitureParsers = {
  fuw: parseAsFloat.withDefault(48),
  fuh: parseAsFloat.withDefault(30),
  fux: parseAsFloat.withDefault(0),
  fuc: parseAsStringLiteral(['true', 'false'] as const).withDefault('true'),
}

const galleryParsers = {
  gs: parseAsFloat.withDefault(3), // gallery spacing
  gsn: parseAsStringLiteral(['true', 'false'] as const).withDefault('true'), // gallery snapping
}

export function useCalculator() {
  // URL-synced state grouped by concern
  const [wall, setWall] = useQueryStates(wallParsers)
  const [layout, setLayout] = useQueryStates(layoutParsers)
  const [frame, setFrame] = useQueryStates(frameParsers)
  const [position, setPosition] = useQueryStates(positionParsers)
  const [furniture, setFurniture] = useQueryStates(furnitureParsers)
  const [galleryFrames, setGalleryFrames] = useQueryState('gf',
    parseAsJson(galleryFramesValidator).withDefault(DEFAULT_GALLERY_FRAMES)
  )
  const [gallery, setGallery] = useQueryStates(galleryParsers)

  // Local state (transient UI state, not persisted to URL)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<number[]>([])

  // Construct state object for calculations
  const state: CalculatorState = useMemo(() => ({
    unit: wall.u as Unit,
    wallWidth: wall.ww,
    wallHeight: wall.wh,
    layoutType: layout.lt as LayoutType,
    frameCount: layout.fc,
    gridRows: layout.gr,
    gridCols: layout.gc,
    frameWidth: frame.fw,
    frameHeight: frame.fh,
    hangingOffset: frame.ho,
    hangingType: frame.ht as HangingType,
    hookInset: frame.hi,
    hSpacing: frame.hs,
    vSpacing: frame.vs,
    anchorType: position.at as AnchorType,
    anchorValue: position.av,
    hAnchorType: position.hat as HorizontalAnchorType,
    hAnchorValue: position.hav,
    galleryFrames,
    selectedFrame,
    selectedFrames,
    gallerySpacing: gallery.gs,
    gallerySnapping: gallery.gsn === 'true',
    furnitureWidth: furniture.fuw,
    furnitureHeight: furniture.fuh,
    furnitureX: furniture.fux,
    furnitureCentered: furniture.fuc === 'true',
  }), [wall, layout, frame, position, furniture, gallery, galleryFrames, selectedFrame, selectedFrames])

  // Unit conversion helpers
  const u = useCallback((val: number) => toDisplayUnit(val, state.unit), [state.unit])
  const fromU = useCallback((val: number) => fromDisplayUnit(val, state.unit), [state.unit])

  // Calculate layout positions
  const layoutPositions: FramePosition[] = useMemo(
    () => calculateLayoutPositions(state),
    [state]
  )

  // Total frames count (use frameCount, but cap at grid capacity)
  const totalFrames = state.layoutType === 'gallery'
    ? state.galleryFrames.length
    : Math.min(state.frameCount, state.gridRows * state.gridCols)

  // Setters that maintain the original API
  const setUnit = (value: Unit) => setWall({ u: value })
  const setWallWidth = (value: number) => setWall({ ww: value })
  const setWallHeight = (value: number) => setWall({ wh: value })
  const setLayoutType = (value: LayoutType) => setLayout({ lt: value })
  const setFrameCount = (value: number) => setLayout({ fc: value })
  const setGridRows = (value: number) => setLayout({ gr: value })
  const setGridCols = (value: number) => setLayout({ gc: value })

  // Apply a layout configuration (type + rows/cols)
  const applyLayout = (type: LayoutType, rows: number, cols: number) => {
    setLayout({ lt: type, gr: rows, gc: cols })
  }
  const setFrameWidth = (value: number) => setFrame({ fw: value })
  const setFrameHeight = (value: number) => setFrame({ fh: value })
  const setHangingOffset = (value: number) => setFrame({ ho: value })
  const setHangingType = (value: HangingType) => setFrame({ ht: value })
  const setHookInset = (value: number) => setFrame({ hi: value })
  const setHSpacing = (value: number) => setFrame({ hs: value })
  const setVSpacing = (value: number) => setFrame({ vs: value })
  const setAnchorType = (value: AnchorType) => setPosition({ at: value })
  const setAnchorValue = (value: number) => setPosition({ av: value })
  const setHAnchorType = (value: HorizontalAnchorType) => setPosition({ hat: value })
  const setHAnchorValue = (value: number) => setPosition({ hav: value })
  const setFurnitureWidth = (value: number) => setFurniture({ fuw: value })
  const setFurnitureHeight = (value: number) => setFurniture({ fuh: value })
  const setFurnitureX = (value: number) => setFurniture({ fux: value })
  const setFurnitureCentered = (value: boolean) => setFurniture({ fuc: value ? 'true' : 'false' })
  // Track previous gap for relayout
  const prevGapRef = useRef(gallery.gs)

  // Relayout frames when gap changes
  useEffect(() => {
    const oldGap = prevGapRef.current
    const newGap = gallery.gs

    if (oldGap !== newGap && galleryFrames.length > 1) {
      const tolerance = 2 // pixels tolerance for detecting adjacent frames

      // Create a copy of frames to modify
      const updatedFrames = [...galleryFrames]

      // Sort frames by x position for horizontal adjacency
      const framesByX = [...updatedFrames].sort((a, b) => a.x - b.x)

      // Check horizontal adjacencies and adjust
      for (let i = 0; i < framesByX.length - 1; i++) {
        const left = framesByX[i]
        const right = framesByX[i + 1]

        // Check if frames are horizontally adjacent (within old gap tolerance)
        const currentHGap = right.x - (left.x + left.width)
        if (Math.abs(currentHGap - oldGap) <= tolerance) {
          // Adjust right frame to use new gap
          const rightFrame = updatedFrames.find(f => f.id === right.id)
          if (rightFrame) {
            rightFrame.x = left.x + left.width + newGap
          }
        }
      }

      // Sort frames by y position for vertical adjacency
      const framesByY = [...updatedFrames].sort((a, b) => a.y - b.y)

      // Check vertical adjacencies and adjust
      for (let i = 0; i < framesByY.length - 1; i++) {
        const top = framesByY[i]
        const bottom = framesByY[i + 1]

        // Check if frames are vertically adjacent (within old gap tolerance)
        const currentVGap = bottom.y - (top.y + top.height)
        if (Math.abs(currentVGap - oldGap) <= tolerance) {
          // Adjust bottom frame to use new gap
          const bottomFrame = updatedFrames.find(f => f.id === bottom.id)
          if (bottomFrame) {
            bottomFrame.y = top.y + top.height + newGap
          }
        }
      }

      // Update frames if any changed
      const hasChanges = updatedFrames.some((f, i) =>
        f.x !== galleryFrames[i]?.x || f.y !== galleryFrames[i]?.y
      )
      if (hasChanges) {
        setGalleryFrames(updatedFrames)
      }
    }

    prevGapRef.current = newGap
  }, [gallery.gs, galleryFrames, setGalleryFrames])

  const setGallerySpacing = (value: number) => setGallery({ gs: value })
  const setGallerySnapping = (value: boolean) => setGallery({ gsn: value ? 'true' : 'false' })

  // Gallery frame management
  const addGalleryFrame = () => {
    const newId = Math.max(0, ...galleryFrames.map(f => f.id)) + 1
    setGalleryFrames([
      ...galleryFrames,
      {
        id: newId,
        name: `Frame ${newId}`,
        width: 12,
        height: 16,
        hangingOffset: 2,
        x: 20 + (newId * 5) % 60,
        y: 20 + (newId * 5) % 40,
      },
    ])
  }

  const updateGalleryFrame = (id: number, field: keyof GalleryFrame, value: string | number) => {
    setGalleryFrames(
      galleryFrames.map(f =>
        f.id === id ? { ...f, [field]: field === 'name' ? value : (parseFloat(String(value)) || 0) } : f
      )
    )
  }

  const removeGalleryFrame = (id: number) => {
    setGalleryFrames(galleryFrames.filter(f => f.id !== id))
    if (selectedFrame === id) {
      setSelectedFrame(null)
    }
  }

  const updateGalleryFramePosition = (id: number, x: number, y: number) => {
    setGalleryFrames(
      galleryFrames.map(f => f.id === id ? { ...f, x, y } : f
      )
    )
  }

  // Move multiple frames by a delta (for group dragging)
  const moveGalleryFrames = (ids: number[], deltaX: number, deltaY: number) => {
    setGalleryFrames(
      galleryFrames.map(f => {
        if (ids.includes(f.id)) {
          return {
            ...f,
            x: Math.max(0, Math.min(wall.ww - f.width, f.x + deltaX)),
            y: Math.max(0, Math.min(wall.wh - f.height, f.y + deltaY)),
          }
        }
        return f
      })
    )
  }

  // Toggle frame selection (for multi-select with shift+click)
  const toggleFrameSelection = (id: number, addToSelection: boolean) => {
    if (addToSelection) {
      setSelectedFrames(prev =>
        prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
      )
    } else {
      setSelectedFrames([id])
    }
    setSelectedFrame(id)
  }

  // Clear all selections
  const clearFrameSelection = () => {
    setSelectedFrames([])
    setSelectedFrame(null)
  }

  // Select all frames
  const selectAllFrames = () => {
    setSelectedFrames(galleryFrames.map(f => f.id))
  }

  return {
    state,
    layoutPositions,
    totalFrames,
    u,
    fromU,
    setUnit,
    setWallWidth,
    setWallHeight,
    setLayoutType,
    setFrameCount,
    setGridRows,
    setGridCols,
    applyLayout,
    setFrameWidth,
    setFrameHeight,
    setHangingOffset,
    setHangingType,
    setHookInset,
    setHSpacing,
    setVSpacing,
    setAnchorType,
    setAnchorValue,
    setHAnchorType,
    setHAnchorValue,
    setFurnitureWidth,
    setFurnitureHeight,
    setFurnitureX,
    setFurnitureCentered,
    setSelectedFrame,
    setSelectedFrames,
    setGallerySpacing,
    setGallerySnapping,
    addGalleryFrame,
    updateGalleryFrame,
    removeGalleryFrame,
    updateGalleryFramePosition,
    moveGalleryFrames,
    toggleFrameSelection,
    clearFrameSelection,
    selectAllFrames,
  }
}

export type UseCalculatorReturn = ReturnType<typeof useCalculator>
