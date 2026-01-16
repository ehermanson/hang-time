import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  calculator: UseCalculatorReturn
}

export function FrameSize({ calculator }: Props) {
  const {
    state, u, fromU,
    setFrameWidth, setFrameHeight, setHangingOffset,
    setHSpacing, setVSpacing
  } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: '#fce7f3' }}>🖼️</span>
        Frame Size
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label>Width</Label>
          <Input
            type="number"
            value={parseFloat(u(state.frameWidth).toFixed(1))}
            onChange={(e) => setFrameWidth(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Height</Label>
          <Input
            type="number"
            value={parseFloat(u(state.frameHeight).toFixed(1))}
            onChange={(e) => setFrameHeight(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Wire Offset</Label>
          <Input
            type="number"
            value={parseFloat(u(state.hangingOffset).toFixed(1))}
            onChange={(e) => setHangingOffset(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="space-y-1.5">
          <Label>H Spacing</Label>
          <Input
            type="number"
            value={parseFloat(u(state.hSpacing).toFixed(1))}
            onChange={(e) => setHSpacing(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>V Spacing</Label>
          <Input
            type="number"
            value={parseFloat(u(state.vSpacing).toFixed(1))}
            onChange={(e) => setVSpacing(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  )
}
