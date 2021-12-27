import { Storage, Docs, Util } from 'ts/lib';
import { menuStore } from 'ts/store';
import { I } from '.';

const Constant = require('json/constant.json');

class Onboarding {
	
	start (key: string, isPopup: boolean, force?: boolean) {
		const items = Docs.Help.Onboarding[key];
		if (!items || !items.length/* || (!force && Storage.getOnboarding(key))*/) {
			return;
		};

		const t = isPopup ? Constant.delay.popup : 0;

		menuStore.close('onboarding', () => {
			window.setTimeout(() => {
				menuStore.open('onboarding', {
					...this.getParam(items[0], isPopup),
					noAnimation: true,
					noFlipY: true,
					noFlipX: true,
					//onClose: () => { Storage.setOnboarding(key); },
					data: {
						key,
						current: 0,
						isPopup: isPopup,
					},
				});
			}, t);
		});
	};

	getParam (item: any, isPopup: boolean): any {
		let param: any = {};
		if (item.param.common) {
			param = Object.assign(param, item.param.common);
			if (item.param.page) {
				param = Object.assign(param, item.param.page);
			} else 
			if (item.param.popup) {
				param = Object.assign(param, item.param.popup);
			};
		} else {
			param = item.param;
		};

		param.element = param.element || '';
		param.vertical = Number(param.vertical) || I.MenuDirection.Bottom;
		param.horizontal = Number(param.horizontal) || I.MenuDirection.Left;
		param.offsetY = Number(param.offsetY) || 0;
		param.offsetX = Number(param.offsetX) || 0;
		param.withArrow = param.element ? true : false;
		
		if (param.container) {
			param.containerVertical = Number(param.containerVertical) || I.MenuDirection.Top;
			param.containerHorizontal = Number(param.containerHorizontal) || I.MenuDirection.Left;

			const recalcRect = () => {
				const container = Util.getScrollContainer(isPopup);
				const height = container.height();
				const width = container.width();
				const scrollTop = $(window).scrollTop();

				let offset = { left: 0, top: 0 };
				let rect: any = { x: 0, y: 0, width: 0, height: 0 };
	
				if (isPopup) {
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

				return { ...rect, y: rect.y + scrollTop };
			};
			
			param.recalcRect = recalcRect;
			param.element = null;
		};

		return param;
	};
	
};

export default new Onboarding();