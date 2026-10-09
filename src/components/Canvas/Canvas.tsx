import React from 'react';
import type { ArtNode, Depth } from '../../types';
import { PlantNode } from './PlantNode';

interface CanvasProps {
  nodes: ArtNode[];
  /** 'back' renders beneath the text layer, 'front' above it. */
  depth: Depth;
}

/**
 * One botanical layer. App renders two of these around the opaque TextLayer so strands can
 * genuinely pass behind and in front of the letters. Within a layer: vines → leaves → flowers.
 */
export const Canvas: React.FC<CanvasProps> = React.memo(({ nodes, depth }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g style={{ transform: 'translate(50vw, 50vh)' }} className="garden">
          {nodes.map((node) => (
            <PlantNode key={`${node.id}-vines`} node={node} depth={depth} layer="vines" />
          ))}
          {nodes.map((node) => (
            <PlantNode key={`${node.id}-leaves`} node={node} depth={depth} layer="leaves" />
          ))}
          {nodes.map((node) => (
            <PlantNode key={`${node.id}-flowers`} node={node} depth={depth} layer="flowers" />
          ))}
        </g>
      </svg>
    </div>
  );
});

Canvas.displayName = 'Canvas';
