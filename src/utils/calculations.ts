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

function calculateGalleryPositions(state: CalculatorState): FramePosition[] {
  const {
    galleryFrames,
    galleryVAlign,
    hSpacing,
    hangingOffset,
    hangingType,
    hookInset,
    anchorType,
    anchorValue,
    hAnchorType,
    hAnchorValue,
    wallWidth,
    wallHeight,
  } = state;

  if (galleryFrames.length === 0) return [];

  // Calculate total width of gallery (sum of frames + gaps)
  const totalWidth =
    galleryFrames.reduce((sum, f) => sum + f.width, 0) +
    (galleryFrames.length - 1) * hSpacing;

  // Calculate max height of all frames
  const maxHeight = Math.max(...galleryFrames.map((f) => f.height));

  // Calculate horizontal start position (bounding box left edge)
  let startX: number;
  if (hAnchorType === 'center') {
    startX = (wallWidth - totalWidth) / 2;
  } else if (hAnchorType === 'left') {
    startX = hAnchorValue;
  } else {
    startX = wallWidth - totalWidth - hAnchorValue;
  }

  // Calculate vertical position of the bounding box top
  let boundingBoxY: number;
  if (anchorType === 'center') {
    boundingBoxY = (wallHeight - maxHeight) / 2;
  } else if (anchorType === 'ceiling') {
    boundingBoxY = anchorValue;
  } else if (anchorType === 'floor') {
    // anchorValue is distance from floor to bottom of bounding box
    boundingBoxY = wallHeight - anchorValue - maxHeight;
  } else {
    // furniture mode - treat same as floor for now
    boundingBoxY = wallHeight - anchorValue - maxHeight;
  }

  const positions: FramePosition[] = [];
  let currentX = startX;

  galleryFrames.forEach((frame, index) => {
    // Position frame vertically within bounding box based on alignment
    let y: number;
    if (galleryVAlign === 'top') {
      y = boundingBoxY;
    } else if (galleryVAlign === 'bottom') {
      y = boundingBoxY + maxHeight - frame.height;
    } else {
      // center (default)
      y = boundingBoxY + (maxHeight - frame.height) / 2;
    }
    const hookY = y + hangingOffset;

    // Calculate hook positions based on hanging type
    let hookX: number;
    let hookX2: number | undefined;
    let hookGap: number | undefined;

    if (hangingType === 'dual') {
      hookX = currentX + hookInset;
      hookX2 = currentX + frame.width - hookInset;
      hookGap = frame.width - 2 * hookInset;
    } else {
      hookX = currentX + frame.width / 2;
    }

    // Check if frame extends beyond wall boundaries
    const isOutOfBounds =
      currentX < 0 ||
      y < 0 ||
      currentX + frame.width > wallWidth ||
      y + frame.height > wallHeight;

    positions.push({
      id: index + 1,
      name: `Frame ${index + 1}`,
      x: currentX,
      y,
      width: frame.width,
      height: frame.height,
      hangingOffset,
      hookX,
      hookX2,
      hookY,
      hookGap,
      fromLeft: hookX,
      fromTop: hookY,
      fromFloor: wallHeight - hookY,
      fromRight: wallWidth - (hookX2 ?? hookX),
      fromCeiling: hookY,
      isOutOfBounds,
    });

    currentX += frame.width + hSpacing;
  });

  return positions;
}

