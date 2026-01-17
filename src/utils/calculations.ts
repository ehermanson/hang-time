import type { CalculatorState, FramePosition, SalonFrame } from '@/types'

export const INCH_TO_CM = 2.54

export const toDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value * INCH_TO_CM
}

export const fromDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value / INCH_TO_CM
}

export const formatMeasurement = (value: number, unit: 'in' | 'cm'): string => {
  return unit === 'in' ? `${value.toFixed(1)}"` : `${value.toFixed(1)} cm`
}

export const formatShort = (value: number, unit: 'in' | 'cm'): string => {
  return unit === 'in' ? `${value.toFixed(1)}"` : `${value.toFixed(0)}cm`
}

export function calculateLayoutPositions(state: CalculatorState): FramePosition[] {
  const {
    layoutType,
    gridRows,
    gridCols,
    frameWidth,
    frameHeight,
    hangingOffset,
    hSpacing,
    vSpacing,
    anchorType,
    anchorValue,
    hAnchorType,
    hAnchorValue,
    wallWidth,
    wallHeight,
    salonFrames,
    furnitureHeight,
    furnitureX,
    furnitureCentered,
  } = state

  if (layoutType === 'salon') {
    return salonFrames.map((f: SalonFrame) => {
      const hookX = f.x + f.width / 2
      const hookY = f.y + f.hangingOffset
      return {
        id: f.id,
        name: f.name,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        hangingOffset: f.hangingOffset,
        hookX,
        hookY,
        fromLeft: hookX,
        fromTop: hookY,
        fromFloor: wallHeight - hookY,
        fromRight: wallWidth - hookX,
        fromCeiling: hookY,
      }
    })
  }

  const rows = layoutType === 'row' ? 1 : gridRows
  const cols = gridCols

  // Calculate total arrangement size
  const totalWidth = cols * frameWidth + (cols - 1) * hSpacing
  const totalHeight = rows * frameHeight + (rows - 1) * vSpacing

  // Calculate starting position based on anchors
  let startX: number
  if (hAnchorType === 'center') {
    startX = (wallWidth - totalWidth) / 2
  } else if (hAnchorType === 'left') {
    startX = hAnchorValue
  } else {
    startX = wallWidth - totalWidth - hAnchorValue
  }

  let startY: number
  if (anchorType === 'center') {
    startY = (wallHeight - totalHeight) / 2
  } else if (anchorType === 'ceiling') {
    startY = anchorValue
  } else if (anchorType === 'furniture') {
    // Position above furniture with gap (anchorValue)
    // furnitureTop is the Y coordinate of the furniture's top edge
    const furnitureTop = wallHeight - furnitureHeight
    startY = furnitureTop - anchorValue - totalHeight

    // If furniture centering is enabled, override horizontal positioning
    if (furnitureCentered) {
      // furnitureX is offset of furniture center from wall center
      const furnitureCenterX = (wallWidth / 2) + furnitureX
      startX = furnitureCenterX - totalWidth / 2
    }
  } else {
    // From floor: anchorValue is distance from floor to BOTTOM of arrangement
    startY = wallHeight - anchorValue - totalHeight
  }

  const positions: FramePosition[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (frameWidth + hSpacing)
      const y = startY + row * (frameHeight + vSpacing)
      const hookX = x + frameWidth / 2
      const hookY = y + hangingOffset

      positions.push({
        id: row * cols + col + 1,
        name: `Frame ${row * cols + col + 1}`,
        row,
        col,
        x,
        y,
        width: frameWidth,
        height: frameHeight,
        hangingOffset,
        hookX,
        hookY,
        fromLeft: hookX,
        fromTop: hookY,
        fromFloor: wallHeight - hookY,
        fromRight: wallWidth - hookX,
        fromCeiling: hookY,
      })
    }
  }

  return positions
}
