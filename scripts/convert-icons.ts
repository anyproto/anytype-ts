/**
 * Convert SVG icons into inline React icon components, organized by visual packs.
 *
 * Usage: bun scripts/convert-icons.ts
 *
 * Reads SVGs from src/img/icon/, converts them to React components organized
 * into packs (action, embed, relation, view), and generates per-pack indexes
 * + a central registry.
 *
 * Features:
 * - SVG → JSX conversion (attributes, colors, sizing)
 * - Proper code formatting with tab indentation
 * - Deduplication: identical SVG content shares one component, others become aliases
 * - Monochrome color replacement with {color} prop
 *
 * Excluded: type/default/ icons (ionicons loaded at runtime via import.meta.glob)
 */

import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = join(import.meta.dir, '..');
const SRC_DIR = join(ROOT, 'src/img/icon');
const ICONS_DIR = join(ROOT, 'src/ts/component/util/icons');

// ── Pack definitions ────────────────────────────────────────────────────────

/** Icon packs. Order matters — first match wins. */
const PACKS: { name: string; match: (relPath: string) => boolean }[] = [
	{ name: 'embed',    match: (p) => p.includes('/embed/') },
	{ name: 'relation', match: (p) => p.startsWith('relation/default/') },
	{ name: 'view',     match: (p) => p.startsWith('dataview/layout/') || p.startsWith('dataview/view/') },
	{ name: 'action',   match: () => true }, // catch-all: 20×20 grey icons
];

/** Directories to skip entirely (loaded via import.meta.glob at runtime). */
const SKIP_DIRS = new Set(['type/default', 'type']);

// ── Color handling ──────────────────────────────────────────────────────────

/** Monochrome fills/strokes to replace with the {color} prop. */
const MONO_COLORS = [
	'#9B9B9B', '#9b9b9b',
	'#B6B6B6', '#b6b6b6',
	'#252525',
	'#A7A7A7', '#a7a7a7',
	'#A09F92', '#a09f92',
	'black', 'white',
	'_COLOR_VAR_',
];

// ── Naming helpers ──────────────────────────────────────────────────────────

