import * as I from 'Interface';

export enum ProgressType {
	None		 = '',
	Drop		 = 'dropFiles',
	Import		 = 'import',
	Export		 = 'export',
	Save		 = 'saveFile',
	Migrate		 = 'migration',
	Update		 = 'update',
};

export enum ProgressState {
	None		 = 0,
	Running		 = 1,
	Done		 = 2,
	Canceled	 = 3,
	Error		 = 4,
};

// Import v2 progress surface (Event.Import.Statistic). Counters are per phase in two
// epochs — fetching counts spool rows against the claim count, creating counts persisted
// rows against the spool census — so they re-base at the fetching/creating boundary.
// There is deliberately no blended overall percentage: fetching is rate-limit bound and
// creating runs orders of magnitude faster, so a single bar crawls and then leaps.
export enum ImportPhase {
	Scanning	 = 0,
	Analyzing	 = 1,
	Fetching	 = 2,
	Creating	 = 3,
	Finalizing	 = 4,
};

export enum ImportRunState {
	Running		 = 0,
	Throttled	 = 1, // expected and calm: rate limiting is normal operation, not an error
	Retrying	 = 2,
	Error		 = 3,
};

export enum ImportCancelEffect {
	NothingToUndo	 = 0,
	RemovesCreated	 = 1,
};

export interface ImportStatistic {
	importId: string;
	processId: string;
	importType: I.ImportType;
	phase: ImportPhase;
	phaseStartedAt: number;
	totalsKnown: boolean;
	pagesTotal: number;
	pagesDone: number;
	filesTotal: number;
	filesDone: number;
	bytesTotal: number;
	bytesDone: number;
	state: ImportRunState;
	resumesInMs: number;
	attempt: number;
	attemptsMax: number;
	errorMessage: string;
	itemsPerSecond: number;
	estimatedRemainingMs: number;
	cancelEffect: ImportCancelEffect;
	objectsCreated: number;
	safeToClose: boolean;
	warningCount: number;
	errorCount: number;
	// User content: displayable, never loggable
	currentItem: string;
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
	statistic?: ImportStatistic;
};