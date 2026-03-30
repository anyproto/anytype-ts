#!/usr/bin/env bun
/**
 * Migrates menu item `icon: 'name'` to `iconParam: { name: 'menu/action/name' }`
 * in TypeScript files. Only converts icons that exist in the menu/action registry.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Get list of registered menu/action icons
const menuActionDir = 'src/ts/component/util/icons/menu/action';
const registeredIcons = new Set(
	readdirSync(menuActionDir)
		.filter(f => f.endsWith('.tsx') && f !== 'index.ts')
		.map(f => f.replace('.tsx', ''))
);

// Also add common icons that were moved there
const commonIcons = new Set(['bin', 'clock', 'qr', 'more', 'expand']);

// Aliases: CSS className -> registry name
const aliases: Record<string, string> = {
	'go-url': 'menu/action/browse',
	'go-email': 'menu/action/email',
	'go-phone': 'menu/action/phone',
	'openSidebar': 'menu/action/sidebar',
	'advanced': 'common/more',
	'editText': 'menu/action/rename',
	'remove-red': 'menu/action/remove',
	'leave-red': 'menu/action/leave-red',
};

// Find all TS/TSX files that contain `icon: '`
const files = execSync(
	`grep -rn "icon: '" src/ts/ --include='*.ts' --include='*.tsx' -l`,
	{ encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

let totalChanges = 0;

for (const file of files) {
	let content = readFileSync(file, 'utf-8');
	let changed = false;

	// Match icon: 'iconName' patterns (with various quoting)
	const pattern = /\bicon:\s*'([^']+)'/g;

	const newContent = content.replace(pattern, (match, iconName: string) => {
		// Check if this icon has an alias
		if (aliases[iconName]) {
			changed = true;
			return `iconParam: { name: '${aliases[iconName]}' }`;
		}

		// Check if it's a registered menu/action icon
		if (registeredIcons.has(iconName)) {
			changed = true;
			return `iconParam: { name: 'menu/action/${iconName}' }`;
		}

		// Check if it's a common icon
		if (commonIcons.has(iconName)) {
			changed = true;
			return `iconParam: { name: 'common/${iconName}' }`;
		}

		// Not a menu/action icon, leave as is
		return match;
	});

	if (changed) {
		writeFileSync(file, newContent);
		totalChanges++;
		console.log(`Updated: ${file}`);
	}
}

console.log(`\nTotal files updated: ${totalChanges}`);
