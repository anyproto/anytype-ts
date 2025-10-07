/**
 * Worker message types for Spark Onboarding graph visualization
 */
export enum WorkerMessageType {
	// From main thread to worker
	Init = 'init',
	UpdateNodes = 'updateNodes',
	UpdateLinks = 'updateLinks',
	SetViewport = 'setViewport',
	SetTheme = 'setTheme',
	Pause = 'pause',
	Resume = 'resume',
	Destroy = 'destroy',

	// From worker to main thread
	Ready = 'ready',
	Frame = 'frame',
	NodeHover = 'nodeHover',
	NodeClick = 'nodeClick',
	Error = 'error',
}

/**
 * Base worker message interface
 */
export interface WorkerMessage {
	type: WorkerMessageType;
	timestamp?: number;
}

/**
 * Messages sent from main thread to worker
 */
export interface InitMessage extends WorkerMessage {
	type: WorkerMessageType.Init;
	canvas: OffscreenCanvas;
	width: number;
	height: number;
	devicePixelRatio: number;
	isDarkMode?: boolean;
}

export interface UpdateNodesMessage extends WorkerMessage {
	type: WorkerMessageType.UpdateNodes;
	nodes: any[];
}

export interface UpdateLinksMessage extends WorkerMessage {
	type: WorkerMessageType.UpdateLinks;
	links: any[];
}

export interface SetViewportMessage extends WorkerMessage {
	type: WorkerMessageType.SetViewport;
	width: number;
	height: number;
}

export interface SetThemeMessage extends WorkerMessage {
	type: WorkerMessageType.SetTheme;
	isDarkMode: boolean;
}

/**
 * Messages sent from worker to main thread
 */
export interface FrameMessage extends WorkerMessage {
	type: WorkerMessageType.Frame;
	fps?: number;
	nodeCount?: number;
	linkCount?: number;
}

export interface NodeInteractionMessage extends WorkerMessage {
	type: WorkerMessageType.NodeHover | WorkerMessageType.NodeClick;
	nodeId?: string;
	nodeType?: 'type' | 'object' | 'space';
	x?: number;
	y?: number;
}

export interface ErrorMessage extends WorkerMessage {
	type: WorkerMessageType.Error;
	error: string;
	details?: any;
}

/**
 * Helper class for worker communication
 */
export class WorkerMessenger {
	private worker: Worker | null = null;
	private messageHandlers: Map<WorkerMessageType, (data: any) => void> = new Map();
	private messageQueue: WorkerMessage[] = [];
	private isReady: boolean = false;

	constructor(worker?: Worker) {
		if (worker) {
			this.setWorker(worker);
		}
	}

	/**
	 * Set the worker instance and attach message handler
	 */
	setWorker(worker: Worker): void {
		this.worker = worker;
		this.worker.onmessage = this.handleMessage.bind(this);
	}

	/**
	 * Send a message to the worker
	 */
	send<T extends WorkerMessage>(message: T): void {
		if (!this.worker) {
			console.error('[WorkerMessenger] No worker set');
			return;
		}

		// Add timestamp if not present
		if (!message.timestamp) {
			message.timestamp = Date.now();
		}

		// Queue messages until worker is ready (except Init message)
		if (!this.isReady && message.type !== WorkerMessageType.Init) {
			this.messageQueue.push(message);
			return;
		}

		this.worker.postMessage(message);
	}

	/**
	 * Register a handler for a specific message type
	 */
	on(type: WorkerMessageType, handler: (data: any) => void): void {
		this.messageHandlers.set(type, handler);
	}

	/**
	 * Remove a handler for a specific message type
	 */
	off(type: WorkerMessageType): void {
		this.messageHandlers.delete(type);
	}

	/**
	 * Handle incoming messages from worker
	 */
	private handleMessage(event: MessageEvent): void {
		const message = event.data as WorkerMessage;

		// Handle ready message specially
		if (message.type === WorkerMessageType.Ready) {
			this.isReady = true;
			this.flushMessageQueue();
		}

		// Call registered handler if exists
		const handler = this.messageHandlers.get(message.type);
		if (handler) {
			handler(message);
		}
	}

	/**
	 * Flush queued messages after worker is ready
	 */
	private flushMessageQueue(): void {
		while (this.messageQueue.length > 0) {
			const message = this.messageQueue.shift();
			if (message) {
				this.send(message);
			}
		}
	}

	/**
	 * Terminate the worker
	 */
	destroy(): void {
		if (this.worker) {
			this.send({ type: WorkerMessageType.Destroy });
			// Give worker time to cleanup
			setTimeout(() => {
				this.worker?.terminate();
				this.worker = null;
			}, 100);
		}
		this.messageHandlers.clear();
		this.messageQueue = [];
		this.isReady = false;
	}
}

/**
 * Create a typed message sender for the worker
 */
export function createWorkerMessageSender(worker: Worker) {
	const messenger = new WorkerMessenger(worker);

	return {
		init: (canvas: OffscreenCanvas, width: number, height: number, devicePixelRatio: number, isDarkMode?: boolean) => {
			messenger.send<InitMessage>({
				type: WorkerMessageType.Init,
				canvas,
				width,
				height,
				devicePixelRatio,
				isDarkMode,
			});
		},

		updateNodes: (nodes: any[]) => {
			messenger.send<UpdateNodesMessage>({
				type: WorkerMessageType.UpdateNodes,
				nodes,
			});
		},

		updateLinks: (links: any[]) => {
			messenger.send<UpdateLinksMessage>({
				type: WorkerMessageType.UpdateLinks,
				links,
			});
		},

		setViewport: (width: number, height: number) => {
			messenger.send<SetViewportMessage>({
				type: WorkerMessageType.SetViewport,
				width,
				height,
			});
		},

		setTheme: (isDarkMode: boolean) => {
			messenger.send<SetThemeMessage>({
				type: WorkerMessageType.SetTheme,
				isDarkMode,
			});
		},

		pause: () => messenger.send({ type: WorkerMessageType.Pause }),
		resume: () => messenger.send({ type: WorkerMessageType.Resume }),
		destroy: () => messenger.destroy(),

		on: messenger.on.bind(messenger),
		off: messenger.off.bind(messenger),
	};
}