import { Util } from 'ts/lib';

const fs = window.require('fs');
const readChunk = window.require('read-chunk');
const fileType = window.require('file-type');
const Constant = require('json/constant.json');
const loadImage = require('blueimp-load-image');

class FileUtil {

	fromPath (path: string) {
		let fn = path.split('/');
		let stat = fs.statSync(path);
		let buffer = readChunk.sync(path, 0, stat.size);
		let type = fileType(buffer);
		let file = new File([ new Blob([ buffer ]) ], fn[fn.length - 1], { type: type.mime });
		return file;
	};

	size (v: number) {
		v = Number(v) || 0;

		let unit = 1024;
		let g = v / (unit * unit * unit);
		let m = v / (unit * unit);
		let k = v / unit;
		if (g > 1) {
			v = Util.sprintf('%0.2fGB', Util.round(g, 2));
		} else if (m > 1) {
			v = Util.sprintf('%0.2fMB', Util.round(m, 2));
		} else if (k > 1) {
			v = Util.sprintf('%0.2fKB', Util.round(k, 2));
		} else {
			v = Util.sprintf('%dB', Util.round(v, 0));
		};
		return v;
	};

	icon (obj: any): string {
		const n = obj.name.split('.');
		const mime = String(obj.mime || obj.mimeType || obj.fileMimeType || '').toLowerCase();
		const e = String(obj.fileExt || n[n.length - 1] || '').toLowerCase();

		let t: string[] = [];
		let icon = '';

		if (mime) {
			let a: string[] = mime.split(';');
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
		
		if (!icon) {
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
	
			for (let k in Constant.extension) {
				if (Constant.extension[k].indexOf(e) >= 0) {
					icon = k;
					break;
				};
			};
		};

		return String(icon || 'other');
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
			let image = canvas.toDataURL(param.type, param.quality);
			
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

};

export default new FileUtil();