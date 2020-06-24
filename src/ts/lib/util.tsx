import { I, keyboard } from 'ts/lib';
import { commonStore } from 'ts/store';
import { v4 as uuidv4 } from 'uuid';

const escapeStringRegexp = require('escape-string-regexp');
const { ipcRenderer } = window.require('electron');
const raf = require('raf');
const $ = require('jquery');
const loadImage = window.require('blueimp-load-image');
const fs = window.require('fs');
const readChunk = window.require('read-chunk');
const fileType = window.require('file-type');
const Constant = require('json/constant.json');
const sprintf = window.require('sprintf-kit')({
	d: require('sprintf-kit/modifiers/d'),
	s: require('sprintf-kit/modifiers/s'),
	f: require('sprintf-kit/modifiers/f'),
});

class Util {
	
	timeoutTooltip: number = 0;
	timeoutLinkPreviewShow: number = 0;
	timeoutLinkPreviewHide: number = 0;
	linkPreviewOpen: boolean = false;
	
	sprintf (...args: any[]) {
		return sprintf.apply(this, args);
	};
	
	toUpperCamelCase (str: string) {
		return this.toCamelCase('_' + str);
	};
	
	toCamelCase (str: string) {
		return str.replace(/[_\-\s]([a-zA-Z]{1})/g, (str: string, p1: string, p2: string, offset: number, s: string) => {
			return p1.toUpperCase();
		});
	};

	fromCamelCase (str: string, symbol: string) {
		return str.replace(/([A-Z]{1})/g, (str: string, p1: string, p2: string, offset: number, s: string) => {
			return symbol + p1.toLowerCase();
		});
	};

	ucFirst (s: string): string {
		if (!s) {
			return '';
		};
		return s.substr(0, 1).toUpperCase() + s.substr(1, s.length).toLowerCase();
	};
	
	objectCopy (o: any): any {
		return JSON.parse(JSON.stringify(o || {}));
	};
	
	objectLength (o: any) {
		return o.hasOwnProperty('length') ? o.length : Object.keys(o).length;
	};
	
	objectCompare (o1: any, o2: any): boolean {
		o1 = o1 || {};
		o2 = o2 || {};
		
		let k1 = Object.keys(o1);
		let k2 = Object.keys(o2);
		let v1 = Object.values(o1);
		let v2 = Object.values(o2);
		let sort = (c1: any, c2: any) => {
			if (c1 > c2) return 1;
			if (c1 < c2) return -1;
			return 0;
		};
		
		k1.sort(sort);
		k2.sort(sort);
		v1.sort(sort);
		v2.sort(sort);
		
		return (JSON.stringify(k1) === JSON.stringify(k2)) && 
			(JSON.stringify(v1) === JSON.stringify(v2));
	};
	
	arrayUniqueObjects (array: any[], k: string) {
		const res: any[] = [];
		const map = new Map();
		
		for (const item of array) {
			if (!map.has(item[k])){
				map.set(item[k], true);
				res.push(item);
			};
		};
		return res;
	};

	arrayValues (a: any) {
		return a.hasOwnProperty('length') ? a : Object.values(a);
	};

	stringCut (haystack: string, start: number, end: number): string {
		return haystack.substr(0, start) + haystack.substr(end);
	};

	stringInsert (haystack: string, needle: string, start: number, end: number): string {
		haystack = String(haystack || '');
		return haystack.substr(0, start) + needle + haystack.substr(end);
	};
	
	shorten (s: string, l: number, noEnding?: boolean) {
		s = String(s || '');
		l = Number(l) || 16;
		if (s.length > l) {
			s = s.substr(0, l) + (!noEnding ? '...' : '');
		};
		return s;
	};

