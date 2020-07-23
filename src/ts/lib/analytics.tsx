import * as amplitude from 'amplitude-js';
import { I, M, Storage, Mapper, Util } from 'ts/lib';

const Constant = require('json/constant.json');
const { app } = window.require('electron').remote;
const isProduction = app.isPackaged;

class Analytics {
	
	isInit: boolean =  false;
	instance: any = null;
	
	init () {
		const debug = (Storage.get('debug') || {}).an;
		if (!isProduction && !debug) {
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
		this.isInit = true;

		if (debug) {
			console.log('[Analytics.init]', this.instance);
		};
	};
	
	profile (profile: any) {
		if (!this.instance) {
			return;
		};

		const debug = (Storage.get('debug') || {}).an;
		if (!isProduction && !debug) {
			return;
		};
		if (debug) {
			console.log('[Analytics.profile]', profile.id);
		};
		
		this.instance.setUserId(profile.id);
	};
	
	setUserProperties () {
		if (!this.instance) {
			return;
		};

		const debug = (Storage.get('debug') || {}).an;
		if (!isProduction && !debug) {
			return;
		};

		const obj = { 
			deviceType: 'Desktop', 
			platform: Util.getPlatform(),
		};

		if (debug) {
			console.log('[Analytics.setUserProperties]', obj);
		};
		this.instance.setGlobalUserProperties(obj);
	};
	
	setVersionName (name: string) {
		if (!this.instance) {
			return;
		};

		const debug = (Storage.get('debug') || {}).an;
		if (!isProduction && !debug) {
			return;
		};
		if (debug) {
			console.log('[Analytics.setVersionName]', name);
		};
		
		this.instance.setVersionName(name);
	};
	
	event (code: string, data?: any) {
		if (!this.instance) {
			return;
		};

		const debug = (Storage.get('debug') || {}).an;
		if ((!isProduction && !debug) || !code) {
			return;
		};
		
		data = data || {};

		let param: any = { 
			middleTime: Number(data.middleTime) || 0, 
			renderTime: Number(data.renderTime) || 0,
		};

		switch (code) {
			case 'Error':
				param = data;
				break;

			case 'BlockCreate':
			case 'BlockReplace':
				let block = new M.Block(Mapper.From.Block(data.getBlock()));
				
				param.type = block.type;
				if (block.isText() || block.isDiv()) {
					param.style = this.getDictionary(block.type, block.content.style);
				};
				if (block.isFile()) {
					param.style = this.getDictionary(block.type, block.content.type);
				};
				break;
				
			case 'BlockListSetTextStyle':
				param.style = this.getDictionary(I.BlockType.Text, data.style);
				break;
		};

		if (debug) {
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
		
		data.div[I.DivStyle.Line]			 = 'Line';
		data.div[I.DivStyle.Dot]			 = 'Dot';

		return data[type][style];
	};
	
};

export let analytics: Analytics = new Analytics();