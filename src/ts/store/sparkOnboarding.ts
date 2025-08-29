import { observable, action, makeObservable, computed } from 'mobx';
import { I, getSparkOnboardingService } from 'Lib';
import { SparkOnboardingService } from 'Lib/service/sparkOnboarding';

class SparkOnboardingStore {
	step: I.OnboardingStep = I.OnboardingStep.Goal;
	isConnected: boolean = false;
	isLoading: boolean = false;
	error: string | null = null;
	
	userGoal: string = '';
	questions: string[] = [];
	answers: string[] = [];
	spaceName: string = '';
	userBenefit: string = '';
	suggestedTypes: I.SuggestedType[] = [];
	selectedTypes: string[] = [];
	generationProgress: I.GenerationProgress = {
		total: 0,
		current: 0,
		types: [],
		status: ''
	};
	downloadUrl: string = '';
	manifest: I.WorkspaceManifest | null = null;

	// Graph visualization data - empty initially, will be populated by WebSocket events
	graphNodes: any[] = [];
	graphLinks: any[] = [];

	private service: SparkOnboardingService | null = null;

	// Utility function to convert type name to node ID
	// This ensures consistent ID generation across all handlers
	private typeNameToNodeId(typeName: string): string {
		return `type-${typeName.toLowerCase().replace(/\s+/g, '-')}`;
	}

	constructor() {
		makeObservable(this, {
			step: observable,
			isConnected: observable,
			isLoading: observable,
			error: observable,
			userGoal: observable,
			questions: observable,
			answers: observable,
			spaceName: observable,
			userBenefit: observable,
			suggestedTypes: observable,
			selectedTypes: observable,
			generationProgress: observable,
			downloadUrl: observable,
			manifest: observable,
			graphNodes: observable,
			graphLinks: observable,
			
			init: action,
			reset: action,
			connect: action,
			disconnect: action,
			resetError: action,
			setStep: action,
			setUserGoal: action,
			setAnswers: action,
			setSelectedTypes: action,
			startOnboarding: action,
			submitAnswers: action,
			confirmTypes: action,
			importWorkspace: action,
			addGraphNode: action,
			addGraphLink: action,
			
			isValid: computed,
			progressPercentage: computed,
			stepIndex: computed,
			totalSteps: computed
		});
	}

	init(): void {
		if (!this.service) {
			this.service = getSparkOnboardingService();
			this.setupEventListeners();
		}
		
		// Initialize with some sample nodes if empty
		const enableExamples = false; // Toggle to enable/disable example nodes
		if (enableExamples && this.graphNodes.length === 0) {
			const width = window.innerWidth;
			const height = window.innerHeight;
			const popupWidth = 720;
			const popupLeft = (width - popupWidth) / 2;
			const popupRight = popupLeft + popupWidth;
			
			// Define example types with icons that actually exist
			const exampleTypes = [
				{ label: 'Project', iconName: 'folder' },
				{ label: 'Task', iconName: 'checkbox' },
				{ label: 'Milestone', iconName: 'flag' },
				{ label: 'Note', iconName: 'document-text' },
				{ label: 'Idea', iconName: 'bulb' },
				{ label: 'Research', iconName: 'bookmark' }
			];
			
			// Position types using the same logic as real types
			const sampleNodes = [];
			const typeCount = exampleTypes.length;
			
			exampleTypes.forEach((type, index) => {
				let x, y;
				const useLeft = index % 2 === 0;
				
				if (useLeft) {
					// Center of left free area
					const leftFreeSpace = popupLeft;
					x = leftFreeSpace / 2 + (Math.random() - 0.5) * 100;
				} else {
					// Center of right free area
					const rightFreeSpace = width - popupRight;
					x = popupRight + (rightFreeSpace / 2) + (Math.random() - 0.5) * 100;
				}
				
				// Distribute vertically
				const verticalIndex = Math.floor(index / 2);
				const verticalCount = Math.ceil(typeCount / 2);
				const verticalSpacing = (height - 200) / Math.max(verticalCount - 1, 1);
				const baseY = 100 + (verticalIndex * verticalSpacing);
				y = Math.max(80, Math.min(height - 80, baseY));
				
				sampleNodes.push({
					id: this.typeNameToNodeId(type.label),
					type: 'type' as const,
					label: type.label,
					iconName: type.iconName, // Add the icon
					x: x,
					y: y,
					opacity: 0.9
				});
			});
			
			// Add objects around their types
			const objectsPerType = {};
			objectsPerType[this.typeNameToNodeId('Project')] = ['Q1 Launch'];
			objectsPerType[this.typeNameToNodeId('Task')] = ['Design Review', 'Testing'];
			objectsPerType[this.typeNameToNodeId('Milestone')] = ['Beta Release'];
			objectsPerType[this.typeNameToNodeId('Note')] = ['Meeting Notes'];
			objectsPerType[this.typeNameToNodeId('Idea')] = ['Feature Ideas'];
			objectsPerType[this.typeNameToNodeId('Research')] = ['Market Analysis'];
			
			// Position objects around their types
			sampleNodes.forEach(typeNode => {
				if (typeNode.type === 'type' && objectsPerType[typeNode.id]) {
					const objects = objectsPerType[typeNode.id];
					objects.forEach((objLabel, index) => {
						// Position objects in a circle around type
						const angle = (Math.PI * 2 * index) / objects.length - Math.PI / 2;
						const radius = 220 + (Math.random() * 40); // Same as real objects - much larger distance
						
						const objX = typeNode.x + radius * Math.cos(angle);
						const objY = typeNode.y + radius * Math.sin(angle);
						
						sampleNodes.push({
							id: `${typeNode.id}-obj-${index}`,
							type: 'object' as const,
							label: objLabel,
							x: Math.max(50, Math.min(width - 50, objX)),
							y: Math.max(50, Math.min(height - 50, objY)),
							opacity: 0.7
						});
					});
				}
			});
			
			// Create links between types and their objects
			const sampleLinks = [];
			sampleNodes.forEach(node => {
				if (node.type === 'object') {
					// Extract the type ID from the object ID
					const typeId = node.id.replace(/-obj-\d+$/, '');
					sampleLinks.push({
						source: typeId,
						target: node.id,
						opacity: 0.6
					});
				}
			});
			
			console.log('SparkOnboarding: Adding sample nodes', sampleNodes);
			
			// Use push to trigger observable updates
			sampleNodes.forEach(node => this.graphNodes.push(node));
			sampleLinks.forEach(link => this.graphLinks.push(link));
		}
	}

