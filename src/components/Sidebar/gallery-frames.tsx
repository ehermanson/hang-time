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
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ChevronDown,
  ChevronUp,
  Frame,
  GripVertical,
  Plus,
  Trash2,
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
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { GalleryFrame, GalleryVAlign } from '@/types';

const VALIGN_OPTIONS: { value: GalleryVAlign; label: string; icon: typeof AlignVerticalDistributeCenter }[] = [
  { value: 'top', label: 'Top', icon: AlignVerticalJustifyStart },
  { value: 'center', label: 'Center', icon: AlignVerticalDistributeCenter },
  { value: 'bottom', label: 'Bottom', icon: AlignVerticalJustifyEnd },
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
  onUpdate: (id: string, updates: Partial<GalleryFrame>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableFrameItem({
  frame,
  index,
  unit,
  u,
  fromU,
  onUpdate,
  onRemove,
  canRemove,
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

  // Find matching template
  const matchingTemplate = FRAME_TEMPLATES.find(
    (t) => t.width === frame.width && t.height === frame.height
  );
  const displaySize = matchingTemplate
    ? matchingTemplate.label
    : `${parseFloat(u(frame.width).toFixed(1))}×${parseFloat(u(frame.height).toFixed(1))}${unit === 'in' ? '"' : 'cm'}`;

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
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 w-full text-left"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-white/80">
              Frame {index + 1}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/50">
              {displaySize}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 ml-auto text-gray-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-auto text-gray-400" />
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

      {isExpanded && (
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
    addGalleryFrame,
    removeGalleryFrame,
    updateGalleryFrame,
    reorderGalleryFrames,
    setGalleryVAlign,
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
      reorderGalleryFrames(active.id as string, over.id as string);
    }
  };

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
          Gallery Frames
          <span className="ml-1 text-xs font-normal text-gray-400 dark:text-white/40">
            ({state.galleryFrames.length})
          </span>
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={state.galleryFrames.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {state.galleryFrames.map((frame, index) => (
                <SortableFrameItem
                  key={frame.id}
                  frame={frame}
                  index={index}
                  unit={state.unit}
                  u={u}
                  fromU={fromU}
                  onUpdate={updateGalleryFrame}
                  onRemove={removeGalleryFrame}
                  canRemove={state.galleryFrames.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            size="sm"
            onClick={addGalleryFrame}
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Frame
          </Button>

          {/* Vertical Alignment */}
          <Field className="pt-2">
            <FieldLabel>Vertical Alignment</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {VALIGN_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = state.galleryVAlign === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setGalleryVAlign(option.value)}
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
