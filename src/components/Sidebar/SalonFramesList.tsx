import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Images } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

export function SalonFramesList({ calculator }: Props) {
  const {
    state, u, fromU,
    updateSalonFrame, removeSalonFrame, setSelectedFrame
  } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-pink-100 text-pink-600">
          <Images className="h-3.5 w-3.5" />
        </span>
        Frames ({state.salonFrames.length})
      </h3>
      <div className="max-h-[250px] overflow-y-auto space-y-2">
        {state.salonFrames.map((frame) => (
          <div
            key={frame.id}
            className={cn(
              "p-3 bg-white rounded-md border-2 transition-colors",
              state.selectedFrame === frame.id ? "border-indigo-600" : "border-gray-200"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <Input
                type="text"
                value={frame.name}
                onChange={(e) => updateSalonFrame(frame.id, 'name', e.target.value)}
                onClick={() => setSelectedFrame(frame.id)}
                className="flex-1"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeSalonFrame(frame.id)}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">W</Label>
                <Input
                  type="number"
                  value={parseFloat(u(frame.width).toFixed(1))}
                  onChange={(e) => updateSalonFrame(frame.id, 'width', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">H</Label>
                <Input
                  type="number"
                  value={parseFloat(u(frame.height).toFixed(1))}
                  onChange={(e) => updateSalonFrame(frame.id, 'height', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Offset</Label>
                <Input
                  type="number"
                  value={parseFloat(u(frame.hangingOffset).toFixed(1))}
                  onChange={(e) => updateSalonFrame(frame.id, 'hangingOffset', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
