import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlignHorizontalDistributeCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceAround,
  AlignHorizontalSpaceBetween,
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ChevronDown,
  Frame,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { Distribution, GalleryFrame, GalleryVAlign } from '@/types';

const VALIGN_OPTIONS: { value: GalleryVAlign; label: string; icon: typeof AlignVerticalDistributeCenter }[] = [
  { value: 'top', label: 'Top', icon: AlignVerticalJustifyStart },
  { value: 'center', label: 'Center', icon: AlignVerticalDistributeCenter },
  { value: 'bottom', label: 'Bottom', icon: AlignVerticalJustifyEnd },
];

const DISTRIBUTION_OPTIONS: { value: Distribution; label: string; icon: typeof AlignHorizontalDistributeCenter }[] = [
  { value: 'fixed', label: 'Fixed', icon: AlignHorizontalJustifyStart },
  { value: 'space-between', label: 'Between', icon: AlignHorizontalSpaceBetween },
  { value: 'space-evenly', label: 'Evenly', icon: AlignHorizontalDistributeCenter },
  { value: 'space-around', label: 'Around', icon: AlignHorizontalSpaceAround },
];

const FRAME_TEMPLATES = [
  { label: '4×6"', width: 4, height: 6 },
  { label: '5×7"', width: 5, height: 7 },
  { label: '8×10"', width: 8, height: 10 },
  { label: '11×14"', width: 11, height: 14 },
  { label: '16×20"', width: 16, height: 20 },
  { label: '8×8"', width: 8, height: 8 },
  { label: '12×12"', width: 12, height: 12 },
];

// Draggable frame card with full editing capabilities
interface DraggableFrameCardProps {
  frame: GalleryFrame;
  index: number;
  unit: 'in' | 'cm';
  u: (val: number) => number;
  fromU: (val: number) => number;
  uniformSize: boolean;
  onUpdate: (id: string, updates: Partial<GalleryFrame>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  isOverlay?: boolean;
}

function DraggableFrameCard({
  frame,
  index,
  unit,
  u,
  fromU,
  uniformSize,
  onUpdate,
  onRemove,
  canRemove,
  isOverlay,
}: DraggableFrameCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const content = (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isOverlay
          ? 'border-pink-400 bg-white shadow-xl dark:bg-slate-800'
          : isDragging
            ? 'opacity-40 border-dashed border-pink-300 bg-pink-50/50 dark:border-pink-500/50 dark:bg-pink-500/10'
            : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/5',
      )}
    >
      {/* Header with drag handle and remove button */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-100 dark:border-white/5">
        <button
          className="cursor-grab touch-none text-gray-300 hover:text-gray-500 dark:text-white/30 dark:hover:text-white/60"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-gray-600 dark:text-white/70">
          Frame {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(frame.id);
            }}
            className="ml-auto p-0.5 text-gray-300 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Frame size controls */}
      <div className="p-2 space-y-2">
        {uniformSize ? (
          <p className="text-[10px] text-gray-400 dark:text-white/40 italic">
            Using uniform size
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              {FRAME_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => onUpdate(frame.id, { width: t.width, height: t.height })}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                    t.width === frame.width && t.height === frame.height
                      ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white/50',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel htmlFor={`width-${frame.id}`} className="text-[10px]">
                  W ({unit})
                </FieldLabel>
                <Input
                  id={`width-${frame.id}`}
                  type="number"
                  step="0.125"
                  min={0.125}
                  value={parseFloat(u(frame.width).toFixed(3))}
                  onChange={(e) =>
                    onUpdate(frame.id, { width: fromU(parseFloat(e.target.value) || 1) })
                  }
                  className="h-7 text-xs"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`height-${frame.id}`} className="text-[10px]">
                  H ({unit})
                </FieldLabel>
                <Input
                  id={`height-${frame.id}`}
                  type="number"
                  step="0.125"
                  min={0.125}
                  value={parseFloat(u(frame.height).toFixed(3))}
                  onChange={(e) =>
                    onUpdate(frame.id, { height: fromU(parseFloat(e.target.value) || 1) })
                  }
                  className="h-7 text-xs"
                />
              </Field>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return content;
  }

