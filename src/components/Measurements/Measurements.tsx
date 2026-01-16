import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { formatMeasurement, formatShort, toDisplayUnit } from '@/utils/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MeasurementsProps {
  calculator: UseCalculatorReturn
}

export function Measurements({ calculator }: MeasurementsProps) {
  const { state, layoutPositions, setSelectedFrame } = calculator

  const fmt = (val: number) => formatMeasurement(toDisplayUnit(val, state.unit), state.unit)
  const fmtShort = (val: number) => formatShort(toDisplayUnit(val, state.unit), state.unit)

  return (
    <Card className="max-h-[280px] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: '#fef3c7' }}>📏</span>
          Hook Placement Measurements
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[200px]">
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {layoutPositions.map((frame) => (
            <div
              key={frame.id}
              className={cn(
                "p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 transition-all",
                state.selectedFrame === frame.id && "from-indigo-100 to-indigo-200",
                state.layoutType === 'salon' && "cursor-pointer hover:shadow-md"
              )}
              onClick={() => state.layoutType === 'salon' && setSelectedFrame(frame.id)}
            >
              <h3 className="text-sm font-semibold text-purple-800 mb-2">
                {frame.name} {state.layoutType === 'grid' && `(Row ${(frame.row ?? 0) + 1}, Col ${(frame.col ?? 0) + 1})`}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-white rounded-md">
                  <div className="text-lg font-bold text-indigo-600">{fmt(frame.fromLeft)}</div>
                  <div className="text-[10px] text-gray-500">From left edge</div>
                </div>
                <div className="text-center p-2 bg-white rounded-md">
                  <div className="text-lg font-bold text-green-500">{fmt(frame.fromFloor)}</div>
                  <div className="text-[10px] text-gray-500">From floor (up)</div>
                </div>
                <div className="text-center p-2 bg-white rounded-md">
                  <div className="text-lg font-bold text-amber-500">{fmt(frame.fromCeiling)}</div>
                  <div className="text-[10px] text-gray-500">From ceiling (down)</div>
                </div>
                <div className="text-center p-2 bg-white rounded-md">
                  <div className="text-lg font-bold text-gray-500">
                    {fmtShort(frame.width)} × {fmtShort(frame.height)}
                  </div>
                  <div className="text-[10px] text-gray-500">Frame size</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
