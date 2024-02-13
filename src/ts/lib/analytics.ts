import * as amplitude from 'amplitude-js';
import { I, C, UtilCommon, Storage } from 'Lib';
import { commonStore, dbStore } from 'Store';
import Constant from 'json/constant.json';
import { OnboardStage } from 'Component/page/auth/animation/constants';

const KEYS = [ 
	'method', 'id', 'action', 'style', 'code', 'route', 'format', 'color', 'step',
	'type', 'objectType', 'linkType', 'embedType', 'relationKey', 'layout', 'align', 'template', 'index', 'condition',
	'tab', 'document', 'page', 'count', 'context', 'originalId', 'length', 'group', 'view', 'limit', 'usecase', 'name',
	'processor',
];
const KEY_CONTEXT = 'analyticsContext';
const KEY_ORIGINAL_ID = 'analyticsOriginalId';
const URL = 'amplitude.anytype.io';

class Analytics {
	
	instance: any = null;

	debug () {
		const { config } = commonStore;
		return config.debug.an;
	};

	isAllowed (): boolean {
		const { config } = commonStore;
		return !(config.sudo || [ 'alpha', 'beta' ].includes(config.channel) || !UtilCommon.getElectron().isPackaged) || this.debug();
	};
	
	init () {
		if (this.instance) {
			return;
		};

		const { config, interfaceLang } = commonStore;
		const platform = UtilCommon.getPlatform();

		let version = String(UtilCommon.getElectron().version.app || '').split('-');
		if (version.length) {
			version = [ version[0] ];
		};
		if (config.sudo || !UtilCommon.getElectron().isPackaged || [ 'alpha' ].includes(config.channel)) {
			version.push('dev');
		} else
		if ([ 'beta' ].includes(config.channel)) {
			version.push(config.channel);
		};

		C.MetricsSetParameters(platform, version.join('-'));

		this.instance = amplitude.getInstance();
		this.instance.init(Constant.amplitude, null, {
			apiEndpoint: URL,
			batchEvents: true,
			saveEvents: true,
			includeUtm: true,
			includeReferrer: true,
			platform,
			trackingOptions: {
				ipAddress: false,
			},
		});

		this.instance.setVersionName(UtilCommon.getElectron().version.app);
		this.instance.setUserProperties({ 
			deviceType: 'Desktop',
			platform,
			osVersion: UtilCommon.getElectron().version.os,
			interfaceLang,
		});

		this.removeContext();
		this.log('[Analytics].init');
	};

	profile (id: string, networkId: string) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserId(id);

		if (id) {
			this.instance.setUserProperties({ networkId });
		};
		this.log(`[Analytics].profile: ${id} networkId: ${networkId}`);	
	};

	setContext (context: string, id: string) {
		Storage.set(KEY_CONTEXT, context);
		Storage.set(KEY_ORIGINAL_ID, id);

		this.log(`[Analytics].setContext: ${context}`);
	};

	removeContext () {
		Storage.delete(KEY_CONTEXT);
		Storage.delete(KEY_ORIGINAL_ID);
	};

	event (code: string, data?: any) {
		data = data || {};

		if (!this.instance || !this.isAllowed() || !code) {
			return;
		};

		const converted: any = {};

		let param: any = {};

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
			case 'ScreenType': {
				data.objectType = data.params.id;
				break;
			};

			case 'ScreenRelation': {
				data.relationKey = data.params.id;
				break;
			};

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
				data.type = Number(data.type) || 0;
				data.type = I.SortType[data.type];
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

			case 'CreateRelation':
			case 'AddExistingRelation': {
				data.format = Number(data.format) || 0;
				data.format = I.RelationType[data.format];
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
				if (data.target) {
					data.type = Constant.widgetId[data.target.id] ? data.target.name : this.typeMapper(data.target.type);
					delete data.target;
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
				data.id = data.id ? UtilCommon.toUpperCamelCase(`-${data.id}`) : '';
				data.type = data.type ? UtilCommon.toUpperCamelCase(`-${data.type}`) : '';
				break;
			};

			case 'ClickOnboarding':
			case 'ScreenOnboarding': {
				data.step = OnboardStage[data.step];
				break;
			};

			case 'DeleteSpace': {
				data.type = Number(data.type) || 0;
				data.type = I.SpaceType[data.type];
				break;
			};

		};

		param.middleTime = Number(data.middleTime) || 0;
		param.context = String(Storage.get(KEY_CONTEXT) || '');
		param.originalId = String(Storage.get(KEY_ORIGINAL_ID) || '');

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
	
	pageMapper (params: any): string {
		const { page, action } = params;
		const key = [ page, action ].join('/');
		const map = {
			'auth/login':		 'ScreenLogin',

			'main/graph':		 'ScreenGraph',
			'main/navigation':	 'ScreenNavigation',
			'main/type':		 'ScreenType',
			'main/relation':	 'ScreenRelation',
			'main/space':		 'ScreenSpace',
			'main/media':		 'ScreenMedia',
			'main/history':		 'ScreenHistory',
		};

		return map[key] || '';
	};

	popupMapper (params: any): string {
		const { id } = params;
		const map = {};

		return map[id] || '';
	};

	menuMapper (params: any): string {
		const { id } = params;
		const map = {
			help:				 'MenuHelp',
			blockRelationView:	 'ScreenObjectRelation',
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
		return code ? UtilCommon.toUpperCamelCase([ prefix, code ].join('-')) : '';
	};

	typeMapper (id: string): string {
		const object = dbStore.getTypeById(id);
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
		const object = dbStore.getRelationByKey(key);
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