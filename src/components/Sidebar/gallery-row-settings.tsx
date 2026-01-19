import {
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { FramePosition, GalleryVAlign } from '@/types';

const VALIGN_OPTIONS: { value: GalleryVAlign; label: string; icon: typeof AlignVerticalDistributeCenter }[] = [
  { value: 'top', label: 'Top', icon: AlignVerticalJustifyStart },
  { value: 'center', label: 'Center', icon: AlignVerticalDistributeCenter },
  { value: 'bottom', label: 'Bottom', icon: AlignVerticalJustifyEnd },
];

interface Props {
  calculator: UseCalculatorReturn;
  layoutPositions: FramePosition[];
}

export function GalleryRowSettings({ calculator, layoutPositions }: Props) {
  const { state, u, fromU, updateRowConfig } = calculator;

  // Group frames by row to show which frames are in each row
  const rowGroups = new Map<number, FramePosition[]>();
  layoutPositions.forEach((pos) => {
    const rowNum = pos.row ?? 0;
    if (!rowGroups.has(rowNum)) {
      rowGroups.set(rowNum, []);
    }
    rowGroups.get(rowNum)!.push(pos);
  });

  const sortedRows = [...rowGroups.keys()].sort((a, b) => a - b);

  if (sortedRows.length <= 1) {
    return null; // No row settings needed for single row
  }

  return (
    <Collapsible className="pb-4 border-b border-gray-200 dark:border-white/10">
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <Settings2 className="h-3.5 w-3.5" />
          </span>
          Row Settings
          <span className="ml-1 text-xs font-normal text-gray-400 dark:text-white/40">
            ({sortedRows.length} rows)
          </span>
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {sortedRows.map((rowNum) => {
            const rowId = `row-${rowNum}`;
            const frames = rowGroups.get(rowNum) || [];
            const rowConfig = state.rowConfigs.find((c) => c.id === rowId);
            const hasOverrides = rowConfig?.hSpacing !== undefined || rowConfig?.vAlign !== undefined;

            return (
              <div
                key={rowId}
                className={cn(
                  'rounded-lg border p-2',
                  hasOverrides
                    ? 'border-purple-300 bg-purple-50/50 dark:border-purple-500/30 dark:bg-purple-500/10'
                    : 'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    Row {rowNum + 1}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    {frames.length} frame{frames.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Frame preview */}
                <div className="flex gap-1 mb-2">
                  {frames.map((f) => (
                    <div
                      key={f.id}
                      className="h-4 bg-pink-200 dark:bg-pink-500/30 rounded text-[8px] flex items-center justify-center text-pink-600 dark:text-pink-300"
                      style={{ width: `${Math.max(16, f.width)}px` }}
                    >
                      {f.id}
                    </div>
                  ))}
                </div>

                {/* Row overrides */}
                <div className="grid grid-cols-2 gap-2">
                  <Field>
                    <FieldLabel htmlFor={`${rowId}-spacing`} className="text-xs">
                      H Spacing ({state.unit})
                    </FieldLabel>
                    <Input
                      id={`${rowId}-spacing`}
                      type="number"
                      step="0.25"
                      min={0}
                      placeholder={String(parseFloat(u(state.hSpacing).toFixed(2)))}
                      value={
                        rowConfig?.hSpacing !== undefined
                          ? parseFloat(u(rowConfig.hSpacing).toFixed(2))
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          updateRowConfig(rowId, { hSpacing: undefined });
                        } else {
                          updateRowConfig(rowId, {
                            hSpacing: fromU(parseFloat(val) || 0),
                          });
                        }
                      }}
                      className="h-7 text-xs"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs">V Align</FieldLabel>
                    <div className="flex gap-0.5">
                      {VALIGN_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected =
                          (rowConfig?.vAlign ?? state.vAlign) === option.value;
                        const isOverride = rowConfig?.vAlign === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (option.value === state.vAlign && rowConfig?.vAlign === option.value) {
                                // Clear override if clicking current override that matches global
                                updateRowConfig(rowId, { vAlign: undefined });
                              } else {
                                updateRowConfig(rowId, { vAlign: option.value });
                              }
                            }}
                            className={cn(
                              'flex-1 p-1.5 rounded border transition-all',
                              isOverride
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                                : isSelected
                                  ? 'border-gray-300 bg-gray-100 dark:border-white/20 dark:bg-white/10'
                                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20',
                            )}
                            title={option.label}
                          >
                            <Icon
                              className={cn(
                                'h-3.5 w-3.5 mx-auto',
                                isOverride
                                  ? 'text-purple-500 dark:text-purple-400'
                                  : isSelected
                                    ? 'text-gray-600 dark:text-white/60'
                                    : 'text-gray-400 dark:text-white/40',
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                {hasOverrides && (
                  <button
                    onClick={() => {
                      updateRowConfig(rowId, { hSpacing: undefined, vAlign: undefined });
                    }}
                    className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 mt-2"
                  >
                    Reset to global
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
