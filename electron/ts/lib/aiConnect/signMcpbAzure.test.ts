/**
 * scripts/sign-mcpb-azure.js: Anytype.mcpb signed remotely with the Windows code-signing certificate in Azure Key
 * Vault. Azure is a local fake (testSigning.ts) answering with a test PKI's leaf and key; no network.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { tempDir } from './testEnv';
import { AZURE, KID, LEAKS, SIGNING_ENV, SUBJECT, TOKEN, VAULT, failWith, fakeAzure, rs256, testChainCheck, testPki, type TestPki } from './testSigning';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const signer = require('../../../../scripts/sign-mcpb-azure.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const verifier = require('../../../hook/verify-forwarder.js');

const MCPB_DIR = path.dirname(require.resolve('@anthropic-ai/mcpb'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge = require(require.resolve('node-forge', { paths: [ MCPB_DIR ] }));
const mcpb = () => import(pathToFileURL(path.join(MCPB_DIR, 'node', 'sign.js')).href);

const hasOpenssl = (() => {
	try {
		execFileSync('openssl', [ 'version' ], { stdio: 'pipe' });
		return true;
	} catch (e) {
		return false;
	};
})();

const sha256 = (buf: Buffer) => crypto.createHash('sha256').update(buf).digest('hex');
const NOW = new Date('2026-11-28T12:34:56Z');

let pki: TestPki;
let dir = '';
let file = '';
let archive: Buffer;

beforeAll(() => {
	pki = testPki();
});

beforeEach(() => {
	dir = tempDir('aic-sign-');
	file = path.join(dir, 'Anytype.mcpb');
	// Stands in for the stored zip build-mcp writes (the signer signs whatever bytes it is given)
	archive = Buffer.concat([ Buffer.from('PK\u0003\u0004'), crypto.randomBytes(64 * 1024), Buffer.from('PK\u0005\u0006') ]);
	fs.writeFileSync(file, archive);
});

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true });
	vi.useRealTimers();
	vi.restoreAllMocks();
});

/** A signing run against the fake Azure; `over` replaces the fake's options */
const sign = (azure = fakeAzure(pki.leaf), over: Record<string, any> = {}) => signer.sign(file, {
	env: SIGNING_ENV, fetch: azure.fetch, chain: pki.chain, chainCheck: testChainCheck(pki.root.der), now: NOW, sleep: async () => {}, ...over,
});

/** The message of a failed run (or '' when it passed) */
const failure = async (run: Promise<any>): Promise<string> => {
	try {
		await run;
		return '';
	} catch (e) {
		return String(e?.stack || e);
	};
};

