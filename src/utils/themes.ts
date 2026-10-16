export interface Theme {
  id: string;
  name: string;
  background: string;
  /** Opaque, muted text colour: the letters must hide strands drawn behind them. */
  text: string;
  /** Stems, twigs, tendrils and leaves share this colour. */
  stem: string;
  /** Kept for theme compatibility; leaves render in `stem`. */
  leaf: string;
  /** The accent: flowers only. */
  flower: string;
  flowerCenter: string;
}

export const themes: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight Garden',
    background: '#0a0a0a',
    text: '#bab5ae',
    stem: '#5d66d9',
    leaf: '#5d66d9',
    flower: '#c4502b',
    flowerCenter: '#e8a072',
  },
  {
    id: 'autumn',
    name: 'Autumn Garden',
    background: '#1a1512',
    text: '#c3b4a1',
    stem: '#857a4c',
    leaf: '#857a4c',
    flower: '#c0582e',
    flowerCenter: '#e8a066',
  },
  {
    id: 'moon',
    name: 'Moon Garden',
    background: '#12141a',
    text: '#b2bac8',
    stem: '#5f7fa3',
    leaf: '#5f7fa3',
    flower: '#b3a0d6',
    flowerCenter: '#ebe5f5',
  },
  {
    id: 'forest',
    name: 'Forest Garden',
    background: '#0d140e',
    text: '#afbdaa',
    stem: '#4a8155',
    leaf: '#4a8155',
    flower: '#d1a04c',
    flowerCenter: '#f0d79a',
  },
  {
    id: 'sakura',
    name: 'Sakura Garden',
    background: '#0e0b12',
    text: '#cdc2ce',
    stem: '#8a6d9e',
    leaf: '#8a6d9e',
    flower: '#e26b91',
    flowerCenter: '#ffdae6',
  },
  {
    id: 'emerald',
    name: 'Emerald Moss',
    background: '#07120c',
    text: '#b2c7bc',
    stem: '#307551',
    leaf: '#307551',
    flower: '#e5a524',
    flowerCenter: '#ffebbd',
  },
  {
    id: 'dune',
    name: 'Desert Dune',
    background: '#16110e',
    text: '#cdb9ab',
    stem: '#7d5744',
    leaf: '#7d5744',
    flower: '#da593b',
    flowerCenter: '#f4c3a2',
  },
  {
    id: 'twilight',
    name: 'Twilight Violet',
    background: '#0c0a17',
    text: '#b9b3d1',
    stem: '#4f4782',
    leaf: '#4f4782',
    flower: '#9b74e6',
    flowerCenter: '#e2d9ff',
  }
];
