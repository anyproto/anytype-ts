/**
 * Test helpers for the Anytype.mcpb signer (scripts/sign-mcpb-azure.js), imported by *.test.ts only: a local test
 * PKI (root → intermediate → code-signing leaf, RSA keys generated here), a fake Azure (token, certificate and sign
 * endpoints answered with the leaf and its local key) and a chain check against the test root. No network.
 */
import crypto from 'crypto';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const forge = require(require.resolve('node-forge', { paths: [ path.dirname(require.resolve('@anthropic-ai/mcpb')) ] }));

/** Distinctive values, so a leak into any output is easy to find */
export const AZURE = {
	AZURE_KEY_VAULT_URI: 'https://sentinel-vault-7f3a.vault.azure.net/',
	AZURE_TENANT_ID: 'sentinel-tenant-5c1d9e2b',
	AZURE_CLIENT_ID: 'sentinel-client-0a9b8c7d',
	AZURE_CLIENT_SECRET: 'SENTINEL~secret.Zq8_Wv3-Xy7',
	AZURE_CERT_NAME: 'sentinel-cert-x91',
};
/** The subject of Anytype's Windows certificate as Windows prints it: the value of the repository variable WIN_PUBLISHER_SUBJECT */
export const SUBJECT = 'E=association@anytype.io, CN=Any Association, O=Any Association, L=Zug, S=Zug, C=CH';
/** What a signing build step gets: the Azure secrets and the publisher variable */
export const SIGNING_ENV = { ...AZURE, WIN_PUBLISHER_SUBJECT: SUBJECT };
export const VAULT = 'https://sentinel-vault-7f3a.vault.azure.net';
export const TOKEN = 'SENTINEL-token-eyJ0ZXN0LWFjY2Vzcy10b2tlbg';
export const KEY_VERSION = '9d3c1f0e8b7a6d5c4b3a291807f6e5d4';
export const KID = `${VAULT}/keys/${AZURE.AZURE_CERT_NAME}/${KEY_VERSION}`;

/** Every value that must never reach an output */
export const LEAKS = [ ...Object.values(AZURE), VAULT, 'sentinel-vault-7f3a', TOKEN, KID, KEY_VERSION ];

/** The subject of Anytype's Windows certificate, in DER order */
export const PUBLISHER = [
	{ shortName: 'C', value: 'CH' },
	{ shortName: 'ST', value: 'Zug' },
	{ shortName: 'L', value: 'Zug' },
	{ shortName: 'O', value: 'Any Association' },
	{ shortName: 'CN', value: 'Any Association' },
	{ name: 'emailAddress', value: 'association@anytype.io', valueTagClass: forge.asn1.Type.IA5STRING },
];

const SHA256_DIGEST_INFO = Buffer.from('3031300d060960864801650304020105000420', 'hex');

export interface TestCert {
	der: Buffer;
	pem: string;
	key: crypto.KeyObject;
	keyPem: string;
	forge: any;
};

export interface TestPki {
	root: TestCert;
	intermediate: TestCert;
	leaf: TestCert;
	/** The chain after the leaf, as the signer takes it */
	chain: Buffer[];
	/** A code-signing leaf of the same intermediate with another subject */
	other: TestCert;
	/** Same subject as `leaf`, issued by an unrelated CA */
	stranger: TestCert;
};

const keyPair = () => {
	const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
	const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

	return { key: privateKey, keyPem, forgeKey: forge.pki.privateKeyFromPem(keyPem) };
};

const issue = (subject: any[], opt: { issuer?: TestCert; ca?: boolean; codeSigning?: boolean } = {}): TestCert => {
	const pair = keyPair();
	const cert = forge.pki.createCertificate();
	const now = Date.now();

	cert.publicKey = forge.pki.setRsaPublicKey(pair.forgeKey.n, pair.forgeKey.e);
	cert.serialNumber = `01${crypto.randomBytes(8).toString('hex')}`;
	cert.validity.notBefore = new Date(now - (24 * 3600 * 1000));
	cert.validity.notAfter = new Date(now + (30 * 24 * 3600 * 1000));
	cert.setSubject(subject);
	cert.setIssuer(opt.issuer ? opt.issuer.forge.subject.attributes : subject);
	cert.setExtensions([
		{ name: 'basicConstraints', cA: !!opt.ca, critical: true },
		opt.ca ? { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true } : { name: 'keyUsage', digitalSignature: true, critical: true },
		...(opt.codeSigning ? [ { name: 'extKeyUsage', codeSigning: true } ] : []),
	]);
	cert.sign(opt.issuer ? forge.pki.privateKeyFromPem(opt.issuer.keyPem) : pair.forgeKey, forge.md.sha256.create());

	const der = Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes(), 'binary');

	return { der, pem: forge.pki.certificateToPem(cert), key: pair.key, keyPem: pair.keyPem, forge: cert };
};

/** A fresh PKI; RSA 2048 keeps it quick (the real key is 4096) */
export const testPki = (): TestPki => {
	const root = issue([ { shortName: 'CN', value: 'Anytype Test Root CA' } ], { ca: true });
	const intermediate = issue([ { shortName: 'CN', value: 'Anytype Test CodeSigning CA' } ], { ca: true, issuer: root });
	const leaf = issue(PUBLISHER, { issuer: intermediate, codeSigning: true });
	const other = issue([ { shortName: 'CN', value: 'Someone Else' }, { shortName: 'O', value: 'Someone Else' } ], { issuer: intermediate, codeSigning: true });
	const strangerCa = issue([ { shortName: 'CN', value: 'Unrelated CA' } ], { ca: true });
	const stranger = issue(PUBLISHER, { issuer: strangerCa, codeSigning: true });

	return { root, intermediate, leaf, chain: [ intermediate.der, root.der ], other, stranger };
};

