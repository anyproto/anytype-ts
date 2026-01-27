import $ from 'jquery';
import { action, computed, intercept, makeObservable, observable, set } from 'mobx';
import { I, S, U, J, Storage, Renderer, keyboard } from 'Lib';

interface Filter {
	from: number;
	text: string;
};

interface SpaceStorage {
	bytesLimit: number;
	localUsage: number;
	spaces: {
		spaceId: string;
		bytesUsage: number;
	}[],
};

class CommonStore {

	public dataPathValue = '';
	public progressObj: I.Progress = null;
	public filterObj: Filter = { from: 0, text: '' };
	public gatewayUrl = '';
	public toastObj: I.Toast = null;
	public configObj: any = {};
	public cellId = '';
	public themeId = '';
	public nativeThemeIsDark = false;
	public defaultType = null;
	public pinTimeId = null;
	public isFullScreen = false;
	public singleTabValue = false;
	public redirect = '';
	public languages: string[] = [];
	public spaceId = '';
	public notionToken = '';
	public showRelativeDatesValue = null;
	public fullscreenObjectValue = null;
	public linkStyleValue = null;
	public fileStyleValue = null;
	public dateFormatValue = null;
	public timeFormatValue = null;
	public isOnlineValue = false;
	public chatCmdSendValue = null;
	public updateVersionValue = '';
	public vaultMessagesValue = null;
	public vaultIsMinimalValue = null;
	public leftSidebarStateValue = { page: '', subPage: '' };

	public recentEditModeValue: I.RecentEditMode = null;
	public hideSidebarValue = null;
	public autoDownloadValue = null;
	public pinValue = null;
	public firstDayValue = null;
	public gallery = {
		categories: [],
		list: [],
	};
	public diffValue: I.Diff[] = [];
	public refs: Map<string, any> = new Map();
	public windowId = '';
	public tabId = '';
	public windowIsFocused = true;
	public routeParam: any = {};
	public openObjectIds: Map<string, Set<string>> = new Map();
	public widgetSectionsValue: I.WidgetSectionParam[] = null;

	public rightSidebarStateValue: { full: I.SidebarRightState, popup: I.SidebarRightState } = { 
		full: {
			rootId: '',
			page: '',
			details: {},
			readonly: false,
			noPreview: false,
			previous: null,
			blockId: '',
			back: '',
		}, 
		popup: {
			rootId: '',
			page: '',
			details: {},
			readonly: false,
			noPreview: false,
			previous: null,
			blockId: '',
			back: '',
		},
	};

	public previewObj: I.Preview = { 
		type: null, 
		target: null, 
		element: null, 
		range: { from: 0, to: 0 }, 
		marks: [],
	};

	private graphObj: I.GraphSettings = { 
		icon: true,
		preview: true,
		orphan: true,
		marker: true,
		label: true,
		relation: true,
		files: false,
		link: true,
		local: false,
		cluster: false,
		filter: '',
		depth: 1,
		filterTypes: [],
		typeEdges: true,
	};

	private timeoutMap = new Map<string, number>();

	public spaceStorageObj: SpaceStorage = {
		bytesLimit: 0,
		localUsage: 0,
		spaces: [],
	};

