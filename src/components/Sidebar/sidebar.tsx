import {
  Bookmark,
  Check,
  Hammer,
  Link,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  Ruler,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { HowToHang } from '@/components/how-to-hang';
import { Measurements } from '@/components/measurements';
import { SaveLayoutDialog } from '@/components/save-layout-dialog';
import { SavedLayoutsDialog } from '@/components/saved-layouts-dialog';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { useSavedLayouts } from '@/hooks/use-saved-layouts';
import { cn } from '@/lib/utils';
import { FrameSize } from './frame-size';
import { Furniture } from './furniture';
import { HorizontalPosition } from './horizontal-position';
import { LayoutTypeSelector } from './layout-type-selector';
import { VerticalPosition } from './vertical-position';
import { WallDimensions } from './wall-dimensions';

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
      <rect
        x="7"
        y="9"
        width="18"
        height="16"
        rx="1.5"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="10"
        y="12"
        width="12"
        height="10"
        rx="0.5"
        stroke="white"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M11 9 L16 4 L21 9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="4" r="2" fill="white" />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface SidebarProps {
  calculator: UseCalculatorReturn;
}

export function Sidebar({ calculator }: SidebarProps) {
  const { state } = calculator;
  const {
    layouts,
    save,
    update,
    rename,
    remove,
    load,
    startFresh,
    isNameTaken,
    existingLayoutForCurrentConfig,
    loadedLayout,
    hasUnsavedChanges,
  } = useSavedLayouts();
  const [copied, setCopied] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(false);
  const [bookmarkEditValue, setBookmarkEditValue] = useState('');
  const [bookmarkEditError, setBookmarkEditError] = useState<string | null>(
    null,
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);

  const currentLayout = existingLayoutForCurrentConfig || loadedLayout;

  const startBookmarkEdit = () => {
    if (!currentLayout) return;
    setEditingBookmark(true);
    setBookmarkEditValue(currentLayout.title);
    setBookmarkEditError(null);
    setTimeout(() => bookmarkInputRef.current?.focus(), 0);
  };

  const cancelBookmarkEdit = () => {
    setEditingBookmark(false);
    setBookmarkEditValue('');
    setBookmarkEditError(null);
  };

  const saveBookmarkEdit = () => {
    if (!currentLayout) return;
    const result = rename(currentLayout.id, bookmarkEditValue);
    if (result.success) {
      setEditingBookmark(false);
      setBookmarkEditValue('');
      setBookmarkEditError(null);
    } else {
      setBookmarkEditError(result.error || 'Failed to rename');
    }
  };

  const handleBookmarkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveBookmarkEdit();
    } else if (e.key === 'Escape') {
      cancelBookmarkEdit();
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    );
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
                <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Hang Time
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-white/50 -mt-0.5 italic">
                  Pixel Perfect Picture Placement
                </p>
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
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm',
                hasUnsavedChanges
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
              )}
            >
              <Bookmark
                className={cn(
                  'size-3.5 flex-shrink-0',
                  hasUnsavedChanges ? '' : 'fill-current',
                )}
              />
              {editingBookmark ? (
                <div className="flex-1 flex items-center gap-1 min-w-0">
                  <Input
                    ref={bookmarkInputRef}
                    value={bookmarkEditValue}
                    onChange={(e) => {
                      setBookmarkEditValue(e.target.value);
                      setBookmarkEditError(null);
                    }}
                    onKeyDown={handleBookmarkKeyDown}
                    className={cn(
                      'h-6 text-sm flex-1 min-w-0 bg-white border-gray-300 text-gray-900 dark:bg-white/10 dark:border-white/20 dark:text-white',
                      bookmarkEditError && 'border-red-500',
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-500/20"
                    onClick={saveBookmarkEdit}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60"
                    onClick={cancelBookmarkEdit}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1 text-sm">
                    {currentLayout.title}
                    {hasUnsavedChanges && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {' '}
                        *
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={startBookmarkEdit}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-current opacity-60 hover:opacity-100 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => startFresh()}
                  >
                    <X className="size-3" />
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
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Link className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Copied!' : 'Copy link'}
                </TooltipContent>
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

        <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full h-auto p-0 bg-transparent rounded-none border-b border-gray-200 dark:border-white/10">
            <TabsTrigger
              value="config"
              className="flex-1 py-2.5 rounded-none border-0 shadow-none text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5 data-[state=active]:text-gray-900 data-[state=active]:bg-gray-100 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-none"
            >
              <SlidersHorizontal className="size-3" />
              Configure
            </TabsTrigger>
            <TabsTrigger
              value="measurements"
              className="flex-1 py-2.5 rounded-none border-0 shadow-none text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5 data-[state=active]:text-gray-900 data-[state=active]:bg-gray-100 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-none"
            >
              <Ruler className="size-3" />
              Measure
            </TabsTrigger>
            <TabsTrigger
              value="howto"
              className="flex-1 py-2.5 rounded-none border-0 shadow-none text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-white/50 dark:hover:text-white/70 dark:hover:bg-white/5 data-[state=active]:text-gray-900 data-[state=active]:bg-gray-100 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-none"
            >
              <Hammer className="size-3" />
              Hang
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="flex-1 overflow-y-auto mt-0">
            <div className="p-4 space-y-4">
              <WallDimensions calculator={calculator} />
              <LayoutTypeSelector calculator={calculator} />
              <FrameSize calculator={calculator} />
              <VerticalPosition calculator={calculator} />
              {state.anchorType === 'furniture' ? (
                <Furniture calculator={calculator} />
              ) : (
                <HorizontalPosition calculator={calculator} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="measurements" className="flex-1 overflow-y-auto mt-0">
            <div className="p-4">
              <Measurements calculator={calculator} />
            </div>
          </TabsContent>

          <TabsContent value="howto" className="flex-1 overflow-y-auto mt-0">
            <div className="p-4">
              <HowToHang calculator={calculator} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
