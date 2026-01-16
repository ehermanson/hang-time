import { useState, useMemo, useCallback } from 'react'
import type { CalculatorState, FramePosition, SalonFrame, Unit, LayoutType, AnchorType, HorizontalAnchorType } from '@/types'
import { calculateLayoutPositions, toDisplayUnit, fromDisplayUnit } from '@/utils/calculations'

const DEFAULT_SALON_FRAMES: SalonFrame[] = [
  { id: 1, name: 'Frame 1', width: 16, height: 20, hangingOffset: 3, x: 30, y: 30 },
  { id: 2, name: 'Frame 2', width: 10, height: 12, hangingOffset: 2, x: 50, y: 35 },
  { id: 3, name: 'Frame 3', width: 14, height: 18, hangingOffset: 2.5, x: 65, y: 28 },
]

const initialState: CalculatorState = {
  unit: 'in',
  wallWidth: 120,
  wallHeight: 96,
  layoutType: 'grid',
  gridRows: 3,
  gridCols: 3,
  frameWidth: 12,
  frameHeight: 12,
  hangingOffset: 2,
  hSpacing: 3,
  vSpacing: 3,
  anchorType: 'floor',
  anchorValue: 57,
  hAnchorType: 'center',
  hAnchorValue: 0,
  salonFrames: DEFAULT_SALON_FRAMES,
  selectedFrame: null,
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState)

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

  // Setters
  const setUnit = (unit: Unit) => setState(s => ({ ...s, unit }))
  const setWallWidth = (wallWidth: number) => setState(s => ({ ...s, wallWidth }))
  const setWallHeight = (wallHeight: number) => setState(s => ({ ...s, wallHeight }))
  const setLayoutType = (layoutType: LayoutType) => setState(s => ({ ...s, layoutType }))
  const setGridRows = (gridRows: number) => setState(s => ({ ...s, gridRows }))
  const setGridCols = (gridCols: number) => setState(s => ({ ...s, gridCols }))
  const setFrameWidth = (frameWidth: number) => setState(s => ({ ...s, frameWidth }))
  const setFrameHeight = (frameHeight: number) => setState(s => ({ ...s, frameHeight }))
  const setHangingOffset = (hangingOffset: number) => setState(s => ({ ...s, hangingOffset }))
  const setHSpacing = (hSpacing: number) => setState(s => ({ ...s, hSpacing }))
  const setVSpacing = (vSpacing: number) => setState(s => ({ ...s, vSpacing }))
  const setAnchorType = (anchorType: AnchorType) => setState(s => ({ ...s, anchorType }))
  const setAnchorValue = (anchorValue: number) => setState(s => ({ ...s, anchorValue }))
  const setHAnchorType = (hAnchorType: HorizontalAnchorType) => setState(s => ({ ...s, hAnchorType }))
  const setHAnchorValue = (hAnchorValue: number) => setState(s => ({ ...s, hAnchorValue }))
  const setSelectedFrame = (selectedFrame: number | null) => setState(s => ({ ...s, selectedFrame }))

  // Salon frame management
  const addSalonFrame = () => {
    setState(s => {
      const newId = Math.max(0, ...s.salonFrames.map(f => f.id)) + 1
      return {
        ...s,
        salonFrames: [
          ...s.salonFrames,
          {
            id: newId,
            name: `Frame ${newId}`,
            width: 12,
            height: 16,
            hangingOffset: 2,
            x: 20 + (newId * 5) % 60,
            y: 20 + (newId * 5) % 40,
          },
        ],
      }
    })
  }

  const updateSalonFrame = (id: number, field: keyof SalonFrame, value: string | number) => {
    setState(s => ({
      ...s,
      salonFrames: s.salonFrames.map(f =>
        f.id === id ? { ...f, [field]: field === 'name' ? value : (parseFloat(String(value)) || 0) } : f
      ),
    }))
  }

  const removeSalonFrame = (id: number) => {
    setState(s => ({
      ...s,
      salonFrames: s.salonFrames.filter(f => f.id !== id),
      selectedFrame: s.selectedFrame === id ? null : s.selectedFrame,
    }))
  }

  const updateSalonFramePosition = (id: number, x: number, y: number) => {
    setState(s => ({
      ...s,
      salonFrames: s.salonFrames.map(f =>
        f.id === id ? { ...f, x, y } : f
      ),
    }))
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
    setSelectedFrame,
    addSalonFrame,
    updateSalonFrame,
    removeSalonFrame,
    updateSalonFramePosition,
  }
}

export type UseCalculatorReturn = ReturnType<typeof useCalculator>
