/**
 * Convert all SVG icons into inline React icon components.
 *
 * Usage: bun scripts/convert-icons.ts
 *
 * Reads SVGs from src/img/icon/, converts them to React components,
 * writes to src/ts/component/util/icons/, and generates the registry.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = join(import.meta.dir, '..');
const SRC_DIR = join(ROOT, 'src/img/icon');
const OUT_DIR = join(ROOT, 'src/ts/component/util/icons');

// Monochrome fills/strokes to replace with the color prop
const MONO_COLORS = new Set([
	'#9B9B9B', '#9b9b9b',
	'#B6B6B6', '#b6b6b6',
	'#252525',
	'#A7A7A7', '#a7a7a7',
	'#A09F92', '#a09f92',
	'black',
	'white',
	'_COLOR_VAR_',
]);

// Colors that should NOT be replaced (semantic/accent/brand colors)
const KEEP_COLORS = new Set([
	'none',
	'#377AFF',   // accent blue
	'#F55522',   // red/error
	'#5DD400',   // green/success
	'#FFB522',   // yellow/warning
	'#2AA7EE',   // light blue
	'#3E58EB',   // dark blue
	'#AB50CC',   // purple
	'#06B6F2',   // cyan
	'#9BBCFF',   // light accent
	'#DCDCDC',   // light grey (border)
	'#FF0000',   // youtube red
	'#FF6600',   // soundcloud orange
	'#1DB954',   // spotify green
	'#DA1884',   // figma pink
	'#F76655',   // figma red
	'#FF7237',   // figma orange
	'#0ACF83',   // figma green
	'#A259FF',   // figma purple
	'#1ABCFE',   // figma blue
	'#1DA1F2',   // twitter blue
	'#0088CC',   // telegram blue
	'#FF4500',   // reddit orange
]);

/** Convert a hyphenated string to camelCase: "filter-clear" → "filterClear". */
function hyphenToCamel(str: string): string {
	return str.replace(/-([a-zA-Z0-9])/g, (_m, c: string) => c.toUpperCase());
}

/** Convert a file path like "menu/action/more1.svg" to a camelCase icon name.
 *  Uses all path segments to ensure uniqueness. */
function pathToFullName(relPath: string): string {
	const withoutExt = relPath.replace(/\.svg$/, '');
	const parts = withoutExt.split('/');

	return parts
		.map((part, i) => {
			const clean = hyphenToCamel(part);
			if (i === 0) {
				return clean;
			}
			return clean.charAt(0).toUpperCase() + clean.slice(1);
		})
		.join('');
}

/** Get just the filename (no directory) as camelCase. */
function fileBaseName(relPath: string): string {
	const withoutExt = relPath.replace(/\.svg$/, '');
	const parts = withoutExt.split('/');
	return hyphenToCamel(parts[parts.length - 1]);
}

