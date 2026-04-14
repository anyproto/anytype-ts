import { BrowserWindow, WebContentsView } from 'electron';

/** Extended BrowserWindow with custom properties for tab management */
export interface AppWindow extends BrowserWindow {
	windowId: number;
	isChild: boolean;
	isChallenge?: boolean;
	challenge?: string;
	route?: string;
	activeTabId?: string;
	views?: TabView[];
	tempMenuBarVisible?: boolean;
};

/** A WebContentsView augmented with tab metadata */
export interface TabView extends WebContentsView {
	id: string;
	data: TabData;
	isLoaded: boolean;
};

/** Tab data payload */
export interface TabData {
	route?: string;
	spaceId?: string;
	spaceType?: number;
	isPinned?: boolean;
};

/** Options for creating a new main window */
export interface CreateMainOptions {
	route?: string;
	token?: string;
	isChild: boolean;
	initialBounds?: { x: number; y: number; width?: number; height?: number };
	initialTabData?: TabData;
	restoredTabs?: SavedTabState;
};

/** Options for creating a tab */
export interface CreateTabOptions {
	deferLoad?: boolean;
	setActive?: boolean;
	fireAnalytics?: boolean;
};

/** Saved tab state for a single window */
export interface SavedTabState {
	tabs: { data: TabData }[];
	activeIndex: number;
	bounds?: { x: number; y: number; width: number; height: number };
};

/** Saved state for all windows */
export interface SavedWindowsState {
	windows: SavedTabState[];
};

/** Bounds rectangle */
export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
};

/** Config stored by ConfigManager */
export interface AppConfig {
	channel?: string;
	theme?: string;
	showMenuBar?: boolean;
	alwaysShowTabs?: boolean;
	hardwareAcceleration?: boolean;
	hideTray?: boolean;
	sudo?: boolean;
	zoom?: number;
	interfaceLang?: string;
	userDataPath?: string;
	updateDisabled?: boolean;
	updateTimeout?: number;
	disableCss?: boolean;
	experimental?: boolean;
	debug?: Record<string, boolean>;
	flagsMw?: Record<string, boolean>;
	languages?: string[];
	[key: string]: any;
};

/** DownloadProgress from electron-updater */
export interface DownloadProgress {
	bytesPerSecond: number;
	percent: number;
	transferred: number;
	total: number;
};
