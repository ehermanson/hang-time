import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { AnchorType } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MoveVertical } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

const options: { value: AnchorType; label: string; desc: string; defaultValue: number }[] = [
  { value: 'floor', label: 'From Floor', desc: 'Eye-level standard: 57"', defaultValue: 57 },
  { value: 'ceiling', label: 'From Ceiling', desc: 'Gap from ceiling (e.g., 6")', defaultValue: 6 },
  { value: 'center', label: 'Center on Wall', desc: 'Vertically centered', defaultValue: 0 },
  { value: 'furniture', label: 'Above Furniture', desc: 'Position above a piece of furniture', defaultValue: 8 },
]

export function VerticalPosition({ calculator }: Props) {
  const {
    state,
    u,
    fromU,
    setAnchorType,
    setAnchorValue,
    setFurnitureWidth,
    setFurnitureHeight,
    setFurnitureX,
    setFurnitureCentered,
  } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 text-emerald-600">
          <MoveVertical className="h-3.5 w-3.5" />
        </span>
        Vertical Position
      </h3>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
              state.anchorType === opt.value
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
            )}
            onClick={() => {
              setAnchorType(opt.value)
              if (opt.value !== 'center') setAnchorValue(opt.defaultValue)
            }}
          >
            <input
              type="radio"
              checked={state.anchorType === opt.value}
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

      {state.anchorType !== 'center' && state.anchorType !== 'furniture' && (
        <div className="space-y-1.5 mt-3">
          <Label>
            {state.anchorType === 'floor' ? 'Distance from floor' : 'Distance from ceiling'} ({state.unit})
          </Label>
          <Input
            type="number"
            value={parseFloat(u(state.anchorValue).toFixed(1))}
            onChange={(e) => setAnchorValue(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      )}

      {state.anchorType === 'furniture' && (
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Furniture Dimensions</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Width ({state.unit})</Label>
                <Input
                  type="number"
                  value={parseFloat(u(state.furnitureWidth).toFixed(1))}
                  onChange={(e) => setFurnitureWidth(fromU(parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Height ({state.unit})</Label>
                <Input
                  type="number"
                  value={parseFloat(u(state.furnitureHeight).toFixed(1))}
                  onChange={(e) => setFurnitureHeight(fromU(parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Offset from center ({state.unit})</Label>
              <Input
                type="number"
                value={parseFloat(u(state.furnitureX).toFixed(1))}
                onChange={(e) => setFurnitureX(fromU(parseFloat(e.target.value) || 0))}
              />
              <p className="text-xs text-gray-500">0 = centered, negative = left, positive = right</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.furnitureCentered}
              onChange={(e) => setFurnitureCentered(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700">Center frames above furniture</span>
          </label>

          <div className="space-y-1.5">
            <Label>Gap above furniture ({state.unit})</Label>
            <Input
              type="number"
              value={parseFloat(u(state.anchorValue).toFixed(1))}
              onChange={(e) => setAnchorValue(fromU(parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
