import * as React from 'react';
import $ from 'jquery';
import { PreviewObject, Icon } from 'Component';
import { keyboard, translate } from 'Lib';
import Constant from 'json/constant.json';

interface Props {
	offsetX: number;
	canAdd?: boolean;
	withBlank?: boolean;
	defaultId?: string;
	getItems: () => any[];
	onClick?: (e: any, item: any) => void;
	onAdd?: (e: any) => void;
	onBlank?: (e: any) => void;
	onMenu?: (e: any, item: any) => void;
};

const WIDTH = 344;

class ListObjectPreview extends React.Component<Props> {

	public static defaultProps = {
		offsetX: 0,
		canAdd: false,
	};
	
	node: any = null;
	n = 0;
	page = 0;
	maxPage = 0;
	timeout = 0;
	refObj: any = {};

	render () {
		const { getItems, canAdd, onAdd, withBlank, onBlank, onMenu, defaultId } = this.props;
		const items = getItems();

		const DefaultLabel = (item: any) => {
			return defaultId == item.id ? <div className="defaultLabel">{translate('commonDefault')}</div> : null;
		};

		const Item = (item: any) => (
			<div id={`item-${item.id}`} className="item">
				<DefaultLabel id={item.id} />
				{onMenu ? <Icon className="more" onClick={e => onMenu(e, item)} /> : ''}

				<div
					className="hoverArea"
					onMouseEnter={e => this.onMouseEnter(e, item)}
					onMouseLeave={e => this.onMouseLeave(e, item)}
				>
					<PreviewObject
						ref={ref => this.refObj[item.id] = ref}
						rootId={item.id}
						onClick={e => this.onClick(e, item)}
					/>
				</div>
			</div>
		);

		const ItemBlank = () => {
			return (
				<div id={`item-${Constant.templateId.blank}`} className="item" onClick={onBlank}>
					<DefaultLabel id={Constant.templateId.blank} />

					{onMenu ? <Icon className="more" onClick={e => onMenu(e, { id: Constant.templateId.blank })} /> : ''}

					<div className="previewObject blank">
						<div className="scroller">
							<div className="heading">
								<div className="name">Blank</div>
							</div>
						</div>
						<div className="border" />
					</div>
				</div>
			);
		};

		const ItemAdd = () => (
			<div className="item add" onClick={onAdd}>
				<Icon className="plus" />
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="listPreviewObject"
			>
				<div className="wrap">
					<div id="scroll" className="scroll">
						{withBlank ? <ItemBlank /> : ''}
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} index={i} />
						))}
						{canAdd ? <ItemAdd /> : ''}
					</div>
				</div>

				<Icon id="arrowLeft" className="arrow left" onClick={() => this.onArrow(-1)} />
				<Icon id="arrowRight" className="arrow right" onClick={() => this.onArrow(1)} />	
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	getMaxPage () {
		const { getItems, canAdd, withBlank } = this.props;
		const node = $(this.node);
		const items = getItems();
		const cnt = Math.floor(node.width() / WIDTH);

		let length = items.length;
		if (withBlank) {
			length++;
		};
		if (canAdd) {
			length++;
		};
		return Math.max(0, Math.ceil(length / cnt) - 1);
	};

	onMouseEnter (e: any, item: any) {
		const { getItems } = this.props;
		const items = getItems();

		this.n = items.findIndex(it => it.id == item.id);
		this.setActive();
	};

	onMouseLeave (e: any, item: any) {
		const node = $(this.node);
		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
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

		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
		node.find(`#item-${item.id}`).addClass('hover');
		node.find(`#item-${item.id} .hoverArea`).addClass('hover');
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

		keyboard.shortcut('enter, space', e, () => {
			this.onClick(e, items[this.n]);
		});
	};

	onArrow (dir: number) {
		const { offsetX } = this.props;
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const w = node.width();
		const max = this.getMaxPage();

		this.page += dir;
		this.page = Math.min(max, Math.max(0, this.page));

		const x = -this.page * (w + 16 + offsetX);

		arrowLeft.removeClass('dn');
		arrowRight.removeClass('dn');

		if (this.page == 0) {
			arrowLeft.addClass('dn');
		};
		if (this.page == max) {
			arrowRight.addClass('dn');
		};

		scroll.css({ transform: `translate3d(${x}px,0px,0px` });
	};

	updateItem (id: string) {
		if (this.refObj[id]) {
			this.refObj[id].update();
		};
	};

	resize () {
		const node = $(this.node);
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const isFirst = this.page == 0;
		const isLast = this.page == this.getMaxPage();

		isFirst ? arrowLeft.addClass('dn') : arrowRight.removeClass('dn');
		isLast ? arrowRight.addClass('dn') : arrowRight.removeClass('dn');
	};
	
};

export default ListObjectPreview;