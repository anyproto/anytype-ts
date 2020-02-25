import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const raf = require('raf');
const $ = require('jquery');
const loadImage = window.require('blueimp-load-image');
const fs = window.require('fs');
const readChunk = window.require('read-chunk');
const fileType = window.require('file-type');
const EmojiData = require('emoji-mart/data/apple.json');
const Constant = require('json/constant.json');
const sprintf = window.require('sprintf-kit')({
	d: require('sprintf-kit/modifiers/d'),
	s: require('sprintf-kit/modifiers/s'),
	f: require('sprintf-kit/modifiers/f'),
});

class Util {
	
	icons: any[] = [];
	timeoutTooltip: number = 0;
	timeoutLinkPreview: number = 0;
	
	constructor () {
		this.icons = Object.keys(EmojiData.emojis);
	};
	
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
	
	objectCopy (o: any): any {
		return JSON.parse(JSON.stringify(o));
	};
	
	arrayValues (a: any) {
		let r: any[] = [];
		for (let k in a) {
			r.push(a[k]);
		};
		return r;
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
				e.clipboardData.setData('application/anytype', JSON.stringify(data.anytype));
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
	
	randomSmile (): string {
		return ':' + this.icons[this.rand(0, this.icons.length - 1)] + ':';
	};
	
	date (format: string, timestamp: number) {
		timestamp = Number(timestamp) || 0;
		let a, jsdate = new Date(timestamp ? timestamp * 1000 : null);
		let pad = (n: number, c: number) => {
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
		let f: any = {
			// Day
			d: () => {
			   return pad(f.j(), 2);
			},
			D: () => {
				let t = f.l(); return t.substr(0,3);
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
			}
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
			v = sprintf('%f Gb', this.round(g, 2));
		} else if (m > 1) {
			v = sprintf('%f Mb', this.round(m, 2));
		} else if (k > 1) {
			v = sprintf('%f Kb', this.round(k, 2));
		} else {
			v = sprintf('%d b', this.round(v, 0));
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
		if (!node.length) {
			return;
		};
		
		let win = $(window);
		let obj = $('#linkPreview');
		
		obj.unbind('mouseleave.link').on('mouseleave.link', (e: any) => {
			this.linkPreviewHide(false);
		});
		
		this.linkPreviewHide(false);
		
		window.clearTimeout(this.timeoutLinkPreview);
		this.timeoutLinkPreview = window.setTimeout(() => {
			commonStore.linkPreviewSet({
				url: url,
				element: node,
				...param,
			});
			
			let ww = win.width();
			let wh = win.height();
			let dh = $(document).height();
			let st = win.scrollTop();
			let offset = node.offset();
			let nw = node.outerWidth();
			let nh = node.outerHeight();
			let ow = obj.outerWidth();
			let oh = obj.outerHeight();
			let y = 0;
			let css: any = { opacity: 0, left: 0, top: 0 };
			let typeY = I.MenuDirection.Bottom;
			let poly = obj.find('.polygon');
			let ps = (1 - nw / ow) / 2 * 100;
			let pe = ps + nw / ow * 100;
			let oy = 4;
			let border = 12;
			
			console.log(offset);
			
			obj.removeClass('top bottom').addClass('active');
			poly.css({ top: 'auto', bottom: 'auto' });
			
			if (offset.top + oh + nh >= st + wh) {
				typeY = I.MenuDirection.Top;
			};
			
			if (typeY == I.MenuDirection.Top) {
				css.top = offset.top - oh - oy;
				obj.addClass('top');
				
				poly.css({ height: nh + oy, bottom: -nh - oy, clipPath: 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)' });
			};
			
			if (typeY == I.MenuDirection.Bottom) {
				css.top = offset.top + nh + oy;
				obj.addClass('bottom');
				
				poly.css({ height: nh, top: -nh, clipPath: 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)' });
			};
			
			css.left = offset.left - ow / 2 + nw / 2;
			css.left = Math.max(border, css.left);
			css.left = Math.min(ww - ow - border, css.left);
			
			obj.show().css(css).data({ dir: typeY });
			raf(() => {
				obj.css({ opacity: 1 });
			});
		}, 500);
	};
	
	linkPreviewHide (force: boolean) {
		window.clearTimeout(this.timeoutLinkPreview);
		
		let obj = $('#linkPreview');
		
		if (force) {
			obj.hide().removeClass('active');
			return;
		};
		
		obj.css({ opacity: 0 });
		this.timeoutLinkPreview = window.setTimeout(() => { obj.hide().removeClass('active'); }, 200);
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
	
	// Helper method to set active element in menu with keyboard and scroll to it
	menuSetActive (id: string, item: any, offset?: number, scroll?: boolean) {
		const menu = $('#' + this.toCamelCase('menu-' + id));
		if (!menu || !menu.length || !item) {
			return;
		};
		
		const el = menu.find('#item-' + item.id);
			
		menu.find('.item.active').removeClass('active');
		el.addClass('active');
		
		if (scroll) {
			const content = menu.find('.content');
			
			let top = content.scrollTop() + el.position().top - Number(offset) || 0;
			top = Math.max(0, top);
			menu.find('.content').scrollTop(top);
		};
	};
	
	urlFix (url: string): string {
		if (!url) {
			return '';
		};
		if (!url.match(/:\/\//)) {
			url = 'http://' + url;
		};
		return url;
	};
	
};

export default new Util();