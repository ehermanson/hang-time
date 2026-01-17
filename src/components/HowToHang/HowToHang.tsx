import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { formatMeasurement, toDisplayUnit } from '@/utils/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ListChecks } from 'lucide-react'

interface HowToHangProps {
  calculator: UseCalculatorReturn
}

export function HowToHang({ calculator }: HowToHangProps) {
  const { state, layoutPositions } = calculator

  const fmt = (val: number) => formatMeasurement(toDisplayUnit(val, state.unit), state.unit)

  if (layoutPositions.length === 0) return null

  const firstFrame = layoutPositions[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 text-emerald-600">
            <ListChecks className="h-3.5 w-3.5" />
          </span>
          How to Hang
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">1</span>
            <span>
              <strong>Measure from the left edge</strong> of your wall <strong className="text-indigo-600">{fmt(firstFrame.fromLeft)}</strong> and make a small mark.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">2</span>
            <span>
              <strong>Measure up from the floor</strong> <strong className="text-green-600">{fmt(firstFrame.fromFloor)}</strong> at that mark.
              {state.anchorType === 'ceiling' && (
                <> Or measure down from the ceiling <strong className="text-amber-600">{fmt(firstFrame.fromCeiling)}</strong>.</>
              )}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">3</span>
            <span>
              <strong>Install your hook or nail</strong> at this intersection point.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">4</span>
            <span>
              <strong>Hang your frame</strong> by the wire/bracket and adjust until level.
            </span>
          </li>
          {layoutPositions.length > 1 && (
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs">5</span>
              <span>
                <strong>Repeat</strong> for the remaining {layoutPositions.length - 1} frame{layoutPositions.length > 2 ? 's' : ''} using the measurements above.
              </span>
            </li>
          )}
        </ol>
        <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
          <strong>Tip:</strong> Use a level to ensure your marks are straight. For multiple frames, a laser level can help maintain alignment across the wall.
        </div>
      </CardContent>
    </Card>
  )
}
