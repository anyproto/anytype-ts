import * as amplitude from 'amplitude-js';
import { I, C, UtilCommon, Storage } from 'Lib';
import { commonStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const KEYS = [ 
	'method', 'id', 'action', 'style', 'code', 'route', 'format', 'color',
	'type', 'objectType', 'linkType', 'embedType', 'relationKey', 'layout', 'align', 'template', 'index', 'condition',
	'tab', 'document', 'page', 'count', 'context', 'originalId', 'length', 'group', 'view', 'limit',
];
const KEY_CONTEXT = 'analyticsContext';
const KEY_ORIGINAL_ID = 'analyticsOriginalId';
const URL = 'amplitude.anytype.io';

class Analytics {
	
	isInit = false;
	instance: any = null;

	debug () {
		const { config } = commonStore;
		return config.debug.an;
	};

	isAllowed (): boolean {
		const { config } = commonStore;
		return !(config.sudo || [ 'alpha', 'beta' ].includes(config.channel) || !window.Electron.isPackaged) || this.debug();
	};
	
	init () {
		if (this.isInit) {
			return;
		};

		const platform = UtilCommon.getPlatform();

		C.MetricsSetParameters(platform);

		this.instance = amplitude.getInstance();
		this.instance.init(Constant.amplitude, null, {
			apiEndpoint: URL,
			batchEvents: true,
			saveEvents: true,
			includeUtm: true,
			includeReferrer: true,
			platform,
		});

		this.instance.setVersionName(window.Electron.version.app);
		this.instance.setUserProperties({ 
			deviceType: 'Desktop',
			platform,
			osVersion: window.Electron.version.os,
		});

		this.log('[Analytics].init');
		this.isInit = true;
	};

	profile (id: string) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserId(id);
		this.log(`[Analytics].profile: ${id}`);	
	};

	device (id: string) {
		if (!this.instance || !this.isAllowed()) {
			return;
		};

		this.instance.setUserProperties({ middlewareDeviceId: id });
		this.log(`[Analytics].device: ${id}`);	
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

		let converted: any = {};
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

			case 'CreateObject': {
				data.layout = I.ObjectLayout[data.layout];
				break;
			};

			case 'CreateBlock':
			case 'ChangeBlockStyle': {
				data.style = Number(data.style) || 0;

				if (data.type == I.BlockType.Text) {
					data.style = I.TextStyle[data.style];
				} else
				if (data.type == I.BlockType.Div) {
					data.style = I.DivStyle[data.style];
				} else
				if (data.type == I.BlockType.Dataview) {
					data.style = I.ViewType[data.style];
				} else
				if (data.type == I.BlockType.File) {
					if (undefined !== data.params?.fileType) {
						data.fileType = Number(data.params.fileType) || 0;
						data.type = I.FileType[data.fileType];
					};
					if (data.style == I.FileStyle.Auto) {
						data.style = I.FileStyle.Embed;
					};

					data.style = I.FileStyle[data.style];
				} else {
					delete(data.style);
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

			case 'Export': {
				data.type = Number(data.type) || 0;
				data.type = I.ExportType[data.type];
				break;
			};

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
		};

		param.middleTime = Number(data.middleTime) || 0;
		param.context = String(Storage.get(KEY_CONTEXT) || '');
		param.originalId = String(Storage.get(KEY_ORIGINAL_ID) || '');

		for (let k of KEYS) {
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

		param = Object.assign(param, converted);
		
		this.instance.logEvent(code, param);
		this.log(`[Analytics].event: ${code}`, param);
	};
	
	pageMapper (params: any): string {
		const { page, action } = params;
		const key = [ page, action ].join('/');
		const map = {
			'index/index':		 'ScreenIndex',

			'auth/login':		 'ScreenLogin',
			'auth/register':	 'ScreenAuthRegistration',
			'auth/invite':		 'ScreenAuthInvitation',

			'main/graph':		 'ScreenGraph',
			'main/navigation':	 'ScreenNavigation',
			'main/type':		 'ScreenType',
			'main/relation':	 'ScreenRelation',
			'main/edit':		 'ScreenObject',
			'main/space':		 'ScreenSpace',
			'main/media':		 'ScreenMedia',
			'main/history':		 'ScreenHistory',
		};

		return map[key] || '';
	};

	popupMapper (params: any): string {
		const { id } = params;
		const map = {
			settings: 'ScreenSettings',
			search: 'ScreenSearch',
		};

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

	typeMapper (id: string) {
		const type = dbStore.getType(id);
		return type ? (type.sourceObject ? type.sourceObject : 'custom') : '';
	};

	relationMapper (key: string) {
		const relation = dbStore.getRelationByKey(key);
		return relation ? (relation.sourceObject ? relation.sourceObject : 'custom') : '';
	};

	embedType (isInline: boolean): string {
		return isInline ? 'inline' : 'object';
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