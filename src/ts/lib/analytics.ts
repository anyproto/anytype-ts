import * as amplitude from 'amplitude-js';
import { I, C, S, U, J, Relation, Renderer } from 'Lib';

const KEYS = [ 
	'method', 'id', 'action', 'style', 'code', 'route', 'format', 'color', 'step',
	'type', 'objectType', 'linkType', 'embedType', 'relationKey', 'layout', 'align', 'template', 'index', 'condition',
	'tab', 'document', 'page', 'count', 'context', 'originalId', 'length', 'group', 'view', 'limit', 'usecase', 'name',
	'processor', 'emptyType', 'status', 'sort', 'widgetType', 'origin', 'apiAppName', 'unreadMessageCount', 'hasMentions',
	'uxType',
];
const URL = 'amplitude.anytype.io';

class Analytics {
	
	instance: any = null;
	contextId: string = '';
	stack: any[] = [];

	public route = {
		app: 'App',
		block: 'Block',
		onboarding: 'Onboarding',
		collection: 'Collection',
		set: 'Set',
		gallery: 'Gallery',
		settings: 'Settings',
		featured: 'FeaturedRelations',
		notification: 'Notification',
		deleted: 'Deleted',
		banner: 'Banner',
		widget: 'Widget',
		addWidget: 'AddWidget',
		inWidget: 'InWidget',
		graph: 'Graph',
		store: 'Library',
		type: 'Type',
		bookmark: 'Bookmark',
		webclipper: 'Webclipper',
		clipboard: 'Clipboard',
		shortcut: 'Shortcut',
		turn: 'TurnInto',
		powertool: 'Powertool',
		syncStatus: 'SyncStatus',
		search: 'Search',
		relation: 'Relation',
		link: 'Link',
		mention: 'Mention',
		media: 'Media',
		calendar: 'Calendar',
		allObjects: 'AllObjects',
		vault: 'Vault',
		void: 'Void',
		chat: 'Chat',
		archive: 'Bin',
		toast: 'Toast',
		share: 'Share',
		navigation: 'Navigation',
		object: 'Object',
		library: 'Library',
		header: 'Header',

		screenDate: 'ScreenDate',
		screenRelation: 'ScreenRelation',
		screenType: 'ScreenType',

		menuOnboarding: 'MenuOnboarding',
		menuObject: 'MenuObject',
		menuSystem: 'MenuSystem',
		menuHelp: 'MenuHelp',
		menuContext: 'MenuContext',
		menuAction: 'MenuAction',
		menuAdd: 'MenuAdd',

		migrationOffer: 'MigrationImportBackupOffer',
		migrationImport: 'MigrationImportBackupOffer',

		settingsSpace: 'SettingsSpace',
		settingsSpaceIndex: 'ScreenSettingsSpaceIndex',
		settingsSpaceShare: 'ScreenSettingsSpaceShare',
		settingsMembership: 'ScreenSettingsMembership',

		inviteConfirm: 'ScreenInviteConfirm',

		addWidgetMain: 'Main',
		addWidgetEditor: 'Editor',
		addWidgetMenu: 'Menu',
		addWidgetDnD: 'DnD',

		usecaseApp: 'App',
		usecaseSite: 'Site',

		onboardingTooltip: 'OnboardingTooltip',

		message: 'Message',
		reaction: 'Reaction',
		icon: 'Icon',
		editor: 'Editor',
	};

	public widgetType = {
		manual: 'Manual',
		auto: 'Auto',
	};

	/**
	 * Checks if analytics debug mode is enabled.
	 * @returns {boolean} True if debug mode is enabled.
	 */
	debug () {
		return S.Common.config.debug.analytics;
	};

	/**
	 * Checks if analytics is allowed based on config and environment.
	 * @returns {boolean} True if analytics is allowed.
	 */
	isAllowed (): boolean {
		const { config } = S.Common;
		return !(config.sudo || !U.Common.getElectron().isPackaged) || this.debug();
	};
	
