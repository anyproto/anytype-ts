//import EmojiData from 'emoji-mart/data/apple.json';

const loadImage = window.require('blueimp-load-image');
const fs = window.require('fs');
const readChunk = window.require('read-chunk');
const fileType = window.require('file-type');
const EmojiData = require('emoji-mart/data/apple.json');

class Util {
	
	icons: any[] = [];
	
	constructor () {
		this.icons = Object.keys(EmojiData.emojis);
	};
	
	toUpperCamelCase (str: string) {
		return this.toCamelCase('_' + str);
	};
	
		
	toCamelCase (str: string) {
		return str.replace(/[_\-\s]([a-zA-Z]{1})/g, (str, p1, p2, offset, s) => {
			return p1.toUpperCase();
		});
	};
	
	fromCamelCase (str: string, symbol: string) {
		return str.replace(/([A-Z]{1})/g, (str, p1, p2, offset, s) => {
			return symbol + p1.toLowerCase();
		});
	};
	
	makeFileFromPath (path: string) {
		let fn = path.split('/');
		let stat = fs.statSync(path);
		let buffer = readChunk.sync(path, 0, stat.size);
		let type = fileType(buffer);
		let file = new File([ new Blob([ buffer ]) ], fn[fn.length - 1], { type: type.mime });
		
		return file;
	};
	
	loadPreviewCanvas (file: any, param: any, success?: (canvas: any) => void) {
		if (!file) {
			return;
		};
		
		param = Object.assign({
			maxWidth: 256,
			type: 'image/png',
			quality: 1,
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
	
	loadPreviewBlob (file: any, param: any, success?: (image: any, param: any) => void, error?: (error: string) => void) {
		this.loadPreviewCanvas(file, param, (canvas: any) => {
			canvas.toBlob((blob: any) => {
				if (blob && success) {
					success(blob, { width: canvas.width, height: canvas.height });
				};
				
				if (!blob && error) {
					error('Failed to get canvas.toBlob()');
				};
			}, param.type, param.quality);
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
	
	rand (min: number, max: number): number {
		if (max && (max != min)) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			return Math.floor(Math.random() * (min + 1));
		};
		return 0;
	};
	
	randomSmile () {
		return this.icons[this.rand(0, this.icons.length - 1)];
	};
		
};

export default new Util();