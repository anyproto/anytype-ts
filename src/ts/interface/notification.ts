export enum NotificationType {
	Usecase = 0,
	Invite = 1,
};

export interface Notification {
	id: string;
	type: NotificationType;
	status: boolean;
	object: any;
	subject: any;
	style?: any;
};