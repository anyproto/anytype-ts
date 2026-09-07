import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	spawn: vi.fn(),
	appExit: vi.fn(),
}));

vi.mock('child_process', () => ({
	default: {
		spawn: mocks.spawn,
	},
}));

vi.mock('electron', () => ({
	app: {
		exit: mocks.appExit,
		getPath: () => '/tmp',
	},
	dialog: {
		showErrorBox: vi.fn(),
	},
	shell: {
		showItemInFolder: vi.fn(),
	},
}));

vi.mock('./util', () => ({
	default: {
		dateForFile: () => 'test-date',
		logPath: () => '/tmp',
	},
}));

import { Server } from './server';

class FakeChildProcess extends EventEmitter {
	stdin = new PassThrough();
	stdout = new PassThrough();
	stderr = new PassThrough();
	exitCode: number | null = null;
	signalCode: NodeJS.Signals | null = null;
	pid = 123;
	kill = vi.fn(() => true);

	exit (code: number = 0): void {
		this.exitCode = code;
		this.emit('exit', code, null);
	};
};

function setPlatform (platform: NodeJS.Platform): () => void {
	const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');

	Object.defineProperty(process, 'platform', { value: platform });
	return () => Object.defineProperty(process, 'platform', descriptor!);
};

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe('Server helper lifecycle', () => {
	test('opts the helper into the stdin parent lifeline', async () => {
		const cp = new FakeChildProcess();
		mocks.spawn.mockReturnValue(cp);
		const server = new Server();
		const started = server.start('/tmp/anytypeHelper', '/tmp');

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());
		const spawnOptions = mocks.spawn.mock.calls[0][2];

		expect(spawnOptions.stdio).toEqual([ 'pipe', 'pipe', 'pipe' ]);
		expect(spawnOptions.env.ANYTYPE_PARENT_LIFELINE).toBe('stdin');

		cp.stdout.write('gRPC Web proxy started at: 127.0.0.1:1234\n');
		await expect(started).resolves.toBe(true);

		const stopped = server.stop();
		cp.exit();
		await expect(stopped).resolves.toBe(true);
	});

	test('stops a spawned helper before it reports ready', async () => {
		const restorePlatform = setPlatform('darwin');
		const cp = new FakeChildProcess();
		const server = new Server();

		try {
			server.cp = cp as any;
			server.isRunning = false;

			const stopped = server.stop();

			expect(cp.kill).toHaveBeenCalledWith('SIGTERM');

			cp.exit();
			await expect(stopped).resolves.toBe(true);
		} finally {
			restorePlatform();
		};
	});

	test('requests graceful shutdown over stdin on Windows', async () => {
		const restorePlatform = setPlatform('win32');
		const cp = new FakeChildProcess();
		const server = new Server();

		try {
			server.cp = cp as any;

			const stopped = server.stop();

			expect(cp.stdin.read()?.toString()).toBe('shutdown\n');
			expect(cp.kill).not.toHaveBeenCalledWith('SIGTERM');

			cp.exit();
			await expect(stopped).resolves.toBe(true);
		} finally {
			restorePlatform();
		};
	});

	test('force stops when the Windows shutdown pipe fails', async () => {
		const restorePlatform = setPlatform('win32');
		const cp = new FakeChildProcess();
		const server = new Server();

		try {
			server.cp = cp as any;

			const stopped = server.stop();
			cp.stdin.emit('error', new Error('EPIPE'));

			expect(cp.kill).toHaveBeenCalledWith('SIGKILL');

			cp.exit();
			await expect(stopped).resolves.toBe(true);
		} finally {
			restorePlatform();
		};
	});

	test('deduplicates concurrent stop requests', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const first = server.stop();
		const second = server.stop();

		expect(second).toBe(first);
		cp.exit();
		await expect(first).resolves.toBe(true);
	});

	test('force kills a helper after the graceful deadline', async () => {
		vi.useFakeTimers();

		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();
		await vi.advanceTimersByTimeAsync(10000);

		expect(cp.kill).toHaveBeenCalledWith('SIGKILL');

		cp.exit();
		await expect(stopped).resolves.toBe(true);
	});

	test('reports failure and retains ownership when no exit is observed after force kill', async () => {
		vi.useFakeTimers();

		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();
		await vi.advanceTimersByTimeAsync(15000);

		await expect(stopped).resolves.toBe(false);
		expect(server.cp).toBe(cp);
	});
});
