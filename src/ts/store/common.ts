import $ from 'jquery';
import { action, computed, intercept, makeObservable, observable, set } from 'mobx';
import { I, M, S, U, J, Storage, Renderer } from 'Lib';

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
	public emailConfirmationTimeId = 0;
	public isFullScreen = false;
	public redirect = '';
	public languages: string[] = [];
	public spaceId = '';
	public notionToken = '';
	public showRelativeDatesValue = null;
	public fullscreenObjectValue = null;
	public linkStyleValue = null;
	public dateFormatValue = null;
	public timeFormatValue = null;
	public isOnlineValue = false;
	public updateVersionValue = '';
	public leftSidebarStateValue = { page: '', subPage: '' };
	public rightSidebarStateValue = { 
		full: { page: null, isOpen: false }, 
		popup: { page: null, isOpen: false },
	};
	public hideSidebarValue = null;
	public pinValue = null;
	public firstDayValue = null;
	public gallery = {
		categories: [],
		list: [],
	};
	public diffValue: I.Diff[] = [];
	public refs: Map<string, any> = new Map();
	public windowId = '';
	public windowIsFocused = true;
	public routeParam: any = {};

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

	public membershipTiersList: I.MembershipTier[] = [];

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
			fullscreenObjectValue: observable,
			linkStyleValue: observable,
			isOnlineValue: observable,
			hideSidebarValue: observable,
			spaceId: observable,
			membershipTiersList: observable,
			leftSidebarStateValue: observable,
			rightSidebarStateValue: observable,
			showRelativeDatesValue: observable,
			dateFormatValue: observable,
			timeFormatValue: observable,
			pinValue: observable,
			firstDayValue: observable,
			updateVersionValue: observable,
			config: computed,
			preview: computed,
			toast: computed,
			filter: computed,
			gateway: computed,
			theme: computed,
			nativeTheme: computed,
			membershipTiers: computed,
			space: computed,
			isOnline: computed,
			showRelativeDates: computed,
			dateFormat: computed,
			timeFormat: computed,
			pin: computed,
			firstDay: computed,
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
			dateFormatSet: action,
			timeFormatSet: action,
			isOnlineSet: action,
			membershipTiersListSet: action,
			setLeftSidebarState: action,
			setRightSidebarState: action,
			showRelativeDatesSet: action,
			pinSet: action,
			firstDaySet: action,
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

	get emailConfirmationTime (): number {
		return Number(this.emailConfirmationTimeId) || Storage.get('emailConfirmationTime') || 0;
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

	get membershipTiers (): I.MembershipTier[] {
		return this.membershipTiersList || [];
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
		Renderer.send('keytarSet', this.pinId(), this.pinValue);
		Renderer.send('pinSet');
	};

	/**
	 * Removes the pin value.
	 */
	pinRemove () {
		this.pinValue = null;
		Renderer.send('keytarDelete', this.pinId());
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
			});
		};
	};

	/**
	 * Sets the email confirmation time.
	 * @param {number} t - The time value.
	 */
	emailConfirmationTimeSet (t: number) {
		this.emailConfirmationTimeId = t;

		Storage.set('emailConfirmationTime', this.emailConfirmationTimeId);
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

	/**
	 * Sets the show sidebar left value.
	 * @param {boolean} isPopup - Whether it is a popup.
	 * @param {string} page - The page to set, null if no page is shown
	 */
	setLeftSidebarState (page: string, subPage: string) {
		set(this.leftSidebarStateValue, { page, subPage });
	};

	/**
	 * Sets the show sidebar right value.
	 * @param {boolean} isPopup - Whether it is a popup.
	 * @param {string} page - The page to set, null if no page is shown
	 */
	setRightSidebarState (isPopup: boolean, page: string, isOpen: boolean) {
		set(this.rightSidebarStateValue, { [ this.getStateKey(isPopup) ]: { page, isOpen } });
	};

	/**
	 * Sets the fullscreen mode.
	 * @param {boolean} v - The fullscreen value.
	 */
	fullscreenSet (v: boolean) {
		this.isFullScreen = v;

		$('body').toggleClass('isFullScreen', v);
		$(window).trigger('resize');
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
	getThemeClass (forceSystem?: boolean): string {
		let ret = '';

		if (forceSystem || (this.themeId == 'system')) {
			ret = this.nativeThemeIsDark ? 'dark' : '';
		} else {
			ret = this.themeId;
		};

		return String(ret || '');
	};

	/**
	 * Sets the theme class on the document.
	 */
	setThemeClass (forceSystem?: boolean) {
		const head = $('head');
		const c = this.getThemeClass(forceSystem);

		U.Common.addBodyClass('theme', c);
		Renderer.send('setBackground', c);

		head.find('#link-prism').remove();
		if (c) {
			head.append(`<link id="link-prism" rel="stylesheet" href="./css/theme/${c}/prism.css" />`);
		};
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
	 * Sets the config object, optionally forcing all values.
	 * @param {any} config - The config object.
	 * @param {boolean} force - Whether to force all values.
	 */
	configSet (config: any, force: boolean) {
		const html = $('html');
		
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
		html.toggleClass('debug', Boolean(this.configObj.debug.ui));
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
	 * Sets the membership tiers list.
	 * @param {I.MembershipTier[]} list - The membership tiers list.
	 */
	membershipTiersListSet (list: I.MembershipTier[]) {
		this.membershipTiersList = (list || []).map(it => new M.MembershipTier(it));
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
	getRightSidebarState (isPopup: boolean): { page: string; isOpen: boolean; } {
		return this.rightSidebarStateValue[this.getStateKey(isPopup)] || { page: '', isOpen: false };
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

	nullifySpaceKeys () {
		this.defaultType = null;
	};

};

export const Common: CommonStore = new CommonStore();
