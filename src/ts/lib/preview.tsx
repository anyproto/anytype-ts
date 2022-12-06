import { I, Util, keyboard } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

class Preview {

	timeoutToast: number = 0;
	timeoutTooltip: number = 0;
	timeoutPreviewShow: number = 0;
	timeoutPreviewHide: number = 0;
	isPreviewOpen: boolean = false;

	tooltipShow (text: string, node: any, typeX: I.MenuDirection, typeY: I.MenuDirection) {
		if (!node.length || keyboard.isResizing) {
			return;
		};

		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => {
			let win = $(window);
			let obj = $('#tooltip');
			let offset = node.offset();
			let st = win.scrollTop(); 
			let nw = node.outerWidth();
			let nh = node.outerHeight();

			text = text.toString().replace(/\\n/, '\n');
			
			obj.find('.txt').html(Util.lbBr(text));
			obj.show().css({ opacity: 0 });
			
			let ow = obj.outerWidth();
			let oh = obj.outerHeight();
			let x = 0;
			let y = 0;

			switch (typeX) {
				case I.MenuDirection.Left:
					x = offset.left;
					break;

				default:
				case I.MenuDirection.Center:
					x = offset.left - ow / 2 + nw / 2;
					break;

				case I.MenuDirection.Right:
					x = offset.left + ow - nw;
					break;
			};

			switch (typeY) {
				default:
				case I.MenuDirection.Top:
					y = offset.top - oh - 6 - st;
					break;
				
				case I.MenuDirection.Bottom:
					y = offset.top + nh + 6 - st;
					break;
			};
			
			x = Math.max(12, x);
			x = Math.min(win.width() - obj.outerWidth() - 12, x);

			obj.css({ left: x, top: y, opacity: 1 });
		}, 250);
	};

	tooltipHide (force: boolean) {
		let obj = $('#tooltip');

		obj.css({ opacity: 0 });
		window.clearTimeout(this.timeoutTooltip);
		this.timeoutTooltip = window.setTimeout(() => { obj.hide(); }, force ? 0 : Constant.delay.tooltip);
	};

	previewShow (node: any, param: any) {
		if (!node.length || keyboard.isPreviewDisabled) {
			return;
		};
		
		const obj = $('#preview');
		
		node.off('mouseleave.link').on('mouseleave.link', (e: any) => {
			window.clearTimeout(this.timeoutPreviewShow);
		});
		
		obj.off('mouseleave.link').on('mouseleave.link', (e: any) => {
			this.previewHide(false);
		});
		
		this.previewHide(false);
		
		window.clearTimeout(this.timeoutPreviewShow);
		this.timeoutPreviewShow = window.setTimeout(() => {
			this.isPreviewOpen = true;
			commonStore.previewSet({ ...param, element: node });
		}, 500);
	};

	previewHide (force: boolean) {
		this.isPreviewOpen = false;
		window.clearTimeout(this.timeoutPreviewShow);

		const obj = $('#preview');
		if (force) {
			obj.hide();
			return;
		};

		obj.css({ opacity: 0 });
		this.timeoutPreviewHide = window.setTimeout(() => { 
			obj.hide();
			obj.removeClass('top bottom withImage'); 

			commonStore.previewClear();
		}, 250);
	};

	toastShow (param: any) {
		const win = $(window);
		const obj = $('#toast');

		commonStore.toastSet(param);

		obj.show().css({ opacity: 0 });

		window.setTimeout(() => {
			let ow = obj.outerWidth();
			let oh = obj.outerHeight();
			let x = win.width() / 2 - ow / 2;
			let y = win.height() - oh - 24;

			obj.css({ left: x, top: y, opacity: 1 });
		}, 30);

		this.timeoutToast = window.setTimeout(this.toastHide, Constant.delay.toast);

		obj.off('mouseenter').on('mouseenter', (e: any) => {
			window.clearTimeout(this.timeoutToast);
		});

		obj.off('mouseleave').on('mouseleave', (e: any) => {
			this.timeoutToast = window.setTimeout(this.toastHide, Constant.delay.toast);
		});
	};

	toastHide (force: boolean) {
		window.clearTimeout(this.timeoutToast);

		const obj = $('#toast');

		if (force) {
			obj.hide();
			commonStore.toastClear();
			return;
		};

		obj.css({ opacity: 0 });
		this.timeoutToast = window.setTimeout(() => {
			obj.hide();
			commonStore.toastClear();
		}, 250);
	};

	hideAll () {
		this.tooltipHide(true);
		this.previewHide(true);
		this.toastHide(true);
	};

};

export default new Preview();