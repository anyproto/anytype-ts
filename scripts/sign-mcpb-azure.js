/**
 * Signs Anytype.mcpb, the Claude Desktop bundle, with Anytype's Windows code-signing certificate, which lives in
 * Azure Key Vault. The private key never leaves the vault: Key Vault signs a digest (docs/plans/…/anytype-mcp-plan.md
 * §4.4). The result is the file `mcpb sign` would write with that certificate and key (@anthropic-ai/mcpb 2.1.2,
 * `signMcpbFile`): a detached PKCS#7 SignedData built by node-forge (SHA-256, rsaEncryption, the authenticated
 * attributes contentType / messageDigest / signingTime, the certificates leaf first, then the chain), appended as
 * `MCPB_SIG_V1 <u32le length> <DER> MCPB_SIG_END`.
 *
 * forge signs synchronously and Key Vault answers asynchronously, so the SignedData is built twice with one fixed
 * signingTime: the first pass captures the SHA-256 of the DER of the authenticated attributes (what an RSA signer
 * signs), Key Vault signs it (RS256), and the second pass, which must reach the same digest, takes that signature.
 *
 * Inputs: the secrets electron/hook/sign.js gives AzureSignTool — AZURE_KEY_VAULT_URI, AZURE_TENANT_ID,
 * AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_CERT_NAME — and the same service-principal permissions (certificates/get,
 * keys/sign); WIN_PUBLISHER_SUBJECT (a repository variable), the subject the certificate must have, exactly. Nothing
 * derived from the secrets reaches the output: no URL, key id, token, header or response body. Errors name the
 * request, the HTTP status and Azure's error code, with every secret value redacted anyway.
 *
 * The chain after the leaf is committed (scripts/certs/globalsign-codesign-chain.pem) and pinned here by SHA-256. A
 * leaf those certificates did not issue (a renewal under another CA) fails the build with a message that says so.
 *
 * Verification (`verify`): mcpb 2.1.2's verifyMcpbFile, which Claude Desktop runs (6.28899.6 bundles it verbatim), can
 * report "signed" for no file at all: node-forge has no PKCS#7 verify (`p7.verify()` throws and its catch answers
 * "unsigned"), and on macOS `security verify-cert -c <one file>` reads only the first certificate of the chain file
 * it writes. `verify` therefore runs the same steps with working parts — see its comment. A signed bundle must come
 * out "signed" on macOS and Windows; on other hosts the PKCS#7 signature is verified and the chain is not checked.
 *
 *   node scripts/sign-mcpb-azure.js <file.mcpb>             sign in place (the AZURE_* variables must be set)
 *   node scripts/sign-mcpb-azure.js --verify <file.mcpb>    verify and print the signer
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');
const { winPublisherSubject } = require('../electron/hook/verify-forwarder.js');

const API_VERSION = '7.4';
const TOKEN_ORIGIN = 'https://login.microsoftonline.com';
const VAULT_SCOPE = 'https://vault.azure.net/.default';
const SETTINGS = [ 'AZURE_KEY_VAULT_URI', 'AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_CERT_NAME' ];
/** What signing needs besides: the subject the signer must have (a repository variable, see verify-forwarder.js) */
const REQUIRED = [ ...SETTINGS, 'WIN_PUBLISHER_SUBJECT' ];
const CHAIN_FILE = path.join(__dirname, 'certs', 'globalsign-codesign-chain.pem');
/** The SHA-256 of the DER of each certificate in CHAIN_FILE, in its order (sources: that file) */
const CHAIN_SHA256 = [
	// GlobalSign GCC R45 CodeSigning CA 2020
	'74d499a72d0ba5d4ddec55805ecf157c891e45e5d490a19dc5fd4476954e774b',
	// GlobalSign Code Signing Root R45, cross-signed by GlobalSign Root CA - R3
	'05e0634b1feb98ae6b4cf101728cf9d5a1793ceace301506ff332b22d4cf08eb',
];
const SIG_HEADER = Buffer.from('MCPB_SIG_V1', 'utf8');
const SIG_FOOTER = Buffer.from('MCPB_SIG_END', 'utf8');
/** Per attempt of a request; three attempts for what may pass on a second try */
const TIMEOUT = 30000;
const ATTEMPTS = 3;
const CHAIN_ATTEMPTS = 3;
const CODE_SIGNING = '1.3.6.1.5.5.7.3.3';
/** RFC 8017 §9.2: what an RS256 signature opens to is this DigestInfo prefix, then the SHA-256 digest */
const SHA256_DIGEST_INFO = Buffer.from('3031300d060960864801650304020105000420', 'hex');
const OID = {
	data: '1.2.840.113549.1.7.1',
	signedData: '1.2.840.113549.1.7.2',
	contentType: '1.2.840.113549.1.9.3',
	messageDigest: '1.2.840.113549.1.9.4',
	signingTime: '1.2.840.113549.1.9.5',
	sha256: '2.16.840.1.101.3.4.2.1',
	rsaEncryption: '1.2.840.113549.1.1.1',
	commonName: '2.5.4.3',
};
/** X.500 attribute labels as Windows writes a subject (`X509Certificate.Subject`, CertNameToStr with CERT_X500_NAME_STR) */
const DOTNET_LABELS = {
	'2.5.4.3': 'CN', '2.5.4.4': 'SN', '2.5.4.5': 'SERIALNUMBER', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'S',
	'2.5.4.9': 'STREET', '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.12': 'T', '2.5.4.17': 'PostalCode', '2.5.4.42': 'G',
	'2.5.4.43': 'I', '1.2.840.113549.1.9.1': 'E', '0.9.2342.19200300.100.1.25': 'DC',
};

