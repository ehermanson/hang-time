import { ChevronDown, Ruler } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';

interface Props {
  calculator: UseCalculatorReturn;
}

export function WallDimensions({ calculator }: Props) {
  const { state, u, fromU, setWallWidth, setWallHeight } = calculator;

  return (
    <Collapsible
      defaultOpen={false}
      className="pb-4 border-b border-gray-200 dark:border-white/10"
    >
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Ruler className="h-3.5 w-3.5" />
          </span>
          Wall Dimensions
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-3 pt-3">
          <Field>
            <FieldLabel htmlFor="wallWidth">Width ({state.unit})</FieldLabel>
            <Input
              id="wallWidth"
              type="number"
              step="0.125"
              value={parseFloat(u(state.wallWidth).toFixed(3))}
              onChange={(e) =>
                setWallWidth(fromU(parseFloat(e.target.value) || 0))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="wallHeight">Height ({state.unit})</FieldLabel>
            <Input
              id="wallHeight"
              type="number"
              step="0.125"
              value={parseFloat(u(state.wallHeight).toFixed(3))}
              onChange={(e) =>
                setWallHeight(fromU(parseFloat(e.target.value) || 0))
              }
            />
          </Field>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
