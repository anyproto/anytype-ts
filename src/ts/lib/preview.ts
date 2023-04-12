import $ from 'jquery';
import raf from 'raf';
import { I, Util, keyboard } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

const BORDER = 12;
const DELAY_TOOLTIP = 650;

interface TooltipParam {
	text: string;
	element: JQuery<HTMLElement>;
	typeX: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	typeY: I.MenuDirection.Top | I.MenuDirection.Bottom;
	delay: number;
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

  /**
   * Displays a tooltip with the given text and position relative to the specified element.
   * @param text - The text to be displayed in the tooltip.
   * @param element - The element relative to which the tooltip should be positioned.
   * @param typeX - The horizontal direction in which the tooltip should be positioned.
   * @param typeY - The vertical direction in which the tooltip should be positioned.
   */
	tooltipShow (param: Partial<TooltipParam>) {
		const { element } = param;
		const typeX = Number(param.typeX) || I.MenuDirection.Center;
		const typeY = Number(param.typeY) || I.MenuDirection.Top;
		const delay = Number(param.delay) || DELAY_TOOLTIP;

		if (!element.length || keyboard.isResizing) {
			return;
		};

		const text = String(param.text || '').replace(/\\n/, '\n');

		this.delayTooltip = delay;

		window.clearTimeout(this.timeout.tooltip);
		this.timeout.tooltip = window.setTimeout(() => {
			const win = $(window);
			const obj = $('#tooltip');
			const { left, top } = element.offset();
			const st = win.scrollTop(); 
			const ew = element.outerWidth();
			const eh = element.outerHeight();
			const node = $('<div class="tooltip anim"><div class="txt"></div></div>');

			node.find('.txt').html(Util.lbBr(text));
			obj.html('').append(node);
			
			const ow = node.outerWidth();
			const oh = node.outerHeight();
			let x = left;
			let y = top;

			switch (typeX) {
				default:
				case I.MenuDirection.Center:
					x += ew / 2 - ow / 2;
					break;

				case I.MenuDirection.Left:
					break;

				case I.MenuDirection.Right:
					x += ow - ew;
					break;
			};

			switch (typeY) {
				default:
				case I.MenuDirection.Top:
					y -= oh + 6 + st;
					break;
				
				case I.MenuDirection.Bottom:
					y += eh + 6 - st;
					break;
			};
			
			x = Math.max(BORDER, x);
			x = Math.min(win.width() - ow - BORDER, x);

			node.css({ left: x, top: y }).addClass('show');

			window.clearTimeout(this.timeout.delay);

			this.timeout.delay = window.setTimeout(() => { this.delayTooltip = delay; }, 500);
			this.delayTooltip = 100;
		}, this.delayTooltip);
	};

	/**
	 * Hides the tooltip, if any is being shown.
	 * @param force - hides the tooltip immediately by also removing the animation class.
	 */
	tooltipHide (force: boolean) {
		const obj = $('.tooltip');

		if (force) {
			obj.removeClass('anim');
		};

		obj.removeClass('show');
		window.clearTimeout(this.timeout.tooltip);
		window.clearTimeout(this.timeout.delay);
	};

	/**
	 * Display a preview
	 */
	previewShow (param: I.Preview) {
		const { element } = param;
	
		if (!element.length || keyboard.isPreviewDisabled) {
			return;
		};
		
		const obj = $('#preview');
		
		element.off('mouseleave.link').on('mouseleave.link', () => window.clearTimeout(this.timeout.preview) );
		obj.off('mouseleave.link').on('mouseleave.link', () => this.previewHide(false) );
		
		this.previewHide(false);
		
		window.clearTimeout(this.timeout.preview);
		this.timeout.preview = window.setTimeout(() => commonStore.previewSet({ ...param, element }), 500);
	};

	/**
	 * Hides preview, if any is being shown.
	 * @param force - hide the preview immediately, without 250ms delay
	 */
	previewHide (force: boolean) {
		const obj = $('#preview');

		obj.css({ opacity: 0 });

		window.clearTimeout(this.timeout.preview);
		this.timeout.preview = window.setTimeout(() => {
			obj.hide();
			obj.removeClass('top bottom withImage');

			commonStore.previewClear();

			$('#graphPreview').remove();
		}, force ? 0 : 250);
	};

	/**
	 * Show a toast (an on-screen short lived notification)
	 * @param param 
	 */
	toastShow (param: I.Toast) {
		const setTimeout = () => {
			window.clearTimeout(this.timeout.toast);
			this.timeout.toast = window.setTimeout(() => { this.toastHide(false); }, Constant.delay.toast);
		};

		commonStore.toastSet(param);

		const obj = $('#toast');

		setTimeout();
		obj.off('mouseenter mouseleave');
		obj.on('mouseenter', () => { window.clearTimeout(this.timeout.toast); });
		obj.on('mouseleave', () => { setTimeout(); });
	};

	/**
	 * show hide any toast being shown
	 * @param force - hide the preview immediately, without 250ms delay
	 */
	toastHide (force: boolean) {
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
		const win = $(window);
		const obj = $('#toast');

		obj.show().css({ opacity: 0, transform: 'scale3d(0.7,0.7,1)' });

		raf(() => {
			obj.css({ 
				left: win.width() / 2 - obj.outerWidth() / 2, 
				top: win.height() - obj.outerHeight() - BORDER * 2,
				opacity: 1,
				transform: 'scale3d(1,1,1)',
			});
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