import { ChevronDown, MoveHorizontal } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { Distribution, HorizontalAnchorType } from '@/types';

// Visual preview of distribution mode
function DistributionPreview({
  mode,
  isSelected,
}: {
  mode: Distribution;
  isSelected: boolean;
}) {
  const frameColor = isSelected
    ? 'fill-amber-500 dark:fill-amber-400'
    : 'fill-gray-400 dark:fill-white/40';
  const wallColor = isSelected
    ? 'stroke-amber-300 dark:stroke-amber-400'
    : 'stroke-gray-300 dark:stroke-white/30';

  const w = 48;
  const h = 24;
  const fw = 10;
  const fh = 14;

  const getPositions = (): number[] => {
    const totalFrames = 3 * fw;
    const available = w - totalFrames;

    switch (mode) {
      case 'fixed': {
        const gap = 3;
        const totalWidth = 3 * fw + 2 * gap;
        const start = (w - totalWidth) / 2;
        return [start, start + fw + gap, start + 2 * (fw + gap)];
      }
      case 'space-between': {
        const gap = available / 2;
        return [0, fw + gap, 2 * (fw + gap)];
      }
      case 'space-evenly': {
        const gap = available / 4;
        return [gap, gap + fw + gap, gap + 2 * (fw + gap)];
      }
      case 'space-around': {
        const gap = available / 3;
        return [gap / 2, gap / 2 + fw + gap, gap / 2 + 2 * (fw + gap)];
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
          x={pos}
          y={(h - fh) / 2}
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
  value: HorizontalAnchorType;
  label: string;
  desc: string;
  defaultValue: number;
}[] = [
  {
    value: 'center',
    label: 'Center on Wall',
    desc: 'Horizontally centered',
    defaultValue: 0,
  },
  {
    value: 'left',
    label: 'From Left Edge',
    desc: 'Distance from left wall',
    defaultValue: 12,
  },
  {
    value: 'right',
    label: 'From Right Edge',
    desc: 'Distance from right wall',
    defaultValue: 12,
  },
];

export function HorizontalPosition({ calculator }: Props) {
  const {
    state,
    u,
    fromU,
    setHAnchorType,
    setHAnchorValue,
    setHDistribution,
    setHSpacing,
  } = calculator;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <MoveHorizontal className="h-3.5 w-3.5" />
          </span>
          Horizontal Position
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {/* Distribution Mode */}
          <Field>
            <FieldLabel>Distribution</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {DISTRIBUTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHDistribution(option.value)}
                  className={cn(
                    'flex flex-col items-center p-1.5 rounded-lg border transition-all',
                    state.hDistribution === option.value
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/20'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10',
                  )}
                >
                  <DistributionPreview
                    mode={option.value}
                    isSelected={state.hDistribution === option.value}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-1',
                      state.hDistribution === option.value
                        ? 'text-amber-600 dark:text-amber-300'
                        : 'text-gray-600 dark:text-white/60',
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {/* Anchor options - only show for fixed distribution */}
          {state.hDistribution === 'fixed' && (
            <>
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      state.hAnchorType === opt.value
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/20'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10',
                    )}
                    onClick={() => {
                      setHAnchorType(opt.value);
                      if (opt.value !== 'center')
                        setHAnchorValue(opt.defaultValue);
                    }}
                  >
                    <input
                      type="radio"
                      checked={state.hAnchorType === opt.value}
                      onChange={() => {}}
                      className="mt-1 accent-amber-600 dark:accent-amber-500"
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

              {state.hAnchorType !== 'center' && (
                <Field className="mt-3">
                  <FieldLabel htmlFor="hAnchorValue">
                    Distance from {state.hAnchorType} edge ({state.unit})
                  </FieldLabel>
                  <Input
                    id="hAnchorValue"
                    type="number"
                    step="0.125"
                    value={parseFloat(u(state.hAnchorValue).toFixed(3))}
                    onChange={(e) =>
                      setHAnchorValue(fromU(parseFloat(e.target.value) || 0))
                    }
                  />
                </Field>
              )}

              <Field className="mt-3">
                <FieldLabel htmlFor="hSpacing">Gap between frames ({state.unit})</FieldLabel>
                <Input
                  id="hSpacing"
                  type="number"
                  step="0.125"
                  min={0}
                  value={parseFloat(u(state.hSpacing).toFixed(3))}
                  onChange={(e) =>
                    setHSpacing(fromU(parseFloat(e.target.value) || 0))
                  }
                />
              </Field>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
