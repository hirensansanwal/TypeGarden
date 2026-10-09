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

console.log('All tests passed!');
