export enum SpaceStatus {
	Unknown					 = 0,
	Loading					 = 1,
	Ok						 = 2,
	Missing					 = 3,
	Error					 = 4,
	RemoteWaitingDeletion	 = 5,
	RemoteDeleted			 = 6,
	Deleted					 = 7,
	Active					 = 8,
	Joining					 = 9,
	Removing				 = 10,
};

export enum SpaceAccessType {
	Private					 = 0,
	Personal				 = 1,
	Shared					 = 2,
};

export enum SpaceType {
	None					 = 0,
	Data					 = 1,
	Tech					 = 2,
	Chat					 = 3,
	OneToOne				 = 4,
};

export enum SpaceCreateType {
	Personal				 = 0,
	Group					 = 1,
	Join					 = 2,
};

export enum ParticipantPermissions {
	Reader					 = 0,
	Writer					 = 1,
	Owner					 = 2,
	None					 = 3,
	Admin					 = 4,
};

export enum ParticipantStatus {
	Joining					 = 0,
	Active					 = 1,
	Removed					 = 2,
	Declined				 = 3,
	Removing				 = 4,
	Canceled				 = 5,
};

export enum InviteType {
	WithApprove 			 = 0,
	Guest 					 = 1,
	WithoutApprove 			 = 2,
};

export enum InviteLinkType {
	None 					 = 0,
	Editor 					 = 1,
	Viewer 					 = 2,
	Manual 					 = 3,
};

export enum MemberTab {
	All						 = 0,
	Request					 = 1,
	Editor					 = 2,
	Viewer					 = 3,
};

/**
 * The space's current invite, as returned by SpaceInviteGetCurrent.
 * When heldByOwner is true the invite lives in the owner's account: everyone else
 * gets a success response with an empty cid and key, and must not render a link.
 */
export interface Invite {
	cid: string;
	key: string;
	inviteType: InviteType;
	permissions: ParticipantPermissions;
	heldByOwner: boolean;
};

export enum NotificationMode {
	All						 = 0,
	Mentions				 = 1,
	Nothing					 = 2,
};
