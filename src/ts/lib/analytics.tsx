import * as amplitude from 'amplitude-js';
import { I, M, Mapper, Util, translate } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';

const Constant = require('json/constant.json');
const { app } = window.require('@electron/remote');
const isProduction = app.isPackaged;
const version = app.getVersion();
const os = window.require('os');

const KEYS = [ 'cmd', 'id', 'action', 'style', 'code', 'type', 'objectType', 'layout', 'template', 'tab', 'document', 'page' ];
const SKIP_IDS = [ 'BlockOpenBreadcrumbs', 'BlockSetBreadcrumbs' ];

class Analytics {
	
	isInit: boolean =  false;
	instance: any = null;

	debug() {
		const { config } = commonStore;
		return config.debug.an;
	};
	
	init () {
		if (!isProduction && !this.debug()) {
			return;
		};

		this.instance = amplitude.getInstance();
		this.instance.init(Constant.amplitude, null, {
			batchEvents: true,
			saveEvents: true,
			includeUtm: true,
			includeReferrer: true,
			platform: Util.getPlatform(),
		});

		this.instance.setVersionName(version);
		this.instance.setGlobalUserProperties({ 
			deviceType: 'Desktop', 
			platform: Util.getPlatform(),
			osVersion: os.release(),
		});

		this.isInit = true;

		if (this.debug()) {
			console.log('[Analytics.init]', this.instance);
		};
	};
	
	profile (profile: any) {
		if (!this.instance) {
			return;
		};

		if (!isProduction && !this.debug()) {
			return;
		};
		if (this.debug()) {
			console.log('[Analytics.profile]', profile.id);
		};
		this.instance.setUserId(profile.id);
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