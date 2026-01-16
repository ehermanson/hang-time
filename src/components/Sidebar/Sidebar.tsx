import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { WallDimensions } from './WallDimensions'
import { LayoutTypeSelector } from './LayoutTypeSelector'
import { FrameSize } from './FrameSize'
import { SalonFramesList } from './SalonFramesList'
import { VerticalPosition } from './VerticalPosition'
import { HorizontalPosition } from './HorizontalPosition'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  calculator: UseCalculatorReturn
}

export function Sidebar({ calculator }: SidebarProps) {
  const { state } = calculator

  return (
    <div className="flex flex-col w-[360px] h-screen bg-white border-r border-gray-200 max-md:w-full max-md:max-h-[50vh] max-md:border-r-0 max-md:border-b">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          🖼️ Picture Hanging Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">Precise measurements for perfect placement</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Unit Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 rounded-md",
              state.unit === 'in' && "bg-white text-indigo-600 shadow-sm hover:bg-white"
            )}
            onClick={() => calculator.setUnit('in')}
          >
            Inches
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 rounded-md",
              state.unit === 'cm' && "bg-white text-indigo-600 shadow-sm hover:bg-white"
            )}
            onClick={() => calculator.setUnit('cm')}
          >
            Centimeters
          </Button>
        </div>

        <WallDimensions calculator={calculator} />
        <LayoutTypeSelector calculator={calculator} />

        {state.layoutType !== 'salon' && (
          <FrameSize calculator={calculator} />
        )}

        {state.layoutType === 'salon' && (
          <SalonFramesList calculator={calculator} />
        )}

        {state.layoutType !== 'salon' && (
          <>
            <VerticalPosition calculator={calculator} />
            <HorizontalPosition calculator={calculator} />
          </>
        )}
      </div>
    </div>
  )
}
