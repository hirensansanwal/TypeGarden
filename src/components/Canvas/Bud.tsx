import React from 'react';
import type { RenderElement } from '../../types';

export const Bud: React.FC<{ element: RenderElement }> = React.memo(({ element }) => {
  const { x, y, rotation, scale, delay } = element;
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className="anim-flower" style={{ animationDelay: `${delay}ms` }}>
        <path d="M 0,0 C -5,-5 -6,-12 0,-15 C 6,-12 5,-5 0,0" fill="var(--color-stem)" opacity={0.8} />
        <path d="M 0,-2 C -3,-6 -4,-10 0,-12 C 4,-10 3,-6 0,-2" fill="var(--color-flower)" opacity={0.9} />
      </g>
    </g>
  );
});

Bud.displayName = 'Bud';
