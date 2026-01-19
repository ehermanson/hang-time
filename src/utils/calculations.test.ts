import { describe, expect, it } from 'vitest';
import type { CalculatorState } from '@/types';
import {
  calculateLayoutPositions,
  formatMeasurement,
  formatShort,
  fromDisplayUnit,
  INCH_TO_CM,
  toDisplayUnit,
} from './calculations';

// Default state factory for tests
const createDefaultState = (
  overrides: Partial<CalculatorState> = {},
): CalculatorState => ({
  unit: 'in',
  wallWidth: 120,
  wallHeight: 96,
  layoutType: 'grid',
  frameCount: 1,
  gridRows: 1,
  gridCols: 1,
  frameWidth: 16,
  frameHeight: 20,
  hangingOffset: 2,
  hangingType: 'center',
  hookInset: 2,
  hSpacing: 4,
  vSpacing: 4,
  hDistribution: 'fixed',
  vDistribution: 'fixed',
  anchorType: 'center',
  anchorValue: 0,
  hAnchorType: 'center',
  hAnchorValue: 0,
  furnitureWidth: 48,
  furnitureHeight: 30,
  furnitureX: 0,
  furnitureCentered: false,
  ...overrides,
});

describe('Unit Conversion', () => {
  describe('toDisplayUnit', () => {
    it('returns value unchanged for inches', () => {
      expect(toDisplayUnit(10, 'in')).toBe(10);
    });

    it('converts inches to centimeters', () => {
      expect(toDisplayUnit(10, 'cm')).toBe(10 * INCH_TO_CM);
    });

    it('handles zero', () => {
      expect(toDisplayUnit(0, 'in')).toBe(0);
      expect(toDisplayUnit(0, 'cm')).toBe(0);
    });

    it('handles decimal values', () => {
      expect(toDisplayUnit(2.5, 'cm')).toBeCloseTo(6.35);
    });
  });

  describe('fromDisplayUnit', () => {
    it('returns value unchanged for inches', () => {
      expect(fromDisplayUnit(10, 'in')).toBe(10);
    });

    it('converts centimeters to inches', () => {
      expect(fromDisplayUnit(25.4, 'cm')).toBeCloseTo(10);
    });

    it('handles zero', () => {
      expect(fromDisplayUnit(0, 'in')).toBe(0);
      expect(fromDisplayUnit(0, 'cm')).toBe(0);
    });

    it('roundtrips correctly', () => {
      const original = 15;
      const converted = toDisplayUnit(original, 'cm');
      const backConverted = fromDisplayUnit(converted, 'cm');
      expect(backConverted).toBeCloseTo(original);
    });
  });
});

describe('Measurement Formatting', () => {
  describe('formatMeasurement', () => {
    it('formats inches with quote suffix', () => {
      expect(formatMeasurement(10, 'in')).toBe('10"');
    });

    it('formats centimeters with cm suffix', () => {
      expect(formatMeasurement(10, 'cm')).toBe('10 cm');
    });

    it('trims trailing zeros for inches', () => {
      expect(formatMeasurement(10.5, 'in')).toBe('10.5"');
      expect(formatMeasurement(10.0, 'in')).toBe('10"');
    });

    it('shows up to 3 decimals for inches', () => {
      expect(formatMeasurement(10.125, 'in')).toBe('10.125"');
      expect(formatMeasurement(10.1256, 'in')).toBe('10.126"');
    });

    it('shows up to 1 decimal for centimeters', () => {
      expect(formatMeasurement(10.5, 'cm')).toBe('10.5 cm');
      expect(formatMeasurement(10.55, 'cm')).toBe('10.6 cm');
    });

    it('handles zero', () => {
      expect(formatMeasurement(0, 'in')).toBe('0"');
      expect(formatMeasurement(0, 'cm')).toBe('0 cm');
    });
  });

  describe('formatShort', () => {
    it('formats inches with quote suffix (no space)', () => {
      expect(formatShort(10, 'in')).toBe('10"');
    });

    it('formats centimeters with cm suffix (no space)', () => {
      expect(formatShort(10, 'cm')).toBe('10cm');
    });

    it('trims trailing zeros', () => {
      expect(formatShort(10.0, 'in')).toBe('10"');
      expect(formatShort(10.0, 'cm')).toBe('10cm');
    });
  });
});

