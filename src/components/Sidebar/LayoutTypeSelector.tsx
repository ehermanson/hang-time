import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { LayoutType } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid } from 'lucide-react'

interface Props {
  calculator: UseCalculatorReturn
}

export function LayoutTypeSelector({ calculator }: Props) {
  const { state, setLayoutType, setGridRows, setGridCols, addSalonFrame } = calculator

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-100 text-amber-600">
          <LayoutGrid className="h-3.5 w-3.5" />
        </span>
        Layout Type
      </h3>

      <Tabs value={state.layoutType} onValueChange={(v) => setLayoutType(v as LayoutType)}>
        <TabsList className="w-full">
          <TabsTrigger value="grid" className="flex-1">Grid</TabsTrigger>
          <TabsTrigger value="row" className="flex-1">Row</TabsTrigger>
          <TabsTrigger value="salon" className="flex-1">Salon</TabsTrigger>
        </TabsList>
      </Tabs>

      {state.layoutType === 'grid' && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
            <Label>Rows</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={state.gridRows}
              onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Columns</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={state.gridCols}
              onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
      )}

      {state.layoutType === 'row' && (
        <div className="space-y-1.5 mt-3">
          <Label>Number of Frames</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={state.gridCols}
            onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      )}

      {state.layoutType === 'salon' && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">
            Drag frames on preview to position. Click to select.
          </p>
          <Button onClick={addSalonFrame}>
            + Add Frame
          </Button>
        </div>
      )}
    </div>
  )
}
