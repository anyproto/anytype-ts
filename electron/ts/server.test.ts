import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	spawn: vi.fn(),
	appExit: vi.fn(),
	showErrorBox: vi.fn(),
	showItemInFolder: vi.fn(),
	writeFileSync: vi.fn(),
}));

vi.mock('child_process', () => ({
	default: {
		spawn: mocks.spawn,
	},
	spawn: mocks.spawn,
}));

vi.mock('fs', () => ({
	default: {
		writeFileSync: mocks.writeFileSync,
	},
	writeFileSync: mocks.writeFileSync,
}));

vi.mock('electron', () => ({
	app: {
		exit: mocks.appExit,
		getPath: () => '/tmp',
	},
	dialog: {
		showErrorBox: mocks.showErrorBox,
	},
	shell: {
		showItemInFolder: mocks.showItemInFolder,
	},
}));

vi.mock('./util', () => ({
	default: {
		dateForFile: () => 'test-date',
		logPath: () => '/tmp',
	},
}));

import { Server } from './server';

const binPath = '/tmp/anytypeHelper';
const workingDir = '/tmp';
const readyLine = (port: number) => `gRPC Web proxy started at: 127.0.0.1:${port}\n`;

// Matches the constants in server.ts
const gracefulShutdownTimeoutMs = 12000;
const forceShutdownTimeoutMs = 5000;

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

let platformDescriptor: PropertyDescriptor | undefined = undefined;

function setPlatform (platform: NodeJS.Platform): void {
	platformDescriptor = platformDescriptor || Object.getOwnPropertyDescriptor(process, 'platform');
	Object.defineProperty(process, 'platform', { value: platform, configurable: true });
};

/**
 * Spawns a helper through the real start() path and drives it to ready.
 */
async function startReady (server: Server, cp: FakeChildProcess, port: number = 1234): Promise<boolean> {
	mocks.spawn.mockReturnValueOnce(cp);

	const spawnCount = mocks.spawn.mock.calls.length;
	const started = server.start(binPath, workingDir);

	await vi.waitFor(() => expect(mocks.spawn.mock.calls.length).toBe(spawnCount + 1));
	cp.stdout.write(readyLine(port));

	return started;
};

beforeEach(() => {
	setPlatform('darwin');
});

afterEach(() => {
	vi.useRealTimers();
	vi.resetAllMocks();

	if (platformDescriptor) {
		Object.defineProperty(process, 'platform', platformDescriptor);
		platformDescriptor = undefined;
	};
});

