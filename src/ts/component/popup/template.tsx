import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, ObjectPreviewBlock, Loader, Title, Label } from 'ts/component';
import { I, C, keyboard } from 'ts/lib';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	items: any[];
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class PopupTemplate extends React.Component<Props, State> {

	_isMounted: boolean = false;
	page: number = 0;
	n: number = 0;

	state = {
		items: [],
		loading: false,
	};

	render () {
		const { items, loading } = this.state;
		const isFirst = this.page == 0;
		const isLast = this.page == this.getMaxPage();

		if (loading) {
			return <Loader />;
		};

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
				onMouseLeave={(e: any) => { this.onMouseLeave(e, item); }}
				onClick={(e: any) => { this.onClick(e, item); }} 
			>
				<ObjectPreviewBlock rootId={item.id} />
				<div className="name">{item.templateName || `Template ${item.index + 1}`}</div>
			</div>
		);

		return (
			<div className="wrapper">
				<div className="head">
					<Title text="Choose a template" />
					<Label text="Type “Friend” has 3 templates, use ←→ to switch and ENTER to choose" />
				</div>

				<div id="scrollWrap" className="scrollWrap">
					<div id="scroll" className="scroll">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} index={i} />
						))}
					</div>

					<Icon id="arrowLeft" className={[ 'arrow', 'left', (isFirst ? 'dn' : '') ].join(' ')} onClick={() => { this.onArrow(-1); }} />
					<Icon id="arrowRight" className={[ 'arrow', 'right', (isLast ? 'dn' : '') ].join(' ')} onClick={() => { this.onArrow(1); }} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();

		window.setTimeout(() => {
			this.rebind();
		}, Constant.delay.popup + 100);
	};

	componentDidUpdate () {
		this.setActive();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		$(window).unbind('keyup.popupTemplate');
	};

	rebind () {
		this.unbind();
		$(window).on('keyup.popupTemplate', (e: any) => { this.onKeyUp(e); });
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: typeId },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		this.setState({ loading: true });
		C.ObjectSearch(filters, sorts, '', 0, 0, (message: any) => {
			this.setState({ loading: false, items: message.records });
		});
	};

	getMaxPage () {
		return Math.ceil(this.state.items.length / 2) - 1;
	};

	onKeyUp (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { items } = this.state;

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed == 'arrowleft' ? -1 : 1;
			this.n += dir;

			if (this.n < 0) {
				this.n = items.length - 1;
			};
			if (this.n > items.length - 1) {
				this.n = 0;
			};

			this.page = Math.floor(this.n / 2);
			this.onArrow(0);
			this.setActive();
		});

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			this.onClick(e, items[this.n]);
		});
	};

	onMouseEnter (e: any, item: any) {
		this.n = this.state.items.findIndex((it: any) => { return it.id == item.id; });
		this.setActive();
	};

	onMouseLeave (e: any, item: any) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');
	};

	setActive () {
		const { items } = this.state;
		const item = items[this.n];
		if (!item) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');
		node.find('#item-' + item.id).addClass('hover');
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		close();
		window.setTimeout(() => {
			if (onSelect) {
				onSelect(item.id);
			};
		}, Constant.delay.popup);
	};

	onArrow (dir: number) {
		const node = $(ReactDOM.findDOMNode(this));
		const wrap = node.find('#scrollWrap');
		const scroll = node.find('#scroll');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const w = wrap.width();
		const max = this.getMaxPage();

		this.page += dir;
		this.page = Math.min(max, Math.max(0, this.page));

		arrowLeft.removeClass('dn');
		arrowRight.removeClass('dn');

		if (this.page == 0) {
			arrowLeft.addClass('dn');
		};
		if (this.page == max) {
			arrowRight.addClass('dn');
		};

		let x = -this.page * (w + 16 - 128);

		scroll.css({ transform: `translate3d(${x}px,0px,0px` });
	};

};

export default PopupTemplate;
