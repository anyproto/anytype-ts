import { I, Storage, UtilCommon } from 'Lib';
import * as Docs from 'Docs';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

class Onboarding {

	getSection (key: string) {
		return Docs.Help.Onboarding[key] ? Docs.Help.Onboarding[key]() : {};
	};
	
	start (key: string, isPopup: boolean, force?: boolean, options?: any) {
		options = options || {};

		const section = this.getSection(key);
		if (!section || !section.items || !section.items.length || (!force && Storage.getOnboarding(key))) {
			return;
		};

		const { items } = section;
		const t = isPopup ? Constant.delay.popup : 0;

		menuStore.close('onboarding', () => {
			window.setTimeout(() => {
				let param = this.getParam(section, items[0], isPopup, force);

				if (options.parseParam) {
					param = options.parseParam(param);
				};

				menuStore.open('onboarding', {
					...param,
					noAnimation: true,
					noFlipY: true,
					noFlipX: true,
					onClose: () => { 
						this.start(this.getReminderKey(key), isPopup, force);
						
						Storage.setOnboarding(key); 
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

	getReminderKey (key: string) {
		return UtilCommon.toCamelCase([ key, 'reminder' ].join('-'));
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
		param.offsetY = Number(param.offsetY) || 0;
		param.offsetX = Number(param.offsetX) || 0;
		param.withArrow = param.noArrow ? false : param.element ? true : false;
		param.className = String(param.className || '');
		param.classNameWrap = String(param.classNameWrap || '');
		param.rect = null;
		param.recalcRect = null;
		param.force = force;

		const cnw = [];
		if (param.classNameWrap) {
			cnw.push(param.classNameWrap);
		};
		if (isPopup) {
			cnw.push('fromPopup');
		};
		param.classNameWrap = cnw.join(' ');
		
		if (param.container) {
			param.containerVertical = Number(param.containerVertical) || I.MenuDirection.Top;
			param.containerHorizontal = Number(param.containerHorizontal) || I.MenuDirection.Left;

			const recalcRect = () => {
				const container = UtilCommon.getScrollContainer(isPopup);
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
	
};

export default new Onboarding();