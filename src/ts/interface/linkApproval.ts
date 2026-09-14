/** Shared by the approval window, the session renderer and Electron main. */
export enum LocalApiPermission {
	Read = 0,
	ReadWrite = 1,
};

export interface LinkAppGrant {
	spaceIds: string[];
	allSpaces: boolean;
	perm: LocalApiPermission;
};

export interface LinkApprovalSpace {
	id: string;
	name: string;
	iconEmoji?: string;
};

/** The name is caller-supplied. Only the process and browser origin are attributable. */
export interface LinkClientInfo {
	processName?: string;
	processPath?: string;
	name?: string;
	origin?: string;
	signatureVerified?: boolean;
};

export interface LinkApprovalRequest {
	clientInfo: LinkClientInfo;
	scope: number;
	requestedPerm?: LocalApiPermission;
	spaces?: LinkApprovalSpace[];
	theme?: string;
	lang?: string;
};

export interface LinkApprovalPayload extends LinkApprovalRequest {
	key: string;
};

export interface LinkApprovalDecision {
	processPath?: string;
	origin?: string;
	allow: boolean;
	grant?: LinkAppGrant;
};