	reset(): void {
		this.step = I.OnboardingStep.Goal;
		this.isConnected = false;
		this.isLoading = false;
		this.error = null;
		this.userGoal = '';
		this.questions = [];
		this.answers = [];
		this.spaceName = '';
		this.userBenefit = '';
		this.suggestedTypes = [];
		this.selectedTypes = [];
		this.generationProgress = {
			total: 0,
			current: 0,
			types: [],
			status: ''
		};
		this.downloadUrl = '';
		this.manifest = null;
		// Keep initial test nodes or reset to empty
		this.graphNodes = [];
		this.graphLinks = [];
	}

	async connect(): Promise<void> {
		if (!this.service) {
			this.init();
		}

		this.isLoading = true;
		// Don't clear error immediately - keep it visible during retry attempt

		try {
			await this.service.connect();
			this.isConnected = true;
			this.error = null; // Clear error only on success
		} catch (error) {
			this.error = error.message || 'Failed to connect to onboarding service';
			this.isConnected = false;
		} finally {
			this.isLoading = false;
		}
	}

	disconnect(): void {
		if (this.service) {
			this.service.disconnect();
			this.isConnected = false;
		}
	}

	resetError(): void {
		this.error = null;
	}

	setStep(step: I.OnboardingStep): void {
		this.step = step;
	}

	setUserGoal(goal: string): void {
		this.userGoal = goal;
	}

	setAnswers(answers: string[]): void {
		this.answers = answers;
	}

	setSelectedTypes(types: string[]): void {
		this.selectedTypes = types;
	}

