import React, { forwardRef, useRef, useEffect, } from 'react';

import raf from 'raf';
import { Button, Icon, Label } from 'Component';
import ReactCanvasConfetti from 'react-canvas-confetti';
import * as I from 'Interface';

const MenuOnboarding = forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {

	const { param, position, close, getId, getSize } = props;
	const { data, noClose, highlightElements } = param;
	const { key, current, onShow, isPopup } = data;
	const nodeRef = useRef(null);
	const videoRef = useRef(null);
	const frame = useRef(0);

	useEffect(() => {
		rebind();
		event();
		initDimmer();
		U.Dom.renderLinks(nodeRef.current);

		return () => {
			unbind();
			clearDimmer();
		};
	}, []);

	useEffect(() => {
		if (onShow) {
			onShow();
			position();
		};

		clearDimmer();
		initDimmer();
		scroll();
		event();

		U.Dom.renderLinks(nodeRef.current);
	});

	const getItems = () => {
		return getSection()?.items || [];
	};

	const initDimmer = () => {
		const section = getSection();
		const theme = S.Common.getThemeClass();

		if (!section) {
			return;
		};

		const { current } = data;
		const items = getItems();
		const item = items[current];
		const body = document.body;

		(item.markElements || []).forEach((selector: string) => {
			U.Dom.selectAll(selector).forEach((el: HTMLElement) => U.Dom.addClass(el, 'onboardingMarked'));
		});

		if (!section.showDimmer) {
			return;
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			highlightElements.forEach(selector => {
				U.Dom.selectAll(selector).forEach(el => {
					const clone = el.cloneNode(true) as HTMLElement;
					const rect = el.getBoundingClientRect();
					const st = window.scrollY;

					body.appendChild(clone);
					U.Dom.copyCss(el, clone);

					if (item.cloneElementClassName) {
						U.Dom.addClass(clone, item.cloneElementClassName);
					};

					if (theme == 'dark') {
						U.Dom.addClass(clone, 'onboardingElementDark');
					};

					U.Dom.addClass(clone, 'onboardingElement');
					U.Dom.css(clone, {
						position: 'fixed',
						top: `${rect.top}px`,
						left: `${rect.left}px`,
						zIndex: '1000',
					});
				});
			});
		});

		const dimmer = document.createElement('div');
		dimmer.className = 'onboardingDimmer';
		body.appendChild(dimmer);
	};

	const clearDimmer = () => {
		const section = getSection();

		U.Dom.selectAll('.onboardingMarked').forEach((el: HTMLElement) => U.Dom.removeClass(el, 'onboardingMarked'));

		if (!section.showDimmer) {
			return;
		};

		U.Dom.selectAll('.onboardingElement').forEach(el => el.remove());
		U.Dom.selectAll('.onboardingDimmer').forEach(el => el.remove());

		param.highlightElements.concat([ param.element as string ]).forEach(selector => {
			U.Dom.selectAll(selector).forEach(el => {
				U.Dom.css(el, { visibility: 'visible' });
			});
		});

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};
	};

	const onClose = () => {
		const section = getSection();
		const menuParam = Onboarding.getParam(section, {}, isPopup);

		close();
		menuParam.onClose?.();
		analytics.event('ClickOnboardingTooltip', { type: 'close', id: key, step: (current + 1) });
	};

	const keydownHandler = useRef<(e: any) => void>(() => {});

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
	};

	const event = () => {
		analytics.event('OnboardingTooltip', { step: (current + 1), id: key });
	};

	const scroll = () => {
		if (!param.element) {
			return;
		};

		const containerEl = U.Dom.getScrollContainer(isPopup);
		const top = containerEl?.scrollTop || 0;
		const element = typeof param.element === 'string' ? U.Dom.select(param.element) : param.element as HTMLElement;

		if (!element) {
			return;
		};

		const rect = U.Dom.getElementRect(element);
		const hh = J.Size.header;

		let containerOffset = { top: 0, left: 0 };
		if (containerEl) {
			const containerRect = containerEl.getBoundingClientRect();
			containerOffset = { top: containerRect.top, left: containerRect.left };
		};

		if (rect.y < 0) {
			rect.y -= rect.height + hh + containerOffset.top;
			if (containerEl) {
				containerEl.scrollTop = top + rect.y;
			};
		};
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('arrowleft, arrowright', e, pressed => onArrow(e, pressed == 'arrowleft' ? -1 : 1));
		keyboard.shortcut('enter', e, () => onArrow(e, 1));
	};

	const onButton = (e: any, item: any) => {
		const { action } = item;

		switch (action) {
			case 'next': {
				onArrow(e, 1);
				break;
			};

			case 'changeType': {
				S.Menu.open('typeSuggest', {
					element: `#${getId()}`,
					offsetX: getSize().width,
					vertical: I.MenuDirection.Center,
					data: {
						canAdd: true,
						filter: '',
						filters: [
							{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						],
						onClick: (item: any) => {
							const rootId = keyboard.getRootId();

							S.Detail.update(rootId, { id: item.id, details: item }, false);

							C.ObjectSetObjectType(rootId, item.uniqueKey, () => {
								U.Object.openAuto({ id: rootId, layout: item.recommendedLayout });
							});

							analytics.event('ChangeObjectType', { objectType: item.id, count: 1, route: analytics.route.menuOnboarding });

							close();
						},
					}
				});
				break;
			};

			case 'openUrl': {
				if (item.url) {
					Action.openUrl(item.url);
				};
				close();
				break;
			};
		};

		analytics.event('ClickOnboardingTooltip', { type: action, id: key, step: (current + 1) });
	};

	const onArrow = (e: any, dir: number) => {
		const { param } = props;
		const { data } = param;
		const { current } = data;
		const items = getItems();

		if ((dir < 0) && !current) {
			return;
		};

		if ((dir > 0) && (current == items.length - 1)) {
			onClose();
			return;
		};

		onClick(e, current + dir);
	};

	const onClick = (e: any, next: number) => {
		const { param } = props;
		const { data, onOpen, onClose } = param;
		const { isPopup, options } = data;
		const section = getSection();
		const items = getItems();
		const item = items[next];

		if (!item) {
			return;
		};

		let menuParam = Onboarding.getParam(section, item, isPopup);

		if (options.parseParam) {
			menuParam = options.parseParam(menuParam);
		};

		S.Menu.open('onboarding', {
			...menuParam,
			onOpen: () => {
				if (onOpen) {
					onOpen();
				};
				if (menuParam.onOpen) {
					menuParam.onOpen();
				};
			},
			onClose: () => {
				if (onClose) {
					onClose();
				};
				if (menuParam.onClose) {
					menuParam.onClose();
				};
			},
			data: {
				...data,
				...menuParam.data,
				current: next,
			},
		});
	};

	const onVideoClick = (e: any, src: string) => {
		U.Dom.pauseMedia();

		S.Popup.open('preview', { 
			preventMenuClose: true,
			onClose: () => {
				videoRef.current?.play().catch(() => {});
			},
			data: { 
				gallery: [ 
					{ src, type: I.FileType.Video },
				] 
			},
		});

		analytics.event('ScreenOnboardingVideo');
	};

	const setError = (error: { description: string, code: number}) => {
		if (!error.code) {
			return false;
		};

		S.Popup.open('confirm', {
			data: {
				title: translate('commonError'),
				text: error.description,
				textConfirm: translate('commonOk'),
				canCancel: false,
			},
		});

		return true;
	};

	const confettiShot = (instance: any) => {
		instance.confetti({ particleCount: 150, spread: 60, origin: { x: 0.5, y: 1 } });
	};

	const getSection = () => {
		return Onboarding.getSection(props.param.data.key) || {};
	};

	const section = getSection();
	const items = getItems();
	const { showConfetti, withCounter } = section;
	const item = items[current];
	if (!item) {
		return null;
	};

	const { name, description, video, img } = item;
	const l = items.length;

	let buttons = [];
	let category = '';

	if (item.category) {
		category = item.category;
	} else
	if (section.category) {
		category = section.category;
	};

	if (!item.noButton) {
		let buttonText = translate('commonNext');

		if (current == l - 1) {
			buttonText = translate('commonFinish');
		};

		if (item.buttonText) {
			buttonText = item.buttonText;
		};

		buttons.push({ text: buttonText, action: 'next' });
	};

	if (item.buttons) {
		buttons = buttons.concat(item.buttons);
	};

	buttons = buttons.filter(it => it);

	return (
		<div 
			ref={nodeRef}
			className="wrap"
		>
			{!noClose ? <Icon name="common/close" className="close" onClick={onClose} /> : ''}

			<div className="textWrapper">
				{withCounter ? <Label className="counter" text={U.String.sprintf(translate('menuOnboardingCounter'), current + 1, l)} /> : ''}
				{category ? <Label className="category" text={category} /> : ''}
				{name ? <Label className="name" text={name} /> : ''}
				{description ? <Label className="descr" text={description} /> : ''}
			</div>

			{video ? (
				<video 
					ref={videoRef} 
					src={video}
					onClick={e => onVideoClick(e, video)}
					controls={false} 
					autoPlay={true} 
					loop={true} 
				/>
			) : ''}

			{img ? (
				<div className="imgWrapper">
					<img src={img.src} alt="" onLoad={position} />
					{img.caption ? (
						<Label text={img.caption} />
					) : ''}
				</div>
			) : ''}

			<div className="bottom">
				{buttons.length ? (
					<div className="buttons">
						{buttons.map((button, i) => (
							<Button
								key={i}
								text={button.text}
								color={(i == 0) ? 'accent' : 'blank'}
								size={36}
								onClick={e => onButton(e, button)}
							/>
						))}
					</div>
				) : ''}
			</div>

			{showConfetti ? <ReactCanvasConfetti onInit={ins => confettiShot(ins)} className="confettiCanvas" /> : ''}
		</div>
	);

});

export default MenuOnboarding;