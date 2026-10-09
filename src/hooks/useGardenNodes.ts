import { useState, useEffect } from 'react';
import type { ArtNode } from '../types';

export interface RenderableNode extends ArtNode {
  withering?: boolean;
}

export function useGardenNodes(targetNodes: ArtNode[]) {
  const [displayNodes, setDisplayNodes] = useState<RenderableNode[]>(targetNodes);

  useEffect(() => {
    setDisplayNodes(prev => {
      // Enter clears instantly
      if (targetNodes.length === 0) return []; 
      
      const prevActiveCount = prev.filter(n => !n.withering).length;
      
      // Grew or stayed same
      if (targetNodes.length >= prevActiveCount) {
         const withering = prev.filter(n => n.withering);
         return [...targetNodes, ...withering];
      }

      // Shrank (Backspace or similar)
      const targetIds = new Set(targetNodes.map(n => n.id));
      const newlyWithering = prev
        .filter(n => !n.withering && !targetIds.has(n.id))
        .map(n => ({ ...n, withering: true }));
      
      return [...targetNodes, ...prev.filter(n => n.withering), ...newlyWithering];
    });
  }, [targetNodes]);

  // Clean up withering nodes after animation duration
  useEffect(() => {
    const witheringNodes = displayNodes.filter(n => n.withering);
    if (witheringNodes.length > 0) {
      const timer = setTimeout(() => {
        setDisplayNodes(prev => prev.filter(n => !n.withering));
      }, 300); // Withering duration
      return () => clearTimeout(timer);
    }
  }, [displayNodes]);

  return displayNodes;
}
