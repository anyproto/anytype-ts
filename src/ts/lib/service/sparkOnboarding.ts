import { EventEmitter } from 'events';
import { I, U, C } from 'Lib';

interface SparkOnboardingConfig {
	url?: string;
	timeout?: number;
	maxRetries?: number;
}

export class SparkOnboardingService extends EventEmitter {

	private ws: WebSocket | null = null;
	private url: string;
	private sessionId: string | null = null;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 3;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private messageQueue: any[] = [];
	private isConnecting: boolean = false;
	private intentionalClose: boolean = false;
	private clearSessionOnClose: boolean = false;

	constructor( config: SparkOnboardingConfig = {}) {
		super();
		// Use config override or environment variable (with default)
		// SPARK_ONBOARDING_URL is injected at build time via rspack DefinePlugin
		this.url = config.url || SPARK_ONBOARDING_URL;
		
		// Convert http to ws and https to wss if needed
		if (this.url.startsWith('http://')) {
			this.url = this.url.replace('http://', 'ws://');
		} else 
			if (this.url.startsWith('https://')) {
			this.url = this.url.replace('https://', 'wss://');
		};
		
		this.maxReconnectAttempts = config.maxRetries || 3;
		
		// Session ID is only kept in memory for network reconnection
		// Not persisted to localStorage since a page refresh should start a new flow
		this.sessionId = null;
	}

