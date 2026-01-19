import type { CalculatorState, Distribution, FramePosition, GalleryFrame, GalleryVAlign } from '@/types';
import { getTemplateById } from './gallery-templates';

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

interface LayoutRow {
  id: string;
  frames: { frame: GalleryFrame; originalIndex: number }[];
  width: number;
  height: number;
  hSpacing: number;
  vAlign: GalleryVAlign;
  hDistribution: Distribution;
}

// Get effective frame dimensions (respects uniformSize toggle)
function getFrameDimensions(
  frame: GalleryFrame,
  state: CalculatorState
): { width: number; height: number } {
  if (state.uniformSize) {
    return { width: state.frameWidth, height: state.frameHeight };
  }
  return { width: frame.width, height: frame.height };
}

function calculateTemplatePositions(state: CalculatorState): FramePosition[] | null {
  const {
    frames,
    uniformSize,
    frameWidth: uniformWidth,
    frameHeight: uniformHeight,
    templateId,
    slotAssignments,
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

  if (!templateId) return null;

  const template = getTemplateById(templateId);
  if (!template) return null;

  // Auto-assign frames to slots if not manually assigned
  const assignments: Record<string, string> = { ...slotAssignments };
  const assignedFrameIds = new Set(Object.values(assignments));
  const unassignedSlots = template.slots.filter((s) => !assignments[s.id]);
  const unassignedFrames = frames.filter((f) => !assignedFrameIds.has(f.id));

  // Auto-assign unassigned frames to unassigned slots
  unassignedSlots.forEach((slot, i) => {
    if (i < unassignedFrames.length) {
      assignments[slot.id] = unassignedFrames[i].id;
    }
  });

  // Get assigned frames with their slot info
  const assignedFramesWithSlots = template.slots
    .map((slot) => {
      const frameId = assignments[slot.id];
      if (!frameId) return null;
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return null;
      return { slot, frame, frameIndex: frames.indexOf(frame) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (assignedFramesWithSlots.length === 0) return [];

  // Get effective frame dimensions
  const getEffectiveDimensions = (frame: GalleryFrame) => {
    if (uniformSize) {
      return { width: uniformWidth, height: uniformHeight };
    }
    return { width: frame.width, height: frame.height };
  };

  // Calculate slot centers (relative 0-1)
  const slotCenters = assignedFramesWithSlots.map(({ slot }) => ({
    x: slot.x + slot.width / 2,
    y: slot.y + slot.height / 2,
  }));

  // Find the bounding box of slot centers
  const minCenterX = Math.min(...slotCenters.map((c) => c.x));
  const maxCenterX = Math.max(...slotCenters.map((c) => c.x));
  const minCenterY = Math.min(...slotCenters.map((c) => c.y));
  const maxCenterY = Math.max(...slotCenters.map((c) => c.y));

  // Use available wall space (with some margin)
  const availableWidth = wallWidth * 0.85;
  const availableHeight = wallHeight * 0.75;

  // Calculate the spread needed for frame centers
  const effectiveDimensions = assignedFramesWithSlots.map((f) => getEffectiveDimensions(f.frame));
  const maxFrameWidth = Math.max(...effectiveDimensions.map((d) => d.width));
  const maxFrameHeight = Math.max(...effectiveDimensions.map((d) => d.height));

  // The usable area for centers is the available area minus half-frame margins
  const usableWidthForCenters = availableWidth - maxFrameWidth;
  const usableHeightForCenters = availableHeight - maxFrameHeight;

  // Calculate scale factors for x and y based on template spread
  const templateSpreadX = maxCenterX - minCenterX;
  const templateSpreadY = maxCenterY - minCenterY;

  const scaleX = templateSpreadX > 0 ? usableWidthForCenters / templateSpreadX : 0;
  const scaleY = templateSpreadY > 0 ? usableHeightForCenters / templateSpreadY : 0;

  let scale: number;
  if (scaleX === 0 && scaleY === 0) {
    scale = 1;
  } else if (scaleX === 0) {
    scale = scaleY;
  } else if (scaleY === 0) {
    scale = scaleX;
  } else {
    scale = Math.min(scaleX, scaleY);
  }

  // Calculate the actual spread of frame centers
  const actualSpreadX = templateSpreadX * scale;
  const actualSpreadY = templateSpreadY * scale;

  // Calculate the total bounding box of all frames
  const frameCentersX = assignedFramesWithSlots.map(({ slot }) =>
    (slot.x + slot.width / 2 - minCenterX) * scale
  );
  const frameCentersY = assignedFramesWithSlots.map(({ slot }) =>
    (slot.y + slot.height / 2 - minCenterY) * scale
  );

  let totalLayoutWidth = actualSpreadX;
  let totalLayoutHeight = actualSpreadY;

  assignedFramesWithSlots.forEach(({ frame }, i) => {
    const dims = getEffectiveDimensions(frame);
    const centerX = frameCentersX[i];
    const centerY = frameCentersY[i];
    const leftExtent = centerX - dims.width / 2;
    const rightExtent = centerX + dims.width / 2;
    const topExtent = centerY - dims.height / 2;
    const bottomExtent = centerY + dims.height / 2;

    if (leftExtent < 0) totalLayoutWidth = Math.max(totalLayoutWidth, actualSpreadX - leftExtent);
    if (rightExtent > actualSpreadX) totalLayoutWidth = Math.max(totalLayoutWidth, rightExtent);
    if (topExtent < 0) totalLayoutHeight = Math.max(totalLayoutHeight, actualSpreadY - topExtent);
    if (bottomExtent > actualSpreadY) totalLayoutHeight = Math.max(totalLayoutHeight, bottomExtent);
  });

  // Calculate offset to account for frames extending left/up of the first center
  let offsetX = 0;
  let offsetY = 0;
  assignedFramesWithSlots.forEach(({ frame }, i) => {
    const dims = getEffectiveDimensions(frame);
    const centerX = frameCentersX[i];
    const centerY = frameCentersY[i];
    offsetX = Math.max(offsetX, dims.width / 2 - centerX);
    offsetY = Math.max(offsetY, dims.height / 2 - centerY);
  });

  const boundingWidth = totalLayoutWidth;
  const boundingHeight = totalLayoutHeight;

  // Calculate layout origin based on anchoring
  let layoutX: number;
  if (hAnchorType === 'center') {
    layoutX = (wallWidth - boundingWidth) / 2;
  } else if (hAnchorType === 'left') {
    layoutX = hAnchorValue;
  } else {
    layoutX = wallWidth - boundingWidth - hAnchorValue;
  }

  let layoutY: number;
  if (anchorType === 'center') {
    layoutY = (wallHeight - boundingHeight) / 2;
  } else if (anchorType === 'ceiling') {
    layoutY = anchorValue;
  } else if (anchorType === 'floor') {
    layoutY = wallHeight - anchorValue - boundingHeight;
  } else {
    layoutY = wallHeight - anchorValue - boundingHeight;
  }

  // Clamp layout position to keep all frames within wall bounds
  layoutX = Math.max(0, layoutX);
  layoutX = Math.min(wallWidth - boundingWidth, layoutX);
  layoutY = Math.max(0, layoutY);
  layoutY = Math.min(wallHeight - boundingHeight, layoutY);

  // If layout is larger than wall, center it
  if (boundingWidth > wallWidth) {
    layoutX = (wallWidth - boundingWidth) / 2;
  }
  if (boundingHeight > wallHeight) {
    layoutY = (wallHeight - boundingHeight) / 2;
  }

  const positions: FramePosition[] = [];

  assignedFramesWithSlots.forEach(({ frame, frameIndex }, i) => {
    const dims = getEffectiveDimensions(frame);

    // Calculate frame center position
    const centerX = layoutX + offsetX + frameCentersX[i];
    const centerY = layoutY + offsetY + frameCentersY[i];

    // Frame top-left position
    const x = centerX - dims.width / 2;
    const y = centerY - dims.height / 2;
    const hookY = y + hangingOffset;

    // Calculate hook positions
    let hookX: number;
    let hookX2: number | undefined;
    let hookGap: number | undefined;

    if (hangingType === 'dual') {
      hookX = x + hookInset;
      hookX2 = x + dims.width - hookInset;
      hookGap = dims.width - 2 * hookInset;
    } else {
      hookX = x + dims.width / 2;
    }

    const isOutOfBounds =
      x < 0 ||
      y < 0 ||
      x + dims.width > wallWidth ||
      y + dims.height > wallHeight;

    positions.push({
      id: frameIndex + 1,
      name: `Frame ${frameIndex + 1}`,
      x,
      y,
      width: dims.width,
      height: dims.height,
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
  });

  positions.sort((a, b) => a.id - b.id);

  return positions;
}

export function calculateLayoutPositions(state: CalculatorState): FramePosition[] {
  const {
    frames,
    vAlign,
    rowMode,
    maxRowWidth,
    rowSpacing,
    rowConfigs,
    layoutMode,
    hSpacing,
    hDistribution,
    hangingOffset,
    hangingType,
    hookInset,
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

  if (frames.length === 0) return [];

  // Check if using template mode
  if (layoutMode === 'template') {
    const templatePositions = calculateTemplatePositions(state);
    if (templatePositions) return templatePositions;
    // Fall back to freeform if template not found
  }

  const effectiveMaxWidth = maxRowWidth ?? wallWidth;

  // Step 1: Group frames into rows
  const rows: LayoutRow[] = [];

  if (rowMode === 'manual') {
    // Manual mode: group by frame.row property
    const rowMap = new Map<number, LayoutRow['frames']>();
    frames.forEach((frame, index) => {
      const rowNum = frame.row ?? 0;
      if (!rowMap.has(rowNum)) {
        rowMap.set(rowNum, []);
      }
      rowMap.get(rowNum)!.push({ frame, originalIndex: index });
    });

    // Sort by row number and create row objects
    const sortedRowNums = [...rowMap.keys()].sort((a, b) => a - b);
    sortedRowNums.forEach((rowNum, idx) => {
      const rowFrames = rowMap.get(rowNum)!;
      const rowConfig = rowConfigs.find((c) => c.id === `row-${idx}`);
      const rowHSpacing = rowConfig?.hSpacing ?? hSpacing;
      const rowVAlign = rowConfig?.vAlign ?? vAlign;
      const rowHDistribution = rowConfig?.hDistribution ?? hDistribution;

      const rowWidth =
        rowFrames.reduce((sum, f) => sum + getFrameDimensions(f.frame, state).width, 0) +
        (rowFrames.length - 1) * rowHSpacing;
      const rowHeight = Math.max(...rowFrames.map((f) => getFrameDimensions(f.frame, state).height));

      rows.push({
        id: `row-${idx}`,
        frames: rowFrames,
        width: rowWidth,
        height: rowHeight,
        hSpacing: rowHSpacing,
        vAlign: rowVAlign,
        hDistribution: rowHDistribution,
      });
    });
  } else {
    // Auto mode: wrap when cumulative width exceeds maxWidth
    let currentRowFrames: LayoutRow['frames'] = [];
    let currentRowWidth = 0;
    let rowIndex = 0;

    frames.forEach((frame, index) => {
      const dims = getFrameDimensions(frame, state);
      const frameWithGap = dims.width + (currentRowFrames.length > 0 ? hSpacing : 0);

      if (currentRowFrames.length > 0 && currentRowWidth + frameWithGap > effectiveMaxWidth) {
        // Finish current row
        const rowConfig = rowConfigs.find((c) => c.id === `row-${rowIndex}`);
        const rowHSpacing = rowConfig?.hSpacing ?? hSpacing;
        const rowVAlign = rowConfig?.vAlign ?? vAlign;
        const rowHDistribution = rowConfig?.hDistribution ?? hDistribution;

        const rowWidth =
          currentRowFrames.reduce((sum, f) => sum + getFrameDimensions(f.frame, state).width, 0) +
          (currentRowFrames.length - 1) * rowHSpacing;
        const rowHeight = Math.max(...currentRowFrames.map((f) => getFrameDimensions(f.frame, state).height));

        rows.push({
          id: `row-${rowIndex}`,
          frames: currentRowFrames,
          width: rowWidth,
          height: rowHeight,
          hSpacing: rowHSpacing,
          vAlign: rowVAlign,
          hDistribution: rowHDistribution,
        });

        rowIndex++;
        currentRowFrames = [];
        currentRowWidth = 0;
      }

      currentRowFrames.push({ frame, originalIndex: index });
      currentRowWidth += currentRowFrames.length === 1 ? dims.width : dims.width + hSpacing;
    });

    // Add the last row
    if (currentRowFrames.length > 0) {
      const rowConfig = rowConfigs.find((c) => c.id === `row-${rowIndex}`);
      const rowHSpacing = rowConfig?.hSpacing ?? hSpacing;
      const rowVAlign = rowConfig?.vAlign ?? vAlign;
      const rowHDistribution = rowConfig?.hDistribution ?? hDistribution;

      const rowWidth =
        currentRowFrames.reduce((sum, f) => sum + getFrameDimensions(f.frame, state).width, 0) +
        (currentRowFrames.length - 1) * rowHSpacing;
      const rowHeight = Math.max(...currentRowFrames.map((f) => getFrameDimensions(f.frame, state).height));

      rows.push({
        id: `row-${rowIndex}`,
        frames: currentRowFrames,
        width: rowWidth,
        height: rowHeight,
        hSpacing: rowHSpacing,
        vAlign: rowVAlign,
        hDistribution: rowHDistribution,
      });
    }
  }

  // Step 2: Calculate total height
  const totalHeight =
    rows.reduce((sum, row) => sum + row.height, 0) +
    (rows.length - 1) * rowSpacing;

  // Step 3: Calculate vertical starting position based on anchor type
  let boundingBoxY: number;
  if (anchorType === 'center') {
    boundingBoxY = (wallHeight - totalHeight) / 2;
  } else if (anchorType === 'ceiling') {
    boundingBoxY = anchorValue;
  } else if (anchorType === 'floor') {
    boundingBoxY = wallHeight - anchorValue - totalHeight;
  } else if (anchorType === 'furniture') {
    const furnitureTop = wallHeight - furnitureHeight;
    if (furnitureVAnchor === 'center') {
      boundingBoxY = (furnitureTop - totalHeight) / 2;
    } else if (furnitureVAnchor === 'ceiling') {
      boundingBoxY = anchorValue;
    } else {
      // above-furniture
      boundingBoxY = furnitureTop - anchorValue - totalHeight;
    }
  } else {
    boundingBoxY = wallHeight - anchorValue - totalHeight;
  }

  // Step 4: Position frames within each row
  const positions: FramePosition[] = [];
  let currentRowY = boundingBoxY;

  rows.forEach((row, rowIdx) => {
    const framesInRow = row.frames.length;
    const totalFrameWidth = row.frames.reduce(
      (sum, f) => sum + getFrameDimensions(f.frame, state).width,
      0
    );

    // Calculate horizontal positioning based on distribution mode
    let effectiveHSpacing = row.hSpacing;
    let rowStartX: number;

    if (row.hDistribution !== 'fixed') {
      const availableSpace = wallWidth - totalFrameWidth;

      switch (row.hDistribution) {
        case 'space-between':
          effectiveHSpacing = framesInRow > 1 ? availableSpace / (framesInRow - 1) : 0;
          rowStartX = 0;
          break;
        case 'space-evenly':
          effectiveHSpacing = availableSpace / (framesInRow + 1);
          rowStartX = effectiveHSpacing;
          break;
        case 'space-around':
          effectiveHSpacing = availableSpace / framesInRow;
          rowStartX = effectiveHSpacing / 2;
          break;
        default:
          rowStartX = 0;
      }
    } else {
      // Fixed mode: use anchor-based positioning
      // Recalculate row width with fixed spacing
      const fixedRowWidth = totalFrameWidth + (framesInRow - 1) * row.hSpacing;

      // Handle furniture alignment
      if (anchorType === 'furniture') {
        let furnitureLeft: number;
        if (furnitureAnchor === 'center') {
          furnitureLeft = (wallWidth - furnitureWidth) / 2;
        } else if (furnitureAnchor === 'left') {
          furnitureLeft = furnitureOffset;
        } else {
          furnitureLeft = wallWidth - furnitureWidth - furnitureOffset;
        }
        const furnitureCenterX = furnitureLeft + furnitureWidth / 2;

        if (frameFurnitureAlign === 'span') {
          // Use distribution within furniture width bounds
          if (hDistribution !== 'fixed') {
            const availableSpace = furnitureWidth - totalFrameWidth;

            switch (hDistribution) {
              case 'space-between':
                effectiveHSpacing = framesInRow > 1 ? availableSpace / (framesInRow - 1) : 0;
                rowStartX = furnitureLeft;
                break;
              case 'space-evenly':
                effectiveHSpacing = availableSpace / (framesInRow + 1);
                rowStartX = furnitureLeft + effectiveHSpacing;
                break;
              case 'space-around':
                effectiveHSpacing = availableSpace / framesInRow;
                rowStartX = furnitureLeft + effectiveHSpacing / 2;
                break;
              default:
                rowStartX = furnitureLeft;
            }
          } else {
            rowStartX = furnitureCenterX - fixedRowWidth / 2;
          }
        } else if (frameFurnitureAlign === 'center') {
          rowStartX = furnitureCenterX - fixedRowWidth / 2;
        } else if (frameFurnitureAlign === 'left') {
          rowStartX = furnitureLeft;
        } else {
          // right
          rowStartX = furnitureLeft + furnitureWidth - fixedRowWidth;
        }
      } else {
        // Standard anchor-based positioning
        if (hAnchorType === 'center') {
          rowStartX = (wallWidth - fixedRowWidth) / 2;
        } else if (hAnchorType === 'left') {
          rowStartX = hAnchorValue;
        } else {
          rowStartX = wallWidth - fixedRowWidth - hAnchorValue;
        }
      }
    }

    let currentX = rowStartX;

    row.frames.forEach(({ frame, originalIndex }) => {
      const dims = getFrameDimensions(frame, state);

      // Position frame vertically within row based on vAlign
      let y: number;
      if (row.vAlign === 'top') {
        y = currentRowY;
      } else if (row.vAlign === 'bottom') {
        y = currentRowY + row.height - dims.height;
      } else {
        // center
        y = currentRowY + (row.height - dims.height) / 2;
      }
      const hookY = y + hangingOffset;

      // Calculate hook positions
      let hookX: number;
      let hookX2: number | undefined;
      let hookGap: number | undefined;

      if (hangingType === 'dual') {
        hookX = currentX + hookInset;
        hookX2 = currentX + dims.width - hookInset;
        hookGap = dims.width - 2 * hookInset;
      } else {
        hookX = currentX + dims.width / 2;
      }

      const isOutOfBounds =
        currentX < 0 ||
        y < 0 ||
        currentX + dims.width > wallWidth ||
        y + dims.height > wallHeight;

      positions.push({
        id: originalIndex + 1,
        name: `Frame ${originalIndex + 1}`,
        row: rowIdx,
        x: currentX,
        y,
        width: dims.width,
        height: dims.height,
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

      currentX += dims.width + effectiveHSpacing;
    });

    currentRowY += row.height + rowSpacing;
  });

  // Sort by original index
  positions.sort((a, b) => a.id - b.id);

  return positions;
}
