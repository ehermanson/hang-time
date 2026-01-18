import { ChevronDown, MoveVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { AnchorType, Distribution } from '@/types';

// Visual preview of distribution mode (vertical orientation)
function DistributionPreview({
  mode,
  isSelected,
}: {
  mode: Distribution;
  isSelected: boolean;
}) {
  const frameColor = isSelected
    ? 'fill-emerald-500 dark:fill-emerald-400'
    : 'fill-gray-400 dark:fill-white/40';
  const wallColor = isSelected
    ? 'stroke-emerald-300 dark:stroke-emerald-400'
    : 'stroke-gray-300 dark:stroke-white/30';

  const w = 24;
  const h = 48;
  const fw = 14;
  const fh = 10;

  const getPositions = (): number[] => {
    const totalFrames = 3 * fh;
    const available = h - totalFrames;

    switch (mode) {
      case 'fixed': {
        const gap = 3;
        const totalHeight = 3 * fh + 2 * gap;
        const start = (h - totalHeight) / 2;
        return [start, start + fh + gap, start + 2 * (fh + gap)];
      }
      case 'space-between': {
        const gap = available / 2;
        return [0, fh + gap, 2 * (fh + gap)];
      }
      case 'space-evenly': {
        const gap = available / 4;
        return [gap, gap + fh + gap, gap + 2 * (fh + gap)];
      }
      case 'space-around': {
        const gap = available / 3;
        return [gap / 2, gap / 2 + fh + gap, gap / 2 + 2 * (fh + gap)];
      }
    }
  };

  const positions = getPositions();

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <rect
        x={0.5}
        y={0.5}
        width={w - 1}
        height={h - 1}
        fill="none"
        className={wallColor}
        strokeWidth={1}
        rx={2}
      />
      {positions.map((pos, i) => (
        <rect
          key={i}
          x={(w - fw) / 2}
          y={pos}
          width={fw}
          height={fh}
          className={frameColor}
          rx={1}
        />
      ))}
    </svg>
  );
}

const DISTRIBUTION_OPTIONS: { value: Distribution; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'space-between', label: 'Edge' },
  { value: 'space-evenly', label: 'Even' },
  { value: 'space-around', label: 'Balanced' },
];

interface Props {
  calculator: UseCalculatorReturn;
}

const options: {
  value: AnchorType;
  label: string;
  desc: string;
  defaultValue: number;
}[] = [
  {
    value: 'floor',
    label: 'From Floor',
    desc: 'Eye-level standard: 57"',
    defaultValue: 57,
  },
  {
    value: 'ceiling',
    label: 'From Ceiling',
    desc: 'Gap from ceiling (e.g., 6")',
    defaultValue: 6,
  },
  {
    value: 'center',
    label: 'Center on Wall',
    desc: 'Vertically centered',
    defaultValue: 0,
  },
  {
    value: 'furniture',
    label: 'Above Furniture',
    desc: 'Position above a piece of furniture',
    defaultValue: 8,
  },
];

export function VerticalPosition({ calculator }: Props) {
  const {
    state,
    u,
    fromU,
    setAnchorType,
    setAnchorValue,
    setVDistribution,
    setVSpacing,
    setFurnitureWidth,
    setFurnitureHeight,
    setFurnitureX,
    setFurnitureCentered,
  } = calculator;

  const showDistribution = state.layoutType !== 'row';

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <MoveVertical className="h-3.5 w-3.5" />
          </span>
          Vertical Position
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {/* Distribution Mode - only for multi-row layouts */}
          {showDistribution && (
            <div className="space-y-1.5">
              <Label>Distribution</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {DISTRIBUTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVDistribution(option.value)}
                    className={cn(
                      'flex flex-col items-center p-1.5 rounded-lg border transition-all',
                      state.vDistribution === option.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10',
                    )}
                  >
                    <DistributionPreview
                      mode={option.value}
                      isSelected={state.vDistribution === option.value}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-medium mt-1',
                        state.vDistribution === option.value
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-gray-600 dark:text-white/60',
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Anchor options - only show for fixed distribution (or row layout) */}
          {(!showDistribution || state.vDistribution === 'fixed') && (
            <>
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      state.anchorType === opt.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10',
                    )}
                    onClick={() => {
                      setAnchorType(opt.value);
                      if (opt.value !== 'center')
                        setAnchorValue(opt.defaultValue);
                    }}
                  >
                    <input
                      type="radio"
                      checked={state.anchorType === opt.value}
                      onChange={() => {}}
                      className="mt-1 accent-emerald-600 dark:accent-emerald-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {state.anchorType !== 'center' &&
                state.anchorType !== 'furniture' && (
                  <div className="space-y-1.5 mt-3">
                    <Label htmlFor="anchorValue">
                      {state.anchorType === 'floor'
                        ? 'Distance from floor'
                        : 'Distance from ceiling'}{' '}
                      ({state.unit})
                    </Label>
                    <Input
                      id="anchorValue"
                      type="number"
                      step="0.125"
                      value={parseFloat(u(state.anchorValue).toFixed(3))}
                      onChange={(e) =>
                        setAnchorValue(fromU(parseFloat(e.target.value) || 0))
                      }
                    />
                  </div>
                )}

              {state.anchorType === 'furniture' && (
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 p-3 space-y-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-white/60 uppercase tracking-wide">
                      Furniture Dimensions
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="furnitureWidth">
                          Width ({state.unit})
                        </Label>
                        <Input
                          id="furnitureWidth"
                          type="number"
                          step="0.125"
                          value={parseFloat(u(state.furnitureWidth).toFixed(3))}
                          onChange={(e) =>
                            setFurnitureWidth(
                              fromU(parseFloat(e.target.value) || 0),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="furnitureHeight">
                          Height ({state.unit})
                        </Label>
                        <Input
                          id="furnitureHeight"
                          type="number"
                          step="0.125"
                          value={parseFloat(
                            u(state.furnitureHeight).toFixed(3),
                          )}
                          onChange={(e) =>
                            setFurnitureHeight(
                              fromU(parseFloat(e.target.value) || 0),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="furnitureX">
                        Offset from center ({state.unit})
                      </Label>
                      <Input
                        id="furnitureX"
                        type="number"
                        step="0.125"
                        value={parseFloat(u(state.furnitureX).toFixed(3))}
                        onChange={(e) =>
                          setFurnitureX(fromU(parseFloat(e.target.value) || 0))
                        }
                      />
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        0 = centered, negative = left, positive = right
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={state.furnitureCentered}
                      id="furnitureCentered"
                      onCheckedChange={setFurnitureCentered}
                    />
                    <Label
                      htmlFor="furnitureCentered"
                      className="text-sm text-gray-700 dark:text-white/70"
                    >
                      Center frames above furniture
                    </Label>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="furnitureGap">
                      Gap above furniture ({state.unit})
                    </Label>
                    <Input
                      id="furnitureGap"
                      type="number"
                      step="0.125"
                      value={parseFloat(u(state.anchorValue).toFixed(3))}
                      onChange={(e) =>
                        setAnchorValue(fromU(parseFloat(e.target.value) || 0))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Gap input for fixed distribution in multi-row layouts */}
              {showDistribution && (
                <div className="space-y-1.5 mt-3">
                  <Label>Gap between rows ({state.unit})</Label>
                  <Input
                    type="number"
                    step="0.125"
                    min={0}
                    value={parseFloat(u(state.vSpacing).toFixed(3))}
                    onChange={(e) =>
                      setVSpacing(fromU(parseFloat(e.target.value) || 0))
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
