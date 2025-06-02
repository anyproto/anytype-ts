/**
 * @fileoverview Contains the enum "NotificationType" and related definitions.
 */
import { I } from 'Lib';

export enum NotificationType {
        None             = '', // Generic notification
        Import           = 'import', // Import finished
        Export           = 'export', // Export finished
        Gallery          = 'galleryImport', // Image import
        Join             = 'requestToJoin', // Request to join space
        Leave            = 'requestToLeave', // Request to leave space
        Approve          = 'participantRequestApproved', // Join request approved
        Remove           = 'participantRemove', // Participant removed
        Decline          = 'participantRequestDecline', // Join request declined
        Permission       = 'participantPermissionsChange', // Permissions changed
};

export enum NotificationStatus {
        Created  = 0, // Notification created
        Shown    = 1, // Displayed to the user
        Read     = 2, // User read the notification
        Replied  = 3, // User interacted with it
};

export enum NotificationAction {
        Close    = 0, // User dismissed the notification
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