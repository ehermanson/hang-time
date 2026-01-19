import { ChevronDown, Grid3X3, LayoutTemplate } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { UseCalculatorReturn } from '@/hooks/use-calculator';
import { cn } from '@/lib/utils';
import type { GalleryTemplate } from '@/types';
import { BUILT_IN_TEMPLATES } from '@/utils/gallery-templates';

interface TemplatePreviewProps {
  template: GalleryTemplate;
  isSelected: boolean;
  onClick: () => void;
}

function TemplatePreview({ template, isSelected, onClick }: TemplatePreviewProps) {
  // Calculate bounds for proper scaling
  const minX = Math.min(...template.slots.map((s) => s.x));
  const maxX = Math.max(...template.slots.map((s) => s.x + s.width));
  const minY = Math.min(...template.slots.map((s) => s.y));
  const maxY = Math.max(...template.slots.map((s) => s.y + s.height));
  const templateWidth = maxX - minX;
  const templateHeight = maxY - minY;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-2 rounded-lg border transition-all',
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20',
      )}
    >
      {/* Template preview */}
      <div className="w-full aspect-[4/3] relative mb-1.5 rounded bg-gray-100 dark:bg-white/10 overflow-hidden">
        <svg
          viewBox={`0 0 100 ${100 / (template.aspectRatio || 1.5)}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {template.slots.map((slot) => (
            <rect
              key={slot.id}
              x={((slot.x - minX) / templateWidth) * 100}
              y={((slot.y - minY) / templateHeight) * (100 / (template.aspectRatio || 1.5))}
              width={(slot.width / templateWidth) * 100}
              height={(slot.height / templateHeight) * (100 / (template.aspectRatio || 1.5))}
              rx="2"
              className={cn(
                isSelected
                  ? 'fill-purple-300 dark:fill-purple-400/50'
                  : 'fill-pink-200 dark:fill-pink-400/40',
              )}
              stroke={isSelected ? '#a855f7' : '#f472b6'}
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      <span
        className={cn(
          'text-xs font-medium',
          isSelected
            ? 'text-purple-600 dark:text-purple-300'
            : 'text-gray-600 dark:text-white/60',
        )}
      >
        {template.name}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-white/40">
        {template.slots.length} frames
      </span>
    </button>
  );
}

// "None" option preview - simple grid icon
function NonePreview({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-2 rounded-lg border transition-all',
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20',
      )}
    >
      <div className="w-full aspect-[4/3] relative mb-1.5 rounded bg-gray-100 dark:bg-white/10 overflow-hidden flex items-center justify-center">
        <Grid3X3
          className={cn(
            'h-8 w-8',
            isSelected
              ? 'text-purple-400 dark:text-purple-400'
              : 'text-gray-300 dark:text-white/30',
          )}
        />
      </div>
      <span
        className={cn(
          'text-xs font-medium',
          isSelected
            ? 'text-purple-600 dark:text-purple-300'
            : 'text-gray-600 dark:text-white/60',
        )}
      >
        None
      </span>
      <span className="text-[10px] text-gray-400 dark:text-white/40">
        Freeform
      </span>
    </button>
  );
}

interface Props {
  calculator: UseCalculatorReturn;
}

export function GalleryTemplatePicker({ calculator }: Props) {
  const { state, applyTemplate } = calculator;

  const isNoneSelected = state.layoutMode === 'freeform' || !state.templateId;

  return (
    <Collapsible className="pb-4 border-b border-gray-200 dark:border-white/10">
      <CollapsibleTrigger className="w-full group">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-white/90 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <LayoutTemplate className="h-3.5 w-3.5" />
          </span>
          Template
          <ChevronDown className="h-4 w-4 ml-auto text-gray-400 transition-transform group-data-[state=closed]:-rotate-90" />
        </h3>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {/* None option first */}
            <NonePreview
              isSelected={isNoneSelected}
              onClick={() => applyTemplate(null)}
            />
            {/* Built-in templates */}
            {BUILT_IN_TEMPLATES.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                isSelected={state.templateId === template.id}
                onClick={() => applyTemplate(template.id)}
              />
            ))}
          </div>
          {state.templateId && (
            <p className="text-xs text-gray-500 dark:text-white/50">
              Frames sized for template. Adjust sizes as needed.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
