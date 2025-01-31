export enum PublishStatus {
	Created		 = 0,
	Published	 = 1,
};

export interface PublishState {
	spaceId: string;
	objectId: string;
	uri: string;
	status: PublishStatus;
	version: string;
	timestamp: number;
	size: number;
	details: any;
};