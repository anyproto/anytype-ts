import $ from 'jquery';
import raf from 'raf';
import { I, UtilCommon, keyboard } from 'Lib';
import { commonStore } from 'Store';
const Constant = require('json/constant.json');

const BORDER = 12;
const DELAY_TOOLTIP = 650;
const DELAY_PREVIEW = 300;

interface TooltipParam {
	text: string;
	element: JQuery<HTMLElement>;
	typeX: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	typeY: I.MenuDirection.Top | I.MenuDirection.Bottom;
	delay: number;
	className?: string;
	title?: string;
};

/**
 * Preview class for handling tooltips, previews, and toasts.
 */

class Preview {

	timeout = {
		toast: 0,
		tooltip: 0,
		preview: 0,
		delay: 0,
	};
	delayTooltip = 0;
	isPreviewOpen = false;

  /**
   * Displays a tooltip with the given text and position relative to the specified element.
   * @param text - The text to be displayed in the tooltip.
   * @param element - The element relative to which the tooltip should be positioned.
   * @param typeX - The horizontal direction in which the tooltip should be positioned.
   * @param typeY - The vertical direction in which the tooltip should be positioned.
   * @param delay - The length of time to wait before showing the tooltip.
   * @param className - custom class name to be added to tooltip element.
   */
	tooltipShow (param: Partial<TooltipParam>) {
		const { element } = param;
		const typeX = Number(param.typeX) || I.MenuDirection.Center;
		const typeY = Number(param.typeY) || I.MenuDirection.Top;
		const delay = Number(param.delay) || DELAY_TOOLTIP;
		const text = String(param.text || '').replace(/\\n/g, '\n');

		if (!element.length || keyboard.isResizing) {
			return;
		};

		this.delayTooltip = delay;

		window.clearTimeout(this.timeout.tooltip);
		this.timeout.tooltip = window.setTimeout(() => {
			const win = $(window);
			const obj = $('#tooltipContainer');
			const { left, top } = element.offset();
			const st = win.scrollTop(); 
			const ew = element.outerWidth();
			const eh = element.outerHeight();
			const { ww } = UtilCommon.getWindowDimensions();
			const node = $('<div class="tooltip anim"><div class="txt"></div></div>');

			if (param.className) {
				node.addClass(param.className);
			};

			if (param.title) {
				node.prepend('<div class="title"></div>');
				node.find('.title').html(param.title);
			};

			node.find('.txt').html(UtilCommon.lbBr(text));
			obj.html('').append(node);
			
			const ow = node.outerWidth();
			const oh = node.outerHeight();

			let x = left;
			let y = top;

			switch (typeX) {
				default:
				case I.MenuDirection.Center: {
					x += ew / 2 - ow / 2;
					break;
				};

				case I.MenuDirection.Left: {
					break;
				};

				case I.MenuDirection.Right: {
					x += ow - ew;
					break;
				};
			};

			switch (typeY) {
				default:
				case I.MenuDirection.Top: {
					y -= oh + 6 + st;
					break;
				};
				
				case I.MenuDirection.Bottom: {
					y += eh + 6 - st;
					break;
				};
			};
			
			x = Math.max(BORDER, x);
			x = Math.min(ww - ow - BORDER, x);

			node.css({ left: x, top: y }).addClass('show');

			window.clearTimeout(this.timeout.delay);
			this.timeout.delay = window.setTimeout(() => this.delayTooltip = delay, 500);
			this.delayTooltip = 100;
		}, this.delayTooltip);
	};

	/**
	 * Hides the tooltip, if any is being shown.
	 * @param force - hides the tooltip immediately by also removing the animation class.
	 */
	tooltipHide (force?: boolean) {
		const obj = $('.tooltip');

		if (force) {
			obj.removeClass('anim');
		};

		obj.removeClass('show');

		window.clearTimeout(this.timeout.tooltip);
		window.clearTimeout(this.timeout.delay);
	};

	tooltipCaption (text: string, caption: string): string {
		const t = [];
		if (text) {
			t.push(text);
		};
		if (caption) {
			t.push(`<span class="caption">${caption}</span>`);
		};
		return t.length ? t.join(' ') : '';
	};

