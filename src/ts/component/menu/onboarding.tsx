import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Icon, Label, ProgressBar } from 'Component';
import { I, C, S, U, J, Onboarding, analytics, keyboard, translate } from 'Lib';
import ReactCanvasConfetti from 'react-canvas-confetti';

interface State {
	error: { description: string, code: number };
};

const MenuOnboarding = observer(class MenuOnboarding extends React.Component<I.Menu, State> {

	node: any = null;
	video: any = null;
	state = {
		error: null,
	};
	frame = 0;

	constructor (props: I.Menu) {
		super(props);

		this.onClose = this.onClose.bind(this);
		this.setError = this.setError.bind(this);
	};

	render () {
		const { param, position } = this.props;
		const { data, noClose } = param;
		const { key, current } = data;
		const section = this.getSection();
		const items = this.getItems();
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

			if (section.canSkip) {
				buttons.push({ text: translate('commonSkip'), action: 'close' });
			};
		};

		if (item.buttons) {
			buttons = buttons.concat(item.buttons);
		};

		buttons = buttons.filter(it => it);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{!noClose ? <Icon className="close" onClick={this.onClose} /> : ''}

				<div className="textWrapper">
					{withCounter ? <Label className="counter" text={U.Common.sprintf(translate('menuOnboardingCounter'), current + 1, l)} /> : ''}
					{category ? <Label className="category" text={category} /> : ''}
					{name ? <Label className="name" text={name} /> : ''}
					{description ? <Label className="descr" text={description} /> : ''}
				</div>

				{video ? (
					<video 
						ref={node => this.video = node} 
						src={video}
						onClick={e => this.onVideoClick(e, video)}
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
									onClick={e => this.onButton(e, button.action)}
								/>
							))}
						</div>
					) : ''}

					{withSteps ? (
						<ProgressBar segments={segments} complete={current == l - 1} />
					) : ''}
				</div>

				{showConfetti ? <ReactCanvasConfetti onInit={ins => this.confettiShot(ins)} className="confettiCanvas" /> : ''}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.event();
		this.initDimmer();

		U.Common.renderLinks($(this.node));
	};

	componentDidUpdate () {
		const { param, position } = this.props;
		const { data } = param;
		const section = this.getSection();
		const { items } = section;
		const l = items.length;
		const node = $(this.node);
		
		if (data.onShow) {
			data.onShow();
			position();
		};

		this.clearDimmer();
		this.initDimmer();
		this.rebind();
		this.scroll();
		this.event();

		U.Common.renderLinks(node);
	};

	componentWillUnmount(): void {
		this.unbind();
		this.clearDimmer();
	};

	getItems () {
		return this.getSection()?.items || [];
	};

	initDimmer () {
		const { param } = this.props;
		const { data, highlightElements } = param;
		const section = this.getSection();
		const theme = S.Common.getThemeClass();

		if (!section) {
			return;
		};

		const { current } = data;
		const items = this.getItems();
		const item = items[current];
		const body = $('body');

		if (!section.showDimmer) {
			return;
		};

		if (!highlightElements.length) {
			highlightElements.push(param.element);
		};

		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};

		this.frame = raf(() => {
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

	clearDimmer () {
		const { param } = this.props;
		const section = this.getSection();

		if (!section.showDimmer) {
			return;
		};

		$('.onboardingElement').remove();
		$('.onboardingDimmer').remove();

		param.highlightElements.concat([ param.element ]).forEach(selector => {
			$(selector).css({ visibility: 'visible' });
		});

		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};
	};

	onClose () {
		const { param, close } = this.props;
		const { data } = param;
		const { key, current, isPopup } = data;
		const section = this.getSection();
		const menuParam = Onboarding.getParam(section, {}, isPopup);

		close();

		if (menuParam.onClose) {
			menuParam.onClose();
		};

		analytics.event('ClickOnboardingTooltip', { type: 'close', id: key, step: (current + 1) });
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	event () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;

		analytics.event('OnboardingTooltip', { step: (current + 1), id: key });
	};

	scroll () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

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

	onKeyDown (e: any) {
		keyboard.shortcut('arrowleft, arrowright', e, pressed => this.onArrow(e, pressed == 'arrowleft' ? -1 : 1));

		keyboard.shortcut('enter', e, () => this.onArrow(e, 1));
	};

	onButton (e: any, action: string) {
		const { param, close, getId, getSize } = this.props;
		const { data } = param;
		const { key, current } = data;

		switch (action) {
			case 'close': {
				this.onClose();
				break;
			};

			case 'next': {
				this.onArrow(e, 1);
				break;
			};

			case 'changeType':
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

		analytics.event('ClickOnboardingTooltip', { type: action, id: key, step: (current + 1) });
	};

	onArrow (e: any, dir: number) {
		const { param } = this.props;
		const { data } = param;
		const { current } = data;
		const items = this.getItems();

		if ((dir < 0) && !current) {
			return;
		};

		if ((dir > 0) && (current == items.length - 1)) {
			this.onClose();
			return;
		};

		this.onClick(e, current + dir);
	};

	onClick (e: any, next: number) {
		const { param } = this.props;
		const { data, onOpen, onClose } = param;
		const { isPopup, options } = data;
		const section = this.getSection();
		const items = this.getItems();
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

	onVideoClick (e: any, src: string) {
		U.Common.pauseMedia();

		S.Popup.open('preview', { 
			preventMenuClose: true,
			onClose: () => {
				if (this.video) {
					this.video.play();
				};
			},
			data: { 
				gallery: [ 
					{ src, type: I.FileType.Video },
				] 
			},
		});

		analytics.event('ScreenOnboardingVideo');
	};

	setError (error: { description: string, code: number}) {
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

	confettiShot (instance: any) {
		instance.confetti({ particleCount: 150, spread: 60, origin: { x: 0.5, y: 1 } });
	};

	getSection () {
		return Onboarding.getSection(this.props.param.data.key) || {};
	};

});

export default MenuOnboarding;
