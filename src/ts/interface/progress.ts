/**
 * @fileoverview Contains the enum "ProgressType" and related definitions.
 */
export enum ProgressType {
        Drop             = 'dropFiles', // File drop progress
        Import           = 'import', // Importing data
        Export           = 'export', // Exporting data
        Save             = 'saveFile', // Saving file
        Migrate          = 'migration', // Data migration
        Update           = 'update', // Application update
        UpdateCheck      = 'updateCheck', // Checking for updates
};

export enum ProgressState {
        None             = 0, // No operation
        Running          = 1, // Operation in progress
        Done             = 2, // Completed successfully
        Canceled         = 3, // Operation canceled
        Error            = 4, // Operation failed
};

export interface Progress {
	id?: string;
	spaceId?: string;
	type?: ProgressType;
	current?: number;
	total?: number;
	state?: ProgressState;
	canCancel?: boolean;
	error?: string;
};