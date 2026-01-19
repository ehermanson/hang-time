export type Unit = 'in' | 'cm';

export type Theme = 'light' | 'dark';

export type AnchorType = 'floor' | 'ceiling' | 'center' | 'furniture';

export type HorizontalAnchorType = 'center' | 'left' | 'right';

export type HangingType = 'center' | 'dual';

export type Distribution =
  | 'fixed'
  | 'space-between'
  | 'space-evenly'
  | 'space-around';

export type FurnitureAnchor = 'left' | 'center' | 'right';

export type FrameFurnitureAlignment = 'left' | 'center' | 'right' | 'span';

export type FurnitureVerticalAnchor = 'center' | 'ceiling' | 'above-furniture';

export type GalleryVAlign = 'center' | 'top' | 'bottom';

export type GalleryRowMode = 'auto' | 'manual';

export type GalleryLayoutMode = 'freeform' | 'template';

export interface GalleryFrame {
  id: string;
  width: number;
  height: number;
  row?: number; // computed or manually assigned row
}

export interface GalleryRowConfig {
  id: string;
  hSpacing?: number; // override global hSpacing
  vAlign?: GalleryVAlign; // override global vAlign
  hDistribution?: Distribution; // override global distribution
}

export interface TemplateSlot {
  id: string;
  x: number; // relative position (0-1)
  y: number;
  width: number;
  height: number;
  frameId?: string; // assigned frame
}

export interface GalleryTemplate {
  id: string;
  name: string;
  description: string;
  slots: TemplateSlot[];
  aspectRatio?: number; // for scaling
}

export interface FramePosition {
  id: number;
  name: string;
  row?: number;
  col?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hangingOffset: number;
  // For center hanging: hookX is the single hook position
  // For dual hanging: hookX is the LEFT hook, hookX2 is the RIGHT hook
  hookX: number;
  hookX2?: number; // Only set for dual hanging
  hookY: number;
  hookGap?: number; // Distance between hooks (for dual)
  fromLeft: number; // Distance from wall left to first hook
  fromTop: number;
  fromFloor: number;
  fromRight: number;
  fromCeiling: number;
  isOutOfBounds: boolean; // True if frame extends beyond wall boundaries
}

export interface CalculatorState {
  // Units
  unit: Unit;

  // Wall dimensions (stored in inches internally)
  wallWidth: number;
  wallHeight: number;

  // Frames - always a list of variable-sized frames
  frames: GalleryFrame[];
  uniformSize: boolean; // When true, all frames use frameWidth/frameHeight
  frameWidth: number; // Used when uniformSize is true
  frameHeight: number; // Used when uniformSize is true

  // Hanging configuration
  hangingOffset: number; // Distance from top of frame to hanging point
  hangingType: HangingType; // 'center' (single hook) or 'dual' (two hooks)
  hookInset: number; // For dual: distance from frame edge to each hook

  // Spacing and distribution
  hSpacing: number;
  vSpacing: number;
  hDistribution: Distribution;

  // Positioning
  anchorType: AnchorType;
  anchorValue: number;
  hAnchorType: HorizontalAnchorType;
  hAnchorValue: number;

  // Furniture positioning (when anchorType === 'furniture')
  furnitureWidth: number;
  furnitureHeight: number;
  furnitureAnchor: FurnitureAnchor; // Where furniture sits on wall
  furnitureOffset: number; // Distance from anchor edge (always positive)
  frameFurnitureAlign: FrameFurnitureAlignment; // How frames align to furniture
  furnitureVAnchor: FurnitureVerticalAnchor; // Vertical anchor for frames above furniture

  // Layout options
  rowMode: GalleryRowMode; // auto-wrap or manual row assignment
  maxRowWidth: number | null; // null = use wallWidth
  rowSpacing: number; // vertical spacing between rows
  rowConfigs: GalleryRowConfig[]; // per-row overrides
  layoutMode: GalleryLayoutMode; // freeform or template
  templateId: string | null;
  slotAssignments: Record<string, string>; // slotId -> frameId

  // Alignment
  vAlign: GalleryVAlign; // vertical alignment within rows
}

export interface SavedLayout {
  id: string;
  title: string;
  url: string; // Query string portion of URL
  createdAt: number;
  updatedAt: number;
}
