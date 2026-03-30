#!/usr/bin/env bun
/**
 * Migrates menu action icon usages from className to name prop.
 * Adds name="menu/action/{iconName}" to Icon components that use className="{iconName}".
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Icons that are used via className on Icon components
const ICON_MAP: Record<string, string> = {
	'more': 'menu/action/more',
	'arrow': 'menu/action/arrow',
	'copy': 'menu/action/copy',
	'group': 'menu/action/group',
	'time': 'menu/action/time',
	'remove': 'menu/action/remove',
	'expand': 'menu/action/expand',
	'source': 'menu/action/source',
	'resize': 'menu/action/resize',
	'fav': 'menu/action/fav',
	'share': 'menu/action/share',
	'set': 'menu/action/set',
	'pin': 'menu/action/pin',
	'notification': 'menu/action/notification',
	'image': 'menu/action/image',
	'highlight': 'menu/action/highlight',
	'hide': 'menu/action/hide',
	'clear': 'menu/action/clear',
	'advanced': 'menu/action/more',
};

// Find all TSX files that contain Icon with these classNames
const grepResult = execSync(
	`grep -rn 'className="\\(${Object.keys(ICON_MAP).join('\\|')}\\)"' src/ts/component/ --include='*.tsx' -l`,
	{ encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

let totalChanges = 0;

for (const file of grepResult) {
	let content = readFileSync(file, 'utf-8');
	let changed = false;

	for (const [ cls, name ] of Object.entries(ICON_MAP)) {
		// Pattern: <Icon ... className="iconName" ... /> or className="iconName ..."
		// Add name prop before className

		// Match Icon components with this exact className (possibly with other classes)
		const patterns = [
			// className="iconName" (exact, no other classes)
			new RegExp(`(<Icon\\b[^>]*?)\\bclassName="${cls}"`, 'g'),
			// className="iconName otherClass" (with trailing classes)
			new RegExp(`(<Icon\\b[^>]*?)\\bclassName="${cls} `, 'g'),
		];

		for (const pattern of patterns) {
			const newContent = content.replace(pattern, (match, before) => {
				// Don't add name if already has one
				if (before.includes('name=')) return match;
				// For pattern with trailing space, preserve the space
				if (match.endsWith(' ')) {
					return `${before}name="${name}" className="${cls} `;
				}
				return `${before}name="${name}" className="${cls}"`;
			});

			if (newContent !== content) {
				content = newContent;
				changed = true;
			}
		}
	}

	if (changed) {
		writeFileSync(file, content);
		totalChanges++;
		console.log(`Updated: ${file}`);
	}
}

console.log(`\nTotal files updated: ${totalChanges}`);