const log = (...args) => console.log('[sign-mcpb]', ...args);

const fail = (msg) => {
	throw new Error(`Anytype.mcpb signing: ${msg}`);
};

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const mcpbDir = () => path.dirname(require.resolve('@anthropic-ai/mcpb'));

/** The pinned mcpb's own signature code (an ES module): extractSignatureBlock, verifyCertificateChain, signMcpbFile */
const mcpbSign = () => import(pathToFileURL(path.join(mcpbDir(), 'node', 'sign.js')).href);

/** The node-forge mcpb signs with, resolved from mcpb's own folder */
const forgeLib = () => require(require.resolve('node-forge', { paths: [ mcpbDir() ] }));

// ---------------------- DER ---------------------- //

/** The first DER element of `buf`: its tag, contents and whole bytes */
const der = (buf) => {
	if (buf.length < 2) {
		fail('malformed DER: truncated element');
	};

	let len = buf[1];
	let start = 2;

	if (len & 0x80) {
		const n = len & 0x7f;

		if (!n || (n > 4) || ((start + n) > buf.length)) {
			fail('malformed DER: bad length');
		};
		len = 0;
		for (let i = 0; i < n; i++) {
			len = (len * 256) + buf[start + i];
		};
		start += n;
	};
	if ((start + len) > buf.length) {
		fail('malformed DER: element longer than its container');
	};
	return { tag: buf[0], value: buf.subarray(start, start + len), bytes: buf.subarray(0, start + len) };
};

/** The elements of a constructed element's contents */
const items = (el) => {
	const ret = [];
	let rest = el.value;

	while (rest.length) {
		const it = der(rest);

		ret.push(it);
		rest = rest.subarray(it.bytes.length);
	};
	return ret;
};

const expectTag = (el, tag, what) => {
	if (!el || (el.tag != tag)) {
		fail(`malformed ${what}`);
	};
	return el;
};

const oidOf = (el) => {
	const parts = [];
	let v = 0;

	expectTag(el, 0x06, 'OID');
	for (const byte of el.value) {
		v = (v * 128) + (byte & 0x7f);
		if (!(byte & 0x80)) {
			parts.push(v);
			v = 0;
		};
	};

	const first = parts.shift();
	const arc = (first < 80) ? Math.floor(first / 40) : 2;

	return [ arc, first - (arc * 40), ...parts ].join('.');
};

/** An AlgorithmIdentifier's OID (parameters, if any, are NULL) */
const algorithmOf = (el) => {
	const [ oid, params, ...rest ] = items(expectTag(el, 0x30, 'AlgorithmIdentifier'));

	if (rest.length || (params && ((params.tag != 0x05) || params.value.length))) {
		fail('malformed AlgorithmIdentifier');
	};
	return oidOf(oid);
};

/** A directory string's text (UTF8String, PrintableString, IA5String, TeletexString, BMPString) */
const stringOf = (el) => {
	switch (el.tag) {
		case 0x0c: return el.value.toString('utf8');
		case 0x13: case 0x16: case 0x14: return el.value.toString('latin1');
		case 0x1e: return Buffer.from(el.value).swap16().toString('utf16le');
		default: fail(`a name attribute of ASN.1 type ${el.tag} can't be read`);
	};
};

/** Certificate → tbsCertificate fields */
const certParts = (buf) => {
	const cert = der(buf);

	if (cert.bytes.length != buf.length) {
		fail('trailing bytes after a certificate');
	};

	const tbs = items(expectTag(items(expectTag(cert, 0x30, 'certificate'))[0], 0x30, 'tbsCertificate'));
	const fields = (tbs[0]?.tag == 0xa0) ? tbs.slice(1) : tbs;
	const block = fields.find(f => f.tag == 0xa3);
	const extensions = block ? items(expectTag(items(block)[0], 0x30, 'extensions')).map((ext) => {
		const list = items(expectTag(ext, 0x30, 'extension'));
		return { oid: oidOf(list[0]), value: expectTag(list[list.length - 1], 0x04, 'extension value').value };
	}) : [];

	return { serial: expectTag(fields[0], 0x02, 'serial number'), issuer: expectTag(fields[2], 0x30, 'issuer'), subject: expectTag(fields[4], 0x30, 'subject'), extensions };
};

