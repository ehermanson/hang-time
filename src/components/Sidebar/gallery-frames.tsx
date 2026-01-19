import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
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
  ChevronUp,
  Frame,
  GripVertical,
  Layers,
  Plus,
  Rows3,
  Trash2,
  WrapText,
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
import type { Distribution, GalleryFrame, GalleryRowMode, GalleryVAlign } from '@/types';

const VALIGN_OPTIONS: { value: GalleryVAlign; label: string; icon: typeof AlignVerticalDistributeCenter }[] = [
  { value: 'top', label: 'Top', icon: AlignVerticalJustifyStart },
  { value: 'center', label: 'Center', icon: AlignVerticalDistributeCenter },
  { value: 'bottom', label: 'Bottom', icon: AlignVerticalJustifyEnd },
];

const ROW_MODE_OPTIONS: { value: GalleryRowMode; label: string; description: string; icon: typeof WrapText }[] = [
  { value: 'auto', label: 'Auto', description: 'Auto-wrap rows', icon: WrapText },
  { value: 'manual', label: 'Manual', description: 'Assign rows manually', icon: Layers },
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

interface SortableFrameItemProps {
  frame: GalleryFrame;
  index: number;
  unit: 'in' | 'cm';
  u: (val: number) => number;
  fromU: (val: number) => number;
  uniformSize: boolean;
  uniformWidth: number;
  uniformHeight: number;
  onUpdate: (id: string, updates: Partial<GalleryFrame>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  showRowAssignment: boolean;
  totalRows: number;
}

function SortableFrameItem({
  frame,
  index,
  unit,
  u,
  fromU,
  uniformSize,
  uniformWidth,
  uniformHeight,
  onUpdate,
  onRemove,
  canRemove,
  showRowAssignment,
  totalRows,
}: SortableFrameItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Get effective dimensions
  const effectiveWidth = uniformSize ? uniformWidth : frame.width;
  const effectiveHeight = uniformSize ? uniformHeight : frame.height;

  // Find matching template
  const matchingTemplate = FRAME_TEMPLATES.find(
    (t) => t.width === effectiveWidth && t.height === effectiveHeight
  );
  const displaySize = matchingTemplate
    ? matchingTemplate.label
    : `${parseFloat(u(effectiveWidth).toFixed(1))}×${parseFloat(u(effectiveHeight).toFixed(1))}${unit === 'in' ? '"' : 'cm'}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-gray-50 dark:bg-white/5',
        isDragging
          ? 'border-indigo-400 shadow-lg z-10 opacity-90'
          : 'border-gray-200 dark:border-white/10',
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => !uniformSize && setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 w-full text-left",
              uniformSize && "cursor-default"
            )}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-white/80">
              Frame {index + 1}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/50">
              {displaySize}
            </span>
            {!uniformSize && (
              isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 ml-auto text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-auto text-gray-400" />
              )
            )}
          </button>
        </div>

        {canRemove && (
          <button
            onClick={() => onRemove(frame.id)}
            className="p-1 text-gray-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isExpanded && !uniformSize && (
        <div className="px-2 pb-2 space-y-2">
          {/* Template buttons */}
          <div className="flex flex-wrap gap-1">
            {FRAME_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() =>
                  onUpdate(frame.id, { width: t.width, height: t.height })
                }
                className={cn(
                  'px-2 py-0.5 text-xs rounded border transition-colors',
                  t.width === frame.width && t.height === frame.height
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-white/20',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor={`width-${frame.id}`}>W ({unit})</FieldLabel>
              <Input
                id={`width-${frame.id}`}
                type="number"
                step="0.125"
                min={0.125}
                value={parseFloat(u(frame.width).toFixed(3))}
                onChange={(e) =>
                  onUpdate(frame.id, {
                    width: fromU(parseFloat(e.target.value) || 1),
                  })
                }
                className="h-8 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`height-${frame.id}`}>H ({unit})</FieldLabel>
              <Input
                id={`height-${frame.id}`}
                type="number"
                step="0.125"
                min={0.125}
                value={parseFloat(u(frame.height).toFixed(3))}
                onChange={(e) =>
                  onUpdate(frame.id, {
                    height: fromU(parseFloat(e.target.value) || 1),
                  })
                }
                className="h-8 text-sm"
              />
            </Field>
          </div>

          {/* Row assignment (manual mode) */}
          {showRowAssignment && (
            <Field>
              <FieldLabel htmlFor={`row-${frame.id}`}>Row</FieldLabel>
              <div className="flex items-center gap-2">
                <select
                  id={`row-${frame.id}`}
                  value={frame.row ?? 0}
                  onChange={(e) =>
                    onUpdate(frame.id, { row: parseInt(e.target.value) })
                  }
                  className="h-8 text-sm w-full rounded-md border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {Array.from({ length: totalRows }, (_, i) => (
                    <option key={i} value={i}>
                      Row {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
          )}
        </div>
      )}

      {/* Row assignment for uniform mode */}
      {showRowAssignment && uniformSize && (
        <div className="px-2 pb-2">
          <Field>
            <FieldLabel htmlFor={`row-${frame.id}`}>Row</FieldLabel>
            <select
              id={`row-${frame.id}`}
              value={frame.row ?? 0}
              onChange={(e) =>
                onUpdate(frame.id, { row: parseInt(e.target.value) })
              }
              className="h-8 text-sm w-full rounded-md border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {Array.from({ length: totalRows }, (_, i) => (
                <option key={i} value={i}>
                  Row {i + 1}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
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
    addFrame,
    removeFrame,
    updateFrame,
    reorderFrames,
    setVAlign,
    setHDistribution,
    setRowMode,
    setMaxRowWidth,
    setRowSpacing,
  } = calculator;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFrames(active.id as string, over.id as string);
    }
  };

  // Calculate number of rows for manual mode
  const rowNumbers = state.frames.map((f) => f.row ?? 0);
  const maxRowNum = rowNumbers.length > 0 ? Math.max(...rowNumbers) : 0;
  const totalRows = maxRowNum + 2; // Allow one more row than current max

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
        <div className="space-y-2 pt-3">
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
              {/* Template buttons */}
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

          {/* Frame List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={state.frames.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {state.frames.map((frame, index) => (
                <SortableFrameItem
                  key={frame.id}
                  frame={frame}
                  index={index}
                  unit={state.unit}
                  u={u}
                  fromU={fromU}
                  uniformSize={state.uniformSize}
                  uniformWidth={state.frameWidth}
                  uniformHeight={state.frameHeight}
                  onUpdate={updateFrame}
                  onRemove={removeFrame}
                  canRemove={state.frames.length > 1}
                  showRowAssignment={state.rowMode === 'manual'}
                  totalRows={totalRows}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            size="sm"
            onClick={addFrame}
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Frame
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

          {/* Vertical Alignment */}
          <Field className="pt-2">
            <FieldLabel>Vertical Alignment</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {VALIGN_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = state.vAlign === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setVAlign(option.value)}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg border transition-all',
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
                        'text-xs font-medium mt-1',
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

          {/* Row Mode */}
          <Field className="pt-2">
            <FieldLabel className="flex items-center gap-1.5">
              <Rows3 className="h-3.5 w-3.5" />
              Row Wrapping
            </FieldLabel>
            <div className="grid grid-cols-2 gap-1">
              {ROW_MODE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = state.rowMode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setRowMode(option.value)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border transition-all',
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
                    <div className="text-left">
                      <span
                        className={cn(
                          'text-xs font-medium block',
                          isSelected
                            ? 'text-pink-600 dark:text-pink-300'
                            : 'text-gray-600 dark:text-white/60',
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-white/40">
                        {option.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Max Width (auto mode only) */}
          {state.rowMode === 'auto' && (
            <Field>
              <FieldLabel htmlFor="max-row-width">
                Max Width ({state.unit})
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="max-row-width"
                  type="number"
                  step="1"
                  min={1}
                  value={
                    state.maxRowWidth === null
                      ? ''
                      : parseFloat(u(state.maxRowWidth).toFixed(1))
                  }
                  placeholder={`Wall (${parseFloat(u(state.wallWidth).toFixed(1))})`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setMaxRowWidth(null);
                    } else {
                      setMaxRowWidth(fromU(parseFloat(val) || state.wallWidth));
                    }
                  }}
                  className="h-8 text-sm"
                />
                {state.maxRowWidth !== null && (
                  <button
                    onClick={() => setMaxRowWidth(null)}
                    className="text-xs text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 whitespace-nowrap"
                  >
                    Use wall
                  </button>
                )}
              </div>
            </Field>
          )}

          {/* Vertical Spacing (between rows) */}
          <Field>
            <FieldLabel htmlFor="row-spacing">
              Row Spacing ({state.unit})
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
