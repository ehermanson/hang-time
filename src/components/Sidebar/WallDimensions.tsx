import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  calculator: UseCalculatorReturn
}

export function WallDimensions({ calculator }: Props) {
  const { state, u, fromU, setWallWidth, setWallHeight } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: '#dbeafe' }}>📐</span>
        Wall Dimensions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Width ({state.unit})</Label>
          <Input
            type="number"
            value={parseFloat(u(state.wallWidth).toFixed(1))}
            onChange={(e) => setWallWidth(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Height ({state.unit})</Label>
          <Input
            type="number"
            value={parseFloat(u(state.wallHeight).toFixed(1))}
            onChange={(e) => setWallHeight(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  )
}