/** The chain check of the signer, against the test root: each certificate issued by the next, ending at the root, a code-signing leaf */
export const testChainCheck = (root: Buffer) => async (certs: Buffer[]): Promise<boolean> => {
	const list = certs.map(c => new crypto.X509Certificate(c));

	for (let i = 0; i < (list.length - 1); i++) {
		if (!list[i].checkIssued(list[i + 1]) || !list[i].verify(list[i + 1].publicKey)) {
			return false;
		};
	};
	return certs[certs.length - 1].equals(root) && (list[0].keyUsage || []).includes('1.3.6.1.5.5.7.3.3');
};

export type Kind = 'token' | 'certificate' | 'sign' | 'other';

export interface Call {
	kind: Kind;
	url: string;
	init: any;
};

/** An endpoint's answer instead of the fake's own; `n` counts this endpoint's calls (1 = the first) */
export type Override = (req: { url: string; init: any; n: number }) => Promise<Response | undefined> | Response | undefined;

const json = (status: number, body: any) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** RS256 over a precomputed SHA-256 digest with a local key: what Key Vault's sign does */
export const rs256 = (key: crypto.KeyObject, digest: Buffer): Buffer => crypto.privateEncrypt({ key, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.concat([ SHA256_DIGEST_INFO, digest ]));

/**
 * Azure as the signer calls it: AAD's client-credentials token endpoint, Key Vault's GET certificate (the leaf and its
 * versioned key id) and POST sign (RS256 with the leaf's local key). Requests that aren't the expected ones get the
 * error Azure would give, so a malformed request fails the test.
 */
export const fakeAzure = (cert: TestCert, over: Partial<Record<Kind, Override>> = {}, answer: { kty?: string; kid?: string; enabled?: boolean } = {}) => {
	const calls: Call[] = [];

	const fetch = async (url: string, init: any = {}): Promise<Response> => {
		const u = new URL(url);
		const kind: Kind = (u.origin == 'https://login.microsoftonline.com') ? 'token' : (u.pathname.startsWith('/certificates/') ? 'certificate' : (u.pathname.endsWith('/sign') ? 'sign' : 'other'));

		calls.push({ kind, url, init });

		if (over[kind]) {
			const res = await over[kind]({ url, init, n: calls.filter(c => c.kind == kind).length });

			if (res) {
				return res;
			};
		};
		if ((init.redirect != 'error') || !(init.signal instanceof AbortSignal)) {
			return json(400, { error: 'test_request_without_timeout_or_redirect_guard' });
		};

		const bearer = (init.headers?.authorization == `Bearer ${TOKEN}`);

		switch (kind) {
			case 'token': {
				const form = new URLSearchParams(String(init.body || ''));
				const ok = (init.method == 'POST') && (u.pathname == `/${AZURE.AZURE_TENANT_ID}/oauth2/v2.0/token`) && (init.headers?.['content-type'] == 'application/x-www-form-urlencoded')
					&& (form.get('client_id') == AZURE.AZURE_CLIENT_ID) && (form.get('client_secret') == AZURE.AZURE_CLIENT_SECRET)
					&& (form.get('grant_type') == 'client_credentials') && (form.get('scope') == 'https://vault.azure.net/.default');

				return ok ? json(200, { token_type: 'Bearer', expires_in: 3599, ext_expires_in: 3599, access_token: TOKEN }) : json(400, { error: 'invalid_request', error_description: 'AADSTS900144: malformed test request' });
			};

			case 'certificate': {
				if (!bearer) {
					return json(401, { error: { code: 'Unauthorized', message: 'no bearer' } });
				};
				if ((init.method != 'GET') || (`${u.origin}${u.pathname}` != `${VAULT}/certificates/${AZURE.AZURE_CERT_NAME}`) || (u.searchParams.get('api-version') != '7.4')) {
					return json(404, { error: { code: 'CertificateNotFound', message: 'not found' } });
				};
				return json(200, {
					id: `${VAULT}/certificates/${AZURE.AZURE_CERT_NAME}/${KEY_VERSION}`,
					kid: answer.kid ?? KID,
					sid: `${VAULT}/secrets/${AZURE.AZURE_CERT_NAME}/${KEY_VERSION}`,
					x5t: crypto.createHash('sha1').update(cert.der).digest('base64url'),
					cer: cert.der.toString('base64'),
					attributes: { enabled: answer.enabled ?? true },
					policy: { key_props: { exportable: false, kty: answer.kty ?? 'RSA-HSM', key_size: 2048, reuse_key: false } },
				});
			};

			case 'sign': {
				const body = JSON.parse(String(init.body || '{}'));

				if (!bearer) {
					return json(401, { error: { code: 'Unauthorized', message: 'no bearer' } });
				};
				if ((init.method != 'POST') || (`${u.origin}${u.pathname}` != `${KID}/sign`) || (u.searchParams.get('api-version') != '7.4') || (body.alg != 'RS256')) {
					return json(400, { error: { code: 'BadParameter', message: 'bad sign request' } });
				};

				const digest = Buffer.from(body.value, 'base64url');

				if (digest.length != 32) {
					return json(400, { error: { code: 'BadParameter', message: 'digest is not SHA-256' } });
				};
				return json(200, { kid: KID, value: rs256(cert.key, digest).toString('base64url') });
			};
		};
		return json(404, { error: { code: 'NotFound', message: 'no such endpoint' } });
	};

	return { fetch, calls, count: (kind: Kind) => calls.filter(c => c.kind == kind).length };
};

/** Answers an endpoint with an error once or always */
export const failWith = (status: number, body: any, times = Infinity): Override => ({ n }) => (n <= times) ? json(status, body) : undefined;