describe('calculateLayoutPositions', () => {
  describe('Basic Layout', () => {
    it('returns correct number of frames', () => {
      const state = createDefaultState({
        frameCount: 4,
        gridRows: 2,
        gridCols: 2,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions).toHaveLength(4);
    });

    it('limits frames to grid capacity', () => {
      const state = createDefaultState({
        frameCount: 10,
        gridRows: 2,
        gridCols: 2,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions).toHaveLength(4); // 2x2 = 4 max
    });

    it('assigns sequential IDs starting from 1', () => {
      const state = createDefaultState({
        frameCount: 3,
        gridRows: 1,
        gridCols: 3,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions.map((p) => p.id)).toEqual([1, 2, 3]);
    });

    it('assigns row and col indices', () => {
      const state = createDefaultState({
        frameCount: 4,
        gridRows: 2,
        gridCols: 2,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0]).toMatchObject({ row: 0, col: 0 });
      expect(positions[1]).toMatchObject({ row: 0, col: 1 });
      expect(positions[2]).toMatchObject({ row: 1, col: 0 });
      expect(positions[3]).toMatchObject({ row: 1, col: 1 });
    });
  });

  describe('Row Layout', () => {
    it('treats row layout as single-row grid', () => {
      const state = createDefaultState({
        layoutType: 'row',
        frameCount: 3,
        gridRows: 5, // Should be ignored
        gridCols: 3,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions).toHaveLength(3);
      for (const p of positions) {
        expect(p.row).toBe(0);
      }
    });
  });

  describe('Center Hook (default)', () => {
    it('positions hook at frame center horizontally', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        hAnchorType: 'left',
        hAnchorValue: 0,
        hDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].hookX).toBe(10); // 0 + 20/2
    });

    it('positions hook at hangingOffset from top', () => {
      const state = createDefaultState({
        frameCount: 1,
        hangingOffset: 3,
        anchorType: 'ceiling',
        anchorValue: 0,
        vDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].hookY).toBe(3); // y=0 + hangingOffset=3
    });

    it('does not set hookX2 or hookGap', () => {
      const state = createDefaultState({ hangingType: 'center' });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].hookX2).toBeUndefined();
      expect(positions[0].hookGap).toBeUndefined();
    });
  });

  describe('Dual Hooks', () => {
    it('positions two hooks with correct inset', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        hangingType: 'dual',
        hookInset: 3,
        hAnchorType: 'left',
        hAnchorValue: 0,
        hDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].hookX).toBe(3); // left hook: x + inset
      expect(positions[0].hookX2).toBe(17); // right hook: x + width - inset
      expect(positions[0].hookGap).toBe(14); // width - 2*inset
    });
  });

  describe('Horizontal Distribution Modes', () => {
    const baseState = createDefaultState({
      frameCount: 3,
      gridRows: 1,
      gridCols: 3,
      frameWidth: 20,
      wallWidth: 100,
    });

    it('space-between: first at edge, last at edge', () => {
      const state = { ...baseState, hDistribution: 'space-between' as const };
      const positions = calculateLayoutPositions(state);
      // Available space = 100 - (3*20) = 40
      // Spacing = 40 / (3-1) = 20
      expect(positions[0].x).toBe(0);
      expect(positions[1].x).toBe(40); // 0 + 20 + 20
      expect(positions[2].x).toBe(80); // 0 + 2*(20+20)
    });

    it('space-evenly: equal space at edges and between', () => {
      const state = { ...baseState, hDistribution: 'space-evenly' as const };
      const positions = calculateLayoutPositions(state);
      // Available space = 100 - (3*20) = 40
      // Spacing = 40 / (3+1) = 10
      expect(positions[0].x).toBe(10);
      expect(positions[1].x).toBe(40); // 10 + 20 + 10
      expect(positions[2].x).toBe(70); // 10 + 2*(20+10)
    });

    it('space-around: half space at edges, full between', () => {
      const state = { ...baseState, hDistribution: 'space-around' as const };
      const positions = calculateLayoutPositions(state);
      // Available space = 100 - (3*20) = 40
      // Spacing = 40 / 3 ≈ 13.33
      // Start = spacing/2 ≈ 6.67
      const spacing = 40 / 3;
      expect(positions[0].x).toBeCloseTo(spacing / 2);
      expect(positions[1].x).toBeCloseTo(spacing / 2 + 20 + spacing);
    });

    it('fixed with center anchor: centers group on wall', () => {
      const state = {
        ...baseState,
        hDistribution: 'fixed' as const,
        hAnchorType: 'center' as const,
        hSpacing: 4,
      };
      const positions = calculateLayoutPositions(state);
      // Total width = 3*20 + 2*4 = 68
      // Start = (100 - 68) / 2 = 16
      expect(positions[0].x).toBe(16);
    });

    it('fixed with left anchor: positions from left edge', () => {
      const state = {
        ...baseState,
        hDistribution: 'fixed' as const,
        hAnchorType: 'left' as const,
        hAnchorValue: 10,
        hSpacing: 4,
      };
      const positions = calculateLayoutPositions(state);
      expect(positions[0].x).toBe(10);
    });

    it('fixed with right anchor: positions from right edge', () => {
      const state = {
        ...baseState,
        hDistribution: 'fixed' as const,
        hAnchorType: 'right' as const,
        hAnchorValue: 10,
        hSpacing: 4,
      };
      const positions = calculateLayoutPositions(state);
      // Total width = 3*20 + 2*4 = 68
      // Start = wallWidth - totalWidth - anchorValue = 100 - 68 - 10 = 22
      expect(positions[0].x).toBe(22);
    });
  });

  describe('Vertical Distribution Modes', () => {
    const baseState = createDefaultState({
      frameCount: 2,
      gridRows: 2,
      gridCols: 1,
      frameHeight: 20,
      wallHeight: 80,
    });

    it('space-between: first at top, last at bottom', () => {
      const state = { ...baseState, vDistribution: 'space-between' as const };
      const positions = calculateLayoutPositions(state);
      // Available = 80 - (2*20) = 40
      // Spacing = 40 / (2-1) = 40
      expect(positions[0].y).toBe(0);
      expect(positions[1].y).toBe(60); // 0 + 20 + 40
    });

    it('space-evenly: equal space at edges and between', () => {
      const state = { ...baseState, vDistribution: 'space-evenly' as const };
      const positions = calculateLayoutPositions(state);
      // Available = 80 - (2*20) = 40
      // Spacing = 40 / (2+1) ≈ 13.33
      const spacing = 40 / 3;
      expect(positions[0].y).toBeCloseTo(spacing);
      expect(positions[1].y).toBeCloseTo(spacing + 20 + spacing);
    });

    it('space-around: half space at edges', () => {
      const state = { ...baseState, vDistribution: 'space-around' as const };
      const positions = calculateLayoutPositions(state);
      // Available = 80 - (2*20) = 40
      // Spacing = 40 / 2 = 20
      expect(positions[0].y).toBe(10); // spacing/2
      expect(positions[1].y).toBe(50); // 10 + 20 + 20
    });
  });

  describe('Vertical Anchor Types (fixed distribution)', () => {
    const baseState = createDefaultState({
      frameCount: 1,
      frameHeight: 20,
      wallHeight: 100,
      vDistribution: 'fixed',
      vSpacing: 0,
    });

    it('center: vertically centers frame', () => {
      const state = { ...baseState, anchorType: 'center' as const };
      const positions = calculateLayoutPositions(state);
      expect(positions[0].y).toBe(40); // (100 - 20) / 2
    });

    it('ceiling: positions from top', () => {
      const state = {
        ...baseState,
        anchorType: 'ceiling' as const,
        anchorValue: 15,
      };
      const positions = calculateLayoutPositions(state);
      expect(positions[0].y).toBe(15);
    });

    it('floor: positions from bottom', () => {
      const state = {
        ...baseState,
        anchorType: 'floor' as const,
        anchorValue: 10,
      };
      const positions = calculateLayoutPositions(state);
      // y = wallHeight - anchorValue - totalHeight = 100 - 10 - 20 = 70
      expect(positions[0].y).toBe(70);
    });

    it('furniture: positions above furniture', () => {
      const state = {
        ...baseState,
        anchorType: 'furniture' as const,
        anchorValue: 5, // gap above furniture
        furnitureHeight: 30,
      };
      const positions = calculateLayoutPositions(state);
      // furnitureTop = 100 - 30 = 70
      // y = 70 - 5 - 20 = 45
      expect(positions[0].y).toBe(45);
    });
  });

  describe('Furniture Centering', () => {
    it('centers frames above furniture when enabled', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        vDistribution: 'fixed',
        hDistribution: 'fixed',
        anchorType: 'furniture',
        furnitureCentered: true,
        furnitureX: 10, // Furniture offset 10 to the right
      });
      const positions = calculateLayoutPositions(state);
      // Furniture center = wallWidth/2 + furnitureX = 50 + 10 = 60
      // Frame start = 60 - 20/2 = 50
      expect(positions[0].x).toBe(50);
    });

    it('does not affect horizontal position when furniture centering disabled', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        vDistribution: 'fixed',
        hDistribution: 'fixed',
        hAnchorType: 'center',
        anchorType: 'furniture',
        furnitureCentered: false,
        furnitureX: 10,
      });
      const positions = calculateLayoutPositions(state);
      // Should center on wall, ignoring furniture
      expect(positions[0].x).toBe(40); // (100 - 20) / 2
    });

    it('does not affect horizontal position when hDistribution is not fixed', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        vDistribution: 'fixed',
        hDistribution: 'space-evenly',
        anchorType: 'furniture',
        furnitureCentered: true,
        furnitureX: 10,
      });
      const positions = calculateLayoutPositions(state);
      // space-evenly: spacing = (100-20)/2 = 40, startX = 40
      expect(positions[0].x).toBe(40);
    });
  });

  describe('Distance Calculations', () => {
    it('calculates fromLeft as distance to hook', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        hAnchorType: 'left',
        hAnchorValue: 30,
        hDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      // hookX = x + width/2 = 30 + 10 = 40
      expect(positions[0].fromLeft).toBe(40);
    });

    it('calculates fromRight as distance from right hook', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        hangingType: 'dual',
        hookInset: 2,
        hAnchorType: 'left',
        hAnchorValue: 30,
        hDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      // hookX2 = x + width - inset = 30 + 20 - 2 = 48
      // fromRight = wallWidth - hookX2 = 100 - 48 = 52
      expect(positions[0].fromRight).toBe(52);
    });

    it('calculates fromFloor correctly', () => {
      const state = createDefaultState({
        frameCount: 1,
        hangingOffset: 2,
        wallHeight: 100,
        anchorType: 'ceiling',
        anchorValue: 10,
        vDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      // hookY = y + hangingOffset = 10 + 2 = 12
      // fromFloor = wallHeight - hookY = 100 - 12 = 88
      expect(positions[0].fromFloor).toBe(88);
    });

    it('calculates fromCeiling as hookY', () => {
      const state = createDefaultState({
        frameCount: 1,
        hangingOffset: 2,
        anchorType: 'ceiling',
        anchorValue: 10,
        vDistribution: 'fixed',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].fromCeiling).toBe(positions[0].hookY);
    });
  });

  describe('Edge Cases', () => {
    it('handles single frame with space-between (no division by zero)', () => {
      const state = createDefaultState({
        frameCount: 1,
        gridRows: 1,
        gridCols: 1,
        hDistribution: 'space-between',
        vDistribution: 'space-between',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions).toHaveLength(1);
      // With single frame, spacing should be 0, frame at edge
      expect(positions[0].x).toBe(0);
      expect(positions[0].y).toBe(0);
    });

    it('handles zero frame count', () => {
      const state = createDefaultState({ frameCount: 0 });
      const positions = calculateLayoutPositions(state);
      expect(positions).toHaveLength(0);
    });

    it('includes frame dimensions in position output', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 25,
        frameHeight: 35,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].width).toBe(25);
      expect(positions[0].height).toBe(35);
    });

    it('includes hangingOffset in position output', () => {
      const state = createDefaultState({
        frameCount: 1,
        hangingOffset: 5,
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].hangingOffset).toBe(5);
    });
  });

  describe('Out of Bounds Detection', () => {
    it('marks frame as in bounds when fully within wall', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        frameHeight: 20,
        wallWidth: 100,
        wallHeight: 100,
        hAnchorType: 'center',
        anchorType: 'center',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(false);
    });

    it('marks frame as out of bounds when extending past left edge', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        hDistribution: 'fixed',
        hAnchorType: 'left',
        hAnchorValue: -5, // Starts 5 units off the left edge
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(true);
    });

    it('marks frame as out of bounds when extending past right edge', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 20,
        wallWidth: 100,
        hDistribution: 'fixed',
        hAnchorType: 'left',
        hAnchorValue: 90, // Starts at 90, ends at 110
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(true);
    });

    it('marks frame as out of bounds when extending past top edge', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameHeight: 20,
        wallHeight: 100,
        vDistribution: 'fixed',
        anchorType: 'ceiling',
        anchorValue: -5, // Starts 5 units above ceiling
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(true);
    });

    it('marks frame as out of bounds when extending past bottom edge', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameHeight: 20,
        wallHeight: 100,
        vDistribution: 'fixed',
        anchorType: 'floor',
        anchorValue: -5, // Extends 5 units below floor
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(true);
    });

    it('marks multiple frames correctly when some are out of bounds', () => {
      const state = createDefaultState({
        layoutType: 'row',
        frameCount: 5,
        gridCols: 5,
        frameWidth: 30,
        wallWidth: 100,
        hDistribution: 'fixed',
        hAnchorType: 'center',
        hSpacing: 5,
      });
      const positions = calculateLayoutPositions(state);
      // Total width = 5*30 + 4*5 = 170, wall = 100
      // startX = (100 - 170) / 2 = -35
      // Some frames will be off left edge, some off right edge
      const outOfBoundsCount = positions.filter((p) => p.isOutOfBounds).length;
      expect(outOfBoundsCount).toBeGreaterThan(0);
    });

    it('detects out of bounds with too many frames in row layout', () => {
      const state = createDefaultState({
        layoutType: 'row',
        frameCount: 9,
        gridCols: 9,
        frameWidth: 24,
        wallWidth: 120,
        hDistribution: 'fixed',
        hAnchorType: 'center',
        hSpacing: 6,
      });
      const positions = calculateLayoutPositions(state);
      // Total width = 9*24 + 8*6 = 264, wall = 120
      // Frames definitely extend beyond wall
      expect(positions.some((p) => p.isOutOfBounds)).toBe(true);
    });

    it('frame exactly fitting wall is not out of bounds', () => {
      const state = createDefaultState({
        frameCount: 1,
        frameWidth: 100,
        frameHeight: 100,
        wallWidth: 100,
        wallHeight: 100,
        hDistribution: 'fixed',
        vDistribution: 'fixed',
        hAnchorType: 'center',
        anchorType: 'center',
      });
      const positions = calculateLayoutPositions(state);
      expect(positions[0].isOutOfBounds).toBe(false);
    });
  });
});
