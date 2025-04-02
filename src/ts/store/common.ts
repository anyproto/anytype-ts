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
	public showVaultValue = null;
	public showSidebarRightValue = { full: false, popup: false };
	public hideSidebarValue = null;
	public pinValue = null;
	public firstDayValue = null;
	public gallery = {
		categories: [],
		list: [],
	};
	public diffValue: I.Diff[] = [];
	public refs: Map<string, any> = new Map();

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
	};

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
			showVaultValue: observable,
			hideSidebarValue: observable,
			spaceId: observable,
			membershipTiersList: observable,
			showSidebarRightValue: observable,
			showRelativeDatesValue: observable,
			dateFormatValue: observable,
			timeFormatValue: observable,
			pinValue: observable,
			firstDayValue: observable,
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
			showVault: computed,
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
			showVaultSet: action,
			showSidebarRightSet: action,
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
		if (!type || !type.isInstalled || !U.Object.isAllowedObject(type.recommendedLayout)) {
			type = S.Record.getTypeByKey(J.Constant.default.typeKey);
		};

		return type ? type.id : '';
	};

	get fullscreen (): boolean {
		return this.isFullScreen;
	};

	get pin (): string {
		if (this.pinValue === null) {
			this.pinValue = Storage.get('pin');
		};

		return String(this.pinValue || '');
	};

	get pinTime (): number {
		if (this.pinTimeId === null) {
			this.pinTimeId = Storage.get('pinTime');
		};

		return (Number(this.pinTimeId) || J.Constant.default.pinTime) * 1000;
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

	get showVault (): boolean {
		let ret = this.showVaultValue;
		if (ret === null) {
			ret = Storage.get('showVault');
		};
		if (undefined === ret) {
			ret = true;
		};
		return ret;
	};

	get firstDay (): number {
		if (this.firstDayValue === null) {
			this.firstDayValue = Storage.get('firstDay');
		};

		return Number(this.firstDayValue) || 1;
	};

	gatewaySet (v: string) {
		this.gatewayUrl = v;
	};

	fileUrl (id: string) {
		return [ this.gateway, 'file', String(id || '') ].join('/');
	};

	imageUrl (id: string, width: number) {
		return [ this.gateway, 'image', String(id || '') ].join('/') + `?width=${Number(width) || 0}`;
	};

	filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

	filterSetText (text: string) {
		this.filterObj.text = text;
	};

	filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

	previewSet (preview: I.Preview) {
		this.previewObj = preview;
	};

	graphSet (key: string, param: Partial<I.GraphSettings>) {
		Storage.set(key, Object.assign(this.getGraph(key), param));
		$(window).trigger('updateGraphSettings');
	};

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

	spaceSet (id: string) {
		this.spaceId = String(id || '');
	};

	previewClear () {
		this.previewObj = { type: I.PreviewType.None, target: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	toastClear () {
		this.toastObj = null;
	};

	typeSet (v: string) {
		this.defaultType = String(v || '');

		Storage.set('defaultType', this.defaultType);
	};

	pinTimeSet (v: string) {
		this.pinTimeId = Number(v) || J.Constant.default.pinTime;

		Storage.set('pinTime', this.pinTimeId);
	};

	pinSet (v: string) {
		this.pinValue = String(v || '');
		Storage.set('pin', this.pinValue);
	};

	emailConfirmationTimeSet (t: number) {
		this.emailConfirmationTimeId = t;

		Storage.set('emailConfirmationTime', this.emailConfirmationTimeId);
	};

	showRelativeDatesSet (v: boolean) {
		this.boolSet('showRelativeDates', v);
	};

	fullscreenObjectSet (v: boolean) {
		this.boolSet('fullscreenObject', v);
	};

	hideSidebarSet (v: boolean) {
		this.boolSet('hideSidebar', v);
	};

	showSidebarRightSet (isPopup: boolean, v: boolean) {
		set(this.showSidebarRightValue, { [isPopup ? 'popup' : 'full'] : v });
	};

	fullscreenSet (v: boolean) {
		this.isFullScreen = v;

		$('body').toggleClass('isFullScreen', v);
		$(window).trigger('resize');
	};

	showVaultSet (v: boolean) {
		this.boolSet('showVault', v);
	};

	themeSet (v: string) {
		this.themeId = String(v || '');
		this.setThemeClass();
	};

	redirectSet (v: string) {
		const param = U.Router.getParam(v);

		if ((param.page == 'auth') && (param.action == 'pin-check')) {
			return;
		};

		this.redirect = v;
	};

	notionTokenSet (v: string) {
		this.notionToken = v;
	};

	refSet (id: string, ref: any) {
		if (id && ref) {
			this.refs.set(id, ref);
		};
	};

	boolGet (k: string) {
		const tk = `${k}Value`;
		if (this[tk] === null) {
			this[tk] = Storage.get(k);
		};
		return !!this[tk];
	};

	boolSet (k: string, v: boolean) {
		v = Boolean(v);

		this[`${k}Value`] = v;
		Storage.set(k, v);
	};

	getThemeClass () {
		let ret = '';

		if (this.themeId == 'system') {
			ret = this.nativeThemeIsDark ? 'dark' : '';
		} else {
			ret = this.themeId;
		};

		return String(ret || '');
	};

	setThemeClass () {
		const head = $('head');
		const c = this.getThemeClass();

		U.Common.addBodyClass('theme', c);
		Renderer.send('setBackground', c);

		head.find('#link-prism').remove();
		if (c) {
			head.append(`<link id="link-prism" rel="stylesheet" href="./css/theme/${c}/prism.css" />`);
		};
	};

	getThemePath () {
		const c = this.getThemeClass();
		return c ? `theme/${c}/` : '';
	};

	nativeThemeSet (isDark: boolean) {
		this.nativeThemeIsDark = isDark;
	};

	languagesSet (v: string[]) {
		this.languages = v;
	};

	linkStyleSet (v: I.LinkCardStyle) {
		v = Number(v);
		this.linkStyleValue = v;
		Storage.set('linkStyle', v);
	};

	dateFormatSet (v: I.DateFormat) {
		v = Number(v);
		this.dateFormatValue = v;
		Storage.set('dateFormat', v);
	};

	timeFormatSet (v: I.TimeFormat) {
		v = Number(v);
		this.timeFormatValue = v;
		Storage.set('timeFormat', v);
	};

	isOnlineSet (v: boolean) {
		this.isOnlineValue = Boolean(v);
		console.log('[Online status]:', v);
	};

	firstDaySet (v: number) {
		this.firstDayValue = Number(v) || 1;
		Storage.set('firstDay', this.firstDayValue);
	};

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

	spaceStorageSet (value: Partial<SpaceStorage>) {
		set(this.spaceStorageObj, Object.assign(this.spaceStorageObj, value));
	};

	dataPathSet (v: string) {
		this.dataPathValue = String(v || '');
	};

	membershipTiersListSet (list: I.MembershipTier[]) {
		this.membershipTiersList = (list || []).map(it => new M.MembershipTier(it));
	};

	diffSet (diff: I.Diff[]) {
		this.diffValue = diff || [];
	};

	getGraph (key: string): I.GraphSettings {
		const stored = Storage.get(key);
		const def = U.Common.objectCopy(this.graphObj);

		return Object.assign(def, stored);
	};

	getRef (id: string) {
		return this.refs.get(id);
	};

	getShowSidebarRight (isPopup: boolean): boolean {
		return Boolean(this.showSidebarRightValue[isPopup ? 'popup' : 'full']);
	};

};

export const Common: CommonStore = new CommonStore();