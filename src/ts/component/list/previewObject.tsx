import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PreviewObject, Icon } from 'ts/component';
import { keyboard, Action } from 'ts/lib';

interface Props {
	getItems: () => any[];
	offsetX: number;
	canAdd?: boolean;
	onClick?: (e: any, item: any) => void;
	onAdd?: (e: any) => void;
};

const $ = require('jquery');

const WIDTH = 344;

class ListObjectPreview extends React.Component<Props, {}> {

	public static defaultProps = {
		offsetX: 0,
		canAdd: false,
	};
	
	n: number = 0;
	page: number = 0;
	maxPage: number = 0;
	timeout: number = 0;
	refObj: any = {};

	render () {
		const { getItems, canAdd, onAdd } = this.props;
		const items = getItems();

		const Item = (item: any) => {
			return (
				<div 
					id={'item-' + item.id} 
					className="item" 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
					onMouseLeave={(e: any) => { this.onMouseLeave(e, item); }}
				>
					<PreviewObject 
						ref={(ref: any) => { this.refObj[item.id] = ref; }} 
						rootId={item.id} 
						onClick={(e: any) => { this.onClick(e, item); }} 
					/>
				</div>
			);
		};

		const ItemAdd = () => (
			<div className="item add" onClick={onAdd}>
				<Icon className="plus" />
			</div>
		);

		return (
			<div className="listPreviewObject">
				<div className="wrap">
					<div id="scroll" className="scroll">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} index={i} />
						))}
						{canAdd ? <ItemAdd /> : ''}
					</div>
				</div>

				<Icon id="arrowLeft" className="arrow left" onClick={() => { this.onArrow(-1); }} />
				<Icon id="arrowRight" className="arrow right" onClick={() => { this.onArrow(1); }} />	
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
		this.setActive();
	};

	getMaxPage () {
		const { getItems, canAdd } = this.props;
		const items = getItems();
		const length = items.length + (canAdd ? 1 : 0);
		const node = $(ReactDOM.findDOMNode(this));
		const cnt = Math.floor(node.width() / WIDTH);

		return Math.max(0, Math.ceil(length / cnt) - 1);
	};

	onMouseEnter (e: any, item: any) {
		const { getItems } = this.props;
		const items = getItems();

		this.n = items.findIndex((it: any) => { return it.id == item.id; });
		this.setActive();
	};

	onMouseLeave (e: any, item: any) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.item.hover').removeClass('hover');
	};

	onClick (e: any, item: any) {
		const { onClick } = this.props;
		if (onClick) {
			onClick(e, item);
		};
	};

	setActive () {
		const { getItems } = this.props;
		const items = getItems();
		const item = items[this.n];

		if (!item) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');
		node.find('#item-' + item.id).addClass('hover');
	};

	onKeyUp (e: any) {
		const { getItems } = this.props;
		const items = getItems();

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

	onArrow (dir: number) {
		const { offsetX } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('#scroll');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const w = node.width();
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

		let x = -this.page * (w + 16 + offsetX);

		scroll.css({ transform: `translate3d(${x}px,0px,0px` });
	};

	updateItem (id: string) {
		if (this.refObj[id]) {
			this.refObj[id].update();
		};
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const isFirst = this.page == 0;
		const isLast = this.page == this.getMaxPage();

		isFirst ? arrowLeft.addClass('dn') : arrowRight.removeClass('dn');
		isLast ? arrowRight.addClass('dn') : arrowRight.removeClass('dn');
	};
	
};

export default ListObjectPreview;