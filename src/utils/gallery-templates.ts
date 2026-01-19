import type { GalleryTemplate } from '@/types';

// Templates use relative coordinates (0-1) that get scaled to fit the wall
// The aspectRatio helps maintain proportions when scaling

export const BUILT_IN_TEMPLATES: GalleryTemplate[] = [
  {
    id: 'triptych',
    name: 'Triptych',
    description: '3 frames in a row, center larger',
    aspectRatio: 2.5,
    slots: [
      { id: 's1', x: 0, y: 0.15, width: 0.25, height: 0.7 },
      { id: 's2', x: 0.3, y: 0, width: 0.4, height: 1 },
      { id: 's3', x: 0.75, y: 0.15, width: 0.25, height: 0.7 },
    ],
  },
  {
    id: 'staircase',
    name: 'Staircase',
    description: 'Diagonal ascending arrangement',
    aspectRatio: 2,
    slots: [
      { id: 's1', x: 0, y: 0.7, width: 0.22, height: 0.3 },
      { id: 's2', x: 0.26, y: 0.5, width: 0.22, height: 0.3 },
      { id: 's3', x: 0.52, y: 0.3, width: 0.22, height: 0.3 },
      { id: 's4', x: 0.78, y: 0.1, width: 0.22, height: 0.3 },
    ],
  },
  {
    id: 'salon-4',
    name: 'Salon (4)',
    description: 'Asymmetric cluster of 4 frames',
    aspectRatio: 1.4,
    slots: [
      { id: 's1', x: 0, y: 0, width: 0.45, height: 0.55 },
      { id: 's2', x: 0.5, y: 0, width: 0.5, height: 0.4 },
      { id: 's3', x: 0, y: 0.6, width: 0.35, height: 0.4 },
      { id: 's4', x: 0.4, y: 0.45, width: 0.6, height: 0.55 },
    ],
  },
  {
    id: 'salon-6',
    name: 'Salon (6)',
    description: 'Asymmetric cluster of 6 frames',
    aspectRatio: 1.6,
    slots: [
      { id: 's1', x: 0, y: 0, width: 0.3, height: 0.45 },
      { id: 's2', x: 0.35, y: 0, width: 0.35, height: 0.35 },
      { id: 's3', x: 0.75, y: 0, width: 0.25, height: 0.5 },
      { id: 's4', x: 0, y: 0.5, width: 0.25, height: 0.5 },
      { id: 's5', x: 0.3, y: 0.4, width: 0.4, height: 0.6 },
      { id: 's6', x: 0.75, y: 0.55, width: 0.25, height: 0.45 },
    ],
  },
  {
    id: 'feature-wall',
    name: 'Feature Wall',
    description: 'Large center with small sides',
    aspectRatio: 1.8,
    slots: [
      { id: 's1', x: 0, y: 0.1, width: 0.18, height: 0.35 },
      { id: 's2', x: 0, y: 0.55, width: 0.18, height: 0.35 },
      { id: 's3', x: 0.22, y: 0, width: 0.56, height: 1 },
      { id: 's4', x: 0.82, y: 0.1, width: 0.18, height: 0.35 },
      { id: 's5', x: 0.82, y: 0.55, width: 0.18, height: 0.35 },
    ],
  },
];

export function getTemplateById(id: string): GalleryTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
