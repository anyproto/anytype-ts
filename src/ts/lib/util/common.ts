import TextJson from 'json/text.json';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const ALLOWED_KATEX = ['\\url', '\\href', '\\includegraphics'];

let _katex: any = null;
let _katexLoading: Promise<any> | null = null;
const getKatex = (): any => {
	if (_katex) return _katex;
	if (!_katexLoading) {
		_katexLoading = import('katex').then(m => {
			_katex = m.default || m;
			return import('katex/dist/contrib/mhchem');
		});
	};
	return null;
};

// Eagerly start loading katex
getKatex();
const iconCache: Map<string, string> = new Map();

class UtilCommon {

	/**
	 * Checks if the mouse event button is an auxiliary button (not the main/left button).
	 * @param {MouseEvent} e - The mouse event.
	 * @returns {boolean} True if it's an auxiliary button, false otherwise.
	 */
	checkAuxButton (e: MouseEvent | React.MouseEvent) {
		return !!(e.button && (e.button !== 1));
	};

	/**
	 * Returns the Electron object from the window, or an empty object if not available.
	 */
	getElectron () {
		return window.Electron || {};
	};

	/**
	 * Returns the global configuration object from the window.
	 */
	getGlobalConfig () {
		return window.AnytypeGlobalConfig || {};
	};

	/**
	 * Deep copies an object using JSON serialization.
	 * @param {any} o - The object to copy.
	 * @returns {any} The copied object.
	 */
	objectCopy (o: any): any {
		if (typeof o === 'undefined') {
			o = {};
		};
		return JSON.parse(JSON.stringify(o));
	};

	esc (v: any): string {
		return CSS.escape(String(v));
	};

	/**
	 * Returns the length of an object or array.
	 * @param {any} o - The object or array.
	 * @returns {number} The length.
	 */
	objectLength (o: any) {
		o = o || {};
		return this.hasProperty(o, 'length') ? o.length : Object.keys(o).length;
	};

	/**
	 * Compares two objects for equality by keys and values.
	 * @param {any} o1 - The first object.
	 * @param {any} o2 - The second object.
	 * @returns {boolean} True if objects are equal, false otherwise.
	 */
	objectCompare (o1: any, o2: any): boolean {
		o1 = o1 || {};
		o2 = o2 || {};

		const k1 = Object.keys(o1);
		const k2 = Object.keys(o2);

		if (k1.length !== k2.length) {
			return false;
		};

		k1.sort();
		k2.sort();

		for (let i = 0; i < k1.length; i++) {
			if (k1[i] !== k2[i]) {
				return false;
			};

			const v1 = o1[k1[i]];
			const v2 = o2[k2[i]];

			if ((typeof v1 === 'object') && (typeof v2 === 'object')) {
				if (!this.objectCompare(v1, v2)) {
					return false;
				};
			} else
			if (v1 !== v2) {
				return false;
			};
		};

		return true;
	};

	/**
	 * Compares two objects using JSON stringification.
	 * @param {any} o1 - The first object.
	 * @param {any} o2 - The second object.
	 * @returns {boolean} True if objects are equal, false otherwise.
	 */
	compareJSON (o1: any, o2: any): boolean {
		return JSON.stringify(o1) === JSON.stringify(o2);
	};

	/**
	 * Returns the key in an object that matches the given value.
	 * @param {any} o - The object to search.
	 * @param {any} v - The value to find.
	 * @returns {string|undefined} The key if found, otherwise undefined.
	 */
	getKeyByValue (o: any, v: any) {
		return Object.keys(o || {}).find(k => o[k] === v);
	};

	/**
	 * Checks if an object has a property.
	 * @param {any} o - The object.
	 * @param {string} p - The property name.
	 * @returns {boolean} True if the property exists, false otherwise.
	 */
	hasProperty (o: any, p: string) {
		o = o || {};
		return Object.prototype.hasOwnProperty.call(o, p);
	};

	/**
	 * Recursively clears empty or undefined properties from an object.
	 * @param {any} o - The object to clear.
	 * @returns {any} The cleared object.
	 */
	objectClear (o: any) {
		for (const k in o) {
			if (typeof o[k] === 'object') {
				o[k] = this.objectClear(o[k]);
				if (!this.objectLength(o[k])) {
					delete(o[k]);
				} else 
				if (this.hasProperty(o[k], 'fieldsMap')){
					o[k] = this.fieldsMap(o[k]['fieldsMap']);
				};
			} else 
			if ((typeof o[k] === 'undefined') || (o[k] === null)) {
				delete(o[k]);
			};
		};
		return o;
	};

