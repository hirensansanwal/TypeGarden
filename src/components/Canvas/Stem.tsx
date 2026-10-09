import React from 'react';
import type { RenderElement } from '../../types';

/**
 * Thin, even ink line for strands and twigs. `pathLength={1}` normalises the dash maths, so the
 * draw-on animation needs no measured length. Tendrils are filled, tapered outlines that fade in.
 */
export const Stem: React.FC<{ element: RenderElement }> = React.memo(({ element }) => {
  const { path, thickness = 1.5, delay, type } = element;

  if (type === 'tendril') {
    return (
      <path
        className="anim-fade"
        style={{ animationDelay: `${delay}ms` }}
        d={path}
        fill="var(--color-stem)"
      />
    );
  }

  return (
    <path
      className="anim-stem"
      pathLength={1}
      style={{ animationDelay: `${delay}ms`, strokeDasharray: 1, strokeDashoffset: 1 }}
      d={path}
      fill="none"
      stroke="var(--color-stem)"
      strokeWidth={thickness}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
});

Stem.displayName = 'Stem';