	constructor () {
		makeObservable(this, {
			progressObj: observable,
			filterObj: observable,
			gatewayUrl: observable,
			previewObj: observable,
			toastObj: observable,
			configObj: observable,
			spaceStorageObj: observable,
			themeId: observable,
			nativeThemeIsDark: observable,
			defaultType: observable,
			isFullScreen: observable,
			singleTabValue: observable,
			fullscreenObjectValue: observable,
			linkStyleValue: observable,
			fileStyleValue: observable,
			isOnlineValue: observable,
			hideSidebarValue: observable,
			autoDownloadValue: observable,
			spaceId: observable,
			leftSidebarStateValue: observable,
			rightSidebarStateValue: observable,
			showRelativeDatesValue: observable,
			dateFormatValue: observable,
			timeFormatValue: observable,
			pinValue: observable,
			firstDayValue: observable,
			updateVersionValue: observable,
			vaultMessagesValue: observable,
			vaultIsMinimalValue: observable,
			widgetSectionsValue: observable,
			recentEditModeValue: observable,
			config: computed,
			preview: computed,
			toast: computed,
			filter: computed,
			gateway: computed,
			theme: computed,
			nativeTheme: computed,
			space: computed,
			isOnline: computed,
			showRelativeDates: computed,
			dateFormat: computed,
			timeFormat: computed,
			pin: computed,
			firstDay: computed,
			vaultMessages: computed,
			vaultIsMinimal: computed,
			widgetSections: computed,
			recentEditMode: computed,
			singleTab: computed,
			autoDownload: computed,
			gatewaySet: action,
			filterSetFrom: action,
			filterSetText: action,
			filterSet: action,
			previewSet: action,
			toastSet: action,
			toastClear: action,
			themeSet: action,
			nativeThemeSet: action,
			spaceSet: action,
			spaceStorageSet: action,
			linkStyleSet: action,
			fileStyleSet: action,
			dateFormatSet: action,
			timeFormatSet: action,
			isOnlineSet: action,
			setLeftSidebarState: action,
			setRightSidebarState: action,
			clearRightSidebarState: action,
			showRelativeDatesSet: action,
			pinSet: action,
			firstDaySet: action,
			vaultMessagesSet: action,
			vaultIsMinimalSet: action,
			widgetSectionsInit: action,
			widgetSectionsSet: action,
			recentEditModeSet: action,
			singleTabSet: action,
			autoDownloadSet: action,
		});

		intercept(this.configObj as any, change => U.Common.intercept(this.configObj, change));
	};

	get config (): any {
		const config = window.AnytypeGlobalConfig || this.configObj || {};

		config.languages = config.languages || [];
		config.debug = config.debug || {};
		config.flagsMw = config.flagsMw || {};

		return config;
	};

	get preview (): I.Preview {
		return this.previewObj;
	};

	get toast (): I.Toast {
		return this.toastObj;
	};

	get filter (): Filter {
		return this.filterObj;
	};

