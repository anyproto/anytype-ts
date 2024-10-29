import { I } from 'Lib';

export enum NotificationType {
	None		 = '',
	Import		 = 'import',
	Export		 = 'export',
	Gallery		 = 'galleryImport',
	Join		 = 'requestToJoin',
	Leave		 = 'requestToLeave',
	Approve		 = 'participantRequestApproved',
	Remove		 = 'participantRemove',
	Decline		 = 'participantRequestDecline',
	Permission	 = 'participantPermissionsChange',
};

export enum NotificationStatus {
	Created	 = 0,
	Shown	 = 1,
	Read	 = 2,
	Replied	 = 3,
};

export enum NotificationAction {
	Close	 = 0,
};

export interface Notification {
	id: string;
	type: NotificationType;
	status: NotificationStatus;
	createTime: number;
	isLocal: boolean;
	payload: any;
	title?: string;
	text?: string;
};

export interface NotificationPayloadImport {
	processId: string;
	errorCode: number;
	importType: I.ImportType;
	spaceId: string;
	name: string;
};

export interface NotificationComponent {
	item: Notification;
	style?: any;
	resize?: () => void;
};