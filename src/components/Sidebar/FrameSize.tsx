import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { HangingType } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Frame, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Visual preview of hanging type
function HangingTypePreview({
  type,
  isSelected,
}: {
  type: HangingType
  isSelected: boolean
}) {
  const frameColor = isSelected ? 'stroke-pink-500 dark:stroke-pink-400' : 'stroke-gray-400 dark:stroke-white/40'
  const frameFill = isSelected ? 'fill-pink-50 dark:fill-pink-500/20' : 'fill-gray-50 dark:fill-white/10'
  const hookColor = isSelected ? 'fill-pink-500 dark:fill-pink-400' : 'fill-gray-400 dark:fill-white/50'
  const wireColor = isSelected ? 'stroke-pink-400' : 'stroke-gray-400 dark:stroke-white/40'

  const w = 48
  const h = 36
  const frameX = 6
  const frameY = 8
  const frameW = 36
  const frameH = 24
  const hookY = frameY + 6
  const hookR = 2.5

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      {/* Frame */}
      <rect
        x={frameX}
        y={frameY}
        width={frameW}
        height={frameH}
        className={`${frameColor} ${frameFill}`}
        strokeWidth={2}
        rx={1}
      />

      {type === 'center' ? (
        <>
          {/* Single hook indicator */}
          <circle cx={w / 2} cy={hookY} r={hookR} className={hookColor} />
          {/* Wire to top */}
          <line x1={w / 2} y1={hookY - hookR} x2={w / 2} y2={2} className={wireColor} strokeWidth={1.5} />
        </>
      ) : (
        <>
          {/* Left hook */}
          <circle cx={frameX + 8} cy={hookY} r={hookR} className={hookColor} />
          {/* Right hook */}
          <circle cx={frameX + frameW - 8} cy={hookY} r={hookR} className={hookColor} />
          {/* Wire from left hook to top center */}
          <line x1={frameX + 8} y1={hookY - hookR} x2={w / 2} y2={2} className={wireColor} strokeWidth={1.5} />
          {/* Wire from right hook to top center */}
          <line x1={frameX + frameW - 8} y1={hookY - hookR} x2={w / 2} y2={2} className={wireColor} strokeWidth={1.5} />
        </>
      )}
    </svg>
  )
}

const HANGING_OPTIONS: { value: HangingType; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'dual', label: 'Dual' },
]

const FRAME_TEMPLATES = [
  { value: '4x6', label: '4×6"', width: 4, height: 6 },
  { value: '5x7', label: '5×7"', width: 5, height: 7 },
  { value: '8x10', label: '8×10"', width: 8, height: 10 },
  { value: '11x14', label: '11×14"', width: 11, height: 14 },
  { value: '16x20', label: '16×20"', width: 16, height: 20 },
  { value: '18x24', label: '18×24"', width: 18, height: 24 },
  { value: '24x36', label: '24×36"', width: 24, height: 36 },
  { value: '8x8', label: '8×8" (Square)', width: 8, height: 8 },
  { value: '12x12', label: '12×12" (Square)', width: 12, height: 12 },
]

interface Props {
  calculator: UseCalculatorReturn
}

export function FrameSize({ calculator }: Props) {
  const {
    state, u, fromU,
    setFrameWidth, setFrameHeight, setHangingOffset,
    setHangingType, setHookInset,
  } = calculator

  // Find matching template for current dimensions
  const currentTemplate = FRAME_TEMPLATES.find(
    t => t.width === state.frameWidth && t.height === state.frameHeight
  )?.value

  const isCustom = !currentTemplate

  const handleTemplateChange = (value: string) => {
    if (value === 'custom') {
      // Set to dimensions that don't match any template
      setFrameWidth(10)
      setFrameHeight(14)
      return
    }
    const template = FRAME_TEMPLATES.find(t => t.value === value)
    if (template) {
      setFrameWidth(template.width)
      setFrameHeight(template.height)
    }
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
            <Frame className="h-3.5 w-3.5" />
          </span>
          Frame Size
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          <div className="space-y-1.5">
            <Label>Size</Label>
            <Select value={currentTemplate || 'custom'} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAME_TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Width ({state.unit})</Label>
                <Input
                  type="number"
                  step="0.125"
                  min={0.125}
                  value={parseFloat(u(state.frameWidth).toFixed(3))}
                  onChange={(e) => setFrameWidth(fromU(parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Height ({state.unit})</Label>
                <Input
                  type="number"
                  step="0.125"
                  min={0.125}
                  value={parseFloat(u(state.frameHeight).toFixed(3))}
                  onChange={(e) => setFrameHeight(fromU(parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Hook Offset ({state.unit}) </Label>
            <span className="text-xs text-gray-500 dark:text-white/50 block">Distance from top edge of frame to hanging point</span>
            <Input
              type="number"
              step="0.125"
              max={parseFloat(u(state.frameHeight).toFixed(3))}
              value={parseFloat(u(state.hangingOffset).toFixed(3))}
              onChange={(e) => setHangingOffset(fromU(parseFloat(e.target.value) || 0))}
            />
          </div>

          <div className="mt-3 space-y-1.5">
            <Label>Hanging Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {HANGING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHangingType(option.value)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg border transition-all",
                    state.hangingType === option.value
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-500/20"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
                  )}
                >
                  <HangingTypePreview
                    type={option.value}
                    isSelected={state.hangingType === option.value}
                  />
                  <span className={cn(
                    "text-xs font-medium mt-1",
                    state.hangingType === option.value ? "text-pink-600 dark:text-pink-300" : "text-gray-600 dark:text-white/60"
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            {state.hangingType === 'dual' && (
              <div className="pt-2">
                <Label>Hook Inset ({state.unit})</Label>
                <span className="text-xs text-gray-500 dark:text-white/50 block">Distance from edge of frame to hanging point</span>
                <Input
                  type="number"
                  step="0.125"
                  min={0}
                  max={parseFloat((u(state.frameWidth) / 2).toFixed(3))}
                  value={parseFloat(u(state.hookInset).toFixed(3))}
                  onChange={(e) => setHookInset(fromU(parseFloat(e.target.value) || 0))}
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