/** Convert a camelCase name to PascalCase for component name. */
function toPascalCase(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Replace monochrome color values with {color} prop reference. */
function convertSvgContent(svg: string): string {
	let result = svg;

	// Strip XML declaration
	result = result.replace(/<\?xml[^?]*\?>\s*/g, '');

	// Strip XML comments (invalid in JSX)
	result = result.replace(/<!--[\s\S]*?-->/g, '');

	// Strip <style> blocks (can't be used in JSX SVG)
	result = result.replace(/<style[\s\S]*?<\/style>/g, '');

	// Strip inline style attributes (not JSX-safe)
	result = result.replace(/ style="[^"]*"/g, '');

	// Strip xml:space, version, id on root svg
	result = result.replace(/ xml:space="[^"]*"/g, '');
	result = result.replace(/ version="[^"]*"/g, '');
	result = result.replace(/ x="0px"/g, '');
	result = result.replace(/ y="0px"/g, '');

	// Convert class= to className=
	result = result.replaceAll(' class="', ' className="');

	// Replace monochrome fill/stroke values
	for (const mono of MONO_COLORS) {
		result = result.replaceAll(`fill="${mono}"`, 'fill={color}');
		result = result.replaceAll(`stroke="${mono}"`, 'stroke={color}');
	}

	// Convert SVG attributes to JSX (kebab-case → camelCase)
	result = result.replaceAll('fill-rule=', 'fillRule=');
	result = result.replaceAll('clip-rule=', 'clipRule=');
	result = result.replaceAll('clip-path=', 'clipPath=');
	result = result.replaceAll('fill-opacity=', 'fillOpacity=');
	result = result.replaceAll('stroke-width=', 'strokeWidth=');
	result = result.replaceAll('stroke-linecap=', 'strokeLinecap=');
	result = result.replaceAll('stroke-linejoin=', 'strokeLinejoin=');
	result = result.replaceAll('stroke-dasharray=', 'strokeDasharray=');
	result = result.replaceAll('stroke-dashoffset=', 'strokeDashoffset=');
	result = result.replaceAll('stroke-miterlimit=', 'strokeMiterlimit=');
	result = result.replaceAll('stroke-opacity=', 'strokeOpacity=');
	result = result.replaceAll('stop-color=', 'stopColor=');
	result = result.replaceAll('stop-opacity=', 'stopOpacity=');
	result = result.replaceAll('xmlns:xlink=', 'xmlnsXlink=');
	result = result.replaceAll('xlink:href=', 'xlinkHref=');

	// Remove xmlns attributes since React doesn't need them
	result = result.replace(/ xmlns="[^"]*"/g, '');
	result = result.replace(/ xmlns:xlink="[^"]*"/g, '');

	// Replace width/height on root svg tag with size prop
	result = result.replace(
		/(<svg[^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/,
		'$1width={size}$2height={size}',
	);

	// Add size to SVGs that have viewBox but no width/height
	if (!result.includes('{size}') && result.includes('viewBox=')) {
		result = result.replace(
			/<svg\s+viewBox="/,
			'<svg width={size} height={size} viewBox="',
		);
	}

	// Add aria-hidden="true" to all SVGs
	result = result.replace(/<svg /, '<svg aria-hidden="true" ');

	return result;
}

/** Recursively collect all SVG files with relative paths. */
async function collectSvgs(dir: string, base: string = dir): Promise<{ relPath: string; fullPath: string }[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const results: { relPath: string; fullPath: string }[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...await collectSvgs(fullPath, base));
		} else if (entry.name.endsWith('.svg')) {
			results.push({ relPath: relative(base, fullPath), fullPath });
		}
	}

	return results;
}

/** Generate a single icon component file. */
function generateComponent(componentName: string, svgJsx: string): string {
	const usesColor = svgJsx.includes('{color}');
	const usesSize = svgJsx.includes('{size}');

	const params: string[] = [];
	params.push(usesSize ? 'size' : 'size: _size');
	params.push(usesColor ? 'color' : 'color: _color');

	return `import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ${componentName}({ ${params.join(', ')} }: IconSvgProps) {
	return (
		${svgJsx.trim()}
	);
}
`;
}

// Priority: top-level > menu/action > sidebar > header > widget > everything else
const DIR_PRIORITY: Record<string, number> = {
	'': 10,
	'menu/action': 9,
	'menu/action/block': 8,
	'sidebar': 8,
	'header': 7,
	'widget': 6,
	'widget/button': 6,
	'widget/system': 6,
	'navigation': 5,
	'dataview/button': 4,
	'settings': 4,
	'menu': 3,
	'popup/search': 3,
	'popup/settings': 3,
	'chat/buttons': 2,
	'type/default': 1,
};

function dirPriority(relPath: string): number {
	const parts = relPath.split('/');
	const dir = parts.slice(0, -1).join('/');
	return DIR_PRIORITY[dir] ?? 2;
}

async function main() {
	console.log('Collecting SVG files...');
	const svgs = await collectSvgs(SRC_DIR);
	console.log(`Found ${svgs.length} SVG files`);

	// Ensure output directory exists
	if (!existsSync(OUT_DIR)) {
		await mkdir(OUT_DIR, { recursive: true });
	}

	// Phase 1: detect short-name collisions and assign winners by priority
	const shortNameBest = new Map<string, { relPath: string; priority: number }>();
	for (const { relPath } of svgs) {
		const short = fileBaseName(relPath);
		const priority = dirPriority(relPath);
		const existing = shortNameBest.get(short);
		if (!existing || priority > existing.priority) {
			shortNameBest.set(short, { relPath, priority });
		}
	}

	// Track all icon names for registry generation
	const icons: { name: string; componentName: string; fileName: string }[] = [];
	const seenNames = new Map<string, string>();
	const seenNamesLower = new Map<string, string>();

	// Forced name overrides for specific directories
	const FORCED_NAMES: Record<string, (file: string) => string> = {
		'relation/default': (file) => 'relation' + file.charAt(0).toUpperCase() + file.slice(1),
	};

	for (const { relPath, fullPath } of svgs) {
		const short = fileBaseName(relPath);
		const best = shortNameBest.get(short);

		// Check forced naming first
		const parts = relPath.split('/');
		const dir = parts.slice(0, -1).join('/');
		const fileBase = parts[parts.length - 1].replace(/\.svg$/, '');
		const forcedFn = FORCED_NAMES[dir];

		const iconName = forcedFn
			? forcedFn(hyphenToCamel(fileBase))
			: (best && best.relPath === relPath)
				? short
				: pathToFullName(relPath);
		const componentName = toPascalCase(iconName) + 'Icon';
		const fileName = iconName;

		// Check for name collisions
		if (seenNames.has(iconName)) {
			console.warn(`  SKIP duplicate name "${iconName}": ${relPath} (already from ${seenNames.get(iconName)})`);
			continue;
		}
		const lowerName = iconName.toLowerCase();
		if (seenNamesLower.has(lowerName)) {
			console.warn(`  SKIP case-collision "${iconName}": ${relPath} (collides with ${seenNamesLower.get(lowerName)})`);
			continue;
		}
		seenNames.set(iconName, relPath);
		seenNamesLower.set(lowerName, iconName);

		// Read and convert SVG
		const svgRaw = await readFile(fullPath, 'utf-8');
		if (!svgRaw.trim() || !svgRaw.includes('<svg')) {
			console.warn(`  SKIP empty/invalid SVG: ${relPath}`);
			continue;
		}
		const svgJsx = convertSvgContent(svgRaw);
		const component = generateComponent(componentName, svgJsx);

		const outPath = join(OUT_DIR, `${fileName}.tsx`);
		await writeFile(outPath, component);

		icons.push({ name: iconName, componentName, fileName });
	}

	// Sort icons alphabetically
	icons.sort((a, b) => a.name.localeCompare(b.name));

	// Aliases: map CSS class names used in the codebase to generated icon names
	const ALIASES: Record<string, string> = {
		// Forward is back rotated
		forward: 'back',
		// Menu action icons — CSS uses bare names, files are *0.svg
		turn: 'turn0',
		move: 'move0',
		comment: 'comment0',
		copy: 'copy0',
		pin: 'pin0',
		unpin: 'unpin0',
		mute: 'mute0',
		unmute: 'unmute0',
		remove: 'remove0',
		more: 'more0',
		advanced: 'more0',
		download: 'download0',
		upload: 'upload0',
		rename: 'rename0',
		replace: 'replace0',
		add: 'add0',
		duplicate: 'duplicate0',
		embed: 'embed0',
		undo: 'undo0',
		redo: 'redo0',
		print: 'print0',
		history: 'history0',
		search: 'search0',
		restore: 'restore0',
		customize: 'customize0',
		clear: 'clear0',
		clock: 'clock0',
		settings: 'settings0',
		source: 'source0',
		editText: 'editText0',
		resize: 'resize0',
		template: 'template0',
		fav: 'fav0',
		unfav: 'unfav0',
		highlight: 'highlight0',
		share: 'share0',
		export: 'export0',
		pageLock: 'pageLock0',
		pageUnlock: 'pageUnlock0',
		sort: 'sort0',
		reload: 'reload0',
		store: 'store0',
		pencil: 'pencil0',
		createWidget: 'createWidget0',
		clipboard: 'clipboard0',
		image: 'image0',
		time: 'time0',
		collection: 'collection0',
		set: 'set0',
		import: 'import0',
		editType: 'editType0',
		editChat: 'editChat0',
		openSidebar: 'sidebar0',
		notification: 'notification0',
		members: 'members0',
		inviteMembers: 'inviteMembers0',
		copyLink: 'copyLink0',
		qr: 'qr0',
		bin: 'bin0',
		manage: 'manage0',
		newTab: 'newTab0',
		newWindow: 'newWindow0',
		group: 'group0',
		pageLink: 'pageLink0',
		createObject: 'createObject0',
		uploadComputer: 'uploadComputer0',
		object: 'object0',
		folder: 'folder0',
		folderBlank: 'folderBlank0',
		// Mark icons
		bold: 'bold0',
		italic: 'italic0',
		strike: 'strike0',
		link: 'link0',
		kbd: 'code0',
		underline: 'underline0',
		// Date
		date: 'date0',
		// Chat button icons
		'chat-reaction': 'reaction0',
		'chat-reply': 'reply0',
		'chat-copy': 'chatButtonsCopy0',
		'chat-link': 'link0',
		'chat-pencil': 'chatButtonsPencil0',
		// Embed icons — CSS uses "embed-youtube", auto-resolver makes "embedYoutube",
		// but registry has "blockEmbedYoutube" from menu/action/block/embed/ path
		embedYoutube: 'blockEmbedYoutube',
		embedVimeo: 'blockEmbedVimeo',
		embedGoogleMaps: 'blockEmbedGoogleMaps',
		embedSoundcloud: 'blockEmbedSoundcloud',
		embedChart: 'blockEmbedChart',
		embedMiro: 'blockEmbedMiro',
		embedFigma: 'blockEmbedFigma',
		embedBilibili: 'blockEmbedBilibili',
		embedCodepen: 'blockEmbedCodepen',
		embedFacebook: 'blockEmbedFacebook',
		embedGithubGist: 'blockEmbedGithubGist',
		embedGraphviz: 'blockEmbedGraphviz',
		embedInstagram: 'blockEmbedInstagram',
		embedKroki: 'blockEmbedKroki',
		embedOpenStreetMap: 'blockEmbedOpenStreetMap',
		embedReddit: 'blockEmbedReddit',
		embedTelegram: 'blockEmbedTelegram',
		embedTwitter: 'blockEmbedTwitter',
		embedExcalidraw: 'blockEmbedExcalidraw',
		embedSketchfab: 'blockEmbedSketchfab',
		embedDrawio: 'blockEmbedDrawio',
		embedImage: 'blockEmbedImage',
		embedSpotify: 'blockEmbedSpotify',
		embedBandcamp: 'blockEmbedBandcamp',
		embedAppleMusic: 'blockEmbedAppleMusic',
		embedLatex: 'blockEmbedLatex',
		embedMermaid: 'blockEmbedMermaid',
		// Text block icons — CSS uses "textParagraph", registry has "paragraph" etc.
		textParagraph: 'paragraph',
		textHeader1: 'header',
		textHeader2: 'header',
		textHeader3: 'header',
		textQuote: 'quote',
		textCallout: 'callout',
		textBulleted: 'bulleted',
		textCheckbox: 'menuActionBlockTextCheckbox',
		textNumbered: 'numbered',
		textToggle: 'toggle',
		textToggleHeader1: 'toggleHeader',
		textToggleHeader2: 'toggleHeader',
		textToggleHeader3: 'toggleHeader',
		// Div icons
		divLine: 'line',
		divDot: 'dot',
		// Media icons
		mediaFile: 'menuActionBlockMediaFile',
		mediaImage: 'menuActionBlockMediaImage',
		mediaVideo: 'video',
		mediaAudio: 'audio',
		mediaPdf: 'pdf',
		// Table icons
		tableOfContents: 'tableOfContents',
		// Alignment icons — CSS uses "align left", auto-resolver gets "align"
		// These need the full names
		// Widget icons — CSS uses "widget-0", "widget-1", etc.
		'widget-star': 'widgetSystemPin',
		// Relation icons
		'relation-filter': 'filter',
		'relation-sort0': 'menuRelationSort',
		'relation-sort1': 'menuRelationSort',
		'relation-hide': 'menuRelationHide',
		'relation-insert-left': 'insert',
		'relation-insert-right': 'insert',
		// Help icons
		'help-bell': 'bell',
		'help-keyboard': 'keyboard',
		'help-share': 'share0',
		'help-community': 'community',
		'help-tutorial': 'tutorial',
		'help-contact': 'contact',
		'help-developer': 'developer',
		'help-more': 'menuHelpMore',
		// Comment slash menu icons
		'comment-header1': 'header1',
		'comment-header2': 'header2',
		'comment-header3': 'header3',
		'comment-numbered': 'numbered',
		'comment-bulleted': 'bulleted',
		'comment-checkbox': 'checkbox',
		'comment-createObject': 'createObject0',
		'comment-plus': 'plus',
		'comment-uploadComputer': 'uploadComputer0',
		'comment-embed': 'embed0',
		'comment-quote': 'quote',
		'comment-divider': 'line',
		'comment-code': 'code',
		// Import icons — CSS uses "import-notion", auto-resolver makes "importNotion"
		importNotion: 'notion',
		importMarkdown: 'markdown',
		importHtml: 'html',
		importText: 'text',
		importCsv: 'csv',
		importProtobuf: 'protobuf',
		importObsidian: 'obsidian',
		// Settings icons — CSS uses "settings-personal", auto-resolver makes "settingsPersonal"
		// Many short names won out (personal, storage, etc.) but some didn't
		settingsSpace: 'overview',
		settingsNotifications: 'pushOn',
		settingsLogout: 'logOut',
		settingsLeave: 'leave',
		// Sidebar icons
		'sidebar-all': 'menuSidebarAll',
		'sidebar-sidebar': 'sidebar',
		'sidebar-focus': 'focus',
		// Clipboard icons
		'clipboard-copy': 'menuActionClipboardCopy',
		'clipboard-cut': 'cut',
		'clipboard-paste': 'paste',
		// Cover icons
		coverChange: 'change',
		coverPosition: 'position',
		// Link style icons
		linkStyle0: 'style0',
		linkStyle1: 'style1',
		linkStyle2: 'style2',
		// Filter template icons
		'filterTemplate-object': 'filterTemplateObject',
		'filterTemplate-participant': 'user',
		// Advanced filter
		advancedFilter: 'filter0',
		// Checkbox icons in menus
		// Valign icons
		'valign-top': 'top',
		'valign-middle': 'middle',
		'valign-bottom': 'bottom',
	};

	// Generate index.ts with all registrations
	const imports = icons
		.map((i) => `import { ${i.componentName} } from './${i.fileName}';`)
		.join('\n');

	const registrations = icons
		.map((i) => `registerIcon('${i.name}', ${i.componentName});`)
		.join('\n');

	// Build alias registrations
	const aliasLines: string[] = [];
	const aliasNames: string[] = [];
	for (const [alias, target] of Object.entries(ALIASES)) {
		const targetIcon = icons.find((i) => i.name === target);
		if (targetIcon) {
			aliasLines.push(`registerIcon('${alias}', ${targetIcon.componentName});`);
			aliasNames.push(alias);
		} else {
			console.warn(`  ALIAS skip: '${alias}' → '${target}' (target not found)`);
		}
	}

	const indexContent = `/**
 * Icon registration — auto-generated by scripts/convert-icons.ts
 *
 * Imports every icon component and registers it with the icon registry.
 * Import this module once at app startup (e.g., in entry.tsx).
 */
import { registerIcon } from '../iconRegistry';

${imports}

${registrations}

// Aliases — convenience names pointing to existing icon components
${aliasLines.join('\n')}
`;

	await writeFile(join(OUT_DIR, 'index.ts'), indexContent);

	// Combine icon names + alias names for the type
	const allNames = [...new Set([...icons.map((i) => i.name), ...aliasNames])].sort();

	// Auto-generate iconRegistry.ts with the full IconName type
	const iconNameUnion = allNames.map((n) => `\t| '${n}'`).join('\n');
	const registryContent = `import type { ComponentType } from 'react';

/** Props passed to every SVG icon component. */
export interface IconSvgProps {
	size: number;
	color: string;
	className?: string;
}

/** Union of all registered icon keys. Auto-generated by scripts/convert-icons.ts */
export type IconName =
${iconNameUnion};

/** Registry mapping icon names to their SVG components. */
export const iconRegistry = new Map<IconName, ComponentType<IconSvgProps>>();

/** Register an icon component under a unique key. */
export function registerIcon(name: IconName, component: ComponentType<IconSvgProps>) {
	iconRegistry.set(name, component);
}
`;
	await writeFile(join(ROOT, 'src/ts/component/util/iconRegistry.ts'), registryContent);
	console.log(`\nGenerated ${icons.length} icon components + ${aliasNames.length} aliases`);
	console.log(`Total: ${allNames.length} icon names`);
}

main().catch(console.error);
