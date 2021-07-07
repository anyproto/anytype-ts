import { observable, action, computed, set } from 'mobx';
import { I, Storage, Util } from 'ts/lib';

const Constant = require('json/constant.json');
const $ = require('jquery');

interface LinkPreview {
	url: string;
	element: any;
	rootId: string;
	blockId: string;
	range: I.TextRange;
	marks: I.Mark[];
	onChange?(marks: I.Mark[]): void;
};

interface Filter {
	from: number;
	text: string;
};

interface Cover {
	id: string;
	image: string;
	type: I.CoverType;
};

class CommonStore {
	@observable public coverObj: Cover = { id: '', type: 0, image: '' };
	@observable public coverImg: string = '';
	@observable public progressObj: I.Progress = null;
	@observable public filterObj: Filter = { from: 0, text: '' };
	@observable public gatewayUrl: string = '';
	@observable public linkPreviewObj: LinkPreview = null;
	@observable public configObj:any = {};
	public cellId: string = '';
	
	@computed
	get config(): any {
		return { ...this.configObj, debug: this.configObj.debug || {} };
	};

	@computed
	get progress(): I.Progress {
		return this.progressObj;
	};
	
	@computed
	get linkPreview(): LinkPreview {
		return this.linkPreviewObj;
	};
	
	@computed
	get filter(): Filter {
		return this.filterObj;
	};
	
	@computed
	get cover(): Cover {
		return this.coverObj;
	};

	@computed
	get coverImage(): Cover {
		return this.coverImg || Storage.get('coverImg');
	};
	
	@computed
	get gateway(): string {
		return String(this.gatewayUrl || Storage.get('gateway') || '');
	};
	
	@action
	coverSet (id: string, image: string, type: I.CoverType) {
		this.coverObj = { id: id, image: image, type: type };
		Storage.set('cover', this.coverObj);
	};

	@action
	coverSetUploadedImage (image: string) {
		this.coverImg = image;
		Storage.set('coverImg', this.coverImg);
	};

	coverSetDefault () {
		this.coverSet('c' + Constant.default.cover, '', I.CoverType.Image);
	};
	
	@action
	gatewaySet (v: string) {
		this.gatewayUrl = v;
		Storage.set('gateway', v);
	};
	
	fileUrl (hash: string) {
		hash = String(hash || '');
		return this.gateway + '/file/' + hash;
	};
	
	imageUrl (hash: string, width: number) {
		hash = String(hash || '');
		width = Number(width) || 0;
		return this.gateway + '/image/' + hash + '?width=' + width;
	};
	
	@action
	progressSet (v: I.Progress) {
		this.progressObj = v;
	};
	
	@action
	progressClear () {
		this.progressObj = null;
	};
	
	@action
	filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

	@action
	filterSetText (text: string) {
		this.filterObj.text = Util.filterFix(text);
	};

	@action
	filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

	@action
	linkPreviewSet (param: LinkPreview) {
		this.linkPreviewObj = param;
	};

	configSet (config: any) {
		set(this.configObj, config);
	};
	
};

export let commonStore: CommonStore = new CommonStore();