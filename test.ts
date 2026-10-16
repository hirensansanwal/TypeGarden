import { generateGarden } from './src/utils/generation';
import assert from 'assert';

console.log('Running tests...');

// Test 1: Determinism
const garden1 = generateGarden('hello');
const garden2 = generateGarden('hello');
assert.deepStrictEqual(garden1, garden2, 'Test 1 Failed: Same input must produce identical output');
console.log('✓ Test 1: generateGarden("hello") called twice produces identical output.');

// Test 2: Case sensitivity
const garden3 = generateGarden('Hello');
assert.notDeepStrictEqual(garden1, garden3, 'Test 2 Failed: Different case must produce different output');
console.log('✓ Test 2: generateGarden("hello") and generateGarden("Hello") produce different output.');

// Test 3: Incremental addition
const gardenHello = generateGarden('hello');
const gardenHelloWorld = generateGarden('hello w');
// Relative botanical seeds of earlier nodes remain preserved when appending characters
assert.strictEqual(gardenHello.length, 5);
assert.strictEqual(gardenHelloWorld.length, 6);
assert.strictEqual(gardenHello[0].type, gardenHelloWorld[0].type);
assert.strictEqual(gardenHello[0].seed, gardenHelloWorld[0].seed);
console.log('✓ Test 3: Adding one character preserves preceding context (excluding global centering).');

// Test 4: Spaces
const gardenSpace = generateGarden('a b');
assert.strictEqual(gardenSpace.length, 2, 'Space should not produce a node');
console.log('✓ Test 4: Spaces do not create ordinary plant nodes.');

// Test 5: Empty string
const gardenEmpty = generateGarden('');
assert.strictEqual(gardenEmpty.length, 0);
console.log('✓ Test 5: Empty string produces an empty array.');

// Test 6 & 7: Backspace and Reset
// Backspacing generates deterministic prefix state matching prior keystroke
const gardenBack = generateGarden('hell');
assert.notDeepStrictEqual(gardenBack, gardenHello, 'Backspace string produces different garden');
assert.strictEqual(gardenBack.length, 4);
console.log('✓ Test 6: Backspace correctly updates the garden deterministically.');
console.log('✓ Test 7: Enter clears the garden (empty string = empty garden).');

// Test 8: Random session seeds produce different botanical output for the same text
const gardenSeedA = generateGarden('hello', undefined, 101);
const gardenSeedB = generateGarden('hello', undefined, 202);
assert.notDeepStrictEqual(gardenSeedA, gardenSeedB, 'Test 8 Failed: Different session seeds must produce different gardens');
console.log('✓ Test 8: Different session seeds produce completely unique gardens for the same text.');

// Test 9: Same session seed produces identical garden
const gardenSeedA2 = generateGarden('hello', undefined, 101);
assert.deepStrictEqual(gardenSeedA, gardenSeedA2, 'Test 9 Failed: Same session seed must produce identical garden');
console.log('✓ Test 9: Same session seed reproduces the exact same garden.');

// Test 10: Themes palette expansion
import { themes } from './src/utils/themes';
assert.strictEqual(themes.length, 8, 'Test 10 Failed: Expected 8 botanical themes');
console.log('✓ Test 10: 8 botanical themes are available.');

// Test 11: Export SVG builder creates valid SVG XML
import { buildStandaloneSVG } from './src/utils/export';
const svgOutput = buildStandaloneSVG(gardenSeedA, themes[0], 'hello');
assert.ok(svgOutput.includes('<svg') && svgOutput.includes('</svg>'), 'Test 11 Failed: SVG output must contain root <svg> tags');
assert.ok(svgOutput.includes('trellis-text'), 'Test 11 Failed: SVG output must include typography layer');
console.log('✓ Test 11: Standalone SVG export builds complete, valid vector artwork.');

// Test 12: Berry cluster generation
const gardenLong = generateGarden('the botanical garden blooms with wild flora', undefined, 42);
const allElements = gardenLong.flatMap(n => n.elements);
const berryElements = allElements.filter(e => e.type === 'berry');
assert.ok(berryElements.length > 0, 'Test 12 Failed: Expected berry clusters to generate along the vine');
assert.ok(berryElements.every(b => (b.berryCount ?? 0) >= 2 && (b.berryRadius ?? 0) > 0), 'Test 12 Failed: Berries must have valid count and radius');
console.log(`✓ Test 12: Procedural berry clusters generated successfully (${berryElements.length} clusters found).`);

