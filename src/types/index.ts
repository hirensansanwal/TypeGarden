export type ElementType = 'vine' | 'stem' | 'branch' | 'leaf' | 'flower' | 'bud' | 'tendril' | 'berry';

/** Which side of the opaque text an element is drawn on. */
export type Depth = 'back' | 'front';

export interface RenderElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number; 

  /** Drawn behind or in front of the text layer. Defaults to 'front'. */
  layer?: Depth;
  
  // Stem specifics
  path?: string;
  length?: number;
  thickness?: number;
  
  // Leaf specifics
  leafStyle?: number;
  
  // Flower specifics
  flowerType?: number;
  petals?: number;
  colorVar?: string;

  // Berry specifics
  berryCount?: number;
  berryRadius?: number;

  // Visual polish
  opacity?: number;
  filter?: string;
}

export interface ArtNode {
  id: string;
  char: string;
  index: number;
  x: number;
  y: number;
  seed: number;
  elements: RenderElement[];
  withering?: boolean;
  fontSize?: number;
}

export interface CharacterMeasurement {
  char: string;
  index: number;
  x: number; // Center X of the character
  y: number; // Center Y of the character's line box
  width: number;
  /** Computed font size in px, used to scale the garden with the type. */
  fontSize?: number;
}
