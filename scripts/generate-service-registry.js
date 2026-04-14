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

const fromDist = process.argv.includes('--from-dist');
const SERVICE_PROTO = fromDist
	? path.join(ROOT_DIR, 'dist/lib/protos/service.proto')
	: path.join(HEART_DIR, 'pb/protos/service/service.proto');

if (!fs.existsSync(SERVICE_PROTO)) {
	console.error('Error: service.proto not found at', SERVICE_PROTO);
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

const registryLines = filtered.map(e =>
	`\t${e.methodName}: { req: Commands.${e.reqType}, res: Commands.${e.resType} },`
);

const fileContent = `/**
 * Custom gRPC-web service client using ts-proto MessageFns for serialization.
 * Replaces the generated service_grpc_web_pb.js which depends on old CJS protobuf files.
 *
 * Auto-generated registry: ${filtered.length} unary methods.
 */

import { GrpcWebClientBase, MethodDescriptor, MethodType } from 'grpc-web';
import type { ClientReadableStream } from 'grpc-web';
import type { MessageFns } from 'Proto/google/protobuf/struct';
import * as Commands from 'Proto/pb/protos/commands';
import * as Events from 'Proto/pb/protos/events';

interface RegistryEntry {
\treq: MessageFns<any>;
\tres: MessageFns<any>;
}

const registry: Record<string, RegistryEntry> = {
${registryLines.join('\n')}
};

export class ServiceClient {

\tprivate client: GrpcWebClientBase;
\tprivate hostname: string;
\tprivate descriptorCache = new Map<string, MethodDescriptor<any, any>>();

\tconstructor (hostname: string, credentials: any, options: any) {
\t\tthis.hostname = hostname;
\t\tthis.client = new GrpcWebClientBase(options);
\t};

\tgetDescriptor (commandName: string): MethodDescriptor<any, any> | null {
\t\tlet descriptor = this.descriptorCache.get(commandName);
\t\tif (descriptor) {
\t\t\treturn descriptor;
\t\t};

\t\tconst entry = registry[commandName];
\t\tif (!entry) {
\t\t\treturn null;
\t\t};

\t\tdescriptor = new MethodDescriptor(
\t\t\t\`/anytype.ClientCommands/\${commandName}\`,
\t\t\tMethodType.UNARY,
\t\t\tObject as any,
\t\t\tObject as any,
\t\t\t(request: any) => entry.req.encode(entry.req.fromPartial(request)).finish(),
\t\t\t(bytes: Uint8Array) => {
\t\t\t\tconst res = entry.res.decode(bytes);
\t\t\t\tif (!res.toObject) {
\t\t\t\t\tres.toObject = function () { return this; };
\t\t\t\t};
\t\t\t\treturn res;
\t\t\t},
\t\t);

\t\tthis.descriptorCache.set(commandName, descriptor);
\t\treturn descriptor;
\t};

\trequest (commandName: string, data: any, metadata: any, callback: (error: any, response: any) => void) {
\t\tconst descriptor = this.getDescriptor(commandName);

\t\tif (!descriptor) {
\t\t\tconsole.error('[ServiceClient] Unknown command:', commandName);
\t\t\tcallback({ code: 1, message: 'Unknown command: ' + commandName }, null);
\t\t\treturn;
\t\t};

\t\t// gRPC DevTools interceptor calls getRequestMessage().toObject()
\t\tif (!data.toObject) {
\t\t\tdata.toObject = function () { return this; };
\t\t};

\t\treturn this.client.rpcCall(
\t\t\tthis.hostname + \`/anytype.ClientCommands/\${commandName}\`,
\t\t\tdata,
\t\t\tmetadata,
\t\t\tdescriptor,
\t\t\tcallback,
\t\t);
\t};

\tlistenSessionEvents (request: Commands.StreamRequest, metadata: any): ClientReadableStream<Events.Event> {
\t\tconst descriptor = new MethodDescriptor(
\t\t\t'/anytype.ClientCommands/ListenSessionEvents',
\t\t\tMethodType.SERVER_STREAMING,
\t\t\tObject as any,
\t\t\tObject as any,
\t\t\t(req: any) => Commands.StreamRequest.encode(Commands.StreamRequest.fromPartial(req)).finish(),
\t\t\t(bytes: Uint8Array) => {
\t\t\t\tconst res = Events.Event.decode(bytes) as any;
\t\t\t\tif (!res.toObject) {
\t\t\t\t\tres.toObject = function () { return this; };
\t\t\t\t};
\t\t\t\treturn res;
\t\t\t},
\t\t);

\t\t// gRPC DevTools interceptor calls getRequestMessage().toObject()
\t\tif (!(request as any).toObject) {
\t\t\t(request as any).toObject = function () { return this; };
\t\t};

\t\treturn this.client.serverStreaming(
\t\t\tthis.hostname + '/anytype.ClientCommands/ListenSessionEvents',
\t\t\trequest,
\t\t\tmetadata || {},
\t\t\tdescriptor,
\t\t) as ClientReadableStream<Events.Event>;
\t};

};
`;

fs.writeFileSync(SERVICE_TS, fileContent);
console.log(`Generated service.ts with ${filtered.length} methods`);
