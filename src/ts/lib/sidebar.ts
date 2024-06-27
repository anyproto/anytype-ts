import $ from 'jquery';
import { I, U, J, Storage } from 'Lib';

interface SidebarData {
	width: number;
	isClosed: boolean;
};

const ANIMATION = 200;

class Sidebar {
	
	data: SidebarData = {
		width: 0,
		isClosed: false,
	};
	obj: JQuery<HTMLElement> = null;
	page: JQuery<HTMLElement> = null;
	header: JQuery<HTMLElement> = null;
	footer: JQuery<HTMLElement> = null;
	loader: JQuery<HTMLElement> = null;
	dummy: JQuery<HTMLElement> = null;
	vault: JQuery<HTMLElement> = null;
	isAnimating = false;
	timeoutHide = 0;
	timeoutAnim = 0;

	init () {
		this.initObjects();

		const stored = Storage.get('sidebar');
		if (stored) {
			if ('undefined' == typeof(stored.isClosed)) {
				stored.isClosed = !stored.width;
			};

			this.set(stored);
		} else {
			this.set({
				width: J.Size.sidebar.width.default,
				isClosed: false,
			});

			this.resizePage();
		};
	};

	initObjects () {
		this.obj = $('#sidebar');
		this.page = $('#page.isFull');
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.dummy = $('#sidebarDummy');
		this.vault = $('#vault');
	};

	close (): void {
		if (!this.obj || !this.obj.length || this.isAnimating) {
			return;
		};

		this.setAnimating(true);
		this.obj.addClass('anim');
		this.setStyle({ width: 0 });
		this.set({ isClosed: true });
		this.removeAnimation(() => $(window).trigger('resize'));
	};

	open (width?: number): void {
		if (!this.obj || !this.obj.length || this.isAnimating) {
			return;
		};

		this.setAnimating(true);
		this.obj.addClass('anim');
		this.setStyle({ width });
		this.set({ isClosed: false });
		this.removeAnimation(() => $(window).trigger('resize'));
	};

	toggleOpenClose () {
		if (!this.isAnimating) {
			this.data.isClosed ? this.open(this.data.width) : this.close();
		};
	};

	private removeAnimation (callBack?: () => void): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.obj.removeClass('anim');
			this.setAnimating(false);

			if (callBack) {
				callBack();
			};
		}, ANIMATION);
	};

	resizePage () {
		this.initObjects();

		let width = 0;
		if (this.obj && this.obj.length) {
			if (this.obj.css('display') != 'none') {
				width = this.obj.outerWidth();
			};
		};

		const { ww } = U.Common.getWindowDimensions();
		const vw = this.vault.hasClass('isExpanded') ? 0 : 92;
		const pageWidth = ww - width;
		const css: any = { width: '' };

		this.header.css(css).removeClass('withSidebar');
		this.footer.css(css);
		this.dummy.css({ width: width + vw });

		css.width = this.header.outerWidth() - width - vw;

		if (width) {
			this.header.addClass('withSidebar');
		};

		this.page.css({ width: pageWidth });
		this.loader.css({ width: pageWidth, right: 0 });
		this.header.css(css);
		this.footer.css(css);

		$(window).trigger('sidebarResize');
	};

	private save (): void {
		Storage.set('sidebar', this.data);
	};

	set (v: Partial<SidebarData>, force?: boolean): void {
		v = Object.assign(this.data, v);

		let { width } = v;

		if (!force) {
			width = this.limitWidth(width);
		};

		this.data = Object.assign<SidebarData, Partial<SidebarData>>(this.data, { width });

		this.save();
		this.resizePage();
		this.setStyle(this.data);
	};

	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	private setStyle (v: Partial<SidebarData>): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { width, isClosed } = v;
		const css: any = { width };

		if (isClosed) {
			css.width = 0;
		};

		this.obj.css(css);
	};

	/**
	 * Limit the sidebar width to the max and min bounds
	 */
	private limitWidth (width: number): number {
		const { min, max } = J.Size.sidebar.width;
		return Math.max(min, Math.min(max, Number(width) || 0));
	};

};

export const sidebar: Sidebar = new Sidebar();