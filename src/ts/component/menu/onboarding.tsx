import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Icon, Label, EmailCollection } from 'Component';
import { I, C, S, U, J, Onboarding, analytics, keyboard, translate } from 'Lib';
import ReactCanvasConfetti from 'react-canvas-confetti';

interface State {
	error: { description: string, code: number };
};

const MenuOnboarding = observer(class MenuSelect extends React.Component<I.Menu, State> {

	node: any = null;
	confetti: any = null;
	video: any = null;
	state = {
		error: null,
	};
	frame = 0;
	hiddenElement: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onClose = this.onClose.bind(this);
		this.setError = this.setError.bind(this);
	};

	render () {
		const { param, position, close } = this.props;
		const { data, noClose } = param;
		const { key, current } = data;
		const section = Onboarding.getSection(key);
		const { items, showConfetti } = section;
		const item = items[current];
		const l = items.length;
		const withSteps = l > 1;
		const withEmailForm = key == 'emailCollection';

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
				ref={node => this.node = node}
				className="wrap"
			>
				{!noClose ? <Icon className="close" onClick={this.onClose} /> : ''}

				{category ? <Label className="category" text={category} /> : ''}
				{item.name ? <Label className="name" text={item.name} /> : ''}
				{item.description ? <Label className="descr" text={item.description} /> : ''}
				{item.video ? (
					<video 
						ref={node => this.video = node} 
						src={item.video} 
						onClick={e => this.onVideoClick(e, item.video)} 
						controls={false} 
						autoPlay={true} 
						loop={true} 
					/>
				) : ''}
				{withEmailForm ? (
					<EmailCollection onStepChange={position} onComplete={() => close()} />
				) : ''}

				<div className={[ 'bottom', withSteps ? 'withSteps' : '' ].join(' ')}>
					{withSteps ? (
						<div className="steps">
							{[ ...Array(l) ].map((e: number, i: number) => {
								const cn = [ 'step' ];
								if (i == current) {
									cn.push('active');
								};

								return <div key={i} className={cn.join(' ')} onClick={e => this.onClick(e, i)} />;
							})}
						</div>
					) : ''}
					
					{buttons.length ? (
						<div className="buttons">
							{buttons.map((button, i) => (
								<Button
									key={i}
									text={button.text}
									color={(i == buttons.length - 1) ? 'black' : 'blank'}
									className="c28"
									onClick={e => this.onButton(e, button.action)}
								/>
							))}
						</div>
					) : ''}
				</div>

				{showConfetti ? <ReactCanvasConfetti refConfetti={ins => this.confetti = ins} className="confettiCanvas" /> : ''}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.event();
		this.hideElements();
		this.initDimmer();

		U.Common.renderLinks($(this.node));
	};

	componentDidUpdate () {
		const { param, position } = this.props;
		const { data } = param;
		const { current } = data;
		const section = this.getSection();
		const { items, showConfetti } = section;
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

		if (showConfetti && (current == l - 1)) {
			this.confettiShot();
		};
	};

	componentWillUnmount(): void {
		this.unbind();
		this.clearDimmer();
		this.showElements();
	};

	showElements () {
		this.props.param.hiddenElements.forEach(el => $(el).removeClass('isOnboardingHidden'));
	};

	hideElements () {
		this.props.param.hiddenElements.forEach(el => $(el).addClass('isOnboardingHidden'));
	};

	initDimmer () {
		const { param } = this.props;
		const { data, highlightElements } = param;
		const section = this.getSection();
		const { current } = data;
		const { items } = section;
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
		};

		this.frame = raf(() => {
			highlightElements.forEach(selector => {
				$(selector).each((idx, el) => {
					const element = $(el);
					const clone = element.clone();
					const { top, left } = element.offset();
					const st = $(window).scrollTop();

					if (this.hiddenElement) {
						this.hiddenElement.css({ visibility: 'visible' });
						this.hiddenElement = null;
					};

					body.append(clone);
					U.Common.copyCss(element.get(0), clone.get(0));

					if (item.cloneElementClassName) {
						clone.addClass(item.cloneElementClassName);
					};

					this.hiddenElement = element;
					element.css({ visibility: 'hidden' });
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

		if (isPopup && container.length) {
			containerOffset = container.offset();
		};

		if (rect.y < 0) {
			rect.y -= rect.height + hh + containerOffset.top;
			container.scrollTop(top + rect.y);
		};
	};

	onKeyDown (e: any) {
		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => this.onArrow(e, pressed == 'arrowleft' ? -1 : 1));
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
		const { param, close } = this.props;
		const { data } = param;
		const { current } = data;
		const section = this.getSection();
		const { items } = section;

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
		const { items } = section;
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

	confettiShot () {
		this.confetti({ particleCount: 150, spread: 60, origin: { x: 0.5, y: 1 } });
	};

	getSection () {
		return Onboarding.getSection(this.props.param.data.key);
	};

});

export default MenuOnboarding;
