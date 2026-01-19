import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback, useMemo } from 'react';
import type {
  AnchorType,
  CalculatorState,
  Distribution,
  FrameFurnitureAlignment,
  FramePosition,
  FurnitureAnchor,
  FurnitureVerticalAnchor,
  GalleryFrame,
  GalleryVAlign,
  HangingType,
  HorizontalAnchorType,
  LayoutType,
  Unit,
} from '@/types';
import {
  calculateLayoutPositions,
  fromDisplayUnit,
  toDisplayUnit,
} from '@/utils/calculations';

const UNIT_STORAGE_KEY = 'picture-hanging-unit';

// Get saved unit from localStorage or default to 'in'
function getSavedUnit(): 'in' | 'cm' {
  if (typeof window === 'undefined') return 'in';
  const saved = localStorage.getItem(UNIT_STORAGE_KEY);
  return saved === 'cm' ? 'cm' : 'in';
}

// Parser definitions grouped by concern
const wallParsers = {
  u: parseAsStringLiteral(['in', 'cm'] as const).withDefault(getSavedUnit()),
  ww: parseAsFloat.withDefault(120),
  wh: parseAsFloat.withDefault(96),
};

const layoutParsers = {
  lt: parseAsStringLiteral(['grid', 'row', 'gallery'] as const).withDefault('row'),
  fc: parseAsInteger.withDefault(3), // frame count - primary input
  gr: parseAsInteger.withDefault(1),
  gc: parseAsInteger.withDefault(3),
};

const galleryParsers = {
  gf: parseAsString.withDefault(''), // JSON-encoded GalleryFrame[]
  gva: parseAsStringLiteral(['center', 'top', 'bottom'] as const).withDefault('center'),
};

const frameParsers = {
  fw: parseAsFloat.withDefault(12),
  fh: parseAsFloat.withDefault(12),
  ho: parseAsFloat.withDefault(2),
  ht: parseAsStringLiteral(['center', 'dual'] as const).withDefault('center'),
  hi: parseAsFloat.withDefault(3), // hook inset from edge for dual hanging
  hs: parseAsFloat.withDefault(3),
  vs: parseAsFloat.withDefault(3),
  hd: parseAsStringLiteral([
    'fixed',
    'space-between',
    'space-evenly',
    'space-around',
  ] as const).withDefault('fixed'),
  vd: parseAsStringLiteral([
    'fixed',
    'space-between',
    'space-evenly',
    'space-around',
  ] as const).withDefault('fixed'),
};

const positionParsers = {
  at: parseAsStringLiteral([
    'floor',
    'ceiling',
    'center',
    'furniture',
  ] as const).withDefault('floor'),
  av: parseAsFloat.withDefault(57),
  hat: parseAsStringLiteral(['center', 'left', 'right'] as const).withDefault(
    'center',
  ),
  hav: parseAsFloat.withDefault(0),
};

const furnitureParsers = {
  fuw: parseAsFloat.withDefault(48),
  fuh: parseAsFloat.withDefault(30),
  fua: parseAsStringLiteral(['left', 'center', 'right'] as const).withDefault('center'),
  fuo: parseAsFloat.withDefault(0),
  ffa: parseAsStringLiteral(['left', 'center', 'right', 'span'] as const).withDefault('center'),
  fva: parseAsStringLiteral(['center', 'ceiling', 'above-furniture'] as const).withDefault('above-furniture'),
};

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Parse gallery frames from JSON string
function parseGalleryFrames(json: string): GalleryFrame[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f): f is GalleryFrame =>
          typeof f.id === 'string' &&
          typeof f.width === 'number' &&
          typeof f.height === 'number'
      );
    }
  } catch {
    // Invalid JSON
  }
  return [];
}