describe('Server.start', () => {
	test('opts the helper into the stdin parent lifeline and publishes its address', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		await expect(startReady(server, cp)).resolves.toBe(true);

		const spawnOptions = mocks.spawn.mock.calls[0][2];

		expect(spawnOptions.stdio).toEqual([ 'pipe', 'pipe', 'pipe' ]);
		expect(spawnOptions.env.ANYTYPE_PARENT_LIFELINE).toBe('stdin');

		// The lifeline depends on stdin staying open for the helper's whole life
		expect(cp.stdin.writableEnded).toBe(false);
		expect(cp.stdin.destroyed).toBe(false);

		expect(server.isRunning).toBe(true);
		expect(server.getAddress()).toBe('http://127.0.0.1:1234');
		await expect(server.whenReady()).resolves.toBe('http://127.0.0.1:1234');
	});

	test('does not leak GOLOG_FILE into the main process environment', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		delete process.env.GOLOG_FILE;
		await startReady(server, cp);

		const spawnOptions = mocks.spawn.mock.calls[0][2];

		if (!process.stdout.isTTY) {
			expect(spawnOptions.env.GOLOG_FILE).toBeTruthy();
		};
		expect(process.env.GOLOG_FILE).toBeUndefined();
	});

	test('resolves false when the helper is stopped before it reports ready', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		mocks.spawn.mockReturnValueOnce(cp);

		const started = server.start(binPath, workingDir);

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());

		const stopped = server.stop();

		cp.exit();

		await expect(stopped).resolves.toBe(true);
		await expect(started).resolves.toBe(false);
		expect(mocks.showErrorBox).not.toHaveBeenCalled();
		expect(mocks.appExit).not.toHaveBeenCalled();
	});

	test('rejects when the helper dies before it reports ready', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		mocks.spawn.mockReturnValueOnce(cp);

		const started = server.start(binPath, workingDir);

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());

		cp.exit(1);

		await expect(started).rejects.toThrow('Anytype helper exited before it was ready');
		await expect(server.whenReady()).rejects.toThrow('Anytype helper exited before it was ready');
	});

	test('aborts instead of spawning a second helper when the previous one cannot be stopped', async () => {
		vi.useFakeTimers();

		const stuck = new FakeChildProcess();
		const server = new Server();

		server.cp = stuck as any;

		const started = server.start(binPath, workingDir);

		await vi.advanceTimersByTimeAsync(gracefulShutdownTimeoutMs + forceShutdownTimeoutMs);

		await expect(started).rejects.toThrow('Failed to stop the previous Anytype helper process');
		await expect(server.whenReady()).rejects.toThrow('Failed to stop the previous Anytype helper process');
		expect(mocks.spawn).not.toHaveBeenCalled();
		expect(server.cp).toBe(stuck);
	});

	test('deduplicates concurrent start requests', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		mocks.spawn.mockReturnValue(cp);

		const first = server.start(binPath, workingDir);
		const second = server.start(binPath, workingDir);

		expect(second).toBe(first);

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());
		cp.stdout.write(readyLine(1234));

		await expect(first).resolves.toBe(true);
		expect(mocks.spawn).toHaveBeenCalledOnce();
	});

	test('ignores a dead helper late stdout so it cannot publish a stale address', async () => {
		const dead = new FakeChildProcess();
		const live = new FakeChildProcess();
		const server = new Server();

		mocks.spawn.mockReturnValueOnce(dead);

		const first = server.start(binPath, workingDir);

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());

		const stopped = server.stop();

		dead.exit();

		await expect(stopped).resolves.toBe(true);
		await expect(first).resolves.toBe(false);

		mocks.spawn.mockReturnValueOnce(live);

		const second = server.start(binPath, workingDir);

		await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledTimes(2));

		// Node flushes buffered output after exit: the corpse must not win the race
		dead.stdout.write(readyLine(1111));
		dead.stderr.write('late noise from the dead helper');

		expect(server.isRunning).toBe(false);
		expect(server.getAddress()).toBe('');

		live.stdout.write(readyLine(2222));

		await expect(second).resolves.toBe(true);
		expect(server.getAddress()).toBe('http://127.0.0.1:2222');
	});

	test('ignores a dead helper late exit so it cannot disown the live one', async () => {
		const dead = new FakeChildProcess();
		const live = new FakeChildProcess();
		const server = new Server();

		await startReady(server, dead);

		// The helper is gone but its exit event has not been delivered yet, so
		// stop() takes the already-exited path and start() spawns a replacement
		dead.exitCode = 0;

		await expect(startReady(server, live, 2222)).resolves.toBe(true);

		dead.emit('exit', 0, null);

		expect(server.cp).toBe(live);
		expect(server.isRunning).toBe(true);
		expect(server.getAddress()).toBe('http://127.0.0.1:2222');
		expect(mocks.showErrorBox).not.toHaveBeenCalled();
		expect(mocks.appExit).not.toHaveBeenCalled();
	});
});

describe('Server crash reporting', () => {
	test('writes a crash log and exits the app when a running helper dies', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		await startReady(server, cp);

		cp.stderr.write('panic: something went wrong');
		await vi.waitFor(() => expect(server.lastErrors.length).toBe(1));

		cp.exit(1);

		expect(mocks.writeFileSync).toHaveBeenCalledOnce();
		expect(mocks.writeFileSync.mock.calls[0][1]).toContain('panic: something went wrong');
		expect(mocks.showErrorBox).toHaveBeenCalledOnce();
		expect(mocks.showItemInFolder).toHaveBeenCalledOnce();
		expect(mocks.appExit).toHaveBeenCalledWith(0);
		expect(server.isRunning).toBe(false);
	});

	test('stays silent when the helper exits because it was asked to', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		await startReady(server, cp);

		const stopped = server.stop();

		cp.exit();

		await expect(stopped).resolves.toBe(true);
		expect(mocks.writeFileSync).not.toHaveBeenCalled();
		expect(mocks.showErrorBox).not.toHaveBeenCalled();
		expect(mocks.appExit).not.toHaveBeenCalled();
	});

	test('still reports a crash after a stop/start cycle', async () => {
		const first = new FakeChildProcess();
		const second = new FakeChildProcess();
		const server = new Server();

		await startReady(server, first);

		const stopped = server.stop();

		first.exit();
		await expect(stopped).resolves.toBe(true);

		// stopTriggered must be cleared by start(), or this crash is swallowed
		await startReady(server, second, 2222);

		second.exit(1);

		expect(mocks.showErrorBox).toHaveBeenCalledOnce();
		expect(mocks.appExit).toHaveBeenCalledWith(0);
	});
});

