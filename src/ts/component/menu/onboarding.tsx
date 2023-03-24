import * as React from 'react';
import $ from 'jquery';
import { Icon } from 'Component';
import { I, Onboarding, Util, analytics, keyboard, Action, C, Renderer } from 'Lib';
import { menuStore } from 'Store';
import * as Docs from 'Docs';

class MenuOnboarding extends React.Component<I.Menu> {

	node: any = null;

	constructor (props: I.Menu) {
		super(props);

		this.onClose = this.onClose.bind(this)
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;
		const { items, category } = Docs.Help.Onboarding[key] || {};
		const item = items[current];
		const l = items.length;

		const Steps = () => (
			<div className="steps">
				{[...Array(l)].map((e, i) => {
					return <div className={i === current ? 'step active' : 'step'} onClick={(e: any) => { this.onClick(e, i)}} key={i} />
				})}
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="name" dangerouslySetInnerHTML={{ __html: item.name }} />
				<div className="descr" dangerouslySetInnerHTML={{ __html: item.description }} />

				<Icon className="close" onClick={this.onClose} />

				{l > 1 ? (
					<div className="bottom">
						<div>
							<Steps />
							{category ? (
								<div className="category">
									<b>Onboarding:</b> {category}
								</div>
							) : ''}
						</div>
						<div className="round" onClick={(e: any) => { this.onArrow(e, 1); }}>
							<Icon className={current == l - 1 ? 'tick' : 'arrow'} />
						</div>
					</div>
				) : ''}
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
		const node = $(this.node);
		
		if (data.onShow) {
			data.onShow();
			position();
		};

		this.rebind();
		this.scroll();

		Util.renderLinks(node);
		analytics.event('ScreenOnboarding');
	};

	onClose () {
		this.props.close();
	};

	rebind () {
		const node = $(this.node);
		const { param } = this.props;
		const { data } = param;
		const { isPopup } = data;

		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });

		node.find('#export').off('click').on('click', () => { 
			Action.openDir(paths => {
				C.AccountExport(paths[0], (message: any) => {
					if (!message.error.code) {
						Renderer.send('pathOpen', paths[0]);

						Onboarding.start('exportFinish', isPopup, true);
					};
				});
			});
		});

		node.find('#download').off('click').on('click', () => {
			Renderer.send('urlOpen', 'https://download.anytype.io/?ref=migration');
			Renderer.send('exit');
		});
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
		const items = Docs.Help.Onboarding[key].items;
		const item = items[next];

		if (!item) {
			return;
		};

		let param = Onboarding.getParam(item, isPopup);
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

};

export default MenuOnboarding;
