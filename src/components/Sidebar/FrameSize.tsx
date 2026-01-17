import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Frame } from 'lucide-react'

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
    setHSpacing, setVSpacing
  } = calculator

  // Find matching template for current dimensions
  const currentTemplate = FRAME_TEMPLATES.find(
    t => t.width === state.frameWidth && t.height === state.frameHeight
  )?.value

  const handleTemplateChange = (value: string) => {
    const template = FRAME_TEMPLATES.find(t => t.value === value)
    if (template) {
      setFrameWidth(template.width)
      setFrameHeight(template.height)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-pink-100 text-pink-600">
          <Frame className="h-3.5 w-3.5" />
        </span>
        Frame Size
      </h3>

      <div className="space-y-1.5 mb-3">
        <Label>Template</Label>
        <Select value={currentTemplate || ''} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a size..." />
          </SelectTrigger>
          <SelectContent>
            {FRAME_TEMPLATES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          <Label>Horizontal Spacing</Label>
          <Input
            type="number"
            value={parseFloat(u(state.hSpacing).toFixed(1))}
            onChange={(e) => setHSpacing(fromU(parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Vertical Spacing</Label>
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
