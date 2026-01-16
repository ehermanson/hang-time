export type Unit = 'in' | 'cm'

export type LayoutType = 'grid' | 'row' | 'salon'

export type AnchorType = 'floor' | 'ceiling' | 'center'

export type HorizontalAnchorType = 'center' | 'left' | 'right'

export interface SalonFrame {
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

  // Salon mode
  salonFrames: SalonFrame[]
  selectedFrame: number | null
}

export interface DragState {
  id: number
  startX: number
  startY: number
}