function hyphenToCamel(str: string): string {
	return str.replace(/-([a-zA-Z0-9])/g, (_m, c: string) => c.toUpperCase());
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Build a camelCase icon name from a file path and pack. */
function buildIconName(relPath: string, pack: string): string {
	const fileName = hyphenToCamel(relPath.replace(/\.svg$/, '').split('/').pop()!);

	if (pack === 'relation') return 'relation' + capitalize(fileName);
	if (pack === 'view') return 'view' + capitalize(fileName);
	return fileName;
}

/** Build a full-path fallback name for collision resolution. */
function buildFullPathName(relPath: string): string {
	return relPath
		.replace(/\.svg$/, '')
		.split('/')
		.map((part, i) => {
			const clean = hyphenToCamel(part);
			return i === 0 ? clean : capitalize(clean);
		})
		.join('');
}

// ── SVG → JSX conversion ───────────────────────────────────────────────────

/** SVG attribute name mappings (kebab → camelCase for JSX). */
const JSX_ATTR_MAP: Record<string, string> = {
	'fill-rule': 'fillRule',
	'clip-rule': 'clipRule',
	'clip-path': 'clipPath',
	'fill-opacity': 'fillOpacity',
	'stroke-width': 'strokeWidth',
	'stroke-linecap': 'strokeLinecap',
	'stroke-linejoin': 'strokeLinejoin',
	'stroke-dasharray': 'strokeDasharray',
	'stroke-dashoffset': 'strokeDashoffset',
	'stroke-miterlimit': 'strokeMiterlimit',
	'stroke-opacity': 'strokeOpacity',
	'stop-color': 'stopColor',
	'stop-opacity': 'stopOpacity',
	'xmlns:xlink': 'xmlnsXlink',
	'xlink:href': 'xlinkHref',
};

function convertSvgToJsx(svg: string): string {
	let r = svg;

	// Strip non-JSX content
	r = r.replace(/<\?xml[^?]*\?>\s*/g, '');
	r = r.replace(/<!--[\s\S]*?-->/g, '');
	r = r.replace(/<style[\s\S]*?<\/style>/g, '');
	r = r.replace(/ style="[^"]*"/g, '');
	r = r.replace(/ xml:space="[^"]*"/g, '');
	r = r.replace(/ version="[^"]*"/g, '');
	r = r.replace(/ x="0px"/g, '');
	r = r.replace(/ y="0px"/g, '');
	r = r.replace(/ xmlns="[^"]*"/g, '');
	r = r.replace(/ xmlns:xlink="[^"]*"/g, '');

	// class → className
	r = r.replaceAll(' class="', ' className="');

	// Monochrome color → {color} prop
	for (const mono of MONO_COLORS) {
		r = r.replaceAll(`fill="${mono}"`, 'fill={color}');
		r = r.replaceAll(`stroke="${mono}"`, 'stroke={color}');
	}

	// SVG attributes → JSX camelCase
	for (const [from, to] of Object.entries(JSX_ATTR_MAP)) {
		r = r.replaceAll(`${from}=`, `${to}=`);
	}

	// width/height → {size} prop (handle both orderings)
	r = r.replace(/(<svg[^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/, '$1width={size}$2height={size}');
	if (!r.includes('{size}')) {
		r = r.replace(/(<svg[^>]*?)height="[^"]*"([^>]*?)width="[^"]*"/, '$1height={size}$2width={size}');
	}
	if (!r.includes('{size}') && r.includes('viewBox=')) {
		r = r.replace(/<svg\s+viewBox="/, '<svg width={size} height={size} viewBox="');
	}

	// aria-hidden
	r = r.replace(/<svg /, '<svg aria-hidden="true" ');

	return r;
}

/** Indent SVG JSX with tabs for clean formatting. */
function formatSvgJsx(jsx: string): string {
	const lines = jsx.trim().split('\n');
	const formatted: string[] = [];
	let depth = 0;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		// Decrease depth for closing tags
		if (line.startsWith('</') || (line.startsWith('<') && line.endsWith('/>'))) {
			// Self-closing or closing tag — don't decrease for self-closing
			if (line.startsWith('</')) depth = Math.max(0, depth - 1);
		}

		formatted.push('\t'.repeat(depth + 2) + line);

		// Increase depth for opening tags (not self-closing, not closing)
		if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) {
			depth++;
		}
	}

	return formatted.join('\n');
}

// ── Component generation ────────────────────────────────────────────────────

function generateComponent(componentName: string, formattedSvg: string): string {
	const usesColor = formattedSvg.includes('{color}');
	const usesSize = formattedSvg.includes('{size}');

	const sizeParam = usesSize ? 'size' : 'size: _size';
	const colorParam = usesColor ? 'color' : 'color: _color';

	return [
		`import React from 'react';`,
		`import type { IconSvgProps } from '../../iconRegistry';`,
		``,
		`export function ${componentName}({ ${sizeParam}, ${colorParam} }: IconSvgProps) {`,
		`\treturn (`,
		formattedSvg,
		`\t);`,
		`}`,
		``,
	].join('\n');
}

// ── File system helpers ─────────────────────────────────────────────────────

async function collectSvgs(dir: string, base: string = dir): Promise<{ relPath: string; fullPath: string }[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const results: { relPath: string; fullPath: string }[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		const rel = relative(base, fullPath);

		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(rel)) {
				results.push(...await collectSvgs(fullPath, base));
			}
		} else if (entry.name.endsWith('.svg')) {
			results.push({ relPath: rel, fullPath });
		}
	}

	return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

interface IconEntry {
	name: string;
	componentName: string;
	pack: string;
}

async function main() {
	console.log('Collecting SVG files (excluding type/default)...');
	const svgs = await collectSvgs(SRC_DIR);
	// Sort so *0.svg comes before *1.svg (default state before hover state)
	svgs.sort((a, b) => a.relPath.localeCompare(b.relPath));
	console.log(`Found ${svgs.length} SVG files`);

	// Clean output directory
	if (existsSync(ICONS_DIR)) {
		await rm(ICONS_DIR, { recursive: true });
	}

	// ── Phase 1: Read all SVGs and convert to JSX ────────────────────────

	interface SvgCandidate {
		relPath: string;
		fullPath: string;
		pack: string;
		iconName: string;
		svgJsx: string; // converted, not yet formatted
	}

	const candidates: SvgCandidate[] = [];

	for (const { relPath, fullPath } of svgs) {
		// Assign to pack
		let pack = 'action';
		for (const p of PACKS) {
			if (p.match(relPath)) {
				pack = p.name;
				break;
			}
		}

		// Read and convert
		const svgRaw = await readFile(fullPath, 'utf-8');
		if (!svgRaw.trim() || !svgRaw.includes('<svg')) {
			console.warn(`  SKIP empty/invalid SVG: ${relPath}`);
			continue;
		}

		const svgJsx = convertSvgToJsx(svgRaw);
		const iconName = buildIconName(relPath, pack);

		candidates.push({ relPath, fullPath, pack, iconName, svgJsx });
	}

	/** Normalize SVG content for dedup comparison (strip whitespace differences). */
	const normalizeSvg = (jsx: string) => jsx.trim().replace(/\s+/g, ' ');

	// ── Phase 2: Resolve name collisions ─────────────────────────────────

	// Group by short name to find collisions
	const byName = new Map<string, SvgCandidate[]>();
	for (const c of candidates) {
		if (!byName.has(c.iconName)) byName.set(c.iconName, []);
		byName.get(c.iconName)!.push(c);
	}

	// Resolve collisions: when two different SVGs get the same name,
	// use full-path names for all colliders
	for (const [name, group] of byName) {
		if (group.length <= 1) continue;

		// Check if all SVGs in the group are actually identical content
		const uniqueContent = new Set(group.map((c) => normalizeSvg(c.svgJsx)));
		if (uniqueContent.size === 1) {
			// All identical — keep the first, dedup the rest (handled in phase 3)
			continue;
		}

		// Different content with same name — rename to full-path names
		for (const c of group) {
			c.iconName = buildFullPathName(c.relPath);
		}
	}

	// ── Phase 3: Deduplicate identical SVG content ───────────────────────

	const globalNames = new Map<string, string>(); // name → source
	const globalNamesLower = new Map<string, string>();
	const svgHashToIcon = new Map<string, IconEntry>(); // normalized svgJsx → first icon entry
	const allIcons: IconEntry[] = [];
	const dedupAliases: { alias: string; target: string }[] = [];
	const packFiles = new Map<string, { fileName: string; content: string }[]>();

	for (const c of candidates) {
		const { iconName, svgJsx, pack } = c;

		// Check name uniqueness
		if (globalNames.has(iconName)) {
			// Might be identical content → dedup alias, or true collision → skip
			const existing = svgHashToIcon.get(normalizeSvg(svgJsx));
			if (existing) {
				dedupAliases.push({ alias: iconName, target: existing.name });
			} else {
				console.warn(`  SKIP duplicate "${iconName}": ${c.relPath} (already from ${globalNames.get(iconName)})`);
			}
			continue;
		}

		const lower = iconName.toLowerCase();
		if (globalNamesLower.has(lower) && globalNamesLower.get(lower) !== iconName) {
			console.warn(`  SKIP case-collision "${iconName}": ${c.relPath} (collides with ${globalNamesLower.get(lower)})`);
			continue;
		}

		// Check if this SVG content was already generated under a different name
		const normalizedKey = normalizeSvg(svgJsx);
		const existingIcon = svgHashToIcon.get(normalizedKey);
		if (existingIcon) {
			// Same content, different name → register as alias
			dedupAliases.push({ alias: iconName, target: existingIcon.name });
			globalNames.set(iconName, `dedup→${existingIcon.name}`);
			globalNamesLower.set(lower, iconName);
			continue;
		}

		// New unique icon — generate component
		const componentName = capitalize(iconName) + 'Icon';
		const formattedSvg = formatSvgJsx(svgJsx);
		const componentContent = generateComponent(componentName, formattedSvg);

		const entry: IconEntry = { name: iconName, componentName, pack };
		allIcons.push(entry);
		svgHashToIcon.set(normalizeSvg(svgJsx), entry);
		globalNames.set(iconName, `${pack}/${c.relPath}`);
		globalNamesLower.set(lower, iconName);

		if (!packFiles.has(pack)) packFiles.set(pack, []);
		packFiles.get(pack)!.push({ fileName: iconName, content: componentContent });
	}

	// ── Phase 4: Write files ─────────────────────────────────────────────

	// Write component files per pack
	for (const [pack, files] of packFiles) {
		const packDir = join(ICONS_DIR, pack);
		await mkdir(packDir, { recursive: true });

		for (const { fileName, content } of files) {
			await writeFile(join(packDir, `${fileName}.tsx`), content);
		}
	}

	// ── Phase 5: Manual aliases ──────────────────────────────────────────

	const MANUAL_ALIASES: Record<string, string> = {
		// Bare name → *0.svg variant (the 0/1 pattern: 0 = default, 1 = hover)
		turn: 'turn0', move: 'move0', comment: 'comment0', copy: 'copy0',
		pin: 'pin0', unpin: 'unpin0', mute: 'mute0', unmute: 'unmute0',
		remove: 'remove0', more: 'more0', advanced: 'more0',
		download: 'download0', upload: 'upload0', rename: 'rename0',
		replace: 'replace0', add: 'add0', duplicate: 'duplicate0',
		embed: 'embed0', undo: 'undo0', redo: 'redo0', print: 'print0',
		history: 'history0', search: 'search0', restore: 'restore0',
		customize: 'customize0', clear: 'clear0', clock: 'clock0',
		settings: 'settings0', source: 'source0', editText: 'editText0',
		resize: 'resize0', template: 'template0', fav: 'fav0', unfav: 'unfav0',
		highlight: 'highlight0', share: 'share0', export: 'export0',
		pageLock: 'pageLock0', pageUnlock: 'pageUnlock0', sort: 'sort0',
		reload: 'reload0', store: 'store0', pencil: 'pencil0',
		createWidget: 'createWidget0', clipboard: 'clipboard0',
		image: 'image0', time: 'time0', collection: 'collection0',
		set: 'set0', import: 'import0', editType: 'editType0',
		editChat: 'editChat0', openSidebar: 'sidebar0',
		notification: 'notification0', members: 'members0',
		inviteMembers: 'inviteMembers0', copyLink: 'copyLink0',
		qr: 'qr0', bin: 'bin0', manage: 'manage0',
		newTab: 'newTab0', newWindow: 'newWindow0', group: 'group0',
		pageLink: 'pageLink0', createObject: 'createObject0',
		uploadComputer: 'uploadComputer0', object: 'object0',
		folder: 'folder0', folderBlank: 'folderBlank0',
		bold: 'bold0', italic: 'italic0', strike: 'strike0',
		link: 'link0', kbd: 'code0', underline: 'underline0',
		date: 'date0',
	};

	// Merge manual + dedup aliases, resolving targets to real icons
	const allAliases = new Map<string, string>();

	for (const { alias, target } of dedupAliases) {
		if (!allIcons.find((i) => i.name === alias)) {
			allAliases.set(alias, target);
		}
	}

	for (const [alias, target] of Object.entries(MANUAL_ALIASES)) {
		if (!globalNames.has(alias) || globalNames.get(alias)!.startsWith('dedup→')) {
			const realIcon = allIcons.find((i) => i.name === target);
			if (realIcon) {
				allAliases.set(alias, target);
			}
		}
	}

	// ── Phase 6: Generate index files ────────────────────────────────────

	// Group icons by pack
	const packIconMap = new Map<string, IconEntry[]>();
	for (const icon of allIcons) {
		if (!packIconMap.has(icon.pack)) packIconMap.set(icon.pack, []);
		packIconMap.get(icon.pack)!.push(icon);
	}

	for (const [pack, icons] of packIconMap) {
		icons.sort((a, b) => a.name.localeCompare(b.name));

		const imports = icons
			.map((i) => `import { ${i.componentName} } from './${i.name}';`)
			.join('\n');

		const registrations = icons
			.map((i) => `registerIcon('${i.name}', ${i.componentName});`)
			.join('\n');

		// Aliases that point to icons in this pack
		const aliasLines: string[] = [];
		for (const [alias, target] of allAliases) {
			const targetIcon = icons.find((i) => i.name === target);
			if (targetIcon) {
				aliasLines.push(`registerIcon('${alias}', ${targetIcon.componentName});`);
			}
		}

		const sections = [
			`/**\n * Icon pack: ${pack} — auto-generated by scripts/convert-icons.ts\n */`,
			`import { registerIcon } from '../../iconRegistry';`,
			'',
			imports,
			'',
			registrations,
		];

		if (aliasLines.length) {
			aliasLines.sort();
			sections.push('', '// Aliases', ...aliasLines);
		}

		sections.push('');
		await writeFile(join(ICONS_DIR, pack, 'index.ts'), sections.join('\n'));
	}

	// Root index
	const packs = [...packIconMap.keys()].sort();
	await writeFile(join(ICONS_DIR, 'index.ts'), [
		'/**',
		' * Icon registration — auto-generated by scripts/convert-icons.ts',
		' * Import this module once at app startup.',
		' */',
		...packs.map((p) => `import './${p}';`),
		'',
	].join('\n'));

	// ── Phase 7: Generate iconRegistry.ts ────────────────────────────────

	const allNames = [
		...new Set([
			...allIcons.map((i) => i.name),
			...allAliases.keys(),
		]),
	].sort();

	const registryContent = [
		`import type { ComponentType } from 'react';`,
		``,
		`/** Props passed to every SVG icon component. */`,
		`export interface IconSvgProps {`,
		`\tsize: number;`,
		`\tcolor: string;`,
		`}`,
		``,
		`/** Union of all registered icon keys. Auto-generated by scripts/convert-icons.ts */`,
		`export type IconName =`,
		...allNames.map((n) => `\t| '${n}'`),
		`;`,
		``,
		`/** Registry mapping icon names to their SVG components. */`,
		`export const iconRegistry = new Map<IconName, ComponentType<IconSvgProps>>();`,
		``,
		`/** Register an icon component under a unique key. */`,
		`export function registerIcon(name: IconName, component: ComponentType<IconSvgProps>) {`,
		`\ticonRegistry.set(name, component);`,
		`}`,
		``,
	].join('\n');

	await writeFile(join(ICONS_DIR, '..', 'iconRegistry.ts'), registryContent);

	// ── Summary ──────────────────────────────────────────────────────────

	console.log('\n=== Icon Packs ===');
	for (const [pack, icons] of packIconMap) {
		console.log(`  ${pack}: ${icons.length} components`);
	}
	console.log(`  Deduplicated: ${dedupAliases.length} identical icons → aliases`);
	console.log(`  Manual aliases: ${allAliases.size - dedupAliases.length}`);
	console.log(`\nTotal: ${allIcons.length} unique components, ${allNames.length} registered names`);
}

main().catch(console.error);
