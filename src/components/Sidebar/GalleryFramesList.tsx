import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Images, Magnet, Move, Sofa } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

export function GalleryFramesList({ calculator }: Props) {
  const {
    state, u, fromU,
    updateGalleryFrame, removeGalleryFrame,
    setGallerySpacing, setGallerySnapping, selectAllFrames, clearFrameSelection,
    toggleFrameSelection,
    setFurnitureWidth, setFurnitureHeight, setFurnitureX
  } = calculator

  return (
    <div className="space-y-4">
      {/* Layout Settings */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded flex items-center justify-center bg-violet-100 text-violet-600">
            <Magnet className="h-3.5 w-3.5" />
          </span>
          Layout Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Snap Gap ({state.unit})</Label>
              <Input
                type="number"
                step="0.125"
                value={parseFloat(u(state.gallerySpacing).toFixed(3))}
                onChange={(e) => setGallerySpacing(fromU(parseFloat(e.target.value) || 0))}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs block mb-1.5">Snapping</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.gallerySnapping}
                  onChange={(e) => setGallerySnapping(e.target.checked)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={selectAllFrames}
            >
              <Move className="h-3 w-3 mr-1" /> Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={clearFrameSelection}
            >
              Clear Selection
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Shift+click to multi-select. Drag selected frames together.
          </p>
        </div>
      </div>

      {/* Furniture Reference */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-100 text-amber-600">
            <Sofa className="h-3.5 w-3.5" />
          </span>
          Furniture Reference
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Width ({state.unit})</Label>
            <Input
              type="number"
              step="0.125"
              value={parseFloat(u(state.furnitureWidth).toFixed(3))}
              onChange={(e) => setFurnitureWidth(fromU(parseFloat(e.target.value) || 0))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Height ({state.unit})</Label>
            <Input
              type="number"
              step="0.125"
              value={parseFloat(u(state.furnitureHeight).toFixed(3))}
              onChange={(e) => setFurnitureHeight(fromU(parseFloat(e.target.value) || 0))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">X Offset ({state.unit})</Label>
            <Input
              type="number"
              step="0.125"
              value={parseFloat(u(state.furnitureX).toFixed(3))}
              onChange={(e) => setFurnitureX(fromU(parseFloat(e.target.value) || 0))}
              className="h-8"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Frames snap to furniture edges and center.
        </p>
      </div>

      {/* Frames List */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded flex items-center justify-center bg-pink-100 text-pink-600">
            <Images className="h-3.5 w-3.5" />
          </span>
          Frames ({state.galleryFrames.length})
        </h3>
        <div className="max-h-[200px] overflow-y-auto space-y-2">
        {state.galleryFrames.map((frame) => {
          const isSelected = state.selectedFrames.includes(frame.id)
          const isPrimary = state.selectedFrame === frame.id
          return (
          <div
            key={frame.id}
            className={cn(
              "p-3 bg-white rounded-md border-2 transition-colors cursor-pointer",
              isPrimary ? "border-indigo-600 bg-indigo-50" :
              isSelected ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200"
            )}
            onClick={(e) => toggleFrameSelection(frame.id, e.shiftKey)}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <Input
                type="text"
                value={frame.name}
                onChange={(e) => updateGalleryFrame(frame.id, 'name', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeGalleryFrame(frame.id)}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">W</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={parseFloat(u(frame.width).toFixed(3))}
                  onChange={(e) => updateGalleryFrame(frame.id, 'width', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">H</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={parseFloat(u(frame.height).toFixed(3))}
                  onChange={(e) => updateGalleryFrame(frame.id, 'height', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Offset</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={parseFloat(u(frame.hangingOffset).toFixed(3))}
                  onChange={(e) => updateGalleryFrame(frame.id, 'hangingOffset', fromU(parseFloat(e.target.value) || 0))}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )})}
        </div>
      </div>
    </div>
  )
}
