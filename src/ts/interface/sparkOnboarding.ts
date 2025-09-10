export enum OnboardingStep {
	Goal		 = 'goal',
	Questions	 = 'questions',
	UserBenefit	 = 'userBenefit',
	TypeReview	 = 'typeReview',
	Generation	 = 'generation',
	Complete	 = 'complete',
	Error		 = 'error',
};

// Graph visualization interfaces
export interface GraphNode {
	id: string;
	type: 'type' | 'object' | 'space';
	label: string;
	x: number;
	y: number;
	iconName?: string;
	opacity?: number;
}

export interface GraphLink {
	source: string;
	target: string;
	opacity?: number;
}

// Core data interfaces
export interface SuggestedType {
	key: string;
	name: string;
	description: string;
	icon?: string;
	exampleTitles?: string[];
}

export interface GeneratedObject {
	id: string;
	title: string;
	[key: string]: any;
}

export interface ReconnectState {
	step?: OnboardingStep;
	userGoal?: string;
	spaceName?: string;
	suggestedTypes?: SuggestedType[];
	generationProgress?: GenerationProgress;
}

export interface WorkspaceManifest {
	spaceName: string;
	typesCount: number;
	objectsCount: number;
	createdAt: string;
}

export interface GenerationProgress {
	total: number;
	current: number;
	types?: string[];
	status?: string;
}

// Discriminated union for inbound messages
export type SparkInboundMessage =
	| ConnectedMessage
	| ReconnectedMessage
	| QuestionsReadyMessage
	| SpaceNameGeneratedMessage
	| UserBenefitGeneratedMessage
	| AnalysisCompleteMessage
	| GenerationStartedMessage
	| TypeGeneratedMessage
	| ObjectGeneratedMessage
	| ObjectTitlesGeneratedMessage
	| GenerationProgressMessage
	| WorkspaceReadyMessage
	| ErrorMessage;

// Individual message type interfaces
export interface ConnectedMessage {
	type: 'connected';
	sessionId: string;
}

export interface ReconnectedMessage {
	type: 'reconnected';
	sessionId: string;
	state?: ReconnectState;
}

export interface QuestionsReadyMessage {
	type: 'questions_ready';
	questions: string[];
}

export interface SpaceNameGeneratedMessage {
	type: 'space_name_generated';
	spaceName: string;
}

export interface UserBenefitGeneratedMessage {
	type: 'user_benefit_generated';
	userBenefit: string;
}

export interface AnalysisCompleteMessage {
	type: 'analysis_complete';
	spaceName: string;
	suggestedTypes: SuggestedType[];
}

export interface GenerationStartedMessage {
	type: 'generation_started';
	totalTypes: number;
}

export interface TypeGeneratedMessage {
	type: 'type_generated';
	typeName: string;
	icon?: string;
	properties?: string[];
}

export interface ObjectGeneratedMessage {
	type: 'object_generated';
	typeName: string;
	object: GeneratedObject;
}

export interface ObjectTitlesGeneratedMessage {
	type: 'object_titles_generated';
	typeName?: string;
	typeKey?: string;
	typeNameAlt?: string;
	titles: string[];
}

export interface GenerationProgressMessage {
	type: 'generation_progress';
	status: string;
	progress: number; // 0..1 or 0..100 depending on server implementation
}

export interface WorkspaceReadyMessage {
	type: 'workspace_ready';
	downloadUrl: string;
	spaceName: string;
}

export interface ErrorMessage {
	type: 'error';
	message: string;
	code?: string;
}

// Outbound message types
export type SparkOutboundMessage =
	| { type: 'start_onboarding'; userGoal: string }
	| { type: 'submit_answers'; answers: string[] }
	| { type: 'confirm_types'; selectedTypes: string[] }
	| { type: 'close_session' };

// Legacy SparkMessage for backward compatibility (deprecated)
export interface SparkMessage {
	type: string;
	[key: string]: any;
}

// Error handling for onboarding flow
export enum OnboardingErrorCode {
	ConnectionFailed = 'ConnectionFailed',
	WorkspaceCreateFailed = 'WorkspaceCreateFailed',
	ImportFailed = 'ImportFailed',
	Generic = 'Generic',
};

export interface OnboardingError {
	code: OnboardingErrorCode;
	message?: string;
}