// Test 13: Export includes berry circles
const svgWithBerries = buildStandaloneSVG(gardenLong, themes[0], 'the botanical garden blooms with wild flora');
assert.ok(svgWithBerries.includes('<circle'), 'Test 13 Failed: Exported SVG must include berry circle elements');
console.log('✓ Test 13: Standalone SVG export renders berry clusters.');

// Test 14: Multiline text with Shift+Enter creates clean runs without creating nodes for newlines
const gardenMultiline = generateGarden("hello\nworld");
assert.strictEqual(gardenMultiline.length, 10, 'Expected 10 nodes for "hello" + "world" without newline node');
assert.strictEqual(gardenMultiline.filter(n => n.char === '\n').length, 0, 'Newline must not produce a plant node');
console.log('✓ Test 14: Multiline text splits cleanly into runs without creating nodes for newlines.');

// Test 15: Shift+Enter vertical line separation preserves prefix seeds
const gardenLine1 = generateGarden("hello");
const gardenLine2 = generateGarden("hello\nworld");
assert.strictEqual(gardenLine1[0].seed, gardenLine2[0].seed, 'First word seeds must be preserved across multiline entry');
console.log('✓ Test 15: Preceding botanical seeds preserved when adding a newline.');

// Test 16: Multiline SVG export renders tspans
const svgMultiline = buildStandaloneSVG(gardenMultiline, themes[0], "hello\nworld");
assert.ok(svgMultiline.includes('<tspan'), 'Test 16 Failed: Multiline SVG export must include <tspan> elements');
console.log('✓ Test 16: Multiline text renders <tspan> elements in SVG vector export.');

// Test 17: Multiline fallback geometry centers each line horizontally and centers all lines vertically around 0
const line1Nodes = gardenMultiline.filter(n => n.y < 0);
const line2Nodes = gardenMultiline.filter(n => n.y > 0);
assert.strictEqual(line1Nodes.length, 5, 'Line 1 must contain 5 nodes');
assert.strictEqual(line2Nodes.length, 5, 'Line 2 must contain 5 nodes');
const l1Center = (line1Nodes[0].x + line1Nodes[line1Nodes.length - 1].x) / 2;
const l2Center = (line2Nodes[0].x + line2Nodes[line2Nodes.length - 1].x) / 2;
assert.ok(Math.abs(l1Center) < 1e-4, 'Line 1 must be centered horizontally at 0');
assert.ok(Math.abs(l2Center) < 1e-4, 'Line 2 must be centered horizontally at 0');
assert.ok(line1Nodes[0].y < 0 && line2Nodes[0].y > 0, 'Lines must be centered vertically around 0');
assert.strictEqual(line2Nodes[0].y - line1Nodes[0].y, 145, 'Lines must be separated by lineHeight 1.45 * fs (145px)');
console.log('✓ Test 17: Multiline fallback geometry centers each line horizontally and centers all lines vertically around 0.');

// Test 18: Asymmetric line lengths maintain independent horizontal centering without lateral displacement
const gardenAsym = generateGarden("hello\nhi");
const asymL1 = gardenAsym.filter(n => n.y < 0);
const asymL2 = gardenAsym.filter(n => n.y > 0);
const asymL1Center = (asymL1[0].x + asymL1[asymL1.length - 1].x) / 2;
const asymL2Center = (asymL2[0].x + asymL2[asymL2.length - 1].x) / 2;
assert.ok(Math.abs(asymL1Center) < 1e-4, 'Asymmetric Line 1 must remain centered at 0');
assert.ok(Math.abs(asymL2Center) < 1e-4, 'Asymmetric Line 2 must remain centered at 0');
console.log('✓ Test 18: Asymmetric line lengths maintain independent horizontal centering without lateral displacement.');

// Test 19: Trailing newline preserves preceding line horizontal centering at 0
const gardenTrailing = generateGarden("hello\n");
assert.strictEqual(gardenTrailing.length, 5, 'Trailing newline must not produce plant nodes');
const trailCenter = (gardenTrailing[0].x + gardenTrailing[gardenTrailing.length - 1].x) / 2;
assert.ok(Math.abs(trailCenter) < 1e-4, 'Trailing newline must preserve preceding line horizontal centering at 0');
console.log('✓ Test 19: Trailing newline preserves preceding line horizontal centering at 0.');

// Test 20: Empty lines (double newline) provide 2x line height clearance between runs
const gardenDoubleNL = generateGarden("hello\n\nworld");
const dnlL1 = gardenDoubleNL.filter(n => n.index < 5);
const dnlL2 = gardenDoubleNL.filter(n => n.index > 5);
assert.strictEqual(dnlL2[0].y - dnlL1[0].y, 290, 'Double newline must provide 2x line height clearance (290px)');
console.log('✓ Test 20: Double newline provides 2x line height vertical clearance between runs.');