	/**
	 * Initializes the analytics instance with options and sets user properties.
	 * @param {any} [options] - Optional initialization options.
	 */
	init (options?: any) {
		if (this.instance) {
			return;
		};

		const { interfaceLang, config } = S.Common;
		const electron = U.Common.getElectron();
		const platform = U.Common.getPlatform();
		const hasDefaultPath = electron.userPath() == electron.defaultPath();

		this.instance = amplitude.getInstance();
		this.instance.init(J.Constant.amplitude, null, Object.assign({
			apiEndpoint: URL,
			batchEvents: true,
			saveEvents: true,
			includeUtm: true,
			includeReferrer: true,
			platform,
			trackingOptions: {
				ipAddress: false,
			},
		}, options || {}));

		const props: any = { 
			deviceType: 'Desktop',
			platform,
			interfaceLang,
			hasDefaultPath: Number(hasDefaultPath),
			releaseChannel: config.channel,
		};

		if (electron.version) {
			props.osVersion = electron.version.os;
			this.instance.setVersionName(electron.version.app);
		};

		this.setProperty(props);
		this.removeContext();
		this.setVersion();

		if (U.Common.isPlatformLinux()) {
			Renderer.send('linuxDistro').then((data: any) => {
				if (!data) {
					return;
				};

				this.setProperty({ 
					linuxDistroName: data.os,
					linuxDistroVersion: data.release,
				});
			});
		};

		this.log('[Analytics].init');
	};

	/**
	 * Sets the version for analytics events based on app config and environment.
	 */
	setVersion () {
		const { config } = S.Common;
		const platform = U.Common.getPlatform();
		const electron = U.Common.getElectron();
		const { version, isPackaged, userPath } = electron;

		if (!version) {
			return;
		};

		let ret = String(version.app || '').split('-');
		if (ret.length) {
			ret = [ ret[0] ];
		};

		if (config.sudo || !isPackaged || [ 'alpha' ].includes(config.channel)) {
			ret.push('dev');
		} else
		if ([ 'beta' ].includes(config.channel)) {
			ret.push(config.channel);
		};

		C.InitialSetParameters(platform, ret.join('-'), userPath(), '', false, false);
	};

	/**
	 * Sets the user profile for analytics.
	 * @param {string} id - The user ID.
	 * @param {string} networkId - The network ID.
	 */
	profile (id: string, networkId: string) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserId(id);
		this.log(`[Analytics].profile: ${id}`);	

