<<<<<<< HEAD
const loadImage = window.require('blueimp-load-image');
const fs = window.require('fs');
const readChunk = window.require('read-chunk');
const fileType = window.require('file-type');
=======
const loadImage = require('blueimp-load-image');
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001

class Util {
	
	toCamelCase (str: string) {
		return str[0].toUpperCase() + str.slice(1, str.length);
	};
	
<<<<<<< HEAD
	makeFileFromPath (path: string) {
		let fn = path.split('/');
		let stat = fs.statSync(path);
		let buffer = readChunk.sync(path, 0, stat.size);
		let type = fileType(buffer);
		let file = new File([ new Blob([ buffer ]) ], fn[fn.length - 1], { type: type.mime });
		
		return file;
	};
	
=======
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
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
		
};

export default new Util();