/** A certificate's extended key usages (OIDs); null without that extension */
const extKeyUsage = (certDer) => {
	const ext = certParts(certDer).extensions.find(e => e.oid == '2.5.29.37');
	return ext ? items(expectTag(der(ext.value), 0x30, 'extended key usage')).map(oidOf) : null;
};

/** A Name as Windows formats it: RDNs last to first, `, ` between, `LABEL=value`, quoted where it must be */
const dotnetName = (name) => {
	const quote = (v) => (!v || /[,+="\n<>#;]/.test(v) || /^\s|\s$/.test(v)) ? `"${v.replace(/"/g, '""')}"` : v;
	const rdns = items(name).map(set => items(expectTag(set, 0x31, 'RDN')).map(attr => {
		const [ type, value ] = items(expectTag(attr, 0x30, 'name attribute'));
		const oid = oidOf(type);

		return `${DOTNET_LABELS[oid] || `OID.${oid}`}=${quote(stringOf(value))}`;
	}).join(' + '));

	return rdns.reverse().join(', ');
};

/** A certificate's subject the way `Get-AuthenticodeSignature … .SignerCertificate.Subject` prints it */
const dotnetSubject = (certDer) => dotnetName(certParts(certDer).subject);

/** The first CN of a Name (what mcpb names publisher and issuer) */
const commonName = (name) => {
	for (const set of items(name)) {
		for (const attr of items(set)) {
			const [ type, value ] = items(attr);

			if (oidOf(type) == OID.commonName) {
				return stringOf(value);
			};
		};
	};
	return '';
};

// ---------------------- the signature block and the SignedData ---------------------- //

/** The archive and the DER signature of a file `mcpb sign` signed: exactly one block at its very end, or null */
const splitSigned = (buf) => {
	const footer = buf.length - SIG_FOOTER.length;

	if ((footer < 0) || !buf.subarray(footer).equals(SIG_FOOTER)) {
		return null;
	};

	const header = buf.lastIndexOf(SIG_HEADER, footer);

	if (header < 0) {
		return null;
	};

	const lenAt = header + SIG_HEADER.length;

	if (((lenAt + 4) > footer) || ((lenAt + 4 + buf.readUInt32LE(lenAt)) != footer)) {
		return null;
	};
	return { content: buf.subarray(0, header), signature: buf.subarray(lenAt + 4, footer) };
};

/** mcpb's createSignatureBlock */
const signatureBlock = (signature) => {
	const len = Buffer.alloc(4);

	len.writeUInt32LE(signature.length, 0);
	return Buffer.concat([ SIG_HEADER, len, signature, SIG_FOOTER ]);
};

/**
 * The SignedData of `signMcpbFile`: forge, detached, SHA-256, the three authenticated attributes (signingTime given,
 * so both passes encode the same one), the certificates in order. `rsaSign` is the whole RSA operation: it gets the
 * SHA-256 of the DER SET of the authenticated attributes and returns the PKCS#1 v1.5 signature.
 */
const buildSignedData = (forge, content, certs, signingTime, rsaSign) => {
	const parsed = certs.map(c => forge.pki.certificateFromAsn1(forge.asn1.fromDer(c.toString('binary'))));
	const p7 = forge.pkcs7.createSignedData();

	p7.content = forge.util.createBuffer(content);
	for (const cert of parsed) {
		p7.addCertificate(cert);
	};
	p7.addSigner({
		key: {
			sign: (md, scheme) => {
				if ((md.algorithm != 'sha256') || (scheme != 'RSASSA-PKCS1-V1_5')) {
					fail(`forge asked for a ${md.algorithm} ${scheme} signature`);
				};
				return rsaSign(Buffer.from(md.digest().getBytes(), 'binary')).toString('binary');
			},
		},
		certificate: parsed[0],
		digestAlgorithm: forge.pki.oids.sha256,
		authenticatedAttributes: [
			{ type: forge.pki.oids.contentType, value: forge.pki.oids.data },
			{ type: forge.pki.oids.messageDigest },
			{ type: forge.pki.oids.signingTime, value: signingTime },
		],
	});
	p7.sign({ detached: true });
	return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
};

/**
 * What a detached SignedData of mcpb's shape holds: the certificates (DER, in order) and its one SignerInfo —
 * issuer and serial, digest and signature algorithms, the authenticated attributes (and the SET they are signed
 * as), the signature. Anything else (content inside, several signers, unsigned attributes) is refused.
 */
const parseSignedData = (buf) => {
	const top = der(buf);

	if (top.bytes.length != buf.length) {
		fail('trailing bytes after the PKCS#7 signature');
	};

	const [ type, explicit, ...extra ] = items(expectTag(top, 0x30, 'ContentInfo'));

	if (extra.length || (oidOf(type) != OID.signedData)) {
		fail('the signature is not a PKCS#7 SignedData');
	};

	const fields = items(expectTag(items(expectTag(explicit, 0xa0, 'SignedData wrapper'))[0], 0x30, 'SignedData'));
	const content = items(expectTag(fields[2], 0x30, 'encapsulated content'));
	const certSet = fields.find(f => f.tag == 0xa0);
	const signerInfos = items(expectTag(fields[fields.length - 1], 0x31, 'SignerInfos'));

	if ((content.length != 1) || (oidOf(content[0]) != OID.data)) {
		fail('the signature is not detached over plain data');
	};
	if (!certSet) {
		fail('the signature holds no certificates');
	};
	if (signerInfos.length != 1) {
		fail(`the signature has ${signerInfos.length} signers, not one`);
	};

	const [ version, sid, digestAlg, attrs, sigAlg, signature, ...rest ] = items(expectTag(signerInfos[0], 0x30, 'SignerInfo'));
	const [ issuer, serial ] = items(expectTag(sid, 0x30, 'issuerAndSerialNumber'));

	expectTag(version, 0x02, 'SignerInfo version');
	expectTag(attrs, 0xa0, 'authenticated attributes');
	expectTag(signature, 0x04, 'signature');
	if (rest.length) {
		fail('the signer has unauthenticated attributes');
	};

	const attributes = {};

	for (const attr of items(attrs)) {
		const [ attrType, values ] = items(expectTag(attr, 0x30, 'attribute'));
		const oid = oidOf(attrType);
		const list = items(expectTag(values, 0x31, 'attribute values'));

		if ((list.length != 1) || attributes[oid]) {
			fail(`the authenticated attribute ${oid} is not one value`);
		};
		attributes[oid] = list[0];
	};

	return {
		certificates: items(certSet).map(c => Buffer.from(c.bytes)),
		issuer: issuer.bytes, serial: expectTag(serial, 0x02, 'serial number').bytes,
		digestAlgorithm: algorithmOf(digestAlg), signatureAlgorithm: algorithmOf(sigAlg),
		attributes, attributesSet: Buffer.concat([ Buffer.from([ 0x31 ]), attrs.bytes.subarray(1) ]), signature: signature.value,
	};
};

// ---------------------- certificates and trust ---------------------- //

const pemBlocks = (text) => [ ...String(text).matchAll(/-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=\s]+?)-----END CERTIFICATE-----/g) ].map(m => Buffer.from(m[1].replace(/\s+/g, ''), 'base64'));

const toPem = (buf) => `-----BEGIN CERTIFICATE-----\n${buf.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`;

/** The committed chain (DER, in order), each certificate equal to its pin */
const loadChain = (file = CHAIN_FILE, pins = CHAIN_SHA256) => {
	const certs = pemBlocks(fs.readFileSync(file, 'utf8'));

	if ((certs.length != pins.length) || certs.some((c, i) => sha256(c) != pins[i])) {
		fail(`${path.basename(file)} does not hold the ${pins.length} certificates pinned in scripts/sign-mcpb-azure.js`);
	};
	return certs;
};

/** `cert` was issued by `issuer`: names and signature */
const issuedBy = (cert, issuer) => {
	try {
		return cert.checkIssued(issuer) && cert.verify(issuer.publicKey);
	} catch (e) {
		return false;
	};
};

/**
 * The Key Vault certificate may sign Anytype.mcpb: RSA, exactly Anytype's Windows publisher, for code signing, valid
 * now, issued by the first certificate of the chain, and every certificate of the chain issued by the next one
 */
const checkLeaf = (leaf, chain, expectedSubject, now) => {
	let cert = null;

	try {
		cert = new crypto.X509Certificate(leaf);
	} catch (e) {
		fail('Key Vault returned a certificate that can\'t be read');
	};

	const type = cert.publicKey.asymmetricKeyType;

	if (type != 'rsa') {
		fail(`the Key Vault certificate's key is ${type}, not RSA: an .mcpb signature is RSA with SHA-256, as mcpb writes it`);
	};

	const subject = dotnetSubject(leaf);

	if (subject !== expectedSubject) {
		fail(`the Key Vault certificate is not Anytype's Windows publisher: its subject is "${subject}", WIN_PUBLISHER_SUBJECT is "${expectedSubject}"`);
	};
	if (!(extKeyUsage(leaf) || []).includes(CODE_SIGNING)) {
		fail('the Key Vault certificate is not for code signing (no Code Signing extended key usage)');
	};
	if ((now < (cert.validFromDate || new Date(cert.validFrom))) || (now > (cert.validToDate || new Date(cert.validTo)))) {
		fail(`the Key Vault certificate is not valid now (${cert.validFrom} to ${cert.validTo})`);
	};

	const certs = [ cert, ...chain.map(c => new crypto.X509Certificate(c)) ];

	for (let i = 0; i < (certs.length - 1); i++) {
		if (!issuedBy(certs[i], certs[i + 1])) {
			fail((i == 0)
				? `scripts/certs/${path.basename(CHAIN_FILE)} did not issue the Key Vault certificate (its issuer: ${cert.issuer.replace(/\n/g, ', ')}): the certificate was renewed under another CA — commit its chain and pins`
				: `scripts/certs/${path.basename(CHAIN_FILE)}: certificate ${i + 1} was not issued by certificate ${i + 2}`);
		};
	};
	return cert;
};

const run = (file, args, timeout) => new Promise((resolve) => {
	execFile(file, args, { timeout, windowsHide: true }, (error) => resolve(!error));
});

/**
 * macOS: `security verify-cert` with the code-signing policy, the leaf and each chain certificate as its own `-c`
 * (from one file `security` reads the first certificate only). `offline`: local certificates and cached revocation only
 */
const macChainTrusted = async (certs, opt = {}) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anytype-mcpb-chain-'));

	try {
		const args = [ 'verify-cert', '-p', 'codeSign', ...(opt.offline ? [ '-L', '-R', 'offline' ] : []) ];

		certs.forEach((cert, i) => {
			const file = path.join(dir, `${i}.pem`);

			fs.writeFileSync(file, toPem(cert));
			args.push('-c', file);
		});
		return await run('/usr/bin/security', args, 120000);
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	};
};

/** Windows: mcpb's own check, the one Claude Desktop runs (X509Chain, the code-signing EKU, online revocation) */
const winChainTrusted = async (certs) => (await mcpbSign()).verifyCertificateChain(Buffer.from(toPem(certs[0])), certs.slice(1).map(c => Buffer.from(toPem(c))));

/** The OS trust-store check of this host, or null where there is none (Linux: Claude Desktop's own check differs per distribution) */
const defaultChainCheck = (platform = process.platform) => ({ darwin: macChainTrusted, win32: winChainTrusted })[platform] || null;

/**
 * Verifies a signed .mcpb the way mcpb 2.1.2's verifyMcpbFile means to (the code Claude Desktop runs), with the parts
 * it is missing done here; throws on 1–3:
 * 1. the block: exactly one MCPB_SIG_V1 … MCPB_SIG_END at the very end, and mcpb's own extractSignatureBlock agrees;
 * 2. forge reads the signature as mcpb does (SignedData, certificates, the first one the signer), and its fingerprint
 *    of the signer — the one Claude records — is the SHA-256 of the signer's DER;
 * 3. the PKCS#7 signature (what forge can't verify): one SignerInfo for the first certificate (issuer and serial),
 *    SHA-256 with rsaEncryption, contentType data, messageDigest = SHA-256 of the archive, a signingTime, and the RSA
 *    signature over the DER SET of those attributes verified with the signer's public key;
 * 4. the chain against the OS trust store with the code-signing policy (`opt.chainCheck`, by default this host's;
 *    each attempt up to three times): "signed" (or "self-signed": issuer CN equals subject CN, as mcpb decides) when
 *    trusted, "untrusted" when not, "not-checked" without a check.
 *
 * @returns {Promise<{ status: string, subject: string, publisher: string, issuer: string, fingerprint: string, certificates: Buffer[] }>}
 */
const verify = async (file, opt = {}) => {
	const buf = fs.readFileSync(file);
	const parts = splitSigned(buf);

	if (!parts) {
		fail(`${path.basename(file)} has no signature block at its end`);
	};

	const mcpb = await mcpbSign();
	const extracted = mcpb.extractSignatureBlock(buf);

	if (!extracted.pkcs7Signature || !extracted.originalContent.equals(parts.content) || !extracted.pkcs7Signature.equals(parts.signature)) {
		fail('mcpb\'s own parser reads the signature block differently');
	};

	const forge = forgeLib();
	let p7 = null;

	try {
		p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(parts.signature.toString('binary')));
	} catch (e) {
		fail(`node-forge, mcpb's parser, can't read the signature: ${e.message}`);
	};
	if ((p7.type !== forge.pki.oids.signedData) || !p7.certificates?.length) {
		fail('mcpb would read the signature as unsigned (no SignedData with certificates)');
	};

	const forgeCert = p7.certificates[0];

	const sd = parseSignedData(parts.signature);
	const leaf = sd.certificates[0];
	const cert = new crypto.X509Certificate(leaf);
	const leafParts = certParts(leaf);
	const fingerprint = sha256(leaf);
	const forgeFingerprint = forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(forgeCert)).getBytes()).digest().toHex();

	if (forgeFingerprint !== fingerprint) {
		fail('node-forge re-encodes the signer certificate differently: Claude would record another fingerprint');
	};
	if (!sd.issuer.equals(leafParts.issuer.bytes) || !sd.serial.equals(leafParts.serial.bytes)) {
		fail('the signature\'s signer is not its first certificate');
	};
	if ((sd.digestAlgorithm != OID.sha256) || (sd.signatureAlgorithm != OID.rsaEncryption)) {
		fail('the signature is not SHA-256 with rsaEncryption');
	};

	const attrs = sd.attributes;

	if ((Object.keys(attrs).length != 3) || !attrs[OID.contentType] || !attrs[OID.messageDigest] || !attrs[OID.signingTime]) {
		fail('the signature does not carry exactly contentType, messageDigest and signingTime');
	};
	if (oidOf(attrs[OID.contentType]) != OID.data) {
		fail('the signature\'s contentType is not data');
	};
	if (!expectTag(attrs[OID.messageDigest], 0x04, 'messageDigest').value.equals(crypto.createHash('sha256').update(parts.content).digest())) {
		fail('the signature\'s messageDigest is not the archive\'s SHA-256: the archive changed after signing');
	};
	if (!crypto.verify('sha256', sd.attributesSet, { key: cert.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, sd.signature)) {
		fail('the PKCS#7 signature does not verify with the signer certificate\'s public key');
	};

	const subject = dotnetName(leafParts.subject);
	const publisher = commonName(leafParts.subject);
	const issuer = commonName(leafParts.issuer);
	const check = (opt.chainCheck !== undefined) ? opt.chainCheck : defaultChainCheck();
	const sleep = opt.sleep || ((ms) => new Promise(r => setTimeout(r, ms)));
	let status = 'not-checked';

	if (check) {
		let trusted = false;

		for (let i = 0; !trusted && (i < CHAIN_ATTEMPTS); i++) {
			if (i) {
				await sleep(5000);
			};
			trusted = !!(await check(sd.certificates));
		};
		status = !trusted ? 'untrusted' : ((issuer === publisher) ? 'self-signed' : 'signed');
	};
	return { status, subject, publisher, issuer, fingerprint, certificates: sd.certificates };
};

// ---------------------- Azure ---------------------- //

/** The settings a signing build needs (the AZURE_* secrets, WIN_PUBLISHER_SUBJECT) that are empty in `env` */
const missingSettings = (env) => REQUIRED.filter(k => !String(env[k] || '').trim());

const config = (env) => {
	const missing = missingSettings(env);

	if (missing.length) {
		fail(`${missing.join(', ')} ${(missing.length == 1) ? 'is' : 'are'} not set`);
	};

	let vault = null;

	try {
		vault = new URL(env.AZURE_KEY_VAULT_URI.trim());
	} catch (e) { /* below */ };

	if (!vault || (vault.protocol != 'https:') || vault.username || vault.password || (vault.pathname != '/') || vault.search || vault.hash) {
		fail('AZURE_KEY_VAULT_URI is not a vault URL (https://<name>.vault.azure.net/)');
	};

	const tenant = env.AZURE_TENANT_ID.trim();

	if (!/^[A-Za-z0-9.-]{1,253}$/.test(tenant)) {
		fail('AZURE_TENANT_ID is not a tenant id or domain');
	};
	return { vault: vault.origin, tenant, clientId: env.AZURE_CLIENT_ID.trim(), clientSecret: env.AZURE_CLIENT_SECRET, cert: env.AZURE_CERT_NAME.trim() };
};

/** Only what can't carry a value: an error code */
const code = (v) => ((typeof v == 'string') && /^[A-Za-z0-9_.-]{1,64}$/.test(v)) ? v : '';

/** Azure's error code(s) from an error body: the token endpoint's `error` + AADSTS number, Key Vault's `error.code` + inner code */
const azureCodes = (body) => {
	const err = body?.error;
	const list = (typeof err == 'object') ? [ code(err?.code), code(err?.innererror?.code) ] : [ code(err), (/AADSTS\d+/.exec(String(body?.error_description || '')) || [])[0] ];

	return list.filter(Boolean).join(', ');
};

/** Why fetch threw, without its message (which may name the host): timeout, abort, or the system error code */
const networkReason = (e, timeout) => {
	if (e?.name == 'TimeoutError') {
		return `no answer within ${timeout / 1000} s`;
	};
	if (e?.name == 'AbortError') {
		return 'aborted';
	};

	const sys = code(e?.cause?.code) || code(e?.code);
	return sys ? `network error (${sys})` : 'network error';
};

/**
 * JSON requests with a timeout per attempt, `redirect: 'error'` (a bearer token never follows a redirect), and retries
 * for what may pass on a second try: network errors, timeouts, 408, 429, 5xx (Retry-After honoured up to 30 s).
 * Errors name the request, the HTTP status and Azure's error code; every value in `hidden` is redacted from them.
 */
const client = (opt, hidden) => {
	const fetchFn = opt.fetch || globalThis.fetch;
	const timeout = opt.timeoutMs || TIMEOUT;
	const attempts = opt.attempts || ATTEMPTS;
	const sleep = opt.sleep || ((ms) => new Promise(r => setTimeout(r, ms)));
	const secrets = hidden.filter(v => v && (v.length >= 3));
	const redact = (text) => secrets.reduce((acc, v) => acc.split(v).join('***'), String(text));

	const json = async (what, url, init) => {
		for (let attempt = 1; ; attempt++) {
			let res = null;
			let body = null;
			let reason = '';

			try {
				res = await fetchFn(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeout) });

				const text = await res.text();

				try {
					body = JSON.parse(text);
				} catch (e) { /* not JSON */ };
			} catch (e) {
				res = null;
				reason = networkReason(e, timeout);
			};

			if (res?.ok) {
				if (body && (typeof body == 'object')) {
					return body;
				};
				fail(`${what} failed: the answer is not JSON`);
			};
			if (res) {
				const codes = azureCodes(body);

				reason = `HTTP ${res.status}${codes ? ` (${codes})` : ''}`;
			};

			const retry = !res || [ 408, 429 ].includes(res.status) || (res.status >= 500);

			if (!retry || (attempt >= attempts)) {
				fail(redact(`${what} failed: ${reason}${(attempt > 1) ? ` (after ${attempt} attempts)` : ''}`));
			};

			const header = String(res?.headers?.get?.('retry-after') || '').trim();
			const after = /^\d+$/.test(header) ? Number(header) : NaN;

			await sleep(Number.isFinite(after) ? (Math.min(after, 30) * 1000) : (1000 * (2 ** (attempt - 1))));
		};
	};

	return { json, redact, hide: (v) => secrets.push(v) };
};

