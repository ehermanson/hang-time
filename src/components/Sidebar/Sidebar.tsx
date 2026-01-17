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
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Link, Check, Bookmark, Pencil, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="6" fill="#4f46e5" />
      <rect x="7" y="9" width="18" height="16" rx="1" stroke="white" strokeWidth="2" fill="none" />
      <rect x="10" y="12" width="12" height="10" rx="0.5" stroke="white" strokeWidth="1" opacity="0.6" fill="none" />
      <path d="M11 9 L16 5 L21 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="5" r="1.5" fill="white" />
    </svg>
  )
}

interface SidebarProps {
  calculator: UseCalculatorReturn
}

export function Sidebar({ calculator }: SidebarProps) {
  const { state } = calculator
  const { layouts, save, update, rename, remove, load, startFresh, isNameTaken, existingLayoutForCurrentConfig, loadedLayout, hasUnsavedChanges } = useSavedLayouts()
  const [copied, setCopied] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState(false)
  const [bookmarkEditValue, setBookmarkEditValue] = useState('')
  const [bookmarkEditError, setBookmarkEditError] = useState<string | null>(null)
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

  return (
    <div className="flex flex-col w-[360px] h-screen bg-white border-r border-gray-200 max-md:w-full max-md:max-h-[50vh] max-md:border-r-0 max-md:border-b">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Logo className="h-6 w-6" />
          Hang Time
        </h1>
        <p className="text-sm text-gray-500 mt-1">Picture Perfect Picture Placement</p>
        {currentLayout && (
          <div className={`flex items-center gap-2 mt-3 px-2 py-1.5 rounded-md text-sm ${
            hasUnsavedChanges
              ? 'bg-amber-50 text-amber-700'
              : 'bg-indigo-50 text-indigo-700'
          }`}>
            <Bookmark className={`h-3.5 w-3.5 flex-shrink-0 ${hasUnsavedChanges ? '' : 'fill-current'}`} />
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
                  className={`h-6 text-sm flex-1 min-w-0 ${bookmarkEditError ? 'border-red-500' : ''}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={saveBookmarkEdit}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={cancelBookmarkEdit}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <span className="truncate flex-1">
                  {currentLayout.title}
                  {hasUnsavedChanges && <span className="text-amber-600"> (modified)</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0"
                  onClick={startBookmarkEdit}
                  title="Rename layout"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0"
                  onClick={() => startFresh()}
                  title="Start new layout"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
        <TooltipProvider delayDuration={300}>
          <div className="flex gap-2 mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    </div>
  )
}
