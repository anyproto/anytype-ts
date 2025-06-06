import loadImage from 'blueimp-load-image';
import { I, S, U, J, Relation } from 'Lib';

const SIZE_UNIT = 1024;
const UNITS = {
	1: 'B',
	2: 'KB',
	3: 'MB',
	4: 'GB',
	5: 'TB',
};

class UtilFile {

	/**
	 * Returns a human-readable file size string for a given number of bytes.
	 * @param {number} v - The file size in bytes.
	 * @returns {string} The formatted file size string.
	 */
	size (v: number): string {
		v = Number(v) || 0;

		let ret = 0;
		let unit = '';

		for (let i = U.Common.objectLength(UNITS); i >= 1; --i) {
			const n = v / Math.pow(SIZE_UNIT, i - 1);
			if ((n >= 0.9) || (i == 1)) {
				ret = n;
				unit = UNITS[i];
				break;
			};
		};

		return ret ? U.Common.formatNumber(Number(U.Common.sprintf(`%0.2f`, ret))) + unit : '';
	};

	/**
	 * Returns the icon name for a file object based on its properties.
	 * @param {any} object - The file object.
	 * @returns {string} The icon name.
	 */
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
			
		if ([ 'csv', 'json', 'txt', 'doc', 'docx', 'md', 'tsx', 'scss', 'html', 'yml', 'rtf' ].includes(e)) {
			icon = 'text';
		};
			
		if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].includes(e)) {
			icon = 'archive';
		};

		if ([ 'xls', 'xlsx', 'sqlite' ].includes(e)) {
			icon = 'table';
		};

		if ([ 'ppt', 'pptx', 'key' ].includes(e)) {
			icon = 'presentation';
		};

		if ([ 'aif' ].includes(e)) {
			icon = 'audio';
		};

		if ([ 'dwg', 'ai' ].includes(e)) {
			icon = 'other';
		};

		if ([ 'ai' ].includes(e)) {
			icon = 'image';
		};

		for (const k in J.Constant.fileExtension) {
			const el = J.Constant.fileExtension[k];
			if (!U.Common.hasProperty(el, 'length')) {
				continue;
			};

			if (el.includes(e)) {
				icon = k;
				break;
			};
		};

		return icon;
	};

	/**
	 * Returns the icon path for a file object based on its properties and theme.
	 * @param {any} object - The file object.
	 * @returns {string} The icon path.
	 */
	iconPath (object: any) {
		return `./img/${S.Common.getThemePath()}icon/file/${this.icon(object)}.svg`;
	};

	/**
	 * Loads a preview canvas for an image file and calls a callback with the canvas.
	 * @param {any} file - The image file.
	 * @param {any} param - The parameters for loading.
	 * @param {function} [success] - Callback with the loaded canvas.
	 */
	loadPreviewCanvas (file: any, param: any, success?: (canvas: any) => void) {
		if (!file) {
			return;
		};
		
		param = Object.assign({
			maxWidth: 256,
			type: 'image/png',
			quality: 0.95,
			canvas: true,
		}, param);
		
		loadImage.parseMetaData(file, (data: any) => {
			if (data.exif) {
				param = Object.assign(param, { orientation: data.exif.get('Orientation') });
			};

			loadImage(file, success, param);
		});
	};
	
	/**
	 * Loads a preview image as a base64 string and calls a callback with the image and parameters.
	 * @param {any} file - The image file.
	 * @param {any} param - The parameters for loading.
	 * @param {function} [success] - Callback with the image and parameters.
	 * @param {function} [error] - Callback if loading fails.
	 */
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

	/**
	 * Returns the current date as a string suitable for filenames.
	 * @returns {string} The date string.
	 */
	date () {
		return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
	};

	/**
	 * Returns the file name for a file object, appending the extension if needed.
	 * @param {any} object - The file object.
	 * @returns {string} The file name.
	 */
	name (object: any) {
		object = object || {};

		const name = String(object.name || '');
		const fileExt = String(object.fileExt || '');

		if (!fileExt || new RegExp(`\\.${U.Common.regexEscape(fileExt)}$`).test(name)) {
			return name;
		};

		return `${name}.${fileExt}`;
	};

	/**
	 * Returns the object layout type for a given mime type.
	 * @param {string} mime - The mime type string.
	 * @returns {I.ObjectLayout} The object layout type.
	 */
	layoutByMime (mime: string) {
		const t = mime.split('/');
		
		let layout = I.ObjectLayout.File;
		if (t.length) {
			switch (t[0]) {
				case 'image':
					layout = I.ObjectLayout.Image;
					break;

				case 'video':
					layout = I.ObjectLayout.Video;
					break;

				case 'audio':
					layout = I.ObjectLayout.Audio;
					break;
			};
		};

		return layout;
	};

	/**
	 * Checks if a drag event contains files.
	 * @param {React.DragEvent} e - The drag event.
	 * @returns {boolean} True if files are present, false otherwise.
	 */
	checkDropFiles (e: React.DragEvent): boolean {
		return (e.dataTransfer.files && e.dataTransfer.files.length) ? true : false;
	};

};

export default new UtilFile();