import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Minus, Plus, Maximize2, HelpCircle } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { formatMeasurement, formatShort, toDisplayUnit } from '@/utils/calculations'
import { Button } from '@/components/ui/button'

interface PreviewProps {
  calculator: UseCalculatorReturn
}

export function Preview({ calculator }: PreviewProps) {
  const { state, layoutPositions } = calculator

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 })

  // Zoom and pan state
  const [zoom, setZoom] = useState(1) // 1 = fit to view
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Track reference hook (shows wall measurements) and compare hook (shows distance from reference)
  const [referenceHook, setReferenceHook] = useState<{ frameId: number; hookIndex: number } | null>(null)
  const [compareHook, setCompareHook] = useState<{ frameId: number; hookIndex: number } | null>(null)

  const fmt = (val: number) => formatMeasurement(toDisplayUnit(val, state.unit), state.unit)
  const fmtShort = useCallback(
    (val: number) => formatShort(toDisplayUnit(val, state.unit), state.unit),
    [state.unit]
  )

  // Calculate dimensions - wall fits to available space (accounting for sidebar)
  const padding = 60
  const SIDEBAR_WIDTH = 360 // sidebar width + margin

  // Base scale: fits wall to available space
  const baseScale = useMemo(() => {
    // Account for sidebar overlap on the left
    const availableWidth = containerSize.width - SIDEBAR_WIDTH - padding * 2
    const availableHeight = containerSize.height - padding * 2

    // Fit wall to available space (scale to fit both dimensions)
    const scaleX = availableWidth / state.wallWidth
    const scaleY = availableHeight / state.wallHeight
    return Math.min(scaleX, scaleY, (containerSize.width - padding * 2) / state.wallWidth)
  }, [containerSize.width, containerSize.height, state.wallWidth, state.wallHeight])

  // Effective scale = base scale * zoom
  const scale = baseScale * zoom

  // Canvas fills the container, wall is positioned with pan offset
  const canvasWidth = containerSize.width
  const canvasHeight = containerSize.height

  // Handle canvas click to select hooks for measurement display
  // Regular click = set reference hook, Shift+click = set compare hook
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const clickX = (e.clientX - rect.left) * dpr
    const clickY = (e.clientY - rect.top) * dpr

    const hookRadius = 12 // Slightly larger than visual for easier clicking
    const isShiftClick = e.shiftKey

    // Account for pan offset when calculating hook positions
    const offsetX = padding + pan.x
    const offsetY = padding + pan.y

    // Check if click is on any hook
    for (const frame of layoutPositions) {
      const hookX1 = offsetX + frame.hookX * scale
      const hookY = offsetY + frame.hookY * scale

      // Check first hook
      const dist1 = Math.hypot((clickX / dpr) - hookX1, (clickY / dpr) - hookY)
      if (dist1 <= hookRadius) {
        const hookData = { frameId: frame.id, hookIndex: 0 }
        if (isShiftClick && referenceHook) {
          // Shift+click: set as compare hook (if we have a reference)
          setCompareHook(hookData)
        } else {
          // Regular click: set as reference, clear compare
          setReferenceHook(hookData)
          setCompareHook(null)
        }
        return
      }

      // Check second hook if dual
      if (frame.hookX2 !== undefined) {
        const hookX2 = offsetX + frame.hookX2 * scale
        const dist2 = Math.hypot((clickX / dpr) - hookX2, (clickY / dpr) - hookY)
        if (dist2 <= hookRadius) {
          const hookData = { frameId: frame.id, hookIndex: 1 }
          if (isShiftClick && referenceHook) {
            setCompareHook(hookData)
          } else {
            setReferenceHook(hookData)
            setCompareHook(null)
          }
          return
        }
      }
    }

    // Click elsewhere clears selection (back to first hook default)
    setReferenceHook(null)
    setCompareHook(null)
  }, [layoutPositions, scale, referenceHook, pan])

  // Track container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Calculate initial pan position - wall near top, centered horizontally
  const getCenteredPan = useCallback(() => {
    const wallWidth = state.wallWidth * baseScale
    const availableWidth = containerSize.width - SIDEBAR_WIDTH
    const centerX = SIDEBAR_WIDTH + (availableWidth - wallWidth) / 2 - padding
    // Position wall near top with minimal offset (just enough for ruler/ceiling label)
    const topY = 0
    return { x: Math.max(0, centerX), y: topY }
  }, [state.wallWidth, baseScale, containerSize])

  // Fit to view function - centers wall in available space
  const fitToView = useCallback(() => {
    setZoom(1)
    setPan(getCenteredPan())
  }, [getCenteredPan])

  // Set initial pan position when container size stabilizes
  const [hasInitialized, setHasInitialized] = useState(false)
  useEffect(() => {
    if (!hasInitialized && containerSize.width > 100 && containerSize.height > 100) {
      setPan(getCenteredPan())
      setHasInitialized(true)
    }
  }, [hasInitialized, containerSize, getCenteredPan])

  // Wheel zoom handler - zoom centered on cursor
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Cursor position in container
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Zoom factor (faster zoom with Ctrl/Cmd key)
    const zoomSpeed = e.ctrlKey || e.metaKey ? 1.15 : 1.1
    const delta = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed
    const newZoom = Math.max(0.1, Math.min(10, zoom * delta))

    // Adjust pan to zoom centered on cursor
    const scaleChange = newZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * scaleChange
    const newPanY = mouseY - (mouseY - pan.y) * scaleChange

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }, [zoom, pan])

  // Attach wheel listener with passive: false
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Left-click or middle-click to pan
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Also handle mouse leave to stop panning
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Draw background on canvas (wall, rulers, furniture - but NOT frames for gallery mode)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    // Apply pan offset to wall position
    const offsetX = padding + pan.x
    const offsetY = padding + pan.y

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

    // Left ruler
    ctx.textAlign = 'right'
    for (let i = 0; i <= state.wallHeight; i += tickInterval) {
      const y = offsetY + (state.wallHeight - i) * scale
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
    ctx.fillText('FLOOR', offsetX + (state.wallWidth * scale) / 2, offsetY + state.wallHeight * scale + 20)

    // Draw ceiling indicator
    ctx.fillStyle = '#666'
    ctx.fillText('CEILING', offsetX + (state.wallWidth * scale) / 2, offsetY - 30)

    // Draw anchor reference line
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = '#4f46e5'
    ctx.lineWidth = 1

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
    ctx.setLineDash([])

    // Draw furniture
    if (state.anchorType === 'furniture') {
      const furnitureCenterX = state.wallWidth / 2 + state.furnitureX
      const furnitureLeft = furnitureCenterX - state.furnitureWidth / 2
      const furnitureTop = state.wallHeight - state.furnitureHeight

      const fx = offsetX + furnitureLeft * scale
      const fy = offsetY + furnitureTop * scale
      const fw = state.furnitureWidth * scale
      const fh = state.furnitureHeight * scale

      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(fx + 2, fy + 2, fw, fh)
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(fx, fy, fw, fh)
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 2
      ctx.strokeRect(fx, fy, fw, fh)
      ctx.fillStyle = '#6b7280'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('FURNITURE', fx + fw / 2, fy + fh / 2 + 4)
      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillText(fmtShort(state.furnitureWidth), fx + fw / 2, fy - 6)
    }

    // Draw frames on canvas
    layoutPositions.forEach((frame) => {
        const fx = offsetX + frame.x * scale
        const fy = offsetY + frame.y * scale
        const fw = frame.width * scale
        const fh = frame.height * scale

        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(fx + 3, fy + 3, fw, fh)
        ctx.fillStyle = '#f8f8f8'
        ctx.fillRect(fx, fy, fw, fh)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.strokeRect(fx, fy, fw, fh)

        const matInset = Math.min(fw, fh) * 0.1
        ctx.strokeStyle = '#ddd'
        ctx.lineWidth = 1
        ctx.strokeRect(fx + matInset, fy + matInset, fw - matInset * 2, fh - matInset * 2)

        // Draw hook(s) - use actual positions from frame
        const hookY = fy + frame.hangingOffset * scale
        const hookX1 = offsetX + frame.hookX * scale

        // Draw first (or only) hook
        ctx.beginPath()
        ctx.arc(hookX1, hookY, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#ef4444'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw second hook if dual hanging
        if (frame.hookX2 !== undefined) {
          const hookX2 = offsetX + frame.hookX2 * scale
          ctx.beginPath()
          ctx.arc(hookX2, hookY, 6, 0, Math.PI * 2)
          ctx.fillStyle = '#ef4444'
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        ctx.fillStyle = '#666'
        ctx.font = 'bold 11px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(frame.name, fx + fw / 2, fy + fh / 2 + 4)

        ctx.font = '10px -apple-system, sans-serif'
        ctx.fillStyle = '#4f46e5'
        ctx.fillText(fmtShort(frame.width), fx + fw / 2, fy - 6)

        ctx.save()
        ctx.translate(fx - 6, fy + fh / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(fmtShort(frame.height), 0, 0)
        ctx.restore()
      })

      // Helper to draw full measurements for a specific hook
      const drawFullMeasurements = (f: typeof layoutPositions[0], hookIndex: number) => {
        const hookX = offsetX + (hookIndex === 1 && f.hookX2 ? f.hookX2 : f.hookX) * scale
        const hookY = offsetY + f.hookY * scale
        const fromLeft = hookIndex === 1 && f.hookX2 ? f.hookX2 : f.fromLeft

        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])

        // Line from wall left to hook
        ctx.beginPath()
        ctx.moveTo(offsetX, hookY)
        ctx.lineTo(hookX, hookY)
        ctx.stroke()

        // Vertical line from hook to floor
        ctx.beginPath()
        ctx.moveTo(hookX, hookY)
        ctx.lineTo(hookX, offsetY + state.wallHeight * scale)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.font = 'bold 10px -apple-system, sans-serif'
        ctx.textAlign = 'center'

        // "From left" label with background
        const fromLeftText = fmt(fromLeft)
        const fromLeftX = offsetX + (fromLeft * scale) / 2
        const fromLeftWidth = ctx.measureText(fromLeftText).width
        ctx.fillStyle = '#fff'
        ctx.fillRect(fromLeftX - fromLeftWidth / 2 - 2, hookY - 14, fromLeftWidth + 4, 12)
        ctx.fillStyle = '#22c55e'
        ctx.fillText(fromLeftText, fromLeftX, hookY - 5)

        // "From floor" label (rotated)
        ctx.save()
        ctx.font = 'bold 10px -apple-system, sans-serif'
        const fromFloorText = fmt(f.fromFloor)
        const fromFloorY = offsetY + state.wallHeight * scale - (f.fromFloor * scale) / 2
        ctx.translate(hookX + 10, fromFloorY)
        ctx.rotate(-Math.PI / 2)
        const floorTextWidth = ctx.measureText(fromFloorText).width
        ctx.fillStyle = '#fff'
        ctx.fillRect(-floorTextWidth / 2 - 2, -9, floorTextWidth + 4, 12)
        ctx.fillStyle = '#22c55e'
        ctx.fillText(fromFloorText, 0, 0)
        ctx.restore()
      }

      // Always show hook gap for dual hooks (for all frames)
      layoutPositions.forEach((f) => {
        if (f.hookX2 !== undefined && f.hookGap !== undefined) {
          const hookX = offsetX + f.hookX * scale
          const hookX2 = offsetX + f.hookX2 * scale
          const hookY = offsetY + f.hookY * scale

          ctx.strokeStyle = '#f59e0b' // Amber for gap
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(hookX, hookY)
          ctx.lineTo(hookX2, hookY)
          ctx.stroke()
          ctx.setLineDash([])

          // Hook gap measurement label
          const gapText = fmt(f.hookGap)
          const textX = (hookX + hookX2) / 2
          ctx.font = 'bold 10px -apple-system, sans-serif'
          const textWidth = ctx.measureText(gapText).width
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.roundRect(textX - textWidth / 2 - 4, hookY - 7, textWidth + 8, 14, 3)
          ctx.fill()
          ctx.fillStyle = '#f59e0b'
          ctx.textAlign = 'center'
          ctx.fillText(gapText, textX, hookY + 4)
        }
      })

      // Draw full measurements for reference hook (first by default)
      if (referenceHook) {
        const frame = layoutPositions.find(f => f.id === referenceHook.frameId)
        if (frame) {
          drawFullMeasurements(frame, referenceHook.hookIndex)

          // Show contextual tooltip if no compare hook selected yet
          if (!compareHook) {
            const hookX = offsetX + (referenceHook.hookIndex === 1 && frame.hookX2 ? frame.hookX2 : frame.hookX) * scale
            const hookY = offsetY + frame.hookY * scale

            const tooltipText = 'Shift+click another hook to compare'
            ctx.font = '11px -apple-system, sans-serif'
            const textWidth = ctx.measureText(tooltipText).width

            // Position tooltip above the hook
            const tooltipX = hookX
            const tooltipY = hookY - 25

            // Draw tooltip background
            ctx.fillStyle = '#1f2937'
            ctx.beginPath()
            ctx.roundRect(tooltipX - textWidth / 2 - 8, tooltipY - 12, textWidth + 16, 22, 4)
            ctx.fill()

            // Draw arrow pointing down
            ctx.beginPath()
            ctx.moveTo(tooltipX - 6, tooltipY + 10)
            ctx.lineTo(tooltipX + 6, tooltipY + 10)
            ctx.lineTo(tooltipX, tooltipY + 16)
            ctx.closePath()
            ctx.fill()

            // Draw text
            ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'
            ctx.fillText(tooltipText, tooltipX, tooltipY + 2)
          }
        }
      } else if (layoutPositions.length > 0) {
        // Default: show first hook measurements
        drawFullMeasurements(layoutPositions[0], 0)
      }

      // Draw comparison measurements between reference and compare hooks
      if (referenceHook && compareHook) {
        const refFrame = layoutPositions.find(f => f.id === referenceHook.frameId)
        const cmpFrame = layoutPositions.find(f => f.id === compareHook.frameId)

        if (refFrame && cmpFrame) {
          // Get hook positions
          const refX = referenceHook.hookIndex === 1 && refFrame.hookX2 ? refFrame.hookX2 : refFrame.hookX
          const refY = refFrame.hookY
          const cmpX = compareHook.hookIndex === 1 && cmpFrame.hookX2 ? cmpFrame.hookX2 : cmpFrame.hookX
          const cmpY = cmpFrame.hookY

          // Screen positions
          const refScreenX = offsetX + refX * scale
          const refScreenY = offsetY + refY * scale
          const cmpScreenX = offsetX + cmpX * scale
          const cmpScreenY = offsetY + cmpY * scale

          // Calculate deltas
          const deltaX = cmpX - refX
          const deltaY = cmpY - refY

          // Draw connecting line (cyan/teal for comparison)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 3])
          ctx.beginPath()
          ctx.moveTo(refScreenX, refScreenY)
          ctx.lineTo(cmpScreenX, cmpScreenY)
          ctx.stroke()
          ctx.setLineDash([])

          // Draw reference hook highlight (ring)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(refScreenX, refScreenY, 10, 0, Math.PI * 2)
          ctx.stroke()

          // Draw compare hook highlight (filled ring)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(cmpScreenX, cmpScreenY, 10, 0, Math.PI * 2)
          ctx.stroke()

          // Format distance labels
          const hText = Math.abs(deltaX) > 0.1 ? `${fmt(Math.abs(deltaX))} horizontal` : ''
          const vText = Math.abs(deltaY) > 0.1 ? `${fmt(Math.abs(deltaY))} vertical` : ''

          // Draw label at midpoint
          const midX = (refScreenX + cmpScreenX) / 2
          const midY = (refScreenY + cmpScreenY) / 2

          ctx.font = 'bold 11px -apple-system, sans-serif'
          ctx.textAlign = 'center'

          // Build label text
          const labels = [hText, vText].filter(Boolean)
          const labelText = labels.join(', ')

          if (labelText) {
            const textWidth = ctx.measureText(labelText).width

            // Draw background pill
            ctx.fillStyle = '#06b6d4'
            ctx.beginPath()
            ctx.roundRect(midX - textWidth / 2 - 8, midY - 10, textWidth + 16, 20, 4)
            ctx.fill()

            // Draw text
            ctx.fillStyle = '#fff'
            ctx.fillText(labelText, midX, midY + 4)
          }
        }
      }

  }, [
    layoutPositions,
    state,
    scale,
    canvasWidth,
    canvasHeight,
    fmtShort,
    fmt,
    referenceHook,
    compareHook,
    pan,
    zoom,
  ])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div
        className="relative"
        style={{ height: canvasHeight, width: canvasWidth }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Help button - top right */}
      <div className="absolute top-4 right-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-white/10"
            >
              <HelpCircle className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs text-gray-600 dark:text-white/70">Hook position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-green-500 shrink-0" />
                <span className="text-xs text-gray-600 dark:text-white/70">Distance from wall/floor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-cyan-500 shrink-0" />
                <span className="text-xs text-gray-600 dark:text-white/70">Hook comparison</span>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Click a hook to see measurements.<br />
                  Shift+click another to compare.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Zoom controls - bottom right */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl px-2 py-1.5 shadow-lg border border-gray-200/50 dark:border-white/10">
        <button
          onClick={() => setZoom(z => Math.max(0.1, z * 0.8))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom out"
        >
          <Minus className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>

        <span className="text-xs font-medium text-gray-600 dark:text-white/70 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(z => Math.min(10, z * 1.25))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom in"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

        <button
          onClick={fitToView}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Fit to view"
        >
          <Maximize2 className="h-4 w-4 text-gray-600 dark:text-white/70" />
        </button>
      </div>
    </div>
  )
}
