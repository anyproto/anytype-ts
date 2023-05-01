import * as React from 'react';
import $ from 'jquery';
import * as Docs from 'Docs';
import { Button, Icon, Label } from 'Component';
import { I, Onboarding, Util, analytics, keyboard, Action, ObjectUtil } from 'Lib';
import { menuStore, popupStore } from 'Store';
import ReactCanvasConfetti from 'react-canvas-confetti';

interface State {
	error: { description: string, code: number };
};

class MenuOnboarding extends React.Component<I.Menu, State> {

	node: any = null;
	confetti: any = null;
	video: any = null;
	state = {
		error: null,
	};

	constructor (props: I.Menu) {
		super(props);

		this.onClose = this.onClose.bind(this);
		this.setError = this.setError.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;
		const section = Docs.Help.Onboarding[key] || {};
		const { items, category, showConfetti } = section;
		const item = items[current];
		const l = items.length;

		let buttons = [];

		if (!item.noButton) {
			buttons.push({ text: current == l - 1 ? 'Finish' : 'Next', action: 'next' });
		};

		if (item.buttons) {
			buttons = buttons.concat(item.buttons);
		};

		const Steps = () => (
			<div className="steps">
				{l > 1 ? (
					<React.Fragment>
						{[ ...Array(l) ].map((e: number, i: number) => {
							const cn = [ 'step' ];
							if (i == current) {
								cn.push('active');
							};

							return <div key={i} className={cn.join(' ')} onClick={e => this.onClick(e, i)} />;
						})}
					</React.Fragment>
				) : ''}
			</div>
		);

		const Buttons = () => (
			<div className="buttons">
				{buttons.map((button, i) => (
					<Button
						key={i}
						text={button.text}
						className={['c28', i == buttons.length-1 ? 'black' : 'blank'].join(' ')}
						onClick={(e: any) => { this.onButton(e, button.action); }}
					/>
				))}
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<Icon className="close" onClick={this.onClose} />

				{category ? <Label className="category" text={category} /> : ''}
				{item.name ? <Label className="name" text={item.name} /> : ''}
				{item.description ? <Label className="descr" text={item.description} /> : ''}
				{item.video ? <video ref={node => this.video = node} src={item.video} onClick={(e: any) => this.onVideoClick(e, item.video)} controls={false} autoPlay={true} loop={true} /> : ''}

				<div className="bottom">
					<Steps />
					<Buttons />
				</div>

				{showConfetti ? <ReactCanvasConfetti refConfetti={ins => this.confetti = ins} className="confettiCanvas" /> : ''}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		Util.renderLinks($(this.node));
	};

	componentDidUpdate () {
		const { param, position } = this.props;
		const { data } = param;
		const { key, current } = data;
		const section = Docs.Help.Onboarding[key] || {};
		const { items, showConfetti } = section;
		const l = items.length;
		const node = $(this.node);
		
		if (data.onShow) {
			data.onShow();
			position();
		};

		this.rebind();
		this.scroll();

		Util.renderLinks(node);
		analytics.event('ScreenOnboarding');

		if (showConfetti && (current == l - 1)) {
			this.confettiShot();
		};
	};

	onClose () {
		this.props.close();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	scroll () {
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

		if (!param.element) {
			return;
		};

		const container = Util.getScrollContainer(isPopup);
		const top = container.scrollTop();
		const element = $(param.element);

		if (!element.length) {
			return;
		};

		const rect = element.get(0).getBoundingClientRect() as DOMRect;
		const hh = Util.sizeHeader();

		let containerOffset = { top: 0, left: 0 };
		if (isPopup) {
			containerOffset = container.offset();
		};

		if (rect.y < 0) {
			rect.y -= rect.height + hh + containerOffset.top;
			container.scrollTop(top + rect.y);
		};
	};

	onKeyDown (e: any) {
		keyboard.shortcut('arrowleft', e, () => { this.onArrow(e, -1); });
		keyboard.shortcut('arrowright', e, () => { this.onArrow(e, 1); });
	};

	onButton (e: any, action: string) {
		switch (action) {
			case 'next': {
				this.onArrow(e, 1);
				break;
			};

			case 'import': {
				this.onImport();
				break;
			};

			case 'dashboard': {
				ObjectUtil.openHome('route');
				break;
			};
		};
	};

	onArrow (e: any, dir: number) {
		const { data } = this.props.param;
		const { key, current } = data;
		const items = Docs.Help.Onboarding[key].items;

		if ((dir < 0) && (current == 0)) {
			return;
		};

		if ((dir > 0) && (current == items.length - 1)) {
			this.onClose();
			return;
		};

		this.onClick(e, current + dir);
	};

	onClick (e: any, next: number) {
		const { data, onOpen, onClose } = this.props.param;
		const { key, isPopup, options } = data;
		const section = Docs.Help.Onboarding[key];
		const { items } = section;
		const item = items[next];

		if (!item) {
			return;
		};

		let param = Onboarding.getParam(section, item, isPopup);

		if (options.parseParam) {
			param = options.parseParam(param);
		};

		menuStore.open('onboarding', {
			...param,
			onOpen: () => {
				if (onOpen) {
					onOpen();
				};
				if (param.onOpen) {
					param.onOpen();
				};
			},
			onClose: () => {
				if (onClose) {
					onClose();
				};
				if (param.onClose) {
					param.onClose();
				};
			},
			data: {
				...data,
				...param.data,
				current: next,
			},
		});
	};

	onVideoClick (e: any, src: string) {
		Util.pauseMedia();

		popupStore.open('preview', { data: { src, type: I.FileType.Video },
			preventMenuClose: true,
			onClose: () => {
				if (this.video) {
					this.video.play();
				};
			}
		});
	};

	onImport () {
		popupStore.open('settings', { data: { page: 'importIndex' } });
		this.props.close();
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		popupStore.open('confirm', {
			data: {
				title: 'Error',
				text: error.description,
				textConfirm: 'Ok',
				canCancel: false,
			},
		});

		return true;
	};

	confettiShot () {
		this.confetti({ particleCount: 150, spread: 60, origin: { x: 0.5, y: 1 } });
	};

};

export default MenuOnboarding;
