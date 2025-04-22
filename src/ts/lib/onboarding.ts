import * as Docs from 'Docs';
import { I, S, U, Storage } from 'Lib';

class Onboarding {

	getSection (key: string) {
		return Docs.Help.Onboarding[key] ? Docs.Help.Onboarding[key]() : {};
	};
	
	start (key: string, isPopup: boolean, force?: boolean, options?: any) {
		options = options || {};

		const section = this.getSection(key);
		if (!section || !section.items || !section.items.length || (!force && Storage.getOnboarding(key)) || !Storage.get('primitivesOnboarding')) {
			return;
		};

		const { items } = section;
		const t = isPopup ? S.Popup.getTimeout() : 0;

		S.Menu.close('onboarding', () => {
			window.setTimeout(() => {
				let param = this.getParam(section, items[0], isPopup, force);

				if (options.parseParam) {
					param = options.parseParam(param);
				};

				S.Menu.open('onboarding', {
					...param,
					noAnimation: true,
					noFlipY: true,
					noFlipX: true,
					onClose: () => { 
						Storage.setOnboarding(key);

						if (section.onComplete) {
							section.onComplete(force);
						};
					},
					data: {
						...param.data,
						options,
						key,
						current: 0,
						isPopup,
					},
				});
			}, t);
		});
	};

	getParam (section: any, item: any, isPopup: boolean, force?: boolean): any {
		section.param = section.param || {};
		item.param = item.param || {};

		let param: any = {};

		param = Object.assign(param, section.param);

		if (item.param.common) {
			param = Object.assign(param, item.param.common);
			if (item.param.page) {
				param = Object.assign(param, item.param.page);
			} else 
			if (item.param.popup) {
				param = Object.assign(param, item.param.popup);
			};
		} else {
			param = Object.assign(param, item.param);
		};

		param.element = String(param.element || '');
		param.vertical = Number(param.vertical) || I.MenuDirection.Bottom;
		param.horizontal = Number(param.horizontal) || I.MenuDirection.Left;
		param.withArrow = param.noArrow ? false : param.element ? true : false;
		param.className = String(param.className || '');
		param.classNameWrap = String(param.classNameWrap || '');
		param.rect = null;
		param.recalcRect = null;
		param.force = force;
		param.noAutoHover = true;
		param.highlightElements = param.highlightElements || [];
		param.hiddenElements = param.hiddenElements || [];

		if ('function' != typeof(param.offsetX)) {
			param.offsetX = Number(param.offsetX) || 0;
		};
		if ('function' != typeof(param.offsetY)) {
			param.offsetY = Number(param.offsetY) || 0;
		};

		const cnw = [];
		if (param.classNameWrap) {
			cnw.push(param.classNameWrap);
		};
		if (isPopup) {
			cnw.push('fromPopup');
		};
		if (section.showDimmer) {
			cnw.push('fromOnboarding');
		};
		param.classNameWrap = cnw.join(' ');

		if (param.container) {
			param.containerVertical = Number(param.containerVertical) || I.MenuDirection.Top;
			param.containerHorizontal = Number(param.containerHorizontal) || I.MenuDirection.Left;

			const recalcRect = () => {
				const container = U.Common.getScrollContainer(isPopup);
				const height = container.height();
				const width = container.width();
				const scrollTop = $(window).scrollTop();

				let offset = { left: 0, top: 0 };
				let rect: any = { x: 0, y: 0, width: 0, height: 0 };
	
				if (isPopup && container.length) {
					offset = container.offset();
				};
	
				switch (param.containerVertical) {
					case I.MenuDirection.Top:
						rect = { x: offset.left, y: offset.top, width: width, height: 0 };
						break;
	
					case I.MenuDirection.Center:
						rect = { x: offset.left, y: offset.top + height / 2, width: width, height: 0 };
						break;
	
					case I.MenuDirection.Bottom:
						rect = { x: offset.left, y: offset.top + height, width: width, height: 0 };
						break;
				};

				if (!isPopup) {
					rect.y += scrollTop;
				};

				return { ...rect };
			};
			
			param.recalcRect = recalcRect;
			param.element = null;
		};

		return param;
	};

	isCompleted (key: string): boolean {
		return Storage.getOnboarding(key);
	};
	
};

export default new Onboarding();