	/**
	 * Converts an array of key-value pairs to an object, using the first value found in each pair.
	 * @param {any[]} a - The array of key-value pairs.
	 * @returns {object} The resulting object.
	 */
	fieldsMap (a: any[]) {
		const o = {};
		for (let i = 0; i < a.length; ++i) {
			if ((a[i].constructor === Array) && (a[i].length == 2)) {
				const value = a[i][1];
				let v = '';

				for (const k in value) {
					if (value[k]) {
						v = value[k];
						break;
					};
				};

				o[a[i][0]] = v;
			};
		};
		return o;
	};

	/**
	 * Returns a new array with only unique values from the input array.
	 * @param {any[]} a - The array to filter.
	 * @returns {any[]} The array with unique values.
	 */
	arrayUnique (a: any[]) {
		return a.length >= 2 ? [ ...new Set(a) ] : a;
	};
	
	/**
	 * Returns a new array with unique objects based on a key.
	 * @param {any[]} a - The array of objects.
	 * @param {string} k - The key to determine uniqueness.
	 * @returns {any[]} The array with unique objects.
	 */
	arrayUniqueObjects (a: any[], k: string) {
		const res: any[] = [];
		const map = new Map();
		
		for (const item of a) {
			if (!item) {
				continue;
			};

			if (!map.has(item[k])) {
				map.set(item[k], true);
				res.push(item);
			};
		};

		return res;
    };

	/**
	 * Returns the values of an array or object.
	 * @param {any} a - The array or object.
	 * @returns {any[]} The values as an array.
	 */
	arrayValues (a: any) {
		return this.hasProperty(a, 'length') ? a : Object.values(a);
	};

	/**
	 * Copies data to the clipboard and optionally calls a callback.
	 * @param {any} data - The data to copy (text, html, anytype).
	 * @param {function} [callBack] - Optional callback after copy.
	 */
	clipboardCopy (data: any, callBack?: () => void) {
		let removed = false;

		const handler = (e: any) => {
			e.preventDefault();

			if (data.text) {
				e.clipboardData.setData('text/plain', data.text.replace(/\u200B/g, ''));
			};
			if (data.html) {
				e.clipboardData.setData('text/html', data.html.replace(/\u200B/g, ''));
			};
			if (data.anytype) {
				e.clipboardData.setData('application/json', JSON.stringify(data.anytype));
			};

			removed = true;
			U.Dom.removeEvent(document, 'copy', handler, true);
			callBack?.();
		};

		U.Dom.addEvent(document, 'copy', handler, true);
		document.execCommand('copy');

		// Safety cleanup in case execCommand did not trigger the copy event
		if (!removed) {
			U.Dom.removeEvent(document, 'copy', handler, true);
		};
	};

	async clipboardCopyImageFromUrl(url: string) {
		const blob = await fetch(url).then(r => r.blob());

		// Convert blob to PNG (supported by Clipboard API)
		const bitmap = await createImageBitmap(blob);
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		
		const ctx = canvas.getContext('2d');
		ctx.drawImage(bitmap, 0, 0);

		// Convert canvas to PNG blob
		const pngBlob: Blob = await new Promise(resolve =>
			canvas.toBlob(resolve, 'image/png')
		);

		// Copy PNG to clipboard
		await navigator.clipboard.write([
			new ClipboardItem({
				'image/png': pngBlob
			})
		]);

		Preview.toastShow({
			text: U.String.sprintf(translate('toastCopy'), translate('commonImage'))
		});
	};

	/**
	 * Shows a toast and copies text to the clipboard.
	 * @param {string} label - The label for the toast.
	 * @param {string} text - The text to copy.
	 * @param {string} [toast] - Optional custom toast message.
	 */
	copyToast (label: string, text: string, toast?: string) {
		this.clipboardCopy({ text });
		Preview.toastShow({ text: U.String.sprintf(toast || translate('toastCopy'), label) });
	};
	
