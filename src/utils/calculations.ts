import type { CalculatorState, FramePosition, GalleryFrame } from '@/types'

export const INCH_TO_CM = 2.54

export const toDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value * INCH_TO_CM
}

export const fromDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value / INCH_TO_CM
}

// Format with up to 3 decimal places, trimming trailing zeros
const formatNumber = (value: number, maxDecimals: number): string => {
  const fixed = value.toFixed(maxDecimals)
  // Remove trailing zeros after decimal point
  return fixed.replace(/\.?0+$/, '')
}

export const formatMeasurement = (value: number, unit: 'in' | 'cm'): string => {
  // Inches: up to 3 decimals (1/8" = 0.125), cm: up to 1 decimal
  const decimals = unit === 'in' ? 3 : 1
  return unit === 'in' ? `${formatNumber(value, decimals)}"` : `${formatNumber(value, decimals)} cm`
}

export const formatShort = (value: number, unit: 'in' | 'cm'): string => {
  const decimals = unit === 'in' ? 3 : 1
  return unit === 'in' ? `${formatNumber(value, decimals)}"` : `${formatNumber(value, decimals)}cm`
}

export function calculateLayoutPositions(state: CalculatorState): FramePosition[] {
  const {
    layoutType,
    frameCount,
    gridRows,
    gridCols,
    frameWidth,
    frameHeight,
    hangingOffset,
    hangingType,
    hookInset,
    hSpacing,
    vSpacing,
    anchorType,
    anchorValue,
    hAnchorType,
    hAnchorValue,
    wallWidth,
    wallHeight,
    galleryFrames,
    furnitureHeight,
    furnitureX,
    furnitureCentered,
  } = state

  if (layoutType === 'gallery') {
    return galleryFrames.map((f: GalleryFrame) => {
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
  const maxFrames = Math.min(frameCount, rows * cols)
  let frameNum = 0

  for (let row = 0; row < rows && frameNum < maxFrames; row++) {
    for (let col = 0; col < cols && frameNum < maxFrames; col++) {
      const x = startX + col * (frameWidth + hSpacing)
      const y = startY + row * (frameHeight + vSpacing)
      const hookY = y + hangingOffset

      // Calculate hook positions based on hanging type
      let hookX: number
      let hookX2: number | undefined
      let hookGap: number | undefined

      if (hangingType === 'dual') {
        // Dual hooks: positioned inset from each edge
        hookX = x + hookInset  // Left hook
        hookX2 = x + frameWidth - hookInset  // Right hook
        hookGap = frameWidth - (2 * hookInset)  // Gap between hooks
      } else {
        // Center hook (default)
        hookX = x + frameWidth / 2
      }

      frameNum++
      positions.push({
        id: frameNum,
        name: `Frame ${frameNum}`,
        row,
        col,
        x,
        y,
        width: frameWidth,
        height: frameHeight,
        hangingOffset,
        hookX,
        hookX2,
        hookY,
        hookGap,
        fromLeft: hookX,  // Distance to first (left) hook
        fromTop: hookY,
        fromFloor: wallHeight - hookY,
        fromRight: wallWidth - (hookX2 ?? hookX),  // Distance from right hook (or center)
        fromCeiling: hookY,
      })
    }
  }

  return positions
}
