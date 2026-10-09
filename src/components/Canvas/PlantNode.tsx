import React from 'react';
import type { ArtNode, Depth } from '../../types';
import { Stem } from './Stem';
import { Leaf } from './Leaf';
import { Flower } from './Flower';
import { Bud } from './Bud';
import { Berry } from './Berry';

interface PlantNodeProps {
  node: ArtNode;
  depth: Depth;
  layer: 'vines' | 'leaves' | 'flowers';
}

export const PlantNode: React.FC<PlantNodeProps> = React.memo(({ node, depth, layer }) => {
  const { x, y, elements, withering } = node;

  const visible = elements.filter((el) => {
    if ((el.layer ?? 'front') !== depth) return false;
    if (layer === 'vines') return el.type === 'vine' || el.type === 'stem' || el.type === 'branch' || el.type === 'tendril';
    if (layer === 'leaves') return el.type === 'leaf';
    return el.type === 'flower' || el.type === 'bud' || el.type === 'berry';
  });
  if (visible.length === 0) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className={`plant-breeze ${withering ? 'anim-wither' : ''}`}>
        {visible.map((el) => {
          if (el.type === 'leaf') return <Leaf key={el.id} element={el} />;
          if (el.type === 'flower') return <Flower key={el.id} element={el} />;
          if (el.type === 'bud') return <Bud key={el.id} element={el} />;
          if (el.type === 'berry') return <Berry key={el.id} element={el} />;
          return <Stem key={el.id} element={el} />;
        })}
      </g>
    </g>
  );
});

PlantNode.displayName = 'PlantNode';