		if (id) {
			this.setProperty({ networkId });
		};
	};

	/**
	 * Sets the current analytics context.
	 * @param {string} context - The context identifier.
	 */
	setContext (context: string) {
		this.contextId = context;
		this.log(`[Analytics].setContext: ${context}`);
	};

	/**
	 * Removes the current analytics context.
	 */
	removeContext () {
		this.contextId = '';
	};

	/**
	 * Sets the user's tier property for analytics.
	 * @param {I.TierType} tier - The user's tier.
	 */
	setTier (tier: I.TierType) {
		this.setProperty({ tier: I.TierType[tier] || 'Custom' });
	};

	/**
	 * Sets user properties for analytics.
	 * @param {any} props - The properties to set.
	 */
	setProperty (props: any) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserProperties(props);
		this.log(`[Analytics].setProperty: ${JSON.stringify(props, null, 3)}`);
	};

	/**
	 * Logs an analytics event with the given code and data.
	 * @param {string} code - The event code.
	 * @param {any} [data] - Optional event data.
	 */
	event (code: string, data?: any) {
		data = data || {};

		if (!this.instance || !this.isAllowed() || !code) {
			return;
		};

		const converted: any = {};
		const space = U.Space.getSpaceview();
		const participant = U.Space.getMyParticipant();

		let param: any = {};

		if (space) {
			param.spaceType = Number(space.spaceAccessType) || 0;
			param.spaceType = I.SpaceType[param.spaceType];

			let uxType = I.SpaceUxType.Space;
			if (undefined !== data.uxType) {
				uxType = data.uxType;
			};
			if (undefined !== space.uxType) {
				uxType = space.uxType;
			};
			if (undefined !== uxType) {
				param.uxType = I.SpaceUxType[Number(uxType) || 0];
			};
		};

		if (participant) {
			param.permissions = Number(participant.permissions) || 0;
			param.permissions = I.ParticipantPermissions[param.permissions];
		};

		// Code mappers for common events
		switch (code) {
			case 'page': {
				code = this.pageMapper(data.params);
				break;
			};

			case 'popup': {
				code = this.popupMapper(data.params);
				break;
			};

			case 'menu': {
				code = this.menuMapper(data.params);
				break;
			};

			case 'settings': {
				code = this.settingsMapper(data.params);
				break;
			};
		};

		if (!code) {
			return;
		};

		switch (code) {
			case 'SelectGraphNode':
			case 'CreateObject': {
				data.layout = I.ObjectLayout[data.layout];
				break;
			};

			case 'ScreenSet':
			case 'ScreenCollection': {
				data.type = I.ViewType[data.type];
				break;
			};

			case 'SelectNetwork':
				data.type = this.networkType(data.type);
				break;

			case 'CreateBlock':
			case 'ChangeBlockStyle': {
				data.style = Number(data.style) || 0;

				switch (data.type) {
					case I.BlockType.Text: {
						data.style = I.TextStyle[data.style];
						break;
					};

					case I.BlockType.Div: {
						data.style = I.DivStyle[data.style];
						break;
					};

					case I.BlockType.Dataview: {
						data.style = I.ViewType[data.style];
						break;
					};

					case I.BlockType.File: {
						if (undefined !== data.params?.fileType) {
							data.fileType = Number(data.params.fileType) || 0;
							data.type = I.FileType[data.fileType];
						};
						if (data.style == I.FileStyle.Auto) {
							data.style = I.FileStyle.Embed;
						} else {
							data.style = I.FileStyle[data.style];
						};
						break;
					};

					case I.BlockType.Embed: {
						data.processor = I.EmbedProcessor[Number(data.params.processor) || 0];
						delete(data.style);
						break;
					};

					default: {
						delete(data.style);
						break;
					};
				};
				break;
			};

			case 'ChangeSpaceUxType': {
				data.type = Number(data.type) || 0;
				data.type = I.SpaceUxType[data.type];
				break;
			};

			case 'SetCover':
			case 'SettingsWallpaperSet': {
				data.type = Number(data.type) || 0;
				data.type = I.CoverType[data.type];
				data.id = String(data.id || '').replace(/^c([\d]+)/, '$1');

				if (data.type == I.CoverType.Upload) {
					delete(param.id);
				};
				break;
			};

			case 'AddView':
			case 'SwitchView':
			case 'DuplicateView':
			case 'ChangeViewType': {
				data.type = Number(data.type) || 0;
				data.type = I.ViewType[data.type];
				break;
			};

			case 'AddFilter':
			case 'ChangeFilterValue': {
				data.condition = Number(data.condition) || 0;
				data.condition = I.FilterCondition[data.condition];
				break;
			};

			case 'ChangeSortValue': {
				data.type = I.SortType[(Number(data.type) || 0)];
				data.emptyType = I.EmptyType[(Number(data.emptyType) || 0)];
				break;
			};

			case 'ChangeTextStyle': {
				data.type = Number(data.type) || 0;
				data.type = I.MarkType[data.type];
				break;
			};

			case 'UploadMedia':
			case 'DownloadMedia': {
				data.type = Number(data.type) || 0;
				data.type = I.FileType[data.type];
				break;
			};

			case 'ClickExport':
			case 'Export': {
				data.type = Number(data.type) || 0;
				data.type = I.ExportType[data.type];
				break;
			};

			case 'ClickImport':
			case 'ClickImportFile':
			case 'Import': {
				data.type = Number(data.type) || 0;
				data.type = I.ImportType[data.type];
				break;
			};

			case 'ShowDataviewRelation':
			case 'DeleteRelationValue':
			case 'ChangeRelationValue':
			case 'FeatureRelation':
			case 'UnfeatureRelation':
			case 'CreateRelation':
			case 'AddExistingRelation': {
				data.format = Number(data.format) || 0;
				data.format = I.RelationType[data.format];
				break;
			};

			case 'ClickGridFormula':
			case 'ChangeGridFormula': {
				data.format = Number(data.format) || 0;
				data.format = I.RelationType[data.format];
				data.type = Number(data.type) || 0;
				data.type = I.FormulaType[data.type];
				break;
			};

			case 'OpenAsObject': {
				if (data.type == I.BlockType.File) {
					if (undefined !== data.params?.fileType) {
						data.fileType = Number(data.params.fileType) || 0;
						data.type = I.FileType[data.fileType];
					};
				};
				break;
			};

			case 'ObjectImport': {
				data.type = I.ImportType[data.type];
				break;
			};

			case 'AddWidget': {
				data.type = I.WidgetLayout[data.type];
				break;
			};

			case 'SelectUsecase': {
				data.type = Number(data.type) || 0;
				data.type = I.Usecase[data.type];
				break;
			};

			case 'ChangeWidgetSource':
			case 'ChangeWidgetLayout':
			case 'ChangeWidgetLimit':
			case 'ReorderWidget':
			case 'DeleteWidget': {
				const target = data.params.target;

				if (target) {
					data.type = J.Constant.widgetId[target.id] ? target.name : this.typeMapper(target.type);
				};

				data.layout = I.WidgetLayout[data.layout];
				break;
			};

			case 'SurveyShow':
			case 'SurveyOpen':
			case 'SurveySkip': {
				data.type = I.SurveyType[data.type];
				break;
			};

			case 'LibraryView': {
				const types = {
					library: 'your',
					marketplace: 'library',
				};

				data.view = types[data.view];
				break;
			};

			case 'ThemeSet': {
				data.id = String(data.id || 'light');
				break;
			};

			case 'OnboardingTooltip':
			case 'ClickOnboardingTooltip': {
				data.id = data.id ? U.Common.toUpperCamelCase(`-${data.id}`) : '';
				data.type = data.type ? U.Common.toUpperCamelCase(`-${data.type}`) : '';
				break;
			};

			case 'ChangeLibraryType': {
				data.type = data.type ? U.Common.toUpperCamelCase(`-${data.type}`) : '';
				break;
			};

			case 'DeleteSpace': {
				data.type = Number(data.type) || 0;
				data.type = I.SpaceType[data.type];
				break;
			};

			case 'ChangeMessageNotificationState': {
				data.type = Number(data.type) || 0;
				data.type = I.NotificationMode[data.type];
				break;
			};

			case 'ApproveInviteRequest':
			case 'ChangeSpaceMemberPermissions': {
				data.type = Number(data.type) || 0;
				data.type = I.ParticipantPermissions[data.type];
				break;
			};

			case 'ChangePlan':
			case 'ScreenMembership': {
				data.name = I.TierType[data.params.tier];
				break;
			};

			case 'ClickMembership': {
				data.name = data.name || I.TierType[data.params.tier];
				data.type = data.type || I.PaymentMethod[data.params.method];
				break;
			};

			case 'ClickSyncStatus': {
				data.status = I.SyncStatusSpace[data.status];
				break;
			};

			case 'ChangeSpaceDashboard': {
				data.type = U.Common.ucFirst(U.Common.enumKey(I.HomePredefinedId, data.type));
				break;
			};

			case 'ChangeDateFormat': {
				data.type = I.DateFormat[Number(data.type)];
				break;
			};

			case 'ChangeTimeFormat': {
				data.type = I.TimeFormat[Number(data.type)];
				break;
			};

			case 'ObjectListSort': {
				data.type = I.SortType[Number(data.type)];
				break;
			};

		};

		param.middleTime = Number(data.middleTime) || 0;
		param.context = String(this.contextId || '');

		for (const k of KEYS) {
			if (undefined !== data[k]) {
				converted[k] = data[k];
			};
		};

		if (converted.objectType) {
			converted.objectType = this.typeMapper(converted.objectType);
		};

		if (converted.relationKey) {
			converted.relationKey = this.relationMapper(converted.relationKey);
		};

		if (undefined !== converted.align) {
			converted.align = I.BlockHAlign[converted.align];
		};

		if (undefined !== converted.usecase) {
			converted.usecase = Number(converted.usecase) || 0;
			converted.usecase = I.Usecase[converted.usecase];
		};

		param = Object.assign(param, converted);
		
		this.instance.logEvent(code, param);
		this.log(`[Analytics].event: ${code}`, param);
	};

	/**
	 * Creates an analytics event for object creation.
	 * @param {string} objectType - The type of object created.
	 * @param {I.ObjectLayout} layout - The layout of the object.
	 * @param {string} route - The route context for analytics.
	 * @param {number} time - The time taken for creation.
	 */
	createObject (objectType: string, layout: I.ObjectLayout, route: string, time: number) {
		this.event('CreateObject', { objectType, layout, route, middleTime: time });
	};

	/**
	 * Creates an analytics event for widget creation.
	 * @param {I.WidgetLayout} layout - The widget layout.
	 * @param {string} route - The route context for analytics.
	 * @param {string} type - The widget type.
	 */
	createWidget (layout: I.WidgetLayout, route: string, type: string) {
		analytics.event('AddWidget', { type: layout, route, widgetType: type });
	};

	/**
	 * Returns the widget type as a string.
	 * @param {boolean} isAuto - Whether the widget is auto-created.
	 * @returns {string} The widget type string.
	 */
	getWidgetType (isAuto: boolean) {
		return isAuto ? this.widgetType.auto : this.widgetType.manual;
	};

	/**
	 * Logs a change in relation value for analytics.
	 * @param {any} relation - The relation object.
	 * @param {any} value - The new value.
	 * @param {any} param - Additional parameters.
	 */
	changeRelationValue (relation: any, value: any, param: any) {
		if (!relation) {
			return;
		};

		let key = '';
		if (relation.relationKey == 'name') {
			key = 'SetObjectTitle';
		} else {
			key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';
		};
		this.event(key, { ...param, relationKey: relation.relationKey, format: relation.format });
	};

	/**
	 * Maps page parameters to an analytics route string.
	 * @param {any} params - The page parameters.
	 * @returns {string} The mapped route string.
	 */
	pageMapper (params: any): string {
		const { page, action } = params;
		const key = [ page, action ].join('/');
		const map = {
			'auth/login':		 'ScreenLogin',

			'main/graph':		 'ScreenGraph',
			'main/navigation':	 'ScreenNavigation',
			'main/media':		 'ScreenMedia',
			'main/history':		 'ScreenHistory',
			'main/date':		 'ScreenDate',
		};

		return map[key] || '';
	};

	/**
	 * Maps popup parameters to an analytics route string.
	 * @param {any} params - The popup parameters.
	 * @returns {string} The mapped route string.
	 */
	popupMapper (params: any): string {
		const { id } = params;
		const map = {
			spaceCreate:		 'ScreenSettingsSpaceCreate',
		};

		return map[id] || '';
	};

	/**
	 * Maps menu parameters to an analytics route string.
	 * @param {any} params - The menu parameters.
	 * @returns {string} The mapped route string.
	 */
	menuMapper (params: any): string {
		const { id } = params;
		const map = {
			help:				 'MenuHelp',
		};

		return map[id] || '';
	};

	/**
	 * Maps settings parameters to an analytics route string.
	 * @param {any} params - The settings parameters.
	 * @returns {string} The mapped route string.
	 */
	settingsMapper (params: any): string {
		const { id } = params;
		const prefix = 'ScreenSettings';

		const map = {
			index: '',
			phrase: '',
			pinIndex: 'PinCode',
			importIndex: 'Import',
			importNotion: 'ImportNotion',
			exportMarkdown: 'Export',
		};

		const code = (undefined !== map[id]) ? map[id] : id;
		return code ? U.Common.toUpperCamelCase([ prefix, code ].join('-')) : '';
	};

	/**
	 * Maps a type ID to an analytics type string.
	 * @param {string} id - The type ID.
	 * @returns {string} The mapped type string.
	 */
	typeMapper (id: string): string {
		let object = S.Record.getTypeById(id);
		if (!object) {
			object = S.Record.getTypeByKey(id);
		};

		return object ? (object.sourceObject ? object.sourceObject : 'custom') : '';
	};

	/**
	 * Maps a relation ID to an analytics relation string.
	 * @param {string} id - The relation ID.
	 * @returns {string} The mapped relation string.
	 */
	relationMapper (id: string) {
		let object = S.Record.getRelationById(id);
		if (!object) {
			object = S.Record.getRelationByKey(id);
		};

		return object ? (object.sourceObject ? object.sourceObject : 'custom') : '';
	};

	/**
	 * Returns the embed type as a string.
	 * @param {boolean} isInline - Whether the embed is inline.
	 * @returns {string} The embed type string.
	 */
	embedType (isInline: boolean): string {
		return isInline ? 'inline' : 'object';
	};

	/**
	 * Returns the network type as a string.
	 * @param {any} v - The network value.
	 * @returns {string} The network type string.
	 */
	networkType (v: any): string {
		v = Number(v) || 0;

		switch (v) {
			case I.NetworkMode.Default: return 'Anytype';
			case I.NetworkMode.Local: return 'LocalOnly';
			case I.NetworkMode.Custom: return 'SelfHost';
		};
		return '';
	};

	/**
	 * Adds an event to the analytics stack.
	 * @param {string} code - The event code.
	 * @param {any} [data] - Optional event data.
	 */
	stackAdd (code: string, data?: any) {
		this.stack.push({ code, data })
	};

	/**
	 * Sends all stacked analytics events.
	 */
	stackSend () {
		this.stack.forEach(({ code, data }) => {
			this.event(code, data);
		});

		this.stack = [];
	};

	/**
	 * Logs analytics messages to the console.
	 * @param {...any[]} args - Arguments to log.
	 */
	log (...args: any[]) {
		if (!this.debug()) {
			return;
		};

		args[0] = `%c${args[0]}`;
		args.splice(1, 0, 'font-weight: bold; color: #cc4506;');

		console.log.apply(this, args);
	};

};

 export const analytics: Analytics = new Analytics();
