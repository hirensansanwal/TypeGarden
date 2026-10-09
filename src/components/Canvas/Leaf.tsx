import React from 'react';
import type { RenderElement } from '../../types';

export const Leaf: React.FC<{ element: RenderElement }> = React.memo(({ element }) => {
  const { x, y, rotation, scale, delay, leafStyle = 0 } = element;
  
  let leafPath = '';
  let veinPath = '';
  
  if (leafStyle === 0) {
    // Style A: Narrow, elongated leaf (Willow-like)
    leafPath = "M 0,0 C 15,-10 35,-5 45,0 C 35,5 15,10 0,0";
    veinPath = "M 0,0 Q 20,-2 40,0";
  } else if (leafStyle === 1) {
    // Style B: Rounded, wide leaf (Ivy/Lily-like)
    leafPath = "M 0,0 C 15,-20 35,-15 40,0 C 35,15 15,20 0,0";
    veinPath = "M 0,0 Q 20,0 35,0 M 15,0 Q 25,-8 30,-10 M 15,0 Q 25,8 30,10";
  } else {
    // Style C: Pointed, teardrop asymmetric leaf (Rose-like)
    leafPath = "M 0,0 C 10,-15 25,-12 35,0 C 20,12 10,8 0,0";
    veinPath = "M 0,0 Q 15,-2 30,0";
  }

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className="anim-leaf" style={{ animationDelay: `${delay}ms` }}>
        <path d={leafPath} fill="var(--color-stem)" />
        {/* Subtle inner vein for organic detail */}
        <path d={veinPath} stroke="var(--color-bg)" strokeWidth={1} fill="none" opacity={0.25} />
      </g>
    </g>
  );
});

Leaf.displayName = 'Leaf';
