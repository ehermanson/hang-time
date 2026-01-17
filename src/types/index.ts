export type Unit = 'in' | 'cm'

export type LayoutType = 'grid' | 'row' | 'gallery'

export type AnchorType = 'floor' | 'ceiling' | 'center' | 'furniture'

export type HorizontalAnchorType = 'center' | 'left' | 'right'

export type HangingType = 'center' | 'dual'

export type Distribution = 'fixed' | 'space-between' | 'space-evenly' | 'space-around'

export interface GalleryFrame {
  id: number
  name: string
  width: number
  height: number
  hangingOffset: number
  x: number
  y: number
}

export interface FramePosition {
  id: number
  name: string
  row?: number
  col?: number
  x: number
  y: number
  width: number
  height: number
  hangingOffset: number
  // For center hanging: hookX is the single hook position
  // For dual hanging: hookX is the LEFT hook, hookX2 is the RIGHT hook
  hookX: number
  hookX2?: number  // Only set for dual hanging
  hookY: number
  hookGap?: number // Distance between hooks (for dual)
  fromLeft: number  // Distance from wall left to first hook
  fromTop: number
  fromFloor: number
  fromRight: number
  fromCeiling: number
}

export interface CalculatorState {
  // Units
  unit: Unit

  // Wall dimensions (stored in inches internally)
  wallWidth: number
  wallHeight: number

  // Layout
  layoutType: LayoutType
  frameCount: number  // Primary input: how many frames to hang
  gridRows: number
  gridCols: number

  // Frame configuration (for grid/row)
  frameWidth: number
  frameHeight: number
  hangingOffset: number  // Distance from top of frame to hanging point
  hangingType: HangingType  // 'center' (single hook) or 'dual' (two hooks)
  hookInset: number  // For dual: distance from frame edge to each hook
  hSpacing: number
  vSpacing: number
  hDistribution: Distribution
  vDistribution: Distribution

  // Positioning
  anchorType: AnchorType
  anchorValue: number
  hAnchorType: HorizontalAnchorType
  hAnchorValue: number

  // Gallery mode
  galleryFrames: GalleryFrame[]
  selectedFrame: number | null
  selectedFrames: number[] // For multi-select
  gallerySpacing: number // Gap between frames for snapping
  gallerySnapping: boolean // Enable/disable snapping

  // Furniture positioning (when anchorType === 'furniture')
  furnitureWidth: number
  furnitureHeight: number
  furnitureX: number // Offset from wall center (0 = centered)
  furnitureCentered: boolean // Center frames above furniture
}

export interface DragState {
  id: number
  startX: number
  startY: number
}

export interface SavedLayout {
  id: string
  title: string
  url: string // Query string portion of URL
  createdAt: number
  updatedAt: number
}
