import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CATALOG } from './catalog';
import { AI_APP_ICONS, aiAppIconFile, aiAppIconPath, aiAppIconUrl } from './icons';
import AiAppIcon from '../../component/util/aiAppIcon';

const IMG = path.resolve(__dirname, '../../../img');
const LIGHT = path.join(IMG, 'icon/aiApp');
const DARK = path.join(IMG, 'theme/dark/icon/aiApp');
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

/** The file a card's mark comes from, for a theme path */
const fileOf = (appId: string, themePath: string): string => {
	const file = aiAppIconPath(appId, themePath);
	return file ? path.join(IMG, file) : '';
};

/** A URL as React writes it into the src attribute */
const srcAttr = (url: string): string => renderToStaticMarkup(React.createElement('img', { src: url })).match(/src="([^"]*)"/)[1];

const svgs = (dir: string): string[] => fs.readdirSync(dir).filter(n => n.endsWith('.svg')).map(n => path.join(dir, n));

let theme = '';

beforeEach(() => {
	theme = '';
	vi.stubGlobal('S', { Common: { getThemePath: () => theme } });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('bundled AI app icons', () => {
	test('every catalog card resolves to a mark file that exists, in both themes', () => {
		expect(Object.keys(AI_APP_ICONS).sort()).toEqual(CATALOG.map(it => it.id).sort());

		for (const item of CATALOG) {
			const file = aiAppIconFile(item.id);
			const darkFile = path.join(DARK, `${file}.svg`);

			expect(fs.existsSync(path.join(LIGHT, `${file}.svg`))).toBe(true);
			expect(fileOf(item.id, '')).toBe(path.join(LIGHT, `${file}.svg`));
			// The dark variant when there is one, else the same mark
			expect(fileOf(item.id, 'theme/dark/')).toBe(fs.existsSync(darkFile) ? darkFile : path.join(LIGHT, `${file}.svg`));
			expect(aiAppIconUrl(item.id, '')).toBeTruthy();
			expect(aiAppIconUrl(item.id, 'theme/dark/')).toBeTruthy();
		};
	});

	test('monochrome marks have a dark variant; Claude and LM Studio keep their colors in both themes', () => {
		for (const id of [ 'chatgpt', 'codex', 'cursor', 'vscode', 'other' ]) {
			expect(fileOf(id, 'theme/dark/')).toBe(path.join(DARK, `${aiAppIconFile(id)}.svg`));
			expect(aiAppIconUrl(id, 'theme/dark/')).not.toBe(aiAppIconUrl(id, ''));
		};
		for (const id of [ 'claude-desktop', 'claude-code', 'lmstudio' ]) {
			expect(aiAppIconUrl(id, 'theme/dark/')).toBe(aiAppIconUrl(id, ''));
		};
		expect(fs.readFileSync(path.join(LIGHT, 'claude.svg'), 'utf8')).toContain('fill="#D97757"');
	});

	test('an unknown card has no mark', () => {
		for (const id of [ '', 'nope', 'ollama', 'constructor', '__proto__' ]) {
			expect(aiAppIconFile(id)).toBe('');
			expect(aiAppIconPath(id, 'theme/dark/')).toBe('');
			expect(aiAppIconUrl(id, 'theme/dark/')).toBe('');
		};
	});

	test('the shipped SVGs are drawings only: no script, no event attributes, no external references, no comments', () => {
		const files = svgs(LIGHT).concat(svgs(DARK));

		expect(files.length).toBeGreaterThanOrEqual(Object.keys(AI_APP_ICONS).length);
		for (const file of files) {
			const s = fs.readFileSync(file, 'utf8');

			expect(s.trim().startsWith('<svg ')).toBe(true);
			expect(s).toMatch(/\sviewBox="[^"]+"/);
			expect(s).not.toMatch(/<script|<foreignObject|<iframe|<image|<use\b|<a\b|<style|<!--|<\?xml|<!DOCTYPE|<metadata|<title/i);
			expect(s).not.toMatch(/\son[a-z]+\s*=/i);
			expect(s).not.toMatch(/href\s*=/i);
			expect(s).not.toMatch(/javascript:/i);
			// url() only points inside the file (a gradient)
			expect((s.match(/url\(([^)]*)\)/g) || []).every(u => /^url\(#[\w-]+\)$/.test(u))).toBe(true);
		};
	});
});

describe('NOTICE', () => {
	test('names every shipped mark, carries the MIT texts and the trademark statement, and ships in the package', () => {
		const notice = fs.readFileSync(path.join(LIGHT, 'NOTICE.md'), 'utf8');
		const root = path.resolve(__dirname, '../../../..');
		const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
		const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

		for (const file of svgs(LIGHT)) {
			expect(notice).toContain(`\`${path.basename(file)}\``);
		};
		expect(notice).toContain('Copyright (c) 2023 LobeHub');
		expect(notice).toContain('Copyright (c) 2026 GitHub Inc.');
		expect(notice).toContain('do not imply endorsement');
		// Copied by the build into dist/assets, which electron-builder packages
		expect(vite).toContain(`{ src: 'src/img/icon/aiApp/NOTICE.md', dest: 'assets/licenses', rename: 'aiAppIcons.md' }`);
		expect(pkg.build.files).toContain('dist/assets/**/*');
	});
});

describe('AiAppIcon', () => {
	const render = (props: any) => renderToStaticMarkup(React.createElement(AiAppIcon, props));

	test('a card shows its bundled mark first, for the theme', () => {
		const light = render({ appId: 'cursor', name: 'Cursor', icon: PNG });

		expect(light).toContain('aiAppIcon isMark');
		expect(light).toContain(`src="${srcAttr(aiAppIconUrl('cursor', ''))}"`);

		theme = 'theme/dark/';
		expect(render({ appId: 'cursor', name: 'Cursor' })).toContain(`src="${srcAttr(aiAppIconUrl('cursor', 'theme/dark/'))}"`);
	});

	test('no mark: the installed app\'s PNG, else the letter', () => {
		const png = render({ appId: 'nope', name: 'Foo', icon: PNG });

		expect(png).toContain('aiAppIcon withImage');
		expect(png).toContain(`src="${PNG}"`);

		const letter = render({ appId: 'nope', name: 'foo' });

		expect(letter).toContain('aiAppIcon isLetter');
		expect(letter).toContain('>F<');
		expect(render({ name: 'Bar', icon: 'data:image/svg+xml,<svg/>' })).toContain('>B<');
	});
});
