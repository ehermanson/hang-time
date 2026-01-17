import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ruler } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

export function WallDimensions({ calculator }: Props) {
  const { state, u, fromU, setWallWidth, setWallHeight } = calculator

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
          <Ruler className="h-3.5 w-3.5" />
        </span>
        Wall Dimensions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Width ({state.unit})</Label>
          <Input
            type="number"
            step="0.125"
            value={parseFloat(u(state.wallWidth).toFixed(3))}
            onChange={(e) => setWallWidth(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Height ({state.unit})</Label>
          <Input
            type="number"
            step="0.125"
            value={parseFloat(u(state.wallHeight).toFixed(3))}
            onChange={(e) => setWallHeight(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  )
}
