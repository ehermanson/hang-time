export type Unit = 'in' | 'cm'

export type LayoutType = 'grid' | 'row' | 'gallery'

export type AnchorType = 'floor' | 'ceiling' | 'center' | 'furniture'

export type HorizontalAnchorType = 'center' | 'left' | 'right'

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
  hookX: number
  hookY: number
  fromLeft: number
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
  hangingOffset: number
  hSpacing: number
  vSpacing: number

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
