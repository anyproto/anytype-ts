import { EventEmitter } from 'events';
import { I, S, U, C, Preview, translate, Renderer } from 'Lib';

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

	constructor(config: SparkOnboardingConfig = {}) {
		super();
		// Use config or fallback to localhost
		// Note: process.env is not available in browser, would need to be injected at build time
		this.url = config.url || 'ws://localhost:8765';
		this.maxReconnectAttempts = config.maxRetries || 3;
	}

	async connect(): Promise<void> {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			return Promise.resolve();
		}

		if (this.isConnecting) {
			return new Promise((resolve, reject) => {
				const checkConnection = setInterval(() => {
					if (this.ws && this.ws.readyState === WebSocket.OPEN) {
						clearInterval(checkConnection);
						resolve();
					}
					if (!this.isConnecting) {
						clearInterval(checkConnection);
						reject(new Error('Connection failed'));
					}
				}, 100);
			});
		}

		return new Promise((resolve, reject) => {
			this.isConnecting = true;

			try {
				this.ws = new WebSocket(this.url, 'anytype-onboarding');

				this.ws.onopen = () => {
					console.log('[SparkOnboarding] Connected to server');
					this.isConnecting = false;
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
					}
				};

				this.ws.onerror = (error) => {
					console.error('[SparkOnboarding] WebSocket error:', error);
					this.isConnecting = false;
					this.emit('error', error);
					reject(error);
				};

				this.ws.onclose = () => {
					console.log('[SparkOnboarding] Disconnected from server');
					this.isConnecting = false;
					this.ws = null;
					this.sessionId = null;
					this.emit('disconnected');
					this.attemptReconnect();
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

		console.log(`[SparkOnboarding] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

		this.reconnectTimeout = setTimeout(() => {
			this.connect().catch(error => {
				console.error('[SparkOnboarding] Reconnection failed:', error);
			});
		}, delay);
	}

	disconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.sessionId = null;
		this.messageQueue = [];
	}

	private send(message: any): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.log('[SparkOnboarding] Queuing message:', message.type);
			this.messageQueue.push(message);
			return;
		}

		try {
			this.ws.send(JSON.stringify(message));
			console.log('[SparkOnboarding] Sent:', message.type);
		} catch (error) {
			console.error('[SparkOnboarding] Failed to send message:', error);
			this.messageQueue.push(message);
		}
	}

	private processMessageQueue(): void {
		while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
			const message = this.messageQueue.shift();
			this.send(message);
		}
	}

	private handleMessage(message: I.SparkMessage): void {
		console.log('[SparkOnboarding] Received:', message.type);

		switch (message.type) {
			case 'connected':
				this.sessionId = (message as I.ConnectedMessage).sessionId;
				this.emit('sessionStarted', this.sessionId);
				break;

			case 'questions_ready':
				this.emit('questionsReady', (message as I.QuestionsReadyMessage).questions);
				break;

			case 'space_name_generated':
				this.emit('spaceNameGenerated', (message as I.SpaceNameGeneratedMessage).spaceName);
				break;

			case 'user_benefit_generated':
				this.emit('userBenefitGenerated', (message as I.UserBenefitGeneratedMessage).userBenefit);
				break;

			case 'analysis_complete':
				const analysis = message as I.AnalysisCompleteMessage;
				this.emit('analysisComplete', {
					spaceName: analysis.spaceName,
					suggestedTypes: analysis.suggestedTypes
				});
				break;

			case 'generation_started':
				this.emit('generationStarted', (message as I.GenerationStartedMessage).totalTypes);
				break;

			case 'type_generated':
				const typeMsg = message as any; // The actual message structure differs from interface
				// The message has 'schema' not 'typeSchema'
				console.log('[SparkOnboarding Service] type_generated message:', typeMsg);
				this.emit('typeGenerated', typeMsg.typeName, typeMsg.schema);
				break;

			case 'property_generated':
				const propMsg = message as I.PropertyGeneratedMessage;
				this.emit('propertyGenerated', propMsg.typeName, propMsg.propertyName, propMsg.propertySchema);
				break;

			case 'object_generated':
				const objMsg = message as I.ObjectGeneratedMessage;
				this.emit('objectGenerated', objMsg.typeName, objMsg.object);
				break;

			case 'object_titles_generated':
				const titlesMsg = message as any;
				console.log('[SparkOnboarding Service] object_titles_generated message received:', titlesMsg);
				// Use typeName for clarity - 'type' in the message is the message type itself
				this.emit('object_titles_generated', {
					typeName: titlesMsg.typeName || titlesMsg.type_name, // The actual type name
					typeKey: titlesMsg.typeKey || titlesMsg.type_key,
					titles: titlesMsg.titles
				});
				break;

			case 'generation_progress':
				const progressMsg = message as I.GenerationProgressMessage;
				this.emit('generationProgress', progressMsg.status, progressMsg.progress);
				break;

			case 'workspace_ready':
				const workspaceMsg = message as I.WorkspaceReadyMessage;
				this.emit('workspaceReady', workspaceMsg.downloadUrl, workspaceMsg.manifest);
				break;

			case 'error':
				const errorMsg = message as I.ErrorMessage;
				this.emit('error', new Error(errorMsg.message));
				break;

			default:
				console.warn('[SparkOnboarding] Unknown message type:', message.type);
		}
	}

	// Public API methods
	startOnboarding(userGoal: string): void {
		this.send({
			type: 'start_onboarding',
			userGoal
		});
	}

	submitAnswers(answers: string[]): void {
		this.send({
			type: 'submit_answers',
			answers
		});
	}

	confirmTypes(selectedTypes: string[]): void {
		this.send({
			type: 'confirm_types',
			selectedTypes
		});
	}


	async importWorkspace(downloadUrl: string, manifest: I.WorkspaceManifest): Promise<void> {
		try {
			// First, create the workspace with usecase NONE
			C.WorkspaceCreate(
				{ 
					name: manifest.spaceName || 'AI Workspace',
					iconOption: 1 // Default icon option
				},
				I.Usecase.None, // Use NONE usecase
				(createMessage: any) => {
					if (createMessage.error && createMessage.error.code) {
						this.emit('importError', createMessage.error.description);
						console.error('[SparkOnboarding] Workspace creation failed:', createMessage.error.description);
						return;
					}

					// Get the newly created space ID
					const newSpaceId = createMessage.objectId || createMessage.spaceId;
					
					if (!newSpaceId) {
						this.emit('importError', 'Failed to create workspace');
						console.error('[SparkOnboarding] No space ID returned from workspace creation');
						return;
					}

					console.log('[SparkOnboarding] Workspace created with ID:', newSpaceId);

					// Convert relative URL to full URL if needed
					let fullUrl = downloadUrl;
					if (downloadUrl.startsWith('/')) {
						const baseUrl = this.url.replace('ws://', 'http://').replace('wss://', 'https://');
						fullUrl = `${baseUrl}${downloadUrl}`;
					}

					// Now import the experience into the created workspace
					C.ObjectImportExperience(
						newSpaceId, // Use the created space ID
						fullUrl, // url to download from
						manifest.spaceName || 'AI Workspace', // title
						false, // isNewSpace - false since we already created it
						true, // isAI - new parameter for AI onboarding
						(importMessage: any) => {
							if (importMessage.error && importMessage.error.code) {
								this.emit('importError', importMessage.error.description);
								console.error('[SparkOnboarding] Import failed:', importMessage.error.description);
								return;
							}

							// Switch to the new space
							const routeParam = {
								onRouteChange: () => {
									// Initialize space state
									U.Space.initSpaceState();

									// Open dashboard
									U.Space.openDashboard({ replace: true });

									// Emit success event
									this.emit('importSuccess', newSpaceId);
								}
							};
							
							U.Router.switchSpace(newSpaceId, '', true, routeParam, false);
						}
					);
				}
			);
		} catch (error) {
			console.error('[SparkOnboarding] Import failed:', error);
			this.emit('importError', error.message);
		}
	}

	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	getSessionId(): string | null {
		return this.sessionId;
	}
}

// Singleton instance
let instance: SparkOnboardingService | null = null;

export const getSparkOnboardingService = (config?: SparkOnboardingConfig): SparkOnboardingService => {
	if (!instance) {
		instance = new SparkOnboardingService(config);
	}
	return instance;
};
