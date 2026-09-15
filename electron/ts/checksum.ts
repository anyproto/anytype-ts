import crypto from 'crypto';
import fs from 'fs';
import Util from './util';

// base32 with the extended hex alphabet and no padding, which is what
// multiformats/go-base32 RawHexEncoding produces
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV';

const encodeBase32Hex = (buffer: Buffer): string => {
	let ret = '';
	let value = 0;
	let bits = 0;

	for (const byte of buffer) {
		value = (value * 256) + byte;
		bits += 8;

		while (bits >= 5) {
			bits -= 5;
			ret += alphabet[Math.floor(value / Math.pow(2, bits)) & 31];
			value = value % Math.pow(2, bits);
		};
	};

	if (bits > 0) {
		ret += alphabet[(value * Math.pow(2, 5 - bits)) & 31];
	};

	return ret;
};

/**
 * The two checksums the middleware could have stored for this file's content.
 *
 * It hashes the bytes, appends one byte saying whether the file was stored
 * unencrypted, and base32-encodes the result (core/files.checksum). A client
 * cannot tell which flavor applies from the outside, so both are offered and
 * either one matching `fileVariantChecksums` proves the local file is this
 * object's own content.
 *
 * Resolves with an empty list when the file cannot be read: an unreadable
 * candidate simply is not a match.
 */
export const fileChecksums = (filePath: string): Promise<string[]> => {
	return new Promise<string[]>((resolve) => {
		const hash = crypto.createHash('sha256');
		const stream = fs.createReadStream(filePath);

		stream.on('error', (err: Error) => {
			Util.log('info', '[Checksum] Cannot read candidate:', err.toString());
			resolve([]);
		});

		stream.on('data', (chunk: Buffer) => {
			hash.update(chunk);
		});

		stream.on('end', () => {
			resolve([ 0, 1 ].map(flag => {
				const copy = hash.copy();

				copy.update(Buffer.from([ flag ]));
				return encodeBase32Hex(copy.digest());
			}));
		});
	});
};