	/**
	 * Preloads images and calls a callback when all are loaded.
	 * @param {string[]} images - Array of image URLs.
	 * @param {function} [callBack] - Optional callback after all images are loaded.
	 */
	cacheImages (images: string[], callBack?: () => void) {
		let loaded = 0;
		const cb = () => {
			loaded++;
			if ((loaded == images.length) && callBack) {
				callBack();
			};
		};

		images.forEach(image => {
			const img = new Image();

			img.src = image;
			img.onload = cb;
			img.onerror = cb;
		});
	};
	
	/**
	 * Returns a random integer between min and max (inclusive).
	 * @param {number} min - The minimum value.
	 * @param {number} max - The maximum value.
	 * @returns {number} The random integer.
	 */
	rand (min: number, max: number): number {
		if (max && (max != min)) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		} else {
			return Math.floor(Math.random() * (min + 1));
		};
	};

	/**
	 * Rounds a number to a specified number of decimal places.
	 * @param {number} v - The value to round.
	 * @param {number} l - The number of decimal places.
	 * @returns {number} The rounded value.
	 */
	round (v: number, l: number) {
		const d = Math.pow(10, l);
		return d > 0 ? Math.round(v * d) / d : Math.round(v);
	};

	/**
	 * Formats a number with spaces as thousands separators.
	 * @param {number} v - The number to format.
	 * @returns {string} The formatted number as a string.
	 */
	formatNumber (v: number): string {
		let s = String(v || '');
		if (s.length < 6) {
			return s;
		};

		let parts = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).formatToParts(v);
		if (parts && parts.length) {
			parts = parts.map((it: any) => {
				if (it.type == 'group') {
					it.value = ' ';
				};
				return it.value;
			});
			s = parts.join('');
		};
		return s;
	};

	/**
	 * Groups an array of objects by a field into a map of arrays.
	 * @param {any[]} list - The array of objects.
	 * @param {string} field - The field to group by.
	 * @returns {object} The grouped map.
	 */
	mapToArray (list: any[], field: string): any {
		list = list || [];

		const map: Record<string, any[]> = {};
		for (const item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};

	/**
	 * Maps an array of objects to an object using a field as the key.
	 * @param {any[]} list - The array of objects.
	 * @param {string} field - The field to use as the key.
	 * @returns {object} The mapped object.
	 */
	mapToObject (list: any[], field: string) {
		const obj: any = {};
		for (const item of list) {
			obj[item[field]] = item;
		};
		return obj;
	};
	
	/**
	 * Flattens a map of arrays into a single array.
	 * @param {object} map - The map of arrays.
	 * @returns {any[]} The flattened array.
	 */
	unmap (map: any) {
		return Object.values(map).flat();
	};
	


	/**
	 * Returns the correct plural form of a word based on a count.
	 * @param {number} cnt - The count.
	 * @param {string} words - The word forms separated by '|'.
	 * @returns {string} The correct word form.
	 */
	plural (cnt: number, words: string) {
		const chunks = words.split('|');
		const single = chunks[0];
		const multiple = chunks[1] || single;

		return cnt == 1 ? single : multiple;
	};

	/**
	 * Gets the current platform as an enum value.
	 * @returns {I.Platform} The platform.
	 */
	getPlatform (): I.Platform {
		return J.Constant.platforms[this.getElectron().platform] || I.Platform.None;
	};

	/**
	 * Checks if the current platform is Mac.
	 * @returns {boolean} True if Mac, false otherwise.
	 */
	isPlatformMac (): boolean {
		return this.getPlatform() == I.Platform.Mac;
	};

	/**
	 * Checks if the current platform is Windows.
	 * @returns {boolean} True if Windows, false otherwise.
	 */
	isPlatformWindows (): boolean {
		return this.getPlatform() == I.Platform.Windows;
	};

	/**
	 * Checks if the current platform is Linux.
	 * @returns {boolean} True if Linux, false otherwise.
	 */
	isPlatformLinux (): boolean {
		return this.getPlatform() == I.Platform.Linux;
	};

	/**
	 * Handles common error codes and shows alerts or popups as needed.
	 * @param {number} code - The error code.
	 * @returns {boolean} True if no critical error, false otherwise.
	 */
	checkErrorCommon (code: number): boolean {
		if (!code) {
			return true;
		};

		// App is already working
		if (code == J.Error.Code.ANOTHER_ANYTYPE_PROCESS_IS_RUNNING) {
			alert('You have another instance of anytype running on this machine. Closing...');
			Renderer.send('exit', false);
			return false;
		};

		// App needs update
		if ([ J.Error.Code.ANYTYPE_NEEDS_UPGRADE, J.Error.Code.PROTOCOL_NEEDS_UPGRADE ].includes(code)) {
			this.onErrorUpdate();
			return false;
		};

		return true;
	};

	/**
	 * Handles errors when opening an object, showing popups as needed.
	 * @param {string} rootId - The root object ID.
	 * @param {number} code - The error code.
	 * @param {any} context - The React context or component.
	 * @returns {boolean} True if no critical error, false otherwise.
	 */
	checkErrorOnOpen (rootId: string, code: number): boolean {
		if (!rootId || !code) {
			return true;
		};

		if (!this.checkErrorCommon(code)) {
			return false;
		};

		// Self-heal: if the object that failed to open is the stored last-opened for the
		// current space AND that entry is stale — a legacy entry without a spaceId, or one
		// belonging to another space — clear it so switching back doesn't keep replaying
		// the bad open. A valid same-space entry is kept: a transient open failure should
		// not drop the user's restore point (JS-9815).
		const space = S.Common.space;
		const last = Storage.getLastOpened(space);
		if (last && (last.id == rootId) && (!last.spaceId || (last.spaceId != space))) {
			Storage.setLastOpened({}, space);
		};

		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/error', color: 'orange' },
				title: translate('commonError'),
				text: translate('popupConfirmObjectOpenErrorText'),
				textConfirm: translate('popupConfirmObjectOpenErrorButton'),
				onConfirm: () => {
					const logPath = this.getElectron().logPath();

					C.DebugTree(rootId, logPath, false, (message: any) => {
						if (!message.error.code) {
							Action.openPath(logPath);
						};
					});

					U.Space.openDashboard();
				}
			},
		});

		return false;
	};

	/**
	 * Shows an update popup and calls a callback on confirmation.
	 * @param {function} [onConfirm] - Optional callback after update confirmation.
	 */
	onErrorUpdate (onConfirm?: () => void) {
		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/update', color: 'lime' },
				title: translate('popupConfirmNeedUpdateTitle'),
				text: translate('popupConfirmNeedUpdateText'),
				textConfirm: translate('commonUpdate'),
				textCancel: translate('popupConfirmUpdatePromptCancel'),
				onConfirm: () => {
					Renderer.send('update');
					onConfirm?.();
				},
			},
		});
	};



	/**
	 * Parses URL search parameters into an object.
	 * @param {string} url - The URL string.
	 * @returns {object} The parameters as key-value pairs.
	 */
	searchParam (url: string): any {
		const param: any = {};

		try {
			const u = new URLSearchParams(String(url || ''));
			u.forEach((v, k) => {
				param[k] = v;
			});

		} catch (e) { console.warn('[Common] invalid URL params:', e); };
		return param;
	};



	/**
	 * Finds the closest number in an array to a goal value.
	 * @param {number[]} array - The array of numbers.
	 * @param {number} goal - The target value.
	 * @returns {number} The closest number.
	 */
	findClosestElement (array: number[], goal: number) {
		return array.reduce((prev: number, curr: number) => {
			return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev;
		}, 0);
	};

	/**
	 * Checks if two rectangles collide.
	 * @param {object} rect1 - The first rectangle.
	 * @param {object} rect2 - The second rectangle.
	 * @returns {boolean} True if they collide, false otherwise.
	 */
	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	/**
	 * Checks if two sets of coordinates and dimensions collide.
	 * @param {number} x1 - X of first.
	 * @param {number} y1 - Y of first.
	 * @param {number} w1 - Width of first.
	 * @param {number} h1 - Height of first.
	 * @param {number} x2 - X of second.
	 * @param {number} y2 - Y of second.
	 * @param {number} w2 - Width of second.
	 * @param {number} h2 - Height of second.
	 * @returns {boolean} True if they collide, false otherwise.
	 */
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};

	/**
	 * Extracts files from a DataTransfer items array.
	 * @param {any[]} items - The DataTransfer items.
	 * @returns {any[]} Array of files.
	 */
	getDataTransferFiles (items: any[]): any[] {
		if (!items || !items.length) {
			return [];
		};

		const files: any[] = [];
		for (const item of items) {
			if (item.kind != 'file') {
				continue;
			};

			const file = item.getAsFile();
			if (file) {
				files.push(file);
			};
		};
		return files;
	};

	/**
	 * Extracts HTML string items from a DataTransfer items array.
	 * @param {any[]} items - The DataTransfer items.
	 * @returns {any[]} Array of string items.
	 */
	getDataTransferItems (items: any[]) {
		if (!items || !items.length) {
			return [];
		};

		const ret = [];
		for (const item of items) {
			if ((item.kind == 'string') && (item.type == 'text/html')) {
				ret.push(item);
			};
		};
		return ret;
	};

	/**
	 * Gets a string from DataTransfer items and calls a callback with the result.
	 * @param {any[]} items - The DataTransfer items.
	 * @param {function} callBack - Callback with the resulting string.
	 */
	getDataTransferString (items: any[], callBack: (data: string) => void) {
		if (!items || !items.length) {
			return;
		};

		const length = items.length;
		const ret = [];
		const cb = (data: string) => {
			ret.push(data);

			if (ret.length == length) {
				callBack(ret.join('\n'));
			};
		};

		for (const item of items) {
			item.getAsString(cb);
		};
	};

	/**
	 * Saves clipboard files and calls a callback with the result.
	 * @param {any[]} items - The clipboard items.
	 * @param {any} data - Additional data to include.
	 * @param {function} callBack - Callback with the result.
	 */
	saveClipboardFiles (items: any[], data: any, callBack: (data: any) => void) {
		if (!items.length) {
			return;
		};

		let n = 0;

		const ret: any[] = [];
		const cb = () => {
			n++;
			if (n == items.length) {
				callBack({ ...data, files: ret });
			};
		};

		const timestamp = Date.now();

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item.path) {
				ret.push(item);
				cb();
			} else {
				const reader = new FileReader();
				reader.onload = () => {
					// Generate unique filename to avoid collisions when multiple files have the same name
					const parts = String(item.name || 'file').split('.');
					const ext = parts.length > 1 ? parts.pop() : '';
					const base = parts.join('.');
					const uniqueName = ext ? `${base}_${timestamp}_${i}.${ext}` : `${base}_${timestamp}_${i}`;

					ret.push({
						...item,
						path: this.getElectron().fileWrite(uniqueName, reader.result, { encoding: 'binary' }),
					});
					cb();
				};
				reader.onerror = cb;
				reader.readAsBinaryString(item.file ? item.file : item);
			};
		};
	};

	/**
	 * Converts an object's properties to data-* attributes.
	 * @param {any} data - The data object.
	 * @returns {object} The data-* attributes object.
	 */
	dataProps (data: any) {
		data = data || {};

		const ret: any = {};
		for (const k in data) {
			ret[`data-${k}`] = data[k];
		};
		return ret;
	};

	animationProps (param?: any) {
		param = param || {};
		param.initial = param.initial || {};
		param.animate = param.animate || {};
		param.exit = param.exit || {};
		param.transition = param.transition || {};

		return {
			initial: { opacity: 0, ...param.initial },
			animate: { opacity: 1, ...param.animate },
			exit: { opacity: 0, ...param.exit },
			transition: { type: 'tween' as const, duration: 0.2, ease: [ 0.22, 1, 0.36, 1 ], ...param.transition },
		};
	};



	/**
	 * Calculates a percentage of a number.
	 * @param {number} num - The base number.
	 * @param {number} percent - The percentage to calculate.
	 * @returns {number} The calculated value.
	 */
	getPercentage (num: number, percent: number) {
		return Number((num / 100 * percent).toFixed(3));
	};



	/**
	 * Returns the percent value of part/whole.
	 * @param {number} part - The part value.
	 * @param {number} whole - The whole value.
	 * @returns {number} The percent value.
	 */
	getPercent (part: number, whole: number): number {
		return Number((part / whole * 100).toFixed(1));
	};

	/**
	 * Translates an error code for a command, or returns the error description.
	 * @param {string} command - The command name.
	 * @param {any} error - The error object.
	 * @returns {string} The translated error or description.
	 */
	translateError (command: string, error: any) {
		const { code, description } = error;
		const id = U.String.toCamelCase(`error-${command}${code}`);
		return (TextJson as Record<string, string>)[id] ? translate(id) : description;
	};

	/**
	 * Fixes ASAR paths for Electron packaged apps.
	 * @param {string} path - The path to fix.
	 * @returns {string} The fixed path.
	 */
	fixAsarPath (path: string): string {
		const electron = this.getElectron();

		if (!electron.dirName || !electron.isPackaged) {
			return path;
		};

		let href = electron.dirName(location.href);
		href = href.replace('/app.asar/', '/app.asar.unpacked/');
		return href + path.replace(/^\.\//, '/');
	};



	/**
	 * Converts a Uint8Array to a string.
	 * @param {Uint8Array} u8a - The array to convert.
	 * @returns {string} The resulting string.
	 */
	uint8ToString (u8a: Uint8Array): string {
		const CHUNK = 0x8000;
		const c = [];

		for (let i = 0; i < u8a.length; i += CHUNK) {
			c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK)));
		};
		return c.join('');
	};

	/**
	 * Returns the key of an enum for a given value.
	 * @param {any} e - The enum object.
	 * @param {any} v - The value to find.
	 * @returns {string} The key name.
	 */
	enumKey (e: any, v: any) {
		let k = '';
		for (const key in e) {
			if (v === e[key]) {
				k = key;
				break;
			};
		};
		return k;
	};



	/**
	 * Shows a browser notification with a title and text, and handles click events.
	 * @param {any} param - The notification parameters (title, text).
	 * @param {function} [onClick] - Optional callback for click event.
	 */
	notification (param: any, onClick?: () => void) {
		const title = U.String.stripTags(String(param.title || ''));
		const text = U.String.stripTags(String(param.text || ''));

		if (!text) {
			return;
		};

		const electron = this.getElectron();
		const item = new window.Notification(title, { body: text });

		item.onclick = () => {
			electron.focus();
			onClick?.();
		};
	};

	/**
	 * Checks if the app version is an alpha version.
	 * @returns {boolean} True if alpha version, false otherwise.
	 */
	isAlphaVersion (): boolean {
		return !!this.getElectron().version.app.match(/alpha/);
	};

	/**
	 * Checks if the app version is a beta version.
	 * @returns {boolean} True if beta version, false otherwise.
	 */
	isBetaVersion (): boolean {
		return !!this.getElectron().version.app.match(/beta/);
	};

	/**
	 * Renders LaTeX expressions in a string to HTML using KaTeX.
	 * @param {string} html - The HTML string containing LaTeX.
	 * @returns {string} The HTML with rendered LaTeX.
	 */
	getLatex (input: string) {
		if (!input || (input.indexOf('$') < 0)) {
			return input;
		};

		const katex = getKatex();
		if (!katex) {
			return input;
		};

		const regex = new RegExp(`\\$([^$<>]+?)\\$`, 'g');
		const match = input.match(regex);

		if (!match) {
			return input;
		};

		const tag = Mark.getTag(I.MarkType.Latex);
		const code = Mark.getTag(I.MarkType.Code);
		const cl = code.length;
		const regCode = new RegExp(`^${code}>|</${code}$`, 'i');
		const render = (s) => {
			try {
				const rendered = katex.renderToString(U.String.fromHtmlSpecialChars(s), {
					displayMode: false,
					throwOnError: false,
					output: 'html',
					trust: ctx => ALLOWED_KATEX.includes(ctx.command),
				});

				return rendered || s;
			} catch {
				return s;
			};
		};

		let res = input;

		for (let i = 0; i < match.length; ++i) {
			const m = String(match[i] || '');
			const idx = input.indexOf(m);
			const bl = m.length;
			const body = m.substring(1, bl - 1);
			const before = input.substring(idx - cl - 1, idx) || '';
			const after = input.substring(idx + bl + 1, idx + bl + cl + 3) || '';

			// Skip inline code regions
			if (regCode.test(before) || regCode.test(after)) {
				continue;
			};

			// Skip Brazilian Real
			if (!/^\\/.test(body) && (/R$/.test(before) || /R$/.test(body))) {
				continue;
			};

			// Skip if expression starts/ends with space
			if (/^\s/.test(body) || /\s$/.test(body)) {
				continue;
			};

			// Skip escaped \$ signs
			if (/\\$/.test(before) || /\\$/.test(body)) {
				continue;
			};

			// Skip numbers after $ sign
			if (/^[\d]/.test(after)) {
				continue;
			};

			const escaped = U.String.htmlSpecialChars(m).replace(/\$/g, '&#36;');
			res = res.replace(m, `<${tag} data-latex="${escaped}" data-latex-length="${m.length}">${render(body)}</${tag}>`);
		};

		return res;
	};



	/**
	 * Updates an SVG image's attributes and caches the result.
	 * @param {string} src - The SVG source as a base64 string.
	 * @param {any} param - The parameters (id, size, fill, stroke).
	 * @returns {string} The updated SVG as a base64 string.
	 */
	updateSvg (src: string, param: any) {
		const id = String(param.id || '');
		const size = Number(param.size) || 0;
		const fill = String(param.fill || '');
		const stroke = String(param.stroke || '');
		const key = [ id, size, fill, stroke ].join('-');

		if (iconCache.has(key)) {
			return iconCache.get(key);
		};

		let ret = '';
		try {
			const decoded = src.includes('base64,')
				? atob(src.split('base64,')[1]).replace(/_COLOR_VAR_/g, fill)
				: src.replace(/_COLOR_VAR_/g, fill);
			const parser = new DOMParser();
			const doc = parser.parseFromString(decoded, 'image/svg+xml');
			const el = doc.documentElement;

			if (size) {
				el.setAttribute('width', String(size));
				el.setAttribute('height', String(size));
			};

			if (fill) {
				el.setAttribute('fill', fill);
			};

			if (stroke) {
				el.setAttribute('stroke', stroke);
			};

			ret = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(el.outerHTML)));
		} catch (e) { console.warn('[Common] SVG encoding failed:', e); };

		iconCache.set(key, ret);
		return ret;
	};

	/**
	 * Parses a URL and returns a route string for internal navigation.
	 * @param {string} url - The URL to parse.
	 * @returns {string} The route string.
	 */
	getRouteFromUrl (url: string): string {
		url = String(url || '');

		if (!url) {
			return '';
		};

		let ret = '';

		try {
			const u = new URL(url);
			const { hostname, pathname, hash, searchParams, protocol } = u;

			if (protocol == `${J.Constant.protocol}:`) {
				return url.replace(new RegExp(`^${J.Constant.protocol}://`), '/');
			};

			switch (hostname) {
				case 'invite.any.coop': {
					const cid = pathname.replace(/^\//, '');
					const key = hash.replace(/^#/, '');

					ret = `/invite/?cid=${cid}&key=${key}`;
					break;
				};

				case 'object.any.coop': {
					const objectId = pathname.replace(/^\//, '');
					const spaceId = searchParams.get('spaceId');
					const cid = searchParams.get('inviteId');
					const key = hash.replace(/^#/, '');

					ret = `/object/?objectId=${objectId}&spaceId=${spaceId}&cid=${cid}&key=${key}`;
					break;
				};

				case 'hi.any.coop': {
					const id = pathname.replace(/^\//, '');
					const key = hash.replace(/^#/, '');

					ret = `/hi/?id=${id}&key=${key}`;
					break;
				};

			};
		} catch (e) { console.warn('[Common] URL parsing failed:', e); };

		return ret;
	};

	getLinkParamFromUrl (url: string): { route: string; target: string; spaceId: string; messageId: string; isInside: boolean; } {
		const ret = {
			route: '',
			target: '',
			spaceId: '',
			messageId: '',
			isInside: U.String.urlScheme(url) == J.Constant.protocol,
		};

		if (ret.isInside) {
			ret.route = url.split(':/')[1] || '';

			const search = url.split('?')[1];
			if (search) {
				const searchParam = U.Common.searchParam(search);

				ret.target = searchParam.objectId;
				ret.spaceId = searchParam.spaceId;
				ret.messageId = searchParam.messageId;
			} else {
				const routeParam = U.Router.getParam(ret.route);

				ret.target = routeParam.id;
				ret.spaceId = routeParam.spaceId;
				ret.messageId = routeParam.messageId;
			};
		} else {
			ret.target = url;
		};

		return ret;
	};

	/**
	 * Returns the background color for an icon option.
	 * @param {number} o - The icon option index.
	 * @returns {string} The background color string.
	 */
	iconBgByOption (o: number): string {
		const { bg, list } = J.Theme.icon;

		o = Number(o) || 0;
		o = Math.max(0, Math.min(list.length, o));

		return bg[list[o - 1]];
	};

	/**
	 * Returns the text color for an icon option.
	 * @param {number} o - The icon option index.
	 * @returns {string} The text color string.
	 */
	iconTextByOption (o: number): string {
		const { text, list } = J.Theme.icon;

		o = Number(o) || 0;
		o = Math.max(0, Math.min(list.length, o));

		return text[list[o - 1]];
	};

	/**
	 * Shows the "What's New" popup and updates storage.
	 */
	showWhatsNew (param?: Partial<I.PopupParam>) {
		param = param || {};
		param.data = param.data || {};
		param.data.document = 'whatsNew';
		param.onClose = () => {
			Survey.checkCommon();
		};

		S.Popup.open('help', param);
		Storage.set('whatsNew', false);
	};

	/**
	 * Checks if the current app version is different from the provided version.
	 * If different, sets a flag in storage to show the "What's New" popup.
	 * @param {string} v - The version to check against.
	 */
	checkUpdateVersion (v: string) {
		v = String(v || '');

		const electron = this.getElectron();
		const update = v.split('.');
		const current = String(electron.version.app || '').split('.');

		if ((update[0] != current[0]) || (update[1] != current[1])) {
			Storage.set('whatsNew', true);
			Storage.setHighlight('whatsNew', true);
		};
	};

	calculateStorageUsage (): number {
		const spaces = U.Space.getList();

		let usage = 0;

		(spaces || []).forEach((space) => {
			if (!U.Space.isMyOwner(space.targetSpaceId)) {
				return;
			};

			const object: any = S.Common.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};

			usage += Number(object.bytesUsage) || 0;
		});

		return usage;
	};



	getMembershipPriceString (price?: I.MembershipAmount): string {
		if (!price) {
			return '';
		};

		const digits = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(price.amountCents / 100);
		return `${J.Constant.currencySymbol[price.currency]}${digits}`;
	};

	safeDecodeUri (s: string): string {
		s = String(s || '');

		try {
			return decodeURIComponent(s);
		} catch {
			return s;
		};
	};

	snapWidth (w: number, steps?: number): number {
		steps = Math.max(1, Number(steps) || 12);

		const step = 1 / steps;
		const nearest = Math.round(w / step) * step;

		if (Math.abs(w - nearest) <= 0.02) {
			return nearest;
		};

		return w;
	};

	settingsHeader (isPopup: boolean, fallBack: string): string {
		const isSettings = keyboard.getMatch(isPopup).params.action == 'settings';
		return isSettings ? 'mainSettings' : fallBack;
	};

	helpMediaPath () {
		const theme = S.Common.getThemeClass();
		const ret = [ '.', 'img' ];

		if (theme) {
			ret.push('theme', theme);
		};

		ret.push('help');
		return ret.join('/');
	};

	tabTooltipShow (data: any) {
		const spaceview = U.Space.getSpaceviewBySpaceId(data.spaceId);
		if (!spaceview) {
			return;
		};

		const { routeParam } = data;
		let headerObject = spaceview;

		if ((routeParam?.action == 'settings') && !this.getSpaceSettingsPages().includes(routeParam?.id)) {
			const profile = U.Space.getProfile();
			if (profile && !profile._empty_) {
				headerObject = profile;
			};
		};

		Preview.previewShow({
			rect: { x: data.offsetLeft, y: 0, width: data.width, height: 0 },
			classNameWrap: 'isTab',
			object: headerObject,
			target: headerObject.id,
			noUnlink: true,
			noEdit: true,
			passThrough: true,
			noAnimation: true,
			noOffset: true,
			typeX: I.MenuDirection.Left,
			relatedData: {
				action: routeParam?.action,
				name: data?.objectName,
				object: data?.objectData,
			},
			delay: 0,
			type: I.PreviewType.Tab,
		});
	};

	tabTooltipHide () {
		Preview.previewHide(true);
	};

	applyAutoDownload (value: number) {
		C.FileSetAutoDownload(value > 0, false);
		
		if (value >= 0) {
			C.FileAutoDownloadSetLimit(value);
		};
	};

	getSpaceSettingsPages (): string[] {
		return [
			'spaceIndex', 'spaceStorage', 'spaceShare', 'spaceNotifications',
			'importIndex', 'importNotion', 'importNotionWarning', 'importCsv', 'importObsidian',
			'exportIndex', 'exportProtobuf', 'exportMarkdown',
			'set', 'relation', 'archive',
		];
	};

};

export default new UtilCommon();