	get filterText () {
		return String(this.filter.text || '').replace(/^[@\[]+/, '');
	};

	get gateway (): string {
		return String(this.gatewayUrl || '');
	};

	get type (): string {
		if (this.defaultType === null) {
			this.defaultType = Storage.get('defaultType');
		};

		if (!this.defaultType) {
			this.defaultType = J.Constant.default.typeKey;
		};

		let type = S.Record.getTypeByKey(this.defaultType);
		if (!type || type.isArchived || type.isDeleted || !U.Object.isAllowedObject(type.recommendedLayout)) {
			type = S.Record.getTypeByKey(J.Constant.default.typeKey);
		};

		return type ? type.id : '';
	};

	get fullscreen (): boolean {
		return this.isFullScreen;
	};

	get singleTab (): boolean {
		return this.singleTabValue;
	};

	get pin (): string {
		return String(this.pinValue || '');
	};

	get pinTime (): number {
		let ret = this.pinTimeId;
		if (ret === null) {
			ret = Storage.get('pinTime');
		};
		return (Number(ret) || J.Constant.default.pinTime) * 1000;
	};

	get recentEditMode (): I.RecentEditMode {
		let ret = this.recentEditModeValue;
		if (ret === null) {
			ret = Storage.get('recentEditMode');
		};
		return Number(ret) || I.RecentEditMode.All;
	};

	get fullscreenObject (): boolean {
		let ret = this.fullscreenObjectValue;
		if (ret === null) {
			ret = Storage.get('fullscreenObject');
		};
		if (ret === undefined) {
			ret = true;
		};
		return ret;
	};

	get hideSidebar (): boolean {
		return this.boolGet('hideSidebar');
	};

	get autoDownload (): boolean {
		return this.boolGet('autoDownload');
	};

	get chatCmdSend (): boolean {
		return this.boolGet('chatCmdSend');
	};

	get theme (): string {
		return String(this.themeId || '');
	};

	get nativeTheme (): string {
		return this.nativeThemeIsDark ? 'dark' : '';
	};

	get space (): string {
		return String(this.spaceId || '');
	};

	get spaceStorage (): SpaceStorage {
		const spaces = this.spaceStorageObj.spaces || [];
		return { ...this.spaceStorageObj, spaces };
	};

	get interfaceLang (): string {
		return this.config.interfaceLang || J.Constant.default.interfaceLang;
	};

	get showRelativeDates (): boolean {
		return this.boolGet('showRelativeDates');
	};

	get linkStyle (): I.LinkCardStyle {
		let ret = this.linkStyleValue;
		if (ret === null) {
			ret = Storage.get('linkStyle');
		};
		if (undefined === ret) {
			ret = I.LinkCardStyle.Card;
		};
		return Number(ret) || I.LinkCardStyle.Text;
	};

	get fileStyle (): I.FileStyle {
		let ret = this.fileStyleValue;
		if (ret === null) {
			ret = Storage.get('fileStyle');
		};
		if (undefined === ret) {
			ret = I.FileStyle.Embed;
		};
		return Number(ret) || I.FileStyle.Embed;
	};

	get dateFormat (): I.DateFormat {
		let ret = this.dateFormatValue;
		
		if (ret === null) {
			ret = Storage.get('dateFormat');

			if (undefined === ret) {
				ret = I.DateFormat.Long;
			};
		};

		return Number(ret);
	};

	get timeFormat (): I.TimeFormat {
		let ret = this.timeFormatValue;
		if (ret === null) {
			ret = Storage.get('timeFormat');
		};
		return Number(ret) || I.TimeFormat.H12;
	};

	get dataPath (): string {
		return String(this.dataPathValue || '');
	};

	get isOnline (): boolean {
		return Boolean(this.isOnlineValue);
	};

	get diff (): I.Diff[] {
		return this.diffValue || [];
	};

	get firstDay (): number {
		if (this.firstDayValue === null) {
			this.firstDayValue = Storage.get('firstDay');
		};

		return Number(this.firstDayValue) || 1;
	};

	get updateVersion (): string {
		return String(this.updateVersionValue || '');
	};

	get widgetSections (): I.WidgetSectionParam[] {
		return this.widgetSectionsValue || [];
	};

	get vaultMessages (): any {
		return this.boolGet('vaultMessages');
	};

	get vaultIsMinimal (): any {
		return this.boolGet('vaultIsMinimal');
	};

	/**
	 * Sets the gateway URL.
	 * @param {string} v - The gateway URL.
	 */
	gatewaySet (v: string) {
		this.gatewayUrl = v;
	};

	/**
	 * Gets the file URL for a given file ID.
	 * @param {string} id - The file ID.
	 * @returns {string} The file URL.
	 */
	fileUrl (id: string) {
		return [ this.gateway, 'file', String(id || '') ].join('/');
	};

	/**
	 * Gets the image URL for a given image ID and width.
	 * @param {string} id - The image ID.
	 * @param {number} width - The image width.
	 * @returns {string} The image URL.
	 */
	imageUrl (id: string, width: number) {
		width = Number(width) || 0;

		if (width === 0) {
			width = 10000000;
		} else
		if ((width > 0) && (width <= I.ImageSize.Small)) {
			width = I.ImageSize.Small;
		} else
		if ((width > I.ImageSize.Small) && (width <= I.ImageSize.Medium)) {
			width = I.ImageSize.Medium;
		} else 
		if (width > I.ImageSize.Medium) {
			width = I.ImageSize.Large;
		};

		return id ? [ this.gateway, 'image', String(id || '') ].join('/') + `?width=${width}` : '';
	};

	/**
	 * Sets the filter 'from' value.
	 * @param {number} from - The 'from' value.
	 */
	filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

	/**
	 * Sets the filter text.
	 * @param {string} text - The filter text.
	 */
	filterSetText (text: string) {
		this.filterObj.text = text;
	};

	/**
	 * Sets the filter values.
	 * @param {number} from - The 'from' value.
	 * @param {string} text - The filter text.
	 */
	filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

	/**
	 * Sets the preview object.
	 * @param {I.Preview} preview - The preview object.
	 */
	previewSet (preview: I.Preview) {
		this.previewObj = preview;
	};

	/**
	 * Sets the graph settings for a key.
	 * @param {string} key - The key.
	 * @param {Partial<I.GraphSettings>} param - The graph settings.
	 */
	graphSet (key: string, param: Partial<I.GraphSettings>) {
		Storage.set(key, Object.assign(this.getGraph(key), param));
		$(window).trigger('updateGraphSettings');
	};

	/**
	 * Sets the toast object, resolving object references if needed.
	 * @param {I.Toast} toast - The toast object.
	 */
	toastSet (toast: I.Toast) {
		const { objectId, targetId, originId } = toast;
		const ids = [ objectId, targetId, originId ].filter(it => it);

		if (ids.length) {
			U.Object.getByIds(ids, {}, (objects: any[]) => {
				const map = U.Common.mapToObject(objects, 'id');

				if (targetId && map[targetId]) {
					toast.target = map[targetId];
				};

				if (objectId && map[objectId]) {
					toast.object = map[objectId];
				};

				if (originId && map[originId]) {
					toast.origin = map[originId];
				};

				this.toastObj = toast;
			});
		} else {
			this.toastObj = toast;
		};
	};

	/**
	 * Sets the current space ID.
	 * @param {string} id - The space ID.
	 */
	spaceSet (id: string) {
		this.spaceId = String(id || '');
	};

	/**
	 * Clears the preview object.
	 */
	previewClear () {
		this.previewObj = { type: I.PreviewType.None, target: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	/**
	 * Clears the toast object.
	 */
	toastClear () {
		this.toastObj = null;
	};

	/**
	 * Sets the default type.
	 * @param {string} v - The type value.
	 */
	typeSet (v: string) {
		this.defaultType = String(v || '');

		Storage.set('defaultType', this.defaultType);
	};

	/**
	 * Sets the pin time value.
	 * @param {string} v - The pin time value.
	 */
	pinTimeSet (v: string) {
		this.pinTimeId = Number(v) || J.Constant.default.pinTime;

		Storage.set('pinTime', this.pinTimeId);

		// Update the centralized timer in main process with new timeout
		if (keyboard.isPinChecked && this.pin) {
			Renderer.send('startPinTimer', this.pinTime);
		};
	};

	/**
	 * Gets the pin ID for storage.
	 */
	pinId () {
		const { account } = S.Auth;
		if (!account) {
			return '';
		};

		return [ account.id, 'pin' ].join('-');
	};

	/**
	 * Sets the pin value.
	 * @param {string} v - The pin value.
	 */
	pinSet (v: string) {
		this.pinValue = String(v || '');
		keyboard.setPinChecked(true);
		Renderer.send('keytarSet', this.pinId(), this.pinValue);
		Renderer.send('pinSet');
	};

	/**
	 * Removes the pin value.
	 */
	pinRemove () {
		this.pinValue = null;
		keyboard.setPinChecked(true);
		Renderer.send('keytarDelete', this.pinId());
		Renderer.send('stopPinTimer');
		Renderer.send('pinRemove');
	};

	/**
	 * Initializes the pin value, optionally calling a callback.
	 * @param {() => void} callBack - The callback function to call after initialization.
	 */
	pinInit (callBack?: () => void) {
		const pin = Storage.get('pin');

		if (pin) {
			this.pinSet(pin);
			Storage.delete('pin');

			callBack?.();
		} else {
			Renderer.send('keytarGet', this.pinId()).then((value: string) => {
				this.pinValue = String(value || '');

				callBack?.();
			}).catch((err: any) => {
				console.error('[Common] Error retrieving pin from keychain:', err);
				this.pinValue = '';

				callBack?.();
			});
		};
	};

	/**
	 * Sets the show relative dates value.
	 * @param {boolean} v - The show relative dates value.
	 */
	showRelativeDatesSet (v: boolean) {
		this.boolSet('showRelativeDates', v);
	};

	/**
	 * Sets the fullscreen object value.
	 * @param {boolean} v - The fullscreen value.
	 */
	fullscreenObjectSet (v: boolean) {
		this.boolSet('fullscreenObject', v);
	};

	/**
	 * Sets the hide sidebar value.
	 * @param {boolean} v - The hide sidebar value.
	 */
	hideSidebarSet (v: boolean) {
		this.boolSet('hideSidebar', v);
	};

	autoDownloadSet (v: boolean) {
		this.boolSet('autoDownload', v);
	};

	/**
	 * Sets the hide chat send option value.
	 * @param {boolean} v - Value.
	 */
	chatCmdSendSet (v: boolean) {
		this.boolSet('chatCmdSend', v);
	};

	/**
	 * Sets the show sidebar left value.
	 * @param {string} page - The page to set, '' if no page is shown
	 * @param {string} subPage - The subPage to set, '' if no page is shown
	 */
	setLeftSidebarState (page: string, subPage: string) {
		set(this.leftSidebarStateValue, { page, subPage });
	};

	/**
	 * Sets the show sidebar right value.
	 * @param {boolean} isPopup - Whether it is a popup.
	 * @param {string} page - The page to set, null if no page is shown
	 */
	setRightSidebarState (isPopup: boolean, v: Partial<I.SidebarRightState>) {
		v = Object.assign({ noPreview: true }, v);
		set(this.getRightSidebarState(isPopup), v);
	};

	/**
	 * Clears the right sidebar state.
	 * @param {boolean} isPopup - Whether it is a popup.
	 */
	clearRightSidebarState (isPopup: boolean) {
		set(this.rightSidebarStateValue[this.getStateKey(isPopup)], {
			rootId: '',
			page: '',
			details: {},
			readonly: false,
			noPreview: false,
			previous: null,
			blockId: '',
			back: '',
		});
	};

	/**
	 * Sets the fullscreen mode.
	 * @param {boolean} v - The fullscreen value.
	 */
	fullscreenSet (v: boolean) {
		this.isFullScreen = v;
	};

	/**
	 * Sets the single tab mode.
	 * @param {boolean} v - The single tab mode value.
	 */
	singleTabSet (v: boolean) {
		this.singleTabValue = v;
	};

	/**
	 * Sets the update version value.
	 * @param {string} v - The update version value.
	 */
	updateVersionSet (v: string) {
		this.updateVersionValue = String(v || '');
	};

	/**
	 * Sets the theme ID and updates the theme class.
	 * @param {string} v - The theme ID.
	 */
	themeSet (v: string) {
		this.themeId = String(v || '');
		this.setThemeClass();
	};

	/**
	 * Sets the redirect value.
	 * @param {string} v - The redirect value.
	 */
	redirectSet (v: string) {
		const param = U.Router.getParam(v);

		if ((param.page == 'auth') && (param.action == 'pin-check')) {
			return;
		};

		this.redirect = v;
	};

	/**
	 * Sets the Notion token value.
	 * @param {string} v - The Notion token value.
	 */
	notionTokenSet (v: string) {
		this.notionToken = v;
	};

	/**
	 * Sets a reference by ID.
	 * @param {string} id - The reference ID.
	 * @param {any} ref - The reference object.
	 */
	refSet (id: string, ref: any) {
		if (id && ref) {
			this.refs.set(id, ref);
		};
	};

	/**
	 * Gets a boolean value by key, loading from storage if needed.
	 * @param {string} k - The key.
	 * @returns {boolean} The boolean value.
	 */
	boolGet (k: string) {
		const tk = `${k}Value`;
		if (this[tk] === null) {
			this[tk] = Storage.get(k);
		};
		return !!this[tk];
	};

	/**
	 * Sets a boolean value by key and stores it.
	 * @param {string} k - The key.
	 * @param {boolean} v - The value to set.
	 */
	boolSet (k: string, v: boolean) {
		v = Boolean(v);

		this[`${k}Value`] = v;
		Storage.set(k, v);
	};

	/**
	 * Gets the current theme class string.
	 * @returns {string} The theme class.
	 */
	getThemeClass (): string {
		let ret = '';

		if (this.themeId == 'system') {
			ret = this.nativeThemeIsDark ? 'dark' : '';
		} else {
			ret = this.themeId;
		};

		return String(ret || '');
	};

	/**
	 * Sets the theme class on the document.
	 */
	setThemeClass () {
		const c = this.getThemeClass();

		U.Common.addBodyClass('theme', c);
		Renderer.send('setBackground', c);
	};

	/**
	 * Gets the theme path string.
	 * @returns {string} The theme path.
	 */
	getThemePath () {
		const c = this.getThemeClass();
		return c ? `theme/${c}/` : '';
	};

	/**
	 * Sets the native theme dark mode value.
	 * @param {boolean} isDark - Whether the theme is dark.
	 */
	nativeThemeSet (isDark: boolean) {
		this.nativeThemeIsDark = isDark;
	};

	/**
	 * Sets the available languages.
	 * @param {string[]} v - The languages array.
	 */
	languagesSet (v: string[]) {
		this.languages = v;
	};

	/**
	 * Sets the link style value.
	 * @param {I.LinkCardStyle} v - The link style value.
	 */
	linkStyleSet (v: I.LinkCardStyle) {
		v = Number(v);
		this.linkStyleValue = v;
		Storage.set('linkStyle', v);
	};

	/**
	 * Sets the file style value.
	 * @param {I.FileStyle} v - The file style value.
	 */
	fileStyleSet (v: I.FileStyle) {
		v = Number(v);
		this.fileStyleValue = v;
		Storage.set('fileStyle', v);
	};

	/**
	 * Sets the date format value.
	 * @param {I.DateFormat} v - The date format value.
	 */
	dateFormatSet (v: I.DateFormat) {
		v = Number(v);
		this.dateFormatValue = v;
		Storage.set('dateFormat', v);
	};

	/**
	 * Sets the time format value.
	 * @param {I.TimeFormat} v - The time format value.
	 */
	timeFormatSet (v: I.TimeFormat) {
		v = Number(v);
		this.timeFormatValue = v;
		Storage.set('timeFormat', v);
	};

	/**
	 * Sets the online status value.
	 * @param {boolean} v - The online status value.
	 */
	isOnlineSet (v: boolean) {
		this.isOnlineValue = Boolean(v);
		console.log('[Online status]:', v);
	};

	/**
	 * Sets the first day value.
	 * @param {number} v - The first day value.
	 */
	firstDaySet (v: number) {
		this.firstDayValue = Number(v) || 1;
		Storage.set('firstDay', this.firstDayValue);
	};

	/**
	 * Sets the vault messages value.
	 * @param {boolean} v - The vault messages value.
	 */
	vaultMessagesSet (v: boolean) {
		this.boolSet('vaultMessages', v);
	};

	/**
	 * Sets the vault isMinimal value.
	 * @param {boolean} v - The vault isMinimal value.
	 */
	vaultIsMinimalSet (v: boolean) {
		this.boolSet('vaultIsMinimal', v);
	};

	/**
	 * Sets the config object, optionally forcing all values.
	 * @param {any} config - The config object.
	 * @param {boolean} force - Whether to force all values.
	 */
	configSet (config: any, force: boolean) {
		let newConfig: any = {};
		if (force) {
			newConfig = Object.assign(newConfig, config);
		} else {
			for (const k in config) {
				if (undefined === this.configObj[k]) {
					newConfig[k] = config[k];
				};
			};
		};

		set(this.configObj, newConfig);

		this.configObj.debug = this.configObj.debug || {};
		this.singleTabSet(this.singleTab);
		
		keyboard.setBodyClass();
	};

	/**
	 * Sets the space storage object.
	 * @param {Partial<SpaceStorage>} value - The space storage value.
	 */
	spaceStorageSet (value: Partial<SpaceStorage>) {
		set(this.spaceStorageObj, Object.assign(this.spaceStorageObj, value));
	};

	/**
	 * Sets the data path value.
	 * @param {string} v - The data path value.
	 */
	dataPathSet (v: string) {
		this.dataPathValue = String(v || '');
	};

	/**
	 * Sets the diff value.
	 * @param {I.Diff[]} diff - The diff value.
	 */
	diffSet (diff: I.Diff[]) {
		this.diffValue = diff || [];
	};

	/**
	 * Sets the window ID.
	 * @param {string} id - The window ID.
	 */
	windowIdSet (id: string) {
		this.windowId = String(id || '');
	};

	/**
	 * Sets the tab ID.
	 * @param {string} id - The tab ID.
	 */
	tabIdSet (id: string) {
		this.tabId = String(id || '');
	};

	/**
	 * Gets the graph settings for a key.
	 * @param {string} key - The key.
	 * @returns {I.GraphSettings} The graph settings.
	 */
	getGraph (key: string): I.GraphSettings {
		const stored = Storage.get(key);
		const def = U.Common.objectCopy(this.graphObj);
		const result = Object.assign(def, stored);

		// Ensure typeEdges has a default value
		if (result.typeEdges === undefined) {
			result.typeEdges = true;
		};

		return result;
	};

	/**
	 * Gets a reference by ID.
	 * @param {string} id - The reference ID.
	 * @returns {any} The reference object.
	 */
	getRef (id: string) {
		return this.refs.get(id);
	};

	/**
	 * Gets the state key for a popup or full view.
	 * @param {boolean} isPopup - Whether it is a popup.
	 * @returns {string} The state key.
	 */
	getStateKey (isPopup: boolean): string {
		return isPopup ? 'popup' : 'full';
	};

	/**
	 * Gets the current state of the left sidebar.
	 * @returns {page: string; subPage: string;} The current state shown in the sidebar
	 */
	getLeftSidebarState (): { page: string; subPage: string; } {
		return this.leftSidebarStateValue || { page: '', subPage: '' };
	};

	/**
	 * Gets the current state of the right sidebar.
	 * @param {boolean} isPopup - Whether it is a popup.
	 * @returns {page: string; isOpen: boolean;} The current state shown in the sidebar
	 */
	getRightSidebarState (isPopup: boolean): I.SidebarRightState {
		return this.rightSidebarStateValue[this.getStateKey(isPopup)] || { page: '' };
	};

	/**
	 * Gets the timeout value for a given ID.
	 * @param {string} id - The timeout ID.
	 * @returns {number} The timeout value.
	 */
	getTimeout (id: string): number {
		return Number(this.timeoutMap.get(id)) || 0;
	};

	/**
	 * Sets a timeout for a given ID and function.
	 * @param {string} id - The timeout ID.
	 * @param {number} delay - The timeout duration.
	 * @param {() => void} func - The function to call after timeout.
	 */
	setTimeout (id: string, delay: number, func: () => void) {
		this.clearTimeout(id);

		const t = window.setTimeout(() => {
			this.timeoutMap.delete(id);
			func();
		}, delay);

		this.timeoutMap.set(id, t);
		return t;
	};

	/**
	 * Clears a timeout with a given ID.
	 * @param {string} id - The timeout ID.
	 */
	clearTimeout (id: string) {
		window.clearTimeout(this.getTimeout(id));
	};

	/**
	 * Sets whether the window is focused.
	 * @param {boolean} v - Whether the window is focused.
	 */
	windowIsFocusedSet (v: boolean) {
		this.windowIsFocused = Boolean(v);
	};

	recentEditModeSet (v: I.RecentEditMode) {
		this.recentEditModeValue = Number(v) || I.RecentEditMode.All;
		Storage.set('recentEditMode', this.recentEditModeValue);
	};

	nullifySpaceKeys () {
		this.defaultType = null;
		this.widgetSectionsInit();
	};

	widgetSectionsInit () {
		const saved = Storage.get('widgetSections') || [];
		const full = [ ...saved ];
		const order = [ 
			I.WidgetSection.Unread, 
			I.WidgetSection.Pin, 
			I.WidgetSection.RecentEdit, 
			I.WidgetSection.Type, 
			I.WidgetSection.Bin,
		];

		for (const id of order) {
			if (!full.find(it => it.id == id)) {
				full.push({ id, isClosed: false, isHidden: false });
			};
		};

		if (!U.Common.compareJSON(full, this.widgetSectionsValue)) {
			this.widgetSectionsValue = full;
		};
	};

	widgetSectionsSet (sections: I.WidgetSectionParam[]) {
		this.widgetSectionsValue = sections || [];
		Storage.set('widgetSections', this.widgetSectionsValue);
	};

	checkWidgetSection (id: I.WidgetSection): boolean {
		const section = this.widgetSections.find(it => it.id == id);
		return section && !section.isClosed && !section.isHidden;
	};

	getWidgetSection (id: I.WidgetSection) {
		return this.widgetSections.find(it => it.id == id);
	};

	updateWidgetSection (param: Partial<I.WidgetSectionParam>) {
		set(this.getWidgetSection(param.id), param);
		this.widgetSectionsSet(this.widgetSections);
	};

};

export const Common: CommonStore = new CommonStore();