describe('Server.stop', () => {
	test('terminates the helper with a signal on posix', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();

		expect(cp.kill).toHaveBeenCalledWith('SIGTERM');

		cp.exit();

		await expect(stopped).resolves.toBe(true);
		expect(server.cp).toBeNull();
		expect(server.isRunning).toBe(false);
	});

	test('force stops when the signal cannot be delivered', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		cp.kill.mockReturnValueOnce(false);
		server.cp = cp as any;

		const stopped = server.stop();

		expect(cp.kill).toHaveBeenNthCalledWith(1, 'SIGTERM');
		expect(cp.kill).toHaveBeenNthCalledWith(2, 'SIGKILL');

		cp.exit();

		await expect(stopped).resolves.toBe(true);
	});

	test('resolves immediately for a helper that already exited', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		cp.exitCode = 0;
		server.cp = cp as any;
		server.isRunning = true;

		await expect(server.stop()).resolves.toBe(true);
		expect(cp.kill).not.toHaveBeenCalled();
		expect(server.cp).toBeNull();
		expect(server.isRunning).toBe(false);
	});

	test('requests graceful shutdown over stdin on Windows', async () => {
		setPlatform('win32');

		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();

		expect(cp.stdin.read()?.toString()).toBe('shutdown\n');
		expect(cp.kill).not.toHaveBeenCalled();

		cp.exit();

		await expect(stopped).resolves.toBe(true);
	});

	test('force stops when the Windows shutdown pipe fails', async () => {
		setPlatform('win32');

		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();

		cp.stdin.emit('error', new Error('EPIPE'));

		expect(cp.kill).toHaveBeenCalledWith('SIGKILL');

		cp.exit();

		await expect(stopped).resolves.toBe(true);
	});

	test('force stops when the helper has no stdin pipe on Windows', async () => {
		setPlatform('win32');

		const cp = new FakeChildProcess();
		const server = new Server();

		(cp as any).stdin = null;
		server.cp = cp as any;

		const stopped = server.stop();

		expect(cp.kill).toHaveBeenCalledWith('SIGKILL');

		cp.exit();

		await expect(stopped).resolves.toBe(true);
	});

	test('force stops when the shutdown request throws', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		cp.kill.mockImplementationOnce(() => {
			throw new Error('ESRCH');
		});
		server.cp = cp as any;

		const stopped = server.stop();

		expect(cp.kill).toHaveBeenCalledWith('SIGKILL');

		cp.exit();

		await expect(stopped).resolves.toBe(true);
	});

	test('deduplicates concurrent stop requests', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const first = server.stop();
		const second = server.stop();

		expect(second).toBe(first);
		expect(cp.kill).toHaveBeenCalledOnce();

		cp.exit();

		await expect(first).resolves.toBe(true);
	});

	test('releases the dedup slot once a stop completes', async () => {
		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const first = server.stop();

		cp.exit();
		await expect(first).resolves.toBe(true);
		expect(server.stopPromise).toBeNull();

		// A later stop must not return the settled promise of the previous one
		const other = new FakeChildProcess();

		server.cp = other as any;

		const second = server.stop();

		expect(second).not.toBe(first);
		expect(other.kill).toHaveBeenCalledWith('SIGTERM');

		other.exit();
		await expect(second).resolves.toBe(true);
	});

	test('force kills a helper that ignores the graceful request', async () => {
		vi.useFakeTimers();

		const cp = new FakeChildProcess();
		const server = new Server();

		server.cp = cp as any;

		const stopped = server.stop();

		await vi.advanceTimersByTimeAsync(gracefulShutdownTimeoutMs - 1);
		expect(cp.kill).not.toHaveBeenCalledWith('SIGKILL');

		await vi.advanceTimersByTimeAsync(1);
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

		await vi.advanceTimersByTimeAsync(gracefulShutdownTimeoutMs + forceShutdownTimeoutMs);

		await expect(stopped).resolves.toBe(false);
		expect(server.cp).toBe(cp);
		expect(server.stopPromise).toBeNull();
	});
});
