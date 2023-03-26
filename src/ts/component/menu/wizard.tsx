import * as React from 'react';
import $ from 'jquery';
import { Icon, Button } from 'Component';
import { I, Util, analytics, keyboard } from 'Lib';
import { menuStore } from 'Store';
import * as Docs from 'Docs';

import ReactCanvasConfetti from "react-canvas-confetti";

class MenuWizard extends React.Component<I.Menu> {

	node: any = null;
	confetti: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;
		const { items, category } = Docs.Help.Wizard[key] || {};
		const item = items[current];
		const { text } = item;
		const l = items.length;

		let buttons = [{ text: current == l - 1 ? 'Finish' : 'Next', action: 'next' }];

		if (item.buttons) {
			buttons = buttons.concat(item.buttons);
		};

		const Steps = () => (
			<div className="steps">
				{[ ...Array(l) ].map((e: number, i: number) => (
					<div 
						key={i}
						className={[ 'step', (i == current ? 'active' : 'step') ].join(' ')} 
						onClick={e => this.onClick(e, i)} 
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
				<div className="category">{category}</div>
				{
					text.map((e, i) => (
						<div className="descr" key={i} dangerouslySetInnerHTML={{ __html: e }} />
					))
				}

				{item.video ? <video src={item.video} autoPlay={true} loop={true} /> : ''}

				<div className="bottom">
					{l > 1 ? (
						<Steps />
					) : ''}
					<div className="buttons">
						{
							buttons.map((button, i) => (
								<Button
									key={i}
									text={button.text}
									className={['c28', i == buttons.length-1 ? 'black' : 'outlined'].join(' ')}
									onClick={(e: any) => { this.onButton(e, button.action); }}
								/>
							))
						}
					</div>
				</div>

				<ReactCanvasConfetti refConfetti={ins => this.confetti = ins} className="confettiCanvas" />
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
		const { items } = Docs.Help.Wizard[key] || {};
		const l = items.length;
		const node = $(this.node);
		
		if (data.onShow) {
			data.onShow();
			position();
		};

		this.rebind();

		Util.renderLinks(node);

		if (current == l-1) {
			this.fire();
		};
		// analytics.event('ScreenOnboarding');
	};

	fire () {
		this.confetti({
			particleCount: 150,
			spread: 60,
			origin: {
				x: .5,
				y: 1
			}
		});
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
				// process import button click
				break;
			};
		};
	};

	onArrow (e: any, dir: number) {
		const { data } = this.props.param;
		const { key, current } = data;
		const items = Docs.Help.Wizard[key].items;

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
		const { key } = data;
		const items = Docs.Help.Wizard[key].items;
		const item = items[next];

		if (!item) {
			return;
		};

		menuStore.open('wizard', {
			element: '#button-help',
			classNameWrap: 'fixed',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			offsetY: -4,
			onOpen: () => {
				if (onOpen) {
					onOpen();
				};
			},
			onClose: () => {
				if (onClose) {
					onClose();
				};
			},
			data: {
				...data,
				current: next,
			},
		});
	};

};

export default MenuWizard;
