import $ from 'jquery';
import { U, S, J, Storage, keyboard } from 'Lib';

interface SidebarData {
	width: number;
	isClosed: boolean;
};

const ANIMATION = 250;

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

			this.resizePage(J.Size.sidebar.width.default, false);
		};
	};

	initObjects () {
		this.obj = $('#sidebar');
		this.page = $('#page.isFull');
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.dummy = $('#sidebarDummy');
	};

	close (): void {
		if (!this.obj || !this.obj.length || this.isAnimating) {
			return;
		};

		this.setAnimating(true);
		this.obj.addClass('anim');
		this.setStyle({ width: 0 });
		this.set({ isClosed: true });
		this.resizePage(0, true);

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
		this.resizePage(width, true);
		this.removeAnimation(() => $(window).trigger('resize'));
	};

	toggleOpenClose () {
		if (this.isAnimating) {
			return;
		};
		
		const width = this.data.width - J.Size.vault.width;

		this.obj.find('#sidebarHead').css({ width });
		this.obj.find('#sidebarBody').css({ width });
		this.data.isClosed ? this.open(this.data.width) : this.close();
	};

	setWidth (w: number): void {
		w = this.limitWidth(w);

		this.set({ width: w, isClosed: false });
		this.resizePage(w, false);
	};

	private removeAnimation (callBack?: () => void): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.obj.removeClass('anim');
			this.obj.find('#sidebarHead').css({ width: '' });
			this.obj.find('#sidebarBody').css({ width: '' });
			this.setAnimating(false);

			if (callBack) {
				callBack();
			};
		}, ANIMATION);
	};

	resizePage (width: number, animate: boolean): void {
		console.log('resizePage', width, animate);

		this.initObjects();

		if ((width === null) && this.obj && this.obj.length) {
			if (this.obj.css('display') != 'none') {
				width = this.obj.outerWidth();
			};
		};

		console.log('resizePage2', width);

		const { ww } = U.Common.getWindowDimensions();
		const pageWidth = ww - width;
		const ho = keyboard.isMainHistory() ? J.Size.history.panel : 0;
		const navigation = S.Common.getRef('navigation');

		this.header.css({ width: '' }).removeClass('withSidebar');
		this.footer.css({ width: '' });
		this.dummy.css({ width });

		if (animate) {
			this.header.addClass('sidebarAnimation');
			this.page.addClass('sidebarAnimation');
			this.footer.addClass('sidebarAnimation');
			this.dummy.addClass('sidebarAnimation');
		} else {
			this.header.removeClass('sidebarAnimation');
			this.page.removeClass('sidebarAnimation');
			this.footer.removeClass('sidebarAnimation');
			this.dummy.removeClass('sidebarAnimation');
		};

		navigation?.setX(width, animate);
		width ? this.header.addClass('withSidebar') : this.header.removeClass('withSidebar');

		this.page.css({ width: pageWidth });
		this.loader.css({ width: pageWidth, right: 0 });
		this.header.css({ width: pageWidth - ho });
		this.footer.css({ width: pageWidth - ho });

		$(window).trigger('sidebarResize');
	};

	private save (): void {
		Storage.set('sidebar', this.data);
	};

	set (v: Partial<SidebarData>): void {
		v = Object.assign(this.data, v);

		const { width } = v;

		this.data = Object.assign<SidebarData, Partial<SidebarData>>(this.data, { 
			width: this.limitWidth(width),
		});

		this.save();
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

	getDummyWidth (): number {
		return Number($('#sidebarDummy').outerWidth()) || 0;
	};

};

export const sidebar: Sidebar = new Sidebar();