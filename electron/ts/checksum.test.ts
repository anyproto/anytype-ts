import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./util', () => ({ default: { log: vi.fn() } }));

import { fileChecksums } from './checksum';

// Produced by core/files.checksum in anytype-heart for the same inputs. If these
// drift, a local copy of a file stops being recognised as the object's own
const VECTORS = [
	{ content: '', encrypted: 'DOQ0N77VMDT9H7558JJBMU0A5HS9079VMCRJGTK526HGC5TFK0EG', plain: '9FQH4BPK8LACAEUU5QTOPKLNSF8M02MM671OB9ENPJH3OTS58MD0' },
	{ content: 'hello', encrypted: 'UENFSOKMBA8P0DGGU3H3PI56JLDOFJL6QA77AI4R1KMA0BMNJ4U0', plain: 'I7FEOV02SS5JHV3N1IC1MOTB5I2964D903RO2FKD261321URO30G' },
	{ content: 'The quick brown fox', encrypted: 'MLMBBKNII2Q1P3AO6O3TJQGPTE2AC854BJGJ7SAV62C04F6R2QFG', plain: 'N6FDKDSAG2DG10849FA3AI6GIEP53OM18H6PGBKK61KLLA7LL7E0' },
];

let dir = '';

const write = (content: string): string => {
	const fp = path.join(dir, 'file.bin');

	fs.writeFileSync(fp, content);
	return fp;
};

beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-checksum-'));
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('fileChecksums', () => {
	test.each(VECTORS)('matches the middleware for $content', async ({ content, encrypted, plain }) => {
		// Both flavors: the middleware appends a byte that says whether the file
		// was stored encrypted, and a client cannot tell which from the outside
		await expect(fileChecksums(write(content))).resolves.toEqual([ encrypted, plain ]);
	});

	test('reports nothing for a file it cannot read, rather than throwing', async () => {
		await expect(fileChecksums(path.join(dir, 'missing.bin'))).resolves.toEqual([]);
	});

	test('reads the file in chunks, so a large one costs no memory', async () => {
		const fp = path.join(dir, 'large.bin');
		const chunk = Buffer.alloc(1024 * 1024, 7);

		fs.writeFileSync(fp, Buffer.concat([ chunk, chunk, chunk ]));

		const [ encrypted ] = await fileChecksums(fp);

		// 52 base32 characters for a 33-byte digest, unpadded
		expect(encrypted).toMatch(/^[0-9A-V]{52}$/);
	});
});
