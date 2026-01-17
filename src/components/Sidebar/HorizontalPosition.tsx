import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { HorizontalAnchorType } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MoveHorizontal } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

const options: { value: HorizontalAnchorType; label: string; desc: string; defaultValue: number }[] = [
  { value: 'center', label: 'Center on Wall', desc: 'Horizontally centered', defaultValue: 0 },
  { value: 'left', label: 'From Left Edge', desc: 'Distance from left wall', defaultValue: 12 },
  { value: 'right', label: 'From Right Edge', desc: 'Distance from right wall', defaultValue: 12 },
]

export function HorizontalPosition({ calculator }: Props) {
  const { state, u, fromU, setHAnchorType, setHAnchorValue } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 text-indigo-600">
          <MoveHorizontal className="h-3.5 w-3.5" />
        </span>
        Horizontal Position
      </h3>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
              state.hAnchorType === opt.value
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
            )}
            onClick={() => {
              setHAnchorType(opt.value)
              if (opt.value !== 'center') setHAnchorValue(opt.defaultValue)
            }}
          >
            <input
              type="radio"
              checked={state.hAnchorType === opt.value}
              onChange={() => {}}
              className="mt-1 accent-indigo-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {state.hAnchorType !== 'center' && (
        <div className="space-y-1.5 mt-3">
          <Label>
            Distance from {state.hAnchorType} edge ({state.unit})
          </Label>
          <Input
            type="number"
            value={parseFloat(u(state.hAnchorValue).toFixed(1))}
            onChange={(e) => setHAnchorValue(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      )}
    </div>
  )
}