describe('sign-mcpb-azure', () => {
	test('the signature is byte for byte what `mcpb sign` writes with the same certificate, chain, key and time', async () => {
		const azure = fakeAzure(pki.leaf);
		const res = await sign(azure);
		const ours = fs.readFileSync(file);

		expect(res).toEqual({ fingerprint: sha256(pki.leaf.der), subject: SUBJECT, status: 'signed' });

		// mcpb's own signMcpbFile, with the leaf's private key in a file and its clock at the same second
		const copy = path.join(dir, 'mcpb-signed.mcpb');
		const files = { cert: path.join(dir, 'leaf.pem'), key: path.join(dir, 'leaf.key'), inter: path.join(dir, 'inter.pem'), root: path.join(dir, 'root.pem') };

		fs.writeFileSync(copy, archive);
		fs.writeFileSync(files.cert, pki.leaf.pem);
		fs.writeFileSync(files.key, pki.leaf.keyPem);
		fs.writeFileSync(files.inter, pki.intermediate.pem);
		fs.writeFileSync(files.root, pki.root.pem);

		const { signMcpbFile } = await mcpb();

		vi.useFakeTimers({ toFake: [ 'Date' ] });
		vi.setSystemTime(NOW);
		signMcpbFile(copy, files.cert, files.key, [ files.inter, files.root ]);
		vi.useRealTimers();

		expect(ours.equals(fs.readFileSync(copy))).toBe(true);

		// One token, one certificate, one signature; the digest Key Vault signed is the SHA-256 of the DER SET of the
		// authenticated attributes, and the request carried nothing else
		expect(azure.calls.map(c => c.kind)).toEqual([ 'token', 'certificate', 'sign' ]);

		const sd = signer.splitSigned(ours);
		const parsed = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(sd.signature.toString('binary')));
		const attrs = parsed.rawCapture.signerInfos[0].value[3];
		const set = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attrs.value);
		const digest = crypto.createHash('sha256').update(Buffer.from(forge.asn1.toDer(set).getBytes(), 'binary')).digest();

		expect(JSON.parse(azure.calls[2].init.body)).toEqual({ alg: 'RS256', value: digest.toString('base64url') });
	});

	test('mcpb\'s own code reads it: extractSignatureBlock, forge\'s SignedData with the leaf first, unsignMcpbFile gives back the archive', async () => {
		await sign();

		const { extractSignatureBlock, unsignMcpbFile } = await mcpb();
		const signed = fs.readFileSync(file);
		const { originalContent, pkcs7Signature } = extractSignatureBlock(signed);
		const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(pkcs7Signature.toString('binary')));

		expect(originalContent.equals(archive)).toBe(true);
		expect(p7.type).toBe(forge.pki.oids.signedData);
		expect(p7.certificates.map((c: any) => c.subject.getField('CN').value)).toEqual([ 'Any Association', 'Anytype Test CodeSigning CA', 'Anytype Test Root CA' ]);
		// The fingerprint mcpb (and so Claude) records for the signer is the one the build writes
		expect(forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(p7.certificates[0])).getBytes()).digest().toHex()).toBe(sha256(pki.leaf.der));

		unsignMcpbFile(file);
		expect(fs.readFileSync(file).equals(archive)).toBe(true);
	});

	test('the PKCS#7 signature verifies (verify, and openssl cms against the test root); a changed byte of the archive or the signature fails', async () => {
		await sign();

		const chainCheck = testChainCheck(pki.root.der);
		const res = await signer.verify(file, { chainCheck });

		expect(res).toMatchObject({ status: 'signed', subject: SUBJECT, publisher: 'Any Association', issuer: 'Anytype Test CodeSigning CA', fingerprint: sha256(pki.leaf.der) });
		// Without a chain check (a host with no OS check) only the signature is verified
		expect((await signer.verify(file, { chainCheck: null })).status).toBe('not-checked');
		// A chain the OS doesn't trust
		expect((await signer.verify(file, { chainCheck: async () => false, sleep: async () => {} })).status).toBe('untrusted');

		const signed = fs.readFileSync(file);
		const { signature } = signer.splitSigned(signed);

		if (hasOpenssl) {
			fs.writeFileSync(path.join(dir, 'sig.der'), signature);
			fs.writeFileSync(path.join(dir, 'content.bin'), archive);
			fs.writeFileSync(path.join(dir, 'root.pem'), pki.root.pem);
			expect(() => execFileSync('openssl', [
				'cms', '-verify', '-binary', '-inform', 'DER', '-in', path.join(dir, 'sig.der'), '-content', path.join(dir, 'content.bin'),
				'-CAfile', path.join(dir, 'root.pem'), '-purpose', 'any', '-out', path.join(dir, 'out.bin'),
			], { stdio: 'pipe' })).not.toThrow();
		};

		const tampered = Buffer.from(signed);

		tampered[100] ^= 0x01;
		fs.writeFileSync(path.join(dir, 'tampered.mcpb'), tampered);
		await expect(signer.verify(path.join(dir, 'tampered.mcpb'), { chainCheck })).rejects.toThrow(/messageDigest is not the archive's SHA-256/);

		// The last byte of the RSA signature (just before the footer)
		const badSig = Buffer.from(signed);

		badSig[signed.length - 'MCPB_SIG_END'.length - 1] ^= 0x01;
		fs.writeFileSync(path.join(dir, 'badsig.mcpb'), badSig);
		await expect(signer.verify(path.join(dir, 'badsig.mcpb'), { chainCheck })).rejects.toThrow(/does not verify with the signer certificate/);

		await expect(signer.verify(path.join(dir, 'root.pem'), { chainCheck })).rejects.toThrow(/no signature block/);
	});

	test('a certificate of another publisher is refused before anything is signed, and the file stays unsigned', async () => {
		const azure = fakeAzure(pki.other);
		const message = await failure(sign(azure));

		expect(message).toMatch(/not Anytype's Windows publisher: its subject is "O=Someone Else, CN=Someone Else", WIN_PUBLISHER_SUBJECT is "E=association@anytype\.io, CN=Any Association/);
		expect(azure.count('sign')).toBe(0);
		expect(fs.readFileSync(file).equals(archive)).toBe(true);
	});

	test('the expected subject is WIN_PUBLISHER_SUBJECT from the environment, compared exactly', async () => {
		// Another order of the same RDNs, or one more space, is another subject
		for (const wrong of [ 'C=CH, S=Zug, L=Zug, O=Any Association, CN=Any Association, E=association@anytype.io', SUBJECT.replace(', ', ',  ') ]) {
			const azure = fakeAzure(pki.leaf);

			expect(await failure(sign(azure, { env: { ...SIGNING_ENV, WIN_PUBLISHER_SUBJECT: wrong } }))).toMatch(/not Anytype's Windows publisher/);
			expect(azure.count('sign')).toBe(0);
		};
		expect(verifier.winPublisherSubject({ WIN_PUBLISHER_SUBJECT: ` ${SUBJECT}\n` })).toBe(SUBJECT);
		expect(verifier.winPublisherSubject({})).toBe('');

		// The Windows signature check of the forwarder reads the same variable
		const before = process.env.WIN_PUBLISHER_SUBJECT;

		try {
			delete process.env.WIN_PUBLISHER_SUBJECT;
			expect(() => verifier.verifyWindowsSignature('x', () => `Valid|True|${SUBJECT}`)).toThrow(/WIN_PUBLISHER_SUBJECT is not set/);
			process.env.WIN_PUBLISHER_SUBJECT = SUBJECT;
			expect(() => verifier.verifyWindowsSignature('x', () => `Valid|True|${SUBJECT}`)).not.toThrow();
			expect(() => verifier.verifyWindowsSignature('x', () => 'Valid|True|CN=Any Association')).toThrow(/another publisher/);
		} finally {
			if (before === undefined) {
				delete process.env.WIN_PUBLISHER_SUBJECT;
			} else {
				process.env.WIN_PUBLISHER_SUBJECT = before;
			};
		};
	});

	test('a non-RSA key is refused clearly', async () => {
		expect(await failure(sign(fakeAzure(pki.leaf, {}, { kty: 'EC-HSM' })))).toMatch(/key in Key Vault is EC-HSM, not RSA/);
		expect(fs.readFileSync(file).equals(archive)).toBe(true);
	});

	test.skipIf(!hasOpenssl)('a certificate with an EC key is refused clearly', async () => {
		const key = path.join(dir, 'ec.key');
		const cert = path.join(dir, 'ec.pem');

		execFileSync('openssl', [ 'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=EC Test' ], { stdio: 'pipe' });

		const der = signer.pemBlocks(fs.readFileSync(cert, 'utf8'))[0];
		const message = await failure(sign(fakeAzure({ ...pki.leaf, der }, {}, { kty: 'RSA' })));

		expect(message).toMatch(/certificate's key is ec, not RSA/);
	});

	test('a Key Vault signature that does not belong to the certificate fails before the file is written', async () => {
		const wrongKey: any = ({ init }) => {
			const digest = Buffer.from(JSON.parse(init.body).value, 'base64url');
			return new Response(JSON.stringify({ kid: KID, value: rs256(pki.other.key, digest).toString('base64url') }), { status: 200 });
		};

		expect(await failure(sign(fakeAzure(pki.leaf, { sign: wrongKey })))).toMatch(/Key Vault's signature does not verify with the certificate's public key/);
		expect(fs.readFileSync(file).equals(archive)).toBe(true);
	});

	test('a chain the leaf was not issued by fails with a message that names the renewal', async () => {
		expect(await failure(sign(fakeAzure(pki.stranger)))).toMatch(/did not issue the Key Vault certificate .*renewed under another CA/);
	});

	test('an untrusted chain fails where the chain is checked; without a check the signature alone is verified', async () => {
		expect(await failure(sign(fakeAzure(pki.leaf), { chainCheck: async () => false }))).toMatch(/certificate chain is untrusted for code signing.*Claude Desktop would show it as unsigned/);
		expect(fs.readFileSync(file).equals(archive)).toBe(true);

		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

		expect((await sign(fakeAzure(pki.leaf), { chainCheck: null })).status).toBe('not-checked');
		expect(JSON.stringify(spy.mock.calls)).toContain('the certificate chain is not checked');
	});

	describe('Azure failures fail loudly, retry what may pass, and never print a value', () => {
		const cases: [ string, () => ReturnType<typeof fakeAzure>, RegExp, Record<string, number> ][] = [
			[ 'a wrong client secret', () => fakeAzure(pki.leaf, { token: failWith(401, { error: 'invalid_client', error_description: `AADSTS7000215: Invalid client secret provided. Ensure the secret being sent in the request is the client secret value, not the client secret ID, for a secret added to app '${AZURE.AZURE_CLIENT_ID}'.`, error_codes: [ 7000215 ] }) }), /the Azure AD token request failed: HTTP 401 \(invalid_client, AADSTS7000215\)$/m, { token: 1 } ],
			[ 'no access to the certificate', () => fakeAzure(pki.leaf, { certificate: failWith(403, { error: { code: 'Forbidden', message: `The user, group or application '${AZURE.AZURE_CLIENT_ID}' does not have certificates get permission on key vault '${VAULT}'`, innererror: { code: 'AccessDenied' } } }) }), /the Key Vault certificate request failed: HTTP 403 \(Forbidden, AccessDenied\)$/m, { certificate: 1 } ],
			[ 'Key Vault down on every attempt', () => fakeAzure(pki.leaf, { sign: failWith(503, { error: { code: 'ServiceUnavailable', message: KID } }) }), /the Key Vault sign request failed: HTTP 503 \(ServiceUnavailable\) \(after 3 attempts\)/, { sign: 3 } ],
			[ 'throttled on every attempt', () => fakeAzure(pki.leaf, { token: failWith(429, { error: 'temporarily_unavailable' }) }), /token request failed: HTTP 429 \(temporarily_unavailable\) \(after 3 attempts\)/, { token: 3 } ],
			[ 'no such host', () => fakeAzure(pki.leaf, { certificate: () => { throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(`getaddrinfo ENOTFOUND ${new URL(VAULT).host}`), { code: 'ENOTFOUND' }) }); } }), /the Key Vault certificate request failed: network error \(ENOTFOUND\) \(after 3 attempts\)/, { certificate: 3 } ],
			[ 'an answer that is not JSON', () => fakeAzure(pki.leaf, { token: () => new Response(`<html>${TOKEN}</html>`, { status: 200 }) }), /token request failed: the answer is not JSON/, { token: 1 } ],
			[ 'a key id outside the vault', () => fakeAzure(pki.leaf, {}, { kid: `https://elsewhere.vault.azure.net/keys/${AZURE.AZURE_CERT_NAME}/1` }), /no versioned key id of the same vault/, { sign: 0 } ],
			[ 'an unversioned key id', () => fakeAzure(pki.leaf, {}, { kid: `${VAULT}/keys/${AZURE.AZURE_CERT_NAME}` }), /no versioned key id of the same vault/, { sign: 0 } ],
			[ 'a disabled certificate', () => fakeAzure(pki.leaf, {}, { enabled: false }), /the certificate in Key Vault is disabled/, { sign: 0 } ],
			[ 'no signature in the answer', () => fakeAzure(pki.leaf, { sign: () => new Response(JSON.stringify({ kid: KID }), { status: 200 }) }), /Key Vault returned no signature/, { sign: 1 } ],
		];

		test.each(cases)('%s', async (_name, make, expected, counts) => {
			const out = vi.spyOn(console, 'log').mockImplementation(() => {});
			const err = vi.spyOn(console, 'error').mockImplementation(() => {});
			const azure = make();
			const message = await failure(sign(azure));
			const output = message + JSON.stringify(out.mock.calls) + JSON.stringify(err.mock.calls);

			expect(message).toMatch(expected);
			for (const [ kind, n ] of Object.entries(counts)) {
				expect(azure.count(kind as any), kind).toBe(n);
			};
			for (const leak of LEAKS) {
				expect(output, leak).not.toContain(leak);
			};
			expect(fs.readFileSync(file).equals(archive)).toBe(true);
		});

		test('a passing retry signs; the retries wait as Retry-After says', async () => {
			const waits: number[] = [];
			const azure = fakeAzure(pki.leaf, { sign: failWith(503, { error: { code: 'ServiceUnavailable' } }, 1), token: ({ n }) => (n == 1) ? new Response('{}', { status: 429, headers: { 'retry-after': '2' } }) : undefined });

			expect((await sign(azure, { sleep: async (ms: number) => { waits.push(ms); } })).status).toBe('signed');
			expect(azure.calls.map(c => c.kind)).toEqual([ 'token', 'token', 'certificate', 'sign', 'sign' ]);
			expect(waits).toEqual([ 2000, 1000 ]);
		});

		test('a request with no answer times out', async () => {
			const hang: any = ({ init }) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
			const message = await failure(sign(fakeAzure(pki.leaf, { token: hang }), { timeoutMs: 50, attempts: 1 }));

			expect(message).toMatch(/token request failed: no answer within 0.05 s/);
		});

		test('missing settings and a bad vault URL fail before any request', async () => {
			const azure = fakeAzure(pki.leaf);

			expect(await failure(sign(azure, { env: { ...SIGNING_ENV, AZURE_CLIENT_SECRET: '', AZURE_CERT_NAME: ' ' } }))).toMatch(/AZURE_CLIENT_SECRET, AZURE_CERT_NAME are not set/);
			expect(await failure(sign(azure, { env: AZURE }))).toMatch(/WIN_PUBLISHER_SUBJECT is not set/);
			expect(await failure(sign(azure, { env: { ...SIGNING_ENV, AZURE_KEY_VAULT_URI: 'http://sentinel-vault-7f3a.vault.azure.net/' } }))).toMatch(/AZURE_KEY_VAULT_URI is not a vault URL/);
			expect(await failure(sign(azure, { env: { ...SIGNING_ENV, AZURE_TENANT_ID: '../x' } }))).toMatch(/AZURE_TENANT_ID is not a tenant id/);
			expect(azure.calls).toEqual([]);
			expect(signer.missingSettings({ AZURE_KEY_VAULT_URI: 'x' })).toEqual([ 'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME', 'WIN_PUBLISHER_SUBJECT' ]);
		});

		test('a signed file is not signed again', async () => {
			await sign();

			const signed = fs.readFileSync(file);

			expect(await failure(sign())).toMatch(/is signed already/);
			expect(fs.readFileSync(file).equals(signed)).toBe(true);
		});
	});

	describe('the committed chain and the publisher', () => {
		// The public certificate of Anytype's released Windows builds (from the Authenticode signature of
		// Anytype.Setup.0.57.9-alpha.exe), valid to 2027-07-03
		const released = () => signer.pemBlocks(fs.readFileSync(path.join(__dirname, 'testdata', 'anytype-windows-signer.pem'), 'utf8'))[0];

		test('the chain file holds exactly the pinned certificates, and GlobalSign GCC R45 CodeSigning CA 2020 issued Anytype\'s certificate', () => {
			const chain: Buffer[] = signer.loadChain();
			const certs = [ released(), ...chain ].map(c => new crypto.X509Certificate(c));

			expect(chain.map(c => sha256(c))).toEqual(signer.CHAIN_SHA256);
			expect(certs.map(c => /CN=([^\n]+)/.exec(c.subject)[1])).toEqual([ 'Any Association', 'GlobalSign GCC R45 CodeSigning CA 2020', 'GlobalSign Code Signing Root R45' ]);
			for (let i = 0; i < 2; i++) {
				expect(certs[i].checkIssued(certs[i + 1]) && certs[i].verify(certs[i + 1].publicKey), `certificate ${i}`).toBe(true);
			};
			// The cross certificate chains to GlobalSign Root CA - R3, the anchor macOS trusts
			expect(certs[2].issuer).toContain('OU=GlobalSign Root CA - R3');

			const edited = path.join(dir, 'chain.pem');

			fs.writeFileSync(edited, fs.readFileSync(signer.CHAIN_FILE, 'utf8').replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----\s*$/, ''));
			expect(() => signer.loadChain(edited)).toThrow(/does not hold the 2 certificates pinned/);
		});

		test('Anytype\'s released certificate formats, the way Windows prints it, to the WIN_PUBLISHER_SUBJECT the docs say to set', () => {
			expect(signer.dotnetSubject(released())).toBe('E=association@anytype.io, CN=Any Association, O=Any Association, L=Zug, S=Zug, C=CH');
			expect(signer.dotnetSubject(released())).toBe(SUBJECT);
			expect(signer.dotnetSubject(pki.leaf.der)).toBe(SUBJECT);
			for (const doc of [ 'docs/electron/README.md', 'electron/hook/verify-forwarder.js' ]) {
				expect(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', doc), 'utf8'), doc).toContain(`\`${SUBJECT}\``);
			};
		});

		test('a value Windows would quote is quoted', () => {
			const cert = forge.pki.createCertificate();
			const key = forge.pki.privateKeyFromPem(pki.root.keyPem);

			cert.publicKey = forge.pki.setRsaPublicKey(key.n, key.e);
			cert.serialNumber = '01';
			cert.validity.notBefore = new Date(NOW.getTime() - 1000);
			cert.validity.notAfter = new Date(NOW.getTime() + 1000);
			cert.setSubject([ { shortName: 'C', value: 'CH' }, { shortName: 'O', value: 'Any, "Association"' }, { shortName: 'CN', value: ' Any' } ]);
			cert.setIssuer(cert.subject.attributes);
			cert.sign(key, forge.md.sha256.create());

			const der = Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes(), 'binary');

			expect(signer.dotnetSubject(der)).toBe('CN=" Any", O="Any, ""Association""", C=CH');
		});

		const releasedValid = () => {
			try {
				return new Date() < new Date(new crypto.X509Certificate(released()).validTo);
			} catch (e) {
				return false;
			};
		};

		test.skipIf((process.platform != 'darwin') || !releasedValid())('macOS trusts Anytype\'s certificate with the committed chain for code signing, from local certificates only; without the cross certificate it does not', async () => {
			const chain: Buffer[] = signer.loadChain();

			expect(await signer.macChainTrusted([ released(), ...chain ], { offline: true })).toBe(true);
			expect(await signer.macChainTrusted([ released(), chain[0] ], { offline: true })).toBe(false);
		});
	});
});
