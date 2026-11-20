import { app } from 'electron';
import path from 'path';

/*
	Opt-in isolation for runs from source: pass --isolate-dev to give the app its own name,
	icon and data folder, so it never opens the installed app's accounts and config. It also
	leaves the browser web clipper connected to the installed app.
	--user-data-dir, when passed, overrides the isolated folder.
*/

export const DEV_NAME = 'Anytype Dev';
export const DEV_DATA_FOLDER = 'anytype-dev';

export const isIsolatedDev = (): boolean => !app.isPackaged && app.commandLine.hasSwitch('isolate-dev');

// Menu and tray text that names the app: isolated runs say Anytype Dev, in every language
export const withAppName = (text: string): string => (isIsolatedDev() ? String(text || '').replace(/Anytype/g, DEV_NAME) : text);

export const isolatedDataPath = (): string => path.join(app.getPath('appData'), DEV_DATA_FOLDER);

// Must run before anything reads userData
export const applyIsolatedDev = (): void => {
	if (!isIsolatedDev()) {
		return;
	};

	app.setName(DEV_NAME);

	if (!app.commandLine.hasSwitch('user-data-dir')) {
		app.setPath('userData', isolatedDataPath());
	};
};