	rectsCollide (rect1: any, rect2: any) {
		return this.coordsCollide(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
	};
	
	coordsCollide (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
		return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 + w1 < x2) || (x1 > x2 + w2));
	};
	
	clipboardCopy (data: any, callBack?: () => void) {
		const handler = (e: any) => {
			e.preventDefault();
			
			if (data.text) {
				e.clipboardData.setData('text/plain', data.text);
			};
			if (data.html) {
				e.clipboardData.setData('text/html', data.html);	
			};
			if (data.anytype) {
				e.clipboardData.setData('application/json', JSON.stringify(data.anytype));
			};
			
			document.removeEventListener('copy', handler, true);
			
			if (callBack) {
				callBack();
			};
		};

		document.addEventListener('copy', handler, true);
		document.execCommand('copy');
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

	timestamp (d?: string): number {
		const ts = d ? new Date(d) : new Date();
		return Math.floor(ts.getTime() / 1000);
	};

	date (format: string, timestamp: number) {
		timestamp = Number(timestamp) || 0;
		const jsdate = new Date(timestamp ? timestamp * 1000 : null);
		const pad = (n: number, c: number) => {
			let s = String(n);
			if ((s = s + '').length < c ) {
				++c;
				let m = c - s.length;
				return new Array(m).join('0') + s;
			} else {
				return s;
			};
			return false;
		};
		const f: any = {
			// Day
			d: () => {
			   return pad(f.j(), 2);
			},
			D: () => {
				let t = f.l(); 
				return t.substr(0,3);
			},
			j: () => {
				return jsdate.getDate();
			},
			// Month
			F: () => {
				return Constant.month[f.n()];
			},
			m: () => {
				return pad(f.n(), 2);
			},
			M: () => {
				return f.F().substr(0, 3);
			},
			n: () => {
				return jsdate.getMonth() + 1;
			},
			// Year
			Y: () => {
				return jsdate.getFullYear();
			},
			y: () => {
				return (jsdate.getFullYear() + '').slice(2);
			},
			// Time
			a: () => {
				return jsdate.getHours() > 11 ? 'pm' : 'am';
			},
			A: () => {
				return jsdate.getHours() > 11 ? 'PM' : 'AM';
			},
			g: () => {
				return jsdate.getHours() % 12 || 12;
			},
			h: () => {
				return pad(f.g(), 2);
			},
			H: () => {
				return pad(jsdate.getHours(), 2);
			},
			i: () => {
				return pad(jsdate.getMinutes(), 2);
			},
			s: () => {
				return pad(jsdate.getSeconds(), 2);
			},
			w: () => {
				return jsdate.getDay();
			},
		};
		return format.replace(/[\\]?([a-zA-Z])/g, (t: string, s: string) => {
			let ret = null;
			if (t != s) {
				ret = s;
			} else if (f[s]) {
				ret = f[s]();
			} else {
				ret = s;
			};
			return ret;
		});
	};
	
	round (v: number, l: number) {
		let d = Math.pow(10, l);
		return d > 0 ? Math.round(v * d) / d : Math.round(v);
	};
	
	fileSize (v: number) {
		v = Number(v) || 0;
		let g = v / (1024 * 1024 * 1024);
		let m = v / (1024 * 1024);
		let k = v / 1024;
		if (g > 1) {
			v = sprintf('%fGB', this.round(g, 2));
		} else if (m > 1) {
			v = sprintf('%fMB', this.round(m, 2));
		} else if (k > 1) {
			v = sprintf('%fKB', this.round(k, 2));
		} else {
			v = sprintf('%dB', this.round(v, 0));
		};
		return v;
	};
	
	scrollTop (top: number) {
		$('html, body').stop().animate({ scrollTop: top }, 300, 'swing');	
	};
		
	scrollTopEnd () {
		this.scrollTop($(document).height() - $(window).height());
	};
	
	tooltipShow (text: string, node: any, typeY: I.MenuDirection) {
		if (!node.length) {
			return;
		};

		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => {
			let win = $(window);
			let obj = $('#tooltip');
			let offset = node.offset();
			let st = win.scrollTop(); 
			
			text = text.toString().replace(/\\n/, '\n');
			
			obj.find('.txt').html(this.lbBr(text));
			obj.show().css({ opacity: 0 });
			
			let x = offset.left - obj.outerWidth() / 2 + node.outerWidth() / 2;
			let y = 0;
			
			if (typeY == I.MenuDirection.Top) {
				y = offset.top - obj.outerHeight() - 12 - st;
			};
			
			if (typeY == I.MenuDirection.Bottom) {
				y = offset.top + node.outerHeight() + 12 - st;
			};
			
			x = Math.max(12, x);
			x = Math.min(win.width() - obj.outerWidth() - 12, x);

			raf(() => {
				obj.css({ left: x, top: y, opacity: 1 });
			});
		}, 250);
	};
	
	tooltipHide () {
		let obj = $('#tooltip');
		
		obj.css({ opacity: 0 });
		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => { obj.hide(); }, 200);
	};
	
	linkPreviewShow (url: string, node: any, param: any) {
		if (!node.length || keyboard.isPreviewDisabled) {
			return;
		};
		
		const win = $(window);
		const obj = $('#linkPreview');
		const poly = obj.find('.polygon');
		
		node.unbind('mouseleave.link').on('mouseleave.link', (e: any) => {
			window.clearTimeout(this.timeoutLinkPreviewShow);
		});
		
		obj.unbind('mouseleave.link').on('mouseleave.link', (e: any) => {
			this.linkPreviewHide(false);
		});
		
		this.linkPreviewHide(false);
		
		window.clearTimeout(this.timeoutLinkPreviewShow);
		this.timeoutLinkPreviewShow = window.setTimeout(() => {
			commonStore.linkPreviewSet({
				url: url,
				element: node,
				...param,
			});
			this.linkPreviewOpen = true;
		}, 500);
	};
	
	linkPreviewHide (force: boolean) {
		const obj = $('#linkPreview');
		
		window.clearTimeout(this.timeoutLinkPreviewShow);
		
		if (force) {
			obj.hide();
			return;
		};
		
		obj.css({ opacity: 0 });
		this.timeoutLinkPreviewHide = window.setTimeout(() => { 
			obj.hide();
			this.linkPreviewOpen = false;
			obj.removeClass('top bottom withImage'); 
		}, 250);
	};
	
	lbBr (s: string) {
		return s.toString().replace(new RegExp(/\n+/gi), '<br/>');
	};
	
	map (list: any[], field: string): any {
		list = list|| [] as any[];
		
		let map = {} as any;
		for (let item of list) {
			map[item[field]] = map[item[field]] || [];
			map[item[field]].push(item);
		};
		return map;
	};
	
	unmap (map: any) {
		let ret: any[] = [] as any[];
		for (let field in map) {
			ret = ret.concat(map[field]);
		};
		return ret;
	};
	
	filterFix (v: string) {
		return escapeStringRegexp(String(v || '').replace(/[\/\\\*]/g, ''));
	};
	
	lengthFixOut (text: string, len: number): number {
		const s = String(text || '').substring(0, len);
		return [...s].length;
	};
	
	rangeFixOut (text: string, range: I.TextRange): I.TextRange {
		range = this.objectCopy(range);
		range.from = this.lengthFixOut(text, range.from);
		range.to = this.lengthFixOut(text, range.to);
		return range;
	};
	
	renderLink (obj: any) {
		obj.find('a').unbind('click').on('click', function (e: any) {
			e.preventDefault();
			ipcRenderer.send('urlOpen', $(this).attr('href'));
		});
	};
	
	emailCheck (v: string) {
		return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(String(v || ''));
	};

	isNumber (s: string) {
		return String((Number(s) || 0) || '') === String(s || '');
	};

	coverSrc (cover: string) {
		return `./img/cover/${cover}.jpg`;
	};

	selectionRect () {
		const sel = window.getSelection();
		if (sel && (sel.rangeCount > 0)) {
			return sel.getRangeAt(0).getBoundingClientRect() as DOMRect;
		};
		return { x: 0, y: 0, width: 0, height: 0 };
	};

	uuid () {
		return uuidv4(); 
	};
	
};

export default new Util();