  return (
    <div ref={setNodeRef} style={style}>
      {content}
    </div>
  );
}

// Row container that frames can be dragged into
interface RowContainerProps {
  rowIndex: number;
  frames: GalleryFrame[];
  allFrames: GalleryFrame[];
  unit: 'in' | 'cm';
  u: (val: number) => number;
  fromU: (val: number) => number;
  uniformSize: boolean;
  vAlign: GalleryVAlign;
  onVAlignChange: (value: GalleryVAlign) => void;
  onAddFrame: (rowIndex: number) => void;
  onUpdateFrame: (id: string, updates: Partial<GalleryFrame>) => void;
  onRemoveFrame: (id: string) => void;
  onRemoveRow: () => void;
  canRemoveRow: boolean;
}

function RowContainer({
  rowIndex,
  frames,
  allFrames,
  unit,
  u,
  fromU,
  uniformSize,
  vAlign,
  onVAlignChange,
  onAddFrame,
  onUpdateFrame,
  onRemoveFrame,
  onRemoveRow,
  canRemoveRow,
}: RowContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `row-${rowIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed p-3 transition-colors',
        isOver
          ? 'border-pink-400 bg-pink-50/50 dark:border-pink-500 dark:bg-pink-500/10'
          : 'border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/5',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide">
          Row {rowIndex + 1}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-white/30">
          ({frames.length} {frames.length === 1 ? 'frame' : 'frames'})
        </span>
        {/* Per-row vertical alignment */}
        <div className="ml-auto flex items-center gap-0.5">
          {VALIGN_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = vAlign === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onVAlignChange(option.value)}
                className={cn(
                  'p-1 rounded transition-colors',
                  isSelected
                    ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:text-white/30 dark:hover:text-white/50 dark:hover:bg-white/10',
                )}
                title={`Align ${option.label}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        {canRemoveRow && frames.length === 0 && (
          <button
            onClick={onRemoveRow}
            className="p-1 text-gray-300 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Remove empty row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <SortableContext
        items={frames.map((f) => f.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="space-y-2">
          {frames.map((frame) => {
            const globalIndex = allFrames.findIndex((f) => f.id === frame.id);
            return (
              <DraggableFrameCard
                key={frame.id}
                frame={frame}
                index={globalIndex}
                unit={unit}
                u={u}
                fromU={fromU}
                uniformSize={uniformSize}
                onUpdate={onUpdateFrame}
                onRemove={onRemoveFrame}
                canRemove={allFrames.length > 1}
              />
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddFrame(rowIndex)}
            className="w-full h-8 border border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 hover:border-gray-300 dark:text-white/40 dark:hover:text-white/60 dark:hover:border-white/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Frame
          </Button>
        </div>
      </SortableContext>
    </div>
  );
}

interface Props {
  calculator: UseCalculatorReturn;
}

export function GalleryFrames({ calculator }: Props) {
  const {
    state,
    u,
    fromU,
    setUniformSize,
    setFrameWidth,
    setFrameHeight,
    removeFrame,
    updateFrame,
    setFrames,
    setHDistribution,
    setHSpacing,
    setRowSpacing,
    updateRowConfig,
  } = calculator;

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Group frames by row
  const framesByRow = new Map<number, GalleryFrame[]>();
  state.frames.forEach((frame) => {
    const row = frame.row ?? 0;
    if (!framesByRow.has(row)) {
      framesByRow.set(row, []);
    }
    framesByRow.get(row)!.push(frame);
  });

  // Get sorted row indices
  const rowIndices = [...framesByRow.keys()].sort((a, b) => a - b);

  // Ensure we always have at least one row
  if (rowIndices.length === 0) {
    rowIndices.push(0);
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeFrame = state.frames.find((f) => f.id === active.id);
    if (!activeFrame) return;

    // Check if dropping over a row container
    const overId = over.id as string;
    if (overId.startsWith('row-')) {
      const newRowIndex = parseInt(overId.replace('row-', ''));
      if (activeFrame.row !== newRowIndex) {
        updateFrame(activeFrame.id, { row: newRowIndex });
      }
      return;
    }

    // Check if dropping over another frame
    const overFrame = state.frames.find((f) => f.id === over.id);
    if (overFrame && activeFrame.row !== overFrame.row) {
      // Move to the same row as the target frame
      updateFrame(activeFrame.id, { row: overFrame.row });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeFrame = state.frames.find((f) => f.id === active.id);
    const overFrame = state.frames.find((f) => f.id === over.id);

    if (!activeFrame) return;

    // If dropping over another frame in the same row, reorder
    if (overFrame && activeFrame.row === overFrame.row && active.id !== over.id) {
      const row = activeFrame.row ?? 0;
      const rowFrames = state.frames.filter((f) => (f.row ?? 0) === row);
      const oldIndex = rowFrames.findIndex((f) => f.id === active.id);
      const newIndex = rowFrames.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder within the row
        const newRowFrames = [...rowFrames];
        const [removed] = newRowFrames.splice(oldIndex, 1);
        newRowFrames.splice(newIndex, 0, removed);

        // Rebuild full frames array preserving order
        const otherFrames = state.frames.filter((f) => (f.row ?? 0) !== row);
        const newFrames = [...otherFrames, ...newRowFrames];

        // Sort by row to maintain consistent ordering
        newFrames.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
        setFrames(newFrames);
      }
    }
  };

  const addRow = () => {
    // Find the next available row index
    const maxRow = rowIndices.length > 0 ? Math.max(...rowIndices) : -1;
    const newRowIndex = maxRow + 1;

    // Create a new frame in the new row
    const newFrame: GalleryFrame = {
      id: Math.random().toString(36).substring(2, 9),
      width: state.frameWidth,
      height: state.frameHeight,
      row: newRowIndex,
    };
    setFrames([...state.frames, newFrame]);
  };

  const removeRow = (rowIndex: number) => {
    // Only remove if the row is empty
    const rowFrames = state.frames.filter((f) => (f.row ?? 0) === rowIndex);
    if (rowFrames.length === 0) {
      // Renumber rows above this one
      const newFrames = state.frames.map((f) => {
        const currentRow = f.row ?? 0;
        if (currentRow > rowIndex) {
          return { ...f, row: currentRow - 1 };
        }
        return f;
      });
      setFrames(newFrames);
    }
  };

  const addFrameToRow = (rowIndex: number) => {
    const newFrame: GalleryFrame = {
      id: Math.random().toString(36).substring(2, 9),
      width: state.frameWidth,
      height: state.frameHeight,
      row: rowIndex,
    };
    setFrames([...state.frames, newFrame]);
  };

  const activeFrame = activeId ? state.frames.find((f) => f.id === activeId) : null;
  const activeIndex = activeFrame ? state.frames.findIndex((f) => f.id === activeFrame.id) : -1;

  return (
    <Collapsible
      defaultOpen
      className="pb-4 border-b border-gray-200 dark:border-white/10"
    >
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
            <Frame className="h-3.5 w-3.5" />
          </span>
          Frames
          <span className="ml-1 text-xs font-normal text-gray-400 dark:text-white/40">
            ({state.frames.length})
          </span>
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {/* Uniform Size Toggle */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel className="mb-0">Uniform Size</FieldLabel>
              <Switch
                checked={state.uniformSize}
                onCheckedChange={setUniformSize}
              />
            </div>
          </Field>

          {/* Uniform dimensions (when enabled) */}
          {state.uniformSize && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {FRAME_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => {
                      setFrameWidth(t.width);
                      setFrameHeight(t.height);
                    }}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded border transition-colors',
                      t.width === state.frameWidth && t.height === state.frameHeight
                        ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-white/20',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel htmlFor="uniform-width">W ({state.unit})</FieldLabel>
                  <Input
                    id="uniform-width"
                    type="number"
                    step="0.125"
                    min={0.125}
                    value={parseFloat(u(state.frameWidth).toFixed(3))}
                    onChange={(e) =>
                      setFrameWidth(fromU(parseFloat(e.target.value) || 1))
                    }
                    className="h-8 text-sm"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="uniform-height">H ({state.unit})</FieldLabel>
                  <Input
                    id="uniform-height"
                    type="number"
                    step="0.125"
                    min={0.125}
                    value={parseFloat(u(state.frameHeight).toFixed(3))}
                    onChange={(e) =>
                      setFrameHeight(fromU(parseFloat(e.target.value) || 1))
                    }
                    className="h-8 text-sm"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Row-based frame layout */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              {rowIndices.map((rowIndex) => {
                const rowId = `row-${rowIndex}`;
                const rowConfig = state.rowConfigs.find((c) => c.id === rowId);
                const rowVAlign = rowConfig?.vAlign ?? state.vAlign;
                return (
                  <RowContainer
                    key={rowIndex}
                    rowIndex={rowIndex}
                    frames={framesByRow.get(rowIndex) || []}
                    allFrames={state.frames}
                    unit={state.unit}
                    u={u}
                    fromU={fromU}
                    uniformSize={state.uniformSize}
                    vAlign={rowVAlign}
                    onVAlignChange={(value) => updateRowConfig(rowId, { vAlign: value })}
                    onAddFrame={addFrameToRow}
                    onUpdateFrame={updateFrame}
                    onRemoveFrame={removeFrame}
                    onRemoveRow={() => removeRow(rowIndex)}
                    canRemoveRow={rowIndices.length > 1}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeFrame && (
                <DraggableFrameCard
                  frame={activeFrame}
                  index={activeIndex}
                  unit={state.unit}
                  u={u}
                  fromU={fromU}
                  uniformSize={state.uniformSize}
                  onUpdate={() => {}}
                  onRemove={() => {}}
                  canRemove={false}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>

          {/* Add Row button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Row
          </Button>

          {/* Horizontal Distribution */}
          <Field className="pt-2">
            <FieldLabel>Distribution</FieldLabel>
            <div className="grid grid-cols-4 gap-1">
              {DISTRIBUTION_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = state.hDistribution === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setHDistribution(option.value)}
                    className={cn(
                      'flex flex-col items-center p-1.5 rounded-lg border transition-all',
                      isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected
                          ? 'text-pink-500 dark:text-pink-400'
                          : 'text-gray-400 dark:text-white/40',
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium mt-0.5',
                        isSelected
                          ? 'text-pink-600 dark:text-pink-300'
                          : 'text-gray-600 dark:text-white/60',
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Spacing (only for fixed distribution) */}
          {state.hDistribution === 'fixed' && (
            <Field>
              <FieldLabel htmlFor="h-spacing">Spacing ({state.unit})</FieldLabel>
              <Input
                id="h-spacing"
                type="number"
                step="0.25"
                min={0}
                value={parseFloat(u(state.hSpacing).toFixed(2))}
                onChange={(e) =>
                  setHSpacing(fromU(parseFloat(e.target.value) || 0))
                }
                className="h-8 text-sm"
              />
            </Field>
          )}

          {/* Row Spacing (between rows) */}
          {rowIndices.length > 1 && (
            <Field>
              <FieldLabel htmlFor="row-spacing">
                Row Gap ({state.unit})
              </FieldLabel>
              <Input
                id="row-spacing"
                type="number"
                step="0.25"
                min={0}
                value={parseFloat(u(state.rowSpacing).toFixed(2))}
                onChange={(e) =>
                  setRowSpacing(fromU(parseFloat(e.target.value) || 0))
                }
                className="h-8 text-sm"
              />
            </Field>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
