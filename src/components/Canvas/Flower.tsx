import React from 'react';
import type { RenderElement } from '../../types';

export const Flower: React.FC<{ element: RenderElement }> = React.memo(({ element }) => {
  const { x, y, rotation, scale, delay, flowerType = 0, petals = 5 } = element;
  
  const petalElements = [];
  const angleStep = 360 / petals;
  
  if (flowerType === 0) {
    // Type A - Simple bloom (Curved rounded petals)
    for (let i = 0; i < petals; i++) {
      petalElements.push(<path key={i} d="M 0,0 C -12,-15 -18,-30 0,-32 C 18,-30 12,-15 0,0" fill="var(--color-flower)" opacity={1} transform={`rotate(${i * angleStep})`} />);
    }
    petalElements.push(<ellipse key="c" rx={4} ry={4} fill="var(--color-flower-center)" transform="rotate(15)" />);
  } 
  else if (flowerType === 1) {
    // Type B - Wildflower (Narrower, slightly irregular petals)
    const wildPetals = Math.max(7, petals + 2);
    const wildStep = 360 / wildPetals;
    for (let i = 0; i < wildPetals; i++) {
      const length = i % 2 === 0 ? -35 : -28;
      petalElements.push(<path key={i} d={`M 0,0 C -4,-10 -6,${length} 0,${length - 2} C 6,${length} 4,-10 0,0`} fill="var(--color-flower)" opacity={1} transform={`rotate(${i * wildStep})`} />);
    }
    // Dense textured center
    petalElements.push(<circle key="c1" r={6} fill="var(--color-flower-center)" opacity={0.9} />);
    petalElements.push(<circle key="c2" r={3} fill="var(--color-bg)" opacity={0.4} />);
  } 
  else if (flowerType === 2) {
    // Type C - Layered bloom (Outer and inner layer)
    for (let i = 0; i < petals; i++) {
      // Outer
      petalElements.push(<path key={`out-${i}`} d="M 0,0 C -18,-20 -22,-35 0,-40 C 22,-35 18,-20 0,0" fill="var(--color-flower)" opacity={0.7} transform={`rotate(${i * angleStep})`} />);
      // Inner (slightly offset rotation and smaller)
      petalElements.push(<path key={`in-${i}`} d="M 0,0 C -10,-12 -12,-22 0,-25 C 12,-22 10,-12 0,0" fill="var(--color-flower-center)" opacity={0.85} transform={`rotate(${i * angleStep + angleStep / 2})`} />);
    }
    petalElements.push(<circle key="c" r={4} fill="var(--color-bg)" opacity={0.6} />);
  } 
  else if (flowerType === 3) {
    // Type D - Bell flower (Downward facing bell shape, petals aren't radial around 360)
    // For bell flowers, we ignore 'petals' count for standard radial, and draw a side-profile bell.
    // The rotation from generation.ts will point it outward, so we draw it pointing "UP" (which translates to outward).
    petalElements.push(
      <path key="bell" d="M 0,5 C 20,-10 25,-25 15,-40 C 5,-35 -5,-35 -15,-40 C -25,-25 -20,-10 0,5" fill="var(--color-flower)" opacity={1} />
    );
    // Stamen protruding
    petalElements.push(
      <path key="stamen" d="M -2,0 L -4,-45 M 2,0 L 4,-42" stroke="var(--color-flower-center)" strokeWidth={1.5} fill="none" />
    );
    petalElements.push(<circle key="s1" cx={-4} cy={-45} r={2} fill="var(--color-flower-center)" />);
    petalElements.push(<circle key="s2" cx={4} cy={-42} r={2} fill="var(--color-flower-center)" />);
    
    // Tiny sepals at the base
    petalElements.push(<path key="sepal" d="M 0,5 C -8,8 -12,2 -12,2 C -5,2 -2,8 0,5 C 2,8 5,2 12,2 C 12,2 8,8 0,5" fill="var(--color-leaf)" />);
  } 
  else {
    // Type E - Star flower (Pointed, elongated)
    for (let i = 0; i < petals; i++) {
      petalElements.push(<path key={i} d="M 0,0 Q -8,-15 0,-35 Q 8,-15 0,0" fill="var(--color-flower)" opacity={1} transform={`rotate(${i * angleStep})`} />);
    }
    petalElements.push(<ellipse key="c" rx={5} ry={5} fill="var(--color-flower-center)" transform="rotate(45)" />);
  }

  // To allow CSS animations to rotate cleanly, we apply the structural transform on a wrapper,
  // and the animation on an inner <g>.
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <g className="anim-flower" style={{ animationDelay: `${delay}ms` }}>
        {petalElements}
      </g>
    </g>
  );
});

Flower.displayName = 'Flower';
