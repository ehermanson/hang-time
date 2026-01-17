# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build locally
npm run deploy       # Deploy to Cloudflare Workers
npm run dev:worker   # Local Cloudflare worker development
```

## Architecture Overview

This is a React/TypeScript picture hanging calculator that helps users calculate precise measurements for hanging pictures and creating gallery walls. It's deployed as a Cloudflare Workers application.

### Tech Stack
- React 18 with TypeScript
- Vite for bundling
- Tailwind CSS with Radix UI primitives
- Cloudflare Workers for deployment

### State Management Pattern

All application state lives in the `useCalculator()` hook (`src/hooks/useCalculator.ts`). This hook:
- Manages the `CalculatorState` (wall dimensions, frame configs, layout settings)
- Returns a `Calculator` object with state and setter functions
- Uses `useMemo` to compute layout positions when state changes

Components receive the calculator object via props and call setters to update state. No external state management library is used.

### Layout Modes

Three layout types with different calculation logic (`src/utils/calculations.ts`):
- **Grid**: Frames arranged in rows/columns with configurable spacing
- **Row**: Single row of frames
- **Salon**: Free-form placement with drag-and-drop positioning

### Key Types (`src/types/index.ts`)

- `CalculatorState` - Main app state
- `FramePosition` - Calculated position/measurements for each frame
- `SalonFrame` - Individual frame in salon mode with x/y/width/height
- `Unit` - 'in' | 'cm'
- `LayoutType` - 'grid' | 'row' | 'salon'

### Component Organization

- `src/components/Sidebar/` - Input controls for all configuration
- `src/components/Preview/` - Canvas-based visual wall preview with rulers and measurement overlays
- `src/components/Measurements/` - Detailed measurement display for each frame
- `src/components/ui/` - Radix UI component wrappers

### Cloudflare Workers Setup

- `src/worker.ts` - Worker entry point
- Static assets served automatically via wrangler assets binding
- `wrangler.toml` configures worker name and asset directory
