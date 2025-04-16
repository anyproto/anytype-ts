import * as amplitude from 'amplitude-js';
import { I, C, S, U, J, Relation } from 'Lib';

const KEYS = [ 
	'method', 'id', 'action', 'style', 'code', 'route', 'format', 'color', 'step',
	'type', 'objectType', 'linkType', 'embedType', 'relationKey', 'layout', 'align', 'template', 'index', 'condition',
	'tab', 'document', 'page', 'count', 'context', 'originalId', 'length', 'group', 'view', 'limit', 'usecase', 'name',
	'processor', 'emptyType', 'status', 'sort', 'widgetType',
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
	};

	public widgetType = {
		manual: 'Manual',
		auto: 'Auto',
	};

	debug () {
		const { config } = S.Common;
		return config.debug.analytics;
	};

	isAllowed (): boolean {
		const { config } = S.Common;
		return !(config.sudo || [ 'alpha' ].includes(config.channel) || !U.Common.getElectron().isPackaged) || this.debug();
	};
	
	init (options?: any) {
		if (this.instance) {
			return;
		};

		const { interfaceLang } = S.Common;
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
		};

		if (electron.version) {
			props.osVersion = electron.version.os;
			this.instance.setVersionName(electron.version.app);
		};

		this.setProperty(props);
		this.removeContext();
		this.setVersion();

		this.log('[Analytics].init');
	};

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

	setContext (context: string) {
		this.contextId = context;
		this.log(`[Analytics].setContext: ${context}`);
	};

	removeContext () {
		this.contextId = '';
	};

	setTier (tier: I.TierType) {
		this.setProperty({ tier: I.TierType[tier] || 'Custom' });
	};

	setProperty (props: any) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserProperties(props);
		this.log(`[Analytics].setProperty: ${JSON.stringify(props, null, 3)}`);
	};

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
			case 'ObjectInstall':
			case 'ObjectUninstall':
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

	createObject (objectType: string, layout: I.ObjectLayout, route: string, time: number) {
		this.event('CreateObject', { objectType, layout, route, middleTime: time });
	};

	createWidget (layout: I.WidgetLayout, route: string, type: string) {
		analytics.event('AddWidget', { type: layout, route, widgetType: type });
	};

	getWidgetType (isAuto: boolean) {
		return isAuto ? this.widgetType.auto : this.widgetType.manual;
	};

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

	popupMapper (params: any): string {
		const { id } = params;
		const map = {
			spaceCreate:		 'ScreenSettingsSpaceCreate',
		};

		return map[id] || '';
	};

	menuMapper (params: any): string {
		const { id } = params;
		const map = {
			help:				 'MenuHelp',
		};

		return map[id] || '';
	};

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

	typeMapper (id: string): string {
		let object = S.Record.getTypeById(id);
		if (!object) {
			object = S.Record.getTypeByKey(id);
		};

		if (!object) {
			return '';
		};

		if (!object.isInstalled) {
			return object.id;
		} else {
			return object.sourceObject ? object.sourceObject : 'custom';
		};
	};

	relationMapper (key: string) {
		const object = S.Record.getRelationByKey(key);
		if (!object) {
			return '';
		};

		if (!object.isInstalled) {
			return object.id;
		} else {
			return object.sourceObject ? object.sourceObject : 'custom';
		};
	};

	embedType (isInline: boolean): string {
		return isInline ? 'inline' : 'object';
	};

	networkType (v: any): string {
		v = Number(v) || 0;

		switch (v) {
			case I.NetworkMode.Default: return 'Anytype';
			case I.NetworkMode.Local: return 'LocalOnly';
			case I.NetworkMode.Custom: return 'SelfHost';
		};
		return '';
	};

	stackAdd (code: string, data?: any) {
		this.stack.push({ code, data })
	};

	stackSend () {
		this.stack.forEach(({ code, data }) => {
			this.event(code, data);
		});

		this.stack = [];
	};

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
