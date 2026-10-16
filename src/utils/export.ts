import type { ArtNode } from '../types';
import type { Theme } from './themes';

/**
 * Builds a standalone, clean SVG string containing the entire garden artwork,
 * theme colors, typography, and layered depth.
 */
export function buildStandaloneSVG(
  nodes: ArtNode[],
  theme: Theme,
  text: string,
  width: number = 1920,
  height: number = 1080,
  haloMode: boolean = false
): string {
  const centerX = width / 2;
  const centerY = height / 2;

  // Render elements for a specific depth and layer
  const renderElements = (depth: 'back' | 'front') => {
    return nodes.map(node => {
      const visible = node.elements.filter(el => (el.layer ?? 'front') === depth);
      if (visible.length === 0) return '';

      const inner = visible.map(el => {
        if (el.type === 'leaf') {
          let leafPath = "M 0,0 C 15,-10 35,-5 45,0 C 35,5 15,10 0,0";
          if (el.leafStyle === 1) leafPath = "M 0,0 C 15,-20 35,-15 40,0 C 35,15 15,20 0,0";
          else if (el.leafStyle === 2) leafPath = "M 0,0 C 10,-15 25,-12 35,0 C 20,12 10,8 0,0";

          return `
            <g transform="translate(${el.x}, ${el.y}) rotate(${el.rotation}) scale(${el.scale})">
              <path d="${leafPath}" fill="${theme.stem}" />
            </g>`;
        }

        if (el.type === 'flower') {
          const petals = el.petals || 5;
          const step = 360 / petals;
          let petalPaths = '';
          for (let p = 0; p < petals; p++) {
            petalPaths += `<path d="M 0,0 C -12,-15 -18,-30 0,-32 C 18,-30 12,-15 0,0" fill="${theme.flower}" transform="rotate(${p * step})" />`;
          }
          petalPaths += `<ellipse rx="4" ry="4" fill="${theme.flowerCenter}" />`;

          return `
            <g transform="translate(${el.x}, ${el.y}) rotate(${el.rotation}) scale(${el.scale})">
              ${petalPaths}
            </g>`;
        }

        if (el.type === 'tendril') {
          return `<path d="${el.path}" fill="${theme.stem}" />`;
        }

        if (el.type === 'berry') {
          const count = el.berryCount || 3;
          const r = el.berryRadius || 3.5;
          const offsets = [
            { x: 0, y: -r * 2.4, br: r },
            { x: -r * 1.5, y: -r * 1.3, br: r * 0.9 },
            { x: r * 1.5, y: -r * 1.3, br: r * 0.9 },
            { x: 0, y: -r * 0.2, br: r * 0.8 },
          ].slice(0, count);

          const stems = offsets.map(pt =>
            `<path d="M 0,0 Q ${pt.x * 0.4},${pt.y * 0.5} ${pt.x},${pt.y}" fill="none" stroke="${theme.stem}" stroke-width="1" stroke-linecap="round" />`
          ).join('');

          const berries = offsets.map(pt =>
            `<g transform="translate(${pt.x}, ${pt.y})">
              <circle cx="0" cy="0" r="${pt.br}" fill="${theme.flower}" />
              <circle cx="${-pt.br * 0.3}" cy="${-pt.br * 0.3}" r="${pt.br * 0.28}" fill="${theme.flowerCenter}" opacity="0.85" />
            </g>`
          ).join('');

          return `
            <g transform="translate(${el.x}, ${el.y}) rotate(${el.rotation}) scale(${el.scale})">
              ${stems}
              ${berries}
            </g>`;
        }

        // Stem / branch / vine
        return `
          <path d="${el.path}" fill="none" stroke="${theme.stem}" stroke-width="${el.thickness || 1.5}" stroke-linecap="round" stroke-linejoin="round" />`;
      }).join('');

      return `<g transform="translate(${node.x}, ${node.y})">${inner}</g>`;
    }).join('');
  };

  const backArt = renderElements('back');
  const frontArt = renderElements('front');

  const lines = text.split('\n');
  const nodeFontSize = nodes.length > 0 && nodes[0].fontSize ? nodes[0].fontSize : undefined;
  const maxLineLen = Math.max(6, ...lines.map(l => l.length));
  const fallbackFs = Math.min(120, Math.max(48, Math.round(900 / maxLineLen)));
  const fontSize = nodeFontSize ?? fallbackFs;
  const lineHeight = fontSize * 1.45;
  const totalTextHeight = (lines.length - 1) * lineHeight;
  const startY = centerY - totalTextHeight / 2;
  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const textSvg = lines.length === 1
    ? `<text class="trellis-text" x="${centerX}" y="${centerY}">${escapeXml(text)}</text>`
    : `<text class="trellis-text" x="${centerX}" y="${startY}">
        ${lines.map((l, idx) => `<tspan x="${centerX}" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(l) || '&#160;'}</tspan>`).join('')}
      </text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700&amp;display=swap');
    .bg { fill: ${theme.background}; }
    .trellis-text {
      font-family: 'Playfair Display', 'Didot', 'Bodoni MT', 'Cinzel', Georgia, 'Times New Roman', serif;
      font-size: ${fontSize}px;
      fill: ${theme.text};
      text-anchor: middle;
      dominant-baseline: central;
      font-weight: 400;
      ${haloMode ? `stroke: ${theme.background}; stroke-width: 5px; paint-order: stroke fill; stroke-linejoin: round;` : ''}
    }
  </style>
  <rect class="bg" width="100%" height="100%" />
  
  <!-- Back botanical layer -->
  <g transform="translate(${centerX}, ${centerY})">
    ${backArt}
  </g>

  <!-- Opaque typography trellis -->
  ${textSvg}

  <!-- Front botanical layer -->
  <g transform="translate(${centerX}, ${centerY})">
    ${frontArt}
  </g>
</svg>`;
}

/**
 * Downloads a clean standalone SVG file.
 */
export function downloadSVG(nodes: ArtNode[], theme: Theme, text: string, haloMode: boolean = false) {
  const svgString = buildStandaloneSVG(nodes, theme, text, 1920, 1080, haloMode);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `type-garden-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders the SVG onto a high-DPI canvas and triggers a PNG download.
 */
export function downloadPNG(nodes: ArtNode[], theme: Theme, text: string, haloMode: boolean = false) {
  const width = 2560;
  const height = 1440;
  const svgString = buildStandaloneSVG(nodes, theme, text, width, height, haloMode);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `type-garden-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
  };
  img.src = url;
}
