import type { CalculatorState, FramePosition } from '@/types';

export const INCH_TO_CM = 2.54;

export const toDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value * INCH_TO_CM;
};

export const fromDisplayUnit = (value: number, unit: 'in' | 'cm'): number => {
  return unit === 'in' ? value : value / INCH_TO_CM;
};

// Format with up to 3 decimal places, trimming trailing zeros
const formatNumber = (value: number, maxDecimals: number): string => {
  const fixed = value.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point
  return fixed.replace(/\.?0+$/, '');
};

export const formatMeasurement = (value: number, unit: 'in' | 'cm'): string => {
  // Inches: up to 3 decimals (1/8" = 0.125), cm: up to 1 decimal
  const decimals = unit === 'in' ? 3 : 1;
  return unit === 'in'
    ? `${formatNumber(value, decimals)}"`
    : `${formatNumber(value, decimals)} cm`;
};

export const formatShort = (value: number, unit: 'in' | 'cm'): string => {
  const decimals = unit === 'in' ? 3 : 1;
  return unit === 'in'
    ? `${formatNumber(value, decimals)}"`
    : `${formatNumber(value, decimals)}cm`;
};

export function calculateLayoutPositions(
  state: CalculatorState,
): FramePosition[] {
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
    hDistribution,
    vDistribution,
    anchorType,
    anchorValue,
    hAnchorType,
    hAnchorValue,
    wallWidth,
    wallHeight,
    furnitureHeight,
    furnitureX,
    furnitureCentered,
  } = state;

  const rows = layoutType === 'row' ? 1 : gridRows;
  const cols = gridCols;

  // Calculate effective spacing based on distribution mode
  let effectiveHSpacing = hSpacing;
  let effectiveVSpacing = vSpacing;

  // Calculate total frame dimensions (without gaps)
  const totalFrameWidth = cols * frameWidth;
  const totalFrameHeight = rows * frameHeight;

  // Calculate horizontal spacing and start position based on distribution
  let startX: number;
  if (hDistribution !== 'fixed') {
    const availableHSpace = wallWidth - totalFrameWidth;

    switch (hDistribution) {
      case 'space-between':
        // First/last frames at edges, equal gaps between
        effectiveHSpacing = cols > 1 ? availableHSpace / (cols - 1) : 0;
        startX = 0;
        break;
      case 'space-evenly':
        // Equal space at edges and between all frames
        effectiveHSpacing = availableHSpace / (cols + 1);
        startX = effectiveHSpacing;
        break;
      case 'space-around':
        // Half-size space at edges, full space between
        effectiveHSpacing = availableHSpace / cols;
        startX = effectiveHSpacing / 2;
        break;
    }
  } else {
    // Fixed mode: use original anchor-based positioning
    const totalWidth = cols * frameWidth + (cols - 1) * hSpacing;
    if (hAnchorType === 'center') {
      startX = (wallWidth - totalWidth) / 2;
    } else if (hAnchorType === 'left') {
      startX = hAnchorValue;
    } else {
      startX = wallWidth - totalWidth - hAnchorValue;
    }
  }

  // Calculate vertical spacing and start position based on distribution
  let startY: number;
  if (vDistribution !== 'fixed') {
    const availableVSpace = wallHeight - totalFrameHeight;

    switch (vDistribution) {
      case 'space-between':
        // First/last frames at edges, equal gaps between
        effectiveVSpacing = rows > 1 ? availableVSpace / (rows - 1) : 0;
        startY = 0;
        break;
      case 'space-evenly':
        // Equal space at edges and between all frames
        effectiveVSpacing = availableVSpace / (rows + 1);
        startY = effectiveVSpacing;
        break;
      case 'space-around':
        // Half-size space at edges, full space between
        effectiveVSpacing = availableVSpace / rows;
        startY = effectiveVSpacing / 2;
        break;
    }
  } else {
    // Fixed mode: use original anchor-based positioning
    const totalHeight = rows * frameHeight + (rows - 1) * vSpacing;
    if (anchorType === 'center') {
      startY = (wallHeight - totalHeight) / 2;
    } else if (anchorType === 'ceiling') {
      startY = anchorValue;
    } else if (anchorType === 'furniture') {
      // Position above furniture with gap (anchorValue)
      const furnitureTop = wallHeight - furnitureHeight;
      startY = furnitureTop - anchorValue - totalHeight;

      // If furniture centering is enabled, override horizontal positioning
      // (only if horizontal distribution is also fixed)
      if (furnitureCentered && hDistribution === 'fixed') {
        const totalWidth = cols * frameWidth + (cols - 1) * hSpacing;
        const furnitureCenterX = wallWidth / 2 + furnitureX;
        startX = furnitureCenterX - totalWidth / 2;
      }
    } else {
      // From floor: anchorValue is distance from floor to BOTTOM of arrangement
      startY = wallHeight - anchorValue - totalHeight;
    }
  }

  const positions: FramePosition[] = [];
  const maxFrames = Math.min(frameCount, rows * cols);
  let frameNum = 0;

  for (let row = 0; row < rows && frameNum < maxFrames; row++) {
    for (let col = 0; col < cols && frameNum < maxFrames; col++) {
      const x = startX + col * (frameWidth + effectiveHSpacing);
      const y = startY + row * (frameHeight + effectiveVSpacing);
      const hookY = y + hangingOffset;

      // Calculate hook positions based on hanging type
      let hookX: number;
      let hookX2: number | undefined;
      let hookGap: number | undefined;

      if (hangingType === 'dual') {
        // Dual hooks: positioned inset from each edge
        hookX = x + hookInset; // Left hook
        hookX2 = x + frameWidth - hookInset; // Right hook
        hookGap = frameWidth - 2 * hookInset; // Gap between hooks
      } else {
        // Center hook (default)
        hookX = x + frameWidth / 2;
      }

      frameNum++;
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
        fromLeft: hookX, // Distance to first (left) hook
        fromTop: hookY,
        fromFloor: wallHeight - hookY,
        fromRight: wallWidth - (hookX2 ?? hookX), // Distance from right hook (or center)
        fromCeiling: hookY,
      });
    }
  }

  return positions;
}
