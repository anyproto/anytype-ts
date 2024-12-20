import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { PreviewObject, Icon } from 'Component';
import { I, U, keyboard, translate } from 'Lib';

interface Props {
	offsetX?: number;
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

interface ListPreviewObjectRefProps {
	updateItem: (id: string) => void;
	onKeyUp: (e: any) => void;
};

const WIDTH = 224;

const ListPreviewObject = forwardRef<ListPreviewObjectRefProps, Props>(({
	offsetX = 0,
	canAdd = false,
	withBlank = false,
	blankId = '',
	defaultId = '',
	getItems,
	onClick,
	onAdd,
	onBlank,
	onMenu,
}, ref) => {

	const nodeRef = useRef(null);
	const page = useRef(0);
	const n = useRef(0);
	const objectRef = useRef(new Map());

	const getItemsHandler = () => {
		const items = U.Common.objectCopy(getItems());

		if (withBlank) {
			items.unshift({ id: blankId });
		};
		if (canAdd) {
			items.push({ id: 'add' });
		};
		return items;
	};

	const getMaxPage = () => {
		const node = $(nodeRef.current);
		const items = getItemsHandler();
		const cnt = Math.floor(node.width() / WIDTH);

		return Math.max(0, Math.ceil(items.length / cnt) - 1);
	};

	const onMouseEnter = (e: any, item: any) => {
		const items = getItemsHandler();

		n.current = items.findIndex(it => it.id == item.id);
		setActive();
	};

	const onMouseLeave = (e: any, item: any) => {
		const node = $(nodeRef.current);

		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
	};

	const setActive = () => {
		const items = getItemsHandler();
		const item = items[n.current];

		if (!item) {
			return;
		};

		const node = $(nodeRef.current);

		node.find('.item.hover').removeClass('hover');
		node.find('.hoverArea.hover').removeClass('hover');
		node.find(`#item-${item.id}`).addClass('hover');
		node.find(`#item-${item.id} .hoverArea`).addClass('hover');
	};

	const onKeyUp = (e: any) => {
		const items = getItemsHandler();

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed == 'arrowleft' ? -1 : 1;
			n.current += dir;

			if (n.current < 0) {
				n.current = items.length - 1;
			};
			if (n.current > items.length - 1) {
				n.current = 0;
			};

			page.current = Math.floor(n.current / 2);
			onArrow(0);
			setActive();
		});

		keyboard.shortcut('enter, space', e, () => onClick(e, items[n.current]));
	};

	const onArrow = (dir: number) => {
		const node = $(nodeRef.current);
		const scroll = node.find('#scroll');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const w = node.width();
		const max = getMaxPage();

		page.current += dir;
		page.current = Math.min(max, Math.max(0, page.current));

		const x = -page.current * (w + 16 + offsetX);

		arrowLeft.removeClass('dn');
		arrowRight.removeClass('dn');

		if (page.current == 0) {
			arrowLeft.addClass('dn');
		};
		if (page.current == max) {
			arrowRight.addClass('dn');
		};

		scroll.css({ transform: `translate3d(${x}px,0px,0px` });
	};

	const updateItem = (id: string) => {
		objectRef.current.get(id)?.update();
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const isFirst = page.current == 0;
		const isLast = page.current == getMaxPage();

		arrowLeft.toggleClass('dn', isFirst);
		arrowRight.toggleClass('dn', isLast);
	};

	const items = getItemsHandler();

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
					<div className="name">{translate('commonBlank')}</div>
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
					ref={ref => objectRef.current.set(item.id, ref)}
					size={I.PreviewSize.Medium}
					rootId={item.id}
					onClick={e => onClick(e, item)}
					onMore={onMenu ? e => onMenu(e, item) : null}
				/>
			);
		};

		return (
			<div id={`item-${item.id}`} className={cn.join(' ')}>
				{label}

				<div
					className="hoverArea"
					onMouseEnter={e => onMouseEnter(e, item)}
					onMouseLeave={e => onMouseLeave(e, item)}
				>
					{content}
				</div>
			</div>
		);
	};

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		updateItem,
		onKeyUp
	}));

	return (
		<div 
			ref={nodeRef}
			className="listObjectPreview"
		>
			<div className="wrap">
				<div id="scroll" className="scroll">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
					))}
				</div>
			</div>

			<Icon id="arrowLeft" className="arrow left" onClick={() => onArrow(-1)} />
			<Icon id="arrowRight" className="arrow right" onClick={() => onArrow(1)} />	
		</div>
	);

});

export default ListPreviewObject;