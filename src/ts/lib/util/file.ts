import loadImage from 'blueimp-load-image';
import { UtilCommon, Relation } from 'Lib';
import { commonStore } from 'Store';
const Constant = require('json/constant.json');

const SIZE_UNIT = 1024;
const UNITS = {
	1: 'B',
	2: 'KB',
	3: 'MB',
	4: 'GB',
	5: 'TB',
};

class UtilFile {

	size (v: number): string {
		v = Number(v) || 0;

		let ret = 0;
		let unit = '';

		for (let i = UtilCommon.objectLength(UNITS); i >= 1; --i) {
			const n = v / Math.pow(SIZE_UNIT, i - 1);
			if ((n >= 0.9) || (i == 1)) {
				ret = n;
				unit = UNITS[i];
				break;
			};
		};
		return UtilCommon.formatNumber(Number(UtilCommon.sprintf(`%0.2f`, ret))) + unit;
	};

	icon (object: any): string {
		object = object || {};

		const name = Relation.getStringValue(object.name);
		const n = name.split('.');
		const mime = String(object.mime || object.mimeType || object.fileMimeType || '').toLowerCase();
		const e = String(object.fileExt || n[n.length - 1] || '').toLowerCase();

		let t: string[] = [];
		let icon = 'other';

		if (mime) {
			const a: string[] = mime.split(';');
			if (a.length) {
				t = a[0].split('/');
			};
		};

		// Detect by mime type

		if (t.length) {
			if ([ 'image', 'video', 'text', 'audio' ].indexOf(t[0]) >= 0) {
				icon = t[0];
			};
			
			if ([ 'pdf' ].indexOf(t[1]) >= 0) {
				icon = t[1];
			};
			
			if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].indexOf(t[1]) >= 0) {
				icon = 'archive';
			};
			
			if ([ 'vnd.ms-powerpoint' ].indexOf(t[1]) >= 0) {
				icon = 'presentation';
			};
			
			if ([ 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ].indexOf(t[1]) >= 0) {
				icon = 'table';
			};
		};

		// Detect by extension
		if ([ 'm4v' ].indexOf(e) >= 0) {
			icon = 'video';
		};
			
		if ([ 'csv', 'json', 'txt', 'doc', 'docx', 'md', 'tsx', 'scss' ].indexOf(e) >= 0) {
			icon = 'text';
		};
			
		if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].indexOf(e) >= 0) {
			icon = 'archive';
		};

		if ([ 'xls', 'xlsx', 'sqlite' ].indexOf(e) >= 0) {
			icon = 'table';
		};

		if ([ 'ppt', 'pptx' ].indexOf(e) >= 0) {
			icon = 'presentation';
		};

		for (const k in Constant.fileExtension) {
			const el = Constant.fileExtension[k];
			if (!UtilCommon.hasProperty(el, 'length')) {
				continue;
			};

			if (el.includes(e)) {
				icon = k;
				break;
			};
		};

		return icon;
	};

	iconPath (object: any) {
		const tp = commonStore.getThemePath();
		return `img/${tp}icon/file/${this.icon(object)}.svg`;
	};

	iconImage (object: any): string {
		const tp = commonStore.getThemePath();
		return require(`img/${tp}icon/file/${this.icon(object)}.svg`).default;
	};

	loadPreviewCanvas (file: any, param: any, success?: (canvas: any) => void) {
		if (!file) {
			return;
		};
		
		param = Object.assign({
			maxWidth: 256,
			type: 'image/png',
			quality: 0.95,
			canvas: true,
			contain: true
		}, param);
		
		loadImage.parseMetaData(file, (data: any) => {
			if (data.exif) {
				param = Object.assign(param, { orientation: data.exif.get('Orientation') });
			};
			
			loadImage(file, success, param);
		});
	};
	
	loadPreviewBase64 (file: any, param: any, success?: (image: string, param: any) => void, error?: (error: string) => void) {
		this.loadPreviewCanvas(file, param, (canvas: any) => {
			const image = canvas.toDataURL(param.type, param.quality);
			
			if (image && success) {
				success(image, { width: canvas.width, height: canvas.height });
			};
			
			if (!image && error) {
				error('Failed to get canvas.toDataURL()');
			};
		});
	};

	date () {
		return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
	};

	name (object: any) {
		object = object || {};

		const name = String(object.name || '');
		const fileExt = String(object.fileExt || '');

		if (!fileExt || new RegExp(`\\.${UtilCommon.regexEscape(fileExt)}$`).test(name)) {
			return name;
		};

		return `${name}.${fileExt}`;
	};

};

export default new UtilFile();