	/**
	 * Display a preview
	 */
	previewShow (param: I.Preview) {
		if (keyboard.isPreviewDisabled) {
			return;
		};

		param.type = param.type || I.PreviewType.Default;
		param.delay = (undefined === param.delay) ? DELAY_PREVIEW : param.delay;
		
		const { element, rect, passThrough } = param;
		const obj = $('#preview');

		if (!element && !rect) {
			return;
		};
		
		if (element) {
			element.off('mouseleave.preview').on('mouseleave.preview', () => {
				window.clearTimeout(this.timeout.preview); 
				if (rect) {
					this.previewHide(true);
				};
			});
		};

		passThrough ? obj.addClass('passThrough') : obj.removeClass('passThrough');
		obj.off('mouseleave.preview').on('mouseleave.preview', () => this.previewHide(true));

		this.previewHide(true);

		if (param.delay) {
			window.clearTimeout(this.timeout.preview);
			this.timeout.preview = window.setTimeout(() => commonStore.previewSet(param), param.delay);
		} else {
			commonStore.previewSet(param);
		};

		this.isPreviewOpen = true;
	};

	/**
	 * Hides preview, if any is being shown.
	 * @param force - hide the preview immediately, without 250ms delay
	 */
	previewHide (force?: boolean) {
		if (!this.isPreviewOpen) {
			return;
		};

		const obj = $('#preview');
		const cb = () => {
			obj.hide();
			obj.removeClass('anim top bottom withImage').css({ transform: '' });

			commonStore.previewClear();
			$('#graphPreview').remove();
		};

		window.clearTimeout(this.timeout.preview);

		if (force) {
			cb();
		} else {
			obj.css({ opacity: 0, transform: 'translateY(0%)' });
			this.timeout.preview = window.setTimeout(() => cb(), DELAY_PREVIEW);
		};

		this.isPreviewOpen = false;
	};

	/**
	 * Show a toast (an on-screen short lived notification)
	 * @param param 
	 */
	toastShow (param: I.Toast) {
		const setTimeout = () => {
			window.clearTimeout(this.timeout.toast);
			this.timeout.toast = window.setTimeout(() => this.toastHide(false), Constant.delay.toast);
		};

		commonStore.toastSet(param);

		const obj = $('#toast');

		setTimeout();
		obj.off('mouseenter.toast mouseleave.toast');
		obj.on('mouseenter.toast', () => window.clearTimeout(this.timeout.toast));
		obj.on('mouseleave.toast', () => setTimeout());
	};

	/**
	 * show hide any toast being shown
	 * @param force - hide the preview immediately, without 250ms delay
	 */
	toastHide (force?: boolean) {
		const obj = $('#toast');

		obj.css({ opacity: 0, transform: 'scale3d(0.7,0.7,1)' });

		window.clearTimeout(this.timeout.toast);
		this.timeout.toast = window.setTimeout(() => {
			obj.hide();
			commonStore.toastClear();
		}, force ? 0 : 250);
	};

	/**
	 * This method is used by toast to position itself on the screen
	 */
	toastPosition () {
		const obj = $('#toast');
		const sidebar = $('#sidebar');
		const isRight = sidebar.hasClass('right');
		const { ww } = UtilCommon.getWindowDimensions();
		const y = 32;

		let sw = 0;
		if (commonStore.isSidebarFixed && sidebar.hasClass('active')) {
			sw = sidebar.outerWidth();
		};

		let x = (ww - sw) / 2 - obj.outerWidth() / 2;
		if (!isRight) {
			x += sw;
		};

		obj.show().css({ opacity: 0, transform: 'scale3d(0.7,0.7,1)' });

		raf(() => {
			obj.css({ left: x, top: y, opacity: 1, transform: 'scale3d(1,1,1)' });
		});
	};

	/**
	 * Force hides all tooltips, previews, and toasts.
	 */
	hideAll () {
		this.tooltipHide(true);
		this.previewHide(true);
		this.toastHide(true);
	};

};

export default new Preview();