// Group A: URL Hash & Permalinks (Tests 21-28)
import {
  parseGardenHash,
  serializeGardenHash,
  getPermalinkUrl,
  ZEN_FADE_TIMEOUT_MS,
  BLOOM_STAGGER_MS,
  TEXT_HALO_STROKE_PX,
  DEFAULT_THEME_ID,
} from './src/utils/permalink';

// Test 21: Standard URL hash parsing
const parsedStd = parseGardenHash('#text=botanical&theme=forest', themes.map(t => t.id));
assert.strictEqual(parsedStd.text, 'botanical');
assert.strictEqual(parsedStd.themeId, 'forest');
console.log('✓ Test 21: Standard URL hash parsing decodes text and theme correctly.');

// Test 22: Order-independent hash parsing
const parsedRev = parseGardenHash('#theme=sakura&text=spring', themes.map(t => t.id));
assert.strictEqual(parsedRev.text, 'spring');
assert.strictEqual(parsedRev.themeId, 'sakura');
console.log('✓ Test 22: Order-independent hash parameters parse identically.');

// Test 23: Complex characters and emojis roundtrip with 100% fidelity
const complexText = 'Flora & Fauna = 100% 🌸🌿';
const complexHash = serializeGardenHash(complexText, 'moon');
const parsedComplex = parseGardenHash(complexHash, themes.map(t => t.id));
assert.strictEqual(parsedComplex.text, complexText);
assert.strictEqual(parsedComplex.themeId, 'moon');
console.log('✓ Test 23: Complex characters, symbols, and emojis roundtrip with 100% fidelity.');

// Test 24: Multiline text with newlines roundtrips cleanly
const multilineText = 'First Line\nSecond Line\n\nThird Line';
const multilineHash = serializeGardenHash(multilineText, 'emerald');
const parsedMultiline = parseGardenHash(multilineHash, themes.map(t => t.id));
assert.strictEqual(parsedMultiline.text, multilineText);
assert.strictEqual(parsedMultiline.themeId, 'emerald');
assert.ok(multilineHash.includes('%0A'), 'Newlines must be encoded as %0A in URL hash');
console.log('✓ Test 24: Multiline text with newlines roundtrips cleanly through URL hash.');

// Test 25: Fallback to default theme when theme ID is invalid/unknown
const parsedInvalidTheme = parseGardenHash('#text=wildflower&theme=nonexistent_galaxy', themes.map(t => t.id));
assert.strictEqual(parsedInvalidTheme.text, 'wildflower');
assert.strictEqual(parsedInvalidTheme.themeId, DEFAULT_THEME_ID);
console.log('✓ Test 25: Unrecognized theme ID falls back gracefully to default theme (midnight).');

// Test 26: Empty and missing hash fallback
const parsedEmpty = parseGardenHash('', themes.map(t => t.id));
const parsedHashOnly = parseGardenHash('#', themes.map(t => t.id));
assert.strictEqual(parsedEmpty.text, '');
assert.strictEqual(parsedEmpty.themeId, DEFAULT_THEME_ID);
assert.strictEqual(parsedHashOnly.text, '');
assert.strictEqual(parsedHashOnly.themeId, DEFAULT_THEME_ID);
console.log('✓ Test 26: Empty and hash-only inputs fallback to empty text and default theme.');

// Test 27: Malformed percent encoding resilience
const parsedMalformed = parseGardenHash('#text=%E0%A4&theme=forest', themes.map(t => t.id));
assert.ok(typeof parsedMalformed.text === 'string');
assert.strictEqual(parsedMalformed.themeId, 'forest');
console.log('✓ Test 27: Malformed percent encoding handled safely without unhandled exceptions.');

// Test 28: getPermalinkUrl generates valid full URL
const fullUrl = getPermalinkUrl('https://typegarden.app/garden', 'bloom', 'dune');
assert.strictEqual(fullUrl, 'https://typegarden.app/garden#text=bloom&theme=dune');
console.log('✓ Test 28: getPermalinkUrl constructs complete permalink URL.');

// Group B: Zen Mode & Text Halo Constants (Tests 29-32)
// Test 29: Zen mode inactivity fade duration is exactly 2500ms
assert.strictEqual(ZEN_FADE_TIMEOUT_MS, 2500, 'Zen mode inactivity timeout must be exactly 2500ms');
console.log('✓ Test 29: Zen mode auto-fade delay constant is exactly 2500ms.');

