#!/usr/bin/env node
/**
 * Generates the service registry in src/ts/lib/api/service.ts from service.proto.
 * Parses rpc definitions and maps method names to ts-proto Request/Response types.
 *
 * Usage: node scripts/generate-service-registry.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HEART_DIR = path.resolve(ROOT_DIR, '..', 'anytype-heart');
const SERVICE_TS = path.join(ROOT_DIR, 'src/ts/lib/api/service.ts');

// Try dist/lib/protos first (CI), then anytype-heart repo (local dev)
const DIST_PROTO = path.join(ROOT_DIR, 'dist/lib/protos/service.proto');
const HEART_PROTO = path.join(HEART_DIR, 'pb/protos/service/service.proto');
const SERVICE_PROTO = fs.existsSync(DIST_PROTO) ? DIST_PROTO : HEART_PROTO;

if (!fs.existsSync(SERVICE_PROTO)) {
	console.error('Error: service.proto not found at', DIST_PROTO, 'or', HEART_PROTO);
	process.exit(1);
}

const proto = fs.readFileSync(SERVICE_PROTO, 'utf8');

// Parse rpc lines: rpc MethodName (anytype.Rpc.X.Y.Request) returns (anytype.Rpc.X.Y.Response);
const rpcRegex = /rpc\s+(\w+)\s*\(\s*anytype\.(\S+?)\.Request\s*\)\s*returns\s*\(\s*anytype\.(\S+?)\.Response\s*\)/g;

const entries = [];
let match;

while ((match = rpcRegex.exec(proto)) !== null) {
	const methodName = match[1];
	const reqPath = match[2]; // e.g. Rpc.File.AutoDownloadSetLimit
	const resPath = match[3];

	// Skip streaming methods
	if (proto.substring(match.index - 10, match.index).includes('stream')) {
		continue;
	}

	// Convert dot path to underscore: Rpc.File.AutoDownloadSetLimit -> Rpc_File_AutoDownloadSetLimit
	const reqType = reqPath.replace(/\./g, '_') + '_Request';
	const resType = resPath.replace(/\./g, '_') + '_Response';

	entries.push({ methodName, reqType, resType });
}

// Skip ListenSessionEvents (streaming) and StreamRequest
const filtered = entries.filter(e => e.methodName !== 'ListenSessionEvents');

// Sort alphabetically
filtered.sort((a, b) => a.methodName.localeCompare(b.methodName));

// Read existing service.ts
const existing = fs.readFileSync(SERVICE_TS, 'utf8');

// Find the registry block and replace it
const registryStart = existing.indexOf('const registry: Record<string, RegistryEntry> = {');
const registryEnd = existing.indexOf('};', registryStart) + 2;

if (registryStart === -1) {
	console.error('Error: could not find registry block in service.ts');
	process.exit(1);
}

const registryLines = filtered.map(e =>
	`\t${e.methodName}: { req: Commands.${e.reqType}, res: Commands.${e.resType} },`
);

const newRegistry = `const registry: Record<string, RegistryEntry> = {\n${registryLines.join('\n')}\n};`;

const updated = existing.substring(0, registryStart) + newRegistry + existing.substring(registryEnd);

// Update the comment with method count
const finalContent = updated.replace(
	/Auto-generated registry: \d+ unary methods/,
	`Auto-generated registry: ${filtered.length} unary methods`
);

fs.writeFileSync(SERVICE_TS, finalContent);
console.log(`Generated registry with ${filtered.length} methods`);
