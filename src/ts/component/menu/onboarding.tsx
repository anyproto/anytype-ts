import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'Component';
import { I, Onboarding, Util, analytics, keyboard } from 'Lib';
import { menuStore } from 'Store';
import * as Docs from 'Docs';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuOnboarding extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClose = this.onClose.bind(this)
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;
		const items = Docs.Help.Onboarding[key];
		const item = items[current];
		const l = items.length;
		const cnl = [ 'arrow', 'left', (current == 0 ? 'disabled' : '') ];
		const cnr = [ 'arrow', 'right', (current == l - 1 ? 'disabled' : '') ];

		return (
			<div className="wrap">
				<div className="name"  dangerouslySetInnerHTML={{ __html: item.name }} />
				<div className="descr" dangerouslySetInnerHTML={{ __html: item.description }} />

				<Icon className="close" onClick={this.onClose} />

				{l > 1 ? (
					<div className="bottom">
						<Icon className={cnl.join(' ')} onClick={(e: any) => { this.onArrow(e, -1); }} />
						<div className="number">{current + 1} of {l}</div>
						<Icon className={cnr.join(' ')} onClick={(e: any) => { this.onArrow(e, 1); }} />
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		Util.renderLink($(ReactDOM.findDOMNode(this)));
	};

	componentDidUpdate () {
		const { param, position } = this.props;
		const { data } = param;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (data.onShow) {
			data.onShow();
			position();
		};

		this.rebind();
		this.scroll();

		Util.renderLink(node);
		analytics.event('ScreenOnboarding');
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

	onArrow (e: any, dir: number) {
		const { data, onOpen, onClose } = this.props.param;
		const { key, current, isPopup } = data;
		const items = Docs.Help.Onboarding[key];

		if (((dir < 0) && (current == 0)) || ((dir > 0) && (current == items.length - 1))) {
			return;
		};

		const next = current + dir;
		const item = items[next];

		if (!item) {
			return;
		};

		const param = Onboarding.getParam(item, isPopup);

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
