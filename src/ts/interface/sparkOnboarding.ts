export enum OnboardingStep {
	Goal		 = 'goal',
	Questions	 = 'questions',
	UserBenefit	 = 'userBenefit',
	TypeReview	 = 'typeReview',
	Generation	 = 'generation',
	Complete	 = 'complete',
	Error		 = 'error',
};

export interface SparkMessage {
	type: string;
	[key: string]: any;
};

export interface ConnectedMessage extends SparkMessage {
	type: 'connected';
	sessionId: string;
};

export interface QuestionsReadyMessage extends SparkMessage {
	type: 'questions_ready';
	questions: string[];
};

export interface SpaceNameGeneratedMessage extends SparkMessage {
	type: 'space_name_generated';
	spaceName: string;
};

export interface UserBenefitGeneratedMessage extends SparkMessage {
	type: 'user_benefit_generated';
	userBenefit: string;
};

export interface SuggestedType {
	key: string;
	name: string;
	description: string;
	icon?: string;
};

export interface AnalysisCompleteMessage extends SparkMessage {
	type: 'analysis_complete';
	spaceName: string;
	suggestedTypes: SuggestedType[];
};

export interface GenerationStartedMessage extends SparkMessage {
	type: 'generation_started';
	totalTypes: number;
};

export interface TypeGeneratedMessage extends SparkMessage {
	type: 'type_generated';
	typeName: string;
	typeSchema: any;
};

export interface PropertyGeneratedMessage extends SparkMessage {
	type: 'property_generated';
	typeName: string;
	propertyName: string;
	propertySchema: any;
};

export interface ObjectGeneratedMessage extends SparkMessage {
	type: 'object_generated';
	typeName: string;
	object: {
		id: string;
		title: string;
		[key: string]: any;
	};
};

export interface GenerationProgressMessage extends SparkMessage {
	type: 'generation_progress';
	status: string;
	progress: number;
};

export interface WorkspaceManifest {
	spaceName: string;
	typesCount: number;
	objectsCount: number;
	createdAt: string;
};

export interface WorkspaceReadyMessage extends SparkMessage {
	type: 'workspace_ready';
	downloadUrl: string;
	manifest: WorkspaceManifest;
};

export interface ErrorMessage extends SparkMessage {
	type: 'error';
	message: string;
	code?: string;
};

export interface GenerationProgress {
	total: number;
	current: number;
	types?: string[];
	status?: string;
};