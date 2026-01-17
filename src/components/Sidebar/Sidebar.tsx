import { useState, useRef } from 'react'
import type { UseCalculatorReturn } from '@/hooks/useCalculator'
import { useSavedLayouts } from '@/hooks/useSavedLayouts'
import { WallDimensions } from './WallDimensions'
import { LayoutTypeSelector } from './LayoutTypeSelector'
import { FrameSize } from './FrameSize'
import { GalleryFramesList } from './GalleryFramesList'
import { VerticalPosition } from './VerticalPosition'
import { HorizontalPosition } from './HorizontalPosition'
import { SaveLayoutDialog } from '@/components/SaveLayoutDialog'
import { SavedLayoutsDialog } from '@/components/SavedLayoutsDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Measurements } from '@/components/Measurements'
import { HowToHang } from '@/components/HowToHang'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Link, Check, Bookmark, Pencil, X, PanelLeftClose, PanelLeft, Ruler, Hammer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
      <rect x="7" y="9" width="18" height="16" rx="1.5" stroke="white" strokeWidth="2" fill="none" />
      <rect x="10" y="12" width="12" height="10" rx="0.5" stroke="white" strokeWidth="1" opacity="0.5" fill="none" />
      <path d="M11 9 L16 4 L21 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="4" r="2" fill="white" />
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface SidebarProps {
  calculator: UseCalculatorReturn
}

type TabType = 'config' | 'measurements' | 'howto'

export function Sidebar({ calculator }: SidebarProps) {
  const { state } = calculator
  const { layouts, save, update, rename, remove, load, startFresh, isNameTaken, existingLayoutForCurrentConfig, loadedLayout, hasUnsavedChanges } = useSavedLayouts()
  const [copied, setCopied] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState(false)
  const [bookmarkEditValue, setBookmarkEditValue] = useState('')
  const [bookmarkEditError, setBookmarkEditError] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('config')
  const bookmarkInputRef = useRef<HTMLInputElement>(null)

  const currentLayout = existingLayoutForCurrentConfig || loadedLayout

  const startBookmarkEdit = () => {
    if (!currentLayout) return
    setEditingBookmark(true)
    setBookmarkEditValue(currentLayout.title)
    setBookmarkEditError(null)
    setTimeout(() => bookmarkInputRef.current?.focus(), 0)
  }

  const cancelBookmarkEdit = () => {
    setEditingBookmark(false)
    setBookmarkEditValue('')
    setBookmarkEditError(null)
  }

  const saveBookmarkEdit = () => {
    if (!currentLayout) return
    const result = rename(currentLayout.id, bookmarkEditValue)
    if (result.success) {
      setEditingBookmark(false)
      setBookmarkEditValue('')
      setBookmarkEditError(null)
    } else {
      setBookmarkEditError(result.error || 'Failed to rename')
    }
  }

  const handleBookmarkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveBookmarkEdit()
    } else if (e.key === 'Escape') {
      cancelBookmarkEdit()
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Minimized state - show just a floating button
  if (isMinimized) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsMinimized(false)}
                className="h-12 w-12 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-800 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-white/10"
              >
                <PanelLeft className="h-5 w-5 text-gray-700 dark:text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Show controls</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 bottom-4 z-50 w-[340px] flex flex-col">
      {/* Main floating panel */}
      <div className="flex-1 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Hang Time</h1>
                <p className="text-[11px] text-gray-500 dark:text-white/50 -mt-0.5">Pixel Perfect Picture Placement</p>
              </div>
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Minimize</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Current layout indicator */}
          {currentLayout && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
              hasUnsavedChanges
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
            )}>
              <Bookmark className={cn("h-3.5 w-3.5 flex-shrink-0", hasUnsavedChanges ? '' : 'fill-current')} />
              {editingBookmark ? (
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <Input
                    ref={bookmarkInputRef}
                    value={bookmarkEditValue}
                    onChange={(e) => {
                      setBookmarkEditValue(e.target.value)
                      setBookmarkEditError(null)
                    }}
                    onKeyDown={handleBookmarkKeyDown}
                    className={cn(
                      "h-6 text-sm flex-1 min-w-0 bg-white border-gray-300 text-gray-900 dark:bg-white/10 dark:border-white/20 dark:text-white",
                      bookmarkEditError && 'border-red-500'
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-500/20"
                    onClick={saveBookmarkEdit}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60"
                    onClick={cancelBookmarkEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1 text-sm">
                    {currentLayout.title}
                    {hasUnsavedChanges && <span className="text-amber-600 dark:text-amber-400"> *</span>}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={startBookmarkEdit}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => startFresh()}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-2 mt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
              </Tooltip>
              <SaveLayoutDialog
                onSave={save}
                onUpdate={update}
                isNameTaken={isNameTaken}
                existingLayoutForCurrentConfig={existingLayoutForCurrentConfig}
                loadedLayout={loadedLayout}
                hasUnsavedChanges={hasUnsavedChanges}
              />
              <SavedLayoutsDialog
                layouts={layouts}
                onLoad={load}
                onDelete={remove}
                onRename={rename}
              />
              <SettingsDialog
                unit={state.unit}
                onUnitChange={calculator.setUnit}
              />
            </div>
          </TooltipProvider>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('config')}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === 'config'
                ? 'text-gray-900 bg-gray-100 dark:text-white dark:bg-white/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5'
            )}
          >
            Configure
          </button>
          <button
            onClick={() => setActiveTab('measurements')}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
              activeTab === 'measurements'
                ? 'text-gray-900 bg-gray-100 dark:text-white dark:bg-white/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5'
            )}
          >
            <Ruler className="h-3 w-3" />
            Measure
          </button>
          <button
            onClick={() => setActiveTab('howto')}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
              activeTab === 'howto'
                ? 'text-gray-900 bg-gray-100 dark:text-white dark:bg-white/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5'
            )}
          >
            <Hammer className="h-3 w-3" />
            Hang
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'config' && (
            <div className="p-4 space-y-4">
              <WallDimensions calculator={calculator} />
              <LayoutTypeSelector calculator={calculator} />

              {state.layoutType !== 'gallery' && (
                <FrameSize calculator={calculator} />
              )}

              {state.layoutType === 'gallery' && (
                <GalleryFramesList calculator={calculator} />
              )}

              {state.layoutType !== 'gallery' && (
                <>
                  <VerticalPosition calculator={calculator} />
                  <HorizontalPosition calculator={calculator} />
                </>
              )}
            </div>
          )}

          {activeTab === 'measurements' && (
            <div className="p-4">
              <Measurements calculator={calculator} />
            </div>
          )}

          {activeTab === 'howto' && (
            <div className="p-4">
              <HowToHang calculator={calculator} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
