import * as amplitude from 'amplitude-js';
import { I, C, Util, Storage } from 'Lib';
import { commonStore } from 'Store';

import Constant from 'json/constant.json';

const KEYS = [ 
	'method', 'id', 'action', 'style', 'code', 'route', 'format', 'color',
	'type', 'objectType', 'embedType', 'relationKey', 'layout', 'align', 'template', 'index', 'condition',
	'tab', 'document', 'page', 'count', 'context', 'originalId', 'length', 'group', 'view',
];
const KEY_CONTEXT = 'analyticsContext';
const KEY_ORIGINAL_ID = 'analyticsOriginalId';
const URL = 'amplitude.anytype.io';

class Analytics {
	
	isInit = false;
	instance: any = null;

	debug() {
		const { config } = commonStore;
		return config.debug.an;
	};
	
	init () {
		if (this.isInit) {
			return;
		};

		const platform = Util.getPlatform();

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
			platform: Util.getPlatform(),
			osVersion: window.Electron.version.os,
		});

		console.log('[Analytics].init', this.instance);

		this.isInit = true;
	};
	
	profile (account: any) {
		if (!this.instance || (!window.Electron.isPackaged && !this.debug()) || !account) {
			return;
		};
		if (this.debug()) {
			console.log('[Analytics].profile', account.id);
		};
		this.instance.setUserId(account.id);
	};

	device (id: string) {
		if (!this.instance || (!window.Electron.isPackaged && !this.debug())) {
			return;
		};

		this.instance.setUserProperties({ middlewareDeviceId: id });

		if (this.debug()) {
			console.log('[Analytics].device', id);
		};
	};

	setContext (context: string, id: string) {
		Storage.set(KEY_CONTEXT, context);
		Storage.set(KEY_ORIGINAL_ID, id);

		if (this.debug()) {
			console.log('[Analytics].setContext', context, id);
		};
	};

	event (code: string, data?: any) {
		data = data || {};

		if (!this.instance || (!window.Electron.isPackaged && !this.debug()) || !code) {
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

			case 'AddWidget':
			case 'EditWidget': {
				data.type = I.WidgetLayout[data.type];
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
		};

		param.middleTime = Number(data.middleTime) || 0;
		param.context = String(Storage.get(KEY_CONTEXT) || '');
		param.originalId = String(Storage.get(KEY_ORIGINAL_ID) || '');

		for (let k of KEYS) {
			if (undefined !== data[k]) {
				converted[k] = data[k];
			};
		};

		if (converted.objectType && !converted.objectType.match(/^ot-|_ot/)) {
			converted.objectType = 'custom';
		};

		if (converted.relationKey && !converted.relationKey.match(/^rel-|_br/)) {
			converted.relationKey = 'custom';
		};

		if (undefined !== converted.layout) {
			converted.layout = I.ObjectLayout[converted.layout];
		};

		if (undefined !== converted.align) {
			converted.align = I.BlockHAlign[converted.align];
		};

		param = Object.assign(param, converted);

		if (this.debug()) {
			console.log('[Analytics].event', code, param);
		};
		
		this.instance.logEvent(code, param);
	};
	
	pageMapper (params: any): string {
		const { page, action } = params;
		const key = [ page, action ].join('/');
		const map = {
			'index/index':		 'ScreenIndex',

			'auth/notice':		 'ScreenDisclaimer',
			'auth/login':		 'ScreenLogin',
			'auth/register':	 'ScreenAuthRegistration',
			'auth/invite':		 'ScreenAuthInvitation',

			'main/index':		 'ScreenHome',
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
		return code ? Util.toUpperCamelCase([ prefix, code ].join('-')) : '';
	};

	embedType (isInline: boolean): string {
		return isInline ? 'inline' : 'object';
	};

};

 export const analytics: Analytics = new Analytics();