	async startOnboarding(): Promise<void> {
		if (!this.service || !this.userGoal) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			this.service.startOnboarding(this.userGoal);
		} catch (error) {
			this.error = error.message || 'Failed to start onboarding';
		}
	}

	async submitAnswers(): Promise<void> {
		if (!this.service || !this.answers.length) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			this.service.submitAnswers(this.answers);
		} catch (error) {
			this.error = error.message || 'Failed to submit answers';
		}
	}

	async confirmTypes(): Promise<void> {
		if (!this.service || !this.selectedTypes.length) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			this.service.confirmTypes(this.selectedTypes);
		} catch (error) {
			this.error = error.message || 'Failed to confirm types';
		}
	}

	async importWorkspace(): Promise<void> {
		if (!this.service || !this.downloadUrl || !this.manifest) {
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			// Use the space name that was generated and received via space_name_generated event
			// Override the manifest space name with the one from the event
			const manifestWithGeneratedName = {
				...this.manifest,
				spaceName: this.spaceName || this.manifest.spaceName
			};
			await this.service.importWorkspace(this.downloadUrl, manifestWithGeneratedName);
		} catch (error) {
			this.error = error.message || 'Failed to import workspace';
			this.isLoading = false;
		}
	}

	addGraphNode(node: any): void {
		// Increase limit to handle more nodes - performance should be fine with modern browsers
		const MAX_NODES = 50; // Increased from 20 to 50
		
		if (!this.graphNodes.find(n => n.id === node.id)) {
			// If we're at the limit, remove the oldest object node (preserve types)
			if (this.graphNodes.length >= MAX_NODES) {
				// Try to remove an object node first, not a type
				const objectIndex = this.graphNodes.findIndex(n => n.type === 'object');
				if (objectIndex !== -1) {
					this.graphNodes.splice(objectIndex, 1);
				} else {
					// If no objects, remove the oldest non-sample node
					const nonSampleIndex = this.graphNodes.findIndex(n => !n.id.startsWith('sample-'));
					if (nonSampleIndex !== -1) {
						this.graphNodes.splice(nonSampleIndex, 1);
					}
				}
			}
			this.graphNodes.push(node);
		}
	}

	addGraphLink(link: any): void {
		const linkExists = this.graphLinks.some(l => 
			l.source === link.source && l.target === link.target
		);
		if (!linkExists) {
			this.graphLinks.push(link);
		}
	}


	private getEdgePositions(): { positions: { useHorizontal: boolean; leftX?: number; rightX?: number; topY?: number; bottomY?: number } } {
		const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
		const height = typeof window !== 'undefined' ? window.innerHeight : 800;
		const aspectRatio = width / height;
		
		// Popup dimensions with extra margin
		const popupWidth = 720;
		const popupHeight = 680;
		const safeMargin = 100; // Extra margin around popup
		
		// Calculate available space on each side
		const horizontalSpace = (width - popupWidth) / 2;
		const verticalSpace = (height - popupHeight) / 2;
		
		// Decide whether to use horizontal (left/right) or vertical (top/bottom) placement
		// Use horizontal if there's enough space on the sides
		const useHorizontal = horizontalSpace > 250; // Need at least 250px on each side
		
		if (useHorizontal) {
			// Position nodes firmly on left and right edges
			// Make sure they're far from the popup center area
			const leftEdge = Math.min(100, horizontalSpace - safeMargin);
			const rightEdge = Math.max(width - 100, width - horizontalSpace + safeMargin);
			
			return {
				positions: {
					useHorizontal: true,
					leftX: leftEdge, // Firmly on left edge
					rightX: rightEdge // Firmly on right edge
				}
			};
		} else {
			// Position nodes on top and bottom edges for narrow screens
			const topEdge = Math.min(80, verticalSpace - safeMargin);
			const bottomEdge = Math.max(height - 80, height - verticalSpace + safeMargin);
			
			return {
				positions: {
					useHorizontal: false,
					topY: topEdge, // Firmly on top edge
					bottomY: bottomEdge // Firmly on bottom edge
				}
			};
		}
	}


	private setupEventListeners(): void {
		if (!this.service) {
			return;
		}

		this.service.on('connected', () => {
			this.isConnected = true;
		});

		this.service.on('sessionReconnected', (data: any) => {
			console.log('[SparkOnboarding Store] Session reconnected, restoring state:', data);
			this.isConnected = true;
			
			// Restore state from reconnection data
			if (data.state) {
				// Restore questions and answers if they exist
				if (data.state.questions) {
					this.questions = data.state.questions;
				}
				if (data.state.answers) {
					this.answers = data.state.answers;
				}
				// Restore space name if it exists
				if (data.state.spaceName) {
					this.spaceName = data.state.spaceName;
				}
				// Restore step - determine based on what data we have
				if (data.state.step) {
					this.step = data.state.step;
				}
				// Restore any generation progress
				if (data.state.generationProgress) {
					this.generationProgress = data.state.generationProgress;
				}
			}
		});

		this.service.on('disconnected', () => {
			this.isConnected = false;
		});

		this.service.on('error', (error: Error) => {
			this.error = error.message;
			this.isLoading = false;
		});

		this.service.on('questionsReady', (questions: string[]) => {
			this.questions = questions;
			this.step = I.OnboardingStep.Questions;
			this.isLoading = false;
		});

		this.service.on('spaceNameGenerated', (spaceName: string) => {
			this.spaceName = spaceName;
			
			// Don't add space name as a node - disabled
			// const { positions } = this.getEdgePositions();
			// 
			// // Remove any existing space node
			// this.graphNodes = this.graphNodes.filter(n => n.id !== 'space-name');
			// 
			// // Add the space name node at the left top corner
			// this.addGraphNode({
			// 	id: 'space-name',
			// 	type: 'type', // Use type styling for prominence
			// 	label: spaceName,
			// 	x: positions.useHorizontal ? positions.leftX! : 120, // Left edge
			// 	y: 80 // Top position
			// });
		});

		this.service.on('userBenefitGenerated', (benefit: string) => {
			console.log('[SparkOnboarding Store] userBenefitGenerated received, changing step from', this.step, 'to UserBenefit');
			this.userBenefit = benefit;
			this.step = I.OnboardingStep.UserBenefit;
		});

		this.service.on('analysisComplete', (data: { spaceName: string; suggestedTypes: I.SuggestedType[] }) => {
			console.log('[SparkOnboarding Store] analysisComplete received, current step:', this.step);
			console.log('[SparkOnboarding Store] Suggested types:', data.suggestedTypes);
			this.spaceName = data.spaceName;
			this.suggestedTypes = data.suggestedTypes;
			// Pre-select all types by default
			this.selectedTypes = data.suggestedTypes.map(t => t.key);
			
			// Skip TypeReview - auto-submit all types and go to generation
			console.log('[SparkOnboarding Store] Auto-submitting all types and skipping to generation');
			this.isLoading = false;
			
			// Auto-confirm all types after a brief delay to show the graph
			setTimeout(() => {
				this.confirmTypes();
			}, 500);
			
			// Clear sample nodes and add real types to the graph
			const filteredNodes = this.graphNodes.filter(n => !n.id.startsWith('sample-'));
			const filteredLinks = this.graphLinks.filter(l => 
				!l.source.startsWith('sample-') && !l.target.startsWith('sample-')
			);
			this.graphNodes = filteredNodes;
			this.graphLinks = filteredLinks;
			console.log('[SparkOnboarding Store] After clearing samples, nodes:', this.graphNodes.length, 'links:', this.graphLinks.length);
			
			// Add all suggested types to the graph immediately on the edges
			const { positions } = this.getEdgePositions();
			console.log('[SparkOnboarding Store] Adding types to graph, positions:', positions);
			
			// Calculate better spacing for types
			const typeCount = data.suggestedTypes.length;
			
			data.suggestedTypes.forEach((type, index) => {
				let x, y;
				
				// Get popup boundaries
				const popupLeft = (window.innerWidth - 720) / 2;
				const popupRight = popupLeft + 720;
				const popupTop = (window.innerHeight - 680) / 2;
				const popupBottom = popupTop + 680;
				
				if (positions.useHorizontal) {
					// Better distribution in free space
					const useLeft = index % 2 === 0;
					
					if (useLeft) {
						// Better distribution in left free space
						const leftFreeSpace = popupLeft;
						// Center of left free area
						x = leftFreeSpace / 2 + (Math.random() - 0.5) * 100; // Center with some variation
					} else {
						// Better distribution in right free space
						const rightFreeSpace = window.innerWidth - popupRight;
						// Center of right free area
						x = popupRight + (rightFreeSpace / 2) + (Math.random() - 0.5) * 100; // Center with some variation
					}
					
					// Better vertical distribution across full height
					const verticalIndex = Math.floor(index / 2);
					const verticalCount = Math.ceil(typeCount / 2);
					// Use more of the vertical space
					const verticalSpacing = (window.innerHeight - 200) / Math.max(verticalCount - 1, 1);
					const baseY = 100 + (verticalIndex * verticalSpacing);
					y = Math.max(80, Math.min(window.innerHeight - 80, baseY)); // Keep within bounds
				} else {
					// Use top and bottom edges for narrow screens
					const useTop = index % 2 === 0;
					y = useTop ? positions.topY : positions.bottomY;
					// Spread horizontally along the edge
					const horizontalIndex = Math.floor(index / 2);
					x = 250 + (horizontalIndex * 150); // Start at 250px from left, 150px spacing
				}
				
				const nodeId = this.typeNameToNodeId(type.name);
				const node = {
					id: nodeId,
					type: 'type',
					label: type.name,
					iconName: undefined, // Will be set from schema if available
					x: x || 100,
					y: y || 100
				};
				console.log('[SparkOnboarding Store] Creating type node with ID:', nodeId, 'for type:', type.name);
				console.log('[SparkOnboarding Store] Full node object:', node);
				this.addGraphNode(node);
			});
			console.log('[SparkOnboarding Store] Final graph state - nodes:', this.graphNodes.length, 'all nodes:', this.graphNodes);
		});

		this.service.on('generationStarted', (totalTypes: number) => {
			this.generationProgress = {
				total: totalTypes,
				current: 0,
				types: [],
				status: 'Starting generation...'
			};
			this.step = I.OnboardingStep.Generation;
			this.isLoading = false;
		});

		this.service.on('typeGenerated', (typeName: string, icon: string, properties: string[]) => {
			this.generationProgress.current++;
			this.generationProgress.types.push(typeName);
			this.generationProgress.status = `Generated type: ${typeName}`;
			
			// Update the type node with icon if provided
			const typeNodeId = this.typeNameToNodeId(typeName);
			const typeNode = this.graphNodes.find(n => n.id === typeNodeId);
			if (typeNode) {
				if (icon) {
					typeNode.iconName = icon;
					console.log('[SparkOnboarding Store] Updated type node with icon:', typeName, icon);
					
					// Force a re-render by creating a new array reference
					this.graphNodes = [...this.graphNodes];
				} else {
					// No icon provided - that's fine, node will display without icon
					console.log('[SparkOnboarding Store] No icon provided for type:', typeName);
				}
				
				// Log properties for debugging
				if (properties && properties.length > 0) {
					console.log('[SparkOnboarding Store] Type properties:', typeName, properties);
				}
			}
		});

		this.service.on('object_titles_generated', (data: { typeName: string; typeKey: string; titles: string[] }) => {
			console.log('[SparkOnboarding Store] object_titles_generated received:', data);
			console.log('[SparkOnboarding Store] Type name from event:', data.typeName);
			console.log('[SparkOnboarding Store] Type key from event:', data.typeKey);
			
			// Construct the type node ID from the type name (not typeKey) for consistency
			// This matches how we create the node ID in analysisComplete
			const typeNodeId = this.typeNameToNodeId(data.typeName);
			console.log('[SparkOnboarding Store] Generated type node ID:', typeNodeId);
			console.log('[SparkOnboarding Store] All nodes in graph:', this.graphNodes.map(n => ({ id: n.id, type: n.type, label: n.label })));
			console.log('[SparkOnboarding Store] Type nodes only:', this.graphNodes.filter(n => n.type === 'type').map(n => ({ id: n.id, label: n.label })));
			
			const typeNode = this.graphNodes.find(n => n.id === typeNodeId);
			console.log('[SparkOnboarding Store] Type node found?', typeNode ? 'YES' : 'NO', typeNode);
			
			if (typeNode) {
				console.log('[SparkOnboarding Store] Found type node:', typeNode.id, typeNode.label);
				// Add object nodes for each title
				const { positions } = this.getEdgePositions();
				
				data.titles.forEach((title, index) => {
					// Use the type node's ID for consistency
					const objectId = `${typeNode.id}-object-${index}`;
					
					// Position objects around their type node in a much wider circle
					const angle = (Math.PI * 2 * index) / data.titles.length - Math.PI / 2; // Start from top
					const radius = 220 + (Math.random() * 40); // 2.5x increase for much better separation
					
					// Calculate position and keep within bounds
					let objX = typeNode.x + radius * Math.cos(angle);
					let objY = typeNode.y + radius * Math.sin(angle);
					
					// Ensure objects stay within canvas bounds
					const margin = 50;
					objX = Math.max(margin, Math.min(window.innerWidth - margin, objX));
					objY = Math.max(margin, Math.min(window.innerHeight - margin, objY));
					
					const objectNode = {
						id: objectId,
						type: 'object' as const,
						label: title,
						x: objX,
						y: objY,
						opacity: 0.8 // Slightly more visible
					};
					
					console.log('[SparkOnboarding Store] Adding object node:', objectNode);
					this.addGraphNode(objectNode);
					
					// Add link from type to object
					this.addGraphLink({
						source: typeNode.id,
						target: objectId,
						opacity: 0.4
					});
				});
			} else {
				console.warn('[SparkOnboarding Store] Type node not found for type name:', data.typeName);
			}
		});

		// propertyGenerated is no longer sent - properties are included in typeGenerated

		this.service.on('objectGenerated', (typeName: string, object: any) => {
			this.generationProgress.status = `Created object: ${object?.title || 'Untitled'}`;
			
			// Skip adding to graph - we already handle this via object_titles_generated
			// This prevents duplicate nodes and link errors
			console.log('[SparkOnboarding Store] objectGenerated: Skipping graph update (handled by object_titles_generated)');
			return;
			
			/* DISABLED - Handled by object_titles_generated
			// Add object node to graph - clustered around parent type
			if (!typeName) {
				console.warn('[SparkOnboarding] objectGenerated: typeName is undefined');
				return;
			}
			const typeNodeId = `type-${typeName.toLowerCase().replace(/\s+/g, '-')}`;
			const parentNode = this.graphNodes.find(n => n.id === typeNodeId);
			
			if (parentNode) {
				const { positions } = this.getEdgePositions();
				const localObjectCount = this.graphNodes.filter(n => 
					n.type === 'object' && 
					this.graphLinks.some(l => l.source === typeNodeId && l.target === n.id)
				).length;
				
				let x, y;
				if (positions.useHorizontal) {
					// Objects stay near their parent type on the same edge
					const isLeftSide = parentNode.x < window.innerWidth / 2;
					// Keep objects on the same edge as their parent, just slightly offset
					x = parentNode.x + (isLeftSide ? 30 : -30);
					// Stack objects vertically near their parent
					y = parentNode.y + 40 + (localObjectCount * 35);
				} else {
					// Objects cluster around their parent on top/bottom
					const isTopSide = parentNode.y < window.innerHeight / 2;
					// Keep objects on the same edge as their parent
					y = parentNode.y + (isTopSide ? 30 : -30);
					// Spread objects horizontally near their parent
					x = parentNode.x + 40 + (localObjectCount * 60);
				}
				
				const objectNode = {
					id: `object-${object.title.toLowerCase().replace(/\s+/g, '-')}`,
					type: 'object',
					label: object.title,
					x: x,
					y: y
				};
				
				this.addGraphNode(objectNode);
				this.addGraphLink({
					source: typeNodeId,
					target: objectNode.id
				});
			}
			*/
		});

		this.service.on('generationProgress', (status: string, progress: number) => {
			this.generationProgress.status = status;
		});

		this.service.on('workspaceReady', (downloadUrl: string, spaceName: string) => {
			this.downloadUrl = downloadUrl;
			// Create a minimal manifest with just the space name
			// The actual counts will be taken from generationProgress
			this.manifest = {
				spaceName: spaceName,
				typesCount: this.generationProgress.types.length,
				objectsCount: this.graphNodes.filter(n => n.type === 'object').length,
				createdAt: new Date().toISOString()
			};
			this.step = I.OnboardingStep.Complete;
			this.isLoading = false;
		});

		this.service.on('importSuccess', (spaceId: string) => {
			// Space switch and navigation is handled by the service
			// Close the session permanently since we're done
			this.service.closeSession();
			// Reset the store
			this.reset();
			this.disconnect();
		});

		this.service.on('importError', (error: string) => {
			this.error = error;
			this.isLoading = false;
		});
	}

	get isValid(): boolean {
		switch (this.step) {
			case I.OnboardingStep.Goal:
				return this.userGoal.trim().length > 10;
			case I.OnboardingStep.Questions:
				return this.answers.length === this.questions.length && 
					   this.answers.every(a => a.trim().length > 0);
			case I.OnboardingStep.TypeReview:
				return this.selectedTypes.length > 0;
			default:
				return true;
		}
	}

	get progressPercentage(): number {
		if (this.generationProgress.total === 0) {
			return 0;
		}
		return Math.round((this.generationProgress.current / this.generationProgress.total) * 100);
	}

	get stepIndex(): number {
		const steps = [
			I.OnboardingStep.Goal,
			I.OnboardingStep.Questions,
			I.OnboardingStep.UserBenefit,
			I.OnboardingStep.TypeReview,
			I.OnboardingStep.Generation,
			I.OnboardingStep.Complete
		];
		return steps.indexOf(this.step);
	}

	get totalSteps(): number {
		return 6;
	}
}

export default new SparkOnboardingStore();
