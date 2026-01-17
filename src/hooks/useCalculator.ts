import { useState, useMemo, useCallback } from 'react'
import { useQueryState, useQueryStates, parseAsInteger, parseAsFloat, parseAsStringLiteral, parseAsJson } from 'nuqs'
import type { CalculatorState, FramePosition, SalonFrame, Unit, LayoutType, AnchorType, HorizontalAnchorType } from '@/types'
import { calculateLayoutPositions, toDisplayUnit, fromDisplayUnit } from '@/utils/calculations'

const UNIT_STORAGE_KEY = 'picture-hanging-unit'

// Get saved unit from localStorage or default to 'in'
function getSavedUnit(): 'in' | 'cm' {
  if (typeof window === 'undefined') return 'in'
  const saved = localStorage.getItem(UNIT_STORAGE_KEY)
  return saved === 'cm' ? 'cm' : 'in'
}

const DEFAULT_SALON_FRAMES: SalonFrame[] = [
  { id: 1, name: 'Frame 1', width: 16, height: 20, hangingOffset: 3, x: 30, y: 30 },
  { id: 2, name: 'Frame 2', width: 10, height: 12, hangingOffset: 2, x: 50, y: 35 },
  { id: 3, name: 'Frame 3', width: 14, height: 18, hangingOffset: 2.5, x: 65, y: 28 },
]

// Validator for SalonFrame array
const salonFramesValidator = (value: unknown): SalonFrame[] | null => {
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
  return value as SalonFrame[]
}

// Parser definitions grouped by concern
const wallParsers = {
  u: parseAsStringLiteral(['in', 'cm'] as const).withDefault(getSavedUnit()),
  ww: parseAsFloat.withDefault(120),
  wh: parseAsFloat.withDefault(96),
}

const layoutParsers = {
  lt: parseAsStringLiteral(['grid', 'row', 'salon'] as const).withDefault('grid'),
  gr: parseAsInteger.withDefault(3),
  gc: parseAsInteger.withDefault(3),
}

const frameParsers = {
  fw: parseAsFloat.withDefault(12),
  fh: parseAsFloat.withDefault(12),
  ho: parseAsFloat.withDefault(2),
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

export function useCalculator() {
  // URL-synced state grouped by concern
  const [wall, setWall] = useQueryStates(wallParsers)
  const [layout, setLayout] = useQueryStates(layoutParsers)
  const [frame, setFrame] = useQueryStates(frameParsers)
  const [position, setPosition] = useQueryStates(positionParsers)
  const [furniture, setFurniture] = useQueryStates(furnitureParsers)
  const [salonFrames, setSalonFrames] = useQueryState('sf',
    parseAsJson(salonFramesValidator).withDefault(DEFAULT_SALON_FRAMES)
  )

  // Local state (transient UI state, not persisted to URL)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)

  // Construct state object for calculations
  const state: CalculatorState = useMemo(() => ({
    unit: wall.u as Unit,
    wallWidth: wall.ww,
    wallHeight: wall.wh,
    layoutType: layout.lt as LayoutType,
    gridRows: layout.gr,
    gridCols: layout.gc,
    frameWidth: frame.fw,
    frameHeight: frame.fh,
    hangingOffset: frame.ho,
    hSpacing: frame.hs,
    vSpacing: frame.vs,
    anchorType: position.at as AnchorType,
    anchorValue: position.av,
    hAnchorType: position.hat as HorizontalAnchorType,
    hAnchorValue: position.hav,
    salonFrames,
    selectedFrame,
    furnitureWidth: furniture.fuw,
    furnitureHeight: furniture.fuh,
    furnitureX: furniture.fux,
    furnitureCentered: furniture.fuc === 'true',
  }), [wall, layout, frame, position, furniture, salonFrames, selectedFrame])

  // Unit conversion helpers
  const u = useCallback((val: number) => toDisplayUnit(val, state.unit), [state.unit])
  const fromU = useCallback((val: number) => fromDisplayUnit(val, state.unit), [state.unit])

  // Calculate layout positions
  const layoutPositions: FramePosition[] = useMemo(
    () => calculateLayoutPositions(state),
    [state]
  )

  // Total frames count
  const totalFrames = state.layoutType === 'salon'
    ? state.salonFrames.length
    : state.gridRows * state.gridCols

  // Setters that maintain the original API
  const setUnit = (value: Unit) => setWall({ u: value })
  const setWallWidth = (value: number) => setWall({ ww: value })
  const setWallHeight = (value: number) => setWall({ wh: value })
  const setLayoutType = (value: LayoutType) => setLayout({ lt: value })
  const setGridRows = (value: number) => setLayout({ gr: value })
  const setGridCols = (value: number) => setLayout({ gc: value })
  const setFrameWidth = (value: number) => setFrame({ fw: value })
  const setFrameHeight = (value: number) => setFrame({ fh: value })
  const setHangingOffset = (value: number) => setFrame({ ho: value })
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

  // Salon frame management
  const addSalonFrame = () => {
    const newId = Math.max(0, ...salonFrames.map(f => f.id)) + 1
    setSalonFrames([
      ...salonFrames,
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

  const updateSalonFrame = (id: number, field: keyof SalonFrame, value: string | number) => {
    setSalonFrames(
      salonFrames.map(f =>
        f.id === id ? { ...f, [field]: field === 'name' ? value : (parseFloat(String(value)) || 0) } : f
      )
    )
  }

  const removeSalonFrame = (id: number) => {
    setSalonFrames(salonFrames.filter(f => f.id !== id))
    if (selectedFrame === id) {
      setSelectedFrame(null)
    }
  }

  const updateSalonFramePosition = (id: number, x: number, y: number) => {
    setSalonFrames(
      salonFrames.map(f => f.id === id ? { ...f, x, y } : f
      )
    )
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
    setGridRows,
    setGridCols,
    setFrameWidth,
    setFrameHeight,
    setHangingOffset,
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
    addSalonFrame,
    updateSalonFrame,
    removeSalonFrame,
    updateSalonFramePosition,
  }
}

export type UseCalculatorReturn = ReturnType<typeof useCalculator>