const accessToken = async (net, cfg) => {
	const body = new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, grant_type: 'client_credentials', scope: VAULT_SCOPE });
	const res = await net.json('the Azure AD token request', `${TOKEN_ORIGIN}/${encodeURIComponent(cfg.tenant)}/oauth2/v2.0/token`, {
		method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString(),
	});
	const token = res.access_token;

	if ((typeof token != 'string') || !/^[\x21-\x7e]{16,}$/.test(token)) {
		fail('Azure AD returned no access token');
	};
	if (res.token_type && (String(res.token_type).toLowerCase() != 'bearer')) {
		fail('Azure AD returned a token that is not a bearer token');
	};
	net.hide(token);
	return token;
};

/** The versioned key id of the certificate, which must be a key of the same vault */
const keyIdOf = (kid, vault) => {
	let url = null;

	try {
		url = new URL(String(kid || ''));
	} catch (e) { /* below */ };

	if (!url || (url.origin != vault) || !/^\/keys\/[^/]+\/[^/]+$/.test(url.pathname) || url.search || url.hash || url.username || url.password) {
		fail('Key Vault returned no versioned key id of the same vault for the certificate');
	};
	return `${url.origin}${url.pathname}`;
};

const vaultCertificate = async (net, cfg, token) => {
	const res = await net.json('the Key Vault certificate request', `${cfg.vault}/certificates/${encodeURIComponent(cfg.cert)}?api-version=${API_VERSION}`, {
		method: 'GET', headers: { authorization: `Bearer ${token}` },
	});
	const kty = res.policy?.key_props?.kty;

	if (res.attributes?.enabled === false) {
		fail('the certificate in Key Vault is disabled');
	};
	if (kty && !/^RSA(-HSM)?$/.test(kty)) {
		fail(`the certificate's key in Key Vault is ${code(kty) || 'not RSA'}, not RSA: an .mcpb signature is RSA with SHA-256, as mcpb writes it`);
	};
	if ((typeof res.cer != 'string') || !res.cer) {
		fail('Key Vault returned no certificate');
	};

	const kid = keyIdOf(res.kid, cfg.vault);

	net.hide(kid);
	return { leaf: Buffer.from(res.cer, 'base64'), kid };
};