export function calculateLayoutPositions(
  state: CalculatorState,
): FramePosition[] {
  // Gallery mode has separate calculation
  if (state.layoutType === 'gallery') {
    return calculateGalleryPositions(state);
  }

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
    furnitureWidth,
    furnitureHeight,
    furnitureAnchor,
    furnitureOffset,
    frameFurnitureAlign,
    furnitureVAnchor,
  } = state;

  const rows = layoutType === 'row' ? 1 : gridRows;
  const cols = gridCols;

  // Calculate actual number of frames that will be displayed
  const maxFrames = Math.min(frameCount, rows * cols);
  const actualCols = layoutType === 'row' ? maxFrames : cols;
  const actualRows = layoutType === 'row' ? 1 : Math.ceil(maxFrames / cols);

  // Calculate effective spacing based on distribution mode
  let effectiveHSpacing = hSpacing;
  let effectiveVSpacing = vSpacing;

  // Calculate total frame dimensions (without gaps) - use actual frame count
  const totalFrameWidth = actualCols * frameWidth;
  const totalFrameHeight = actualRows * frameHeight;

  // Calculate horizontal spacing and start position based on distribution
  let startX: number;
  if (hDistribution !== 'fixed') {
    const availableHSpace = wallWidth - totalFrameWidth;

    switch (hDistribution) {
      case 'space-between':
        // First/last frames at edges, equal gaps between
        effectiveHSpacing = actualCols > 1 ? availableHSpace / (actualCols - 1) : 0;
        startX = 0;
        break;
      case 'space-evenly':
        // Equal space at edges and between all frames
        effectiveHSpacing = availableHSpace / (actualCols + 1);
        startX = effectiveHSpacing;
        break;
      case 'space-around':
        // Half-size space at edges, full space between
        effectiveHSpacing = availableHSpace / actualCols;
        startX = effectiveHSpacing / 2;
        break;
    }
  } else {
    // Fixed mode: use original anchor-based positioning
    const totalWidth = actualCols * frameWidth + (actualCols - 1) * hSpacing;
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
        effectiveVSpacing = actualRows > 1 ? availableVSpace / (actualRows - 1) : 0;
        startY = 0;
        break;
      case 'space-evenly':
        // Equal space at edges and between all frames
        effectiveVSpacing = availableVSpace / (actualRows + 1);
        startY = effectiveVSpacing;
        break;
      case 'space-around':
        // Half-size space at edges, full space between
        effectiveVSpacing = availableVSpace / actualRows;
        startY = effectiveVSpacing / 2;
        break;
    }
  } else {
    // Fixed mode: use original anchor-based positioning
    const totalHeight = actualRows * frameHeight + (actualRows - 1) * vSpacing;
    if (anchorType === 'center') {
      startY = (wallHeight - totalHeight) / 2;
    } else if (anchorType === 'ceiling') {
      startY = anchorValue;
    } else if (anchorType === 'furniture') {
      // Calculate furniture left edge based on anchor
      let furnitureLeft: number;
      if (furnitureAnchor === 'center') {
        furnitureLeft = (wallWidth - furnitureWidth) / 2;
      } else if (furnitureAnchor === 'left') {
        furnitureLeft = furnitureOffset;
      } else {
        furnitureLeft = wallWidth - furnitureWidth - furnitureOffset;
      }
      const furnitureCenterX = furnitureLeft + furnitureWidth / 2;

      // Calculate vertical position based on furniture vertical anchor
      const furnitureTop = wallHeight - furnitureHeight;
      if (furnitureVAnchor === 'center') {
        // Center frames between ceiling and furniture top
        startY = (furnitureTop - totalHeight) / 2;
      } else if (furnitureVAnchor === 'ceiling') {
        // Position from ceiling
        startY = anchorValue;
      } else {
        // above-furniture: Position above furniture with gap (anchorValue)
        startY = furnitureTop - anchorValue - totalHeight;
      }

      // Calculate frame horizontal positioning based on alignment
      if (frameFurnitureAlign === 'span') {
        // Use hDistribution within furniture width bounds
        const totalWidth = actualCols * frameWidth + (actualCols - 1) * effectiveHSpacing;

        if (hDistribution !== 'fixed') {
          const availableHSpace = furnitureWidth - totalFrameWidth;

          switch (hDistribution) {
            case 'space-between':
              effectiveHSpacing = actualCols > 1 ? availableHSpace / (actualCols - 1) : 0;
              startX = furnitureLeft;
              break;
            case 'space-evenly':
              effectiveHSpacing = availableHSpace / (actualCols + 1);
              startX = furnitureLeft + effectiveHSpacing;
              break;
            case 'space-around':
              effectiveHSpacing = availableHSpace / actualCols;
              startX = furnitureLeft + effectiveHSpacing / 2;
              break;
          }
        } else {
          // Fixed spacing, center within furniture
          startX = furnitureCenterX - totalWidth / 2;
        }
      } else {
        // For left/center/right alignment, use fixed hSpacing
        effectiveHSpacing = hSpacing;
        const totalWidth = actualCols * frameWidth + (actualCols - 1) * hSpacing;

        if (frameFurnitureAlign === 'center') {
          startX = furnitureCenterX - totalWidth / 2;
        } else if (frameFurnitureAlign === 'left') {
          startX = furnitureLeft;
        } else {
          // right alignment
          startX = furnitureLeft + furnitureWidth - totalWidth;
        }
      }
    } else {
      // From floor: anchorValue is distance from floor to BOTTOM of arrangement
      startY = wallHeight - anchorValue - totalHeight;
    }
  }

  const positions: FramePosition[] = [];
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

      // Check if frame extends beyond wall boundaries
      const isOutOfBounds =
        x < 0 ||
        y < 0 ||
        x + frameWidth > wallWidth ||
        y + frameHeight > wallHeight;

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
        isOutOfBounds,
      });
    }
  }

  return positions;
}
