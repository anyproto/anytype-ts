export enum SpaceStatus {
	Unknown					 = 0,
	Loading					 = 1,
	Ok						 = 2,
	Missing					 = 3,
	Error					 = 4,
	RemoteWaitingDeletion	 = 5,
	RemoteDeleted			 = 6,
	Deleted					 = 7,
};

export enum SpaceType {
	Private	 = 0,
	Personal = 1,
	Shared	 = 2,
};

export enum ParticipantPermissions {
	Reader			 = 0,
	Writer			 = 1,
	Owner			 = 2,
	NoPermissions	 = 3,
};

export enum ParticipantStatus {
	Joining			 = 0,
	Active			 = 1,
	Removed			 = 2,
	Declined		 = 3,
	Removing		 = 4,
};