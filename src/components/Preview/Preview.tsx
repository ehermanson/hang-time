import { useRef, useEffect, useState } from 'react'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import type { DragState } from '@/types'
import { formatMeasurement, formatShort, toDisplayUnit } from '@/utils/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PreviewProps {
  calculator: UseCalculatorReturn
}

export function Preview({ calculator }: PreviewProps) {
  const { state, layoutPositions, totalFrames, updateSalonFramePosition, setSelectedFrame } = calculator
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<DragState | null>(null)

  const fmt = (val: number) => formatMeasurement(toDisplayUnit(val, state.unit), state.unit)
  const fmtShort = (val: number) => formatShort(toDisplayUnit(val, state.unit), state.unit)

  // Draw preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = containerRef.current
    const containerWidth = container?.clientWidth || 600

    // Calculate scale to fit
    const padding = 60
    const availableWidth = containerWidth - padding * 2
    const availableHeight = 500
    const scale = Math.min(availableWidth / state.wallWidth, availableHeight / state.wallHeight)

    const canvasWidth = state.wallWidth * scale + padding * 2
    const canvasHeight = state.wallHeight * scale + padding * 2

    canvas.width = canvasWidth * 2 // Retina
    canvas.height = canvasHeight * 2
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(2, 2) // Retina scaling

    // Clear
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const offsetX = padding
    const offsetY = padding

    // Draw wall background
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 2
    ctx.fillRect(offsetX, offsetY, state.wallWidth * scale, state.wallHeight * scale)
    ctx.strokeRect(offsetX, offsetY, state.wallWidth * scale, state.wallHeight * scale)

    // Draw ruler marks on top
    ctx.fillStyle = '#666'
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'

    // Top ruler
    const tickInterval = state.unit === 'in' ? 12 : 30
    for (let i = 0; i <= state.wallWidth; i += tickInterval) {
      const x = offsetX + i * scale
      ctx.beginPath()
      ctx.moveTo(x, offsetY - 10)
      ctx.lineTo(x, offsetY)
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillText(fmtShort(i), x, offsetY - 14)
    }

    // Left ruler (Y axis - 0 at floor, increasing upward)
    ctx.textAlign = 'right'
    for (let i = 0; i <= state.wallHeight; i += tickInterval) {
      const y = offsetY + (state.wallHeight - i) * scale // Flip: 0 at bottom, max at top
      ctx.beginPath()
      ctx.moveTo(offsetX - 10, y)
      ctx.lineTo(offsetX, y)
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillText(fmtShort(i), offsetX - 14, y + 4)
    }

    // Draw floor
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(offsetX, offsetY + state.wallHeight * scale, state.wallWidth * scale, 8)
    ctx.fillStyle = '#666'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FLOOR', offsetX + state.wallWidth * scale / 2, offsetY + state.wallHeight * scale + 20)

    // Draw ceiling indicator
    ctx.fillStyle = '#666'
    ctx.fillText('CEILING', offsetX + state.wallWidth * scale / 2, offsetY - 30)

    // Draw anchor reference line
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = '#4f46e5'
    ctx.lineWidth = 1

    if (state.layoutType !== 'salon') {
      if (state.anchorType === 'center') {
        const centerY = offsetY + (state.wallHeight / 2) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, centerY)
        ctx.lineTo(offsetX + state.wallWidth * scale, centerY)
        ctx.stroke()
      } else if (state.anchorType === 'ceiling') {
        const lineY = offsetY + state.anchorValue * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      } else if (state.anchorType === 'furniture') {
        // Draw line at furniture top + gap
        const furnitureTop = state.wallHeight - state.furnitureHeight
        const lineY = offsetY + (furnitureTop - state.anchorValue) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      } else {
        const lineY = offsetY + (state.wallHeight - state.anchorValue) * scale
        ctx.beginPath()
        ctx.moveTo(offsetX, lineY)
        ctx.lineTo(offsetX + state.wallWidth * scale, lineY)
        ctx.stroke()
      }
    }
    ctx.setLineDash([])

    // Draw furniture when in furniture mode
    if (state.anchorType === 'furniture') {
      // Calculate furniture position
      // furnitureX is offset from wall center
      const furnitureCenterX = (state.wallWidth / 2) + state.furnitureX
      const furnitureLeft = furnitureCenterX - state.furnitureWidth / 2
      const furnitureTop = state.wallHeight - state.furnitureHeight

      const fx = offsetX + furnitureLeft * scale
      const fy = offsetY + furnitureTop * scale
      const fw = state.furnitureWidth * scale
      const fh = state.furnitureHeight * scale

      // Furniture shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(fx + 2, fy + 2, fw, fh)

      // Furniture body
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(fx, fy, fw, fh)

      // Furniture border
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 2
      ctx.strokeRect(fx, fy, fw, fh)

      // Furniture label
      ctx.fillStyle = '#6b7280'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('FURNITURE', fx + fw / 2, fy + fh / 2 + 4)

      // Dimension labels
      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(fmtShort(state.furnitureWidth), fx + fw / 2, fy - 6)
    }

    // Draw frames
    layoutPositions.forEach((frame) => {
      const fx = offsetX + frame.x * scale
      const fy = offsetY + frame.y * scale
      const fw = frame.width * scale
      const fh = frame.height * scale

      // Frame shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(fx + 3, fy + 3, fw, fh)

      // Frame background
      ctx.fillStyle = '#f8f8f8'
      ctx.fillRect(fx, fy, fw, fh)

      // Frame border
      ctx.strokeStyle = state.selectedFrame === frame.id ? '#4f46e5' : '#333'
      ctx.lineWidth = state.selectedFrame === frame.id ? 3 : 2
      ctx.strokeRect(fx, fy, fw, fh)

      // Frame mat (inner area)
      const matInset = Math.min(fw, fh) * 0.1
      ctx.strokeStyle = '#ddd'
      ctx.lineWidth = 1
      ctx.strokeRect(fx + matInset, fy + matInset, fw - matInset * 2, fh - matInset * 2)

      // Hook position
      const hookX = fx + fw / 2
      const hookY = fy + frame.hangingOffset * scale

      ctx.beginPath()
      ctx.arc(hookX, hookY, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Frame label
      ctx.fillStyle = '#666'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(frame.name, fx + fw / 2, fy + fh / 2 + 4)

      // Dimension labels on frame
      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillStyle = '#4f46e5'

      // Width label
      ctx.fillText(fmtShort(frame.width), fx + fw / 2, fy - 6)

      // Height label
      ctx.save()
      ctx.translate(fx - 6, fy + fh / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(fmtShort(frame.height), 0, 0)
      ctx.restore()
    })

    // Draw measurement lines for first frame
    if (layoutPositions.length > 0) {
      const f = layoutPositions[0]
      const hookX = offsetX + f.hookX * scale
      const hookY = offsetY + f.hookY * scale

      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])

      // Line from hook to left wall
      ctx.beginPath()
      ctx.moveTo(offsetX, hookY)
      ctx.lineTo(hookX, hookY)
      ctx.stroke()

      // Line from hook to floor
      ctx.beginPath()
      ctx.moveTo(hookX, hookY)
      ctx.lineTo(hookX, offsetY + state.wallHeight * scale)
      ctx.stroke()

      // Distance labels
      ctx.setLineDash([])
      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'

      // From left
      ctx.fillText(fmt(f.fromLeft), offsetX + (f.fromLeft * scale) / 2, hookY - 6)

      // From floor
      ctx.save()
      ctx.translate(hookX + 12, offsetY + state.wallHeight * scale - (f.fromFloor * scale) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(fmt(f.fromFloor), 0, 0)
      ctx.restore()
    }

    // Legend
    ctx.fillStyle = '#666'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'left'

    const legendY = canvasHeight - 20

    // Hook marker
    ctx.beginPath()
    ctx.arc(offsetX, legendY, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    ctx.fillStyle = '#666'
    ctx.fillText('= Hook/nail position', offsetX + 12, legendY + 4)

    // Measurement line
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(offsetX + 150, legendY)
    ctx.lineTo(offsetX + 170, legendY)
    ctx.stroke()
    ctx.fillStyle = '#666'
    ctx.fillText('= Measurements', offsetX + 178, legendY + 4)
  }, [layoutPositions, state, fmtShort, fmt])

  // Handle salon frame drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.layoutType !== 'salon') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / 2 / rect.width
    const scaleY = canvas.height / 2 / rect.height

    const padding = 60
    const scale = Math.min((rect.width - padding * 2) / state.wallWidth, 500 / state.wallHeight)

    const mouseX = (e.clientX - rect.left) * scaleX - padding
    const mouseY = (e.clientY - rect.top) * scaleY - padding

    const clickX = mouseX / scale
    const clickY = mouseY / scale

    // Find clicked frame
    for (let i = state.salonFrames.length - 1; i >= 0; i--) {
      const f = state.salonFrames[i]
      if (clickX >= f.x && clickX <= f.x + f.width &&
        clickY >= f.y && clickY <= f.y + f.height) {
        setSelectedFrame(f.id)
        setDragging({ id: f.id, startX: clickX - f.x, startY: clickY - f.y })
        return
      }
    }
    setSelectedFrame(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || state.layoutType !== 'salon') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / 2 / rect.width
    const scaleY = canvas.height / 2 / rect.height

    const padding = 60
    const scale = Math.min((rect.width - padding * 2) / state.wallWidth, 500 / state.wallHeight)

    const mouseX = (e.clientX - rect.left) * scaleX - padding
    const mouseY = (e.clientY - rect.top) * scaleY - padding

    const frame = state.salonFrames.find(f => f.id === dragging.id)
    if (!frame) return

    const newX = Math.max(0, Math.min(state.wallWidth - frame.width, mouseX / scale - dragging.startX))
    const newY = Math.max(0, Math.min(state.wallHeight - frame.height, mouseY / scale - dragging.startY))

    updateSalonFramePosition(dragging.id, newX, newY)
  }

  const handleCanvasMouseUp = () => {
    setDragging(null)
  }

  return (
    <Card ref={containerRef}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: '#dbeafe' }}>👁️</span>
          Visual Preview (To Scale)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <canvas
          ref={canvasRef}
          className="flex-1 min-h-[250px] bg-gray-50 rounded-lg border-2 border-gray-200"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{ cursor: state.layoutType === 'salon' ? 'pointer' : 'default' }}
        />
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
          <strong>Preview is to scale.</strong> Wall: {fmt(state.wallWidth)} × {fmt(state.wallHeight)} |
          {state.layoutType === 'salon'
            ? ` ${state.salonFrames.length} frames`
            : ` ${totalFrames} frames (${state.layoutType === 'grid' ? `${state.gridRows}×${state.gridCols}` : `1×${state.gridCols}`})`}
          {state.layoutType === 'salon' && ' — Drag frames to reposition'}
        </div>
      </CardContent>
    </Card>
  )
}
