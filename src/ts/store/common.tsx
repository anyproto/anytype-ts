import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, Storage, Util } from 'ts/lib';
import { analytics } from '../lib';

const Constant = require('json/constant.json');

interface Preview {
	type: I.MarkType,
	param: string;
	object: any;
	element: any;
	range: I.TextRange;
	marks: I.Mark[];
	noUnlink?: boolean;
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

    public coverObj: Cover = { id: '', type: 0, image: '' };
    public coverImg: string = '';
    public progressObj: I.Progress = null;
    public filterObj: Filter = { from: 0, text: '' };
    public gatewayUrl: string = '';
    public previewObj: Preview = { type: 0, param: '', object: null, element: null, range: { from: 0, to: 0 }, marks: [] };
    public configObj: any = {};
    public cellId: string = '';
	public themeId: string = '';

    constructor() {
        makeObservable(this, {
            coverObj: observable,
            coverImg: observable,
            progressObj: observable,
            filterObj: observable,
            gatewayUrl: observable,
            previewObj: observable,
            configObj: observable,
			themeId: observable,
            config: computed,
            progress: computed,
            preview: computed,
            filter: computed,
            cover: computed,
            coverImage: computed,
            gateway: computed,
			theme: computed,
            coverSet: action,
            coverSetUploadedImage: action,
            gatewaySet: action,
            progressSet: action,
            progressClear: action,
            filterSetFrom: action,
            filterSetText: action,
            filterSet: action,
            previewSet: action,
			themeSet: action,
        });
    };

    get config(): any {
		return { ...this.configObj, debug: this.configObj.debug || {} };
	};

    get progress(): I.Progress {
		return this.progressObj;
	};

    get preview(): Preview {
		return this.previewObj;
	};

    get filter(): Filter {
		return this.filterObj;
	};

    get cover(): Cover {
		return this.coverObj;
	};

    get coverImage(): Cover {
		return this.coverImg || Storage.get('coverImg');
	};

    get gateway(): string {
		return String(this.gatewayUrl || Storage.get('gateway') || '');
	};

	get type(): string {
		return String(Storage.get('defaultType') || Constant.typeId.page);
	};

	get pinTime(): number {
		return (Number(Storage.get('pinTime')) || Constant.default.pinTime) * 1000;
	};

	get theme(): string {
		return String(this.themeId || Storage.get('theme') || '');
	};

    coverSet (id: string, image: string, type: I.CoverType) {
		this.coverObj = { id: id, image: image, type: type };
		Storage.set('cover', this.coverObj);
	};

    coverSetUploadedImage (image: string) {
		this.coverImg = image;
		Storage.set('coverImg', this.coverImg);
	};

    coverSetDefault () {
		this.coverSet('c' + Constant.default.cover, '', I.CoverType.Image);
	};

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

    progressSet (v: I.Progress) {
		this.progressObj = v;
	};

    progressClear () {
		this.progressObj = null;
	};

    filterSetFrom (from: number) {
		this.filterObj.from = from;
	};

    filterSetText (text: string) {
		this.filterObj.text = Util.filterFix(text);
	};

    filterSet (from: number, text: string) {
		this.filterSetFrom(from);
		this.filterSetText(text);
	};

    previewSet (preview: Preview) {
		this.previewObj = preview;
	};

	previewClear () {
		this.previewObj = { type: 0, param: '', object: null, element: null, range: { from: 0, to: 0 }, marks: [] };
	};

	typeSet (v: string) {
		Storage.set('defaultType', v);
	};

	pinTimeSet (v: string) {
		Storage.set('pinTime', v);
	};

	themeSet (v: string) {
		this.themeId = v;
		Storage.set('theme', v);
		Util.addBodyClass('theme', v);

		analytics.event('Theme', { id: v });
	};

	configSet (config: any, force: boolean) {
		console.log('[commonStore.configSet]', JSON.stringify(config, null, 3), force);

		let newConfig: any = {};

		if (force) {
			newConfig = config;
		} else {
			for (let k in config) {
				if (undefined === this.configObj[k]) {
					newConfig[k] = config[k];
				};
			};
		};

		set(this.configObj, newConfig);
	};

};

export let commonStore: CommonStore = new CommonStore();