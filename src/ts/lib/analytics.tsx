import * as amplitude from 'amplitude-js';
import { I, M, C, Mapper, Util, translate, Storage } from 'ts/lib';
import { authStore, commonStore, dbStore } from 'ts/store';

const Constant = require('json/constant.json');
const { app } = window.require('@electron/remote');
const isProduction = app.isPackaged;
const version = app.getVersion();
const os = window.require('os');

const KEYS = [ 
	'cmd', 'id', 'action', 'style', 'code', 
	'type', 'objectType', 'layout', 'template', 
	'tab', 'document', 'page', 'count', 'context', 'originalId'
];
const SKIP_IDS = [ 'BlockOpenBreadcrumbs', 'BlockSetBreadcrumbs' ];
const KEY_CONTEXT = 'analyticsContext';
const KEY_ORIGINAL_ID = 'analyticsOriginalId';

class Analytics {
	
	isInit: boolean =  false;
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
		const { account, device } = authStore;

		C.MetricsSetParameters(platform);

		this.instance = amplitude.getInstance();
		this.instance.init(Constant.amplitude, null, {
			batchEvents: true,
			saveEvents: true,
			includeUtm: true,
			includeReferrer: true,
			platform: platform,
		});

		this.instance.setVersionName(version);
		this.instance.setUserProperties({ 
			deviceType: 'Desktop',
			platform: Util.getPlatform(),
			osVersion: os.release(),
		});
		this.instance.setDeviceId(device);

		if (this.debug()) {
			console.log('[Analytics.init]', this.instance);
		};

		this.profile(account);
		this.isInit = true;
	};
	
	profile (account: I.Account) {
		if (!this.instance || (!isProduction && !this.debug())) {
			return;
		};
		if (this.debug()) {
			console.log('[Analytics.profile]', account.id);
		};
		this.instance.setUserId(account.id);
	};

	setContext (context: string, id: string) {
		Storage.set(KEY_CONTEXT, context);
		Storage.set(KEY_ORIGINAL_ID, id);

		if (this.debug()) {
			console.log('[Analytics.setContext]', context, id);
		};
	};

	event (code: string, data?: any) {
		if (!this.instance) {
			return;
		};

		if ((!isProduction && !this.debug()) || !code) {
			return;
		};

		if (SKIP_IDS.indexOf(code) >= 0) {
			return;
		};
		
		data = data || {};

		let param: any = { 
			middleTime: Number(data.middleTime) || 0, 
			renderTime: Number(data.renderTime) || 0,
			context: String(Storage.get(KEY_CONTEXT) || ''),
			originalId: String(Storage.get(KEY_ORIGINAL_ID) || ''),
		};

		const converted: any = {};
		
		for (let k of KEYS) {
			if (undefined !== data[k]) {
				converted[k] = data[k];
			};
		};

		if (converted.objectType) {
			const type = dbStore.getObjectType(converted.objectType);
			if (!type.id.match(/^_/)) {
				converted.objectType = 'custom';
			};
		};

		switch (code) {
			default:
				param = Object.assign(param, converted);
				break;

			case 'BlockCreate':
				let block = new M.Block(Mapper.From.Block(data.getBlock()));
				
				param.type = block.type;
				if (block.isText() || block.isDiv()) {
					param.style = this.getDictionary(block.type, block.content.style);
				};
				if (block.isFile()) {
					param.style = this.getDictionary(block.type, block.content.type);
				};
				break;

			case 'MenuBlockStyleAction':	
			case 'BlockListTurnInto':
			case 'BlockListSetTextStyle':
			case 'BlockListTurnInto':
				param.style = this.getDictionary(I.BlockType.Text, converted.style);
				break;

			case 'BlockDataviewViewCreate':
			case 'BlockDataviewViewUpdate':
				param.type = translate('viewName' + data.getView().getType());
				break;

			case 'BlockDataviewViewSet':
				param.type = translate('viewName' + data.type);
				break;

			case 'PopupHelp':
				param.document = data.document;
				break;

			case 'PopupPage':
				param.page = data.matchPopup.params.page;
				param.action = data.matchPopup.params.action;
				break;

			case 'ObjectListDelete':
				param.count = data.getObjectidsList().length;
				break;
		};

		if (this.debug()) {
			console.log('[Analytics.event]', code, param);
		};
		
		this.instance.logEvent(code, param);
	};
	
	getDictionary (type: string, style: number) {
		let data: any = {
			text: {},
			file: {},
			div: {},
		};
		
		data.text[I.TextStyle.Paragraph]	 = 'Paragraph';
		data.text[I.TextStyle.Header1]		 = 'Header1';
		data.text[I.TextStyle.Header2]		 = 'Header2';
		data.text[I.TextStyle.Header3]		 = 'Header3';
		data.text[I.TextStyle.Quote]		 = 'Quote';
		data.text[I.TextStyle.Code]			 = 'Code';
		data.text[I.TextStyle.Bulleted]		 = 'Bulleted';
		data.text[I.TextStyle.Numbered]		 = 'Numbered';
		data.text[I.TextStyle.Toggle]		 = 'Toggle';
		data.text[I.TextStyle.Checkbox]		 = 'Checkbox';
		
		data.file[I.FileType.None]			 = 'None';
		data.file[I.FileType.File]			 = 'File';
		data.file[I.FileType.Image]			 = 'Image';
		data.file[I.FileType.Video]			 = 'Video';
		data.file[I.FileType.Audio]			 = 'Audio';
		
		data.div[I.DivStyle.Line]			 = 'Line';
		data.div[I.DivStyle.Dot]			 = 'Dot';

		return data[type][style];
	};
	
};

export let analytics: Analytics = new Analytics();