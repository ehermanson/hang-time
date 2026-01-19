import { ChevronDown, LayoutGrid } from 'lucide-react';
import { useMemo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { LayoutType } from '@/types';

interface Props {
  calculator: UseCalculatorReturn;
}

interface LayoutOption {
  type: LayoutType;
  rows: number;
  cols: number;
  label: string;
}

// Generate sensible layout options for a given frame count
function getLayoutOptions(count: number): LayoutOption[] {
  const options: LayoutOption[] = [];

  // Always offer single row
  options.push({ type: 'row', rows: 1, cols: count, label: 'Row' });

  // Find grid options (factor pairs)
  const factors: [number, number][] = [];
  for (let r = 2; r <= Math.ceil(Math.sqrt(count)); r++) {
    const c = Math.ceil(count / r);
    if (r * c >= count && r <= 5 && c <= 6) {
      factors.push([r, c]);
    }
  }

  // Add grid options (prefer wider grids first)
  factors.forEach(([r, c]) => {
    if (r !== 1 && c !== 1) {
      options.push({ type: 'grid', rows: r, cols: c, label: `${r}×${c}` });
    }
  });

  // Add single column if count <= 4
  if (count <= 4 && count > 1) {
    options.push({ type: 'grid', rows: count, cols: 1, label: 'Column' });
  }

  return options;
}

// Mini preview component for layout visualization
function LayoutPreview({
  rows,
  cols,
  frameCount,
  isSelected,
}: {
  rows: number;
  cols: number;
  frameCount: number;
  isSelected: boolean;
}) {
  const cells = [];
  let placed = 0;

  // Calculate cell size to fit within 44px height (with 2px gaps)
  const gap = 2;
  const maxHeight = 44;
  const maxWidth = 56;
  const cellHeight = Math.min(16, (maxHeight - (rows - 1) * gap) / rows);
  const cellWidth = Math.min(14, (maxWidth - (cols - 1) * gap) / cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isFilled = placed < frameCount;
      cells.push(
        <div
          key={`${r}-${c}`}
          className={cn(
            'rounded-sm',
            isFilled
              ? isSelected
                ? 'bg-indigo-500 dark:bg-indigo-400'
                : 'bg-gray-400 dark:bg-white/40'
              : 'bg-gray-200 border border-dashed border-gray-300 dark:bg-white/10 dark:border-white/20',
          )}
          style={{
            width: `${cellWidth}px`,
            height: `${cellHeight}px`,
          }}
        />,
      );
      if (isFilled) placed++;
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {cells}
    </div>
  );
}

export function LayoutTypeSelector({ calculator }: Props) {
  const { state, setFrameCount, applyLayout } = calculator;

  const layoutOptions = useMemo(
    () => getLayoutOptions(state.frameCount),
    [state.frameCount],
  );

  // Check if current layout matches an option
  const currentLayoutKey = `${state.layoutType}-${state.gridRows}-${state.gridCols}`;

  const handleSelectLayout = (option: LayoutOption) => {
    applyLayout(option.type, option.rows, option.cols);
  };

  return (
    <Collapsible
      defaultOpen
      className="pb-4 border-b border-gray-200 dark:border-white/10"
    >
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <LayoutGrid className="h-3.5 w-3.5" />
          </span>
          Frame Arrangement
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 pt-3">
          {/* Frame Count - Primary Input */}
          <Field>
            <FieldLabel htmlFor="frameCount">Number of Frames</FieldLabel>
            <Input
              id="frameCount"
              type="number"
              min="1"
              max="20"
              value={state.frameCount}
              onChange={(e) =>
                setFrameCount(
                  Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)),
                )
              }
              className="text-lg font-medium text-center bg-gray-50 border-gray-200 text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-white"
            />
          </Field>

          {/* Layout Options */}
          <div className="grid grid-cols-3 gap-2">
            {layoutOptions.map((option) => {
              const optionKey = `${option.type}-${option.rows}-${option.cols}`;
              const isSelected = currentLayoutKey === optionKey;

              return (
                <button
                  key={optionKey}
                  onClick={() => handleSelectLayout(option)}
                  className={cn(
                    'flex flex-col items-center justify-end p-2 rounded-lg border transition-all',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10',
                  )}
                >
                  <LayoutPreview
                    rows={option.rows}
                    cols={option.cols}
                    frameCount={state.frameCount}
                    isSelected={isSelected}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium mt-2',
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-300'
                        : 'text-gray-600 dark:text-white/60',
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