export function useCalculator() {
  // URL-synced state grouped by concern
  const [wall, setWall] = useQueryStates(wallParsers);
  const [layout, setLayout] = useQueryStates(layoutParsers);
  const [frame, setFrame] = useQueryStates(frameParsers);
  const [position, setPosition] = useQueryStates(positionParsers);
  const [furniture, setFurniture] = useQueryStates(furnitureParsers);
  const [gallery, setGallery] = useQueryStates(galleryParsers);

  // Parse gallery frames from URL state
  const galleryFrames = useMemo(
    () => parseGalleryFrames(gallery.gf),
    [gallery.gf]
  );

  // Construct state object for calculations
  const state: CalculatorState = useMemo(
    () => ({
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
      hDistribution: frame.hd as Distribution,
      vDistribution: frame.vd as Distribution,
      anchorType: position.at as AnchorType,
      anchorValue: position.av,
      hAnchorType: position.hat as HorizontalAnchorType,
      hAnchorValue: position.hav,
      furnitureWidth: furniture.fuw,
      furnitureHeight: furniture.fuh,
      furnitureAnchor: furniture.fua as FurnitureAnchor,
      furnitureOffset: furniture.fuo,
      frameFurnitureAlign: furniture.ffa as FrameFurnitureAlignment,
      furnitureVAnchor: furniture.fva as FurnitureVerticalAnchor,
      galleryFrames,
      galleryVAlign: gallery.gva as GalleryVAlign,
    }),
    [wall, layout, frame, position, furniture, galleryFrames, gallery.gva],
  );

  // Unit conversion helpers
  const u = useCallback(
    (val: number) => toDisplayUnit(val, state.unit),
    [state.unit],
  );
  const fromU = useCallback(
    (val: number) => fromDisplayUnit(val, state.unit),
    [state.unit],
  );

  // Calculate layout positions
  const layoutPositions: FramePosition[] = useMemo(
    () => calculateLayoutPositions(state),
    [state],
  );

  // Total frames count (use frameCount, but cap at grid capacity)
  const totalFrames = Math.min(
    state.frameCount,
    state.gridRows * state.gridCols,
  );

  // Setters that maintain the original API
  const setUnit = (value: Unit) => setWall({ u: value });
  const setWallWidth = (value: number) => setWall({ ww: value });
  const setWallHeight = (value: number) => setWall({ wh: value });
  const setLayoutType = (value: LayoutType) => setLayout({ lt: value });
  const setFrameCount = (value: number) => setLayout({ fc: value });
  const setGridRows = (value: number) => setLayout({ gr: value });
  const setGridCols = (value: number) => setLayout({ gc: value });

  // Apply a layout configuration (type + rows/cols)
  const applyLayout = (type: LayoutType, rows: number, cols: number) => {
    setLayout({ lt: type, gr: rows, gc: cols });
  };
  const setFrameWidth = (value: number) => setFrame({ fw: value });
  const setFrameHeight = (value: number) => setFrame({ fh: value });
  const setHangingOffset = (value: number) => setFrame({ ho: value });
  const setHangingType = (value: HangingType) => setFrame({ ht: value });
  const setHookInset = (value: number) => setFrame({ hi: value });
  const setHSpacing = (value: number) => setFrame({ hs: value });
  const setVSpacing = (value: number) => setFrame({ vs: value });
  const setHDistribution = (value: Distribution) => setFrame({ hd: value });
  const setVDistribution = (value: Distribution) => setFrame({ vd: value });
  const setAnchorType = (value: AnchorType) => setPosition({ at: value });
  const setAnchorValue = (value: number) => setPosition({ av: value });
  const setHAnchorType = (value: HorizontalAnchorType) =>
    setPosition({ hat: value });
  const setHAnchorValue = (value: number) => setPosition({ hav: value });
  const setFurnitureWidth = (value: number) => setFurniture({ fuw: value });
  const setFurnitureHeight = (value: number) => setFurniture({ fuh: value });
  const setFurnitureAnchor = (value: FurnitureAnchor) => setFurniture({ fua: value });
  const setFurnitureOffset = (value: number) => setFurniture({ fuo: value });
  const setFrameFurnitureAlign = (value: FrameFurnitureAlignment) => setFurniture({ ffa: value });
  const setFurnitureVAnchor = (value: FurnitureVerticalAnchor) => setFurniture({ fva: value });

  // Gallery frame setters
  const setGalleryFrames = useCallback(
    (frames: GalleryFrame[]) => {
      setGallery({ gf: frames.length > 0 ? JSON.stringify(frames) : '' });
    },
    [setGallery]
  );

  const addGalleryFrame = useCallback(() => {
    const newFrame: GalleryFrame = {
      id: generateId(),
      width: 12,
      height: 12,
    };
    setGalleryFrames([...galleryFrames, newFrame]);
  }, [galleryFrames, setGalleryFrames]);

  const removeGalleryFrame = useCallback(
    (id: string) => {
      setGalleryFrames(galleryFrames.filter((f) => f.id !== id));
    },
    [galleryFrames, setGalleryFrames]
  );

  const updateGalleryFrame = useCallback(
    (id: string, updates: Partial<GalleryFrame>) => {
      setGalleryFrames(
        galleryFrames.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    [galleryFrames, setGalleryFrames]
  );

  const reorderGalleryFrames = useCallback(
    (activeId: string, overId: string) => {
      const oldIndex = galleryFrames.findIndex((f) => f.id === activeId);
      const newIndex = galleryFrames.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newFrames = [...galleryFrames];
      const [removed] = newFrames.splice(oldIndex, 1);
      newFrames.splice(newIndex, 0, removed);
      setGalleryFrames(newFrames);
    },
    [galleryFrames, setGalleryFrames]
  );

  const setGalleryVAlign = (value: GalleryVAlign) => setGallery({ gva: value });

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
    setHDistribution,
    setVDistribution,
    setAnchorType,
    setAnchorValue,
    setHAnchorType,
    setHAnchorValue,
    setFurnitureWidth,
    setFurnitureHeight,
    setFurnitureAnchor,
    setFurnitureOffset,
    setFrameFurnitureAlign,
    setFurnitureVAnchor,
    setGalleryFrames,
    addGalleryFrame,
    removeGalleryFrame,
    updateGalleryFrame,
    reorderGalleryFrames,
    setGalleryVAlign,
  };
}

export type UseCalculatorReturn = ReturnType<typeof useCalculator>;