	async connect(): Promise<void> {
		if (this.ws && (this.ws.readyState === WebSocket.OPEN)) {
			return Promise.resolve();
		};

		if (this.isConnecting) {
			return new Promise((resolve, reject) => {
				const checkConnection = setInterval(() => {
					if (this.ws && this.ws.readyState === WebSocket.OPEN) {
						clearInterval(checkConnection);
						resolve();
					};

					if (!this.isConnecting) {
						clearInterval(checkConnection);
						reject(new Error('Connection failed'));
					};
				}, 100);
			});
		};

		return new Promise((resolve, reject) => {
			this.isConnecting = true;

			try {
				// Build URL with auth token and session ID
				const url = new URL(this.url);
				
				// Check if auth is disabled (SPARK_ONBOARDING_NO_AUTH is injected at build time)
				const authDisabled = SPARK_ONBOARDING_NO_AUTH === 'true';
				
				// Add auth token if not disabled
				if (!authDisabled) {
					url.searchParams.append('token', SPARK_ONBOARDING_TOKEN);
				} else {
				};
				
				// Include session ID if we have one (for reconnection)
				if (this.sessionId) {
					url.searchParams.append('sessionId', this.sessionId);
				};
				
				const connectUrl = url.toString();
				this.ws = new WebSocket(connectUrl, 'anytype-onboarding');

				this.ws.onopen = () => {
					this.isConnecting = false;
					this.intentionalClose = false;
					this.clearSessionOnClose = false;
					this.reconnectAttempts = 0;
					this.processMessageQueue();
					this.emit('connected');
					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data);
						this.handleMessage(message);
					} catch (error) {
						console.error('[SparkOnboarding] Failed to parse message:', error);
					};
				};

				this.ws.onerror = (error) => {
					console.error('[SparkOnboarding] WebSocket error:', error);

					this.isConnecting = false;
					// Wrap the error properly since WebSocket onerror receives an Event, not an Error
					const wrappedError = new Error('WebSocket connection error');
					this.emit('error', wrappedError);

					reject(wrappedError);
				};

				this.ws.onclose = () => {

					this.isConnecting = false;
					this.ws = null;
					
					// Only clear sessionId if explicitly requested (closeSession)
					if (this.clearSessionOnClose) {
						this.sessionId = null;
					}
					
					this.emit('disconnected');
					
					// Only attempt reconnect if this wasn't an intentional close
					if (!this.intentionalClose) {
						this.attemptReconnect();
					}
				};
			} catch (error) {
				this.isConnecting = false;
				reject(error);
			}
		});
	}

	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.emit('reconnectFailed');
			return;
		}

		this.reconnectAttempts++;
		const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

		this.reconnectTimeout = setTimeout(() => {
			this.connect().catch(error => {
				console.error('[SparkOnboarding] Reconnection failed:', error);
			});
		}, delay);
	}

	disconnect(): void {
		// Set intentional close flag to prevent auto-reconnect
		this.intentionalClose = true;
		this.clearSessionOnClose = false;
		
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		};

		// Don't clear sessionId - keep it for potential reconnection
		// Session will remain on server for 20 minutes
		this.messageQueue = [];
	}

	private send(message: any): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			this.messageQueue.push(message);
			return;
		};

		try {
			this.ws.send(JSON.stringify(message));
		} catch (error) {
			console.error('[SparkOnboarding] Failed to send message:', error);
			this.messageQueue.push(message);
		};
	};

	private processMessageQueue(): void {
		while ((this.messageQueue.length > 0) && this.ws && (this.ws.readyState === WebSocket.OPEN)) {
			const message = this.messageQueue.shift();
			this.send(message);
		};
	};

	private handleMessage(message: I.SparkMessage): void {

		switch (message.type) {
			case 'connected': {
				this.sessionId = (message as I.ConnectedMessage).sessionId;

				this.emit('sessionStarted', this.sessionId);
				break;
			};

			case 'reconnected': {
				// Server restored our session, update state
				const reconnectMsg = message as any;
				this.sessionId = reconnectMsg.sessionId;

				this.emit('sessionReconnected', reconnectMsg);

				// Emit events to restore state
				if (reconnectMsg.state) {
					// Restore any state that needs to be synced
					this.emit('stateRestored', reconnectMsg.state);
				};
				break;
			};

			case 'questions_ready': {
				this.emit('questionsReady', (message as I.QuestionsReadyMessage).questions);
				break;
			};

			case 'space_name_generated': {
				this.emit('spaceNameGenerated', (message as I.SpaceNameGeneratedMessage).spaceName);
				break;
			};

			case 'user_benefit_generated': {
				this.emit('userBenefitGenerated', (message as I.UserBenefitGeneratedMessage).userBenefit);
				break;
			};

			case 'analysis_complete': {
				const analysis = message as I.AnalysisCompleteMessage;
				this.emit('analysisComplete', {
					spaceName: analysis.spaceName,
					suggestedTypes: analysis.suggestedTypes
				});
				break;
			};

			case 'generation_started': {
				this.emit('generationStarted', (message as I.GenerationStartedMessage).totalTypes);
				break;
			};

			case 'type_generated': {
				const typeMsg = message as any;
				
				// New structure: icon instead of schema
				this.emit('typeGenerated', typeMsg.typeName, typeMsg.icon, typeMsg.properties);
				break;
			};

			// property_generated is no longer sent - properties are included in type_generated

			case 'object_generated': {
				const objMsg = message as I.ObjectGeneratedMessage;
				this.emit('objectGenerated', objMsg.typeName, objMsg.object);
				break;
			};

			case 'object_titles_generated': {
				const titlesMsg = message as any;
				// Use typeName for clarity - 'type' in the message is the message type itself
				this.emit('object_titles_generated', {
					typeName: titlesMsg.typeName || titlesMsg.type_name, // The actual type name
					typeKey: titlesMsg.typeKey || titlesMsg.type_key,
					titles: titlesMsg.titles
				});
				break;
			};

			case 'generation_progress': {
				const progressMsg = message as I.GenerationProgressMessage;
				this.emit('generationProgress', progressMsg.status, progressMsg.progress);
				break;
			};

			case 'workspace_ready': {
				const workspaceMsg = message as any;
				// New structure: only spaceName and downloadUrl
				this.emit('workspaceReady', workspaceMsg.downloadUrl, workspaceMsg.spaceName);
				break;
			};

			case 'error': {
				const errorMsg = message as I.ErrorMessage;
				this.emit('error', new Error(errorMsg.message));
				break;
			};

			default: {
				break;
			};
		};
	};

	// Public API methods
	startOnboarding (userGoal: string): void {
		this.send({ type: 'start_onboarding', userGoal });
	};

	submitAnswers (answers: string[]): void {
		this.send({ type: 'submit_answers', answers });
	};

	confirmTypes (selectedTypes: string[]): void {
		this.send({ type: 'confirm_types', selectedTypes });
	};

	async importWorkspace (downloadUrl: string, manifest: I.WorkspaceManifest): Promise<void> {
		const name = manifest.spaceName || 'AI Workspace';

		try {
			// Wrap callback-based API in promises
			const createWorkspace = (): Promise<string> => {
				return new Promise((resolve, reject) => {
					C.WorkspaceCreate({ name, iconOption: 1 }, I.Usecase.None, (createMessage: any) => {
						if (createMessage.error && createMessage.error.code) {
							reject(new Error(createMessage.error.description));
							return;
						}

						const newSpaceId = createMessage.objectId || createMessage.spaceId;
						if (!newSpaceId) {
							reject(new Error('Failed to create workspace'));
							return;
						}

						resolve(newSpaceId);
					});
				});
			};

			const importExperience = (spaceId: string, url: string): Promise<void> => {
				return new Promise((resolve, reject) => {
					C.ObjectImportExperience(spaceId, url, name, false, true, (importMessage: any) => {
						if (importMessage.error && importMessage.error.code) {
							reject(new Error(importMessage.error.description));
							return;
						}
						resolve();
					});
				});
			};

			// Create the workspace
			const newSpaceId = await createWorkspace();

			// Convert relative URL to full URL if needed
			let fullUrl = downloadUrl;
			if (downloadUrl.startsWith('/')) {
				const baseUrl = new URL(this.url);
				baseUrl.protocol = baseUrl.protocol.replace('ws', 'http');
				baseUrl.search = ''; // Clear query params
				fullUrl = `${baseUrl.origin}${downloadUrl}`;
			}

			// Import the experience
			await importExperience(newSpaceId, fullUrl);

			// Switch to the new space
			const routeParam = {
				onRouteChange: () => {
					// Open dashboard
					U.Space.openDashboard({ replace: true });

					// Emit success event
					this.emit('importSuccess', newSpaceId);
				},
			};

			U.Router.switchSpace(newSpaceId, '', true, routeParam, false);

		} catch (error) {
			console.error('[SparkOnboarding] Import failed:', error);
			this.emit('importError', error.message || 'Import failed');
		}
	};

	isConnected (): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	};

	getSessionId (): string | null {
		return this.sessionId;
	};

	// Send close_session message to permanently close the session
	closeSession (): void {
		if (!this.sessionId) return;
		
		// Set flags to prevent reconnect and clear session on close
		this.intentionalClose = true;
		this.clearSessionOnClose = true;
		
		// Send close message to server
		this.send({ type: 'close_session' });
		
		// Let onclose handler clear sessionId
		// Don't null it here to allow orderly close
	};

};

// Singleton instance
let instance: SparkOnboardingService | null = null;

export const getSparkOnboardingService = (config?: SparkOnboardingConfig): SparkOnboardingService => {
	if (!instance) {
		instance = new SparkOnboardingService(config);
	}
	return instance;
};