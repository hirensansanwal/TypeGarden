import React from 'react';
import type { RenderElement } from '../../types';

export const Berry: React.FC<{ element: RenderElement }> = React.memo(({ element }) => {
  const { x, y, rotation, scale, delay, berryCount = 3, berryRadius = 3.5 } = element;
  
  // Deterministic cluster geometry relative to base point (0,0)
  const offsets = [
    { x: 0, y: -berryRadius * 2.4, r: berryRadius },
    { x: -berryRadius * 1.5, y: -berryRadius * 1.3, r: berryRadius * 0.9 },
    { x: berryRadius * 1.5, y: -berryRadius * 1.3, r: berryRadius * 0.9 },
    { x: 0, y: -berryRadius * 0.2, r: berryRadius * 0.8 },
  ].slice(0, berryCount);

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className="anim-berry" style={{ animationDelay: `${delay}ms` }}>
        {/* Branchlet connecting paths */}
        {offsets.map((pt, i) => (
          <path
            key={`stem-${i}`}
            d={`M 0,0 Q ${pt.x * 0.4},${pt.y * 0.5} ${pt.x},${pt.y}`}
            fill="none"
            stroke="var(--color-stem)"
            strokeWidth={1}
            strokeLinecap="round"
          />
        ))}
        {/* Berry spheres & delicate specular highlights */}
        {offsets.map((pt, i) => (
          <g key={`berry-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle cx={0} cy={0} r={pt.r} fill="var(--color-flower)" />
            {/* Small highlight dot */}
            <circle cx={-pt.r * 0.3} cy={-pt.r * 0.3} r={pt.r * 0.28} fill="var(--color-flower-center)" opacity={0.85} />
          </g>
        ))}
      </g>
    </g>
  );
});

Berry.displayName = 'Berry';
