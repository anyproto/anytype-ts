import * as React from 'react';
import $ from 'jquery';
import { PreviewObject, Icon } from 'Component';
import { I, UtilCommon, keyboard, translate } from 'Lib';

interface Props {
	offsetX: number;
	canAdd?: boolean;
	withBlank?: boolean;
	blankId?: string;
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
		const { onAdd, onBlank, onMenu, defaultId, blankId } = this.props;
		const items = this.getItems();

		const ItemAdd = () => (
			<div id="item-add" className="item add" onClick={onAdd}>
				<Icon className="plus" />
				<div className="hoverArea" />
			</div>
		);

		const ItemBlank = (item: any) => (
			<div id={`item-${item.id}`} className="previewObject blank" onClick={onBlank}>
				{onMenu ? (
					<div id={`item-more-${item.id}`} className="moreWrapper" onClick={e => onMenu(e, item)}>
						<Icon className="more" />
					</div>
				) : ''}

				<div className="scroller">
					<div className="heading">
						<div className="name">Blank</div>
					</div>
				</div>
				<div className="border" />
			</div>
		);

		const Item = (item: any) => {
			if (item.id == 'add') {
				return <ItemAdd />;
			};

			const cn = [ 'item' ];

			let label = null;
			let content = null;

			if (onMenu) {
				cn.push('withMenu');
			};

			if (defaultId == item.id) {
				label = <div className="defaultLabel">{translate('commonDefault')}</div>;
			};

			if (item.id == blankId) {
				content = <ItemBlank {...item} />;
			} else {
				content = (
					<PreviewObject
						ref={ref => this.refObj[item.id] = ref}
						size={I.PreviewSize.Large}
						rootId={item.id}
						onClick={e => this.onClick(e, item)}
						onMore={e => onMenu(e, item)}
					/>
				);
			};

			return (
				<div id={`item-${item.id}`} className={cn.join(' ')}>
					{label}

					<div
						className="hoverArea"
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onMouseLeave={e => this.onMouseLeave(e, item)}
					>
						{content}
					</div>
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className="listPreviewObject"
			>
				<div className="wrap">
					<div id="scroll" className="scroll">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} index={i} />
						))}
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

	getItems () {
		const { getItems, canAdd, withBlank, blankId } = this.props;
		const items = UtilCommon.objectCopy(getItems());

		if (withBlank) {
			items.unshift({ id: blankId });
		};
		if (canAdd) {
			items.push({ id: 'add' });
		};
		return items;
	};

	getMaxPage () {
		const node = $(this.node);
		const items = this.getItems();
		const cnt = Math.floor(node.width() / WIDTH);

		return Math.max(0, Math.ceil(items.length / cnt) - 1);
	};

	onMouseEnter (e: any, item: any) {
		const items = this.getItems();

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
		const items = this.getItems();
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
		const items = this.getItems();

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
