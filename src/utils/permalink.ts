export const DEFAULT_THEME_ID = 'midnight';
export const ZEN_FADE_TIMEOUT_MS = 2500;
export const BLOOM_STAGGER_MS = 80;
export const TEXT_HALO_STROKE_PX = 2.5;

export interface ParsedGardenState {
  text: string;
  themeId: string;
}

/**
 * Serializes garden text and theme into a URL hash fragment.
 * Format: #text=<encoded_text>&theme=<theme_id>
 */
export function serializeGardenHash(text: string, themeId: string): string {
  const params = new URLSearchParams();
  params.set('text', text ?? '');
  params.set('theme', themeId || DEFAULT_THEME_ID);
  return `#${params.toString()}`;
}

/**
 * Parses a URL hash fragment into garden text and theme ID.
 * Order-independent, resilient to malformed percent-encoding, and falls back gracefully.
 */
export function parseGardenHash(hash: string, validThemeIds?: string[]): ParsedGardenState {
  if (!hash) {
    return { text: '', themeId: DEFAULT_THEME_ID };
  }

  // Strip leading '#' if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleanHash) {
    return { text: '', themeId: DEFAULT_THEME_ID };
  }

  try {
    const params = new URLSearchParams(cleanHash);
    const rawText = params.get('text');
    const text = rawText !== null ? rawText : '';

    let themeId = params.get('theme') || DEFAULT_THEME_ID;
    if (validThemeIds && validThemeIds.length > 0 && !validThemeIds.includes(themeId)) {
      themeId = DEFAULT_THEME_ID;
    }

    return { text, themeId };
  } catch {
    return { text: '', themeId: DEFAULT_THEME_ID };
  }
}

/**
 * Generates an absolute permalink URL for the current garden.
 */
export function getPermalinkUrl(baseUrl: string, text: string, themeId: string): string {
  const cleanBase = baseUrl.split('#')[0];
  const hash = serializeGardenHash(text, themeId);
  return `${cleanBase}${hash}`;
}