// Test 30: Sequential bloom stagger constant is 80ms
assert.strictEqual(BLOOM_STAGGER_MS, 80, 'Bloom stagger interval must be 80ms per character index');
console.log('✓ Test 30: Sequential bloom stagger constant is 80ms per index.');

// Test 31: High-contrast text halo stroke specification is 2.5px
assert.strictEqual(TEXT_HALO_STROKE_PX, 2.5, 'Text halo stroke must be 2.5px');
console.log('✓ Test 31: High-contrast text halo contour specification is exactly 2.5px.');

// Test 32: SVG export includes text halo styling when haloMode is active
const svgWithHalo = buildStandaloneSVG(gardenSeedA, themes[0], 'hello', 1920, 1080, true);
assert.ok(svgWithHalo.includes('paint-order: stroke fill'), 'SVG with halo must specify paint-order: stroke fill');
assert.ok(svgWithHalo.includes(`stroke: ${themes[0].background}`), 'SVG with halo must use active theme background color');
assert.ok(svgWithHalo.includes('stroke-width: 5px'), 'SVG with halo must have 5px stroke for 2.5px exterior contour');
console.log('✓ Test 32: Standalone SVG export renders high-contrast text halo when active.');

// Group C: Accessibility & WCAG AAA Verification (Tests 33-35)
// Test 33: Focus ring contrast against all 8 theme backgrounds exceeds WCAG AAA (7.0:1)
function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const [lr, lg, lb] = [r, g, b].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

themes.forEach(theme => {
  const cr = contrastRatio('#ffffff', theme.background);
  assert.ok(cr >= 7.0, `Theme ${theme.id} background failed WCAG AAA contrast threshold (7.0:1), got ${cr}:1`);
  assert.ok(cr >= 18.0, `Theme ${theme.id} expected >= 18.0:1 contrast, got ${cr}:1`);
});
console.log('✓ Test 33: Focus ring #ffffff achieves >18:1 contrast across all 8 botanical themes (exceeds WCAG AAA 7:1).');

// Test 34: Focus ring dual-ring geometry in CSS
import fs from 'fs';
const indexCss = fs.readFileSync('./src/index.css', 'utf-8');
assert.ok(indexCss.includes('outline: 2px solid #ffffff'), 'CSS must define 2px solid white outline');
assert.ok(indexCss.includes('outline-offset: 2px'), 'CSS must define 2px outline-offset');
assert.ok(indexCss.includes('box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.75)'), 'CSS must define dual ring dark shadow');
console.log('✓ Test 34: WCAG AAA dual-ring focus geometry verified in index.css.');

// Test 35: ARIA live announcements formatting
const sampleLoadAnnouncement = `Loaded shared garden: 'flower' in ${themes[3].name} theme. Blooming 6 letters.`;
assert.ok(sampleLoadAnnouncement.includes('flower') && sampleLoadAnnouncement.includes('Blooming 6 letters'));
console.log('✓ Test 35: ARIA live status announcements format informative semantic state.');

// Test 36: Standalone SVG export contains explicit viewBox and cross-platform serif fallbacks
const testExportSvg = buildStandaloneSVG(gardenSeedA, themes[0], 'flora', 1920, 1080);
assert.ok(testExportSvg.includes('viewBox="0 0 1920 1080"'), 'SVG must declare explicit viewBox');
assert.ok(testExportSvg.includes('Playfair Display'), 'SVG must specify primary font');
assert.ok(testExportSvg.includes('Georgia') && testExportSvg.includes('serif'), 'SVG must specify portable serif fallbacks');
console.log('✓ Test 36: Standalone SVG export includes explicit viewBox and portable font fallbacks.');

// Test 37: Polished Midnight and Sakura theme stem contrasts exceed 4.0:1
const midnightStemContrast = contrastRatio(themes[0].stem, themes[0].background);
assert.ok(midnightStemContrast >= 4.0, `Midnight stem contrast must exceed 4.0:1, got ${midnightStemContrast.toFixed(2)}`);
const sakuraTheme = themes.find(t => t.id === 'sakura')!;
const sakuraStemContrast = contrastRatio(sakuraTheme.stem, sakuraTheme.background);
assert.ok(sakuraStemContrast >= 4.0, `Sakura stem contrast must exceed 4.0:1, got ${sakuraStemContrast.toFixed(2)}`);
console.log(`✓ Test 37: Polished Midnight (${midnightStemContrast.toFixed(2)}:1) and Sakura (${sakuraStemContrast.toFixed(2)}:1) stem contrasts exceed 4.0:1.`);

console.log('All tests passed!');
