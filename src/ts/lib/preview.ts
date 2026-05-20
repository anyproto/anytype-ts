import * as I from 'Interface';

const BORDER = 12;
const DELAY_TOOLTIP = 650;
const DELAY_PREVIEW = 300;

class Preview {

	timeout = {
		toast: 0,
		tooltip: 0,
		preview: 0,
		delay: 0,
	};
	delayTooltip = 0;
	isPreviewOpen = false;
	isTooltipOpen = false;

	private clickTooltipHandler: ((e: Event) => void) | null = null;

	tooltipShow (param: Partial<I.TooltipParam>) {
		const el = param.element instanceof HTMLElement ? param.element : null;
		const typeX = Number(param.typeX) || I.MenuDirection.Center;
		const typeY = Number(param.typeY) || I.MenuDirection.Top;
		const offsetX = Number(param.offsetX) || 0;
		const offsetY = Number(param.offsetY) || 0;

		let delay = DELAY_TOOLTIP;
		if (undefined !== param.delay) {
			delay = param.delay;
		};

		if (!el || keyboard.isResizing) {
			return;
		};

		let text = String(param.text || '').replace(/\\n/g, '\n');
		text = U.String.lbBr(U.String.sanitize(text));

		this.delayTooltip = Number(delay) || 0;

		window.clearTimeout(this.timeout.tooltip);
		this.timeout.tooltip = window.setTimeout(() => {
			const obj = U.Dom.get('tooltipContainer');
			if (!obj) {
				return;
			};

			const rect = el.getBoundingClientRect();
			const st = window.scrollY;
			const ew = el.offsetWidth;
			const eh = el.offsetHeight;
			const { ww } = U.Dom.getWindowDimensions();

			const node = document.createElement('div');
			node.className = 'tooltip anim';
			node.innerHTML = `<div class="txt">${text}</div>`;

			if (param.className) {
				U.Dom.addClass(node, param.className);
			};

			if (param.title) {
				const titleEl = document.createElement('div');
				titleEl.className = 'title';
				titleEl.innerHTML = param.title;
				node.prepend(titleEl);
			};

			obj.innerHTML = '';
			obj.appendChild(node);

			const ow = node.offsetWidth;
			const oh = node.offsetHeight;

			let x = rect.left + offsetX;
			let y = rect.top + st + offsetY;

			switch (typeX) {
				default:
				case I.MenuDirection.Left: {
					break;
				};

				case I.MenuDirection.Center: {
					x += ew / 2 - ow / 2;
					break;
				};

				case I.MenuDirection.Right: {
					x -= ow;
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

				case I.MenuDirection.Center: {
					y -= oh / 2 - eh / 2 + st;
					break;
				};
			};

			x = Math.max(BORDER, x);
			x = Math.min(ww - ow - BORDER, x);

			y = Math.max(BORDER, y);

			Object.assign(node.style, { left: `${x}px`, top: `${y}px` });
			U.Dom.addClass(node, 'show');

			window.clearTimeout(this.timeout.delay);
			this.timeout.delay = window.setTimeout(() => this.delayTooltip = delay, 500);
			this.delayTooltip = 100;

			if (this.clickTooltipHandler) {
				U.Dom.removeEvent(window, 'click', this.clickTooltipHandler);
			};

			this.clickTooltipHandler = () => {
				this.tooltipHide(true);
				U.Dom.removeEvent(window, 'click', this.clickTooltipHandler);
				this.clickTooltipHandler = null;
			};

			U.Dom.addEvent(window, 'click', this.clickTooltipHandler);

		}, this.delayTooltip);

		this.isTooltipOpen = true;
	};

	tooltipHide (force?: boolean) {
		if (!this.isTooltipOpen) {
			return;
		};

		const tooltips = U.Dom.selectAll('.tooltip');

		if (force) {
			tooltips.forEach(el => U.Dom.removeClass(el, 'anim'));
		};

		tooltips.forEach(el => U.Dom.removeClass(el, 'show'));

		window.clearTimeout(this.timeout.tooltip);
		window.clearTimeout(this.timeout.delay);

		this.isTooltipOpen = false;
	};

	tooltipCaption (text: string, caption: string): string {
		const t = [];
		if (text) {
			t.push(`<span class="common">${text}</span>`);
		};
		if (caption) {
			t.push(`<span class="caption">${caption}</span>`);
		};
		return t.length ? t.join(' ') : '';
	};

	previewShow (param: I.Preview) {
		if (
			keyboard.isPreviewDisabled ||
			keyboard.isResizing ||
			keyboard.isDragging
		) {
			window.clearTimeout(this.timeout.preview);
			return;
		};

		param.type = param.type || I.PreviewType.Default;
		param.delay = (undefined === param.delay) ? DELAY_PREVIEW : param.delay;

		const { rect, passThrough } = param;
		const el = param.element instanceof HTMLElement ? param.element : (typeof param.element === 'string' ? U.Dom.select(param.element) : null);
		const obj = U.Dom.get('preview');

		if (!el && !rect) {
			return;
		};

		if (rect) {
			param = Object.assign(param, rect);
		} else
		if (el) {
			const elRect = el.getBoundingClientRect();

			param = Object.assign(param, {
				x: elRect.left,
				y: elRect.top + window.scrollY,
				width: el.offsetWidth,
				height: el.offsetHeight,
			});
		};


		U.Dom.toggleClass(obj, 'passThrough', Boolean(passThrough));
		window.clearTimeout(this.timeout.preview);

		if (param.delay) {
			window.clearTimeout(this.timeout.preview);
			this.timeout.preview = window.setTimeout(() => S.Common.previewSet(param), param.delay);
		} else {
			S.Common.previewSet(param);
		};

		this.isPreviewOpen = true;
	};

	previewCancelHide () {
		window.clearTimeout(this.timeout.preview);
		this.isPreviewOpen = true;
	};

	previewHide (force?: boolean) {
		if (!this.isPreviewOpen) {
			return;
		};

		const obj = U.Dom.get('preview');
		const cb = () => {
			if (obj) {
				U.Dom.css(obj, { display: 'none' });
				U.Dom.removeClass(obj, 'anim', 'top', 'bottom', 'withImage');
				U.Dom.css(obj, { transform: '' });
			};

			S.Common.previewClear();
		};

		window.clearTimeout(this.timeout.preview);

		if (force) {
			cb();
		} else {
			if (obj) {
				U.Dom.css(obj, { opacity: '0', transform: 'translateY(0%)' });
			};
			this.timeout.preview = window.setTimeout(() => cb(), DELAY_PREVIEW);
		};

		this.isPreviewOpen = false;
	};

	toastShow (param: I.Toast) {
		S.Common.toastSet(param);
		this.toastStartHideTimer();
	};

	toastStartHideTimer () {
		window.clearTimeout(this.timeout.toast);
		this.timeout.toast = window.setTimeout(() => this.toastHide(false), J.Constant.delay.toast);
	};

	toastPauseHide () {
		window.clearTimeout(this.timeout.toast);
	};

	toastResumeHide () {
		this.toastStartHideTimer();
	};

	toastHide (force?: boolean) {
		const obj = U.Dom.get('toast');

		if (obj) {
			U.Dom.css(obj, { opacity: '0', transform: 'scale3d(0.7,0.7,1)' });
		};

		window.clearTimeout(this.timeout.toast);
		this.timeout.toast = window.setTimeout(() => {
			if (obj) {
				U.Dom.css(obj, { display: 'none' });
			};
			S.Common.toastClear();
		}, force ? 0 : 250);
	};

	hideAll () {
		this.tooltipHide(true);
		this.previewHide(true);
	};

};

export default new Preview();
