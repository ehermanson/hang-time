import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { HorizontalAnchorType, Distribution } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MoveHorizontal } from 'lucide-react'

// Visual preview of distribution mode
function DistributionPreview({
  mode,
  isSelected,
}: {
  mode: Distribution
  isSelected: boolean
}) {
  const frameColor = isSelected ? 'fill-indigo-500' : 'fill-gray-400'
  const wallColor = isSelected ? 'stroke-indigo-300' : 'stroke-gray-300'

  const w = 48
  const h = 24
  const fw = 10
  const fh = 14

  const getPositions = (): number[] => {
    const totalFrames = 3 * fw
    const available = w - totalFrames

    switch (mode) {
      case 'fixed': {
        const gap = 3
        const totalWidth = 3 * fw + 2 * gap
        const start = (w - totalWidth) / 2
        return [start, start + fw + gap, start + 2 * (fw + gap)]
      }
      case 'space-between': {
        const gap = available / 2
        return [0, fw + gap, 2 * (fw + gap)]
      }
      case 'space-evenly': {
        const gap = available / 4
        return [gap, gap + fw + gap, gap + 2 * (fw + gap)]
      }
      case 'space-around': {
        const gap = available / 3
        return [gap / 2, gap / 2 + fw + gap, gap / 2 + 2 * (fw + gap)]
      }
    }
  }

  const positions = getPositions()

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} fill="none" className={wallColor} strokeWidth={1} rx={2} />
      {positions.map((pos, i) => (
        <rect key={i} x={pos} y={(h - fh) / 2} width={fw} height={fh} className={frameColor} rx={1} />
      ))}
    </svg>
  )
}

const DISTRIBUTION_OPTIONS: { value: Distribution; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'space-between', label: 'Edge' },
  { value: 'space-evenly', label: 'Even' },
  { value: 'space-around', label: 'Balanced' },
]

interface Props {
  calculator: UseCalculatorReturn
}

const options: { value: HorizontalAnchorType; label: string; desc: string; defaultValue: number }[] = [
  { value: 'center', label: 'Center on Wall', desc: 'Horizontally centered', defaultValue: 0 },
  { value: 'left', label: 'From Left Edge', desc: 'Distance from left wall', defaultValue: 12 },
  { value: 'right', label: 'From Right Edge', desc: 'Distance from right wall', defaultValue: 12 },
]

export function HorizontalPosition({ calculator }: Props) {
  const { state, u, fromU, setHAnchorType, setHAnchorValue, setHDistribution, setHSpacing } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 text-indigo-600">
          <MoveHorizontal className="h-3.5 w-3.5" />
        </span>
        Horizontal Position
      </h3>

      {/* Distribution Mode */}
      <div className="space-y-1.5 mb-3">
        <Label>Distribution</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {DISTRIBUTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setHDistribution(option.value)}
              className={cn(
                "flex flex-col items-center p-1.5 rounded-lg border-2 transition-all",
                state.hDistribution === option.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <DistributionPreview
                mode={option.value}
                isSelected={state.hDistribution === option.value}
              />
              <span className={cn(
                "text-[10px] font-medium mt-1",
                state.hDistribution === option.value ? "text-indigo-700" : "text-gray-600"
              )}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Anchor options - only show for fixed distribution */}
      {state.hDistribution === 'fixed' && (
        <>
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
                step="0.125"
                value={parseFloat(u(state.hAnchorValue).toFixed(3))}
                onChange={(e) => setHAnchorValue(fromU(parseFloat(e.target.value) || 0))}
              />
            </div>
          )}

          <div className="space-y-1.5 mt-3">
            <Label>Gap between frames ({state.unit})</Label>
            <Input
              type="number"
              step="0.125"
              min={0}
              value={parseFloat(u(state.hSpacing).toFixed(3))}
              onChange={(e) => setHSpacing(fromU(parseFloat(e.target.value) || 0))}
            />
          </div>
        </>
      )}
    </div>
  )
}
