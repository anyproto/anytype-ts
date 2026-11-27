import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { MARKER_BEGIN, MARKER_END, build, hasMarker, splitFrontmatter } from './skill';

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const VENDORED = fs.readFileSync(path.join(ROOT, 'vendor', 'anytype-api-skill', 'SKILL.md'), 'utf8');
const PREAMBLE = fs.readFileSync(path.join(ROOT, 'electron', 'mcp', 'skill-preamble.md'), 'utf8');

describe('skill.build', () => {
	test('frontmatter first, then the marked preamble, then the vendored body unchanged', () => {
		const parts = splitFrontmatter(VENDORED);
		const out = build(VENDORED, PREAMBLE);

		expect(parts).not.toBeNull();
		expect(out.startsWith(parts.frontmatter)).toBe(true);
		expect(out.endsWith(parts.body)).toBe(true);
		expect(out.slice(parts.frontmatter.length).trimStart().startsWith(MARKER_BEGIN)).toBe(true);
		expect(out.indexOf(MARKER_END)).toBeLessThan(out.length - parts.body.length);
		expect(out.split(MARKER_BEGIN)).toHaveLength(2);
		expect(hasMarker(out)).toBe(true);
		expect(hasMarker(VENDORED)).toBe(false);
		expect(hasMarker(null)).toBe(false);
	});

	test('the frontmatter still parses as the first block (name and description intact)', () => {
		const out = build(VENDORED, PREAMBLE);

		expect(out.startsWith('---\nname: anytype-api\n')).toBe(true);
		expect(splitFrontmatter(out).frontmatter).toBe(splitFrontmatter(VENDORED).frontmatter);
	});

	test('no frontmatter, or a preamble without markers → null', () => {
		expect(build('# no frontmatter\n', PREAMBLE)).toBeNull();
		expect(build(VENDORED, 'plain text')).toBeNull();
	});

	test('the preamble covers the safety rules', () => {
		expect(PREAMBLE).toContain('curl -q --noproxy \'*\'');
		expect(PREAMBLE).toContain('curl.exe -q --noproxy \'*\'');
		expect(PREAMBLE).toContain('http://127.0.0.1:<digits>');
		expect(PREAMBLE).toContain('401');
		expect(PREAMBLE).toContain('403');
	});
});