const vaultSign = async (net, token, kid, digest) => {
	const res = await net.json('the Key Vault sign request', `${kid}/sign?api-version=${API_VERSION}`, {
		method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({ alg: 'RS256', value: digest.toString('base64url') }),
	});

	if ((typeof res.value != 'string') || !res.value) {
		fail('Key Vault returned no signature');
	};
	return Buffer.from(res.value, 'base64');
};

/** Key Vault's RS256 signature opens with the certificate's public key to exactly the DigestInfo of `digest` */
const checkVaultSignature = (cert, digest, signature) => {
	const size = Math.ceil(cert.publicKey.asymmetricKeyDetails.modulusLength / 8);
	let opened = null;

	try {
		opened = (signature.length == size) ? crypto.publicDecrypt({ key: cert.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, signature) : null;
	} catch (e) { /* below */ };

	if (!opened || !opened.equals(Buffer.concat([ SHA256_DIGEST_INFO, digest ]))) {
		fail('Key Vault\'s signature does not verify with the certificate\'s public key (the key id does not belong to the certificate?)');
	};
};

/**
 * Signs `file` (an unsigned .mcpb) in place with the Key Vault certificate, then verifies it (`verify`): it must be
 * "signed" on macOS and Windows (or wherever `opt.chainCheck` is given). On any error the file is left unsigned.
 *
 * @param {string} file
 * @param {{ env?: Record<string, string | undefined>, fetch?: typeof fetch, chainCheck?: null | ((certs: Buffer[]) => Promise<boolean>),
 *   chain?: Buffer[], now?: Date, timeoutMs?: number, attempts?: number, sleep?: (ms: number) => Promise<void> }} [opt]
 *   `env`: the AZURE_* settings and WIN_PUBLISHER_SUBJECT (default process.env); everything else is for tests
 * @returns {Promise<{ fingerprint: string, subject: string, status: string }>} the signer certificate's SHA-256 (lowercase hex)
 */
const sign = async (file, opt = {}) => {
	const env = opt.env || process.env;
	const cfg = config(env);
	const net = client(opt, [ cfg.clientSecret, cfg.clientId, cfg.tenant, cfg.vault, new URL(cfg.vault).host, cfg.cert ]);
	const expected = winPublisherSubject(env);
	const chain = opt.chain || loadChain();
	const now = opt.now || new Date();
	const content = fs.readFileSync(file);
	const chainCheck = (opt.chainCheck !== undefined) ? opt.chainCheck : defaultChainCheck();

	if (splitSigned(content)) {
		fail(`${path.basename(file)} is signed already`);
	};

	try {
		const token = await accessToken(net, cfg);
		const { leaf, kid } = await vaultCertificate(net, cfg, token);
		const cert = checkLeaf(leaf, chain, expected, now);
		const forge = forgeLib();
		const certs = [ leaf, ...chain ];
		// UTCTime has whole seconds: both passes encode exactly this
		const signingTime = new Date(Math.floor(now.getTime() / 1000) * 1000);
		const size = Math.ceil(cert.publicKey.asymmetricKeyDetails.modulusLength / 8);
		let digest = null;

		buildSignedData(forge, content, certs, signingTime, (d) => {
			digest = d;
			return Buffer.alloc(size);
		});

		const signature = await vaultSign(net, token, kid, digest);

		checkVaultSignature(cert, digest, signature);

		const signed = buildSignedData(forge, content, certs, signingTime, (d) => {
			if (!d.equals(digest)) {
				fail('the second pass reached another digest of the authenticated attributes');
			};
			return signature;
		});

		fs.writeFileSync(file, Buffer.concat([ content, signatureBlock(signed) ]));

		const res = await verify(file, { chainCheck, sleep: opt.sleep });

		if ((res.subject !== expected) || (res.fingerprint !== sha256(leaf)) || !res.certificates.every((c, i) => c.equals(certs[i])) || (res.certificates.length != certs.length)) {
			fail('the signed bundle does not carry the Key Vault certificate and the chain');
		};
		if (chainCheck && (res.status != 'signed')) {
			fail(`the signed bundle's certificate chain is ${res.status} for code signing on ${process.platform}: Claude Desktop would show it as unsigned`);
		};
		if (!chainCheck) {
			log(`the PKCS#7 signature verifies; the certificate chain is not checked on ${process.platform}`);
		};
		return { fingerprint: res.fingerprint, subject: res.subject, status: res.status };
	} catch (e) {
		fs.writeFileSync(file, content);
		throw new Error(net.redact(e?.message || e));
	};
};

module.exports = { sign, verify, missingSettings, dotnetSubject, splitSigned, signatureBlock, loadChain, macChainTrusted, pemBlocks, toPem, CHAIN_FILE, CHAIN_SHA256, REQUIRED };

if (require.main === module) {
	const args = process.argv.slice(2);
	const check = args[0] == '--verify';
	const file = check ? args[1] : args[0];

	if (!file) {
		console.error('usage: sign-mcpb-azure.js [--verify] <file.mcpb>');
		process.exit(2);
	};

	(check ? verify(path.resolve(file)) : sign(path.resolve(file))).then((res) => {
		log(`${path.basename(file)}: ${res.status}, signer "${res.subject}", certificate SHA-256 ${res.fingerprint}`);
	}).catch((e) => {
		console.error('[sign-mcpb]', e.message);
		process.exit(1);
	});
};
