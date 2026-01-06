import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Icon, Label, ProgressBar } from 'Component';
import { I, C, S, U, J, Onboarding, analytics, keyboard, translate, Action } from 'Lib';
import ReactCanvasConfetti from 'react-canvas-confetti';

const MenuOnboarding = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {

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
		U.Common.renderLinks($(nodeRef.current));

		return () => {
			unbind();
			clearDimmer();
		};
	}, []);

	useEffect(() => {
		const items = getItems();
		const l = items.length;
		const node = $(nodeRef.current);
		
		if (onShow) {
			onShow();
			position();
		};

		clearDimmer();
		initDimmer();
		rebind();
		scroll();
		event();

		U.Common.renderLinks(node);
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
		const body = $('body');

		if (!section.showDimmer) {
			return;
		};

		if (!highlightElements.length) {
			highlightElements.push(param.element);
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			highlightElements.forEach(selector => {
				$(selector).each((idx, el) => {
					const element = $(el);
					const clone = element.clone();
					const { top, left } = element.offset();
					const st = $(window).scrollTop();

					body.append(clone);
					U.Common.copyCss(element.get(0), clone.get(0));

					if (item.cloneElementClassName) {
						clone.addClass(item.cloneElementClassName);
					};

					if (theme == 'dark') {
						clone.addClass('onboardingElementDark');
					};

					clone.addClass('onboardingElement').css({ position: 'fixed', top: top - st, left, zIndex: 1000 });
				});
			});
		});

		body.append('<div class="onboardingDimmer"></div>');
	};

	const clearDimmer = () => {
		const section = getSection();

		if (!section.showDimmer) {
			return;
		};

		$('.onboardingElement').remove();
		$('.onboardingDimmer').remove();

		param.highlightElements.concat([ param.element ]).forEach(selector => {
			$(selector).css({ visibility: 'visible' });
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

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const event = () => {
		analytics.event('OnboardingTooltip', { step: (current + 1), id: key });
	};

	const scroll = () => {
		if (!param.element) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const top = container.scrollTop();
		const element = $(param.element);

		if (!element.length) {
			return;
		};

		const rect = element.get(0).getBoundingClientRect() as DOMRect;
		const hh = J.Size.header;

		let containerOffset = { top: 0, left: 0 };
		if (container.length) {
			containerOffset = container.offset();
		};

		if (rect.y < 0) {
			rect.y -= rect.height + hh + containerOffset.top;
			container.scrollTop(top + rect.y);
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
		U.Common.pauseMedia();

		S.Popup.open('preview', { 
			preventMenuClose: true,
			onClose: () => {
				videoRef.current?.play();
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
	const withSteps = l > 1;
	const segments = [];

	if (withSteps) {
		segments.push({ name: '', caption: '', percent: (current + 1) / l, isActive: true });
	};

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
			{!noClose ? <Icon className="close" onClick={onClose} /> : ''}

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

			<div className={[ 'bottom', withSteps ? 'withSteps' : '' ].join(' ')}>
				{buttons.length ? (
					<div className="buttons">
						{buttons.map((button, i) => (
							<Button
								key={i}
								text={button.text}
								color={(i == 0) ? 'accent' : 'blank'}
								className="c36"
								onClick={e => onButton(e, button)}
							/>
						))}
					</div>
				) : ''}

				{withSteps ? (
					<ProgressBar segments={segments} complete={current == l - 1} />
				) : ''}
			</div>

			{showConfetti ? <ReactCanvasConfetti onInit={ins => confettiShot(ins)} className="confettiCanvas" /> : ''}
		</div>
	);

}));

export default MenuOnboarding;